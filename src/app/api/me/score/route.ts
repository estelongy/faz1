import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Oturumlu kullanıcının Gençlik Skoru — AppHome halkası + zaman çizgisi için.
 *
 * Döner:
 *  - score:   en güncel aktif skor (final ?? temp ?? web), 0–100 yuvarlı | null
 *  - status:  en güncel analiz durumu | null
 *  - delta:   en güncel skor − bir önceki ölçüm (1 ondalık) | null  → "+6" rozeti
 *  - history: son ≤6 analiz, yeniden eskiye [{ id, at, score, kind }]
 *
 * Skor yoksa (anonim ya da hiç analiz yapmamış) score=null; AppHome "?" davetini
 * gösterir. Sahte skor YOK.
 *
 * Kaynak: analyses.final_overall ?? temp_overall ?? web_overall (0–100).
 */

type AnalysisRow = {
  id: string
  created_at: string
  web_overall: number | null
  temp_overall: number | null
  final_overall: number | null
  status: string | null
}

// Bir analizin aktif skoru ve "tür"ü (rozet/renk için)
function activeScore(a: AnalysisRow): number | null {
  return a.final_overall ?? a.temp_overall ?? a.web_overall
}
function scoreKind(a: AnalysisRow): 'final' | 'temp' | 'web' | null {
  if (a.final_overall != null) return 'final'
  if (a.temp_overall != null) return 'temp'
  if (a.web_overall != null) return 'web'
  return null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      return NextResponse.json({ score: null, delta: null, status: null, history: [], loggedIn: false })
    }

    const { data: rows } = await supabase
      .from('analyses')
      .select('id, created_at, web_overall, temp_overall, final_overall, status')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(6)

    const list = (rows ?? []) as AnalysisRow[]
    const latest = list[0] ?? null

    const rawLatest = latest ? activeScore(latest) : null
    const score = typeof rawLatest === 'number' ? Math.round(rawLatest) : null

    // history: skoru olan analizler, yeniden eskiye
    const history = list
      .map(a => {
        const s = activeScore(a)
        return s == null
          ? null
          : { id: a.id, at: a.created_at, score: Math.round(s), kind: scoreKind(a) }
      })
      .filter(Boolean)

    // delta: en güncel skor − bir önceki ölçüm (skoru olan ilk iki kayıt)
    let delta: number | null = null
    if (history.length >= 2) {
      const cur = history[0]!.score
      const prev = history[1]!.score
      delta = Math.round((cur - prev) * 10) / 10
    }

    // Aşama (başrol öneri motoru için) — panel nextAction ile aynı mantık:
    //  none → hiç skor yok · web → ön analiz · temp → anket yapıldı · final → klinik onaylı
    const stage: 'none' | 'web' | 'temp' | 'final' =
      latest == null
        ? 'none'
        : latest.final_overall != null
          ? 'final'
          : latest.temp_overall != null
            ? 'temp'
            : latest.web_overall != null
              ? 'web'
              : 'none'

    // Aktif randevu var mı (temp aşamasında "randevu al" yerine "randevuna git" demek için)
    const { data: appt } = await supabase
      .from('appointments')
      .select('id')
      .eq('user_id', auth.user.id)
      .in('status', ['pending', 'confirmed', 'in_progress'])
      .order('appointment_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      score,
      delta,
      status: latest?.status ?? null,
      stage,
      hasActiveAppt: appt != null,
      latestAnalysisId: latest?.id ?? null,
      history,
      loggedIn: true,
    })
  } catch {
    return NextResponse.json({ score: null, delta: null, status: null, history: [], loggedIn: false })
  }
}
