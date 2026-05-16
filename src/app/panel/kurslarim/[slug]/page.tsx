import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDuration } from '@/lib/akademi'
import VideoPlayer from './VideoPlayer'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ video?: string; success?: string }>
}

export default async function KursIzlePage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/giris?g=esteklinik&next=/panel/kurslarim/${slug}`)

  // Paket
  const { data: pkg } = await supabase
    .from('course_packages')
    .select(`
      id, slug, title, total_videos, total_duration_seconds,
      clinics:clinic_id (id, name)
    `)
    .eq('slug', slug)
    .maybeSingle()
  if (!pkg) notFound()

  // Sahiplik kontrolü
  const { data: purchase } = await supabase
    .from('course_purchases')
    .select('id, paid_at')
    .eq('user_id', user.id)
    .eq('package_id', pkg.id)
    .eq('status', 'paid')
    .maybeSingle()
  if (!purchase) redirect(`/akademi/${slug}`)

  // Videolar
  const { data: videos } = await supabase
    .from('course_videos')
    .select('id, title, description, stream_uid, stream_status, duration_seconds, sort_order, is_preview')
    .eq('package_id', pkg.id)
    .order('sort_order', { ascending: true })

  // İlerleme
  const { data: progress } = await supabase
    .from('course_progress')
    .select('video_id, watched_seconds, completed, last_watched_at')
    .eq('user_id', user.id)
    .eq('package_id', pkg.id)

  const progressMap = new Map<string, { watched: number; completed: boolean }>()
  for (const p of progress ?? []) {
    progressMap.set(p.video_id as string, { watched: p.watched_seconds ?? 0, completed: !!p.completed })
  }

  // Aktif video — query string'ten veya ilk tamamlanmamış olanı seç
  const activeVideoId = sp.video
    ?? (videos ?? []).find(v => !progressMap.get(v.id)?.completed)?.id
    ?? (videos ?? [])[0]?.id

  const activeVideo = (videos ?? []).find(v => v.id === activeVideoId) ?? (videos ?? [])[0] ?? null

  const clinic = pkg.clinics as unknown as { id: string; name: string } | null
  const completedCount = (progress ?? []).filter(p => p.completed).length
  const totalVideos = videos?.length ?? 0

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-white/5 h-14 flex items-center justify-between px-4 lg:px-8">
        <div className="lg:hidden w-10" />
        <Link href="/panel/kurslarim" className="text-slate-400 hover:text-white text-base font-semibold">
          ← Kurslarım
        </Link>
        <div className="text-emerald-400 text-sm font-medium">
          {completedCount}/{totalVideos} tamamlandı
        </div>
      </header>

      {sp.success === '1' && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
            <span>✓</span>
            <span>Satın alma tamamlandı! Hadi başlayalım.</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Video player + bilgi */}
        <div className="lg:col-span-2 space-y-4">
          {activeVideo ? (
            <>
              <VideoPlayer
                key={activeVideo.id}
                videoId={activeVideo.id}
                packageId={pkg.id}
                slug={pkg.slug}
                streamUid={activeVideo.stream_uid}
                streamStatus={activeVideo.stream_status}
                duration={activeVideo.duration_seconds ?? 0}
                initialWatched={progressMap.get(activeVideo.id)?.watched ?? 0}
                initialCompleted={!!progressMap.get(activeVideo.id)?.completed}
              />
              <div>
                <h1 className="text-xl font-bold text-white">{activeVideo.title}</h1>
                {clinic && <p className="text-slate-500 text-sm mt-1">Eğitmen: {clinic.name}</p>}
                {activeVideo.description && (
                  <p className="text-slate-300 text-sm mt-3 whitespace-pre-wrap leading-relaxed">{activeVideo.description}</p>
                )}
              </div>
            </>
          ) : (
            <div className="aspect-video bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
              Henüz video yok
            </div>
          )}
        </div>

        {/* Sağ: Video listesi */}
        <aside className="lg:col-span-1">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h2 className="text-white font-bold text-sm line-clamp-2">{pkg.title}</h2>
              <p className="text-slate-500 text-sm mt-1">{totalVideos} video · {formatDuration(pkg.total_duration_seconds ?? 0)}</p>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {(videos ?? []).map((v, idx) => {
                const isActive = v.id === activeVideo?.id
                const isCompleted = progressMap.get(v.id)?.completed
                return (
                  <Link
                    key={v.id}
                    href={`/panel/kurslarim/${pkg.slug}?video=${v.id}`}
                    className={`block p-3 border-b border-slate-800/60 last:border-0 transition-colors ${
                      isActive ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-sm font-medium ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isActive
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium line-clamp-2 ${isActive ? 'text-emerald-300' : 'text-white'}`}>
                          {v.title}
                        </p>
                        <p className="text-slate-500 text-sm mt-0.5">{formatDuration(v.duration_seconds)}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
