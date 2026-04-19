import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/panel'

  // Open redirect önleme: next sadece kendi domain'imize izin ver
  const safePath = next.startsWith('/') && !next.startsWith('//') ? next : '/panel'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Şifre sıfırlama akışı → update-password sayfasına yönlendir
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/update-password`)
      }
      // Rol bazlı yönlendirme
      const { data: { user } } = await supabase.auth.getUser()
      const role = (user?.app_metadata as Record<string, string>)?.role
      if (role === 'admin') return NextResponse.redirect(`${origin}/admin`)
      if (role === 'clinic') return NextResponse.redirect(`${origin}/klinik/panel`)
      if (role === 'vendor') return NextResponse.redirect(`${origin}/satici/panel`)
      // Rol yoksa (yeni kayıt, pending vb.) → next param veya /panel
      return NextResponse.redirect(`${origin}${safePath}`)
    }
  }

  return NextResponse.redirect(`${origin}/giris?error=auth`)
}
