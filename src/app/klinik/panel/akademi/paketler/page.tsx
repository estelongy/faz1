import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDuration, formatPrice, LEVEL_LABELS, AKADEMI_KATEGORILER } from '@/lib/akademi'
import type { CoursePackage } from '@/lib/akademi'

export const dynamic = 'force-dynamic'

export default async function EgitmenPaketlerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, is_educator, approval_status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!clinic || clinic.approval_status !== 'approved') redirect('/klinik/panel')

  if (!clinic.is_educator) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-3xl">🎓</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Estelongy Akademi Eğitmenliği</h1>
        <p className="text-slate-400 mb-6">
          Eğitmen yetkisi henüz aktif değil. Tecrübenizi platform üzerinden paylaşmak ve gelir elde etmek istiyorsanız Estelongy ekibiyle iletişime geçin.
        </p>
        <p className="text-slate-500 text-sm">
          Eğitmen onayı sonrası video paketlerinizi yükleyip diğer hekimlere satabilir, %70 gelir payı alabilirsiniz.
        </p>
        <Link href="/klinik/panel" className="inline-flex items-center mt-6 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm">
          ← Panele Dön
        </Link>
      </div>
    )
  }

  // Paketleri çek
  const { data: packagesRaw } = await supabase
    .from('course_packages')
    .select('*')
    .eq('clinic_id', clinic.id)
    .order('created_at', { ascending: false })

  const packages = (packagesRaw ?? []) as CoursePackage[]

  // Kazanç özeti
  const { data: earnings } = await supabase
    .from('course_purchases')
    .select('amount, educator_share')
    .in('package_id', packages.map(p => p.id).length > 0 ? packages.map(p => p.id) : ['00000000-0000-0000-0000-000000000000'])
    .eq('status', 'paid')

  const totalEarnings = (earnings ?? []).reduce((sum, e) => sum + (e.educator_share ?? 0), 0)
  const totalSales = (earnings ?? []).length

  const published = packages.filter(p => p.is_published)
  const drafts = packages.filter(p => !p.is_published)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Başlık */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎓</span>
            <h1 className="text-2xl font-bold text-white">Eğitmen Paneli</h1>
            <span className="text-sm px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">Eğitmen</span>
          </div>
          <p className="text-slate-400 text-sm">Video paketlerinizi yönetin · %70 gelir payı sizin</p>
        </div>
        <Link
          href="/klinik/panel/akademi/paketler/yeni"
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20"
        >
          + Yeni Paket
        </Link>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-sm mb-1">Yayında</div>
          <div className="text-2xl font-bold text-emerald-400">{published.length}</div>
          <div className="text-slate-500 text-sm mt-1">paket aktif</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-sm mb-1">Toplam Satış</div>
          <div className="text-2xl font-bold text-white">{totalSales}</div>
          <div className="text-slate-500 text-sm mt-1">bilet</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-sm mb-1">Toplam Kazanç</div>
          <div className="text-2xl font-bold text-emerald-400">{formatPrice(totalEarnings)}</div>
          <div className="text-slate-500 text-sm mt-1">net (%70 pay)</div>
        </div>
      </div>

      {packages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center">
          <div className="text-4xl mb-3">📹</div>
          <h2 className="text-white font-semibold text-lg mb-2">Henüz paket yok</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            İlk video paketinizi oluşturun. Konuyu siz seçer, fiyatı siz belirlersiniz. Estelongy %30 platform payı, siz %70 alırsınız.
          </p>
          <Link
            href="/klinik/panel/akademi/paketler/yeni"
            className="inline-flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl"
          >
            İlk Paketinizi Oluşturun
          </Link>
        </div>
      ) : (
        <>
          {/* Yayında */}
          {published.length > 0 && (
            <div className="mb-8">
              <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Yayında ({published.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {published.map(p => <PackageCard key={p.id} pkg={p} />)}
              </div>
            </div>
          )}

          {/* Taslak */}
          {drafts.length > 0 && (
            <div>
              <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Taslak ({drafts.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drafts.map(p => <PackageCard key={p.id} pkg={p} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PackageCard({ pkg }: { pkg: CoursePackage }) {
  const categoryLabel = AKADEMI_KATEGORILER.find(c => c.value === pkg.category)?.label
  return (
    <Link
      href={`/klinik/panel/akademi/paketler/${pkg.id}`}
      className="block p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate group-hover:text-emerald-400 transition-colors">{pkg.title}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
            {categoryLabel && <span>{categoryLabel}</span>}
            {categoryLabel && <span>·</span>}
            <span>{LEVEL_LABELS[pkg.level]}</span>
          </div>
        </div>
        <div className="text-right shrink-0 ml-3">
          <div className="text-emerald-400 font-bold">{formatPrice(pkg.price, pkg.currency)}</div>
        </div>
      </div>

      {pkg.description && (
        <p className="text-slate-400 text-sm line-clamp-2 mb-3">{pkg.description}</p>
      )}

      <div className="flex items-center justify-between text-sm text-slate-500">
        <div className="flex gap-3">
          <span>📹 {pkg.total_videos} video</span>
          {pkg.total_duration_seconds > 0 && <span>⏱️ {formatDuration(pkg.total_duration_seconds)}</span>}
        </div>
        <div className="flex gap-3">
          <span>🛒 {pkg.total_purchases}</span>
          {pkg.avg_rating !== null && pkg.avg_rating !== undefined && (
            <span>⭐ {pkg.avg_rating.toFixed(1)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
