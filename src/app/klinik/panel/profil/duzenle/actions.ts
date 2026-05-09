'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { CLINIC_TYPES } from '@/lib/randevu-filters'

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

export interface UpdateClinicResult {
  ok: boolean
  error?: string
}

/**
 * Verilen File'ı Supabase Storage'a yükler ve public URL döndürür.
 * - bucket: clinic-images (public read)
 * - path: <clinicId>/<kind>-<timestamp>.<ext>
 * - service role kullanır (RLS bypass) — sahip kontrolü zaten action içinde yapılmış oluyor.
 */
async function uploadClinicImage(
  file: File,
  clinicId: string,
  kind: 'logo' | 'cover',
): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED_IMAGE_MIME.includes(file.type)) {
    return { error: 'Desteklenmeyen dosya türü. Sadece JPG, PNG veya WebP kabul edilir.' }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: 'Dosya çok büyük (max 5 MB).' }
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${clinicId}/${kind}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const admin = createServiceClient()
  const { error: upErr } = await admin.storage
    .from('clinic-images')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
      cacheControl: '3600',
    })
  if (upErr) {
    return { error: 'Dosya yüklenemedi: ' + upErr.message }
  }

  const { data } = admin.storage.from('clinic-images').getPublicUrl(path)
  return { url: data.publicUrl }
}

export async function updateClinicProfileAction(formData: FormData): Promise<UpdateClinicResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum bulunamadı.' }

  // Mevcut klinik kaydı (user_id eşleşmesi)
  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, logo_url, cover_image_url')
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
  if (clinic_type && !CLINIC_TYPES.includes(clinic_type)) {
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

  // === Görsel yükleme ===
  // FormData'dan logo + cover File alanlarını kontrol et. Boyutu 0 olan dosyalar (= seçilmemiş) atlanır.
  const logoFile = formData.get('logo') as File | null
  const coverFile = formData.get('cover_image') as File | null
  const removeLogo = formData.get('remove_logo') === '1'
  const removeCover = formData.get('remove_cover') === '1'

  if (logoFile && logoFile.size > 0) {
    const res = await uploadClinicImage(logoFile, clinic.id as string, 'logo')
    if ('error' in res) return { ok: false, error: res.error }
    update.logo_url = res.url
  } else if (removeLogo) {
    update.logo_url = null
  }

  if (coverFile && coverFile.size > 0) {
    const res = await uploadClinicImage(coverFile, clinic.id as string, 'cover')
    if ('error' in res) return { ok: false, error: res.error }
    update.cover_image_url = res.url
  } else if (removeCover) {
    update.cover_image_url = null
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
