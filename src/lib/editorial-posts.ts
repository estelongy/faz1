/**
 * Editöryel İçerik — admin tarafından girilen post'lar
 *
 * Kategoriler:
 * - akademi  → Akademi Vitrini kartı
 * - duyuru   → Estelongy Duyuruları kartı
 * - topluluk → Topluluk Pulse kartı
 * - bilim    → Bilimsel Haber Akışı kartı
 * - resmi    → Resmi Duyurular kartı
 * - sosyal   → Sosyal Medya Akışı kartı
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type PostCategory = 'akademi' | 'duyuru' | 'topluluk' | 'bilim' | 'resmi' | 'sosyal'

export interface EditorialPost {
  id: string
  category: PostCategory
  title: string
  excerpt: string | null
  body: string | null
  image_url: string | null
  external_url: string | null
  published_at: string
}

export type PostsByCategory = Partial<Record<PostCategory, EditorialPost[]>>

/**
 * Tüm yayımlanmış postları kategori bazında grupla.
 * Her kategori için son N post döner (default 3).
 */
export async function fetchEditorialPosts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  perCategory = 3,
): Promise<PostsByCategory> {
  const { data, error } = await supabase
    .from('editorial_posts')
    .select('id, category, title, excerpt, body, image_url, external_url, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(50)

  if (error || !data) return {}

  const grouped: PostsByCategory = {}
  for (const post of data as EditorialPost[]) {
    if (!grouped[post.category]) grouped[post.category] = []
    if (grouped[post.category]!.length < perCategory) {
      grouped[post.category]!.push(post)
    }
  }
  return grouped
}
