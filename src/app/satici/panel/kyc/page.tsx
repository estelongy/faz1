export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import KycForm from './KycForm'

export const metadata: Metadata = { title: 'KYC Onay — İş Ortağı' }

export default async function VendorKycPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin' || role === 'clinic') redirect(pathForRole(role))

  const { data: vendor } = await supabase
    .from('vendors')
    .select(`
      id, company_name, kyc_status, kyc_submitted_at, kyc_reviewed_at, kyc_review_note,
      tax_number, trade_registry_no, mersis_no, kep_address, company_address,
      sells_medical_products, iban, iban_holder_name, bank_name,
      tax_certificate_url, contract_signed_url, its_certificate_url
    `)
    .eq('user_id', user.id)
    .single()

  if (!vendor) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-white font-bold text-xl mb-2">İş Ortağı Hesabı Yok</h1>
          <p className="text-slate-400 text-sm mb-6">KYC için önce iş ortağı başvurusu yapmalısınız.</p>
          <Link href="/satici/basvur"
            className="px-6 py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] text-white font-semibold rounded-xl text-base">
            İş Ortağı Başvurusu Yap →
          </Link>
        </div>
      </main>
    )
  }

  const sp = await searchParams
  const justSubmitted = sp.ok === '1'

  // ── Onaylı durumda salt-okunur özet göster ──
  if (vendor.kyc_status === 'approved') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-200 p-4">
        <div className="max-w-2xl mx-auto py-12">
          <Link href="/satici/panel"
            className="inline-flex items-center gap-1.5 mb-6 text-slate-400 hover:text-white text-base font-semibold">
            ← İş Ortağı Paneli
          </Link>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
            <div className="text-5xl mb-4">✓</div>
            <h1 className="text-white font-bold text-2xl mb-2">KYC Onaylı</h1>
            <p className="text-emerald-300 text-sm">
              Bilgileriniz {vendor.kyc_reviewed_at ? new Date(vendor.kyc_reviewed_at).toLocaleDateString('tr-TR') : ''} tarihinde onaylandı.
            </p>
            <p className="text-slate-400 text-sm mt-4">
              KYC bilgilerini güncellemek için <a href="mailto:destek@estelongy.com" className="text-[#C9A961] hover:underline">destek@estelongy.com</a> adresinden iletişime geçin.
            </p>
          </div>
        </div>
      </main>
    )
  }

  // ── Pending → bekleme ekranı ──
  if (vendor.kyc_status === 'pending') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-200 p-4">
        <div className="max-w-2xl mx-auto py-12">
          <Link href="/satici/panel"
            className="inline-flex items-center gap-1.5 mb-6 text-slate-400 hover:text-white text-base font-semibold">
            ← İş Ortağı Paneli
          </Link>
          <div className="rounded-2xl border border-[#C9A961]/30 bg-[#C9A961]/10 p-8 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h1 className="text-white font-bold text-2xl mb-2">KYC İncelemede</h1>
            <p className="text-[#D4B872] text-sm">
              Bilgileriniz {vendor.kyc_submitted_at ? new Date(vendor.kyc_submitted_at).toLocaleDateString('tr-TR') : ''} tarihinde admin onayına gönderildi.
            </p>
            <p className="text-slate-400 text-sm mt-4">
              İnceleme genelde 1-2 iş günü sürer. Sonuç e-posta ile bildirilecek.
            </p>
          </div>
        </div>
      </main>
    )
  }

  // ── Rejected ya da not_submitted → form ──
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-200 p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div>
          <Link href="/satici/panel"
            className="inline-flex items-center gap-1.5 mb-4 text-slate-400 hover:text-white text-base font-semibold">
            ← İş Ortağı Paneli
          </Link>
          <h1 className="text-white font-bold text-2xl">İş Ortağı KYC Bilgileri</h1>
          <p className="text-slate-400 text-sm mt-1">
            Vergi mükellefi, banka ve sözleşme bilgilerinizi tamamlayın. Onay sonrası ürün satışına başlayabilirsiniz.
          </p>
        </div>

        {justSubmitted && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
            ✓ Bilgileriniz incelemeye alındı. Onay süreci 1-2 iş günü.
          </div>
        )}

        {vendor.kyc_status === 'rejected' && vendor.kyc_review_note && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            <p className="font-semibold mb-1">⚠ Önceki başvurunuz reddedildi</p>
            <p className="text-sm whitespace-pre-wrap">{vendor.kyc_review_note}</p>
            <p className="text-sm mt-2 text-red-200/80">Lütfen aşağıdaki bilgileri düzeltip tekrar gönderin.</p>
          </div>
        )}

        <KycForm
          vendorId={vendor.id}
          initial={{
            taxNumber: vendor.tax_number,
            tradeRegistryNo: vendor.trade_registry_no,
            mersisNo: vendor.mersis_no,
            kepAddress: vendor.kep_address,
            companyAddress: vendor.company_address,
            sellsMedicalProducts: vendor.sells_medical_products,
            iban: vendor.iban,
            ibanHolderName: vendor.iban_holder_name,
            bankName: vendor.bank_name,
            taxCertificatePath: vendor.tax_certificate_url,
            contractSignedPath: vendor.contract_signed_url,
            itsCertificatePath: vendor.its_certificate_url,
          }}
        />
      </div>
    </main>
  )
}
