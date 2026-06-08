import Link from 'next/link'
import { AKADEMI_KATEGORILER } from '@/lib/akademi'
import { createPackage } from '@/app/klinik/panel/akademi/paketler/actions'

export default function AkademiPaketYeniAppView() {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-3">
        <p className="text-sm text-slate-400">
          Paket bilgilerini doldur. Videoları sonraki adımda yükleyeceksin.
        </p>
      </header>

      <div className="px-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <form action={createPackage} className="space-y-4">
            <Field
              label={
                <>
                  Paket Başlığı <span className="text-rose-400">*</span>
                </>
              }
            >
              <input
                type="text"
                name="title"
                required
                minLength={3}
                maxLength={120}
                placeholder="Örn: Tam Yüz Filler — Güvenli Enjeksiyon"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
              />
            </Field>

            <Field label="Kısa Açıklama">
              <textarea
                name="description"
                rows={4}
                maxLength={1000}
                placeholder="Bu paket neyi öğretiyor, kime?"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 resize-none"
              />
            </Field>

            <Field label="Kategori">
              <select
                name="category"
                defaultValue=""
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">— Seçin —</option>
                {AKADEMI_KATEGORILER.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Seviye">
              <select
                name="level"
                defaultValue="beginner"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="beginner">Temel</option>
                <option value="intermediate">Orta</option>
                <option value="advanced">İleri</option>
              </select>
            </Field>

            <Field
              label={
                <>
                  Fiyat (₺) <span className="text-rose-400">*</span>
                </>
              }
            >
              <input
                type="number"
                name="price"
                required
                min={0}
                step={1}
                placeholder="1500"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                %70 sana, %30 Estelongy&apos;ye. Ödemeler ay sonu IBAN&apos;a.
              </p>
            </Field>

            <Field label="Kapak Görseli URL (opsiyonel)">
              <input
                type="url"
                name="cover_image_url"
                placeholder="https://..."
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500"
              />
            </Field>

            <div className="flex gap-2 pt-2">
              <Link
                href="/klinik/panel/akademi/paketler"
                className="flex-1 py-3 text-center rounded-xl bg-slate-800 text-slate-300 text-sm font-bold active:bg-slate-700 transition"
              >
                İptal
              </Link>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold active:bg-emerald-400 transition"
              >
                Oluştur
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-300 mb-1.5 font-medium">{label}</label>
      {children}
    </div>
  )
}
