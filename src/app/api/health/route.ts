import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Liveness + readiness endpoint — uptime monitoring servisleri (Better Uptime,
 * UptimeRobot, Pingdom) buradan tarar.
 *
 * 200 → healthy
 * 503 → degraded (DB unreachable)
 *
 * KVKK güvenlik logu içermez; hiçbir kullanıcı verisi sızdırmaz.
 */
export async function GET() {
  const started = Date.now()
  const checks: Record<string, { ok: boolean; ms?: number; error?: string }> = {}

  // DB ping — basit count(*) (RLS bypass için service client; consent_logs ufak tablo)
  try {
    const t = Date.now()
    const admin = createServiceClient()
    const { error } = await admin
      .from('consent_logs')
      .select('id', { count: 'exact', head: true })
      .limit(1)
    if (error) throw new Error(error.message)
    checks.db = { ok: true, ms: Date.now() - t }
  } catch (e) {
    checks.db = { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }

  const allOk = Object.values(checks).every(c => c.ok)
  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      time: new Date().toISOString(),
      uptime_ms: Date.now() - started,
      checks,
      // Versiyon bilgisi (Vercel sağlar)
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? null,
      env: process.env.VERCEL_ENV ?? 'unknown',
    },
    { status: allOk ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  )
}
