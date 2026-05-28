'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface BrandingForm {
  logo_url: string | null
  banner_url: string | null
  tagline: string
  about_text: string
  social_links: {
    instagram?: string
    website?: string
    youtube?: string
    twitter?: string
    tiktok?: string
  }
}

export type BrandingResult =
  | { ok: true }
  | { ok: false; error: string }

function cleanUrl(s?: string): string | undefined {
  if (!s) return undefined
  const t = s.trim()
  if (!t) return undefined
  // Tek başına alan adı verirsen otomatik https://
  if (!/^https?:\/\//i.test(t)) return `https://${t}`
  return t
}

export async function saveVendorBrandingAction(form: BrandingForm): Promise<BrandingResult> {
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
    return { ok: false, error: 'Satıcı hesabın henüz onaylanmadı.' }
  }

  const social = {
    instagram: cleanUrl(form.social_links?.instagram),
    website:   cleanUrl(form.social_links?.website),
    youtube:   cleanUrl(form.social_links?.youtube),
    twitter:   cleanUrl(form.social_links?.twitter),
    tiktok:    cleanUrl(form.social_links?.tiktok),
  }
  // Boş değerleri sil
  Object.keys(social).forEach(k => {
    if (!social[k as keyof typeof social]) delete social[k as keyof typeof social]
  })

  const { error } = await supabase
    .from('vendors')
    .update({
      logo_url:              form.logo_url || null,
      banner_url:            form.banner_url || null,
      tagline:               form.tagline?.trim()?.slice(0, 120) || null,
      about_text:            form.about_text?.trim()?.slice(0, 2000) || null,
      social_links:          social,
      storefront_updated_at: new Date().toISOString(),
    })
    .eq('id', vendor.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/satici/panel/magaza')
  revalidatePath(`/estestore/satici/${vendor.id}`)
  return { ok: true }
}
