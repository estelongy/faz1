export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import ScoreChart, { type ScorePoint } from '@/components/ScoreChart'
import ZiyaretKarti, { type ZiyaretItem, type ZiyaretAnalysis } from '@/components/ZiyaretKarti'

export const metadata: Metadata = {
  title: 'Geçmişim — Estelongy',
}

export default async function AnalizlerimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role && role !== 'user') redirect(pathForRole(role))

  // Aktif journey id (badge için)
  const { data: activeJourneyRow } = await supabase
    .from('journeys')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const activeJourneyId = activeJourneyRow?.id ?? null

  // Tüm analizler — journey_id dahil, yeniden eskiye
  const { data: allAnalysesRaw } = await supabase
    .from('analyses')
    .select('id, web_overall, temp_overall, final_overall, status, created_at, doctor_notes, doctor_approved_scores, web_scores, appointment_id, journey_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Tüm randevular (zaman çizelgesi için)
  const { data: allAppointmentsRaw } = await supabase
    .from('appointments')
    .select('id, appointment_date, status, notes, clinic_notes, procedure_notes, recommendations, created_at, clinics(name)')
    .eq('user_id', user.id)
    .order('appointment_date', { ascending: false })
    .limit(60)

  // Skor grafiği — sadece en son analiz per journey + klinik onaylılar
  // (allAnalysesRaw yeniden eskiye sıralı; journey'i birden çok temsil etmesin)
  const seenJourneysForChart = new Set<string>()
  const chartPoints: ScorePoint[] = (allAnalysesRaw ?? []).flatMap(a => {
    const pts: ScorePoint[] = []
    // Klinik onaylı skoru her zaman ekle
    if (a.final_overall != null) pts.push({ date: a.created_at, score: a.final_overall, type: 'klinik_onayli' })
    // Ön analiz: journey başına sadece en yeni (ilk görülen)
    const aiScore = a.web_overall ?? a.temp_overall
    if (aiScore != null) {
      const jKey = a.journey_id ?? a.id // journey yoksa kendisi unique
      if (!seenJourneysForChart.has(jKey)) {
        seenJourneysForChart.add(jKey)
        pts.push({ date: a.created_at, score: aiScore, type: 'ai_analiz' })
      }
    }
    return pts
  })

  // Ziyaret zaman çizelgesi: randevu ↔ analiz eşleştirme
  const analysesByAppt = new Map<string, NonNullable<typeof allAnalysesRaw>[number]>()
  const looseAnalyses: NonNullable<typeof allAnalysesRaw> = []
  ;(allAnalysesRaw ?? []).forEach(a => {
    if (a.appointment_id) analysesByAppt.set(a.appointment_id, a)
    else looseAnalyses.push(a)
  })

  // Journey dedup: aynı journey_id'ye sahip analizlerde sadece en yenisini göster
  // (allAnalysesRaw yeniden eskiye sıralı — ilk görülen zaten en yeni)
  const seenJourneys = new Set<string>()
  const deduplicatedLoose = looseAnalyses.filter(a => {
    if (!a.journey_id) return true // journey_id yok = legacy, hepsini göster
    if (seenJourneys.has(a.journey_id)) return false
    seenJourneys.add(a.journey_id)
    return true
  })

  type RawA = NonNullable<typeof allAnalysesRaw>[number]
  const toZA = (a: RawA): ZiyaretAnalysis => ({
    id: a.id,
    web_overall: a.web_overall,
    temp_overall: a.temp_overall,
    final_overall: a.final_overall,
    status: a.status,
    created_at: a.created_at,
    doctor_notes: a.doctor_notes,
    doctor_approved_scores: (a.doctor_approved_scores ?? null) as ZiyaretAnalysis['doctor_approved_scores'],
    web_scores: (a.web_scores ?? null) as Record<string, number> | null,
  })
  const visitItems: ZiyaretItem[] = (allAppointmentsRaw ?? []).map(apt => {
    const a = analysesByAppt.get(apt.id) ?? null
    return {
      kind: 'visit' as const,
      id: apt.id,
      date: apt.appointment_date ?? apt.created_at,
      status: apt.status,
      reasonNote: apt.notes ?? null,
      clinicNote: apt.clinic_notes ?? null,
      procedureNotes: apt.procedure_notes ?? null,
      recommendations: apt.recommendations ?? null,
      analysis: a ? toZA(a) : null,
      scoreDelta: null,
      appointmentId: apt.id,
      isActive: ['pending', 'confirmed', 'in_progress'].includes(apt.status),
      userId: user.id,
    }
  })
  const selfItems: ZiyaretItem[] = deduplicatedLoose.map(a => ({
    kind: 'self_analysis' as const,
    id: a.id,
    date: a.created_at,
    status: a.status ?? '',
    reasonNote: null,
    clinicNote: null,
    procedureNotes: null,
    recommendations: null,
    analysis: toZA(a),
    scoreDelta: null,
    appointmentId: null,
    // Aktif journey'e ait analiz → mor kenarlık
    isActive: activeJourneyId != null && a.journey_id === activeJourneyId,
    userId: user.id,
  }))
  const timeline: ZiyaretItem[] = [...visitItems, ...selfItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
  // Skor farkı: kronolojik (eski→yeni)
  {
    let prev: number | null = null
    for (const it of [...timeline].reverse()) {
      const cur = it.analysis?.final_overall ?? it.analysis?.web_overall ?? it.analysis?.temp_overall ?? null
      if (prev != null && cur != null) it.scoreDelta = Math.round((cur - prev) * 10) / 10
      if (cur != null) prev = cur
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/panel" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 hover:bg-slate-800/40 text-slate-300 hover:text-white text-sm font-medium transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Panel
          </Link>
          <span className="text-white font-bold text-sm">Geçmişim</span>
          <Link href="/analiz" className="inline-flex items-center px-3 py-1.5 rounded-lg border border-violet-500/30 hover:border-violet-400 hover:bg-violet-500/10 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">+ Yeni</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16 space-y-6">

        {/* Skor Geçmişi Grafiği */}
        {chartPoints.length > 0 && (
          <section className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Skor Geçmişi</h2>
              <span className="text-xs text-slate-500">{chartPoints.length} veri noktası</span>
            </div>
            <ScoreChart points={chartPoints} />
          </section>
        )}

        {/* Ziyaret & Ölçüm Zaman Çizelgesi */}
        {timeline.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-white font-bold text-lg">Tüm Yolculuklarım</h2>
              <span className="text-slate-500 text-xs">{timeline.length} kayıt</span>
            </div>
            <p className="text-slate-500 text-sm px-1 -mt-2">
              Selfie analizleri, klinik ziyaretleri ve hekim onaylı süreçler — tek yerde
            </p>
            {/* Aktif yolculuk varsa küçük bilgi notu */}
            {activeJourneyId && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/8 border border-violet-500/20 text-violet-400 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shrink-0" />
                Mor kenarlıklı kart aktif yolculuğun — kaldığın yerden devam edebilirsin
              </div>
            )}
            {timeline.map(item => (
              <ZiyaretKarti
                key={`${item.kind}-${item.id}`}
                item={item}
                editable={false}
              />
            ))}
          </section>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center mb-4 text-4xl">📊</div>
            <p className="text-white font-semibold mb-2">Henüz analiziniz yok</p>
            <p className="text-slate-400 text-sm mb-5">Selfie ile gençlik skorunuzu ölçün</p>
            <Link href="/analiz" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl">
              Analizi Başlat →
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
