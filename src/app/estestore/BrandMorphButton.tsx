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

/* Sekans — Estelongy her sub'dan sonra döner */
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
    }, 220)
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ============================================================
          PILL — yatay nav butonu, ●●● + cycling text + progress
          Daima görünür, yerinde sabit
          ============================================================ */}
      <Link
        href={current.href}
        aria-label={`${current.name} sayfasına git`}
        className="relative inline-flex items-center gap-3 min-w-[180px] h-10 px-4 rounded-full bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-slate-600 transition-colors overflow-hidden"
      >
        {/* 3 puzzle noktası */}
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

        {/* Alt progress bar */}
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
      </Link>

      {/* ============================================================
          PANEL — kart deck açılır gibi rotate-in animasyonu
          - Pivot: sol-alt köşe (transform-origin: bottom left)
          - Kapalı: rotate(-42deg) translateY(20px) scale(0.85) opacity 0
          - Açık: rotate(0) translateY(0) scale(1) opacity 1
          - Çoklu box-shadow → ghost kartlar (kart deck derinliği)
          - 540ms cubic-bezier(0.34, 1.56, 0.64, 1) — hafif overshoot
          ============================================================ */}
      <div className="absolute left-0 top-full pt-3 z-50" aria-hidden={!open}>
        <div
          role="menu"
          className={`w-[300px] rounded-2xl overflow-hidden ${
            open ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(100, 116, 139, 0.4)',
            transformOrigin: '0% 100%', // sol-alt pivot
            transform: open
              ? 'rotate(0deg) translateY(0) scale(1)'
              : 'rotate(-42deg) translateY(20px) scale(0.85)',
            opacity: open ? 1 : 0,
            transition: open
              ? 'transform 540ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 280ms ease-out'
              : 'transform 320ms cubic-bezier(0.4, 0, 0.6, 1), opacity 220ms ease-out',
            boxShadow: open
              ? [
                  '0 25px 60px rgba(0,0,0,0.55)',
                  '-3px 3px 0 rgba(15, 23, 42, 0.75)',
                  '-7px 7px 0 rgba(15, 23, 42, 0.55)',
                  '-12px 12px 0 rgba(15, 23, 42, 0.32)',
                  '-18px 18px 0 rgba(15, 23, 42, 0.15)',
                ].join(', ')
              : '0 0 0 rgba(0,0,0,0)',
          }}
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-slate-800/60 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[radial-gradient(circle,_rgba(201,169,97,0.15),_transparent_70%)] blur-xl"
            />
            <div className="relative flex items-center gap-2.5">
              <span className="flex items-center gap-0.5">
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C9A961] whitespace-nowrap">
                Estelongy Dünyası
              </p>
            </div>
          </div>

          {/* 3 marka listesi */}
          <ul className="p-2">
            {SUB_BRANDS.map((brand) => (
              <li key={brand.name}>
                <Link
                  href={brand.href}
                  className="group/item flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800/70 transition-colors"
                >
                  <span
                    aria-hidden
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover/item:scale-105"
                    style={{
                      backgroundColor: `${brand.color}1A`,
                      border: `1px solid ${brand.color}40`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: brand.color,
                        boxShadow: `0 0 8px ${brand.color}`,
                      }}
                    />
                  </span>
                  <span className="flex-1 text-[14px] font-semibold text-slate-50 leading-tight">
                    {brand.name}
                  </span>
                  <ArrowRight
                    size={13}
                    className="text-slate-500 group-hover/item:text-slate-200 group-hover/item:translate-x-0.5 transition-all shrink-0"
                  />
                </Link>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className="px-5 py-2.5 border-t border-slate-800/60 bg-slate-900/40">
            <p className="text-[10.5px] text-slate-500 leading-snug italic">
              Zamansız Güzellik Mimarlığı
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
