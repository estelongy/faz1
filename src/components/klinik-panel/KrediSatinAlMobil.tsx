'use client'

import { useState } from 'react'

const PACKAGES = [
  { id: 'credit_10',  label: '10 Kredi',  credits: 10,  priceEur: 49,  pricePerCredit: '€4.90', popular: false },
  { id: 'credit_25',  label: '25 Kredi',  credits: 25,  priceEur: 99,  pricePerCredit: '€3.96', popular: true  },
  { id: 'credit_50',  label: '50 Kredi',  credits: 50,  priceEur: 179, pricePerCredit: '€3.58', popular: false },
  { id: 'credit_100', label: '100 Kredi', credits: 100, priceEur: 299, pricePerCredit: '€2.99', popular: false },
]

/**
 * EsteKlinikPRO app — mobil kredi paketi listesi (tek sütun, büyük dokunma).
 */
export default function KrediSatinAlMobil() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleBuy(packageId: string) {
    setLoading(packageId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? 'Bir hata oluştu')
      }
    } catch {
      alert('Bağlantı hatası')
    } finally {
      setLoading(null)
    }
  }

  return (
    <ul className="space-y-2.5">
      {PACKAGES.map(pkg => (
        <li
          key={pkg.id}
          className={`relative rounded-2xl border p-4 ${
            pkg.popular
              ? 'bg-emerald-500/10 border-emerald-500/40'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          {pkg.popular && (
            <span className="absolute -top-2.5 left-4 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              En Popüler
            </span>
          )}
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <p className="text-3xl font-black text-white leading-none tabular-nums">
                {pkg.credits}
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Kredi
              </p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-xl tabular-nums">€{pkg.priceEur}</p>
              <p className="text-xs text-slate-400 mt-0.5">{pkg.pricePerCredit} / kredi</p>
            </div>
            <button
              type="button"
              onClick={() => handleBuy(pkg.id)}
              disabled={loading === pkg.id}
              className={`shrink-0 px-5 py-3 rounded-xl text-sm font-bold transition ${
                pkg.popular
                  ? 'bg-emerald-500 active:bg-emerald-400 text-slate-950'
                  : 'bg-slate-800 active:bg-slate-700 text-white border border-slate-700'
              } disabled:opacity-50`}
            >
              {loading === pkg.id ? '…' : 'Al'}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
