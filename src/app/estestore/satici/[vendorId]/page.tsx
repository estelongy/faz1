export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VendorReviewForm from './VendorReviewForm'
import SafeLink from '@/components/SafeLink'

export async function generateMetadata({ params }: { params: Promise<{ vendorId: string }> }): Promise<Metadata> {
  const { vendorId } = await params
  const supabase = await createClient()
  const { data: vendor } = await supabase
    .from('vendors')
    .select('company_name')
    .eq('id', vendorId)
    .single()
  return {
    title: vendor?.company_name ? `${vendor.company_name} — EsteStore` : 'İş Ortağı',
  }
}

// EsteStore ana kategori (DB enum) etiketleri.
// Alt-kategori detayı ürün kartında ayrıca göstermek yerine ana kategori burada yeterli.
const CATEGORY_LABELS: Record<string, string> = {
  kozmetik:      'Kozmetik',
  sarf_medikal:  'Sarf & Medikal',
  // Legacy fallback
  botox: 'Botoks', filler: 'Dolgu', mezo: 'Mezoterapi', laser: 'Lazer',
  gold_needle: 'Altın İğne', peeling: 'Peeling', serum: 'Serum',
  supplement: 'Takviye', device: 'Cihaz', other: 'Diğer',
}

export default async function SaticiMagazaPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params
  const supabase = await createClient()

  const { data: vendor } = await supabase
    .from('vendors')
    .select(`
      id, company_name, approval_status,
      logo_url, banner_url, tagline, about_text, social_links
    `)
    .eq('id', vendorId)
    .eq('approval_status', 'approved')
    .single()

  if (!vendor) notFound()

  const social = (vendor.social_links as Record<string, string> | null) ?? {}
  const socialEntries = Object.entries(social).filter(([, v]) => !!v)

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, description, category, price, final_score, preference_count, treatment_type, images')
    .eq('vendor_id', vendor.id)
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .order('final_score', { ascending: false })

  const totalProducts = products?.length ?? 0
  const avgScore = products && products.length > 0
    ? products.reduce((s, p) => s + Number(p.final_score ?? 0), 0) / products.length
    : null

  // Vendor reviews
  const { data: vendorReviews } = await supabase
    .from('vendor_reviews')
    .select('id, rating, title, body, created_at, user_id, profiles(full_name)')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const reviewCount = vendorReviews?.length ?? 0
  const avgRating = reviewCount > 0
    ? (vendorReviews ?? []).reduce((s, r) => s + Number(r.rating ?? 0), 0) / reviewCount
    : null

  // Mevcut kullanıcı
  const { data: { user } } = await supabase.auth.getUser()
  const myReview = user
    ? (vendorReviews ?? []).find(r => r.user_id === user.id) ?? null
    : null

  // Kullanıcı bu satıcıdan paid sipariş geçmişine sahip mi?
  let canReview = false
  if (user) {
    const { data: oi } = await supabase
      .from('order_items')
      .select('id, orders!inner(payment_status, user_id)')
      .eq('vendor_id', vendor.id)
      .eq('orders.payment_status', 'paid')
      .eq('orders.user_id', user.id)
      .limit(1)
    canReview = (oi?.length ?? 0) > 0
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="app-only" aria-hidden style={{ height: 'calc(56px + env(safe-area-inset-top))' }} />
      <header className="web-only sticky top-0 z-50 bg-[#0F172A] border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/estestore" className="text-slate-300 hover:text-white transition-colors text-base font-semibold">← EsteStore</Link>
          <span className="text-slate-700">|</span>
          <span className="text-white text-base font-bold truncate">{vendor.company_name}</span>
        </div>
      </header>

      {/* Banner (vendor branded ya da default gradient) */}
      {vendor.banner_url ? (
        <div className="w-full h-48 sm:h-64 lg:h-72 overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={vendor.banner_url} alt={`${vendor.company_name} banner`}
            className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-32 bg-gradient-to-r from-[#C9A961]/30 via-[#C9A961]/15 to-[#8B7339]/20" />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        {/* Vendor profil kartı — logo + ad + tagline */}
        <div className="-mt-12 sm:-mt-16 mb-6 sm:mb-10">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-900/5 p-6 sm:p-8">
            <div className="flex items-start gap-4 sm:gap-5 flex-wrap">
              {/* Logo veya default kutusu */}
              <div className="shrink-0 -mt-12 sm:-mt-16 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white border-4 border-white shadow-lg">
                {vendor.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vendor.logo_url} alt={`${vendor.company_name} logo`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#C9A961] to-[#8B7339] flex items-center justify-center text-white text-3xl font-black">
                    {vendor.company_name?.[0]?.toUpperCase() ?? '✦'}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-[260px]">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#8B7339] mb-1">Estelongy Onaylı İş Ortağı</p>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-[-0.02em]">{vendor.company_name}</h1>
                {vendor.tagline && (
                  <p className="text-slate-600 text-base mt-2 leading-snug">{vendor.tagline}</p>
                )}

                {/* Sosyal linkler */}
                {socialEntries.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {socialEntries.map(([k, v]) => (
                      <a key={k} href={v} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-[#C9A961]/15 border border-slate-200 hover:border-[#C9A961]/40 text-slate-700 hover:text-[#8B7339] text-sm font-semibold transition-colors">
                        {socialIcon(k)} {socialLabel(k)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* İstatistikler */}
            <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-slate-100">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Ürün Sayısı</p>
                <p className="text-slate-900 font-black text-xl mt-1">{totalProducts}</p>
              </div>
              {avgScore !== null && (
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Ortalama EP</p>
                  <p className={`font-black text-xl mt-1 ${
                    avgScore >= 9 ? 'text-[#10876B]' : avgScore >= 7 ? 'text-[#8B7339]' : 'text-red-500'
                  }`}>
                    {avgScore.toFixed(1)}<span className="text-slate-400 text-sm font-bold ml-0.5">/10</span>
                  </p>
                </div>
              )}
              {avgRating !== null && (
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Müşteri Puanı</p>
                  <p className="text-slate-900 font-black text-xl mt-1">
                    <span className="text-[#C9A961]">★</span> {avgRating.toFixed(1)}
                    <span className="text-slate-400 text-sm font-bold ml-1">({reviewCount})</span>
                  </p>
                </div>
              )}
            </div>

            {/* Hakkımızda */}
            {vendor.about_text && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Hakkımızda</p>
                <p className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap">
                  {vendor.about_text}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Ürünler */}
        {products && products.length > 0 ? (
          <>
            <h2 className="text-slate-900 font-bold text-xl mb-4 tracking-[-0.01em]">Ürünler <span className="text-slate-400 font-medium">({totalProducts})</span></h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map(p => (
                <Link key={p.id} href={`/estestore/${p.slug ?? p.id}`}
                  className="group bg-white border border-slate-200 hover:border-[#C9A961]/60 rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-0.5">
                  <div className="h-44 bg-slate-100 flex items-center justify-center relative">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-300 text-5xl">✦</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-slate-900 font-semibold text-base group-hover:text-[#8B7339] transition-colors line-clamp-2 leading-snug">{p.name}</h3>
                    {p.category && (
                      <p className="text-sm font-bold text-slate-500 mt-1">{CATEGORY_LABELS[p.category] ?? p.category}</p>
                    )}
                    <div className="flex items-end justify-between mt-3">
                      {p.price && (
                        <span className="text-slate-900 font-black text-base">₺{Number(p.price).toLocaleString('tr-TR')}</span>
                      )}
                      {p.final_score && (
                        <span className={`font-bold text-sm ${
                          p.final_score >= 9 ? 'text-[#10876B]' :
                          p.final_score >= 7 ? 'text-[#8B7339]' : 'text-red-500'
                        }`}>★ {Number(p.final_score).toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4 text-slate-300">📦</div>
            <p className="text-base font-semibold text-slate-500">Bu mağazada henüz aktif ürün yok</p>
          </div>
        )}

        {/* Müşteri Yorumları */}
        <div className="mt-16 space-y-6">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="text-slate-900 font-bold text-xl tracking-[-0.01em]">
              Müşteri Yorumları
              {reviewCount > 0 && (
                <span className="text-slate-400 font-medium ml-2">({reviewCount})</span>
              )}
            </h2>
            {avgRating !== null && (
              <div className="text-base font-semibold text-slate-700">
                <span className="text-[#C9A961] text-lg">★</span> {avgRating.toFixed(1)} / 5
              </div>
            )}
          </div>

          {/* Yorum formu — sadece bu satıcıdan sipariş veren kullanıcı */}
          {user && canReview && (
            <VendorReviewForm
              vendorId={vendor.id}
              existing={myReview ? { rating: myReview.rating, title: myReview.title, body: myReview.body } : null}
            />
          )}
          {user && !canReview && !myReview && (
            <div className="p-4 bg-[#FAFAF7] border border-slate-200 rounded-2xl text-sm text-slate-600">
              Bu satıcıyı puanlayabilmek için önce bir sipariş tamamlamalısın.
            </div>
          )}
          {!user && (
            <div className="p-4 bg-[#FAFAF7] border border-slate-200 rounded-2xl text-sm text-slate-600 text-center">
              Bu satıcıyı puanlamak için{' '}
              <SafeLink href={`/giris?g=estestore&next=/estestore/satici/${vendor.id}`} className="text-[#8B7339] hover:text-[#C9A961] font-semibold">giriş yap</SafeLink>
            </div>
          )}

          {/* Yorum listesi */}
          <div className="space-y-3">
            {(vendorReviews ?? []).length === 0 ? (
              <p className="text-center py-10 text-slate-400 text-sm">Henüz yorum yok — ilk yorumu sen yap!</p>
            ) : (
              (vendorReviews ?? []).map(r => (
                <div key={r.id} className="p-5 bg-white border border-slate-200 rounded-2xl">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div>
                      <p className="text-slate-900 font-semibold text-sm">
                        {(r.profiles as { full_name?: string } | null)?.full_name ?? 'Kullanıcı'}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <span key={n} className={`text-base ${n <= r.rating ? 'text-[#C9A961]' : 'text-slate-300'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm shrink-0">
                      {new Date(r.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {r.title && <p className="text-slate-900 font-semibold text-base mb-1">{r.title}</p>}
                  {r.body && <p className="text-slate-700 text-sm leading-relaxed">{r.body}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function socialLabel(k: string): string {
  switch (k) {
    case 'website':   return 'Web'
    case 'instagram': return 'Instagram'
    case 'youtube':   return 'YouTube'
    case 'twitter':   return 'X (Twitter)'
    case 'tiktok':    return 'TikTok'
    default:          return k
  }
}

function socialIcon(k: string): string {
  switch (k) {
    case 'website':   return '🌐'
    case 'instagram': return '📷'
    case 'youtube':   return '▶'
    case 'twitter':   return '𝕏'
    case 'tiktok':    return '🎵'
    default:          return '🔗'
  }
}
