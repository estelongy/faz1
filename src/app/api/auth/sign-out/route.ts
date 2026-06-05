import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Global çıkış endpoint'i — server'da cookie'leri temizler, ana sayfaya
 * yönlendirir. App'te sidebar drawer'ından (klinik/satıcı) çağrılır;
 * web layout'ları kendi `'use server'` form action'larını kullanır.
 */
export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL ?? 'https://estelongy.com'), { status: 303 })
}
