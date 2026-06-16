'use client'

import { useState } from 'react'

interface Props {
  src: string | null
  alt: string
}

/**
 * Tekrar Sipariş rafının küçük kart görseli — bozuk URL'lerde altın initial fallback.
 */
export default function ReorderCardImage({ src, alt }: Props) {
  const [failed, setFailed] = useState(false)
  const initial = (alt?.trim()[0] ?? '✦').toUpperCase()

  if (!src || failed) {
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(201,169,97,0.10),transparent_55%)]" />
        <span className="relative font-black text-[#8B7339]/30 select-none leading-none text-[56px] tracking-tight">
          {initial}
        </span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={() => setFailed(true)} className="w-full h-full object-cover" />
  )
}
