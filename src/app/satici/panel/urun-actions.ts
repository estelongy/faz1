'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Ortak: yetki + vendor + ürün ownership kontrolü
async function assertOwnership(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role !== 'vendor') return { ok: false as const, error: 'Satıcı yetkisi gerekli.' }

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, approval_status')
    .eq('user_id', user.id)
    .single()
  if (!vendor) return { ok: false as const, error: 'Satıcı kaydı bulunamadı.' }
  if (vendor.approval_status !== 'approved') return { ok: false as const, error: 'Hesabınız onaylı değil.' }

  const { data: product } = await supabase
    .from('products')
    .select('id, vendor_id, images')
    .eq('id', productId)
    .eq('vendor_id', vendor.id)
    .single()
  if (!product) return { ok: false as const, error: 'Ürün bulunamadı veya size ait değil.' }

  return { ok: true as const, supabase, vendor, product }
}

export async function urunSilAction(productId: string): Promise<{ ok: boolean; error?: string }> {
  const check = await assertOwnership(productId)
  if (!check.ok) return { ok: false, error: check.error }
  const { supabase, product } = check

  // Storage'daki görselleri temizle
  if (Array.isArray(product.images) && product.images.length > 0) {
    const paths = product.images
      .map((url: string) => {
        const marker = '/product-images/'
        const idx = url.indexOf(marker)
        return idx >= 0 ? url.slice(idx + marker.length) : null
      })
      .filter((p): p is string => p !== null)
    if (paths.length > 0) {
      await supabase.storage.from('product-images').remove(paths)
    }
  }

  const { error } = await supabase.from('products').delete().eq('id', productId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/satici/panel')
  revalidatePath('/satici/panel/urunler')
  return { ok: true }
}

export type UrunGuncelleInput = {
  id: string
  name?: string
  category?: string
  description?: string
  price?: number | null
  stock?: number | null
  ingredients?: string[]
  images?: string[]
  is_active?: boolean
}

export async function urunGuncelleAction(input: UrunGuncelleInput): Promise<{ ok: boolean; error?: string }> {
  const check = await assertOwnership(input.id)
  if (!check.ok) return { ok: false, error: check.error }
  const { supabase } = check

  const patch: Record<string, unknown> = {}
  if (input.name !== undefined)        patch.name = input.name.trim()
  if (input.category !== undefined)    patch.category = input.category
  if (input.description !== undefined) patch.description = input.description.trim() || null
  if (input.price !== undefined)       patch.price = input.price
  if (input.stock !== undefined)       patch.stock = input.stock
  if (input.ingredients !== undefined) patch.ingredients = input.ingredients.length > 0 ? input.ingredients : null
  if (input.images !== undefined)      patch.images = input.images.length > 0 ? input.images : null
  if (input.is_active !== undefined)   patch.is_active = input.is_active

  if (Object.keys(patch).length === 0) return { ok: true }

  // Satıcı değiştirince yeniden onaya düşsün (kritik alanlar değiştiyse)
  const contentChanged = ['name','category','description','images','ingredients'].some(k => k in patch)
  if (contentChanged) {
    patch.approval_status = 'pending'
    patch.is_active = false
  }

  const { error } = await supabase.from('products').update(patch).eq('id', input.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/satici/panel')
  revalidatePath('/satici/panel/urunler')
  revalidatePath(`/satici/panel/urunler/${input.id}/duzenle`)
  return { ok: true }
}
