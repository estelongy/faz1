'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  images: string[]
  alt: string
}

/**
 * Mobile-first ürün galeri — CSS scroll-snap ile yatay swipe.
 * Tek görselse dot göstermez. Çoklu görselse alt nokta indikatörü +
 * scroll konumuna göre aktif noktayı işaretler.
 */
export default function ProductGallery({ images, alt }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const el = trackRef.current
    if (!el || images.length <= 1) return
    const handler = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth)
      setActive(idx)
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [images.length])

  if (images.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 h-80 flex items-center justify-center mb-6">
        <div className="text-slate-300 text-8xl">✦</div>
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 h-80 flex items-center justify-center mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[0]} alt={alt} className="w-full h-full object-cover" />
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div
        ref={trackRef}
        className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl border border-slate-200 bg-slate-100 no-scrollbar"
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="shrink-0 w-full h-80 snap-center flex items-center justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${alt} ${i + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 mt-3">
        {images.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? 'w-6 bg-[#8B7339]' : 'w-1.5 bg-slate-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
