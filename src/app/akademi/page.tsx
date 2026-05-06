import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AKADEMI_KATEGORILER, LEVEL_LABELS, formatPrice, formatDuration } from '@/lib/akademi'

export const dynamic = 'force-dynamic'
export const revalidate = 60

interface SearchParams {
  kategori?: string
  seviye?: string
  sirala?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function AkademiKesfetPage({ searchParams }: Props) {
  const sp = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('course_packages')
    .select(`
      id, slug, title, description, cover_image_url, price, currency,
      category, level, total_videos, total_duration_seconds,
      total_purchases, total_reviews, avg_rating, quality_score, published_at,
      clinics:clinic_id (id, name)
    `)
    .eq('is_published', true)

  if (sp.kategori) query = query.eq('category', sp.kategori)
  if (sp.seviye)   query = query.eq('level', sp.seviye)

  const sortKey = sp.sirala || 'kalite'
  if (sortKey === 'yeni')      query = query.order('published_at', { ascending: false, nullsFirst: false })
  else if (sortKey === 'satis') query = query.order('total_purchases', { ascending: false })
  else if (sortKey === 'puan')  query = query.order('avg_rating', { ascending: false, nullsFirst: false })
  else                          query = query.order('quality_score', { ascending: false, nullsFirst: false })

  const { data: packages } = await query

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Hero */}
      <section className="border-b border-slate-800 bg-slate-900/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🎓</span>
            <h1 className="text-3xl sm:text-4xl font-bold">Estelongy Akademi</h1>
          </div>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl">
            Sektörün en deneyimli hekimlerinden video eğitim paketleri. Tek seferlik ödeme, ömür boyu erişim.
          </p>
        </div>
      </section>

      {/* Filtreler */}
      <section className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2">
          <form method="GET" className="flex flex-wrap items-center gap-2 w-full">
            <select
              name="kategori"
              defaultValue={sp.kategori ?? ''}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">Tüm Kategoriler</option>
              {AKADEMI_KATEGORILER.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select
              name="seviye"
              defaultValue={sp.seviye ?? ''}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">Tüm Seviyeler</option>
              <option value="beginner">Temel</option>
              <option value="intermediate">Orta</option>
              <option value="advanced">İleri</option>
            </select>
            <select
              name="sirala"
              defaultValue={sortKey}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="kalite">En Kaliteli</option>
              <option value="satis">En Çok Satan</option>
              <option value="puan">En Yüksek Puan</option>
              <option value="yeni">En Yeni</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-sm font-medium transition-colors">
              Uygula
            </button>
            {(sp.kategori || sp.seviye || sp.sirala) && (
              <Link href="/akademi" className="text-slate-400 hover:text-white text-sm px-2">
                Sıfırla
              </Link>
            )}
          </form>
          <div className="ml-auto text-slate-500 text-xs">
            {packages?.length ?? 0} paket
          </div>
        </div>
      </section>

      {/* Paket grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {!packages || packages.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-slate-400">Filtrelerinize uygun paket bulunamadı.</p>
            <Link href="/akademi" className="inline-block mt-4 text-emerald-400 hover:text-emerald-300 text-sm">
              Filtreleri sıfırla
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {packages.map(pkg => {
              const clinic = pkg.clinics as unknown as { id: string; name: string } | null
              return (
                <Link
                  key={pkg.id}
                  href={`/akademi/${pkg.slug}`}
                  className="group bg-slate-900 rounded-2xl border border-slate-800 hover:border-emerald-500/40 overflow-hidden transition-all hover:shadow-lg hover:shadow-emerald-500/5"
                >
                  {/* Kapak */}
                  <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
                    {pkg.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pkg.cover_image_url} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">🎓</div>
                    )}
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur text-emerald-400 text-xs font-medium">
                      {LEVEL_LABELS[pkg.level as keyof typeof LEVEL_LABELS]}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="text-white font-bold text-sm line-clamp-2 group-hover:text-emerald-400 transition-colors min-h-[2.5rem]">
                      {pkg.title}
                    </h3>

                    {clinic && (
                      <div className="text-slate-500 text-xs">{clinic.name}</div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <span>📹</span>
                        <span>{pkg.total_videos ?? 0} video</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>⏱</span>
                        <span>{formatDuration(pkg.total_duration_seconds ?? 0)}</span>
                      </span>
                      {pkg.avg_rating && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <span>★</span>
                          <span>{Number(pkg.avg_rating).toFixed(1)}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-emerald-400 font-bold text-base">
                        {formatPrice(Number(pkg.price), pkg.currency || 'TRY')}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {pkg.total_purchases ?? 0} satış
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
