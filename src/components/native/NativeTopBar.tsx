'use client'

import { usePathname } from 'next/navigation'
import SafeLink from '@/components/SafeLink'
import { useIsNativeApp } from './useIsNativeApp'

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
}

export default function NativeTopBar() {
  const isApp = useIsNativeApp()
  const pathname = usePathname()

  if (!isApp) return null

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

  return (
    <header
      className="app-only fixed top-0 inset-x-0 z-[45] bg-[#160F28]/95 backdrop-blur-lg border-b border-violet-500/15"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="h-14 flex items-center px-3">
        <SafeLink
          href={entry.back}
          aria-label="Geri"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-200 active:bg-white/10 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </SafeLink>
        <span className="flex-1 text-center text-white font-semibold text-base pr-9 truncate">
          {entry.title}
        </span>
      </div>
    </header>
  )
}
