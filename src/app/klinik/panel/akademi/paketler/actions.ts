'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { slugifyTitle } from '@/lib/akademi'

/**
 * Erişim kontrolü — kullanıcının kendi onaylı eğitmen kliniği var mı?
 * Yoksa /klinik/panel'e geri at.
 */
async function requireEducatorClinic() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, is_educator, approval_status, user_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!clinic || clinic.approval_status !== 'approved' || !clinic.is_educator) {
    redirect('/klinik/panel')
  }

  return { supabase, clinic }
}

// =============================================
// PAKET CRUD
// =============================================

export async function createPackage(formData: FormData) {
  const { supabase, clinic } = await requireEducatorClinic()

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const category = (formData.get('category') as string) || null
  const level = (formData.get('level') as string) || 'beginner'
  const priceRaw = formData.get('price') as string
  const price = parseFloat(priceRaw)
  const coverImageUrl = (formData.get('cover_image_url') as string)?.trim() || null

  if (!title || title.length < 3) throw new Error('Başlık en az 3 karakter olmalıdır.')
  if (isNaN(price) || price < 0) throw new Error('Geçerli bir fiyat girin.')

  // Slug — title bazlı, çakışırsa rastgele suffix
  let slug = slugifyTitle(title)
  if (!slug) slug = 'paket-' + Math.random().toString(36).slice(2, 8)
  const { data: existing } = await supabase
    .from('course_packages')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`

  const { data: created, error } = await supabase
    .from('course_packages')
    .insert({
      clinic_id: clinic.id,
      title,
      slug,
      description,
      category,
      level,
      price,
      cover_image_url: coverImageUrl,
      currency: 'TRY',
      is_published: false,
    })
    .select('id')
    .single()

  if (error || !created) throw new Error(error?.message || 'Paket oluşturulamadı.')

  revalidatePath('/klinik/panel/akademi/paketler')
  redirect(`/klinik/panel/akademi/paketler/${created.id}`)
}

export async function updatePackage(formData: FormData) {
  const { supabase, clinic } = await requireEducatorClinic()
  const id = formData.get('id') as string
  if (!id) throw new Error('Paket ID eksik.')

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const category = (formData.get('category') as string) || null
  const level = (formData.get('level') as string) || 'beginner'
  const priceRaw = formData.get('price') as string
  const price = parseFloat(priceRaw)
  const coverImageUrl = (formData.get('cover_image_url') as string)?.trim() || null

  if (!title || title.length < 3) throw new Error('Başlık en az 3 karakter olmalıdır.')
  if (isNaN(price) || price < 0) throw new Error('Geçerli bir fiyat girin.')

  const { error, data } = await supabase
    .from('course_packages')
    .update({ title, description, category, level, price, cover_image_url: coverImageUrl })
    .eq('id', id)
    .eq('clinic_id', clinic.id)
    .select('id')

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('Paket bulunamadı veya yetkiniz yok.')

  revalidatePath('/klinik/panel/akademi/paketler')
  revalidatePath(`/klinik/panel/akademi/paketler/${id}`)
}

export async function togglePublishPackage(formData: FormData) {
  const { supabase, clinic } = await requireEducatorClinic()
  const id = formData.get('id') as string
  const publish = formData.get('publish') === 'true'

  // Yayına almak için en az 1 video olmalı
  if (publish) {
    const { count } = await supabase
      .from('course_videos')
      .select('id', { count: 'exact', head: true })
      .eq('package_id', id)
    if (!count || count < 1) {
      throw new Error('Yayına almak için en az 1 video eklemelisiniz.')
    }
  }

  const { error, data } = await supabase
    .from('course_packages')
    .update({
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .eq('clinic_id', clinic.id)
    .select('id')

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('Paket bulunamadı.')

  revalidatePath('/klinik/panel/akademi/paketler')
  revalidatePath(`/klinik/panel/akademi/paketler/${id}`)
}

export async function deletePackage(formData: FormData) {
  const { supabase, clinic } = await requireEducatorClinic()
  const id = formData.get('id') as string

  // Satılmış paket silinemez (refund logic karmaşıklaşır)
  const { count } = await supabase
    .from('course_purchases')
    .select('id', { count: 'exact', head: true })
    .eq('package_id', id)
    .eq('status', 'paid')
  if (count && count > 0) {
    throw new Error('Bu paket satılmış — silmek yerine yayından kaldırın.')
  }

  const { error } = await supabase
    .from('course_packages')
    .delete()
    .eq('id', id)
    .eq('clinic_id', clinic.id)

  if (error) throw new Error(error.message)

  revalidatePath('/klinik/panel/akademi/paketler')
  redirect('/klinik/panel/akademi/paketler')
}

// =============================================
// VIDEO CRUD
// =============================================

export async function addVideo(formData: FormData) {
  const { supabase, clinic } = await requireEducatorClinic()
  const packageId = formData.get('package_id') as string
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const streamUid = (formData.get('stream_uid') as string)?.trim() || null
  const durationRaw = formData.get('duration_seconds') as string
  const duration = durationRaw ? parseInt(durationRaw) : 0
  const isPreview = formData.get('is_preview') === 'on'

  if (!packageId) throw new Error('Paket ID eksik.')
  if (!title) throw new Error('Video başlığı zorunlu.')

  // Paket'in bu kliniğe ait olduğunu doğrula
  const { data: pkg } = await supabase
    .from('course_packages')
    .select('id')
    .eq('id', packageId)
    .eq('clinic_id', clinic.id)
    .maybeSingle()
  if (!pkg) throw new Error('Paket bulunamadı veya yetkiniz yok.')

  // En son sort_order'ı bul
  const { data: lastVideo } = await supabase
    .from('course_videos')
    .select('sort_order')
    .eq('package_id', packageId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextOrder = (lastVideo?.sort_order ?? -1) + 1

  const { error } = await supabase.from('course_videos').insert({
    package_id: packageId,
    title,
    description,
    stream_uid: streamUid,
    stream_status: streamUid ? 'ready' : 'pending',
    duration_seconds: duration,
    sort_order: nextOrder,
    is_preview: isPreview,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/klinik/panel/akademi/paketler/${packageId}`)
}

export async function updateVideo(formData: FormData) {
  const { supabase, clinic } = await requireEducatorClinic()
  const id = formData.get('id') as string
  const packageId = formData.get('package_id') as string
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const streamUid = (formData.get('stream_uid') as string)?.trim() || null
  const durationRaw = formData.get('duration_seconds') as string
  const duration = durationRaw ? parseInt(durationRaw) : 0
  const isPreview = formData.get('is_preview') === 'on'

  if (!id) throw new Error('Video ID eksik.')

  // Paket sahibi mi?
  const { data: pkg } = await supabase
    .from('course_packages')
    .select('id')
    .eq('id', packageId)
    .eq('clinic_id', clinic.id)
    .maybeSingle()
  if (!pkg) throw new Error('Paket bulunamadı veya yetkiniz yok.')

  const { error } = await supabase
    .from('course_videos')
    .update({
      title,
      description,
      stream_uid: streamUid,
      stream_status: streamUid ? 'ready' : 'pending',
      duration_seconds: duration,
      is_preview: isPreview,
    })
    .eq('id', id)
    .eq('package_id', packageId)

  if (error) throw new Error(error.message)
  revalidatePath(`/klinik/panel/akademi/paketler/${packageId}`)
}

export async function deleteVideo(formData: FormData) {
  const { supabase, clinic } = await requireEducatorClinic()
  const id = formData.get('id') as string
  const packageId = formData.get('package_id') as string

  const { data: pkg } = await supabase
    .from('course_packages')
    .select('id')
    .eq('id', packageId)
    .eq('clinic_id', clinic.id)
    .maybeSingle()
  if (!pkg) throw new Error('Paket bulunamadı veya yetkiniz yok.')

  const { error } = await supabase
    .from('course_videos')
    .delete()
    .eq('id', id)
    .eq('package_id', packageId)

  if (error) throw new Error(error.message)
  revalidatePath(`/klinik/panel/akademi/paketler/${packageId}`)
}
