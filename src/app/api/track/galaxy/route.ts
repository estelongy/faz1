import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { galaxyTrackLimit } from '@/lib/redis'

/**
 * Galaksi ziyaret/dönüş sinyali — beachhead "intrinsic pull" ölçümü.
 *
 * KVKK-temiz: IP ve user-agent SAKLANMAZ. visitor_id anonim, first-party,
 * httpOnly çerez (eg_vid) — yalnız "diğerleri olmasa da geri dönen var mı"
 * sorusunu yanıtlamak için kullanılır, üçüncü parti paylaşımı yoktur.
 * Insert service_role ile (galaxy_events RLS açık, public policy yok).
 */

const GALAXIES = ['biyoage', 'esteklinik', 'estestore'] as const
type Galaxy = (typeof GALAXIES)[number]

const VISITOR_COOKIE = 'eg_vid'
const VISITOR_MAXAGE = 60 * 60 * 24 * 365 // 1 yıl

export async function POST(req: NextRequest) {
  let body: { galaxy?: unknown; event?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const galaxy = body.galaxy
  if (typeof galaxy !== 'string' || !GALAXIES.includes(galaxy as Galaxy)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const eventType =
    typeof body.event === 'string' && body.event.length > 0 && body.event.length <= 40
      ? body.event
      : 'visit'

  const jar = await cookies()
  let visitorId = jar.get(VISITOR_COOKIE)?.value
  let mustSetCookie = false
  if (!visitorId || visitorId.length < 8 || visitorId.length > 64) {
    visitorId = crypto.randomUUID()
    mustSetCookie = true
  }

  // Abuse koruması — visitor başına dakikada 20 beacon
  const { success } = await galaxyTrackLimit.limit(visitorId)
  if (!success) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  // Oturum açıksa user_id (FK, PII değil). Anonim ise null.
  let userId: string | null = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    userId = data.user?.id ?? null
  } catch {
    /* anon — sorun değil */
  }

  // Fire-and-forget: kayıt hatası kullanıcı akışını bozmaz
  try {
    const admin = createServiceClient()
    await admin.from('galaxy_events').insert({
      galaxy,
      event_type: eventType,
      user_id: userId,
      visitor_id: visitorId,
    })
  } catch {
    /* yut */
  }

  const res = NextResponse.json({ ok: true })
  if (mustSetCookie) {
    res.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge: VISITOR_MAXAGE,
      path: '/',
    })
  }
  return res
}
