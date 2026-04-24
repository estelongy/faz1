import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/** Email'le hesap var mı kontrol et. Şifre/hassas veri dönmez — sadece {exists}. */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email gerekli' }, { status: 400 })
    }

    const admin = createServiceClient()

    // Supabase admin.listUsers: tüm kullanıcıları sayfa sayfa döner; filter yok.
    // Küçük ölçek için sayfalama yapıp email match ararız.
    // Tipik listele 100 kullanıcı/sayfa. 10+ sayfa büyümeden alternatif lazım olur.
    let exists = false
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 })
      if (error) break
      const users = data?.users ?? []
      if (users.some(u => u.email?.toLowerCase() === email.toLowerCase())) {
        exists = true
        break
      }
      if (users.length < 100) break // son sayfa
    }

    return NextResponse.json({ exists })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Hata' },
      { status: 500 },
    )
  }
}
