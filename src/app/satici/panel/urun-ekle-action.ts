'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  validatePricingTiers,
  type EsteStoreCategory,
  type PricingTiers,
} from '@/lib/estestore'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export type UrunEkleInput = {
  name: string
  category: EsteStoreCategory
  subcategory?: string
  treatmentType: 'product' | 'treatment'
  description?: string
  price?: number | null
  ingredients?: string[]
  images?: string[]
  pricingTiers?: PricingTiers
}

async function getMinKozmetikDiscount(): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'min_professional_discount_kozmetik')
    .maybeSingle()
  const v = data?.value as number | string | undefined
  const num = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(num) && num > 0 ? num : 0.1
}

export async function urunEkleAction(input: UrunEkleInput): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role !== 'vendor') return { ok: false, error: 'Satıcı yetkisi gerekli.' }

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, approval_status')
    .eq('user_id', user.id)
    .single()
  if (!vendor) return { ok: false, error: 'Satıcı kaydı bulunamadı.' }
  if (vendor.approval_status !== 'approved') return { ok: false, error: 'Satıcı hesabınız onaylı değil.' }

  if (!input.name?.trim()) return { ok: false, error: 'Ürün adı zorunludur.' }
  if (input.category !== 'kozmetik' && input.category !== 'sarf_medikal') {
    return { ok: false, error: 'Geçersiz kategori.' }
  }

  // Tier validasyonu (varsa)
  let tiers: PricingTiers = []
  if (input.pricingTiers && input.pricingTiers.length > 0) {
    const minDiscount = await getMinKozmetikDiscount()
    const errs = validatePricingTiers(input.pricingTiers, input.category, minDiscount)
    if (errs.length > 0) {
      return { ok: false, error: errs.map(e => e.message).join(' · ') }
    }
    tiers = input.pricingTiers
  }

  const baseSlug = slugify(input.name)
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`

  const cover = input.images && input.images.length > 0 ? input.images[0] : null

  const { error: insertErr } = await supabase.from('products').insert({
    vendor_id:       vendor.id,
    name:            input.name.trim(),
    slug,
    category:        input.category,
    subcategory:     input.subcategory?.trim() || null,
    treatment_type:  input.treatmentType,
    description:     input.description?.trim() || null,
    price:           input.price ?? null,
    ingredients:     input.ingredients && input.ingredients.length > 0 ? input.ingredients : null,
    images:          input.images && input.images.length > 0 ? input.images : null,
    cover_image_url: cover,
    pricing_tiers:   tiers,
    is_active:       false,
    approval_status: 'pending',
  })

  if (insertErr) return { ok: false, error: insertErr.message }

  revalidatePath('/satici/panel')
  revalidatePath('/estestore')
  return { ok: true }
}
