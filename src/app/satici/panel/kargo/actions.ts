'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const CARRIERS_VALID = [
  'Yurtiçi Kargo', 'Aras Kargo', 'MNG Kargo', 'PTT Kargo',
  'Sürat Kargo', 'HepsiJet', 'Trendyol Express', 'Diğer',
]

export interface ShippingSettingsForm {
  sender_name: string
  sender_phone: string
  sender_email?: string
  sender_address_line: string
  sender_district: string
  sender_city: string
  sender_postal_code?: string
  default_carrier: string
  preferred_carriers: string[]
  free_shipping_threshold?: number | null
  note?: string
}

export type ShippingSettingsResult =
  | { ok: true }
  | { ok: false; error: string }

export async function saveShippingSettingsAction(
  form: ShippingSettingsForm,
): Promise<ShippingSettingsResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, approval_status')
    .eq('user_id', user.id)
    .single()
  if (!vendor) return { ok: false, error: 'Satıcı kaydı bulunamadı.' }
  if (vendor.approval_status !== 'approved') {
    return { ok: false, error: 'Satıcı hesabınız henüz onaylanmadı.' }
  }

  // Doğrulama — server-of-truth (client validation bypass edilse de burada kesilir)
  if (!form.sender_name?.trim())          return { ok: false, error: 'Gönderici adı zorunlu.' }
  if (!form.sender_phone?.trim())         return { ok: false, error: 'Telefon zorunlu.' }
  if (!form.sender_address_line?.trim())  return { ok: false, error: 'Adres zorunlu.' }
  if (!form.sender_district?.trim())      return { ok: false, error: 'İlçe zorunlu.' }
  if (!form.sender_city?.trim())          return { ok: false, error: 'İl zorunlu.' }

  // sender_email: kargo şirketi etiket maili + iade kargo iletişimi için zorunlu
  const email = form.sender_email?.trim() ?? ''
  if (!email) return { ok: false, error: 'Gönderici e-posta zorunlu — iade kargosu ve etiket bildirimi için kullanılır.' }
  // Basit RFC-lite kontrolü — boşluksuz, en az bir @, en az bir nokta
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Geçerli bir e-posta gir.' }

  // sender_postal_code: kargo etiketinde zorunlu (Türkiye 5 hane)
  const postal = form.sender_postal_code?.trim() ?? ''
  if (!postal) return { ok: false, error: 'Posta kodu zorunlu — kargo etiketi olmadan basılamaz.' }
  if (!/^\d{5}$/.test(postal)) return { ok: false, error: 'Posta kodu 5 haneli sayı olmalı (ör. 34000).' }

  const cleanCarrier = CARRIERS_VALID.includes(form.default_carrier)
    ? form.default_carrier
    : 'Yurtiçi Kargo'
  const cleanPreferred = (form.preferred_carriers ?? [])
    .filter(c => CARRIERS_VALID.includes(c))
  const finalPreferred = cleanPreferred.length > 0
    ? cleanPreferred
    : [cleanCarrier]

  const { error } = await supabase
    .from('vendor_shipping_settings')
    .upsert({
      vendor_id:                vendor.id,
      sender_name:              form.sender_name.trim(),
      sender_phone:             form.sender_phone.trim(),
      sender_email:             email,
      sender_address_line:      form.sender_address_line.trim(),
      sender_district:          form.sender_district.trim(),
      sender_city:              form.sender_city.trim(),
      sender_postal_code:       postal,
      default_carrier:          cleanCarrier,
      preferred_carriers:       finalPreferred,
      free_shipping_threshold:  form.free_shipping_threshold ?? null,
      note:                     form.note?.trim() || null,
    }, { onConflict: 'vendor_id' })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/satici/panel/kargo')
  revalidatePath('/satici/panel/siparisler')
  return { ok: true }
}

