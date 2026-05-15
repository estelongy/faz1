export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import ScoreChart, { type ScorePoint } from '@/components/ScoreChart'
import YolculukKarti, { type YolculukView, type YolculukAnalysis, type YolculukAppointment } from '@/components/YolculukKarti'
import GecmisTabs from '@/components/GecmisTabs'

export const metadata: Metadata = {
  title: 'Geçmişim — Estelongy',
}

export default async function GecmisimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role && role !== 'user') redirect(pathForRole(role))

  // ─── Son 10 yolculuk ──────────────────────────────────────────
  const { data: journeysRaw } = await supabase
    .from('journeys')
    .select('id, status, started_at, completed_at, appointment_id')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(10)

  const journeyIds = (journeysRaw ?? []).map(j => j.id)
  const apptIds = (journeysRaw ?? []).map(j => j.appointment_id).filter(Boolean) as string[]

  // İlgili tüm analizleri çek
  const { data: analysesRaw } = journeyIds.length > 0
    ? await supabase
        .from('analyses')
        .select('id, journey_id, appointment_id, web_overall, temp_overall, final_overall, web_scores, doctor_notes, doctor_approved_scores, created_at')
        .eq('user_id', user.id)
        .in('journey_id', journeyIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  // İlgili appointment'ları çek
  const { data: apptsRaw } = apptIds.length > 0
    ? await supabase
        .from('appointments')
        .select('id, appointment_date, status, completed_at, notes, clinic_notes, procedure_notes, recommendations, clinics(name)')
        .in('id', apptIds)
    : { data: [] }

  const apptsById = new Map<string, NonNullable<typeof apptsRaw>[number]>()
  ;(apptsRaw ?? []).forEach(a => apptsById.set(a.id, a))

  // ─── Tamamlanmış randevular için yorum durumu ─────────────────
  const completedApptIds = (apptsRaw ?? [])
    .filter(a => a.status === 'completed')
    .map(a => a.id)

  const { data: reviewsRaw } = completedApptIds.length > 0
    ? await supabase
        .from('clinic_reviews')
        .select('appointment_id, edit_window_until')
        .in('appointment_id', completedApptIds)
    : { data: [] }

  const reviewByApptId = new Map<string, { editLocked: boolean }>()
  ;(reviewsRaw ?? []).forEach(r => {
    reviewByApptId.set(r.appointment_id, {
      editLocked: new Date(r.edit_window_until) < new Date(),
    })
  })

  // ─── Per journey: pre/clinic/post analizleri ayır ──────────────
  type RawA = NonNullable<typeof analysesRaw>[number]
  const toYA = (a: RawA): YolculukAnalysis => ({
    id: a.id,
    web_overall: a.web_overall,
    temp_overall: a.temp_overall,
    final_overall: a.final_overall,
    web_scores: (a.web_scores ?? null) as Record<string, number> | null,
    doctor_notes: a.doctor_notes,
    doctor_approved_scores: (a.doctor_approved_scores ?? null) as YolculukAnalysis['doctor_approved_scores'],
    created_at: a.created_at,
  })

  const totalJourneys = (journeysRaw ?? []).length
  const journeyViews: YolculukView[] = (journeysRaw ?? []).map((j, idxFromNewest) => {
    const apt = j.appointment_id ? apptsById.get(j.appointment_id) ?? null : null
    const journeyAnalyses = (analysesRaw ?? []).filter(a => a.journey_id === j.id)

    // Klinik analizi: appointment_id'ye bağlı VE final_overall'i olan en son analiz
    const clinicA = apt
      ? journeyAnalyses.find(a => a.appointment_id === apt.id && a.final_overall != null)
        ?? journeyAnalyses.find(a => a.appointment_id === apt.id)
        ?? null
      : null

    // Klinik referans tarihi: appointment.completed_at
    const apptCompletedAt = apt?.completed_at ? new Date(apt.completed_at).getTime() : null

    // Pre = klinik tarihinden önce (veya klinik yoksa hepsi); en son olanı al
    const preCandidates = journeyAnalyses
      .filter(a => a.id !== clinicA?.id)
      .filter(a => apptCompletedAt == null || new Date(a.created_at).getTime() <= apptCompletedAt)
    const preA = preCandidates.length > 0
      ? preCandidates.reduce((best, cur) =>
          new Date(cur.created_at).getTime() > new Date(best.created_at).getTime() ? cur : best
        )
      : null

    // Post = klinik tarihinden sonra; varsa en yenisi
    const postCandidates = journeyAnalyses
      .filter(a => a.id !== clinicA?.id)
      .filter(a => apptCompletedAt != null && new Date(a.created_at).getTime() > apptCompletedAt)
    const postA = postCandidates.length > 0
      ? postCandidates.reduce((best, cur) =>
          new Date(cur.created_at).getTime() > new Date(best.created_at).getTime() ? cur : best
        )
      : null

    const apptView: YolculukAppointment | null = apt ? {
      id: apt.id,
      appointment_date: apt.appointment_date,
      status: apt.status,
      completed_at: apt.completed_at,
      clinic_name: (apt.clinics as { name?: string } | null)?.name ?? null,
      notes: apt.notes,
      clinic_notes: apt.clinic_notes,
      procedure_notes: apt.procedure_notes,
      recommendations: apt.recommendations,
    } : null

    // Yorum durumu — completed randevu varsa
    let reviewState: YolculukView['reviewState'] = undefined
    if (apt && apt.status === 'completed') {
      const r = reviewByApptId.get(apt.id)
      reviewState = r ? (r.editLocked ? 'locked' : 'editable') : 'none'
    }

    return {
      id: j.id,
      status: j.status as YolculukView['status'],
      startedAt: j.started_at,
      completedAt: j.completed_at,
      preAnalysis: preA ? toYA(preA) : null,
      appointment: apptView,
      clinicAnalysis: clinicA ? toYA(clinicA) : null,
      postAnalysis: postA ? toYA(postA) : null,
      // En eski yolculuk #1, en yeni #N
      index: totalJourneys - idxFromNewest,
      total: totalJourneys,
      reviewState,
    }
  })

  // ─── Skor grafiği için noktalar ────────────────────────────────
  const chartPoints: ScorePoint[] = journeyViews.flatMap(j => {
    const pts: ScorePoint[] = []
    if (j.preAnalysis?.web_overall != null) {
      pts.push({ date: j.preAnalysis.created_at, score: j.preAnalysis.web_overall, type: 'ai_analiz' })
    }
    if (j.clinicAnalysis?.final_overall != null) {
      pts.push({ date: j.clinicAnalysis.created_at, score: j.clinicAnalysis.final_overall, type: 'klinik_onayli' })
    }
    if (j.postAnalysis?.web_overall != null) {
      pts.push({ date: j.postAnalysis.created_at, score: j.postAnalysis.web_overall, type: 'ai_analiz' })
    }
    return pts
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 lg:left-[72px] right-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
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

        <GecmisTabs active="yolculuklar" />

        {/* Skor Geçmişi Grafiği */}
        {chartPoints.length > 0 && (
          <section className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Skor Geçmişi</h2>
              <span className="text-sm text-slate-500">{chartPoints.length} veri noktası</span>
            </div>
            <ScoreChart points={chartPoints} />
          </section>
        )}

        {/* Yolculuklar */}
        {journeyViews.length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-white font-bold text-lg">Gençleşme Yolculukların</h2>
              <span className="text-slate-500 text-sm">
                Son {journeyViews.length} yolculuk
              </span>
            </div>
            <p className="text-slate-500 text-sm px-1 -mt-1">
              Her yolculuk: Ön Analiz → Klinik Onayı → Son Analiz (ops.)
            </p>
            {journeyViews.map(j => (
              <YolculukKarti key={j.id} y={j} />
            ))}
          </section>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center mb-4 text-4xl">🎯</div>
            <p className="text-white font-semibold mb-2">Henüz yolculuğun yok</p>
            <p className="text-slate-400 text-sm mb-5">Selfie ile ilk gençleşme yolculuğunu başlat</p>
            <Link href="/analiz" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl">
              Analizi Başlat →
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
