'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type WishlistActionResult =
  | { ok: true; inWishlist: boolean }
  | { ok: false; error: string }

/** Favori ekle/çıkar — toggle. Giriş yapmamışsa redirect path döner. */
export async function toggleWishlistAction(productId: string): Promise<WishlistActionResult> {
  if (!productId) return { ok: false, error: 'Ürün bulunamadı.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Giriş yapmalısın.' }

  // Mevcut mu?
  const { data: existing } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('id', existing.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/panel/favorilerim')
    return { ok: true, inWishlist: false }
  }

  const { error } = await supabase
    .from('wishlists')
    .insert({ user_id: user.id, product_id: productId })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/panel/favorilerim')
  return { ok: true, inWishlist: true }
}

/** Favoriden sil — favorilerim sayfasından silmek için ayrı. */
export async function removeFromWishlistAction(productId: string): Promise<WishlistActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Giriş yapmalısın.' }

  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/panel/favorilerim')
  return { ok: true, inWishlist: false }
}
