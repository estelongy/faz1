'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ============================================================
   Galaksi geçiş ritüeli — logo'dan ilham alan sinematik akış
   - Zemin: derin lacivert + radyal galaksi rengi
   - 1. Katman: DNA omurgası (universal, ince gümüş, yavaş döner)
   - 2. Katman: galaksiye özel biyolojik motif (DNA/pulse/damla)
   - 3. Katman: parçacık tozu burst (logo'daki gibi)
   - Slogan + altın divider'lar (logo subtitle stili)
   ============================================================ */

export type Galaxy = 'biyoage' | 'esteklinik' | 'estestore'

interface GalaxyMeta {
  name: string
  color: string
  bg: string
  particleWarm: string  // logo sol taraf altın ton
  slogan: string
}

const META: Record<Galaxy, GalaxyMeta> = {
  biyoage: {
    name: 'BiyoAGE',
    color: '#9F8CE0',
    bg: '#0B0820',
    particleWarm: '#C9A961',
    slogan: 'Biyolojik Yaşını Öğrenmek İster Misin?',
  },
  esteklinik: {
    name: 'EsteKlinik',
    color: '#10876B',
    bg: '#03241B',
    particleWarm: '#C9A961',
    slogan: 'Bilimi Güzelliğe Çeviren Klinikleri Keşfet',
  },
  estestore: {
    name: 'EsteStore',
    color: '#C9A961',
    bg: '#100A02',
    particleWarm: '#E6D29A',
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

const DURATION_MS = 9000  // tam sinematik açılış — kullanıcı sloganı okuyup hissetsin

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
      setTimeout(() => {
        setActive(null)
        navigatingRef.current = false
      }, 400)
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
   Overlay — sinematik 5 katmanlı geçiş
   ============================================================ */
function GalaxyOverlay({ meta, galaxy }: { meta: GalaxyMeta; galaxy: Galaxy }) {
  return (
    <div
      role="presentation"
      aria-hidden
      className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none animate-galaxy-fade-in overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at center, ${meta.bg} 0%, #000 85%)`,
      }}
    >
      {/* Katman 1: Universal DNA omurgası — yavaş döner, ince gümüş */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <UniversalDnaSpine />
      </div>

      {/* Katman 2: Parçacık burst — logo'daki gibi galaksi rengi + altın */}
      <ParticleBurst color={meta.color} warm={meta.particleWarm} />

      {/* Katman 3: Merkez motif — galaksiye özel */}
      <div className="relative w-full max-w-md px-6 text-center">
        <div className="relative w-36 h-36 mx-auto mb-6">
          {galaxy === 'biyoage' && <DnaHelix color={meta.color} />}
          {galaxy === 'esteklinik' && <PulseRings color={meta.color} />}
          {galaxy === 'estestore' && <DropRipple color={meta.color} />}
        </div>

        {/* Galaksi adı — logo "ESTELONGY" stili */}
        <p
          className="text-xs font-bold uppercase tracking-[0.4em] mb-3"
          style={{
            color: meta.color,
            opacity: 0,
            animation: 'galaxy-text-in 900ms 800ms ease-out forwards, galaxy-text-out 600ms 7900ms ease-in forwards',
            textShadow: `0 0 20px ${meta.color}80`,
          }}
        >
          {meta.name}
        </p>

        {/* Altın ince divider'lar — logo subtitle stili */}
        <div
          className="flex items-center justify-center gap-3 mb-4"
          style={{
            opacity: 0,
            animation: 'galaxy-divider-grow 900ms 1500ms ease-out forwards, galaxy-text-out 600ms 7900ms ease-in forwards',
          }}
        >
          <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#C9A961]" />
          <span className="w-1 h-1 rounded-full bg-[#C9A961]" style={{ boxShadow: '0 0 6px #C9A961' }} />
          <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#C9A961]" />
        </div>

        {/* Slogan — uzun süre okunabilir */}
        <p
          className="text-xl font-semibold text-white/95 leading-snug"
          style={{
            opacity: 0,
            animation: 'galaxy-text-in 1000ms 2400ms ease-out forwards, galaxy-text-out 700ms 7800ms ease-in forwards',
          }}
        >
          {meta.slogan}
        </p>

        {/* İlerleme şeridi — kullanıcı geçişin uzunluğunu hissetsin */}
        <div className="mt-10 mx-auto w-48 h-px bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full"
            style={{
              background: `linear-gradient(to right, transparent, ${meta.color}, #C9A961)`,
              animation: 'galaxy-progress 8500ms linear forwards',
            }}
          />
        </div>
      </div>

      <style jsx global>{`
        @keyframes galaxy-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-galaxy-fade-in {
          animation: galaxy-fade-in 280ms ease-out both;
        }
        @keyframes galaxy-text-in {
          from { opacity: 0; transform: translateY(8px) scale(0.96); letter-spacing: 0.5em; }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes galaxy-text-out {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-6px); }
        }
        @keyframes galaxy-divider-grow {
          from { opacity: 0; transform: scaleX(0); }
          to   { opacity: 1; transform: scaleX(1); }
        }
        @keyframes galaxy-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes galaxy-helix-spin {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }
        @keyframes galaxy-spine-rotate {
          from { transform: rotate(-8deg) scale(0.95); }
          to   { transform: rotate(8deg) scale(1.02); }
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
        @keyframes galaxy-particle-out {
          0%   { transform: translate(0, 0) scale(0); opacity: 0; }
          15%  { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { transform: var(--end-transform); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

/* ============================================================
   Universal DNA omurgası — logo'daki merkez DNA, ince gümüş
   ============================================================ */
function UniversalDnaSpine() {
  return (
    <div
      className="relative w-[600px] h-[600px]"
      style={{
        animation: 'galaxy-spine-rotate 4000ms ease-in-out infinite alternate',
      }}
    >
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="spine-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C9D4E8" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#9FB3D1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#C9D4E8" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {/* Çift sarmal — sinüs eğrileri */}
        <path
          d="M 100 10 Q 60 50, 100 100 Q 140 150, 100 190"
          stroke="url(#spine-grad)" strokeWidth="1.2" fill="none"
        />
        <path
          d="M 100 10 Q 140 50, 100 100 Q 60 150, 100 190"
          stroke="url(#spine-grad)" strokeWidth="1.2" fill="none"
        />
        {/* Yatay basamaklar */}
        {Array.from({ length: 10 }).map((_, i) => {
          const t = i / 9
          const y = 10 + t * 180
          const angle = t * Math.PI * 2
          const xL = 100 - Math.sin(angle) * 35
          const xR = 100 + Math.sin(angle) * 35
          return (
            <line
              key={i}
              x1={xL} y1={y} x2={xR} y2={y}
              stroke="#9FB3D1" strokeWidth="0.6" opacity="0.4"
            />
          )
        })}
      </svg>
    </div>
  )
}

/* ============================================================
   Parçacık burst — logo'daki toz efekti, galaksi rengi + altın
   ============================================================ */
function ParticleBurst({ color, warm }: { color: string; warm: string }) {
  // 3 dalga × 16 parçacık — 9 sn boyunca sürekli akan toz
  const WAVE_COUNT = 3
  const PER_WAVE = 16
  const WAVE_GAP = 2700  // 3 dalga sırayla: 0ms, 2700ms, 5400ms
  const particles = Array.from({ length: WAVE_COUNT * PER_WAVE }).map((_, i) => {
    const wave = Math.floor(i / PER_WAVE)
    const idxInWave = i % PER_WAVE
    const angle = (idxInWave / PER_WAVE) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
    const dist = 240 + Math.random() * 220
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist
    const size = 1.5 + Math.random() * 3
    const delay = wave * WAVE_GAP + Math.random() * 600
    const dur = 1800 + Math.random() * 700
    const isWarm = i % 3 === 0
    return { dx, dy, size, delay, dur, color: isWarm ? warm : color, key: i }
  })

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {particles.map(p => (
        <span
          key={p.key}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            // @ts-expect-error CSS custom property
            '--end-transform': `translate(${p.dx}px, ${p.dy}px) scale(0)`,
            animation: `galaxy-particle-out ${p.dur}ms ${p.delay}ms ease-out forwards`,
          }}
        />
      ))}
    </div>
  )
}

/* DNA çift sarmal — galaksi merkez motif (BiyoAGE) */
function DnaHelix({ color }: { color: string }) {
  const dots = 14
  return (
    <div
      className="absolute inset-0"
      style={{
        animation: 'galaxy-helix-spin 1800ms linear infinite, galaxy-breathe 1400ms ease-in-out infinite',
        transformStyle: 'preserve-3d',
      }}
    >
      {Array.from({ length: dots }).map((_, i) => {
        const t = i / (dots - 1)
        const y = t * 100
        const angle = t * Math.PI * 2
        const x = 50 + Math.sin(angle) * 32
        const xMirror = 50 - Math.sin(angle) * 32
        return (
          <div key={i}>
            <span
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{
                left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)',
                backgroundColor: color, boxShadow: `0 0 12px ${color}`,
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

/* Çift halka pulse — kalp atışı ritmi (EsteKlinik) */
function PulseRings({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {[0, 280, 560].map((delay, i) => (
        <span
          key={i}
          className="absolute rounded-full border-2"
          style={{
            width: 72, height: 72, borderColor: color,
            animation: `galaxy-pulse-ring 1400ms ${delay}ms ease-out infinite`,
            boxShadow: `0 0 22px ${color}80`,
          }}
        />
      ))}
      <span
        className="rounded-full"
        style={{
          width: 18, height: 18, backgroundColor: color,
          boxShadow: `0 0 28px ${color}, 0 0 10px ${color}`,
          animation: 'galaxy-breathe 800ms ease-in-out infinite',
        }}
      />
    </div>
  )
}

/* Altın damla yayılması (EsteStore) */
function DropRipple({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {[0, 220, 440].map((delay, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            width: 72, height: 72,
            background: `radial-gradient(circle, ${color}70 0%, transparent 70%)`,
            animation: `galaxy-drop 1200ms ${delay}ms ease-out infinite`,
          }}
        />
      ))}
      <span
        className="rounded-full"
        style={{
          width: 16, height: 16,
          background: `radial-gradient(circle, ${color} 0%, ${color}80 100%)`,
          boxShadow: `0 0 22px ${color}`,
          animation: 'galaxy-breathe 900ms ease-in-out infinite',
        }}
      />
    </div>
  )
}
