'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  images: string[]
  alt: string
}

function FallbackTile({ alt }: { alt: string }) {
  const initial = (alt?.trim()[0] ?? '✦').toUpperCase()
  return (
    <div className="w-full h-full flex items-center justify-center relative bg-gradient-to-br from-[#FAFAF7] via-white to-[#F5F0E5]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(201,169,97,0.10),transparent_55%)]" />
      <span className="relative font-black text-[#8B7339]/30 select-none leading-none text-[120px] tracking-tight">
        {initial}
      </span>
      <span className="absolute bottom-3 right-3 text-[10px] uppercase tracking-[0.18em] font-bold text-[#8B7339]/50">
        EsteStore
      </span>
    </div>
  )
}

function GalleryImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <FallbackTile alt={alt} />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="w-full h-full object-cover"
    />
  )
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
      <div className="rounded-2xl overflow-hidden border border-slate-200 h-80 mb-6">
        <FallbackTile alt={alt} />
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div className="rounded-2xl overflow-hidden border border-slate-200 h-80 mb-6">
        <GalleryImage src={images[0]} alt={alt} />
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div
        ref={trackRef}
        className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl border border-slate-200 no-scrollbar"
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="shrink-0 w-full h-80 snap-center"
          >
            <GalleryImage src={src} alt={`${alt} ${i + 1}`} />
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
