import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Akademi paketleri için kalite skoru hesaplama (günlük cron).
 *
 * Formül (0-100 arası):
 *   quality_score = avg_rating × 12        ← 0-60 (yıldız ağırlığı)
 *                 + min(total_purchases, 200) / 200 × 20  ← 0-20 (popülerlik, doyumlu)
 *                 + completion_rate × 0.15  ← 0-15 (tamamlanma)
 *                 − refund_rate × 0.5       ← negatif (iade cezası)
 *
 * Bayesian shrinkage: < 5 yorum varsa avg_rating yerine global ortalamaya çek.
 *
 * Cron çağrısı: vercel.json'dan günlük 03:00, header `x-cron-secret` ile.
 */
export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret')
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()

  try {
    // Tüm yayında olan paketleri çek
    const { data: packages, error } = await admin
      .from('course_packages')
      .select('id, total_purchases, total_reviews, avg_rating, completion_rate, refund_rate')
      .eq('is_published', true)
    if (error) throw error
    if (!packages || packages.length === 0) {
      return NextResponse.json({ ok: true, processed: 0 })
    }

    // Global ortalama (Bayesian shrinkage için)
    const validRatings = packages.filter(p => p.avg_rating != null && p.total_reviews && p.total_reviews >= 3)
    const globalAvg = validRatings.length > 0
      ? validRatings.reduce((sum, p) => sum + Number(p.avg_rating ?? 0), 0) / validRatings.length
      : 4.0

    let processed = 0
    for (const pkg of packages) {
      const reviews = pkg.total_reviews ?? 0
      const purchases = pkg.total_purchases ?? 0
      const avgRating = Number(pkg.avg_rating ?? 0)
      const completion = Number(pkg.completion_rate ?? 0)
      const refund = Number(pkg.refund_rate ?? 0)

      // Bayesian — az yorumda global ortalamaya doğru çek
      const C = 5 // confidence threshold
      const effectiveRating = reviews >= C
        ? avgRating
        : (avgRating * reviews + globalAvg * (C - reviews)) / C

      const ratingComponent     = effectiveRating * 12
      const popularityComponent = Math.min(purchases, 200) / 200 * 20
      const completionComponent = completion * 0.15
      const refundPenalty       = refund * 0.5

      const score = Math.max(0, Math.min(100,
        ratingComponent + popularityComponent + completionComponent - refundPenalty
      ))

      const rounded = Math.round(score * 100) / 100

      await admin
        .from('course_packages')
        .update({ quality_score: rounded })
        .eq('id', pkg.id)

      processed++
    }

    return NextResponse.json({ ok: true, processed, globalAvg: Math.round(globalAvg * 100) / 100 })
  } catch (err) {
    console.error('[Akademi Quality Cron] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Hata' },
      { status: 500 }
    )
  }
}
