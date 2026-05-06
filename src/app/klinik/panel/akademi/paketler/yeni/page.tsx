import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AKADEMI_KATEGORILER } from '@/lib/akademi'
import { createPackage } from '../actions'

export const dynamic = 'force-dynamic'

export default async function YeniPaketPage() {
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
    redirect('/klinik/panel/akademi/paketler')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/klinik/panel/akademi/paketler"
        className="inline-flex items-center text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        ← Paketlere Dön
      </Link>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📹</span>
          <h1 className="text-2xl font-bold text-white">Yeni Eğitim Paketi</h1>
        </div>
        <p className="text-slate-400 text-sm mb-8">
          Paket bilgilerini doldurun. Videoları sonraki adımda yükleyeceksiniz. Yayına almadan istediğiniz kadar düzenleyebilirsiniz.
        </p>

        <form action={createPackage} className="space-y-5">
          {/* Başlık */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Paket Başlığı <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              minLength={3}
              maxLength={120}
              placeholder="Örn: Tam Yüz Filler Uygulamaları — Güvenli Enjeksiyon Teknikleri"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">Kısa Açıklama</label>
            <textarea
              name="description"
              rows={4}
              maxLength={1000}
              placeholder="Bu paketin neyi öğrettiğini, kimin için olduğunu ve ne kazanacağını birkaç cümleyle anlatın."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm resize-none"
            />
          </div>

          {/* Kategori + Seviye */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Kategori</label>
              <select
                name="category"
                defaultValue=""
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
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
                defaultValue="beginner"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              >
                <option value="beginner">Temel</option>
                <option value="intermediate">Orta</option>
                <option value="advanced">İleri</option>
              </select>
            </div>
          </div>

          {/* Fiyat */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Fiyat (TRY) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="price"
                required
                min={0}
                step={1}
                placeholder="1500"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₺</span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Bu fiyatın <span className="text-emerald-400 font-medium">%70&apos;i (eğitmen payı)</span> size, %30&apos;u Estelongy&apos;ye gider. Ödemeler ay sonu IBAN&apos;a transfer edilir.
            </p>
          </div>

          {/* Kapak görseli */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Kapak Görseli URL <span className="text-slate-600 text-xs">(opsiyonel — sonra ekleyebilirsiniz)</span>
            </label>
            <input
              type="url"
              name="cover_image_url"
              placeholder="https://..."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex gap-3">
            <Link
              href="/klinik/panel/akademi/paketler"
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              İptal
            </Link>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-colors"
            >
              Paketi Oluştur ve Devam Et
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
