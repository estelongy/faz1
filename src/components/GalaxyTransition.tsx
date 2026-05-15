'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ============================================================
   Galaksi geçiş ritüeli — BrandMorphButton tıklayınca
   sub-brand sayfasına gitmeden önce 600ms biyolojik overlay
   - Zemin: galaksi renginde radyal pulse
   - Motif: DNA / hücresel halka / damla (galaksiye göre)
   - Slogan: galaksi_geciş_dili.md memory'sinden
   ============================================================ */

export type Galaxy = 'biyoage' | 'esteklinik' | 'estestore'

interface GalaxyMeta {
  name: string
  color: string
  bg: string
  slogan: string
}

const META: Record<Galaxy, GalaxyMeta> = {
  biyoage: {
    name: 'BiyoAGE',
    color: '#9F8CE0',
    bg: '#1A1530',
    slogan: 'Biyolojik Yaşını Öğrenmek İster Misin?',
  },
  esteklinik: {
    name: 'EsteKlinik',
    color: '#10876B',
    bg: '#053527',
    slogan: 'Bilimi Güzelliğe Çeviren Klinikleri Keşfet',
  },
  estestore: {
    name: 'EsteStore',
    color: '#C9A961',
    bg: '#1A1408',
    slogan: 'Ürün Değil, Sana Özel Çözüm',
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

const DURATION_MS = 700

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
    const t = setTimeout(() => {
      router.push(active.href)
      // Overlay yeni sayfa render olduktan sonra çabuk fade-out yapsın
      setTimeout(() => {
        setActive(null)
        navigatingRef.current = false
      }, 250)
    }, DURATION_MS)
    return () => clearTimeout(t)
  }, [active, router])

  return (
    <TransitionCtx.Provider value={{ transitionTo }}>
      {children}
      {active && <GalaxyOverlay meta={META[active.galaxy]} galaxy={active.galaxy} />}
    </TransitionCtx.Provider>
  )
}

/* ============================================================
   Overlay — full-screen, biyolojik motif + slogan flash
   ============================================================ */
function GalaxyOverlay({ meta, galaxy }: { meta: GalaxyMeta; galaxy: Galaxy }) {
  return (
    <div
      role="presentation"
      aria-hidden
      className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none animate-galaxy-fade-in"
      style={{
        background: `radial-gradient(circle at center, ${meta.bg} 0%, #000 90%)`,
      }}
    >
      <div className="relative w-full max-w-md px-6 text-center">
        {/* Biyolojik motif — galaksiye göre */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          {galaxy === 'biyoage' && <DnaHelix color={meta.color} />}
          {galaxy === 'esteklinik' && <PulseRings color={meta.color} />}
          {galaxy === 'estestore' && <DropRipple color={meta.color} />}
        </div>

        {/* Galaksi adı */}
        <p
          className="text-[11px] font-bold uppercase tracking-[0.32em] mb-2"
          style={{ color: meta.color, opacity: 0, animation: 'galaxy-text-in 500ms 100ms ease-out forwards' }}
        >
          {meta.name}
        </p>

        {/* Slogan */}
        <p
          className="text-lg font-semibold text-white/90"
          style={{ opacity: 0, animation: 'galaxy-text-in 500ms 220ms ease-out forwards' }}
        >
          {meta.slogan}
        </p>
      </div>

      <style jsx global>{`
        @keyframes galaxy-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-galaxy-fade-in {
          animation: galaxy-fade-in 200ms ease-out both;
        }
        @keyframes galaxy-text-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes galaxy-helix-spin {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }
        @keyframes galaxy-pulse-ring {
          0%   { transform: scale(0.3); opacity: 0.9; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes galaxy-drop {
          0%   { transform: scale(0.2); opacity: 0.9; }
          70%  { opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes galaxy-breathe {
          0%, 100% { opacity: 0.85; }
          50%      { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

/* DNA çift sarmal — 12 nokta, Y ekseninde döner */
function DnaHelix({ color }: { color: string }) {
  const dots = 12
  return (
    <div
      className="absolute inset-0"
      style={{
        animation: 'galaxy-helix-spin 1400ms linear infinite, galaxy-breathe 1400ms ease-in-out infinite',
        transformStyle: 'preserve-3d',
      }}
    >
      {Array.from({ length: dots }).map((_, i) => {
        const t = i / (dots - 1)
        const y = t * 100
        const angle = t * Math.PI * 2
        const x = 50 + Math.sin(angle) * 30
        const xMirror = 50 - Math.sin(angle) * 30
        return (
          <div key={i}>
            <span
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{
                left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)',
                backgroundColor: color, boxShadow: `0 0 10px ${color}`,
              }}
            />
            <span
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${xMirror}%`, top: `${y}%`, transform: 'translate(-50%, -50%)',
                backgroundColor: color, opacity: 0.6, boxShadow: `0 0 8px ${color}80`,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

/* Çift halka pulse — kalp atışı ritmi */
function PulseRings({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {[0, 220, 440].map((delay, i) => (
        <span
          key={i}
          className="absolute rounded-full border-2"
          style={{
            width: 64, height: 64, borderColor: color,
            animation: `galaxy-pulse-ring 1100ms ${delay}ms ease-out infinite`,
            boxShadow: `0 0 18px ${color}80`,
          }}
        />
      ))}
      <span
        className="rounded-full"
        style={{
          width: 16, height: 16, backgroundColor: color,
          boxShadow: `0 0 24px ${color}, 0 0 8px ${color}`,
          animation: 'galaxy-breathe 700ms ease-in-out infinite',
        }}
      />
    </div>
  )
}

/* Altın damla yayılması */
function DropRipple({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {[0, 180, 360].map((delay, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            width: 64, height: 64,
            background: `radial-gradient(circle, ${color}60 0%, transparent 70%)`,
            animation: `galaxy-drop 1000ms ${delay}ms ease-out infinite`,
          }}
        />
      ))}
      <span
        className="rounded-full"
        style={{
          width: 14, height: 14,
          background: `radial-gradient(circle, ${color} 0%, ${color}80 100%)`,
          boxShadow: `0 0 20px ${color}`,
          animation: 'galaxy-breathe 900ms ease-in-out infinite',
        }}
      />
    </div>
  )
}
