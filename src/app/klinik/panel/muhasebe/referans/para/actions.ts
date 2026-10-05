'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getKlinikStaff } from '@/lib/muhasebe-owner'

type Sonuc = { ok: true } | { ok: false; error: string }

/**
 * Referansöre ödeme kaydı. Ledger yalnızca eklenir — ödeme NEGATİF satırdır,
 * mevcut hakediş satırına dokunulmaz.
 */
export async function odemeYaz(formData: FormData): Promise<Sonuc> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const staff = getKlinikStaff(user?.id)
  if (!user || !staff) return { ok: false, error: 'Yetkisiz' }

  const referrerId = (formData.get('referrer_id') as string | null)?.trim()
  if (!referrerId) return { ok: false, error: 'Referansör seçilmedi.' }

  const tutar = Number(String(formData.get('tutar') ?? '').replace(',', '.'))
  if (!Number.isFinite(tutar) || tutar <= 0) {
    return { ok: false, error: 'Geçerli bir tutar girin.' }
  }

  const aciklama = ((formData.get('aciklama') as string) ?? '').trim() || null

  const { error } = await supabase.from('referral_ledger').insert({
    owner_id: staff.clinicOwnerId,
    referrer_id: referrerId,
    tur: 'odeme',
    tutar: -Math.abs(tutar),   // ödeme bakiyeyi düşürür
    aciklama,
    created_by: user.id,
  })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/klinik/panel/muhasebe/referans/para')
  return { ok: true }
}
