'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ============================================================
   Galaksi geçiş ritüeli — sade ve hızlı (v2)
   - Tek katman radial bg + ortada galaksi adı + slogan
   - 5800 ms toplam: 600 fade-in / 4600 hold / 600 fade-out
   - SVG yok, parçacık yok, CSS only — bundle ~80 satır
   - Eski versiyon 411 satır + 9000ms idi; pazara çıkarken yormasın
   ============================================================ */

export type Galaxy = 'biyoage' | 'esteklinik' | 'estestore'

interface GalaxyMeta {
  name: string
  color: string       // accent (logo, divider parıltısı)
  bg: string          // overlay zemini (derin)
  slogan: string
}

const META: Record<Galaxy, GalaxyMeta> = {
  biyoage: {
    name: 'BiyoAGE',
    color: '#9F8CE0',
    bg: '#0B0820',
    slogan: 'Biyolojik Yaşını Öğren.',
  },
  esteklinik: {
    name: 'EsteKlinik',
    color: '#10876B',
    bg: '#03241B',
    slogan: 'Bilimi Güzelliğe Çeviren Klinikler.',
  },
  estestore: {
    name: 'EsteStore',
    color: '#C9A961',
    bg: '#100A02',
    slogan: 'Ürün Değil, Sana Özel Çözüm.',
  },
}

interface Ctx {
  transitionTo: (galaxy: Galaxy, href: string) => void
}

const TransitionCtx = createContext<Ctx | null>(null)

export function useGalaxyTransition() {
  const ctx = useContext(TransitionCtx)
  if (!ctx) throw new Error('GalaxyTransitionProvider missing')
  return ctx
}

const DURATION_MS = 5800       // 0.6 in + 4.6 hold + 0.6 out
const NAV_AT_MS   = 5200       // router.push fade-out başlamadan az önce

export function GalaxyTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [active, setActive] = useState<{ galaxy: Galaxy; href: string } | null>(null)
  const navigatingRef = useRef(false)

  const transitionTo = useCallback((galaxy: Galaxy, href: string) => {
    if (navigatingRef.current) return
    navigatingRef.current = true
    setActive({ galaxy, href })
  }, [])

  useEffect(() => {
    if (!active) return
    // Hedef sayfa fade-out sırasında yüklensin
    const tNav = setTimeout(() => router.push(active.href), NAV_AT_MS)
    const tEnd = setTimeout(() => {
      setActive(null)
      navigatingRef.current = false
    }, DURATION_MS)
    return () => { clearTimeout(tNav); clearTimeout(tEnd) }
  }, [active, router])

  return (
    <TransitionCtx.Provider value={{ transitionTo }}>
      {children}
      {active && <GalaxyOverlay meta={META[active.galaxy]} />}
    </TransitionCtx.Provider>
  )
}

function GalaxyOverlay({ meta }: { meta: GalaxyMeta }) {
  return (
    <div
      role="presentation"
      aria-hidden
      className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none gt-overlay"
      style={{ background: `radial-gradient(ellipse at center, ${meta.bg} 0%, #000 90%)` }}
    >
      {/* Yumuşak parıltı halkası — accent rengi */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-25 gt-glow"
        style={{ background: `radial-gradient(circle, ${meta.color}, transparent 70%)` }}
      />

      <div className="relative text-center px-6">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.4em] mb-3 gt-eyebrow"
          style={{ color: meta.color, textShadow: `0 0 18px ${meta.color}66` }}
        >
          {meta.name}
        </p>

        {/* İnce altın divider */}
        <div className="flex items-center justify-center gap-3 mb-5 gt-divider">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#C9A961]" />
          <span className="w-1 h-1 rounded-full bg-[#C9A961]" style={{ boxShadow: '0 0 6px #C9A961' }} />
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#C9A961]" />
        </div>

        <h2 className="text-white font-light text-xl sm:text-2xl tracking-tight max-w-md gt-slogan">
          {meta.slogan}
        </h2>
      </div>

      <style jsx>{`
        .gt-overlay {
          animation: gt-fade 5800ms ease-in-out forwards;
        }
        .gt-glow {
          animation: gt-glow-pulse 4600ms 400ms ease-in-out forwards;
        }
        .gt-eyebrow {
          opacity: 0;
          animation: gt-up 600ms 400ms ease-out forwards, gt-out 500ms 5100ms ease-in forwards;
        }
        .gt-divider {
          opacity: 0;
          animation: gt-up 600ms 700ms ease-out forwards, gt-out 500ms 5100ms ease-in forwards;
        }
        .gt-slogan {
          opacity: 0;
          animation: gt-up 700ms 1000ms ease-out forwards, gt-out 500ms 5100ms ease-in forwards;
        }
        @keyframes gt-fade {
          0%   { opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes gt-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gt-out {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-6px); }
        }
        @keyframes gt-glow-pulse {
          0%   { opacity: 0; transform: scale(0.85); }
          30%  { opacity: 0.3; transform: scale(1); }
          70%  { opacity: 0.3; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
