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
} from '@/app/klinik/panel/akademi/paketler/actions'

interface Props {
  pkg: CoursePackage
  videos: CourseVideo[]
  totalSales: number
  totalEarnings: number
}

export default function AkademiPaketDetayAppView({
  pkg,
  videos,
  totalSales,
  totalEarnings,
}: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-3">
        <div className="flex items-start gap-2 flex-wrap mb-1">
          <p className="text-white font-bold text-base">{pkg.title}</p>
          {pkg.is_published ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider">
              Yayında
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider">
              Taslak
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">
          {LEVEL_LABELS[pkg.level]} · 📹 {videos.length}
          {pkg.total_duration_seconds > 0 && (
            <> · ⏱️ {formatDuration(pkg.total_duration_seconds)}</>
          )}
        </p>
      </header>

      {/* Yayın toggle */}
      <div className="px-5">
        {pkg.is_published ? (
          <form action={togglePublishPackage}>
            <input type="hidden" name="id" value={pkg.id} />
            <input type="hidden" name="publish" value="false" />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-sm font-bold active:bg-amber-500/25 transition"
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
              className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold active:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {videos.length === 0 ? 'En az 1 video gerekli' : 'Yayına Al'}
            </button>
          </form>
        )}
      </div>

      {/* Özet */}
      <section className="px-5 mt-4 grid grid-cols-3 gap-2">
        <Stat label="Satış" value={`${totalSales}`} accent="text-white" />
        <Stat label="Kazanç" value={formatPrice(totalEarnings)} accent="text-emerald-300" />
        <Stat
          label="Puan"
          value={
            pkg.avg_rating != null
              ? `⭐${pkg.avg_rating.toFixed(1)}`
              : '—'
          }
          accent="text-white"
        />
      </section>

      {/* Düzenle */}
      <section className="px-5 mt-5">
        <details className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer text-white text-sm font-bold active:bg-slate-900 transition">
            Paket Bilgilerini Düzenle
          </summary>
          <form action={updatePackage} className="p-4 space-y-3 border-t border-slate-800">
            <input type="hidden" name="id" value={pkg.id} />
            <FormInput name="title" label="Başlık" defaultValue={pkg.title} required />
            <FormTextarea
              name="description"
              label="Açıklama"
              defaultValue={pkg.description ?? ''}
              rows={3}
            />
            <FormSelect name="category" label="Kategori" defaultValue={pkg.category ?? ''}>
              <option value="">— Seçin —</option>
              {AKADEMI_KATEGORILER.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </FormSelect>
            <FormSelect name="level" label="Seviye" defaultValue={pkg.level}>
              <option value="beginner">Temel</option>
              <option value="intermediate">Orta</option>
              <option value="advanced">İleri</option>
            </FormSelect>
            <FormInput
              name="price"
              label="Fiyat (₺)"
              type="number"
              defaultValue={String(pkg.price)}
              required
            />
            <FormInput
              name="cover_image_url"
              label="Kapak Görseli URL"
              type="url"
              defaultValue={pkg.cover_image_url ?? ''}
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold active:bg-emerald-400 transition"
            >
              Kaydet
            </button>
          </form>
        </details>
      </section>

      {/* Videolar */}
      <section className="px-5 mt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2">
          Videolar · {videos.length}
        </p>
        <div className="space-y-2">
          {videos.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-700 p-5 text-center text-slate-400 text-sm">
              Henüz video yok. Aşağıdan ekle.
            </div>
          )}
          {videos.map((v, idx) => (
            <div
              key={v.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{v.title}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {v.is_preview && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                      ÖNİZ
                    </span>
                  )}
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      v.stream_status === 'ready'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : v.stream_status === 'processing'
                        ? 'bg-amber-500/20 text-amber-300'
                        : v.stream_status === 'error'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {v.stream_status === 'ready'
                      ? 'HAZIR'
                      : v.stream_status === 'processing'
                      ? 'İŞLENİYOR'
                      : v.stream_status === 'error'
                      ? 'HATA'
                      : 'BEKLEMEDE'}
                  </span>
                  {v.duration_seconds > 0 && (
                    <span className="text-[10px] text-slate-500">
                      {formatDuration(v.duration_seconds)}
                    </span>
                  )}
                </div>
              </div>
              <form action={deleteVideo}>
                <input type="hidden" name="id" value={v.id} />
                <input type="hidden" name="package_id" value={pkg.id} />
                <button
                  type="submit"
                  className="text-slate-500 active:text-rose-400 p-2"
                  title="Sil"
                >
                  🗑
                </button>
              </form>
            </div>
          ))}
        </div>

        <details className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer text-emerald-300 text-sm font-bold active:bg-slate-900 transition">
            + Yeni Video Ekle
          </summary>
          <form action={addVideo} className="p-4 space-y-3 border-t border-slate-800">
            <input type="hidden" name="package_id" value={pkg.id} />
            <FormInput name="title" label="Video Başlığı *" required />
            <FormTextarea name="description" label="Açıklama" rows={2} />
            <FormInput name="stream_uid" label="Cloudflare Stream UID" />
            <FormInput
              name="duration_seconds"
              label="Süre (saniye)"
              type="number"
            />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="is_preview" className="accent-emerald-500" />
              <span>Ücretsiz önizleme</span>
            </label>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold active:bg-emerald-400 transition"
            >
              Video Ekle
            </button>
          </form>
        </details>
      </section>

      {/* Sil */}
      <section className="px-5 mt-5">
        <details className="rounded-2xl border border-rose-900/40 bg-rose-950/20 overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer text-rose-300 text-sm font-bold">
            Tehlikeli — Paketi Sil
          </summary>
          <form action={deletePackage} className="p-4 border-t border-rose-900/40">
            <input type="hidden" name="id" value={pkg.id} />
            <p className="text-slate-400 text-sm mb-3">
              Satılmış paketler silinemez. Tüm videolar kalıcı kaybolur.
            </p>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-rose-900/40 border border-rose-800/50 text-rose-300 text-sm font-bold active:bg-rose-900/60 transition"
            >
              Kalıcı Olarak Sil
            </button>
          </form>
        </details>
      </section>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-center">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-black tabular-nums ${accent}`}>{value}</p>
    </div>
  )
}

function FormInput({
  name,
  label,
  type = 'text',
  defaultValue,
  required,
}: {
  name: string
  label: string
  type?: string
  defaultValue?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
      />
    </div>
  )
}

function FormTextarea({
  name,
  label,
  defaultValue,
  rows,
}: {
  name: string
  label: string
  defaultValue?: string
  rows: number
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
      />
    </div>
  )
}

function FormSelect({
  name,
  label,
  defaultValue,
  children,
}: {
  name: string
  label: string
  defaultValue: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
      >
        {children}
      </select>
    </div>
  )
}
