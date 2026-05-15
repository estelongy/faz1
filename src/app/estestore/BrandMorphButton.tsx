'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useGalaxyTransition, type Galaxy } from '@/components/GalaxyTransition'

/* ============================================================
   3 sub-brand — her biri kendi kartı, mor noktadan açılır
   ============================================================ */
const SUB_BRANDS = [
  { name: 'BiyoAGE',    href: '/',          color: '#9F8CE0', tag: 'Analiz', galaxy: 'biyoage' as Galaxy },
  { name: 'EsteStore',  href: '/estestore', color: '#C9A961', tag: 'Mağaza', galaxy: 'estestore' as Galaxy },
  { name: 'EsteKlinik', href: '/klinikler', color: '#10876B', tag: 'Klinik', galaxy: 'esteklinik' as Galaxy },
] as const

const MASTER_COLOR = '#F8F7F4'

type Step =
  | { kind: 'master'; dur: number }
  | { kind: 'sub'; idx: 0 | 1 | 2; dur: number }

const SEQUENCE: Step[] = [
  { kind: 'master', dur: 2800 },
  { kind: 'sub', idx: 0, dur: 2200 },
  { kind: 'master', dur: 1600 },
  { kind: 'sub', idx: 1, dur: 2200 },
  { kind: 'master', dur: 1600 },
  { kind: 'sub', idx: 2, dur: 2200 },
  { kind: 'master', dur: 1600 },
]

/* Pill boyutu — kartlar da aynı boy */
const PILL_W = 200
const PILL_H = 44
const HINGE_X = 18 // mor noktanın merkezi (menteşe)
const HINGE_Y = 22 // pill dikey ortası

/* Her kart için fan açısı + dikey ofset (mor noktadan rotate olur) */
const FAN: Array<{ angle: number; dy: number; delay: number }> = [
  { angle: -4,  dy: 56,  delay: 0   },  // BiyoAGE
  { angle: -8,  dy: 112, delay: 60  },  // EsteStore
  { angle: -12, dy: 168, delay: 120 },  // EsteKlinik
]

export default function BrandMorphButton() {
  const { transitionTo } = useGalaxyTransition()
  const [stepIdx, setStepIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevWasSub = useRef(false)

  const step = SEQUENCE[stepIdx]

  useEffect(() => {
    if (paused) return
    const id = setTimeout(() => {
      setStepIdx((p) => (p + 1) % SEQUENCE.length)
    }, step.dur)
    return () => clearTimeout(id)
  }, [stepIdx, paused, step.dur])

  const isMaster = step.kind === 'master'
  const cascadeOnMasterEntry = isMaster && prevWasSub.current
  useEffect(() => {
    prevWasSub.current = step.kind === 'sub'
  }, [stepIdx, step.kind])

  const current = isMaster
    ? { name: 'Estelongy', href: '/', color: MASTER_COLOR }
    : { ...SUB_BRANDS[step.idx] }

  const handleMouseEnter = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setPaused(true)
    setOpen(true)
  }
  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => {
      setPaused(false)
      setOpen(false)
    }, 180)
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ width: PILL_W, height: PILL_H, perspective: 1000 }}
    >
      {/* ============================================================
          FAN KARTLARI — 3 marka kartı, mor noktadan rotate açılır
          Kapalı: hepsi pill'in altında (translateY 0, rotate 0, opacity 0)
          Açık:   yelpaze gibi diagonalde yayılırlar
          ============================================================ */}
      {SUB_BRANDS.map((brand, i) => {
        const fan = FAN[i]
        return (
          <a
            key={brand.name}
            href={brand.href}
            onClick={(e) => { e.preventDefault(); transitionTo(brand.galaxy, brand.href) }}
            aria-label={`${brand.name} dünyasına git`}
            className="absolute top-0 left-0 flex items-center gap-2.5 px-4 border bg-slate-900/95 backdrop-blur-md group/card cursor-pointer"
            style={{
              width: PILL_W,
              height: PILL_H,
              borderRadius: 9999,
              borderColor: open ? `${brand.color}55` : 'transparent',
              transformOrigin: `${HINGE_X}px ${HINGE_Y}px`,
              transform: open
                ? `translateY(${fan.dy}px) rotate(${fan.angle}deg)`
                : `translateY(0px) rotate(0deg)`,
              opacity: open ? 1 : 0,
              pointerEvents: open ? 'auto' : 'none',
              zIndex: 10 + i,
              transition: `transform 520ms cubic-bezier(0.34, 1.4, 0.5, 1) ${fan.delay}ms, opacity 320ms ease-out ${fan.delay}ms, border-color 260ms ease-out`,
              boxShadow: open
                ? `0 ${8 + i * 4}px ${24 + i * 6}px rgba(0,0,0,0.45), 0 0 0 1px ${brand.color}22 inset`
                : 'none',
            }}
          >
            {/* sol nokta — kartın menteşe noktası, kendi renginde */}
            <span
              aria-hidden
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                backgroundColor: brand.color,
                boxShadow: `0 0 10px ${brand.color}, 0 0 3px ${brand.color}`,
              }}
            />
            <span
              className="text-[13px] font-medium tracking-tight flex-1"
              style={{ color: brand.color }}
            >
              {brand.name}
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500 group-hover/card:text-slate-300 transition-colors">
              {brand.tag}
            </span>
            <ArrowRight
              size={12}
              className="text-slate-600 group-hover/card:text-slate-200 group-hover/card:translate-x-0.5 transition-all shrink-0"
            />
          </a>
        )
      })}

      {/* ============================================================
          ANA PILL — üstte sabit kalır, mor nokta tam burada
          Açıldığında pill içeriği fade'lenir, kartlar fan açar
          ============================================================ */}
      <div
        className={`absolute top-0 left-0 overflow-hidden border bg-slate-800/60 backdrop-blur-md ${
          open ? 'border-slate-600/80' : 'border-slate-700/50'
        }`}
        style={{
          width: PILL_W,
          height: PILL_H,
          borderRadius: 9999,
          zIndex: 20,
          transition: 'border-color 250ms ease-out, box-shadow 400ms ease-out, transform 400ms cubic-bezier(0.34, 1.4, 0.5, 1)',
          transform: open ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: open
            ? '0 8px 24px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,169,97,0.18) inset'
            : '0 2px 8px rgba(0,0,0,0.25)',
        }}
      >
        <div className="absolute inset-0 flex items-center px-4">
          <a
            href={current.href}
            onClick={(e) => {
              if (!isMaster && step.kind === 'sub') {
                e.preventDefault()
                transitionTo(SUB_BRANDS[step.idx].galaxy, current.href)
              }
            }}
            aria-label={`${current.name} sayfasına git`}
            className="flex items-center gap-3 w-full cursor-pointer"
          >
            <span className="flex items-center gap-1 shrink-0">
              {SUB_BRANDS.map((b, i) => {
                const isThisActiveSub = !isMaster && step.kind === 'sub' && step.idx === i
                const dimmedInSub = !isMaster && !isThisActiveSub
                const cascadeDelay = cascadeOnMasterEntry ? i * 130 : 0
                return (
                  <span
                    key={i}
                    aria-hidden
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: b.color,
                      opacity: dimmedInSub ? 0.22 : 1,
                      transform: isThisActiveSub ? 'scale(1.7)' : 'scale(1)',
                      boxShadow: isThisActiveSub
                        ? `0 0 12px ${b.color}, 0 0 4px ${b.color}`
                        : isMaster
                          ? `0 0 5px ${b.color}90`
                          : 'none',
                      transition: `opacity 500ms ease-out ${cascadeDelay}ms, transform 500ms ease-out ${cascadeDelay}ms, box-shadow 500ms ease-out ${cascadeDelay}ms`,
                    }}
                  />
                )
              })}
            </span>

            <span
              key={open ? 'hover-label' : `${current.name}-${stepIdx}`}
              className="text-sm font-medium whitespace-nowrap brand-morph-text"
              style={{
                color: open ? '#C9A961' : isMaster ? '#F8F7F4' : current.color,
                letterSpacing: open ? '0.08em' : 'normal',
                textTransform: open ? 'uppercase' : 'none',
                fontSize: open ? '11px' : '14px',
              }}
            >
              {open ? 'Estelongy Dünyası' : current.name}
            </span>
          </a>

          <span
            aria-hidden
            className="absolute bottom-0 left-2 right-2 h-px bg-slate-700/30 overflow-hidden rounded-full"
          >
            <span
              key={`p-${stepIdx}-${paused ? 'p' : 'r'}`}
              className="block h-full origin-left"
              style={{
                backgroundColor: current.color,
                animation: paused
                  ? 'none'
                  : `brand-progress ${step.dur}ms linear forwards`,
              }}
            />
          </span>
        </div>
      </div>
    </div>
  )
}
