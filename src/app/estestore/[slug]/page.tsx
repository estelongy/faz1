export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReviewForm from './ReviewForm'
import AddToCartButton from '@/components/AddToCartButton'
import CartButton from '@/components/CartButton'

const SITE_URL = 'https://estelongy.com'

const CATEGORY_LABELS: Record<string, string> = {
  botox: 'Botoks', filler: 'Dolgu', mezo: 'Mezoterapi', laser: 'Lazer',
  gold_needle: 'Altın İğne', peeling: 'Peeling', serum: 'Serum',
  supplement: 'Takviye', device: 'Cihaz', other: 'Diğer',
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
  const description = truncated || `${p.name} — ${cat ?? 'estetik ürün'}${vendor ? ` · ${vendor}` : ''}. Estelongy Gençlik Puanı (EGP) ${p.final_score?.toFixed(1) ?? '—'}/10.`

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
      <span className="text-slate-500 text-xs w-32 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-900 font-bold text-sm w-8 text-right">{value.toFixed(1)}</span>
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

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, title, body, is_verified, created_at, user_id, profiles(full_name)')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const userReview = reviews?.find(r => r.user_id === user?.id)

  const avgUserScore = reviews && reviews.length > 0
    ? reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length
    : null

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

  if (avgUserScore && reviews && reviews.length > 0) {
    productJsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgUserScore.toFixed(1),
      reviewCount: reviews.length,
      bestRating: 10,
      worstRating: 0,
    }
    productJsonLd.review = reviews.slice(0, 5).map(r => ({
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
        item: `${SITE_URL}/estestore?kategori=${product.category}`,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <header className="sticky top-0 z-50 bg-[#0F172A] border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/estestore" className="text-slate-300 hover:text-white transition-colors text-sm shrink-0">← EsteStore</Link>
            <span className="text-slate-700">|</span>
            <span className="text-white text-sm font-medium truncate">{product.name}</span>
          </div>
          <CartButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 flex-wrap">
          <Link href="/estestore" className="hover:text-slate-900 font-semibold text-[#8B7339]">EsteStore</Link>
          {product.category && (
            <>
              <span>›</span>
              <span className="text-slate-700">{CATEGORY_LABELS[product.category] ?? product.category}</span>
            </>
          )}
          <span>›</span>
          <span className="text-slate-900 truncate font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">

          {/* Sol: Görsel + Puan */}
          <div>
            <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 h-80 flex items-center justify-center mb-6">
              {product.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-300 text-8xl">✦</div>
              )}
            </div>

            {/* Estelongy Gençlik Puanı */}
            <div className="bg-[#FAFAF7] border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-[0.18em] font-semibold mb-1">
                    Estelongy Gençlik Puanı
                  </p>
                  <div className="flex items-end gap-1">
                    <span className={`text-5xl font-black ${
                      (product.final_score ?? 0) >= 9 ? 'text-[#10876B]' :
                      (product.final_score ?? 0) >= 7 ? 'text-[#8B7339]' : 'text-red-500'
                    }`}>
                      {product.final_score ? product.final_score.toFixed(1) : '—'}
                    </span>
                    <span className="text-slate-400 text-lg mb-1">/10</span>
                  </div>
                </div>
                {product.preference_count > 0 && (
                  <div className="text-right">
                    <p className="text-slate-500 text-xs">Tercih</p>
                    <p className="text-slate-900 font-bold text-2xl">{product.preference_count}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <PuanBar label="Hekim Değerlendirmesi" value={product.doctor_score} />
                <PuanBar label="Kullanıcı Puanı" value={avgUserScore ?? product.user_score} />
                <PuanBar label="Bilimsel Belge" value={product.scientific_score} />
                <PuanBar label="Üretici/Marka" value={product.manufacturer_score} />
              </div>
            </div>
          </div>

          {/* Sağ: Detaylar */}
          <div>
            {product.category && (
              <span className="text-[10px] text-[#8B7339] font-semibold uppercase tracking-[0.18em]">
                {CATEGORY_LABELS[product.category] ?? product.category}
              </span>
            )}
            <h1 className="text-3xl font-black text-slate-900 mt-2 mb-3">{product.name}</h1>

            {product.vendors?.company_name && (
              <p className="text-slate-500 text-sm mb-4">
                Satıcı:{' '}
                <Link href={`/estestore/satici/${product.vendor_id}`}
                  className="text-[#8B7339] hover:text-[#C9A961] transition-colors font-medium">
                  {product.vendors.company_name}
                </Link>
              </p>
            )}

            {product.description && (
              <p className="text-slate-700 leading-relaxed mb-6">{product.description}</p>
            )}

            {product.ingredients?.length > 0 && (
              <div className="mb-6">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">İçerikler / Bileşenler</p>
                <div className="flex flex-wrap gap-2">
                  {product.ingredients.map((ing: string) => (
                    <span key={ing} className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
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
                className="w-full flex items-center justify-center py-4 bg-[#10876B] hover:bg-[#0d6f57] text-white font-bold rounded-xl transition-all text-sm">
                Bu İşlem İçin Randevu Al →
              </Link>
            ) : (
              <>
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
                {product.stock != null && product.stock < 1 && (
                  <p className="text-red-500 text-xs text-center mt-3">Stokta yok</p>
                )}
                {product.stock != null && product.stock > 0 && product.stock < 10 && (
                  <p className="text-[#8B7339] text-xs text-center mt-3">Son {product.stock} adet</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Deneyim Paylaşımları */}
        <div className="mt-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-slate-900 font-bold text-xl">
              Deneyimler <span className="text-slate-400 font-normal text-base">({reviews?.length ?? 0})</span>
            </h2>
            {avgUserScore && (
              <div className="flex items-center gap-2">
                <span className="text-[#8B7339] font-black text-2xl">{avgUserScore.toFixed(1)}</span>
                <span className="text-slate-400 text-sm">/10 ortalama</span>
              </div>
            )}
          </div>

          {user && !userReview && (
            <ReviewForm productId={product.id} />
          )}
          {!user && (
            <div className="p-5 bg-[#FAFAF7] border border-slate-200 rounded-2xl mb-6 text-center">
              <p className="text-slate-600 text-sm">
                Deneyimini paylaşmak için{' '}
                <Link href="/giris" className="text-[#8B7339] hover:text-[#C9A961] font-semibold">giriş yap</Link>
              </p>
            </div>
          )}

          <div className="space-y-4 mt-6">
            {reviews && reviews.length > 0 ? reviews.map(review => (
              <div key={review.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 font-medium text-sm">
                        {(review.profiles as { full_name?: string } | null)?.full_name ?? 'Kullanıcı'}
                      </span>
                      {review.is_verified && (
                        <span className="text-xs bg-[#10876B]/15 text-[#10876B] px-2 py-0.5 rounded-full font-semibold">Doğrulanmış</span>
                      )}
                    </div>
                    {review.title && <p className="text-slate-700 text-sm font-medium mt-1">{review.title}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-black text-lg ${
                      Number(review.rating) >= 9 ? 'text-[#10876B]' :
                      Number(review.rating) >= 7 ? 'text-[#8B7339]' : 'text-red-500'
                    }`}>{Number(review.rating).toFixed(1)}</span>
                    <span className="text-slate-400 text-xs">/10</span>
                  </div>
                </div>
                {review.body && <p className="text-slate-600 text-sm leading-relaxed">{review.body}</p>}
                <p className="text-slate-400 text-xs mt-3">
                  {new Date(review.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )) : (
              <div className="text-center py-10 text-slate-400">
                Henüz deneyim paylaşılmamış — ilk sen paylaş!
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
