'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { Store, Sparkles, BarChart3 } from 'lucide-react'

interface AppPlugin {
  addListener: (event: 'backButton', cb: () => void) => Promise<{ remove?: () => void }> | { remove?: () => void }
  exitApp?: () => Promise<void>
}

interface Slide {
  Icon: typeof Store
  title: string
  body: string
}

const SLIDES: Slide[] = [
  {
    Icon: Store,
    title: 'EsteStore nedir?',
    body: 'Sağlıklı yaş alma ve genç görünmek için ÜTS kayıtlı ürünlerin satıldığı küratörlü pazaryeri.',
  },
  {
    Icon: Sparkles,
    title: 'Estelongy felsefesi',
    body: '"Genç görünmek değil, sağlıklı görünmek." EsteStore bu çatının vitrini — her ürün EP (Estelongy Güzellik Puanı) eşiğinden geçer: bilim · üretici · hekim · longevity katkısı.',
  },
  {
    Icon: BarChart3,
    title: 'Performans skoruyla büyü',
    body: 'Kargo hızı · iade oranı · müşteri puanı · yanıt oranı — 5 metrikten A-F karne. Skorun arttıkça vitrindeki öncelik artar.',
  },
]

const ALT_APPS = [
  { name: 'BiyoAGE', tag: 'Görünüm yaşını hemen öğren', href: 'https://play.google.com/store/apps/details?id=com.estelongy.biyoage' },
  { name: 'EsteKlinik', tag: 'Bilimi güzelliğe dönüştüren uzmanı bul', href: 'https://play.google.com/store/apps/details?id=com.estelongy.esteklinik' },
  { name: 'EsteStore', tag: 'Sana özel ürünü al', href: 'https://play.google.com/store/apps/details?id=com.estelongy.estestore' },
]

function setOnboardCookie() {
  document.cookie = `eg_onboard_seen=1; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
}

export default function KarsilamaSlider() {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [idx, setIdx] = useState(0)
  const [showExit, setShowExit] = useState(false)

  // Android geri tuşu: çıkış onayı. Capacitor injected global'i kullanırız
  // (npm paketi web tarafına yüklü değil). Native değilse no-op.
  useEffect(() => {
    const Cap = (window as unknown as { Capacitor?: { Plugins?: { App?: AppPlugin } } }).Capacitor
    const App = Cap?.Plugins?.App
    if (!App?.addListener) return
    let handle: { remove?: () => void } | undefined
    Promise.resolve(App.addListener('backButton', () => setShowExit(true)))
      .then(h => { handle = h })
      .catch(() => { /* ignore */ })
    return () => { handle?.remove?.() }
  }, [])

  async function confirmExit() {
    const Cap = (window as unknown as { Capacitor?: { Plugins?: { App?: AppPlugin } } }).Capacitor
    try { await Cap?.Plugins?.App?.exitApp?.() } catch { /* noop */ }
  }

  function onScroll() {
    const el = trackRef.current
    if (!el) return
    const newIdx = Math.round(el.scrollLeft / el.clientWidth)
    if (newIdx !== idx) setIdx(newIdx)
  }

  function jumpTo(i: number) {
    const el = trackRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div
      className="min-h-screen bg-slate-950 text-white flex flex-col"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
      }}
    >
      {/* Marka rozeti — PRO vurgusu */}
      <header className="px-5 pt-4 pb-2 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.22em] font-bold flex items-baseline gap-1">
          <span className="text-slate-400">EsteStore</span>
          <span className="text-amber-400 text-sm tracking-[0.3em]">PRO</span>
        </p>
        <button
          onClick={() => jumpTo(SLIDES.length - 1)}
          className="text-xs text-slate-500 active:text-slate-300"
        >
          Geç
        </button>
      </header>

      {/* Yatay swipe slaytlar */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {SLIDES.map((s, i) => (
          <section
            key={i}
            className="shrink-0 w-full snap-center flex flex-col items-center justify-center px-8 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center mb-6">
              <s.Icon size={36} className="text-amber-300" />
            </div>
            <h2 className="text-2xl font-black leading-tight mb-3">{s.title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">{s.body}</p>
          </section>
        ))}
      </div>

      {/* Nokta göstergesi */}
      <div className="flex items-center justify-center gap-2 py-4">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => jumpTo(i)}
            aria-label={`Slayt ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? 'w-8 bg-amber-400' : 'w-1.5 bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* 2 CTA */}
      <div className="px-5 space-y-2.5">
        <Link
          href="/giris?g=estestore&next=/satici/panel"
          onClick={setOnboardCookie}
          className="block w-full text-center py-3.5 rounded-2xl bg-amber-400 text-slate-950 font-bold active:bg-amber-500 transition"
        >
          Giriş yap
        </Link>
        <Link
          href="/satici/basvur"
          onClick={setOnboardCookie}
          className="block w-full text-center py-3.5 rounded-2xl border border-amber-400/40 bg-amber-500/10 text-amber-300 font-semibold active:bg-amber-500/20 transition"
        >
          İş Ortağı başvurusu
        </Link>
      </div>

      {/* Alt secondary — diğer Estelongy app'leri */}
      <div className="mt-6 px-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600 text-center mb-2.5">
          Estelongy ekosistemi
        </p>
        <div className="grid grid-cols-3 gap-2">
          {ALT_APPS.map(a => (
            <a
              key={a.name}
              href={a.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center px-2 py-2.5 rounded-xl border border-slate-800 bg-slate-900/40 active:bg-slate-900 transition"
            >
              <p className="text-xs font-bold text-slate-300">{a.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{a.tag}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Çıkış onay overlay */}
      {showExit && (
        <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-base font-bold text-white">Uygulamadan çıkılsın mı?</h3>
            <p className="mt-1 text-sm text-slate-400">EsteStorePRO kapatılacak.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowExit(false)}
                className="py-3 rounded-xl border border-slate-700 text-slate-300 font-medium active:bg-slate-800 transition"
              >
                Vazgeç
              </button>
              <button
                onClick={confirmExit}
                className="py-3 rounded-xl bg-amber-400 text-slate-950 font-bold active:bg-amber-500 transition"
              >
                Çık
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
