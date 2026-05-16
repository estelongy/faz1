import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDuration } from '@/lib/akademi'

import SafeLink from '@/components/SafeLink'
export const dynamic = 'force-dynamic'

export default async function KurslarimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris?g=esteklinik&next=/panel/kurslarim')

  // Satın alınan paketler
  const { data: purchases } = await supabase
    .from('course_purchases')
    .select(`
      id, paid_at, package_id,
      packages:package_id (
        id, slug, title, cover_image_url, total_videos, total_duration_seconds,
        clinics:clinic_id (id, name)
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'paid')
    .order('paid_at', { ascending: false })

  // Her paket için ilerleme (kaç video tamamlandı)
  const packageIds = (purchases ?? [])
    .map(p => (p.packages as unknown as { id: string } | null)?.id)
    .filter(Boolean) as string[]

  const progressMap: Record<string, { completed: number }> = {}
  if (packageIds.length > 0) {
    const { data: progress } = await supabase
      .from('course_progress')
      .select('package_id, completed')
      .eq('user_id', user.id)
      .in('package_id', packageIds)
      .eq('completed', true)
    for (const row of progress ?? []) {
      const pid = row.package_id as string
      progressMap[pid] = { completed: (progressMap[pid]?.completed ?? 0) + 1 }
    }
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-white/5 h-14 flex items-center justify-between px-4 lg:px-8">
        <div className="lg:hidden w-10" />
        <h1 className="text-white font-bold text-sm">🎓 Kurslarım</h1>
        <div className="w-10" />
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {!purchases || purchases.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎓</div>
            <h2 className="text-xl font-bold text-white mb-2">Henüz kursun yok</h2>
            <p className="text-slate-400 mb-6">Estelongy Akademi&apos;de keşfet, mesleki gelişimine yatırım yap.</p>
            <Link
              href="/akademi"
              className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all"
            >
              Akademi&apos;yi Keşfet →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {purchases.map(purchase => {
              const pkg = purchase.packages as unknown as {
                id: string; slug: string; title: string; cover_image_url: string | null
                total_videos: number; total_duration_seconds: number
                clinics: { id: string; name: string } | null
              } | null
              if (!pkg) return null

              const completedCount = progressMap[pkg.id]?.completed ?? 0
              const totalVideos = pkg.total_videos ?? 0
              const progressPct = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0

              return (
                <SafeLink
                  key={purchase.id}
                  href={`/panel/kurslarim/${pkg.slug}`}
                  className="group bg-slate-900 rounded-2xl border border-slate-800 hover:border-emerald-500/40 overflow-hidden transition-all"
                >
                  <div className="aspect-video bg-slate-800 relative overflow-hidden">
                    {pkg.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pkg.cover_image_url} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">🎓</div>
                    )}
                    {progressPct === 100 && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-emerald-500 text-white text-sm font-bold">
                        ✓ Tamamlandı
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="text-white font-bold text-sm line-clamp-2 group-hover:text-emerald-400 transition-colors min-h-[2.5rem]">
                      {pkg.title}
                    </h3>
                    {pkg.clinics && (
                      <div className="text-slate-500 text-sm">{pkg.clinics.name}</div>
                    )}
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span>📹 {totalVideos} video</span>
                      <span>⏱ {formatDuration(pkg.total_duration_seconds ?? 0)}</span>
                    </div>
                    {/* İlerleme barı */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-slate-400">İlerleme</span>
                        <span className="text-emerald-400 font-medium">{completedCount}/{totalVideos}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </SafeLink>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
