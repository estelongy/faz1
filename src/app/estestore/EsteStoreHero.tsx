'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Star } from 'lucide-react'
import type { ProductCardData } from './ProductCard'

interface HeroSlide {
  eyebrow: string
  title: React.ReactNode
  subtitle: string
  ctaText: string
  ctaHref: string
  secondaryText?: string
  secondaryHref?: string
}

interface Props {
  showcaseProducts: ProductCardData[]
}

export default function EsteStoreHero({ showcaseProducts }: Props) {
  const slides: HeroSlide[] = [
    {
      eyebrow: 'EsteStore',
      title: (
        <>
          Estelongy Gençlik Puanlı
          <br />
          <span className="text-[#C9A961]">zamansız güzellik</span> ürünleri.
        </>
      ),
      subtitle:
        'Küratörlü ürün koleksiyonu — her biri Estelongy Gençlik Puanı eşiğinden geçti.',
      ctaText: 'Keşfet',
      ctaHref: '#urunler',
      secondaryText: 'EGP nedir?',
      secondaryHref: '/rehber/longevity-nedir',
    },
    {
      eyebrow: 'Klinik Köprüsü',
      title: (
        <>
          Kliniğinden gelen
          <br />
          <span className="text-[#10876B]">iyileşme</span> burada devam eder.
        </>
      ),
      subtitle:
        'Dolgu, botoks, lazer sonrası küratörlü bakım kitleri. EsteKlinik ↔ EsteStore tek hesap.',
      ctaText: 'İşlem Sonrası Bakım',
      ctaHref: '#islem-sonrasi',
    },
    {
      eyebrow: 'Longevity',
      title: (
        <>
          Vücudunu ölç,
          <br />
          <span className="text-[#C9A961]">kendini tanı</span>.
        </>
      ),
      subtitle:
        'NAD+, NMN, mikrobiyom kitleri, CGM — bilim destekli kişiselleştirilmiş longevity.',
      ctaText: 'Longevity Ürünleri',
      ctaHref: '#longevity',
    },
  ]

  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % slides.length)
    }, 6500)
    return () => clearInterval(id)
  }, [slides.length])

  return (
    <section className="relative overflow-hidden h-[33vh] min-h-[360px]">
      {/* Gold glow background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(201,169,97,0.12),_transparent_60%)]"
      />

      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="relative max-w-[1280px] mx-auto h-full px-6 lg:px-10">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-12 items-center h-full">
              {/* Sol: metin */}
              <div className="space-y-4 lg:space-y-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A961]">
                  {slide.eyebrow}
                </p>
                <h1 className="text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.08] font-medium text-slate-50 tracking-[-0.02em]">
                  {slide.title}
                </h1>
                <p className="text-base lg:text-lg text-slate-300 leading-relaxed max-w-lg">
                  {slide.subtitle}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    href={slide.ctaHref}
                    className="inline-flex items-center gap-2 bg-[#C9A961] hover:bg-[#D4B872] text-[#0F172A] font-semibold px-6 py-3 rounded-full transition-all hover:shadow-[0_8px_30px_rgba(201,169,97,0.35)]"
                  >
                    {slide.ctaText}
                    <ArrowRight size={16} />
                  </Link>
                  {slide.secondaryText && (
                    <Link
                      href={slide.secondaryHref ?? '#'}
                      className="inline-flex items-center gap-2 text-slate-300 hover:text-slate-50 px-2 py-3 transition-colors group text-sm"
                    >
                      {slide.secondaryText}
                      <ArrowRight
                        size={14}
                        className="opacity-60 group-hover:translate-x-1 transition-transform"
                      />
                    </Link>
                  )}
                </div>
              </div>

              {/* Sağ: ürün showcase (sadece ilk slide'da) */}
              <div className="hidden lg:block relative h-full">
                {i === 0 && <HeroShowcase products={showcaseProducts} />}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === activeIndex
                ? 'w-8 bg-[#C9A961]'
                : 'w-1.5 bg-slate-600 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    </section>
  )
}

function HeroShowcase({ products }: { products: ProductCardData[] }) {
  const showItems =
    products.length >= 3
      ? products.slice(0, 3)
      : [
          { id: '1', name: 'NAD+ Premium', slug: null, cover_image_url: null, price: 2450, category: 'kozmetik' as const, subcategory: null, pricing_tiers: [] },
          { id: '2', name: 'Anti-Aging Serum', slug: null, cover_image_url: null, price: 3890, category: 'kozmetik' as const, subcategory: null, pricing_tiers: [] },
          { id: '3', name: 'Skin Booster', slug: null, cover_image_url: null, price: 1290, category: 'kozmetik' as const, subcategory: null, pricing_tiers: [] },
        ]

  return (
    <div className="relative h-full">
      <div className="absolute left-0 top-[20%] w-[50%] aspect-[3/4] rotate-[-6deg] z-10">
        <PremiumProductCard product={showItems[0]} egp={9.2} />
      </div>
      <div className="absolute right-0 top-[8%] w-[50%] aspect-[3/4] rotate-[5deg] z-20">
        <PremiumProductCard product={showItems[1]} egp={8.7} />
      </div>
      <div className="absolute left-[25%] bottom-0 w-[50%] aspect-[3/4] rotate-[-2deg] z-30">
        <PremiumProductCard product={showItems[2]} egp={8.5} />
      </div>
    </div>
  )
}

function PremiumProductCard({
  product,
  egp,
}: {
  product: ProductCardData
  egp: number
}) {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-slate-700/60 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden">
      <div
        aria-hidden
        className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[#C9A961]/20 via-transparent to-transparent pointer-events-none"
      />
      <div className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 bg-[#C9A961] text-[#0F172A] text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full">
        <Star size={9} fill="currentColor" />
        EGP {egp}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-6">
        {product.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.cover_image_url}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <Sparkles size={36} className="text-[#C9A961]/40" />
        )}
      </div>
    </div>
  )
}
