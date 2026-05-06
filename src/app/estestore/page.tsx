import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isProfessional, type UserRole } from '@/lib/estestore'
import ProductCard, { type ProductCardData } from './ProductCard'
import ProfessionalToggle from './ProfessionalToggle'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'EsteStore — Estelongy Marketplace',
  description: 'Kozmetik, sarf & medikal ve akademik eğitim paketleri tek çatı altında.',
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

  // Kullanıcı + rol
  const { data: { user } } = await supabase.auth.getUser()
  const role = (user?.app_metadata as Record<string, string> | undefined)?.role as UserRole ?? null
  const isPro = isProfessional(role)

  // Kozmetik — herkes görür
  const { data: kozmetikProducts } = await supabase
    .from('products')
    .select('id, slug, name, cover_image_url, images, price, category, subcategory, pricing_tiers')
    .eq('category', 'kozmetik')
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(12)

  // Sarf & Medikal — yine çekiyoruz; yetkisi olmayan preview görür
  const { data: sarfProducts } = await supabase
    .from('products')
    .select('id, slug, name, cover_image_url, images, price, category, subcategory, pricing_tiers')
    .eq('category', 'sarf_medikal')
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(12)

  // Akademi — course_packages'tan
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

  const kozmetik = (kozmetikProducts ?? []).map(normalizeProduct)
  const sarf = (sarfProducts ?? []).map(normalizeProduct)

  // Profesyonel bölümleri (Sarf + Akademi)
  const ProSections = (
    <>
      {/* Sarf & Medikal */}
      <section>
        <header className="flex items-end justify-between mb-4 px-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-1">
              Tedarikçiler
            </p>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>💉</span> Sarf & Medikal
            </h2>
          </div>
          <Link href="/estestore/sarf-medikal" className="text-violet-300 hover:text-violet-200 text-sm font-semibold">
            Tümü →
          </Link>
        </header>

        {sarf.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-10">
            Henüz ürün yok.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sarf.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                isPro={isPro}
                showPrice={isPro}
              />
            ))}
          </div>
        )}
      </section>

      {/* Akademi */}
      <section>
        <header className="flex items-end justify-between mb-4 px-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-1">
              Estelongy
            </p>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>🎓</span> Akademi — Eğitim Paketleri
            </h2>
          </div>
          <Link href="/akademi" className="text-violet-300 hover:text-violet-200 text-sm font-semibold">
            Tümü →
          </Link>
        </header>

        {!akademiPackages || akademiPackages.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-10">
            Henüz paket yayınlanmadı.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {akademiPackages.map((pkg: AkademiPackageMini) => (
              <Link
                key={pkg.id}
                href={isPro ? `/akademi/${pkg.slug}` : '/giris?next=/akademi'}
                className="group flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-violet-500/40 transition-all"
              >
                <div className="aspect-square bg-slate-800 overflow-hidden relative">
                  {pkg.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pkg.cover_image_url}
                      alt={pkg.title}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform ${
                        !isPro ? 'blur-[2px] opacity-80' : ''
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">🎓</div>
                  )}
                  {!isPro && (
                    <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                      <div className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                        🔒 Profesyonel
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-white text-sm font-semibold leading-snug line-clamp-2 mb-3">{pkg.title}</h3>
                  <div className="mt-auto">
                    {isPro ? (
                      <div className="text-emerald-400 font-black text-lg">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: pkg.currency || 'TRY',
                          maximumFractionDigits: 0,
                        }).format(Number(pkg.price))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        Fiyat için <span className="text-violet-300 font-semibold">giriş yapın</span>
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Hero */}
      <header className="text-center space-y-3">
        <p className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
          Estelongy Marketplace
        </p>
        <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-white via-emerald-200 to-violet-300 bg-clip-text text-transparent">
          EsteStore
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          Kozmetik, sarf & medikal ve akademik eğitim paketleri tek çatı altında.
          {' '}<span className="text-slate-300">Klinikler ve sağlık profesyonelleri</span>{' '}
          için özel fiyat ve kademeli toplu alım.
        </p>
      </header>

      {/* Profesyonel uyarı şeridi (girişsiz) */}
      {!user && (
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            <span>👨‍⚕️</span>
            <span>
              Sağlık profesyoneli misin? Eğitim ve sarf ürünlerini görmek için{' '}
              <Link href="/giris" className="underline font-semibold">giriş yap</Link>{' '}
              ya da{' '}
              <Link href="/kurumsal/saglik-profesyoneli/kayit" className="underline font-semibold">kayıt ol</Link>.
            </span>
          </div>
        </div>
      )}

      {/* Kozmetik bölümü — herkes için açık */}
      <section>
        <header className="flex items-end justify-between mb-4 px-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-1">
              Markalar
            </p>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>🧴</span> Kozmetik
            </h2>
          </div>
          <Link href="/estestore/kozmetik" className="text-violet-300 hover:text-violet-200 text-sm font-semibold">
            Tümü →
          </Link>
        </header>

        {kozmetik.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-10">Henüz ürün yok.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {kozmetik.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                isPro={isPro}
                showPrice={true}
              />
            ))}
          </div>
        )}
      </section>

      {/* Profesyonel kategoriler */}
      {isPro ? (
        <div className="space-y-12">{ProSections}</div>
      ) : (
        <ProfessionalToggle>{ProSections}</ProfessionalToggle>
      )}
    </main>
  )
}
