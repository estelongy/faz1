import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  AKADEMI_KATEGORILER,
  formatDuration,
  formatPrice,
  LEVEL_LABELS,
} from '@/lib/akademi'
import type { CoursePackage, CourseVideo } from '@/lib/akademi'
import {
  updatePackage,
  togglePublishPackage,
  deletePackage,
  addVideo,
  deleteVideo,
} from '../actions'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PaketDetayPage({ params }: Props) {
  const { id } = await params
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

  if (!clinic || clinic.approval_status !== 'approved' || !clinic.is_educator) {
    redirect('/klinik/panel')
  }

  const { data: pkgRaw } = await supabase
    .from('course_packages')
    .select('*')
    .eq('id', id)
    .eq('clinic_id', clinic.id)
    .maybeSingle()

  if (!pkgRaw) notFound()
  const pkg = pkgRaw as CoursePackage

  const { data: videosRaw } = await supabase
    .from('course_videos')
    .select('*')
    .eq('package_id', id)
    .order('sort_order', { ascending: true })

  const videos = (videosRaw ?? []) as CourseVideo[]

  // Satış / kazanç
  const { data: purchases } = await supabase
    .from('course_purchases')
    .select('amount, educator_share, status')
    .eq('package_id', id)

  const paidPurchases = (purchases ?? []).filter(p => p.status === 'paid')
  const totalEarnings = paidPurchases.reduce((sum, p) => sum + (p.educator_share ?? 0), 0)

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/klinik/panel/akademi/paketler"
        className="inline-flex items-center text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        ← Paketlere Dön
      </Link>

      {/* Üst başlık + durum + aksiyonlar */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold text-white truncate">{pkg.title}</h1>
            {pkg.is_published ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">Yayında</span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">Taslak</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{LEVEL_LABELS[pkg.level]}</span>
            <span>·</span>
            <span>📹 {videos.length} video</span>
            {pkg.total_duration_seconds > 0 && (
              <>
                <span>·</span>
                <span>⏱️ {formatDuration(pkg.total_duration_seconds)}</span>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 flex gap-2">
          {pkg.is_published ? (
            <form action={togglePublishPackage}>
              <input type="hidden" name="id" value={pkg.id} />
              <input type="hidden" name="publish" value="false" />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-sm font-medium rounded-xl border border-amber-500/30 transition-colors"
              >
                Yayından Kaldır
              </button>
            </form>
          ) : (
            <form action={togglePublishPackage}>
              <input type="hidden" name="id" value={pkg.id} />
              <input type="hidden" name="publish" value="true" />
              <button
                type="submit"
                disabled={videos.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                title={videos.length === 0 ? 'Yayına almak için en az 1 video ekleyin' : ''}
              >
                Yayına Al
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Satış özeti */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-500 text-xs mb-1">Toplam Satış</div>
          <div className="text-xl font-bold text-white">{paidPurchases.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-500 text-xs mb-1">Kazanç</div>
          <div className="text-xl font-bold text-emerald-400">{formatPrice(totalEarnings)}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-500 text-xs mb-1">Puan</div>
          <div className="text-xl font-bold text-white">
            {pkg.avg_rating !== null && pkg.avg_rating !== undefined ? `⭐ ${pkg.avg_rating.toFixed(1)}` : '—'}
          </div>
          <div className="text-slate-500 text-xs mt-0.5">{pkg.total_reviews} yorum</div>
        </div>
      </div>

      {/* Paket bilgileri düzenleme */}
      <details className="mb-8 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <summary className="px-6 py-4 cursor-pointer text-white font-semibold hover:bg-slate-800/40 transition-colors">
          Paket Bilgilerini Düzenle
        </summary>
        <form action={updatePackage} className="p-6 pt-2 space-y-4 border-t border-slate-800">
          <input type="hidden" name="id" value={pkg.id} />
          <div>
            <label className="block text-sm text-slate-300 mb-2">Başlık</label>
            <input
              type="text"
              name="title"
              required
              minLength={3}
              defaultValue={pkg.title}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Açıklama</label>
            <textarea
              name="description"
              rows={4}
              defaultValue={pkg.description ?? ''}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Kategori</label>
              <select
                name="category"
                defaultValue={pkg.category ?? ''}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
              >
                <option value="">— Seçin —</option>
                {AKADEMI_KATEGORILER.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Seviye</label>
              <select
                name="level"
                defaultValue={pkg.level}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
              >
                <option value="beginner">Temel</option>
                <option value="intermediate">Orta</option>
                <option value="advanced">İleri</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Fiyat (₺)</label>
              <input
                type="number"
                name="price"
                required
                min={0}
                step={1}
                defaultValue={pkg.price}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Kapak Görseli URL</label>
            <input
              type="url"
              name="cover_image_url"
              defaultValue={pkg.cover_image_url ?? ''}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl"
            >
              Kaydet
            </button>
          </div>
        </form>
      </details>

      {/* Videolar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold flex items-center gap-2">
            <span>📹</span>
            <span>Videolar ({videos.length})</span>
          </h2>
        </div>

        <div className="space-y-2">
          {videos.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
              <p className="text-slate-400 text-sm">Henüz video eklenmedi. Aşağıdan ilk videoyu ekleyin.</p>
            </div>
          )}
          {videos.map((v, idx) => (
            <div key={v.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-sm font-medium shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-medium truncate">{v.title}</span>
                  {v.is_preview && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">ÖNİZLEME</span>}
                  {v.stream_status === 'ready' ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">HAZIR</span>
                  ) : v.stream_status === 'processing' ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">İŞLENİYOR</span>
                  ) : v.stream_status === 'error' ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">HATA</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 font-medium">BEKLEMEDE</span>
                  )}
                </div>
                <div className="text-slate-500 text-xs mt-0.5 flex items-center gap-2">
                  {v.duration_seconds > 0 && <span>{formatDuration(v.duration_seconds)}</span>}
                  {v.stream_uid && <span className="font-mono">UID: {v.stream_uid.slice(0, 8)}…</span>}
                </div>
              </div>
              <form action={deleteVideo}>
                <input type="hidden" name="id" value={v.id} />
                <input type="hidden" name="package_id" value={pkg.id} />
                <button
                  type="submit"
                  className="text-slate-500 hover:text-red-400 transition-colors p-2"
                  title="Videoyu sil"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                  </svg>
                </button>
              </form>
            </div>
          ))}
        </div>

        {/* Yeni video ekleme formu */}
        <details className="mt-4 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer text-emerald-400 font-medium text-sm hover:bg-slate-800/40 transition-colors">
            + Yeni Video Ekle
          </summary>
          <form action={addVideo} className="p-4 space-y-3 border-t border-slate-800">
            <input type="hidden" name="package_id" value={pkg.id} />
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Video Başlığı *</label>
              <input
                type="text"
                name="title"
                required
                minLength={2}
                placeholder="Örn: Bölüm 1 — Anatomik bölgeler"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Açıklama (opsiyonel)</label>
              <textarea
                name="description"
                rows={2}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-sm resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Cloudflare Stream UID
                  <span className="text-slate-600 ml-1">(şimdilik boş bırakabilirsiniz)</span>
                </label>
                <input
                  type="text"
                  name="stream_uid"
                  placeholder="Stream entegrasyonu sonra"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Süre (saniye, opsiyonel)</label>
                <input
                  type="number"
                  name="duration_seconds"
                  min={0}
                  placeholder="600"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" name="is_preview" className="accent-emerald-500" />
              <span>Bu video <strong>ücretsiz önizleme</strong> olsun (satın almadan izlenebilir)</span>
            </label>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg"
              >
                Video Ekle
              </button>
            </div>
          </form>
        </details>
      </div>

      {/* Tehlikeli aksiyon — sil */}
      <details className="rounded-2xl bg-red-950/20 border border-red-900/30 overflow-hidden">
        <summary className="px-6 py-4 cursor-pointer text-red-400 font-medium text-sm hover:bg-red-900/20 transition-colors">
          Tehlikeli Aksiyon — Paketi Sil
        </summary>
        <form action={deletePackage} className="p-6 pt-2 border-t border-red-900/30">
          <input type="hidden" name="id" value={pkg.id} />
          <p className="text-slate-400 text-sm mb-4">
            Paketi silerseniz tüm videolar ve içerikler kalıcı olarak silinir. <strong>Satılmış paketler silinemez</strong> — onları yayından kaldırabilirsiniz.
          </p>
          <button
            type="submit"
            className="px-4 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm font-medium rounded-xl border border-red-800/50 transition-colors"
          >
            Paketi Kalıcı Olarak Sil
          </button>
        </form>
      </details>
    </div>
  )
}
