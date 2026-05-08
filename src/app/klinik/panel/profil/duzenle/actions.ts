'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = ['estetik', 'dermatoloji', 'sac_ekimi', 'lazer', 'longevity', 'diger'] as const

export interface UpdateClinicResult {
  ok: boolean
  error?: string
}

export async function updateClinicProfileAction(formData: FormData): Promise<UpdateClinicResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum bulunamadı.' }

  // Mevcut klinik kaydı (user_id eşleşmesi)
  const { data: clinic } = await supabase
    .from('clinics')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!clinic) return { ok: false, error: 'Klinik kaydı bulunamadı.' }

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const location = (formData.get('location') as string | null)?.trim() ?? ''
  const clinic_type = (formData.get('clinic_type') as string | null)?.trim() ?? ''
  const bio = (formData.get('bio') as string | null)?.trim() ?? ''
  const phone = (formData.get('phone') as string | null)?.trim() ?? ''
  const specialtiesRaw = (formData.get('specialties') as string | null)?.trim() ?? ''

  // Validasyon
  if (name.length < 2) return { ok: false, error: 'Klinik adı en az 2 karakter olmalı.' }
  if (name.length > 120) return { ok: false, error: 'Klinik adı çok uzun (max 120).' }
  if (bio.length > 2000) return { ok: false, error: 'Hakkında metni çok uzun (max 2000 karakter).' }
  if (location.length > 200) return { ok: false, error: 'Konum çok uzun.' }
  if (clinic_type && !ALLOWED_TYPES.includes(clinic_type as typeof ALLOWED_TYPES[number])) {
    return { ok: false, error: 'Geçersiz klinik tipi.' }
  }

  // Specialties: virgül ile ayrılmış, trim, max 12 etiket, her biri max 40 karakter
  const specialties = specialtiesRaw
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length <= 40)
    .slice(0, 12)

  const update: Record<string, unknown> = {
    name,
    location: location || null,
    bio: bio || null,
    phone: phone || null,
    clinic_type: clinic_type || null,
    specialties: specialties.length > 0 ? specialties : null,
  }

  const { error } = await supabase
    .from('clinics')
    .update(update)
    .eq('id', clinic.id)

  if (error) {
    return { ok: false, error: 'Profil güncellenemedi: ' + error.message }
  }

  revalidatePath('/klinik/panel/profil')
  revalidatePath('/klinik/panel/profil/duzenle')
  revalidatePath(`/klinik/${clinic.id}`)
  revalidatePath('/klinikler')
  revalidatePath('/randevu')
  return { ok: true }
}
