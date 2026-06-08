'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Store, ShoppingBag, BarChart3 } from 'lucide-react'

interface Slide {
  Icon: typeof Store
  title: string
  body: string
}

const SLIDES: Slide[] = [
  {
    Icon: Store,
    title: 'Estelongy nedir?',
    body: 'Küratörlü longevity ve estetik marketplace\'i. Her ürün EP (Estelongy Güzellik Puanı) eşiğinden geçer — bilim, üretici, hekim ve longevity katkısı 4 ekseninde skorlu.',
  },
  {
    Icon: ShoppingBag,
    title: 'EsteStorePRO ne yapar?',
    body: 'Mağazanı parmağının ucuyla yönet: ürün ekle, sipariş bildirimi al, tek tık kargo etiketi, iade ve müşteri sorularını cevapla. Trendyol/Hepsiburada paneli muadili.',
  },
  {
    Icon: BarChart3,
    title: 'Performans skoruyla büyü',
    body: 'Kargo hızı · iade oranı · müşteri puanı · soru ve yorum yanıt oranı — 5 metrikten A-F karne. Skorun arttıkça vitrindeki öncelik artar.',
  },
]

function setOnboardCookie() {
  // 365 gün, host-only, SameSite=Lax
  document.cookie = `eg_onboard_seen=1; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
}

export default function KarsilamaSlider() {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [idx, setIdx] = useState(0)

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
      {/* Marka rozeti */}
      <header className="px-5 pt-4 pb-2 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.22em] text-amber-400/80 font-bold">EsteStorePRO</p>
        <button
          onClick={() => { setOnboardCookie(); jumpTo(SLIDES.length - 1) }}
          className="text-xs text-slate-500 hover:text-slate-300"
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

      {/* Slayt nokta göstergesi */}
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

      {/* 3 CTA */}
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
        <details className="text-center pt-1">
          <summary className="text-xs text-slate-500 cursor-pointer list-none">
            Yanlış geldim — ben hasta/hekimim
          </summary>
          <div className="mt-2 flex flex-col gap-1 text-xs text-slate-400">
            <a href="https://play.google.com/store/apps/details?id=com.estelongy.biyoage" className="underline">
              BiyoAGE (longevity)
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.estelongy.esteklinik" className="underline">
              EsteKlinik (klinik arayan)
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.estelongy.esteklinikpro" className="underline">
              EsteKlinikPRO (hekim/klinik sahibi)
            </a>
          </div>
        </details>
      </div>
    </div>
  )
}
