'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Brand {
  name: string
  href: string
  color: string
}

const BRANDS: Brand[] = [
  { name: 'Estelongy', href: '/', color: '#F8F7F4' }, // master — beyaz/sıcak
  { name: 'BiyoAGE', href: '/', color: '#9F8CE0' }, // mor-lavanta (BiyoAGE accent)
  { name: 'EsteStore', href: '/estestore', color: '#C9A961' }, // gold
  { name: 'EsteKlinik', href: '/klinikler', color: '#10876B' }, // green
]

const CYCLE_MS = 2800

/**
 * Tek-pill morph button:
 * Estelongy → BiyoAGE → EsteStore → EsteKlinik → tekrar
 * - Her ~2.8sn ismi değişir (fade-up animasyonu)
 * - Renkli nokta + alt progress bar
 * - Hover'da cycle durur (kullanıcı düşünmek için zaman alır)
 * - Tıklama her zaman aktif → o anki marka URL'sine gider
 */
export default function BrandMorphButton() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [tick, setTick] = useState(0) // progress bar restart için key

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      setIndex((p) => (p + 1) % BRANDS.length)
      setTick((t) => t + 1)
    }, CYCLE_MS)
    return () => clearInterval(id)
  }, [paused])

  const brand = BRANDS[index]

  return (
    <Link
      href={brand.href}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative inline-flex items-center justify-center gap-2.5 min-w-[150px] h-10 px-5 rounded-full bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-slate-600 transition-colors overflow-hidden group"
      aria-label={`${brand.name} sayfasına git`}
    >
      {/* Renkli ışıltılı nokta — marka rengini taşır */}
      <span
        aria-hidden
        className="w-1.5 h-1.5 rounded-full transition-[background-color,box-shadow] duration-700 ease-out shrink-0"
        style={{
          backgroundColor: brand.color,
          boxShadow: `0 0 10px ${brand.color}90`,
        }}
      />

      {/* Marka adı — key değişince fade-up animasyonu */}
      <span
        key={`${brand.name}-${tick}`}
        className="text-sm font-medium text-slate-100 brand-morph-text whitespace-nowrap"
      >
        {brand.name}
      </span>

      {/* Alt progress bar — her cycle'da 0→100 */}
      <span
        aria-hidden
        className="absolute bottom-0 left-2 right-2 h-px bg-slate-700/30 overflow-hidden rounded-full"
      >
        <span
          key={`progress-${tick}-${paused ? 'p' : 'r'}`}
          className="block h-full origin-left transition-transform"
          style={{
            backgroundColor: brand.color,
            animation: paused
              ? 'none'
              : `brand-progress ${CYCLE_MS}ms linear forwards`,
          }}
        />
      </span>
    </Link>
  )
}
