import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  computeClinicEGP,
  operationalScoreFromReviews,
  npsScoreFromReviews,
  resultEffectivenessScore,
  accreditationScore,
  professionalismScore,
  type ClinicReviewRow,
} from '@/lib/clinic-review'

/**
 * Klinik EGP cron — günlük 03:30
 *
 * Her klinik için:
 *  - Operasyonel (4 ★ ort) — clinic_reviews
 *  - NPS — clinic_reviews
 *  - Sonuç etkinliği — final_overall − initial_overall ortalaması
 *  - Akreditasyon faz proxy — completed appointment sayısı
 *  - Profesyonellik — completed / toplam appt oranı
 *  - Bayesian shrinkage — review_count'a göre
 *
 * clinics tablosunu agregate kolonlarla günceller.
 *
 * Cron secret: header `x-cron-secret`.
 */
export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret')
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()

  try {
    // 1. Aktif klinikler
    const { data: clinics, error: cErr } = await admin
      .from('clinics')
      .select('id')
      .eq('is_active', true)
    if (cErr) throw cErr
    if (!clinics || clinics.length === 0) {
      return NextResponse.json({ ok: true, processed: 0 })
    }

    const clinicIds = clinics.map(c => c.id)

    // 2. Tüm yorumları tek seferde çek
    const { data: allReviews, error: rErr } = await admin
      .from('clinic_reviews')
      .select('clinic_id, hijyen, personel, randevu_uyumu, iletisim, nps, gereksiz_islem, tekrar_gelir, appointment_id, user_id, id, pozitif_metin, iyilestirme_metni, is_anonymous, edit_window_until, clinic_response, clinic_responded_at, created_at, updated_at')
      .in('clinic_id', clinicIds)
    if (rErr) throw rErr

    const reviewsByClinic = new Map<string, ClinicReviewRow[]>()
    ;(allReviews ?? []).forEach(r => {
      const key = r.clinic_id as string
      const list = reviewsByClinic.get(key) ?? []
      list.push(r as unknown as ClinicReviewRow)
      reviewsByClinic.set(key, list)
    })

    // 3. Tüm appointment'ları çek (status + user_id + analiz id)
    const { data: allAppts, error: aErr } = await admin
      .from('appointments')
      .select('id, clinic_id, status, user_id, initial_analysis_id, final_score_id')
      .in('clinic_id', clinicIds)
    if (aErr) throw aErr

    const apptsByClinic = new Map<string, NonNullable<typeof allAppts>>()
    ;(allAppts ?? []).forEach(a => {
      const list = apptsByClinic.get(a.clinic_id as string) ?? []
      list.push(a)
      apptsByClinic.set(a.clinic_id as string, list)
    })

    // 4. Sonuç etkinliği için: completed + final_score_id + initial_analysis_id olan appt'lara ait skorları çek
    const completedApptsWithScores = (allAppts ?? []).filter(
      a => a.status === 'completed' && a.final_score_id && a.initial_analysis_id,
    )

    const finalScoreIds = completedApptsWithScores.map(a => a.final_score_id).filter(Boolean) as string[]
    const initialAnalysisIds = completedApptsWithScores.map(a => a.initial_analysis_id).filter(Boolean) as string[]

    // final scores: scores tablosu
    const { data: scoreRows } = finalScoreIds.length > 0
      ? await admin.from('scores').select('id, value').in('id', finalScoreIds)
      : { data: [] }
    const finalScoreById = new Map<string, number>()
    ;(scoreRows ?? []).forEach(s => {
      const v = (s as { value?: number }).value
      if (typeof v === 'number') finalScoreById.set(s.id as string, v)
    })

    // initial analyses: web_overall ya da temp_overall
    const { data: analysisRows } = initialAnalysisIds.length > 0
      ? await admin.from('analyses').select('id, web_overall, temp_overall').in('id', initialAnalysisIds)
      : { data: [] }
    const initialScoreById = new Map<string, number>()
    ;(analysisRows ?? []).forEach(a => {
      const r = a as { id: string; web_overall: number | null; temp_overall: number | null }
      const v = r.web_overall ?? r.temp_overall ?? null
      if (typeof v === 'number') initialScoreById.set(r.id, v)
    })

    // delta'ları clinic bazında topla
    const deltasByClinic = new Map<string, number[]>()
    completedApptsWithScores.forEach(a => {
      const initial = initialScoreById.get(a.initial_analysis_id as string)
      const final = finalScoreById.get(a.final_score_id as string)
      if (typeof initial === 'number' && typeof final === 'number') {
        const list = deltasByClinic.get(a.clinic_id as string) ?? []
        list.push(final - initial)
        deltasByClinic.set(a.clinic_id as string, list)
      }
    })

    // 5. Global ortalama (Bayesian fallback için): tüm operasyonel skorların ortalaması
    const allOperational = clinicIds
      .map(id => operationalScoreFromReviews(reviewsByClinic.get(id) ?? []))
      .filter((v): v is number => v != null)
    const globalAvg = allOperational.length > 0
      ? allOperational.reduce((a, b) => a + b, 0) / allOperational.length
      : 6.5

    // 6. Her klinik için EGP hesapla, batch update'e koy
    let processed = 0
    const updates: Array<{
      id: string
      review_count: number
      avg_operational: number | null
      avg_nps: number | null
      clinic_egp: number
      clinic_egp_updated_at: string
    }> = []

    const now = new Date().toISOString()

    for (const cid of clinicIds) {
      const reviews = reviewsByClinic.get(cid) ?? []
      const appts = apptsByClinic.get(cid) ?? []
      const deltas = deltasByClinic.get(cid) ?? []

      const totalAppts = appts.length
      const completedCount = appts.filter(a => a.status === 'completed').length

      const operational = operationalScoreFromReviews(reviews)
      const nps = npsScoreFromReviews(reviews)
      const avgDelta = deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : null
      const resultEff = resultEffectivenessScore(avgDelta)

      // Akreditasyon proxy — review_count + completed_count
      const phase: 0 | 1 | 2 | 3 =
        completedCount >= 100 && completedCount >= 30 ? 3 :
        completedCount >= 20 ? 2 :
        completedCount >= 5 ? 1 : 0

      const accreditation = accreditationScore(phase)
      const profScore = professionalismScore(completedCount, totalAppts)

      const egp = computeClinicEGP({
        resultEff,
        nps,
        operational,
        accreditation,
        professionalism: profScore,
        reviewCount: reviews.length,
        globalAvg,
      })

      updates.push({
        id: cid,
        review_count: reviews.length,
        avg_operational: operational,
        avg_nps: nps,
        clinic_egp: egp,
        clinic_egp_updated_at: now,
      })
      processed++
    }

    // 7. Tek tek update (Supabase'de bulk update yok, sadece RPC ile)
    for (const u of updates) {
      const { error: uErr } = await admin
        .from('clinics')
        .update({
          review_count: u.review_count,
          avg_operational: u.avg_operational,
          avg_nps: u.avg_nps,
          clinic_egp: u.clinic_egp,
          clinic_egp_updated_at: u.clinic_egp_updated_at,
        })
        .eq('id', u.id)
      if (uErr) {
        console.error(`[clinic-egp] update failed for ${u.id}:`, uErr.message)
      }
    }

    return NextResponse.json({ ok: true, processed, globalAvg: Math.round(globalAvg * 100) / 100 })
  } catch (err) {
    console.error('[clinic-egp] error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
