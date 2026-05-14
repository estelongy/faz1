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

      {/* ESTELONGY DÜNYASI panel — hover'da "aşağı 90° açılır" (3D flap-down) */}
      <div
        role="menu"
        aria-hidden={!open}
        style={{ perspective: '800px' }}
        className="absolute left-0 top-full pt-2 z-50"
      >
        <div
          className={`w-[420px] rounded-2xl bg-[#0F172A]/95 backdrop-blur-md border border-slate-700/60 shadow-[0_25px_70px_rgba(0,0,0,0.55)] overflow-hidden origin-top transition-[opacity,transform] duration-300 ease-out ${
            open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          style={{
            transform: open
              ? 'translateY(0) rotateX(0deg)'
              : 'translateY(-8px) rotateX(-22deg)',
            transformOrigin: 'top center',
          }}
        >
          {/* Header: 3 puzzle noktası + "Estelongy Dünyası" başlık */}
          <div className="px-5 pt-5 pb-4 border-b border-slate-800/60 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[radial-gradient(circle,_rgba(201,169,97,0.15),_transparent_70%)] blur-xl"
            />
            <div className="relative flex items-center gap-2.5 mb-1.5">
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C9A961]">
                Estelongy Dünyası
              </p>
            </div>
            <p className="text-[13px] text-slate-400 leading-snug">
              Üç marka, tek çatı — yolculuğunu seç.
            </p>
          </div>

          {/* 3 tile — her marka kendi rengiyle */}
          <ul className="p-2">
            {DROPDOWN_ITEMS.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="group/item flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800/70 transition-colors"
                >
                  {/* Renkli avatar — marka rengi glow + nokta */}
                  <span
                    aria-hidden
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover/item:scale-105"
                    style={{
                      backgroundColor: `${item.color}1A`,
                      border: `1px solid ${item.color}40`,
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: item.color,
                        boxShadow: `0 0 10px ${item.color}, 0 0 4px ${item.color}`,
                      }}
                    />
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-slate-50 leading-tight">
                      {item.name}
                    </div>
                    <div className="text-[11.5px] text-slate-400 leading-snug mt-0.5">
                      {item.desc}
                    </div>
                  </div>

                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full transition-all group-hover/item:translate-x-0.5"
                    style={{
                      color: item.color,
                      backgroundColor: `${item.color}14`,
                    }}
                  >
                    Aç
                    <ArrowRight size={11} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Footer note */}
          <div className="px-5 py-2.5 border-t border-slate-800/60 bg-slate-900/40">
            <p className="text-[10.5px] text-slate-500 leading-snug">
              Tek hesap, üç dünya — verilerin senin yolculuğunla büyür.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
