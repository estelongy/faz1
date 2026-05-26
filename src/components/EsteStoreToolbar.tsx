'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect, useTransition } from 'react'

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'yeni',         label: 'En Yeni' },
  { value: 'eski',         label: 'En Eski' },
  { value: 'fiyat-artan',  label: 'Fiyat ↑' },
  { value: 'fiyat-azalan', label: 'Fiyat ↓' },
  { value: 'ep-yuksek',    label: 'EP Skoru ↑' },
  { value: 'cok-satan',    label: 'Çok Satan' },
]

interface Props {
  total: number
  /** Arama input'u göster (sadece /estestore/ara sayfasında true) */
  showSearch?: boolean
}

export default function EsteStoreToolbar({ total, showSearch = false }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const [q, setQ] = useState(sp.get('q') ?? '')
  const [sira, setSira] = useState(sp.get('sira') ?? 'yeni')
  const [minFiyat, setMinFiyat] = useState(sp.get('minFiyat') ?? '')
  const [maxFiyat, setMaxFiyat] = useState(sp.get('maxFiyat') ?? '')
  const [minEp, setMinEp] = useState(sp.get('minEp') ?? '')
  const [stok, setStok] = useState(sp.get('stok') === '1')

  // URL değişirse state senkronize
  useEffect(() => {
    setQ(sp.get('q') ?? '')
    setSira(sp.get('sira') ?? 'yeni')
    setMinFiyat(sp.get('minFiyat') ?? '')
    setMaxFiyat(sp.get('maxFiyat') ?? '')
    setMinEp(sp.get('minEp') ?? '')
    setStok(sp.get('stok') === '1')
  }, [sp])

  function applyFilters(overrides?: Partial<{ q: string; sira: string; minFiyat: string; maxFiyat: string; minEp: string; stok: boolean }>) {
    const params = new URLSearchParams()
    const _q        = overrides?.q        ?? q
    const _sira     = overrides?.sira     ?? sira
    const _minFiyat = overrides?.minFiyat ?? minFiyat
    const _maxFiyat = overrides?.maxFiyat ?? maxFiyat
    const _minEp    = overrides?.minEp    ?? minEp
    const _stok     = overrides?.stok     ?? stok

    if (_q.trim())        params.set('q', _q.trim())
    if (_sira !== 'yeni') params.set('sira', _sira)
    if (_minFiyat)        params.set('minFiyat', _minFiyat)
    if (_maxFiyat)        params.set('maxFiyat', _maxFiyat)
    if (_minEp)           params.set('minEp', _minEp)
    if (_stok)            params.set('stok', '1')

    startTransition(() => {
      router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`)
    })
  }

  function clearAll() {
    setQ('')
    setSira('yeni')
    setMinFiyat('')
    setMaxFiyat('')
    setMinEp('')
    setStok(false)
    startTransition(() => { router.push(pathname) })
  }

  function clearOne(field: 'q' | 'sira' | 'minFiyat' | 'maxFiyat' | 'minEp' | 'stok') {
    const override: Partial<{ q: string; sira: string; minFiyat: string; maxFiyat: string; minEp: string; stok: boolean }> = {}
    if (field === 'q')        override.q = ''
    if (field === 'sira')     override.sira = 'yeni'
    if (field === 'minFiyat') override.minFiyat = ''
    if (field === 'maxFiyat') override.maxFiyat = ''
    if (field === 'minEp')    override.minEp = ''
    if (field === 'stok')     override.stok = false
    applyFilters(override)
  }

  const activeBadges: Array<{ key: 'q' | 'sira' | 'minFiyat' | 'maxFiyat' | 'minEp' | 'stok'; label: string }> = []
  if (q)                  activeBadges.push({ key: 'q',        label: `"${q}"` })
  if (sira && sira !== 'yeni') {
    const sortLabel = SORT_OPTIONS.find(o => o.value === sira)?.label ?? sira
    activeBadges.push({ key: 'sira',    label: sortLabel })
  }
  if (minFiyat)           activeBadges.push({ key: 'minFiyat', label: `Min ₺${minFiyat}` })
  if (maxFiyat)           activeBadges.push({ key: 'maxFiyat', label: `Maks ₺${maxFiyat}` })
  if (minEp)              activeBadges.push({ key: 'minEp',    label: `EP ≥ ${minEp}` })
  if (stok)               activeBadges.push({ key: 'stok',     label: 'Stokta' })

  return (
    <div className="space-y-3">
      {/* Üst satır */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {showSearch && (
          <form
            onSubmit={(e) => { e.preventDefault(); applyFilters() }}
            className="flex-1 min-w-0"
          >
            <div className="relative">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ürün ara..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-base focus:outline-none focus:border-[#C9A961] placeholder-slate-400"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>
        )}

        <select
          value={sira}
          onChange={(e) => { setSira(e.target.value); applyFilters({ sira: e.target.value }) }}
          className="px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-base font-semibold focus:outline-none focus:border-[#C9A961]"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <button
          onClick={() => setOpen(v => !v)}
          className={`px-4 py-2.5 rounded-xl border text-base font-semibold transition-colors ${
            open
              ? 'bg-[#0F172A] border-[#0F172A] text-white'
              : 'bg-white border-slate-300 text-slate-900 hover:border-[#C9A961]'
          }`}
        >
          {open ? 'Filtreleri Kapat' : 'Filtrele'}
          {activeBadges.length > 0 && !open && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-black bg-[#C9A961] text-[#0F172A] rounded-full">
              {activeBadges.length}
            </span>
          )}
        </button>
      </div>

      {/* Açılır filtre paneli */}
      {open && (
        <div className="p-4 bg-[#FAFAF7] border border-slate-200 rounded-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 text-sm font-semibold mb-1">Min Fiyat (₺)</label>
              <input type="number" value={minFiyat} onChange={(e) => setMinFiyat(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-base focus:outline-none focus:border-[#C9A961]" />
            </div>
            <div>
              <label className="block text-slate-700 text-sm font-semibold mb-1">Maks Fiyat (₺)</label>
              <input type="number" value={maxFiyat} onChange={(e) => setMaxFiyat(e.target.value)}
                placeholder="∞"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-base focus:outline-none focus:border-[#C9A961]" />
            </div>
            <div>
              <label className="block text-slate-700 text-sm font-semibold mb-1">Min EP Skoru</label>
              <input type="number" step="0.5" min="0" max="10" value={minEp} onChange={(e) => setMinEp(e.target.value)}
                placeholder="0–10"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-base focus:outline-none focus:border-[#C9A961]" />
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={stok} onChange={(e) => setStok(e.target.checked)}
              className="w-4 h-4 accent-[#C9A961] cursor-pointer" />
            <span className="text-slate-700 text-base">Sadece stoktakileri göster</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={() => applyFilters()}
              className="flex-1 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-lg text-base transition-colors">
              Uygula
            </button>
            <button onClick={clearAll}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-lg text-base transition-colors">
              Temizle
            </button>
          </div>
        </div>
      )}

      {/* Aktif filtre badge'leri */}
      {activeBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 text-sm font-semibold">{total} sonuç</span>
          {activeBadges.map(b => (
            <button key={b.key} onClick={() => clearOne(b.key)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C9A961]/15 border border-[#C9A961]/30 text-[#8B7339] text-sm font-semibold rounded-full hover:bg-[#C9A961]/25 transition-colors">
              {b.label}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ))}
          <button onClick={clearAll}
            className="text-slate-500 hover:text-slate-900 text-sm font-semibold underline">
            Tümünü temizle
          </button>
        </div>
      )}
    </div>
  )
}
