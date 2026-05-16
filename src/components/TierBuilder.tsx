'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  formatPercent,
  formatTRY,
  validatePricingTiers,
  type EsteStoreCategory,
  type PricingTier,
  type PricingTiers,
} from '@/lib/estestore'

/**
 * 3 baremlik tier builder.
 * Vendor her satırda min/max/discount_rate girer.
 * Onay: ilk barem min, monoton artış, kategori bazlı zemin (kozmetik için %10).
 */
interface Props {
  basePrice: number
  category: EsteStoreCategory
  value: PricingTiers
  onChange: (next: PricingTiers) => void
  /** Kozmetik ilk barem zemin oranı (admin parametre, default %10) */
  minProfessionalDiscount?: number
}

const EMPTY_TIER: PricingTier = { min: 1, max: 5, discount_rate: 0.1 }

export default function TierBuilder({
  basePrice,
  category,
  value,
  onChange,
  minProfessionalDiscount = 0.1,
}: Props) {
  const [rows, setRows] = useState<PricingTier[]>(
    value.length > 0 ? value : []
  )

  useEffect(() => {
    onChange(rows)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  const errors = useMemo(
    () => validatePricingTiers(rows, category, minProfessionalDiscount),
    [rows, category, minProfessionalDiscount]
  )
  const errorByIndex = useMemo(() => {
    const map = new Map<number, string[]>()
    for (const e of errors) {
      const list = map.get(e.index) ?? []
      list.push(e.message)
      map.set(e.index, list)
    }
    return map
  }, [errors])
  const globalErrors = errorByIndex.get(-1) ?? []

  function update(i: number, patch: Partial<PricingTier>) {
    setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  function addRow() {
    if (rows.length >= 3) return
    const last = rows[rows.length - 1]
    const newMin = last ? (last.max ?? last.min) + 1 : 1
    setRows([...rows, { min: newMin, max: newMin + 9, discount_rate: last ? last.discount_rate : 0.1 }])
  }
  function removeRow(i: number) {
    setRows(prev => prev.filter((_, idx) => idx !== i))
  }
  function makeLastUnbounded() {
    setRows(prev => prev.map((r, idx) => (idx === prev.length - 1 ? { ...r, max: null } : r)))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-white font-bold text-sm">Profesyonel Toplu Alım Baremleri</h3>
          <p className="text-slate-500 text-sm mt-0.5">
            Klinik ve sağlık profesyoneli müşteriler için. En fazla 3 barem.
            {category === 'kozmetik' && (
              <span className="block">
                Kozmetik için ilk barem en az {formatPercent(minProfessionalDiscount)} olmalıdır.
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {rows.length === 0 ? (
          <div className="p-3 rounded-xl border border-dashed border-slate-700 text-slate-500 text-sm text-center">
            Henüz barem eklenmedi — opsiyonel ama öneririz.
          </div>
        ) : (
          rows.map((row, i) => {
            const rowErrors = errorByIndex.get(i) ?? []
            const unitPrice =
              basePrice > 0
                ? Math.round(basePrice * (1 - (Number(row.discount_rate) || 0)) * 100) / 100
                : 0
            return (
              <div
                key={i}
                className={`p-3 rounded-xl border ${
                  rowErrors.length > 0
                    ? 'border-red-500/40 bg-red-500/5'
                    : 'border-slate-700 bg-slate-900/60'
                }`}
              >
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <label className="block text-sm uppercase tracking-wider text-slate-500 mb-0.5">
                      Min adet
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={row.min}
                      onChange={e => update(i, { min: Number(e.target.value) || 1 })}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm text-center focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm uppercase tracking-wider text-slate-500 mb-0.5">
                      Max adet
                    </label>
                    {row.max === null ? (
                      <div className="flex items-center justify-center h-[34px] bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 text-sm font-bold">
                        ∞
                      </div>
                    ) : (
                      <input
                        type="number"
                        min={row.min}
                        value={row.max}
                        onChange={e => update(i, { max: Number(e.target.value) || row.min })}
                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm text-center focus:outline-none focus:border-violet-500"
                      />
                    )}
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm uppercase tracking-wider text-slate-500 mb-0.5">
                      İndirim
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={95}
                        step={1}
                        value={Math.round(row.discount_rate * 100)}
                        onChange={e =>
                          update(i, {
                            discount_rate: Math.min(0.95, Math.max(0, Number(e.target.value) / 100)),
                          })
                        }
                        className="w-full px-2 py-1.5 pr-6 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm text-right focus:outline-none focus:border-violet-500"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm uppercase tracking-wider text-slate-500 mb-0.5">Birim</p>
                    <p className="text-emerald-400 text-sm font-bold">{formatTRY(unitPrice)}</p>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-colors"
                      title="Bu baremi sil"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Son satırı sınırsız yap */}
                {i === rows.length - 1 && row.max !== null && (
                  <button
                    type="button"
                    onClick={makeLastUnbounded}
                    className="mt-2 text-base text-violet-300 hover:text-violet-200 underline font-semibold"
                  >
                    Son baremi sınırsız (∞) yap
                  </button>
                )}

                {rowErrors.length > 0 && (
                  <ul className="mt-2 text-sm text-red-400 list-disc list-inside space-y-0.5">
                    {rowErrors.map((m, j) => <li key={j}>{m}</li>)}
                  </ul>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="flex items-center gap-2">
        {rows.length < 3 && (
          <button
            type="button"
            onClick={addRow}
            className="flex-1 py-2 rounded-xl border border-dashed border-slate-600 hover:border-violet-500 text-slate-400 hover:text-violet-300 text-base transition-all font-semibold"
          >
            + Barem ekle ({rows.length}/3)
          </button>
        )}
        {rows.length === 0 && (
          <button
            type="button"
            onClick={() => setRows([{ ...EMPTY_TIER, discount_rate: minProfessionalDiscount }])}
            className="px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-300 text-sm font-semibold hover:bg-violet-500/20"
          >
            Önerilen 3 baremi yükle
          </button>
        )}
      </div>

      {globalErrors.length > 0 && (
        <ul className="text-sm text-red-400 list-disc list-inside space-y-0.5">
          {globalErrors.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      )}
    </div>
  )
}
