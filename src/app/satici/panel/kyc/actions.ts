'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface KycSubmitResult {
  ok: boolean
  error?: string
}

interface KycPayload {
  // Kurumsal kimlik
  taxNumber: string
  tradeRegistryNo: string
  mersisNo: string
  kepAddress: string
  companyAddress: string
  sellsMedicalProducts: boolean
  // Banka
  iban: string
  ibanHolderName: string
  bankName: string
  // Belgeler (storage path'leri — frontend yüklemeyi tamamladıktan sonra path gönderir)
  taxCertificatePath: string
  contractSignedPath: string | null
  itsCertificatePath: string | null
  // Sözleşme onayı (e-onay yeterli)
  contractAccepted: boolean
}

const IBAN_RE = /^TR\d{24}$/
const TAX_NO_RE = /^\d{10,11}$/
const KEP_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function submitKycAction(payload: KycPayload): Promise<KycSubmitResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }

  // Vendor kaydı
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, kyc_status, tax_number')
    .eq('user_id', user.id)
    .single()
  if (!vendor) return { ok: false, error: 'İş Ortağı kaydı bulunamadı. Önce başvuru yapın.' }
  if (vendor.kyc_status === 'approved') return { ok: false, error: 'KYC zaten onaylı.' }

  // ── Validasyon ──
  if (!payload.contractAccepted) {
    return { ok: false, error: 'Pazaryeri sözleşmesini kabul etmelisiniz.' }
  }

  const taxNumber = (payload.taxNumber || '').trim()
  if (!TAX_NO_RE.test(taxNumber)) {
    return { ok: false, error: 'Vergi/T.C. numarası 10 veya 11 haneli olmalı.' }
  }

  const iban = (payload.iban || '').replace(/\s+/g, '').toUpperCase()
  if (!IBAN_RE.test(iban)) {
    return { ok: false, error: 'IBAN geçersiz. TR ile başlayan 26 karakter olmalı.' }
  }
  const ibanHolder = (payload.ibanHolderName || '').trim()
  if (ibanHolder.length < 3) return { ok: false, error: 'IBAN sahibi adı zorunludur.' }
  const bankName = (payload.bankName || '').trim()
  if (bankName.length < 2) return { ok: false, error: 'Banka adı zorunludur.' }

  const kep = (payload.kepAddress || '').trim().toLowerCase()
  if (!KEP_RE.test(kep)) return { ok: false, error: 'KEP adresi geçersiz.' }

  const companyAddress = (payload.companyAddress || '').trim()
  if (companyAddress.length < 10) return { ok: false, error: 'Şirket adresi en az 10 karakter olmalı.' }

  if (!payload.taxCertificatePath || !payload.taxCertificatePath.startsWith(`${vendor.id}/`)) {
    return { ok: false, error: 'Vergi levhası belgesi yüklenmedi veya dosya yolu geçersiz.' }
  }

  if (payload.sellsMedicalProducts) {
    if (!payload.itsCertificatePath || !payload.itsCertificatePath.startsWith(`${vendor.id}/`)) {
      return { ok: false, error: 'Tıbbi ürün iş ortakları için ITS belgesi zorunludur.' }
    }
  }

  // ── DB güncelle ──
  const { error: updateErr } = await supabase
    .from('vendors')
    .update({
      tax_number: taxNumber,
      trade_registry_no: payload.tradeRegistryNo?.trim() || null,
      mersis_no: payload.mersisNo?.trim() || null,
      kep_address: kep,
      company_address: companyAddress,
      sells_medical_products: !!payload.sellsMedicalProducts,
      iban,
      iban_holder_name: ibanHolder,
      bank_name: bankName,
      tax_certificate_url: payload.taxCertificatePath,
      contract_signed_url: payload.contractSignedPath || null,
      its_certificate_url: payload.itsCertificatePath || null,
      contract_signed_at: new Date().toISOString(),
      kyc_status: 'pending',
      kyc_submitted_at: new Date().toISOString(),
    })
    .eq('id', vendor.id)

  if (updateErr) return { ok: false, error: updateErr.message }

  revalidatePath('/satici/panel')
  revalidatePath('/satici/panel/kyc')
  return { ok: true }
}

export async function goToKycAction() {
  redirect('/satici/panel/kyc')
}
