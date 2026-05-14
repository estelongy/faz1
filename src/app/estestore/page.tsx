import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isProfessional, type UserRole } from '@/lib/estestore'
import { FEATURED_HOMEPAGE_CATEGORIES, HASTA_CATEGORIES } from '@/lib/estestore-categories'
import ProductCard, { type ProductCardData } from './ProductCard'
import ProfessionalToggle from './ProfessionalToggle'
import {
  ArrowRight,
  Search,
  ShoppingBag,
  Sparkles,
  Hourglass,
  Activity,
  ShieldCheck,
  Bandage,
  Star,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'EsteStore — Estelongy Marketplace',
  description:
    'Estelongy Gençlik Puanlı küratörlü güzellik ve longevity mağazası. Her ürün EGP eşiğinden geçti.',
}

interface AkademiPackageMini {
  id: string
  slug: string
  title: string
  cover_image_url: string | null
  price: number
  currency: string | null
}

export default async function EsteStorePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const role = (user?.app_metadata as Record<string, string> | undefined)?.role as UserRole ?? null
  const isPro = isProfessional(role)

  // Kozmetik — featured rows için (Longevity ve İşlem Sonrası satırlarını dolduruyoruz)
  const { data: kozmetikProducts } = await supabase
    .from('products')
    .select(
      'id, slug, name, cover_image_url, images, price, category, subcategory, pricing_tiers'
    )
    .eq('category', 'kozmetik')
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(12)

  const { data: sarfProducts } = await supabase
    .from('products')
    .select(
      'id, slug, name, cover_image_url, images, price, category, subcategory, pricing_tiers'
    )
    .eq('category', 'sarf_medikal')
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(12)

  const { data: akademiPackages } = await supabase
    .from('course_packages')
    .select('id, slug, title, cover_image_url, price, currency')
    .eq('is_published', true)
    .order('total_purchases', { ascending: false })
    .limit(8)

  const normalizeProduct = (p: {
    id: string
    slug: string | null
    name: string
    cover_image_url: string | null
    images: string[] | null
    price: number | string
    category: string
    subcategory: string | null
    pricing_tiers: unknown
  }): ProductCardData => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    cover_image_url: p.cover_image_url ?? p.images?.[0] ?? null,
    price: Number(p.price),
    category: p.category as ProductCardData['category'],
    subcategory: p.subcategory,
    pricing_tiers: Array.isArray(p.pricing_tiers)
      ? (p.pricing_tiers as ProductCardData['pricing_tiers'])
      : [],
  })

  const allKozmetik = (kozmetikProducts ?? []).map(normalizeProduct)
  const sarf = (sarfProducts ?? []).map(normalizeProduct)

  // Featured row sliceları — gerçek catalog mapping'i gelene kadar mevcut kozmetik query'sinden besliyoruz
  const longevityFeatured = allKozmetik.slice(0, 6)
  const islemSonrasiFeatured = allKozmetik.slice(6, 12)
  const heroShowcase = allKozmetik.slice(0, 3)

  const ProSections = (
    <>
      {/* Sarf & Medikal */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow="Klinik İçin"
          title="Sarf & Medikal"
          subtitle="Hekim kullanımına özel sarf, enjektabl ve medikal ürünler"
          href="/estestore/sarf-medikal"
        />
        {sarf.length === 0 ? (
          <EmptyState message="Henüz ürün yok." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {sarf.map((p) => (
              <ProductCard key={p.id} product={p} isPro={isPro} showPrice={isPro} />
            ))}
          </div>
        )}
      </section>

      {/* Akademi */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow="Estelongy Akademi"
          title="Eğitim & Sertifika"
          subtitle="Klinik gelişimin için Estelongy onaylı eğitim paketleri"
          href="/akademi"
        />
        {!akademiPackages || akademiPackages.length === 0 ? (
          <EmptyState message="Henüz paket yayınlanmadı." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {akademiPackages.map((pkg: AkademiPackageMini) => (
              <AkademiCard key={pkg.id} pkg={pkg} isPro={isPro} />
            ))}
          </div>
        )}
      </section>
    </>
  )

  return (
    <main className="bg-[#0F172A] min-h-screen text-slate-100">
      {/* TOP NAV (master) */}
      <TopNav user={!!user} />

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Subtle gold glow background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(201,169,97,0.12),_transparent_60%)]"
        />
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
            {/* Sol: başlık + CTA */}
            <div className="space-y-8">
              <p className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A961]">
                EsteStore
              </p>
              <h1 className="text-[40px] sm:text-[52px] lg:text-[64px] leading-[1.05] font-medium text-slate-50 tracking-[-0.02em]">
                Estelongy Gençlik Puanlı
                <br />
                <span className="text-[#C9A961]">zamansız güzellik</span> ürünleri.
              </h1>
              <p className="text-lg lg:text-xl text-slate-300 leading-relaxed max-w-xl">
                Küratörlü ürün koleksiyonu — her biri Estelongy Gençlik Puanı eşiğinden geçti.
                Longevity, anti-aging, klinik ürünleri tek çatı altında.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="#kategoriler"
                  className="inline-flex items-center gap-2 bg-[#C9A961] hover:bg-[#D4B872] text-[#0F172A] font-semibold px-7 py-4 rounded-full transition-all hover:shadow-[0_8px_30px_rgba(201,169,97,0.35)]"
                >
                  Keşfet
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/rehber/longevity-nedir"
                  className="inline-flex items-center gap-2 text-slate-300 hover:text-slate-50 px-2 py-4 transition-colors group"
                >
                  Estelongy Gençlik Puanı nedir?
                  <ArrowRight
                    size={16}
                    className="opacity-60 group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              </div>
            </div>

            {/* Sağ: premium ürün showcase */}
            <div className="relative">
              <HeroShowcase products={heroShowcase} />
            </div>
          </div>
        </div>
      </section>

      {/* KATEGORİLER */}
      <section id="kategoriler" className="py-24 lg:py-32">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A961] mb-3">
              Kategoriler
            </p>
            <h2 className="text-[36px] lg:text-[44px] font-medium text-slate-50 tracking-[-0.02em] mb-3">
              Senin için kategoriler
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl">
              Estelongy Gençlik Skorundan gelen önerilerle başla, veya küratörlü
              kategorilerden keşfet.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {FEATURED_HOMEPAGE_CATEGORIES.map((cat) => (
              <CategoryCard key={cat.slug} category={cat} />
            ))}
            {/* Tümünü gör kartı */}
            <Link
              href="#tum-kategoriler"
              className="group flex flex-col items-center justify-center gap-3 aspect-square rounded-2xl bg-gradient-to-br from-[#C9A961]/15 to-[#10876B]/10 border border-[#C9A961]/30 hover:border-[#C9A961]/60 transition-all hover:shadow-[0_8px_30px_rgba(201,169,97,0.15)]"
            >
              <div className="w-12 h-12 rounded-full bg-[#C9A961]/20 flex items-center justify-center group-hover:bg-[#C9A961]/30 transition-colors">
                <ArrowRight size={22} className="text-[#C9A961]" />
              </div>
              <span className="text-[15px] font-medium text-slate-50">Tüm Kategoriler</span>
              <span className="text-xs text-slate-400">{HASTA_CATEGORIES.length} kategori</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED: Longevity */}
      <FeaturedRow
        eyebrow="Marka Kimliği"
        title="Longevity — İçten Zamansızlık"
        subtitle="Estelongy DNA'sının ürün karşılığı. NAD+, NMN, resveratrol — bilim destekli yaşlanma karşıtı."
        products={longevityFeatured}
        isPro={isPro}
        href="/estestore/longevity"
        accentColor="#C9A961"
      />

      {/* FEATURED: İşlem Sonrası */}
      <FeaturedRow
        eyebrow="Klinik Köprüsü"
        title="Kliniğinizden sonraki adım"
        subtitle="Dolgu, botoks, lazer sonrası iyileşmenizi hızlandıran küratörlü bakım kitleri."
        products={islemSonrasiFeatured}
        isPro={isPro}
        href="/estestore/islem-sonrasi"
        accentColor="#10876B"
      />

      {/* DEĞER ÖNERİSİ */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-transparent via-[#1E293B]/40 to-transparent">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A961] mb-3">
              Neden EsteStore?
            </p>
            <h2 className="text-[36px] lg:text-[44px] font-medium text-slate-50 tracking-[-0.02em]">
              Diğer mağazalardan farkımız
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <ValueProp
              icon={Star}
              title="Estelongy Gençlik Puanlı"
              body="Her ürün 10 üzerinden değerlendirildi. Etki, güvenlik, kanıt ve longevity katkısı."
            />
            <ValueProp
              icon={Hourglass}
              title="Longevity Odaklı"
              body="Sadece güzelleştiren değil, sağlığa hizmet eden ürünler. Bilim destekli."
            />
            <ValueProp
              icon={Activity}
              title="Klinik ↔ Ev Sürekliliği"
              body="Estelongy kliniğinden gelen hastalar için doğal devam. Tek hesap, tüm yolculuk."
            />
          </div>
        </div>
      </section>

      {/* PROFESYONEL BÖLÜMLER */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-16">
          {isPro ? (
            ProSections
          ) : (
            <ProfessionalToggle>{ProSections}</ProfessionalToggle>
          )}
        </div>
      </section>

      {/* FOOTER (sade, sonra zenginleşir) */}
      <footer className="border-t border-slate-800/60 mt-16">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="text-slate-50 font-medium text-lg mb-1">Estelongy</div>
              <p className="text-sm text-slate-500">
                Zamansız Güzellik Dünyası — BiyoAGE · EsteKlinik · EsteStore
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-slate-400">
              <Link href="/hakkinda/sss" className="hover:text-slate-100 transition-colors">
                SSS
              </Link>
              <Link href="/hakkinda/iletisim" className="hover:text-slate-100 transition-colors">
                İletişim
              </Link>
              <Link href="/hakkinda/sozlesme" className="hover:text-slate-100 transition-colors">
                Sözleşme
              </Link>
              <Link href="/hakkinda/cerez" className="hover:text-slate-100 transition-colors">
                Çerez
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

/* ============================================================
   COMPONENT: TopNav (3-dünya nav)
   ============================================================ */
function TopNav({ user }: { user: boolean }) {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#0F172A]/85 border-b border-slate-800/60">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Sol: logo + 3 dünya */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-slate-50 font-medium text-lg tracking-tight">
            Estelongy
          </Link>
          <div className="hidden md:flex items-center text-sm">
            <Link
              href="/"
              className="px-3 py-2 text-slate-400 hover:text-slate-100 transition-colors"
            >
              BiyoAGE
            </Link>
            <span className="text-slate-700">·</span>
            <Link
              href="/klinikler"
              className="px-3 py-2 text-slate-400 hover:text-slate-100 transition-colors"
            >
              EsteKlinik
            </Link>
            <span className="text-slate-700">·</span>
            <Link
              href="/estestore"
              className="px-3 py-2 text-[#C9A961] font-medium relative"
            >
              EsteStore
              <span className="absolute bottom-0 left-3 right-3 h-px bg-[#C9A961]" />
            </Link>
          </div>
        </div>

        {/* Sağ: arama, hesap, sepet */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 transition-colors"
            aria-label="Ara"
          >
            <Search size={18} />
          </button>
          {user ? (
            <Link
              href="/panel"
              className="px-4 h-10 inline-flex items-center text-sm text-slate-300 hover:text-slate-100 transition-colors"
            >
              Hesabım
            </Link>
          ) : (
            <Link
              href="/giris"
              className="px-4 h-10 inline-flex items-center text-sm text-slate-300 hover:text-slate-100 transition-colors"
            >
              Giriş
            </Link>
          )}
          <Link
            href="/sepet"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 transition-colors"
            aria-label="Sepet"
          >
            <ShoppingBag size={18} />
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ============================================================
   COMPONENT: HeroShowcase
   Premium ürün collage hero'nun sağında
   ============================================================ */
function HeroShowcase({ products }: { products: ProductCardData[] }) {
  // Demo placeholder (DB'de ürün yoksa)
  const showItems =
    products.length > 0
      ? products
      : [
          { id: '1', name: 'Estelongy Gençlik Puanı 9.2', slug: null, cover_image_url: null, price: 2450, category: 'kozmetik' as const, subcategory: null, pricing_tiers: [] },
          { id: '2', name: 'NAD+ Premium', slug: null, cover_image_url: null, price: 3890, category: 'kozmetik' as const, subcategory: null, pricing_tiers: [] },
          { id: '3', name: 'Anti-Aging Serum', slug: null, cover_image_url: null, price: 1290, category: 'kozmetik' as const, subcategory: null, pricing_tiers: [] },
        ]

  return (
    <div className="relative h-[460px] lg:h-[520px]">
      {/* Background gold ring */}
      <div
        aria-hidden
        className="absolute inset-8 rounded-full border border-[#C9A961]/15 blur-[1px]"
      />
      <div
        aria-hidden
        className="absolute inset-16 rounded-full border border-[#C9A961]/10"
      />

      {/* 3 ürün kartı, hafif rotasyon ve overlap */}
      <div className="absolute left-0 top-12 w-[55%] aspect-[3/4] rotate-[-6deg] z-10">
        <PremiumProductCard product={showItems[0]} egp={9.2} />
      </div>
      <div className="absolute right-0 top-0 w-[55%] aspect-[3/4] rotate-[5deg] z-20">
        <PremiumProductCard product={showItems[1]} egp={8.7} />
      </div>
      <div className="absolute left-[22%] bottom-0 w-[55%] aspect-[3/4] rotate-[-2deg] z-30">
        <PremiumProductCard product={showItems[2]} egp={8.5} />
      </div>
    </div>
  )
}

function PremiumProductCard({ product, egp }: { product: ProductCardData; egp: number }) {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-slate-700/60 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden">
      {/* Gold halo */}
      <div
        aria-hidden
        className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[#C9A961]/20 via-transparent to-transparent pointer-events-none"
      />
      <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 bg-[#C9A961] text-[#0F172A] text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
        <Star size={10} fill="currentColor" />
        EGP {egp}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-8">
        {product.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.cover_image_url}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles size={48} className="text-[#C9A961]/40" />
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   COMPONENT: CategoryCard
   ============================================================ */
function CategoryCard({ category }: { category: { slug: string; name: string; shortName?: string; description: string; icon: typeof Sparkles; egpFocus?: boolean; bridgeToKlinik?: boolean } }) {
  const Icon = category.icon
  const isHighlight = category.egpFocus

  return (
    <Link
      href={`/estestore/${category.slug}`}
      className={`group relative flex flex-col aspect-square rounded-2xl p-5 border transition-all overflow-hidden ${
        isHighlight
          ? 'bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-[#C9A961]/30 hover:border-[#C9A961]/60'
          : 'bg-[#1E293B]/60 border-slate-800/80 hover:border-slate-700'
      } hover:shadow-[0_8px_30px_rgba(201,169,97,0.12)] hover:-translate-y-0.5`}
    >
      {/* EGP focus için subtle background sparkle */}
      {isHighlight && (
        <div
          aria-hidden
          className="absolute -top-6 -right-6 w-24 h-24 bg-[#C9A961]/10 rounded-full blur-2xl group-hover:bg-[#C9A961]/15 transition-colors"
        />
      )}

      {category.bridgeToKlinik && (
        <span className="absolute top-3 right-3 text-[9px] font-semibold uppercase tracking-wider text-[#10876B] bg-[#10876B]/15 px-2 py-0.5 rounded-full">
          Klinik
        </span>
      )}

      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-auto ${
          isHighlight ? 'bg-[#C9A961]/15' : 'bg-slate-800/80'
        }`}
      >
        <Icon size={20} className={isHighlight ? 'text-[#C9A961]' : 'text-slate-300'} />
      </div>

      <div className="mt-4">
        <h3 className="text-[15px] font-medium text-slate-50 leading-tight">
          {category.shortName ?? category.name}
        </h3>
        <p className="text-[12px] text-slate-500 mt-1.5 leading-snug line-clamp-2 group-hover:text-slate-400 transition-colors">
          {category.description}
        </p>
      </div>
    </Link>
  )
}

/* ============================================================
   COMPONENT: FeaturedRow
   Horizontal scroll carousel for product showcase
   ============================================================ */
function FeaturedRow({
  eyebrow,
  title,
  subtitle,
  products,
  isPro,
  href,
  accentColor = '#C9A961',
}: {
  eyebrow: string
  title: string
  subtitle: string
  products: ProductCardData[]
  isPro: boolean
  href: string
  accentColor?: string
}) {
  return (
    <section className="py-20 lg:py-24">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-3"
              style={{ color: accentColor }}
            >
              {eyebrow}
            </p>
            <h2 className="text-[32px] lg:text-[40px] font-medium text-slate-50 tracking-[-0.02em] mb-3">
              {title}
            </h2>
            <p className="text-base lg:text-lg text-slate-400 max-w-2xl">{subtitle}</p>
          </div>
          <Link
            href={href}
            className="hidden sm:inline-flex items-center gap-2 text-sm text-slate-300 hover:text-slate-50 transition-colors whitespace-nowrap"
          >
            Tümünü gör
            <ArrowRight size={14} />
          </Link>
        </div>

        {products.length === 0 ? (
          <EmptyState message="Bu kategoride yakında ürünler yer alacak." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {products.slice(0, 5).map((p) => (
              <ProductCard key={p.id} product={p} isPro={isPro} showPrice={true} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* ============================================================
   COMPONENT: ValueProp
   ============================================================ */
function ValueProp({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Sparkles
  title: string
  body: string
}) {
  return (
    <div className="text-center md:text-left">
      <div className="inline-flex w-14 h-14 items-center justify-center rounded-2xl bg-[#C9A961]/15 mb-5">
        <Icon size={26} className="text-[#C9A961]" />
      </div>
      <h3 className="text-xl font-medium text-slate-50 mb-3">{title}</h3>
      <p className="text-base text-slate-400 leading-relaxed">{body}</p>
    </div>
  )
}

/* ============================================================
   COMPONENT: SectionHeader (Professional sections için)
   ============================================================ */
function SectionHeader({
  eyebrow,
  title,
  subtitle,
  href,
}: {
  eyebrow: string
  title: string
  subtitle: string
  href: string
}) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A961] mb-2">
          {eyebrow}
        </p>
        <h2 className="text-2xl lg:text-3xl font-medium text-slate-50 tracking-[-0.02em] mb-2">
          {title}
        </h2>
        <p className="text-sm lg:text-base text-slate-400">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-slate-50 transition-colors whitespace-nowrap"
      >
        Tümü
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}

/* ============================================================
   COMPONENT: EmptyState
   ============================================================ */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-slate-800 bg-[#1E293B]/30">
      <ShieldCheck size={32} className="text-slate-600 mx-auto mb-3" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}

/* ============================================================
   COMPONENT: AkademiCard
   ============================================================ */
function AkademiCard({ pkg, isPro }: { pkg: AkademiPackageMini; isPro: boolean }) {
  return (
    <Link
      href={isPro ? `/akademi/${pkg.slug}` : '/giris?next=/akademi'}
      className="group flex flex-col bg-[#1E293B]/60 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-[#C9A961]/40 transition-all"
    >
      <div className="aspect-square bg-slate-800/50 overflow-hidden relative">
        {pkg.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pkg.cover_image_url}
            alt={pkg.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              !isPro ? 'blur-[2px] opacity-80' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Bandage size={36} className="text-slate-600" />
          </div>
        )}
        {!isPro && (
          <div className="absolute inset-0 bg-[#0F172A]/60 flex items-center justify-center backdrop-blur-[1px]">
            <div className="px-3 py-1.5 rounded-full bg-[#C9A961]/15 border border-[#C9A961]/40 text-[#C9A961] text-xs font-semibold">
              Profesyonel
            </div>
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-slate-50 text-[15px] font-medium leading-snug line-clamp-2 mb-3">
          {pkg.title}
        </h3>
        <div className="mt-auto">
          {isPro ? (
            <div className="text-[#C9A961] font-semibold text-lg">
              {new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: pkg.currency || 'TRY',
                maximumFractionDigits: 0,
              }).format(Number(pkg.price))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Fiyat için <span className="text-slate-300 font-medium">giriş yapın</span>
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
