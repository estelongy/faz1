import Link from 'next/link'
import { Search, MapPin, Building2, ArrowUpDown } from 'lucide-react'

interface Props {
  sehir: string
  tip: string
  sirala: 'egp' | 'yeni' | 'yorum'
  cities: Array<[string, number]>
  types: Array<[string, number]>
  typeLabel: Record<string, string>
}

/**
 * Klinik arama-filtre motoru.
 * - Server component: form submit ile URL paramları değişir.
 * - Eski mantık AYNI: sehir/tip/sirala query string'leri.
 * - Sticky değil — hero içinde merkezi konumda durur.
 */
export default function FilterBar({ sehir, tip, sirala, cities, types, typeLabel }: Props) {
  const hasFilter = sehir || tip || sirala !== 'egp'

  return (
    <form className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-[#064E3B]/30 p-3 md:p-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        {/* Şehir */}
        <div className="md:col-span-4">
          <label className="block text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold mb-1.5 flex items-center gap-1.5">
            <MapPin size={11} className="text-[#10876B]" /> Şehir
          </label>
          <select
            name="sehir"
            defaultValue={sehir}
            className="w-full px-3.5 py-3 bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#10876B]/40 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:border-[#10876B] focus:bg-white transition-all cursor-pointer"
          >
            <option value="">Tüm şehirler</option>
            {cities.map(([city, n]) => (
              <option key={city} value={city}>
                {city} ({n})
              </option>
            ))}
          </select>
        </div>

        {/* Klinik tipi */}
        <div className="md:col-span-4">
          <label className="block text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold mb-1.5 flex items-center gap-1.5">
            <Building2 size={11} className="text-[#10876B]" /> Klinik Tipi
          </label>
          <select
            name="tip"
            defaultValue={tip}
            className="w-full px-3.5 py-3 bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#10876B]/40 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:border-[#10876B] focus:bg-white transition-all cursor-pointer"
          >
            <option value="">Tüm tipler</option>
            {types.map(([t, n]) => (
              <option key={t} value={t}>
                {typeLabel[t] ?? t} ({n})
              </option>
            ))}
          </select>
        </div>

        {/* Sıralama */}
        <div className="md:col-span-2">
          <label className="block text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold mb-1.5 flex items-center gap-1.5">
            <ArrowUpDown size={11} className="text-[#10876B]" /> Sırala
          </label>
          <select
            name="sirala"
            defaultValue={sirala}
            className="w-full px-3.5 py-3 bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#10876B]/40 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:border-[#10876B] focus:bg-white transition-all cursor-pointer"
          >
            <option value="egp">EGP yüksek</option>
            <option value="yorum">Çok yorum</option>
            <option value="yeni">En yeni</option>
          </select>
        </div>

        {/* CTA: Ara */}
        <div className="md:col-span-2 flex items-end gap-1">
          <button
            type="submit"
            className="flex-1 h-[46px] inline-flex items-center justify-center gap-1.5 px-4 bg-[#10876B] hover:bg-[#0E7559] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#10876B]/30 transition-colors"
          >
            <Search size={14} />
            Ara
          </button>
        </div>
      </div>

      {hasFilter && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <p className="text-slate-500">
            Aktif filtre:
            {sehir && <span className="ml-2 px-2 py-0.5 rounded-full bg-[#10876B]/10 text-[#10876B] font-semibold">{sehir}</span>}
            {tip && <span className="ml-2 px-2 py-0.5 rounded-full bg-[#10876B]/10 text-[#10876B] font-semibold">{typeLabel[tip] ?? tip}</span>}
            {sirala !== 'egp' && <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">{sirala === 'yeni' ? 'En yeni' : 'Çok yorum'}</span>}
          </p>
          <Link href="/klinikler" className="text-slate-500 hover:text-[#10876B] font-medium transition-colors">
            Filtreyi sıfırla
          </Link>
        </div>
      )}
    </form>
  )
}
