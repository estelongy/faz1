export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import IcerikYonetim from './IcerikYonetim'

export const metadata: Metadata = {
  title: 'İçerik Yönetimi',
}

export type PostCategory = 'akademi' | 'duyuru' | 'topluluk' | 'bilim' | 'resmi' | 'sosyal'

export interface AdminPost {
  id: string
  category: PostCategory
  title: string
  excerpt: string | null
  body: string | null
  image_url: string | null
  external_url: string | null
  is_published: boolean
  published_at: string
  created_at: string
}

// ─── Server Actions ─────────────────────────────────────────────────

async function createPost(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || (user.app_metadata as Record<string, string>)?.role !== 'admin') return

  const category   = formData.get('category') as PostCategory
  const title      = (formData.get('title') as string)?.trim()
  const excerpt    = (formData.get('excerpt') as string)?.trim() || null
  const body       = (formData.get('body') as string)?.trim() || null
  const externalUrl= (formData.get('external_url') as string)?.trim() || null
  const imageUrl   = (formData.get('image_url') as string)?.trim() || null

  if (!category || !title) return

  await supabase.from('editorial_posts').insert({
    category,
    title,
    excerpt,
    body,
    image_url: imageUrl,
    external_url: externalUrl,
    is_published: true,
    created_by: user.id,
  })

  redirect('/admin/icerik')
}

async function togglePublish(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || (user.app_metadata as Record<string, string>)?.role !== 'admin') return

  const id = formData.get('id') as string
  const next = formData.get('next') === '1'
  await supabase.from('editorial_posts').update({ is_published: next }).eq('id', id)
  redirect('/admin/icerik')
}

async function deletePost(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || (user.app_metadata as Record<string, string>)?.role !== 'admin') return

  const id = formData.get('id') as string
  await supabase.from('editorial_posts').delete().eq('id', id)
  redirect('/admin/icerik')
}

// ─── Page ───────────────────────────────────────────────────────────

export default async function AdminIcerikPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if ((user.app_metadata as Record<string, string>)?.role !== 'admin') redirect('/panel')

  const { data: posts } = await supabase
    .from('editorial_posts')
    .select('id, category, title, excerpt, body, image_url, external_url, is_published, published_at, created_at')
    .order('published_at', { ascending: false })
    .limit(200)

  return (
    <IcerikYonetim
      posts={(posts ?? []) as AdminPost[]}
      createAction={createPost}
      toggleAction={togglePublish}
      deleteAction={deletePost}
    />
  )
}
