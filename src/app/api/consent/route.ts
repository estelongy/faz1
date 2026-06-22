/**
 * Açık rıza işlemleri: GET (durum sorgu) ve POST (kayıt).
 *
 * GET  ?scope=selfie_ai_analiz → { granted: boolean, version: string }
 * POST { scope, granted }      → { ok: true }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  CONSENT_SCOPES,
  type ConsentScope,
  hasActiveConsent,
  recordConsent,
  getClientIpFromHeaders,
} from '@/lib/consent'

function parseScope(input: unknown): ConsentScope | null {
  if (typeof input !== 'string') return null
  return (input in CONSENT_SCOPES) ? (input as ConsentScope) : null
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Oturum açık değil' }, { status: 401 })

  const scope = parseScope(req.nextUrl.searchParams.get('scope'))
  if (!scope) return NextResponse.json({ error: 'Geçersiz kapsam' }, { status: 400 })

  const granted = await hasActiveConsent(user.id, scope)
  return NextResponse.json({ granted, version: CONSENT_SCOPES[scope] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Oturum açık değil' }, { status: 401 })

  let body: { scope?: unknown; granted?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 })
  }

  const scope = parseScope(body.scope)
  if (!scope) return NextResponse.json({ error: 'Geçersiz kapsam' }, { status: 400 })
  if (typeof body.granted !== 'boolean') {
    return NextResponse.json({ error: 'granted boolean olmalı' }, { status: 400 })
  }

  const result = await recordConsent(user.id, scope, body.granted, {
    ip: getClientIpFromHeaders(req.headers),
    userAgent: req.headers.get('user-agent'),
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
