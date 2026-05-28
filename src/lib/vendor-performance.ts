/**
 * Vendor performans skoru — 5 metrik, her biri 0-20 puan, toplam 0-100.
 *
 * Trendyol/Hepsiburada satıcı paneli muadili: "ne kadar iyi yönetiyorum?" sinyali.
 *
 * Server-only.
 */

import { createServiceClient } from '@/lib/supabase/service'

export interface MetricScore {
  key: string
  label: string
  value: number          // ham metrik değeri (gün, %, ortalama vs.)
  unit: string
  score: number          // 0-20
  band: 'good' | 'ok' | 'bad'
  description: string    // gerekçe + iyileştirme önerisi
}

export interface VendorPerformanceReport {
  totalScore: number     // 0-100
  letter: 'A' | 'B' | 'C' | 'D' | 'F'
  metrics: MetricScore[]
  hasEnoughData: boolean // 5+ sipariş yoksa false
  totalOrders: number
}

const WINDOW_DAYS = 90

export async function getVendorPerformance(vendorId: string): Promise<VendorPerformanceReport> {
  const admin = createServiceClient()
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // ── 1. Kargolama gün sayısı: shipped_at - created_at (sadece shipped+) ──
  const { data: shippedItems } = await admin
    .from('order_items')
    .select('created_at, shipped_at, fulfillment_status')
    .eq('vendor_id', vendorId)
    .not('shipped_at', 'is', null)
    .gte('created_at', since)
    .limit(1000)

  const shipDays: number[] = (shippedItems ?? [])
    .filter(i => i.shipped_at && i.created_at)
    .map(i => {
      const ms = new Date(i.shipped_at!).getTime() - new Date(i.created_at).getTime()
      return ms / (1000 * 60 * 60 * 24)
    })
  const avgShipDays = shipDays.length > 0
    ? shipDays.reduce((s, n) => s + n, 0) / shipDays.length
    : null

  // ── 2. İade oranı: returns / orders ──
  const { count: paidItemsCount } = await admin
    .from('order_items')
    .select('id, orders!inner(payment_status)', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
    .eq('orders.payment_status', 'paid')
    .gte('created_at', since)

  const totalOrders = paidItemsCount ?? 0

  const { count: returnsCount } = await admin
    .from('returns')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
    .gte('created_at', since)
  const returnRate = totalOrders > 0
    ? (returnsCount ?? 0) / totalOrders
    : null

  // ── 3. Müşteri puanı: vendor_reviews ortalama ──
  const { data: vReviews } = await admin
    .from('vendor_reviews')
    .select('rating')
    .eq('vendor_id', vendorId)
  const customerRating = vReviews && vReviews.length > 0
    ? vReviews.reduce((s, r) => s + Number(r.rating), 0) / vReviews.length
    : null

  // ── 4. Soru cevaplama oranı: answered / total (son 90 gün) ──
  const { data: questions } = await admin
    .from('product_questions')
    .select('id, answer')
    .eq('vendor_id', vendorId)
    .gte('created_at', since)
  const totalQ = questions?.length ?? 0
  const answeredQ = (questions ?? []).filter(q => q.answer).length
  const qaRate = totalQ > 0 ? answeredQ / totalQ : null

  // ── 5. Yorum cevaplama oranı (son 90 gün) ──
  // Vendor'un ürün ID'lerini bul
  const { data: vProducts } = await admin
    .from('products')
    .select('id')
    .eq('vendor_id', vendorId)
  const productIds = (vProducts ?? []).map(p => p.id)
  let reviewRate: number | null = null
  let totalR = 0
  if (productIds.length > 0) {
    const { data: revs } = await admin
      .from('reviews')
      .select('id, vendor_response')
      .in('product_id', productIds)
      .gte('created_at', since)
    totalR = revs?.length ?? 0
    const respondedR = (revs ?? []).filter(r => r.vendor_response).length
    reviewRate = totalR > 0 ? respondedR / totalR : null
  }

  // ── Skorlama ──
  const metrics: MetricScore[] = [
    scoreShipDays(avgShipDays),
    scoreReturnRate(returnRate),
    scoreCustomerRating(customerRating),
    scoreQaRate(qaRate, totalQ),
    scoreReviewRate(reviewRate, totalR),
  ]

  const totalScore = metrics.reduce((s, m) => s + m.score, 0)
  const letter: VendorPerformanceReport['letter'] =
    totalScore >= 90 ? 'A' :
    totalScore >= 75 ? 'B' :
    totalScore >= 60 ? 'C' :
    totalScore >= 40 ? 'D' : 'F'

  return {
    totalScore,
    letter,
    metrics,
    hasEnoughData: totalOrders >= 5,
    totalOrders,
  }
}

// ── Skor fonksiyonları ───────────────────────────────────────────

function scoreShipDays(avgDays: number | null): MetricScore {
  if (avgDays === null) {
    return {
      key: 'ship_days',
      label: 'Kargolama Hızı',
      value: 0, unit: 'gün',
      score: 10,
      band: 'ok',
      description: 'Henüz kargolanmış sipariş yok. İlk siparişten sonra ölçülür.',
    }
  }
  // ≤1 gün = 20, ≤2 = 18, ≤3 = 15, ≤5 = 10, >7 = 0
  let score = 0
  if      (avgDays <= 1) score = 20
  else if (avgDays <= 2) score = 18
  else if (avgDays <= 3) score = 15
  else if (avgDays <= 5) score = 10
  else if (avgDays <= 7) score = 5
  else                   score = 0

  const band: MetricScore['band'] = score >= 15 ? 'good' : score >= 8 ? 'ok' : 'bad'
  let description = ''
  if (score >= 18) description = 'Mükemmel — siparişleri hızla kargolarsın. Müşteriler bunu hissediyor.'
  else if (score >= 15) description = 'İyi. 1 günün altına çekersen müşteri memnuniyeti artar.'
  else if (score >= 8) description = 'Ortalama. Siparişleri günlük (sabah/akşam 1 kez) kargoya verirsen skor yükselir.'
  else description = 'Düşük. 3+ gün kargolama yapıyorsun. İade ve şikayet riski artıyor. Toplu kargolamayı dene.'

  return {
    key: 'ship_days', label: 'Kargolama Hızı',
    value: Math.round(avgDays * 10) / 10, unit: 'gün ort.',
    score, band, description,
  }
}

function scoreReturnRate(rate: number | null): MetricScore {
  if (rate === null) {
    return {
      key: 'return_rate', label: 'İade Oranı',
      value: 0, unit: '%',
      score: 15, band: 'ok',
      description: 'Henüz iade verisi yok. İade düştükçe skor artar.',
    }
  }
  // <3% = 20, <5% = 17, <8% = 12, <12% = 8, >15% = 0
  let score = 0
  if      (rate < 0.03) score = 20
  else if (rate < 0.05) score = 17
  else if (rate < 0.08) score = 12
  else if (rate < 0.12) score = 8
  else if (rate < 0.15) score = 4
  else                  score = 0

  const band: MetricScore['band'] = score >= 15 ? 'good' : score >= 8 ? 'ok' : 'bad'
  let description = ''
  if (score >= 17) description = 'Mükemmel — iadeler çok az. Ürün açıklamaların ve görsellerin müşteriyi doğru bilgilendiriyor.'
  else if (score >= 12) description = 'İyi. Kabul edilebilir düzey. Görsellerini gerçek hayatla eşleştir.'
  else if (score >= 8) description = 'Ortalama. Bazı ürünler hayalkırıklığı yaratıyor — ürün sayfasını incele.'
  else description = 'Yüksek iade oranı. Ürün açıklama/görsel/paketleme kalitesini gözden geçir. Vitrinden kaldırma riski var.'

  return {
    key: 'return_rate', label: 'İade Oranı',
    value: Math.round(rate * 1000) / 10, unit: '%',
    score, band, description,
  }
}

function scoreCustomerRating(rating: number | null): MetricScore {
  if (rating === null) {
    return {
      key: 'customer_rating', label: 'Müşteri Puanı',
      value: 0, unit: '/5',
      score: 12, band: 'ok',
      description: 'Henüz müşteri puanı yok. İlk 5 müşteri puanından sonra ölçülür.',
    }
  }
  // 4.8+ = 20, 4.5+ = 17, 4.0+ = 14, 3.5+ = 10, <3 = 0
  let score = 0
  if      (rating >= 4.8) score = 20
  else if (rating >= 4.5) score = 17
  else if (rating >= 4.0) score = 14
  else if (rating >= 3.5) score = 10
  else if (rating >= 3.0) score = 5
  else                    score = 0

  const band: MetricScore['band'] = score >= 14 ? 'good' : score >= 8 ? 'ok' : 'bad'
  let description = ''
  if (score >= 17) description = 'Müşteriler sana bayılıyor. Bu skor vitrinde altın işareti.'
  else if (score >= 14) description = 'İyi puanlar. 4.5+ için müşteri ilişkilerine biraz daha özen.'
  else if (score >= 8) description = 'Orta. Kötü yorum gelen ürünlerini incele, müşterilerle iletişime geç.'
  else description = 'Düşük puan. Acil aksiyon: hangi ürünlerden şikayet geliyor? Hızlıca yorumları yanıtla, sorunu çöz.'

  return {
    key: 'customer_rating', label: 'Müşteri Puanı',
    value: Math.round(rating * 10) / 10, unit: '/5',
    score, band, description,
  }
}

function scoreQaRate(rate: number | null, total: number): MetricScore {
  if (rate === null || total === 0) {
    return {
      key: 'qa_rate', label: 'Soru Yanıt Oranı',
      value: 0, unit: '%',
      score: 12, band: 'ok',
      description: 'Henüz müşteri sorusu gelmemiş. Soru geldiğinde 24 saatte yanıtla.',
    }
  }
  // ≥95% = 20, ≥85% = 17, ≥70% = 12, ≥50% = 7, <50% = 0
  let score = 0
  if      (rate >= 0.95) score = 20
  else if (rate >= 0.85) score = 17
  else if (rate >= 0.70) score = 12
  else if (rate >= 0.50) score = 7
  else                   score = 0

  const band: MetricScore['band'] = score >= 15 ? 'good' : score >= 8 ? 'ok' : 'bad'
  let description = ''
  if (score >= 17) description = `${total} sorudan neredeyse hepsini yanıtlıyorsun. Müşteri güvenini hissediyor.`
  else if (score >= 12) description = `${total} sorunun çoğunu yanıtlıyorsun. %95 hedefe ulaşmaya çalış.`
  else if (score >= 7) description = `${total} sorunun yarısı cevapsız. Müşteriler satın alma kararı veremez — yanıtla.`
  else description = `${total} soruya cevap yok. Bu satış kaybı. /satici/panel/sorular sayfasını günlük kontrol et.`

  return {
    key: 'qa_rate', label: 'Soru Yanıt Oranı',
    value: Math.round(rate * 100), unit: '%',
    score, band, description,
  }
}

function scoreReviewRate(rate: number | null, total: number): MetricScore {
  if (rate === null || total === 0) {
    return {
      key: 'review_rate', label: 'Yoruma Yanıt Oranı',
      value: 0, unit: '%',
      score: 15, band: 'ok',
      description: 'Henüz müşteri yorumu yok. İlk yorumdan sonra ölçülür.',
    }
  }
  // ≥80% = 20, ≥60% = 17, ≥40% = 12, ≥20% = 7, <20% = 0
  let score = 0
  if      (rate >= 0.80) score = 20
  else if (rate >= 0.60) score = 17
  else if (rate >= 0.40) score = 12
  else if (rate >= 0.20) score = 7
  else                   score = 0

  const band: MetricScore['band'] = score >= 15 ? 'good' : score >= 8 ? 'ok' : 'bad'
  let description = ''
  if (score >= 17) description = 'Müşterilerle aktif iletişimdesin. Yorumların altındaki yanıtların satışa dönüşüyor.'
  else if (score >= 12) description = 'İyi. Olumsuz yorumlara da yanıt vermeyi unutma — kriz yönetimi marka kurar.'
  else if (score >= 7) description = `${total} yorumun azına yanıt veriyorsun. Sessizlik ilgisizlik gibi okunuyor.`
  else description = 'Yorumlara hiç yanıt yok. Müşteri seni "sattı, kayboldu" tipi satıcı olarak görüyor. Acil aksiyon al.'

  return {
    key: 'review_rate', label: 'Yoruma Yanıt Oranı',
    value: Math.round(rate * 100), unit: '%',
    score, band, description,
  }
}
