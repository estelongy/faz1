import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  computeClinicEGPFromRecommend,
  recommendRateFromReviews,
  operationalScoreFromReviews,
  npsScoreFromReviews,
  BAYESIAN_PRIOR_MEAN,
  BAYESIAN_PRIOR_WEIGHT,
  type ClinicReviewRow,
} from '@/lib/clinic-review'

/**
 * Klinik EGP cron — günlük 03:30
 *
 * Formül (NHS FFT + Bayesian, son 12 ay rolling window):
 *   recRate  = (Öneririm + Kesinlikle Öneririm) / total × 10
 *   EGP      = (n/(n+m)) × recRate + (m/(n+m)) × C
 *   m = 10, C = 7
 *
 * Akademik referans: NHS Friends and Family Test (UK NHS, 2013-).
 * Sonuç: clinic_egp + review_count + avg_nps clinics tablosuna yazılır.
 *
 * Cron secret: header `x-cron-secret`.
 */
export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret')
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()
  const now = new Date()
  const twelveMonthsAgo = new Date(now)
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

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

    // 2. Son 12 ay yorumları (rolling window)
    const { data: allReviews, error: rErr } = await admin
      .from('clinic_reviews')
      .select('clinic_id, hijyen, personel, randevu_uyumu, iletisim, nps, gereksiz_islem, tekrar_gelir, appointment_id, user_id, id, pozitif_metin, iyilestirme_metni, is_anonymous, edit_window_until, clinic_response, clinic_responded_at, created_at, updated_at')
      .in('clinic_id', clinicIds)
      .gte('created_at', twelveMonthsAgo.toISOString())
    if (rErr) throw rErr

    const reviewsByClinic = new Map<string, ClinicReviewRow[]>()
    ;(allReviews ?? []).forEach(r => {
      const key = r.clinic_id as string
      const list = reviewsByClinic.get(key) ?? []
      list.push(r as unknown as ClinicReviewRow)
      reviewsByClinic.set(key, list)
    })

    // 3. Her klinik için EGP hesapla
    let processed = 0
    const updates: Array<{
      id: string
      review_count: number
      avg_operational: number | null
      avg_nps: number | null
      clinic_egp: number | null
      clinic_egp_updated_at: string
    }> = []

    const nowIso = now.toISOString()

    for (const cid of clinicIds) {
      const reviews = reviewsByClinic.get(cid) ?? []

      const operational = operationalScoreFromReviews(reviews)
      const nps = npsScoreFromReviews(reviews)
      const recRate = recommendRateFromReviews(reviews)

      // NHS FFT + Bayesian. Az yorumlu klinik bile hesaplanır;
      // UI tarafı 20 eşiğinin altını "Ölçülüyor" rozetiyle gizler.
      const egp = computeClinicEGPFromRecommend({
        recommendRate: recRate,
        reviewCount: reviews.length,
        priorMean: BAYESIAN_PRIOR_MEAN,
        priorWeight: BAYESIAN_PRIOR_WEIGHT,
      })

      updates.push({
        id: cid,
        review_count: reviews.length,
        avg_operational: operational,
        avg_nps: nps,
        clinic_egp: egp,
        clinic_egp_updated_at: nowIso,
      })
      processed++
    }

    // 4. Update (Supabase'de bulk update yok)
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

    return NextResponse.json({
      ok: true,
      processed,
      window: '12 months',
      formula: 'NHS FFT + Bayesian (m=10, C=7)',
    })
  } catch (err) {
    console.error('[clinic-egp] error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
