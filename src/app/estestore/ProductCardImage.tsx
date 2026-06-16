'use client'

import { useState } from 'react'

interface Props {
  src: string | null | undefined
  alt: string
  /** Fiyat gizli (preview/locked) — fallback'te kilit overlay'i için className eklenir */
  dim?: boolean
}

/**
 * EsteStore ürün kart görseli — URL erişilemezse altın initial harf fallback'ine düşer.
 * Sunucudaki `cover_image_url` dolu ama 404 gibi durumlarda broken-img ikonu yerine
 * marka-tutarlı zarif boş durum.
 */
export default function ProductCardImage({ src, alt, dim }: Props) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed
  const initial = (alt?.trim()[0] ?? '✦').toUpperCase()

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src!}
        alt={alt}
        onError={() => setFailed(true)}
        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
          dim ? 'blur-[2px] opacity-80' : ''
        }`}
      />
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(201,169,97,0.10),transparent_55%)]" />
      <span className="relative font-black text-[#8B7339]/30 select-none leading-none text-[96px] tracking-tight">
        {initial}
      </span>
      <span className="absolute bottom-2 right-2 text-[9px] uppercase tracking-[0.18em] font-bold text-[#8B7339]/50">
        EsteStore
      </span>
    </div>
  )
}
