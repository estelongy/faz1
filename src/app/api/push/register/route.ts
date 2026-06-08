/**
 * POST /api/push/register
 *
 * Capacitor PushNotifications plugin'i 'registration' event'inde
 * aldığı FCM token'ı buraya gönderir. DB'ye upsert eder.
 *
 * Body: { fcm_token: string, flavor: Flavor, platform: 'android'|'ios'|'web', device_info?: object }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFlavor } from '@/components/native/flavor-detect'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const b = body as { fcm_token?: unknown; flavor?: unknown; platform?: unknown; device_info?: unknown }
  const fcmToken = typeof b.fcm_token === 'string' ? b.fcm_token.trim() : ''
  const flavor = typeof b.flavor === 'string' ? b.flavor : ''
  const platform = typeof b.platform === 'string' ? b.platform : ''

  if (!fcmToken || fcmToken.length < 20) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
  }
  if (!isFlavor(flavor)) {
    return NextResponse.json({ error: 'invalid_flavor' }, { status: 400 })
  }
  if (!['android', 'ios', 'web'].includes(platform)) {
    return NextResponse.json({ error: 'invalid_platform' }, { status: 400 })
  }

  const { error } = await supabase
    .from('device_push_tokens')
    .upsert(
      {
        user_id: user.id,
        flavor,
        platform,
        fcm_token: fcmToken,
        device_info: (b.device_info as object | undefined) ?? null,
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,flavor,fcm_token' },
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
