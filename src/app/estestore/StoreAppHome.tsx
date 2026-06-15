import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import { formatTRY } from '@/lib/estestore'
import ProductCard, { type ProductCardData } from './ProductCard'
import RecentlyViewedShelf from '@/components/RecentlyViewedShelf'
import AuthRefreshGate from '@/components/native/AuthRefreshGate'

/**
 * 18 hasta kategorisi (sıra: estestore_kategoriler memory'sine göre).
 * `slug` doluysa /estestore/kategori/[slug] sayfasına; yoksa /estestore/ara?q=
 * üzerinden arama. Backend SECTIONS'a kademe kademe geldikçe slug eklenir.
 */
const QUICK_CATEGORIES: { label: string; icon: string; slug?: string; q?: string }[] = [
  { label: 'Longevity',         icon: '⏳', slug: 'longevity' },
  { label: 'Biyohacking',       icon: '📊', slug: 'biyohacking-olcum' },
  { label: 'Anti-Aging',        icon: '✨', q: 'anti-aging' },
  { label: 'Cilt Bakımı',       icon: '🧴', q: 'cilt bakımı' },
  { label: 'Güneş Koruma',      icon: '☀️', q: 'güneş koruma' },
  { label: 'Göz Çevresi',       icon: '👁️', q: 'göz çevresi' },
  { label: 'Leke & Aydınlatma', icon: '🌟', q: 'leke aydınlatma' },
  { label: 'Hassas Cilt',       icon: '🌿', q: 'hassas cilt' },
  { label: 'İşlem Sonrası',     icon: '🩹', slug: 'islem-sonrasi' },
  { label: 'Cihazlar',          icon: '📱', q: 'cihaz' },
  { label: 'Dermo-Makyaj',      icon: '💄', q: 'makyaj' },
  { label: 'Vücut Bakımı',      icon: '🧖', q: 'vücut bakımı' },
  { label: 'Saç & Sakal',       icon: '💇', q: 'saç' },
  { label: 'Erkek Bakımı',      icon: '🧔', q: 'erkek' },
  { label: 'Suplement',         icon: '💊', q: 'suplement vitamin' },
  { label: 'Diş & Ağız',        icon: '🦷', q: 'diş ağız' },
  { label: 'Kişisel Kullanım',  icon: '🧴', q: 'kişisel kullanım' },
  { label: 'Hediye Setleri',    icon: '🎁', q: 'set' },
]

/**
 * EsteStore app-özel EV ekranı (App Başrol Modeli — Stage 2).
 *
 * Sadece EsteStore FLAVOR app'inde /estestore'da render edilir (UA'dan server
 * tespiti). Web ve diğer flavor'lar mevcut vitrini görür. Fikir: web'de gömülü
 * kalan başrol-değerini yüzeye çıkarmak — "tekrar sipariş", "son baktıkların",
 * kişiye yönelik seçkiler. Dark cinematic vitrin hero'su yerine sakin "senin
 * için" ev'i.
 */
export interface ReorderItem {
  id: string
  name: string
  slug: string | null
  image: string | null
  price: number
}

function ShelfHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="text-lg font-bold text-slate-900 tracking-[-0.01em]">{title}</h2>
      <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-[#8B7339]">
        Tümü <ArrowRight size={14} />
      </Link>
    </div>
  )
}

function Shelf({
  title,
  href,
  products,
  isPro,
  wishlistSet,
}: {
  title: string
  href: string
  products: ProductCardData[]
  isPro: boolean
  wishlistSet: Set<string>
}) {
  if (products.length === 0) return null
  return (
    <section className="px-5 py-3">
      <ShelfHeader title={title} href={href} />
      <div className="grid grid-cols-2 gap-3">
        {products.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} isPro={isPro} showPrice inWishlist={wishlistSet.has(p.id)} />
        ))}
      </div>
    </section>
  )
}

export default function StoreAppHome({
  userName,
  serverAuthed,
  reorder,
  longevity,
  islemSonrasi,
  biyohacking,
  isPro,
  wishlistSet,
}: {
  userName: string | null
  serverAuthed: boolean
  reorder: ReorderItem[]
  longevity: ProductCardData[]
  islemSonrasi: ProductCardData[]
  biyohacking: ProductCardData[]
  isPro: boolean
  wishlistSet: Set<string>
}) {
  return (
    <div className="bg-white pb-6">
      {/* Cold-start auth race: server guest gördüyse ama client girişliyse tazele */}
      <AuthRefreshGate serverAuthed={serverAuthed} />
      {/* Sakin "senin için" ev başlığı — dark cinematic vitrin yerine */}
      <section className="px-5 pt-4 pb-3">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#8B7339]">EsteStore</p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-[-0.01em]">
          {userName ? `Merhaba, ${userName}` : 'Senin için'}
        </h1>
        <p className="text-slate-600 text-sm mt-1">Estelongy Puanlı seçkiler · kaldığın yerden devam</p>
      </section>

      {/* Arama hero — kullanıcı en sık "şu ürünü ara" akışı için */}
      <section className="px-5 pb-3">
        <form action="/estestore/ara" method="GET" className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            name="q"
            placeholder="Krem, takviye, cihaz ara..."
            className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#C9A961] focus:bg-white transition-colors"
            aria-label="Ürün arama"
          />
        </form>
      </section>

      {/* Kategori şeridi — 18 kategori yatay scroll */}
      <section className="pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-2 snap-x">
          {QUICK_CATEGORIES.map((c) => {
            const href = c.slug
              ? `/estestore/kategori/${c.slug}`
              : `/estestore/ara?q=${encodeURIComponent(c.q ?? c.label)}`
            return (
              <Link
                key={c.label}
                href={href}
                className="shrink-0 snap-start flex flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white active:bg-slate-50 py-2.5 px-3 min-w-[78px] transition-colors"
              >
                <span className="text-xl leading-none">{c.icon}</span>
                <span className="text-[10.5px] font-semibold text-slate-700 text-center leading-tight whitespace-nowrap">{c.label}</span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Tekrar Sipariş — web'de "Siparişlerim"de gömülü; app'te öne çıkar */}
      {reorder.length > 0 && (
        <section className="px-5 py-3">
          <h2 className="text-lg font-bold text-slate-900 tracking-[-0.01em] mb-3">Tekrar Sipariş Ver</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
            {reorder.map((p) => {
              const initial = (p.name?.trim()[0] ?? '✦').toUpperCase()
              return (
                <Link
                  key={p.id}
                  href={`/estestore/${p.slug ?? p.id}`}
                  className="shrink-0 w-32 rounded-xl border border-slate-200 bg-white overflow-hidden active:bg-slate-50 transition-colors"
                >
                  <div className="aspect-square bg-gradient-to-br from-[#FAFAF7] via-white to-[#F5F0E5] overflow-hidden">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(201,169,97,0.10),transparent_55%)]" />
                        <span className="relative font-black text-[#8B7339]/30 select-none leading-none text-[56px] tracking-tight">
                          {initial}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug mb-1">{p.name}</p>
                    <p className="text-xs font-bold text-[#8B7339]">{formatTRY(p.price)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Son baktıkların (client, localStorage) */}
      <div className="px-5 py-3">
        <RecentlyViewedShelf limit={6} />
      </div>

      {/* Küratörlü raflar — başrol seçkileri */}
      <Shelf title="Longevity" href="/estestore/kategori/longevity" products={longevity} isPro={isPro} wishlistSet={wishlistSet} />
      <Shelf title="Kliniğinden sonrası" href="/estestore/kategori/islem-sonrasi" products={islemSonrasi} isPro={isPro} wishlistSet={wishlistSet} />
      <Shelf title="Biyohacking & Ölçüm" href="/estestore/kategori/biyohacking-olcum" products={biyohacking} isPro={isPro} wishlistSet={wishlistSet} />
    </div>
  )
}
