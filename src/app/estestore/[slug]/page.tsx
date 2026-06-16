export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReviewForm from './ReviewForm'
import AddToCartButton from '@/components/AddToCartButton'
import CartButton from '@/components/CartButton'
import WishlistButton from '@/components/WishlistButton'
import RecentlyViewedTracker from '@/components/RecentlyViewedTracker'
import RecentlyViewedShelf from '@/components/RecentlyViewedShelf'
import QaSection from './QaSection'
import ProductGallery from './ProductGallery'

import SafeLink from '@/components/SafeLink'
const SITE_URL = 'https://estelongy.com'

// products.category enum eşlemesi. Legacy değerler fallback olarak kalır.
const CATEGORY_LABELS: Record<string, string> = {
  kozmetik:     'Kozmetik',
  sarf_medikal: 'Sarf & Medikal',
  // Legacy
  botox: 'Botoks', filler: 'Dolgu', mezo: 'Mezoterapi', laser: 'Lazer',
  gold_needle: 'Altın İğne', peeling: 'Peeling', serum: 'Serum',
  supplement: 'Takviye', device: 'Cihaz', other: 'Diğer',
}

// products.category → /estestore/kategori/[slug] URL eşlemesi (kategori sayfası slug-based).
const CATEGORY_URL_SLUG: Record<string, string> = {
  kozmetik:     'kozmetik',
  sarf_medikal: 'sarf-medikal',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const isUuid = uuidPattern.test(slug)

  const q = supabase
    .from('products')
    .select('name, description, slug, images, category, final_score, vendors(company_name)')
    .eq('is_active', true)
    .eq('approval_status', 'approved')

  const { data: p } = isUuid
    ? await q.eq('id', slug).single()
    : await q.eq('slug', slug).single()

  if (!p) {
    return { title: 'Ürün Bulunamadı', robots: { index: false, follow: false } }
  }

  const cat = p.category ? CATEGORY_LABELS[p.category] : null
  const vendor = (p.vendors as { company_name?: string } | null)?.company_name
  const titleSuffix = cat ? ` (${cat})` : ''
  const title = `${p.name}${titleSuffix}`
  const baseDesc = p.description?.trim() ?? ''
  const truncated = baseDesc.length > 155 ? `${baseDesc.slice(0, 152)}...` : baseDesc
  const description = truncated || `${p.name} — ${cat ?? 'estetik ürün'}${vendor ? ` · ${vendor}` : ''}. Estelongy Puanı (EP) ${p.final_score?.toFixed(1) ?? '—'}/10.`

  const canonical = `/estestore/${p.slug ?? slug}`
  const image = p.images?.[0]

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | EsteStore`,
      description,
      url: `${SITE_URL}${canonical}`,
      type: 'website',
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: p.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | EsteStore`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

function PuanBar({ label, value }: { label: string; value: number | null }) {
  if (!value) return null
  const pct = (value / 10) * 100
  const color = value >= 9 ? 'bg-[#10876B]' : value >= 7 ? 'bg-[#C9A961]' : 'bg-red-500'
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-500 text-sm w-32 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-900 font-bold text-sm w-8 text-right">{value.toFixed(1)}</span>
    </div>
  )
}

/** EP başlık ortalama barı — 5 ölçekli (1-5). 5 üzerinden değeri gösterir, çubuk renkli. */
function BaslikBar({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null
  const pct = (value / 5) * 100
  const color = value >= 4.5 ? 'bg-[#10876B]' : value >= 3.5 ? 'bg-[#C9A961]' : 'bg-red-500'
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-500 text-sm w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-900 font-bold text-sm w-10 text-right tabular-nums">{value.toFixed(1)}/5</span>
    </div>
  )
}

export default async function UrunDetayPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const isUuid = uuidPattern.test(slug)

  const query = supabase
    .from('products')
    .select('*, vendors(company_name)')
    .eq('is_active', true)

  const { data: product } = isUuid
    ? await query.eq('id', slug).single()
    : await query.eq('slug', slug).single()

  if (!product) notFound()

  // Medikal-Sarf (sarf_medikal) ürünleri hasta kullanıcıya tamamen gizli.
  const role = (user?.app_metadata as Record<string, string> | undefined)?.role as
    | 'user' | 'clinic' | 'health_professional' | 'vendor' | 'admin' | undefined
  const isProRole = role === 'clinic' || role === 'health_professional' || role === 'admin'
  if (product.category === 'sarf_medikal' && !isProRole) notFound()
  // klinik_only ürünler hasta kullanıcıya kapalı (direkt URL ile de erişilemez)
  if (product.klinik_only && !isProRole) notFound()

  // Favori listesinde mi?
  let isInWishlist = false
  if (user) {
    const { data: wRow } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle()
    isInWishlist = !!wRow
  }

  // Eski reviews tablosu — sadece backward compat için okunur, yeni form artık ep_reviews'a yazar
  const { data: legacyReviews } = await supabase
    .from('reviews')
    .select('id, rating, title, body, is_verified, created_at, user_id, vendor_response, vendor_responded_at, profiles(full_name)')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Q&A — sorular + yanıtlar
  const { data: qaRaw } = await supabase
    .from('product_questions')
    .select('id, question, answer, answered_at, created_at, asker_user_id')
    .eq('product_id', product.id)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(50)

  // Profil isimlerini ayrı çek (FK direkt auth.users'a)
  const askerIds = Array.from(new Set((qaRaw ?? []).map(q => q.asker_user_id)))
  const { data: askerProfiles } = askerIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', askerIds)
    : { data: [] }
  const askerNameMap = new Map((askerProfiles ?? []).map(p => [p.id, p.full_name as string | null]))

  const questions = (qaRaw ?? []).map(q => ({
    id: q.id,
    question: q.question,
    answer: q.answer,
    answered_at: q.answered_at,
    created_at: q.created_at,
    asker_user_id: q.asker_user_id,
    asker_full_name: askerNameMap.get(q.asker_user_id) ?? null,
  }))

  // EP (Estelongy Puanı) sistemi: 5 sorulu değerlendirmeler + opsiyonel başlık + yorum + verified rozeti
  const { data: epReviews } = await supabase
    .from('ep_reviews')
    .select('id, baz_score, q_etkinlik, q_sosyal_kanit, q_guvenlik, q_etki_suresi, q_kullanim, title, comment, is_verified_purchase, created_at, user_id, profiles(full_name)')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const userEpReview = epReviews?.find(r => r.user_id === user?.id) ?? null
  const avgUserScore = epReviews && epReviews.length > 0
    ? epReviews.reduce((s, r) => s + Number(r.baz_score ?? 0), 0) / epReviews.length
    : (legacyReviews && legacyReviews.length > 0
        ? legacyReviews.reduce((s, r) => s + Number(r.rating), 0) / legacyReviews.length
        : null)
  const totalReviewCount = (epReviews?.length ?? 0) + (legacyReviews?.length ?? 0)

  // 5 başlık ortalaması (1-5 ölçeği) — EP rozet bloğunda satır satır barlar.
  const epAverages = (() => {
    if (!epReviews || epReviews.length === 0) return null
    const n = epReviews.length
    const sum = epReviews.reduce(
      (acc, r) => ({
        etkinlik:   acc.etkinlik   + Number(r.q_etkinlik),
        sosyal:     acc.sosyal     + Number(r.q_sosyal_kanit),
        guvenlik:   acc.guvenlik   + Number(r.q_guvenlik),
        etkiSuresi: acc.etkiSuresi + Number(r.q_etki_suresi),
        kullanim:   acc.kullanim   + Number(r.q_kullanim),
      }),
      { etkinlik: 0, sosyal: 0, guvenlik: 0, etkiSuresi: 0, kullanim: 0 },
    )
    return {
      etkinlik:   sum.etkinlik   / n,
      sosyal:     sum.sosyal     / n,
      guvenlik:   sum.guvenlik   / n,
      etkiSuresi: sum.etkiSuresi / n,
      kullanim:   sum.kullanim   / n,
    }
  })()

  // EP belgeleri (gösterim için)
  const { data: epDocs } = await supabase
    .from('ep_documents')
    .select('document_type, seviye, verified_at')
    .eq('product_id', product.id)
    .not('verified_at', 'is', null)
    .order('seviye', { ascending: false })

  const DOC_LABELS: Record<string, string> = {
    uts: 'ÜTS Kayıtlı',
    tufam: 'TÜFAM',
    tse: 'TSE',
    ce: 'CE',
    ce_klas3: 'CE Sınıf-3',
    klinik_calisma: 'Klinik Çalışma',
  }

  // ── Product JSON-LD ──────────────────────────────────────────────
  const isTreatment = product.treatment_type === 'treatment'
  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': isTreatment ? 'Service' : 'Product',
    name: product.name,
    description: product.description ?? undefined,
    url: `${SITE_URL}/estestore/${product.slug ?? product.id}`,
    ...(product.images?.length ? { image: product.images } : {}),
    ...(product.category ? { category: CATEGORY_LABELS[product.category] ?? product.category } : {}),
    ...(product.vendors?.company_name ? {
      brand: { '@type': 'Brand', name: product.vendors.company_name },
    } : {}),
  }

  if (!isTreatment && product.price) {
    productJsonLd.offers = {
      '@type': 'Offer',
      url: `${SITE_URL}/estestore/${product.slug ?? product.id}`,
      priceCurrency: 'TRY',
      price: Number(product.price),
      availability: product.stock != null && product.stock > 0
        ? 'https://schema.org/InStock'
        : product.stock === 0
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    }
  }

  if (avgUserScore && totalReviewCount > 0) {
    productJsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgUserScore.toFixed(1),
      reviewCount: totalReviewCount,
      bestRating: 10,
      worstRating: 0,
    }
    productJsonLd.review = (legacyReviews ?? []).slice(0, 5).map(r => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: Number(r.rating),
        bestRating: 10,
        worstRating: 0,
      },
      author: {
        '@type': 'Person',
        name: (r.profiles as { full_name?: string } | null)?.full_name ?? 'Anonim',
      },
      datePublished: r.created_at,
      ...(r.title ? { name: r.title } : {}),
      ...(r.body ? { reviewBody: r.body } : {}),
    }))
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'EsteStore', item: `${SITE_URL}/estestore` },
      ...(product.category ? [{
        '@type': 'ListItem',
        position: 3,
        name: CATEGORY_LABELS[product.category] ?? product.category,
        item: `${SITE_URL}/estestore/kategori/${CATEGORY_URL_SLUG[product.category] ?? product.category}`,
      }] : []),
      {
        '@type': 'ListItem',
        position: product.category ? 4 : 3,
        name: product.name,
        item: `${SITE_URL}/estestore/${product.slug ?? product.id}`,
      },
    ],
  }

  return (
    <main className="min-h-screen bg-white">
      <RecentlyViewedTracker
        productId={product.id}
        slug={product.slug ?? null}
        name={product.name}
        cover={product.images?.[0] ?? null}
        price={Number(product.price ?? 0)}
        category={product.category ?? 'kozmetik'}
        subcategory={product.subcategory ?? null}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="app-only" aria-hidden style={{ height: 'calc(56px + env(safe-area-inset-top))' }} />
      <header className="web-only sticky top-0 z-50 bg-[#0F172A] border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/estestore" className="text-base font-semibold text-slate-300 hover:text-white transition-colors shrink-0">← EsteStore</Link>
            <span className="text-slate-700">|</span>
            <span className="text-white text-base font-bold truncate">{product.name}</span>
          </div>
          <CartButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <nav className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-6 flex-wrap">
          <Link href="/estestore" className="hover:text-slate-900 transition-colors text-[#8B7339]">EsteStore</Link>
          {product.category && (
            <>
              <span>›</span>
              <Link
                href={`/estestore/kategori/${CATEGORY_URL_SLUG[product.category] ?? product.category}`}
                className="hover:text-slate-900 transition-colors text-[#8B7339]">
                {CATEGORY_LABELS[product.category] ?? product.category}
              </Link>
            </>
          )}
          <span>›</span>
          <span className="text-slate-900 truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">

          {/* Sol: Görsel + Puan */}
          <div>
            <ProductGallery images={product.images ?? []} alt={product.name} />

            {/* Estelongy Puanı (EP) */}
            <div className="bg-[#FAFAF7] border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-slate-500 text-sm uppercase tracking-[0.18em] font-semibold mb-1">
                    Estelongy Puanı
                  </p>
                  <div className="flex items-end gap-1">
                    <span className={`text-5xl font-black ${
                      (product.ep_score ?? product.final_score ?? 0) >= 9 ? 'text-[#10876B]' :
                      (product.ep_score ?? product.final_score ?? 0) >= 7 ? 'text-[#8B7339]' : 'text-red-500'
                    }`}>
                      {product.ep_score != null ? Number(product.ep_score).toFixed(2) :
                       product.final_score ? Number(product.final_score).toFixed(1) : '—'}
                    </span>
                    <span className="text-slate-400 text-lg mb-1">/10</span>
                  </div>
                  {product.ep_review_count > 0 && (
                    <p className="text-slate-500 text-xs mt-1">
                      {product.ep_review_count} kullanıcı değerlendirmesi
                    </p>
                  )}
                </div>
              </div>

              {epAverages ? (
                <div className="space-y-2">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">5 Başlık Ortalaması</p>
                  <BaslikBar label="Etkinlik"     value={epAverages.etkinlik} />
                  <BaslikBar label="Sosyal Kanıt" value={epAverages.sosyal} />
                  <BaslikBar label="Güvenlik"     value={epAverages.guvenlik} />
                  <BaslikBar label="Etki Süresi"  value={epAverages.etkiSuresi} />
                  <BaslikBar label="Kullanım"     value={epAverages.kullanim} />
                </div>
              ) : (
                <PuanBar label="Kullanıcı Puanı" value={avgUserScore ?? product.user_score} />
              )}

              {product.ep_belge_seviye > 0 && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200">
                  <span className="text-slate-500 text-sm w-28 shrink-0">Belge Seviyesi</span>
                  <div className="flex-1 flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className={`flex-1 h-2 rounded-full ${n <= product.ep_belge_seviye ? 'bg-[#10876B]' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <span className="text-slate-900 font-bold text-sm w-10 text-right tabular-nums">{product.ep_belge_seviye}/5</span>
                </div>
              )}

              {/* Doğrulanmış belgeler */}
              {epDocs && epDocs.length > 0 && (
                <div className="mt-5 pt-5 border-t border-slate-200">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Doğrulanmış Belgeler</p>
                  <div className="flex flex-wrap gap-2">
                    {epDocs.map((d, i) => (
                      <span key={i} className="text-xs bg-[#10876B]/10 text-[#10876B] px-2.5 py-1 rounded-full font-semibold border border-[#10876B]/20">
                        ✓ {DOC_LABELS[d.document_type] ?? d.document_type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sağ: Detaylar */}
          <div>
            {product.category && (
              <span className="text-sm text-[#8B7339] font-semibold uppercase tracking-[0.18em]">
                {CATEGORY_LABELS[product.category] ?? product.category}
              </span>
            )}
            <h1 className="text-3xl font-black text-slate-900 mt-2 mb-3">{product.name}</h1>

            {product.vendors?.company_name && (
              <p className="text-slate-500 text-sm mb-4">
                İş Ortağı:{' '}
                <Link href={`/estestore/satici/${product.vendor_id}`}
                  className="text-[#8B7339] hover:text-[#C9A961] transition-colors font-medium">
                  {product.vendors.company_name}
                </Link>
              </p>
            )}

            {/* ÜTS kayıt numarası — her ürün ÜTS kayıtlı. Marka vaadi: orijinallik. */}
            {product.uts_no && (
              <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 bg-[#10876B]/10 border border-[#10876B]/25 rounded-full">
                <span className="text-[#10876B] text-sm font-bold">✓ ÜTS Kayıtlı</span>
                <span className="text-slate-500 text-xs tabular-nums">No: {product.uts_no}</span>
              </div>
            )}

            {product.description && (
              <p className="text-slate-700 leading-relaxed mb-6">{product.description}</p>
            )}

            {product.ingredients?.length > 0 && (
              <div className="mb-6">
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">İçerikler / Bileşenler</p>
                <div className="flex flex-wrap gap-2">
                  {product.ingredients.map((ing: string) => (
                    <span key={ing} className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.price && (
              <div className="flex items-center justify-between p-5 bg-[#FAFAF7] border border-slate-200 rounded-2xl mb-4">
                <span className="text-slate-500 text-sm">Fiyat</span>
                <span className="text-slate-900 font-black text-2xl">₺{Number(product.price).toLocaleString('tr-TR')}</span>
              </div>
            )}

            {product.treatment_type === 'treatment' ? (
              <Link href="/esteklinik"
                className="w-full flex items-center justify-center py-4 bg-[#10876B] hover:bg-[#0d6f57] text-white font-bold rounded-xl transition-all text-base">
                Bu İşlem İçin Randevu Al →
              </Link>
            ) : (
              <>
                <div className="flex items-stretch gap-2">
                  <div className="flex-1">
                    <AddToCartButton
                      fullWidth
                      product={{
                        productId: product.id,
                        name: product.name,
                        slug: product.slug ?? null,
                        price: Number(product.price ?? 0),
                        image: product.images?.[0] ?? null,
                        vendorId: product.vendor_id ?? null,
                        vendorName: (product.vendors as { company_name?: string } | null)?.company_name ?? null,
                      }}
                      disabled={!product.price || (product.stock != null && product.stock < 1)}
                    />
                  </div>
                  <WishlistButton
                    productId={product.id}
                    initialInWishlist={isInWishlist}
                    loginRedirect={`/estestore/${product.slug ?? product.id}`}
                    variant="inline"
                  />
                </div>
                {product.stock != null && product.stock < 1 && (
                  <p className="text-red-500 text-sm text-center mt-3">Stokta yok</p>
                )}
                {product.stock != null && product.stock > 0 && product.stock < 10 && (
                  <p className="text-[#8B7339] text-sm text-center mt-3">Son {product.stock} adet</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Müşteri Değerlendirmeleri — birleştirilmiş (ep_reviews + legacy reviews) */}
        <div className="mt-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-slate-900 font-bold text-xl">
              Müşteri Değerlendirmeleri <span className="text-slate-400 font-normal text-base">({totalReviewCount})</span>
            </h2>
            {avgUserScore !== null && (
              <div className="flex items-center gap-2">
                <span className="text-[#8B7339] font-black text-2xl">{avgUserScore.toFixed(1)}</span>
                <span className="text-slate-400 text-sm">/10 ortalama</span>
              </div>
            )}
          </div>

          {user ? (
            <ReviewForm
              productId={product.id}
              existing={userEpReview ? {
                qEtkinlik:    userEpReview.q_etkinlik,
                qSosyalKanit: userEpReview.q_sosyal_kanit,
                qGuvenlik:    userEpReview.q_guvenlik,
                qEtkiSuresi:  userEpReview.q_etki_suresi,
                qKullanim:    userEpReview.q_kullanim,
                title:        userEpReview.title,
                comment:      userEpReview.comment,
              } : null}
            />
          ) : (
            <div className="p-5 bg-[#FAFAF7] border border-slate-200 rounded-2xl mb-6 text-center">
              <p className="text-slate-600 text-sm">
                Bu ürünü değerlendirmek için{' '}
                <SafeLink href={`/giris?g=estestore&next=/estestore/${product.slug ?? product.id}`} className="text-[#8B7339] hover:text-[#C9A961] font-semibold">giriş yap</SafeLink>
              </p>
            </div>
          )}

          <div className="space-y-4 mt-6">
            {/* EP review'ları */}
            {epReviews && epReviews.length > 0 && epReviews.map(r => {
              const score = Number(r.baz_score ?? 0)
              return (
                <div key={r.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-900 font-semibold text-sm">
                          {(r.profiles as { full_name?: string } | null)?.full_name ?? 'Kullanıcı'}
                        </span>
                        {r.is_verified_purchase && (
                          <span className="text-sm bg-[#10876B]/15 text-[#10876B] px-2 py-0.5 rounded-full font-semibold">
                            ✓ Doğrulanmış Alışveriş
                          </span>
                        )}
                      </div>
                      {r.title && <p className="text-slate-900 font-bold text-base mt-1">{r.title}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-black text-lg ${
                        score >= 9 ? 'text-[#10876B]' :
                        score >= 7 ? 'text-[#8B7339]' : 'text-red-500'
                      }`}>{score.toFixed(1)}</span>
                      <span className="text-slate-400 text-sm">/10</span>
                    </div>
                  </div>

                  {/* 5 başlık × yıldız mini-rozet */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                    {[
                      ['Etkinlik', r.q_etkinlik],
                      ['Sosyal',   r.q_sosyal_kanit],
                      ['Güvenlik', r.q_guvenlik],
                      ['Süre',     r.q_etki_suresi],
                      ['Kullanım', r.q_kullanim],
                    ].map(([label, val]) => (
                      <div key={label as string} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-slate-500">{label as string}</span>
                        <span className="text-[#C9A961] font-bold">{'★'.repeat(Number(val))}<span className="text-slate-300">{'★'.repeat(5 - Number(val))}</span></span>
                      </div>
                    ))}
                  </div>

                  {r.comment && <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{r.comment}</p>}
                  <p className="text-slate-400 text-sm mt-3">
                    {new Date(r.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )
            })}

            {/* Legacy reviews (eski tablo) — geriye dönük gösterim */}
            {legacyReviews && legacyReviews.length > 0 && legacyReviews.map(review => (
              <div key={review.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-900 font-medium text-sm">
                        {(review.profiles as { full_name?: string } | null)?.full_name ?? 'Kullanıcı'}
                      </span>
                      {review.is_verified && (
                        <span className="text-sm bg-[#10876B]/15 text-[#10876B] px-2 py-0.5 rounded-full font-semibold">✓ Doğrulanmış</span>
                      )}
                      <span className="text-sm bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">eski format</span>
                    </div>
                    {review.title && <p className="text-slate-700 text-sm font-medium mt-1">{review.title}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-black text-lg ${
                      Number(review.rating) >= 9 ? 'text-[#10876B]' :
                      Number(review.rating) >= 7 ? 'text-[#8B7339]' : 'text-red-500'
                    }`}>{Number(review.rating).toFixed(1)}</span>
                    <span className="text-slate-400 text-sm">/10</span>
                  </div>
                </div>
                {review.body && <p className="text-slate-600 text-sm leading-relaxed">{review.body}</p>}
                <p className="text-slate-400 text-sm mt-3">
                  {new Date(review.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {/* Satıcı yanıtı (legacy) */}
                {(review as { vendor_response?: string | null; vendor_responded_at?: string | null }).vendor_response && (
                  <div className="mt-3 ml-4 pl-4 border-l-2 border-[#C9A961]/40 bg-[#C9A961]/5 rounded-r-lg py-2 px-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C9A961]/15 text-[#8B7339] text-xs font-bold">
                        ✓ Satıcı Yanıtı
                      </span>
                      {(review as { vendor_responded_at?: string }).vendor_responded_at && (
                        <span className="text-slate-500 text-xs">
                          {new Date((review as { vendor_responded_at: string }).vendor_responded_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {(review as { vendor_response: string }).vendor_response}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {totalReviewCount === 0 && (
              <div className="text-center py-10 text-slate-400">
                Henüz değerlendirme yok — ilk sen yap!
              </div>
            )}
          </div>
        </div>

        {/* Sorular & Cevaplar */}
        <div id="qa" className="max-w-6xl mx-auto px-4 sm:px-6 mt-14">
          <QaSection
            productId={product.id}
            productSlug={product.slug ?? null}
            questions={questions}
            currentUserId={user?.id ?? null}
            loginRedirect={`/estestore/${product.slug ?? product.id}#qa`}
          />
        </div>

        {/* Son baktıkların — localStorage'dan. Mobilde sticky CTA + bottom nav için bol pb. */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-14 pb-14 lg:pb-14" style={{ paddingBottom: 'calc(180px + env(safe-area-inset-bottom))' }}>
          <RecentlyViewedShelf excludeId={product.id} />
        </div>
      </div>

      {/* Mobile sticky bottom CTA — sadece mobil/app; tedavi randevu ürünleri için gizli */}
      {product.price && product.treatment_type !== 'treatment' && !(product.stock != null && product.stock < 1) && (
        <div
          className="lg:hidden fixed inset-x-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
          style={{ bottom: 'calc(60px + env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Fiyat</p>
              <p className="text-slate-900 font-black text-lg tabular-nums leading-tight">
                ₺{Number(product.price).toLocaleString('tr-TR')}
              </p>
            </div>
            <div className="shrink-0">
              <AddToCartButton
                product={{
                  productId: product.id,
                  name: product.name,
                  slug: product.slug ?? null,
                  price: Number(product.price ?? 0),
                  image: product.images?.[0] ?? null,
                  vendorId: product.vendor_id ?? null,
                  vendorName: (product.vendors as { company_name?: string } | null)?.company_name ?? null,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
