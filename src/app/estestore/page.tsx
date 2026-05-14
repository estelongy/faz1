import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isProfessional, type UserRole } from '@/lib/estestore'
import ProductCard, { type ProductCardData } from './ProductCard'
import ProfessionalToggle from './ProfessionalToggle'
import EsteStoreHero from './EsteStoreHero'
import EsteStoreSidebar from './EsteStoreSidebar'
import BrandMorphButton from './BrandMorphButton'
import {
  ArrowRight,
  Search,
  ShoppingBag,
  ShieldCheck,
  Bandage,
  Star,
  Hourglass,
  Activity,
  Plus,
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

  const { data: kozmetikProducts } = await supabase
    .from('products')
    .select(
      'id, slug, name, cover_image_url, images, price, category, subcategory, pricing_tiers'
    )
    .eq('category', 'kozmetik')
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(18)

  const { data: sarfProducts } = await supabase
    .from('products')
    .select(
      'id, slug, name, cover_image_url, images, price, category, subcategory, pricing_tiers'
    )
    .eq('category', 'sarf_medikal')
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(9)

  const { data: akademiPackages } = await supabase
    .from('course_packages')
    .select('id, slug, title, cover_image_url, price, currency')
    .eq('is_published', true)
    .order('total_purchases', { ascending: false })
    .limit(6)

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

  const heroShowcase = allKozmetik.slice(0, 5)
  const longevityFeatured = allKozmetik.slice(0, 6)
  const islemSonrasiFeatured = allKozmetik.slice(6, 12)
  const biyohackingFeatured = allKozmetik.slice(12, 18)

  const ProSections = (
    <>
      <section id="sarf-medikal" className="space-y-6">
        <SectionHeader
          eyebrow="Klinik İçin"
          title="Sarf & Medikal"
          subtitle="Hekim kullanımına özel sarf, enjektabl ve medikal ürünler"
          href="/estestore/kategori/sarf-medikal"
        />
        {sarf.length === 0 ? (
          <EmptyState message="Henüz ürün yok." />
        ) : (
          <ProductGrid products={sarf} isPro={isPro} />
        )}
      </section>

      <section id="akademi" className="space-y-6">
        <SectionHeader
          eyebrow="Estelongy Akademi"
          title="Eğitim & Sertifika"
          subtitle="Klinik gelişimin için Estelongy onaylı eğitim paketleri"
          href="/akademi"
        />
        {!akademiPackages || akademiPackages.length === 0 ? (
          <EmptyState message="Henüz paket yayınlanmadı." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {akademiPackages.map((pkg: AkademiPackageMini) => (
              <AkademiCard key={pkg.id} pkg={pkg} isPro={isPro} />
            ))}
          </div>
        )}
      </section>
    </>
  )

  return (
    <main className="bg-white min-h-screen text-slate-900">
      <TopNav user={!!user} />

      <div className="flex">
        {/* Sidebar — üstten itibaren hero'nun yanında, sol üst boşluk yok */}
        <EsteStoreSidebar />

        {/* Ana içerik */}
        <div id="urunler" className="flex-1 min-w-0 bg-white">
          {/* Hero (33vh) — KOYU kalır (premium cinematic) */}
          <EsteStoreHero showcaseProducts={heroShowcase} />

          <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 lg:py-16 space-y-20">
            <section id="longevity" className="space-y-6">
              <SectionHeader
                eyebrow="Marka Kimliği"
                title="Longevity — İçten Zamansızlık"
                subtitle="NAD+, NMN, resveratrol — bilim destekli yaşlanma karşıtı"
                href="/estestore/kategori/longevity"
                accent="#C9A961"
              />
              {longevityFeatured.length === 0 ? (
                <EmptyState message="Bu kategoride yakında ürünler yer alacak." />
              ) : (
                <ProductGrid products={longevityFeatured} isPro={isPro} />
              )}
            </section>

            <section id="islem-sonrasi" className="space-y-6">
              <SectionHeader
                eyebrow="Klinik Köprüsü"
                title="Kliniğinizden sonraki adım"
                subtitle="Dolgu, botoks, lazer sonrası iyileşmenizi hızlandıran küratörlü bakım kitleri"
                href="/estestore/kategori/islem-sonrasi"
                accent="#10876B"
              />
              {islemSonrasiFeatured.length === 0 ? (
                <EmptyState message="Bu kategoride yakında ürünler yer alacak." />
              ) : (
                <ProductGrid products={islemSonrasiFeatured} isPro={isPro} />
              )}
            </section>

            <section id="biyohacking" className="space-y-6">
              <SectionHeader
                eyebrow="Diferansiyasyon"
                title="Biyohacking & Ölçüm"
                subtitle="Vücudunu ölç, kendini tanı — DNA, mikrobiyom, CGM ve wearable"
                href="/estestore/kategori/biyohacking-olcum"
                accent="#C9A961"
              />
              {biyohackingFeatured.length === 0 ? (
                <EmptyState message="Bu kategoride yakında ürünler yer alacak." />
              ) : (
                <ProductGrid products={biyohackingFeatured} isPro={isPro} />
              )}
            </section>

            <div className="pt-4">
              {isPro ? (
                <div className="space-y-20">{ProSections}</div>
              ) : (
                <ProfessionalToggle>{ProSections}</ProfessionalToggle>
              )}
            </div>

            <section className="py-8 lg:py-12 bg-[#FAFAF7] -mx-6 lg:-mx-10 px-6 lg:px-10 rounded-3xl">
              <div className="text-center mb-12 max-w-2xl mx-auto">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B7339] mb-3">
                  Neden EsteStore?
                </p>
                <h2 className="text-[28px] lg:text-[36px] font-medium text-slate-900 tracking-[-0.02em]">
                  Diğer mağazalardan farkımız
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
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
                  body="Estelongy kliniğinden gelen hastalar için doğal devam. Mimari boyunca kesintisiz yolculuk."
                />
              </div>
            </section>
          </div>

          <footer className="border-t border-slate-200 bg-[#FAFAF7]">
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="text-slate-900 font-medium text-lg mb-1">Estelongy</div>
                  <p className="text-sm text-slate-600">
                    Zamansız Güzellik Dünyası — BiyoAGE · EsteKlinik · EsteStore
                  </p>
                </div>
                <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                  <Link href="/hakkinda/sss" className="hover:text-slate-900 transition-colors">SSS</Link>
                  <Link href="/hakkinda/iletisim" className="hover:text-slate-900 transition-colors">İletişim</Link>
                  <Link href="/hakkinda/sozlesme" className="hover:text-slate-900 transition-colors">Sözleşme</Link>
                  <Link href="/hakkinda/cerez" className="hover:text-slate-900 transition-colors">Çerez</Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  )
}

/* ============================================================
   TopNav — EsteStore başrol (Estelongy yerine)
   Sol: [+ EsteStore] sarı buton (logo + ana sayfa link)
        Estelongy · BiyoAGE · EsteKlinik (altı çizili text, butonsuz)
   Sağ: Arama · Rehber · Giriş · Kayıt Ol · Sepet
   ============================================================ */
function TopNav({ user }: { user: boolean }) {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#0F172A]/90 border-b border-slate-800/60">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-6">
        {/* Sol: EsteStore lead + sub-brand'ler */}
        <div className="flex items-center gap-6">
          {/* EsteStore lead — logo görevi + ana sayfa link */}
          <Link
            href="/estestore"
            className="group inline-flex items-center gap-2 bg-[#C9A961] hover:bg-[#D4B872] text-[#0F172A] font-semibold pl-3 pr-4 py-2 rounded-full transition-all shadow-[0_4px_14px_rgba(201,169,97,0.25)] hover:shadow-[0_4px_20px_rgba(201,169,97,0.4)]"
            aria-label="EsteStore — anasayfaya dön"
          >
            <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-[#0F172A]/15">
              <Plus size={14} strokeWidth={2.5} />
            </span>
            <span className="text-[15px] tracking-tight">EsteStore</span>
          </Link>

          {/* Tek pill — sırayla Estelongy / BiyoAGE / EsteStore / EsteKlinik morph eder */}
          <div className="hidden md:block">
            <BrandMorphButton />
          </div>
        </div>

        {/* Sağ: Arama + Rehber + Giriş + Kayıt Ol + Sepet */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 transition-colors"
            aria-label="Ara"
          >
            <Search size={18} />
          </button>
          <Link
            href="/rehber"
            className="hidden sm:inline-flex px-3 h-10 items-center text-sm text-slate-300 hover:text-slate-100 transition-colors rounded-full hover:bg-slate-800/40"
          >
            Rehber
          </Link>
          {user ? (
            <Link
              href="/panel"
              className="px-4 h-10 inline-flex items-center text-sm text-slate-300 hover:text-slate-100 transition-colors rounded-full hover:bg-slate-800/40"
            >
              Hesabım
            </Link>
          ) : (
            <>
              <Link
                href="/giris"
                className="px-3 h-10 inline-flex items-center text-sm text-slate-300 hover:text-slate-100 transition-colors rounded-full hover:bg-slate-800/40"
              >
                Giriş
              </Link>
              <Link
                href="/kayit"
                className="hidden sm:inline-flex px-4 h-10 items-center text-sm font-medium text-[#0F172A] bg-slate-100 hover:bg-white transition-colors rounded-full"
              >
                Kayıt Ol
              </Link>
            </>
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
   SectionHeader
   ============================================================ */
function SectionHeader({
  eyebrow,
  title,
  subtitle,
  href,
  accent = '#8B7339',
}: {
  eyebrow: string
  title: string
  subtitle: string
  href: string
  accent?: string
}) {
  return (
    <div className="flex items-end justify-between gap-6 flex-wrap">
      <div className="space-y-2 min-w-0">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: accent }}
        >
          {eyebrow}
        </p>
        <h2 className="text-[26px] lg:text-[32px] font-medium text-slate-900 tracking-[-0.02em]">
          {title}
        </h2>
        <p className="text-base text-slate-600 max-w-2xl">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap font-medium"
      >
        Tümünü gör
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}

/* ============================================================
   ProductGrid — responsive 2/3/4 sütun, 8 ürün gösterir
   ============================================================ */
function ProductGrid({
  products,
  isPro,
}: {
  products: ProductCardData[]
  isPro: boolean
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {products.slice(0, 8).map((p) => (
        <ProductCard key={p.id} product={p} isPro={isPro} showPrice={true} />
      ))}
    </div>
  )
}

function ValueProp({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Star
  title: string
  body: string
}) {
  return (
    <div className="text-center md:text-left">
      <div className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-[#C9A961]/15 mb-4">
        <Icon size={22} className="text-[#8B7339]" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
      <p className="text-base text-slate-600 leading-relaxed">{body}</p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-14 px-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50">
      <ShieldCheck size={28} className="text-slate-400 mx-auto mb-3" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}

function AkademiCard({
  pkg,
  isPro,
}: {
  pkg: AkademiPackageMini
  isPro: boolean
}) {
  return (
    <Link
      href={isPro ? `/akademi/${pkg.slug}` : '/giris?next=/akademi'}
      className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[#C9A961]/60 hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-0.5 transition-all"
    >
      <div className="aspect-square bg-slate-50 overflow-hidden relative">
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
            <Bandage size={36} className="text-slate-300" />
          </div>
        )}
        {!isPro && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
            <div className="px-3 py-1.5 rounded-full bg-[#C9A961]/15 border border-[#C9A961]/40 text-[#8B7339] text-xs font-semibold">
              Profesyonel
            </div>
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-slate-900 text-[15px] font-medium leading-snug line-clamp-2 mb-3">
          {pkg.title}
        </h3>
        <div className="mt-auto">
          {isPro ? (
            <div className="text-[#8B7339] font-semibold text-lg">
              {new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: pkg.currency || 'TRY',
                maximumFractionDigits: 0,
              }).format(Number(pkg.price))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Fiyat için <span className="text-slate-700 font-medium">giriş yapın</span>
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
