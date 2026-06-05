import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Global çıkış endpoint'i — server'da cookie'leri temizler, ana sayfaya
 * yönlendirir. App'te sidebar drawer'ından (klinik/satıcı) çağrılır;
 * web layout'ları kendi `'use server'` form action'larını kullanır.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // Relatif redirect — istek hangi origin'den geldiyse oraya dön (Capacitor
  // Vercel preview, web prod, vb). NEXT_PUBLIC_SITE_URL ile cross-origin
  // bounce yapmıyoruz.
  return NextResponse.redirect(new URL('/', req.url), { status: 303 })
}
