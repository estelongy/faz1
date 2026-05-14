'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/* ============================================================
   3 sub-brand
   ============================================================ */
const SUB_BRANDS = [
  { name: 'BiyoAGE', href: '/', color: '#9F8CE0' },
  { name: 'EsteStore', href: '/estestore', color: '#C9A961' },
  { name: 'EsteKlinik', href: '/klinikler', color: '#10876B' },
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

/* Boyutlar — width sabit, sadece height değişir.
   Pivot: pill'in sol noktası (~18px sol, ~20px üst). */
const BOX_WIDTH = 200
const BOX_HEIGHT_CLOSED = 40
const BOX_HEIGHT_OPEN = 312
const HINGE_X = 18 // sol noktanın x koordinatı (menteşe)
const HINGE_Y = 20 // dikey ortası

export default function BrandMorphButton() {
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
    }, 200)
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ width: BOX_WIDTH, height: BOX_HEIGHT_CLOSED }}
    >
      {/* ============================================================
          ANIMATED BOX — pill kendisi aşağı açılır panel olur
          - Width sabit 200px (yatay konum korunur)
          - Height 40 → 312 (sadece aşağı genişler)
          - Menteşe: pill'in sol noktası (~18px, 20px) — sol nokta SABİT
          - Border-radius 9999 (pill) → 20 (panel)
          - cubic-bezier overshoot ile "snap" hissi
          - Kart deck ghost shadows: arkasında 4 ghost kart görünür
          ============================================================ */}
      <div
        className={`absolute top-0 left-0 overflow-hidden border bg-slate-800/40 backdrop-blur-md z-50 ${
          open ? 'border-slate-600/80' : 'border-slate-700/50'
        }`}
        style={{
          width: BOX_WIDTH,
          height: open ? BOX_HEIGHT_OPEN : BOX_HEIGHT_CLOSED,
          borderRadius: open ? 20 : 9999,
          transformOrigin: `${HINGE_X}px ${HINGE_Y}px`, // sol nokta menteşe
          transition:
            'height 480ms cubic-bezier(0.34, 1.5, 0.6, 1), border-radius 480ms cubic-bezier(0.34, 1.5, 0.6, 1), border-color 250ms ease-out, box-shadow 400ms ease-out',
          boxShadow: open
            ? [
                '0 25px 60px rgba(0,0,0,0.55)',
                '-3px 6px 0 rgba(15, 23, 42, 0.7)',
                '-7px 12px 0 rgba(15, 23, 42, 0.5)',
                '-12px 20px 0 rgba(15, 23, 42, 0.28)',
                '-18px 28px 0 rgba(15, 23, 42, 0.12)',
              ].join(', ')
            : '0 0 0 rgba(0,0,0,0)',
        }}
      >
        {/* ========== KAPALI: pill içeriği ========== */}
        <div
          className={`absolute inset-0 flex items-center px-4 transition-opacity duration-150 ${
            open ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <Link
            href={current.href}
            aria-label={`${current.name} sayfasına git`}
            className="flex items-center gap-3 w-full"
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
              key={`${current.name}-${stepIdx}`}
              className="text-sm font-medium whitespace-nowrap brand-morph-text"
              style={{ color: isMaster ? '#F8F7F4' : current.color }}
            >
              {current.name}
            </span>
          </Link>

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

        {/* ========== AÇIK: panel içeriği ========== */}
        <div
          className={`absolute inset-0 p-4 flex flex-col gap-3 transition-opacity duration-200 ${
            open ? 'opacity-100 delay-200' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Header: 3 dot (menteşe noktası ilk dot) + başlık */}
          <div className="flex items-center gap-2 px-1">
            <span className="flex items-center gap-0.5 shrink-0">
              {SUB_BRANDS.map((b, i) => (
                <span
                  key={i}
                  aria-hidden
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: b.color,
                    boxShadow: `0 0 6px ${b.color}90`,
                  }}
                />
              ))}
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C9A961] whitespace-nowrap">
              Estelongy Dünyası
            </p>
          </div>

          <div className="h-px bg-slate-700/50 -mx-2" />

          <ul className="flex flex-col gap-1 flex-1">
            {SUB_BRANDS.map((brand) => (
              <li key={brand.name}>
                <Link
                  href={brand.href}
                  className="group/item flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-800/70 transition-colors"
                >
                  <span
                    aria-hidden
                    className="w-2 h-2 rounded-full shrink-0 transition-transform group-hover/item:scale-125"
                    style={{
                      backgroundColor: brand.color,
                      boxShadow: `0 0 8px ${brand.color}`,
                    }}
                  />
                  <span className="flex-1 text-[13px] font-medium text-slate-100 leading-tight">
                    {brand.name}
                  </span>
                  <ArrowRight
                    size={12}
                    className="text-slate-500 group-hover/item:text-slate-200 group-hover/item:translate-x-0.5 transition-all shrink-0"
                  />
                </Link>
              </li>
            ))}
          </ul>

          <p className="text-[10px] text-slate-500 leading-snug px-1 -mb-1 italic">
            Zamansız Güzellik Mimarlığı
          </p>
        </div>
      </div>
    </div>
  )
}
