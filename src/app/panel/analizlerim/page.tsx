export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import ScoreChart, { type ScorePoint } from '@/components/ScoreChart'
import ZiyaretKarti, { type ZiyaretItem, type ZiyaretAnalysis } from '@/components/ZiyaretKarti'

export const metadata: Metadata = {
  title: 'Analizlerim — Estelongy',
}

export default async function AnalizlerimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role && role !== 'user') redirect(pathForRole(role))

  // Tüm analizler
  const { data: allAnalysesRaw } = await supabase
    .from('analyses')
    .select('id, web_overall, temp_overall, final_overall, status, created_at, doctor_notes, doctor_approved_scores, web_scores, appointment_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(60)

  // Tüm randevular (zaman çizelgesi için)
  const { data: allAppointmentsRaw } = await supabase
    .from('appointments')
    .select('id, appointment_date, status, notes, clinic_notes, procedure_notes, recommendations, created_at, clinics(name)')
    .eq('user_id', user.id)
    .order('appointment_date', { ascending: false })
    .limit(60)

  // Skor grafiği için noktalar
  const chartPoints: ScorePoint[] = (allAnalysesRaw ?? []).flatMap(a => {
    const pts: ScorePoint[] = []
    const aiScore = a.web_overall ?? a.temp_overall
    if (aiScore != null) pts.push({ date: a.created_at, score: aiScore, type: 'ai_analiz' })
    if (a.final_overall != null) pts.push({ date: a.created_at, score: a.final_overall, type: 'klinik_onayli' })
    return pts
  })

  // Ziyaret zaman çizelgesi: randevu ↔ analiz eşleştirme
  const analysesByAppt = new Map<string, NonNullable<typeof allAnalysesRaw>[number]>()
  const looseAnalyses: NonNullable<typeof allAnalysesRaw> = []
  ;(allAnalysesRaw ?? []).forEach(a => {
    if (a.appointment_id) analysesByAppt.set(a.appointment_id, a)
    else looseAnalyses.push(a)
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
  const selfItems: ZiyaretItem[] = looseAnalyses.map(a => ({
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
    isActive: false,
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
          <Link href="/panel" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Panel
          </Link>
          <span className="text-white font-bold text-sm">Analizlerim</span>
          <Link href="/analiz" className="text-violet-400 hover:text-violet-300 text-sm">+ Yeni</Link>
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
              <h2 className="text-white font-bold text-lg">Ziyaret & Ölçüm Geçmişi</h2>
              <span className="text-slate-500 text-xs">{timeline.length} kayıt</span>
            </div>
            <p className="text-slate-500 text-sm px-1 -mt-2">
              Klinik ziyaretleriniz, yapılan işlemler, hekim önerileri ve her ziyarette alınan ölçüm sonuçları
            </p>
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
