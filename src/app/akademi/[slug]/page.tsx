import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LEVEL_LABELS, formatPrice, formatDuration, AKADEMI_KATEGORILER } from '@/lib/akademi'
import BuyButton from './BuyButton'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('course_packages')
    .select('title, description')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()
  if (!data) return { title: 'Paket bulunamadı | Estelongy Akademi' }
  return {
    title: `${data.title} | Estelongy Akademi`,
    description: data.description ?? undefined,
  }
}

export default async function AkademiPaketDetayPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: pkg } = await supabase
    .from('course_packages')
    .select(`
      id, slug, title, description, cover_image_url, price, currency,
      category, level, total_videos, total_duration_seconds,
      total_purchases, total_reviews, avg_rating, published_at,
      clinics:clinic_id (id, name, educator_bio)
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (!pkg) notFound()

  const clinic = pkg.clinics as unknown as { id: string; name: string; educator_bio: string | null } | null

  const { data: videos } = await supabase
    .from('course_videos')
    .select('id, title, description, duration_seconds, sort_order, is_preview')
    .eq('package_id', pkg.id)
    .order('sort_order', { ascending: true })

  // Mevcut kullanıcı paketi satın aldı mı?
  const { data: { user } } = await supabase.auth.getUser()
  let alreadyOwned = false
  let userRole: string | null = null
  if (user) {
    userRole = (user.app_metadata as Record<string, string>)?.role ?? null
    const { data: purchase } = await supabase
      .from('course_purchases')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('package_id', pkg.id)
      .eq('status', 'paid')
      .maybeSingle()
    alreadyOwned = !!purchase
  }
  const canBuy = userRole === 'health_professional' || userRole === 'clinic'

  const categoryLabel = AKADEMI_KATEGORILER.find(c => c.value === pkg.category)?.label ?? pkg.category

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/akademi"
          className="inline-flex items-center text-slate-400 hover:text-white text-sm mb-6 transition-colors"
        >
          ← Akademi&apos;ye Dön
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol: Paket görseli + bilgiler */}
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video bg-slate-800 rounded-2xl overflow-hidden border border-slate-800">
              {pkg.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pkg.cover_image_url} alt={pkg.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">🎓</div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                {categoryLabel && (
                  <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-emerald-400">
                    {categoryLabel}
                  </span>
                )}
                <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-slate-300">
                  {LEVEL_LABELS[pkg.level as keyof typeof LEVEL_LABELS]}
                </span>
                {pkg.avg_rating && (
                  <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-400">
                    ★ {Number(pkg.avg_rating).toFixed(1)} ({pkg.total_reviews ?? 0})
                  </span>
                )}
                <span className="text-slate-500">
                  {pkg.total_purchases ?? 0} kişi satın aldı
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold mb-3">{pkg.title}</h1>

              {clinic && (
                <p className="text-slate-400 text-sm">
                  Eğitmen: <span className="text-emerald-400 font-medium">{clinic.name}</span>
                </p>
              )}
            </div>

            {pkg.description && (
              <div>
                <h2 className="text-lg font-bold mb-2">Bu Paket Hakkında</h2>
                <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{pkg.description}</p>
              </div>
            )}

            {clinic?.educator_bio && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <h3 className="text-sm font-bold text-emerald-400 mb-2">Eğitmen Hakkında</h3>
                <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{clinic.educator_bio}</p>
              </div>
            )}

            {/* İçerik listesi */}
            <div>
              <h2 className="text-lg font-bold mb-3">
                Paket İçeriği <span className="text-slate-500 text-sm font-normal">({videos?.length ?? 0} video · {formatDuration(pkg.total_duration_seconds ?? 0)})</span>
              </h2>
              <div className="space-y-2">
                {(videos ?? []).map((v, idx) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 text-sm font-medium flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{v.title}</p>
                      {v.description && (
                        <p className="text-slate-500 text-xs truncate">{v.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {v.is_preview && (
                        <span className="text-emerald-400 text-[10px] uppercase tracking-wider font-bold">Önizleme</span>
                      )}
                      <span className="text-slate-500 text-xs">{formatDuration(v.duration_seconds)}</span>
                    </div>
                  </div>
                ))}
                {(!videos || videos.length === 0) && (
                  <p className="text-slate-500 text-sm text-center py-6">Henüz video eklenmemiş.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sağ: Satın alma kartı */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
              <div>
                <div className="text-3xl font-bold text-emerald-400">
                  {formatPrice(Number(pkg.price), pkg.currency || 'TRY')}
                </div>
                <p className="text-slate-500 text-xs mt-1">Tek seferlik · Ömür boyu erişim</p>
              </div>

              {alreadyOwned ? (
                <Link
                  href={`/panel/kurslarim/${pkg.slug}`}
                  className="block w-full text-center py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
                >
                  Kursumu İzle →
                </Link>
              ) : !user ? (
                <Link
                  href={`/giris?next=${encodeURIComponent(`/akademi/${pkg.slug}`)}`}
                  className="block w-full text-center py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
                >
                  Satın Almak için Giriş Yap
                </Link>
              ) : canBuy ? (
                <BuyButton packageId={pkg.id} />
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed">
                    Bu eğitim sağlık profesyonelleri ve klinikler içindir. Satın almak için Sağlık Profesyoneli kaydı oluşturun.
                  </div>
                  <Link
                    href="/kurumsal/saglik-profesyoneli/kayit"
                    className="block w-full text-center py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
                  >
                    Sağlık Profesyoneli Kaydı →
                  </Link>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>{pkg.total_videos ?? 0} HD video — toplam {formatDuration(pkg.total_duration_seconds ?? 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Cihaz sınırı yok, istediğin yerden izle</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Stripe ile güvenli ödeme</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>14 gün içinde, paket %30&apos;dan az izlenmişse iade</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
