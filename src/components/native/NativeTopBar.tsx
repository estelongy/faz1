'use client'

import { usePathname } from 'next/navigation'
import SafeLink from '@/components/SafeLink'
import { useIsNativeApp } from './useIsNativeApp'
import { useCart } from '@/lib/cart'
import { useFlavor, FLAVOR_HOME } from './flavor'

/**
 * App içinde TÜM detay sayfalarının ince native geri-bar'ı.
 *
 * Web'de null render eder (tarayıcıda her sayfa kendi web header'ını gösterir).
 * App içinde sayfa-özel web header'ları `web-only` ile gizlenir; onların yerine
 * bu tek, tutarlı koyu app çubuğu geçer: ‹ geri + ortada başlık. Estelongy web
 * markası / menüsü yok → "web sitesi" hissi gider.
 *
 * Ana ekran (/biyoage) haritada YOK → orada AppHome tam ekran kalır, bar çıkmaz.
 * z-index anket/kart modallarının (z-50) ALTINDA (z-45) → modal açıkken bar örtülür.
 *
 * FLAVOR farkındalığı (App Başrol Modeli): MAP'teki `back: '/biyoage'` artık
 * "ev" sentinel'idir — runtime'da aktif flavor'ın evine çözülür. Böylece klinik
 * app'inde her şeyin geri-oku /esteklinik'e gider. Flavor'ın kendi galaksi
 * landing'i (ev) bar göstermez → o app'in tam-ekran ana ekranıdır.
 */
const MAP: Record<string, { title: string; back: string }> = {
  '/analiz': { title: 'Analiz', back: '/biyoage' },
  '/skor': { title: 'Skor Merkezi', back: '/biyoage' },
  '/panel': { title: 'Panelim', back: '/biyoage' },
  '/panel/hesabim': { title: 'Hesabım', back: '/panel' },
  '/panel/analizlerim': { title: 'Geçmişim', back: '/panel' },
  '/panel/siparislerim': { title: 'Siparişlerim', back: '/panel' },
  '/panel/favorilerim': { title: 'Favorilerim', back: '/panel' },
  '/panel/iadelerim': { title: 'İadelerim', back: '/panel' },
  '/panel/adreslerim': { title: 'Adreslerim', back: '/panel' },
  '/panel/yorumlarim': { title: 'Deneyim', back: '/panel' },
  '/panel/referral': { title: 'Davet & Puan', back: '/panel' },
  '/panel/leaderboard': { title: 'Sıralama', back: '/panel' },
  // EsteKlinik galaksisi (app içinde ışınlanılan dünya)
  '/esteklinik': { title: 'Klinikler', back: '/biyoage' },
  '/esteklinik/basvur': { title: 'Klinik Başvuru', back: '/esteklinik' },
  // EsteStore galaksisi (app içinde ışınlanılan dünya)
  '/estestore': { title: 'Mağaza', back: '/biyoage' },
  '/estestore/ara': { title: 'Ürün Ara', back: '/estestore' },
  '/sepet': { title: 'Sepetim', back: '/estestore' },
}

export default function NativeTopBar() {
  const isApp = useIsNativeApp()
  const flavor = useFlavor()
  const pathname = usePathname()
  const { count, hydrated } = useCart()

  if (!isApp) return null

  // Flavor'ın evi (başrol galaksi landing'i) = tam ekran, bar yok.
  const home = FLAVOR_HOME[flavor]
  if (pathname === home) return null

  let entry = MAP[pathname]
  // Dinamik derin rotalar (id'li): başlığı prefix'ten türet
  if (!entry && pathname.startsWith('/panel/degerlendir/'))
    entry = { title: 'Deneyimini Paylaş', back: '/panel/analizlerim' }
  if (!entry && pathname.startsWith('/panel/urun-degerlendir/'))
    entry = { title: 'Ürünü Değerlendir', back: '/panel/siparislerim' }
  // EsteKlinik derin rotaları (özelden genele sırayla)
  if (!entry && pathname.startsWith('/esteklinik/randevu/'))
    entry = { title: 'Randevu', back: '/esteklinik' }
  if (!entry && pathname.startsWith('/esteklinik/'))
    entry = { title: 'Klinik', back: '/esteklinik' }
  // EsteStore derin rotaları (özelden genele sırayla)
  if (!entry && pathname.startsWith('/estestore/kategori/'))
    entry = { title: 'Kategori', back: '/estestore' }
  if (!entry && pathname.startsWith('/estestore/satici/'))
    entry = { title: 'Satıcı', back: '/estestore' }
  if (!entry && pathname.startsWith('/estestore/'))
    entry = { title: 'Ürün', back: '/estestore' }
  // Haritada olmayan diğer derin /panel/* rotaları: yine de geri-bar (Panel'e dön)
  if (!entry && pathname.startsWith('/panel/')) entry = { title: '', back: '/panel' }
  if (!entry) return null

  // "/biyoage" back sentinel'i = ev → aktif flavor'ın evine çöz.
  const back = entry.back === '/biyoage' ? home : entry.back

  // Sepet erişimi yalnızca mağaza rotalarında (web header'ı gizlediğimiz için
  // CartButton kayboldu — native bar'ın sağına taşıdık). /sepet'teyken gösterme.
  const showCart = pathname.startsWith('/estestore')

  return (
    <header
      className="app-only fixed top-0 inset-x-0 z-[45] bg-[#160F28]/95 backdrop-blur-lg border-b border-violet-500/15"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="h-14 flex items-center px-3">
        <SafeLink
          href={back}
          aria-label="Geri"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-200 active:bg-white/10 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </SafeLink>
        <span className={`flex-1 text-center text-white font-semibold text-base truncate ${showCart ? '' : 'pr-9'}`}>
          {entry.title}
        </span>
        {showCart && (
          <SafeLink
            href="/sepet"
            aria-label="Sepetim"
            className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-200 active:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {hydrated && count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#C9A961] text-[#160F28] text-[10px] font-black rounded-full min-w-[17px] h-[17px] flex items-center justify-center px-1">
                {count}
              </span>
            )}
          </SafeLink>
        )}
      </div>
    </header>
  )
}
