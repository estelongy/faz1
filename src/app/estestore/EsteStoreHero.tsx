'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Star, User, Stethoscope, Store } from 'lucide-react'
import type { ProductCardData } from './ProductCard'

type SlideKind = 'role-picker' | 'product-showcase'

interface BaseSlide {
  kind: SlideKind
  eyebrow: string
  title: React.ReactNode
  subtitle: string
}

interface ProductSlide extends BaseSlide {
  kind: 'product-showcase'
  ctaText: string
  ctaHref: string
  secondaryText?: string
  secondaryHref?: string
}

interface RolePickerSlide extends BaseSlide {
  kind: 'role-picker'
}

type Slide = ProductSlide | RolePickerSlide

interface Props {
  showcaseProducts: ProductCardData[]
}

export default function EsteStoreHero({ showcaseProducts }: Props) {
  const slides: Slide[] = [
    {
      kind: 'role-picker',
      eyebrow: 'Estelongy Marketplace',
      title: (
        <>
          Rolünü belirle,
          <br />
          <span className="text-[#C9A961]">Zamansız Güzellik Dünyası</span>na katıl.
        </>
      ),
      subtitle:
        'Hasta, hekim ya da iş ortağı — yolculuğun seninle başlasın. Zamansız Güzellik Mimarlığı.',
    },
    {
      kind: 'product-showcase',
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
      secondaryHref: '#egp-nedir',
    },
    {
      kind: 'product-showcase',
      eyebrow: 'Klinik Köprüsü',
      title: (
        <>
          Kliniğinden gelen
          <br />
          <span className="text-[#10876B]">iyileşme</span> burada devam eder.
        </>
      ),
      subtitle:
        'Dolgu, botoks, lazer sonrası küratörlü bakım kitleri — klinik tedavinin doğal devamı.',
      ctaText: 'İşlem Sonrası Bakım',
      ctaHref: '#islem-sonrasi',
    },
    {
      kind: 'product-showcase',
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
    <section className="relative overflow-hidden h-[33vh] min-h-[420px] bg-[#13192C] border-b border-slate-800/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1A2238] via-[#13192C] to-[#0F172A]/40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(201,169,97,0.14),_transparent_60%)]"
      />

      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="relative max-w-[1280px] mx-auto h-full px-6 lg:px-10">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center h-full">
              {/* Sol: metin */}
              <div className="space-y-4 lg:space-y-5">
                {/* Eyebrow — 14px bold */}
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#C9A961]">
                  {slide.eyebrow}
                </p>
                {/* Display H1 — 30/36/48 */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl leading-[1.08] font-bold text-white tracking-[-0.02em]">
                  {slide.title}
                </h1>
                {/* Body lead — 16/18 */}
                <p className="text-base lg:text-lg text-slate-200 leading-relaxed max-w-lg">
                  {slide.subtitle}
                </p>

                {slide.kind === 'product-showcase' && (
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {/* CTA — 16px semibold */}
                    <Link
                      href={slide.ctaHref}
                      className="inline-flex items-center gap-2 bg-[#C9A961] hover:bg-[#D4B872] text-[#0F172A] font-semibold text-base px-6 py-3 rounded-full transition-all hover:shadow-[0_8px_30px_rgba(201,169,97,0.35)]"
                    >
                      {slide.ctaText}
                      <ArrowRight size={16} />
                    </Link>
                    {slide.secondaryText && (
                      <Link
                        href={slide.secondaryHref ?? '#'}
                        className="inline-flex items-center gap-2 text-base font-semibold text-white hover:text-[#C9A961] px-2 py-3 transition-colors group"
                      >
                        {slide.secondaryText}
                        <ArrowRight
                          size={16}
                          className="opacity-70 group-hover:translate-x-1 transition-transform"
                        />
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Sağ: variant'a göre */}
              <div className="hidden lg:block relative h-full">
                {i === activeIndex && slide.kind === 'product-showcase' && (
                  <HeroShowcase products={showcaseProducts} />
                )}
                {i === activeIndex && slide.kind === 'role-picker' && (
                  <RolePickerComposition />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
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

/* ============================================================
   RolePickerComposition
   3 rol kartı + arka plan illüstrasyonu (3 figür "Zamansız Güzellik
   Dünyası"nı izliyor). Gerçek görsel /public/hero-3-roles.png olarak
   eklendiğinde otomatik kullanılacak.
   ============================================================ */
function RolePickerComposition() {
  // Rol kartları hedef düzeltmeleri:
  // - Kullanıcı: /kayit'a EsteStore galaksi stamp ile yolla (krem-altın signup ekranı), dead role=user kaldırıldı
  // - Hekim: text "Kliniğini büyüt" diyor → /esteklinik/basvur (klinik başvuru), eskiden bireysel hekim kayıt formuna gidiyordu (mismatch)
  // - İş Ortağı: /satici/basvur (doğru, dokunulmadı)
  const roles = [
    {
      label: 'Kullanıcı',
      sub: 'Gençlik skorunu öğren, ürün al',
      icon: User,
      href: '/kayit?g=estestore',
      color: '#C9A961',
    },
    {
      label: 'Hekim',
      sub: 'Kliniğini büyüt, EGP işletmesi kur',
      icon: Stethoscope,
      href: '/esteklinik/basvur',
      color: '#10876B',
    },
    {
      label: 'İş Ortağı',
      sub: 'Hekim onaylı ürünlerini sat',
      icon: Store,
      href: '/satici/basvur',
      color: '#8B7CC8',
    },
  ]

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      {/* Soft "dünya" glow arka plan — figürlerin baktığı ufuk */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/4 mx-auto w-[80%] h-[55%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(201,169,97,0.18),_rgba(16,135,107,0.06)_45%,_transparent_70%)] blur-2xl"
      />

      {/* 3 rol kartı */}
      <div className="relative grid grid-cols-3 gap-3 w-full max-w-md">
        {roles.map((role) => {
          const Icon = role.icon
          return (
            <Link
              key={role.label}
              href={role.href}
              className="group flex flex-col items-center gap-2 bg-[#1E293B]/70 backdrop-blur-sm border border-slate-700/60 hover:border-[color:var(--accent)] rounded-2xl p-4 transition-all hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.4)]"
              style={{ ['--accent' as never]: role.color }}
            >
              <span
                className="inline-flex w-11 h-11 items-center justify-center rounded-full transition-all group-hover:scale-110"
                style={{
                  backgroundColor: `${role.color}1F`,
                  color: role.color,
                }}
              >
                <Icon size={20} />
              </span>
              {/* Role label — 16px semibold (kart tıklanabilir) */}
              <span className="text-base font-semibold text-white">
                {role.label}
              </span>
              {/* Sub — 14px bold (kural: 14 → bold) */}
              <span className="text-sm font-semibold text-slate-300 text-center leading-tight">
                {role.sub}
              </span>
            </Link>
          )
        })}
      </div>

      {/* "Koltuk" soft accent — figürlerin altı (subtle SVG line art) */}
      <svg
        aria-hidden
        viewBox="0 0 400 60"
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[80%] opacity-30 pointer-events-none"
      >
        <path
          d="M 20 30 Q 200 50 380 30"
          stroke="#C9A961"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 40 35 Q 200 55 360 35"
          stroke="#C9A961"
          strokeWidth="0.8"
          fill="none"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    </div>
  )
}

function HeroShowcase({ products }: { products: ProductCardData[] }) {
  const fallback: ProductCardData[] = [
    { id: '1', name: 'NAD+ Premium', slug: null, cover_image_url: null, price: 2450, category: 'kozmetik' as const, subcategory: null, pricing_tiers: [] },
    { id: '2', name: 'Anti-Aging Serum', slug: null, cover_image_url: null, price: 3890, category: 'kozmetik' as const, subcategory: null, pricing_tiers: [] },
    { id: '3', name: 'Skin Booster', slug: null, cover_image_url: null, price: 1290, category: 'kozmetik' as const, subcategory: null, pricing_tiers: [] },
    { id: '4', name: 'Retinol Renewal', slug: null, cover_image_url: null, price: 1890, category: 'kozmetik' as const, subcategory: null, pricing_tiers: [] },
    { id: '5', name: 'NMN Longevity', slug: null, cover_image_url: null, price: 4250, category: 'kozmetik' as const, subcategory: null, pricing_tiers: [] },
  ]
  const showItems = products.length >= 5 ? products.slice(0, 5) : fallback

  const positions = [
    { left: '0%', top: '14%', rotate: -10, w: '34%', egp: 9.2, z: 10 },
    { left: '20%', top: '0%', rotate: -4, w: '34%', egp: 8.7, z: 20 },
    { left: '40%', top: '8%', rotate: 2, w: '34%', egp: 8.5, z: 30 },
    { left: '58%', top: '22%', rotate: 6, w: '34%', egp: 8.0, z: 20 },
    { left: '36%', top: '42%', rotate: -2, w: '34%', egp: 9.5, z: 40 },
  ]

  return (
    <div className="relative h-full w-full">
      {positions.map((pos, i) => (
        <div
          key={i}
          className="absolute aspect-[3/4]"
          style={{
            left: pos.left,
            top: pos.top,
            width: pos.w,
            transform: `rotate(${pos.rotate}deg)`,
            zIndex: pos.z,
          }}
        >
          <PremiumProductCard product={showItems[i]} egp={pos.egp} />
        </div>
      ))}
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
      <div className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 bg-[#C9A961] text-[#0F172A] text-sm font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full">
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
