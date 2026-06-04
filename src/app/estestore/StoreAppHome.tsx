import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatTRY } from '@/lib/estestore'
import ProductCard, { type ProductCardData } from './ProductCard'
import RecentlyViewedShelf from '@/components/RecentlyViewedShelf'
import AuthRefreshGate from '@/components/native/AuthRefreshGate'

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
      <section className="px-5 pt-4 pb-1">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#8B7339]">EsteStore</p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-[-0.01em]">
          {userName ? `Merhaba, ${userName}` : 'Senin için'}
        </h1>
        <p className="text-slate-600 text-sm mt-1">Estelongy Puanlı seçkiler · kaldığın yerden devam</p>
      </section>

      {/* Tekrar Sipariş — web'de "Siparişlerim"de gömülü; app'te öne çıkar */}
      {reorder.length > 0 && (
        <section className="px-5 py-3">
          <h2 className="text-lg font-bold text-slate-900 tracking-[-0.01em] mb-3">Tekrar Sipariş Ver</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
            {reorder.map((p) => (
              <Link
                key={p.id}
                href={`/estestore/${p.slug ?? p.id}`}
                className="shrink-0 w-32 rounded-xl border border-slate-200 bg-white overflow-hidden active:bg-slate-50 transition-colors"
              >
                <div className="aspect-square bg-slate-50 overflow-hidden">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🧴</div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug mb-1">{p.name}</p>
                  <p className="text-xs font-bold text-[#8B7339]">{formatTRY(p.price)}</p>
                </div>
              </Link>
            ))}
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
