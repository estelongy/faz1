'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/* ============================================================
   Marka palet — 3 sub-brand + master
   3 nokta sırası: BiyoAGE (lavanta) · EsteStore (gold) · EsteKlinik (green)
   Master state'te 3'ü birlikte parlar = Estelongy
   ============================================================ */
const SUB_BRANDS = [
  { name: 'BiyoAGE', href: '/', color: '#9F8CE0' },
  { name: 'EsteStore', href: '/estestore', color: '#C9A961' },
  { name: 'EsteKlinik', href: '/klinikler', color: '#10876B' },
] as const

const MASTER_COLOR = '#F8F7F4'

/* ============================================================
   Sekans — Estelongy anchor olarak her sub-brand'den sonra dönüyor
   "Eve dönüş" → puzzle parçaları birleşir → Estelongy = bütün
   ============================================================ */
type Step =
  | { kind: 'master'; dur: number }
  | { kind: 'sub'; idx: 0 | 1 | 2; dur: number }

const SEQUENCE: Step[] = [
  { kind: 'master', dur: 2800 },
  { kind: 'sub', idx: 0, dur: 2200 }, // BiyoAGE
  { kind: 'master', dur: 1600 }, // eve dönüş
  { kind: 'sub', idx: 1, dur: 2200 }, // EsteStore
  { kind: 'master', dur: 1600 },
  { kind: 'sub', idx: 2, dur: 2200 }, // EsteKlinik
  { kind: 'master', dur: 1600 },
]

/* ============================================================
   Dropdown — mouse hover'da yayılır
   EsteStore yok (buradayız), 3 marka clickable
   ============================================================ */
const DROPDOWN_ITEMS = [
  {
    name: 'Estelongy',
    href: '/',
    color: MASTER_COLOR,
    desc: 'Zamansız Güzellik Dünyası — ana sayfa',
  },
  {
    name: 'BiyoAGE',
    href: '/',
    color: '#9F8CE0',
    desc: 'Gençlik Skoru — AI cilt analizi',
  },
  {
    name: 'EsteKlinik',
    href: '/klinikler',
    color: '#10876B',
    desc: 'Klinik bul, randevu al',
  },
]

export default function BrandMorphButton() {
  const [stepIdx, setStepIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevWasSub = useRef(false)

  const step = SEQUENCE[stepIdx]

  // Auto-cycle
  useEffect(() => {
    if (paused) return
    const id = setTimeout(() => {
      setStepIdx((p) => (p + 1) % SEQUENCE.length)
    }, step.dur)
    return () => clearTimeout(id)
  }, [stepIdx, paused, step.dur])

  // Master state'e geçişin cascade efekti için "az önce sub mıydık?"
  // Bu render'dan sonra prevWasSub güncellenir.
  const isMaster = step.kind === 'master'
  const cascadeOnMasterEntry = isMaster && prevWasSub.current
  useEffect(() => {
    prevWasSub.current = step.kind === 'sub'
  }, [stepIdx, step.kind])

  // O anki aktif marka (etiket + href + renk)
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
    >
      {/* ANA BUTON — morph eden tek pill */}
      <Link
        href={current.href}
        aria-label={`${current.name} sayfasına git`}
        className="relative inline-flex items-center gap-3 min-w-[180px] h-10 px-4 rounded-full bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-slate-600 transition-colors"
      >
        {/* 3 puzzle noktası — master state'te birleşik, sub state'te biri öne çıkar */}
        <span className="flex items-center gap-1 shrink-0">
          {SUB_BRANDS.map((b, i) => {
            const isThisActiveSub = !isMaster && step.idx === i
            const dimmedInSub = !isMaster && !isThisActiveSub

            // Cascade gecikmesi: sub → master geçişinde noktalar sıra sıra ışıklanır
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

        {/* Etiket — key değişince fade-up animasyon */}
        <span
          key={`${current.name}-${stepIdx}`}
          className="text-sm font-medium whitespace-nowrap brand-morph-text"
          style={{
            color: isMaster ? '#F8F7F4' : current.color,
          }}
        >
          {current.name}
        </span>

        {/* Alt progress bar — her step'in süresi kadar grow */}
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

      {/* DROPDOWN — hover'da yayılır, 3 marka tıklanabilir */}
      <div
        role="menu"
        aria-hidden={!open}
        className={`absolute left-0 top-full mt-2 w-[280px] rounded-2xl bg-[#0F172A]/95 backdrop-blur-md border border-slate-700/60 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden z-50 transition-all duration-200 ease-out ${
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-1 pointer-events-none'
        }`}
      >
        <div className="px-4 py-3 border-b border-slate-800/60">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Diğer Dünyalar
          </p>
        </div>
        <ul className="py-2">
          {DROPDOWN_ITEMS.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="group/item flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/60 transition-colors"
              >
                <span
                  aria-hidden
                  className="w-2 h-2 rounded-full shrink-0 transition-transform group-hover/item:scale-125"
                  style={{
                    backgroundColor: item.color,
                    boxShadow: `0 0 8px ${item.color}90`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-50 leading-tight">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    {item.desc}
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-600 group-hover/item:text-slate-100 group-hover/item:translate-x-0.5 transition-all shrink-0"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
