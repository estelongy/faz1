/**
 * Wishlist helper — server-side.
 *
 * Bir kullanıcının favori ürünlerini Set olarak döner.
 * ProductCard'lara `inWishlist={set.has(p.id)}` geçmek için.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export async function getUserWishlistSet(
  supabase: SupabaseClient,
  userId: string | null | undefined,
): Promise<Set<string>> {
  if (!userId) return new Set()
  const { data } = await supabase
    .from('wishlists')
    .select('product_id')
    .eq('user_id', userId)
  return new Set((data ?? []).map(r => r.product_id as string))
}
