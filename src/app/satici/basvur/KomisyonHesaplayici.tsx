'use client'

import { useState } from 'react'

const COMMISSION_RATE = 0.15  // %15 standart; KYC sonrası özel oran müzakeresi mümkün
const STRIPE_FEE_RATE = 0.029
const STRIPE_FEE_FIXED = 1.7

export default function KomisyonHesaplayici() {
  const [price, setPrice] = useState<string>('1000')
  const num = Number(price.replace(/[^\d.,]/g, '').replace(',', '.'))
  const valid = Number.isFinite(num) && num > 0

  if (!valid) {
    return (
      <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-2xl">
        <Input price={price} setPrice={setPrice} />
        <p className="text-slate-500 text-sm mt-3">Geçerli bir fiyat gir.</p>
      </div>
    )
  }

  const commission = Math.round(num * COMMISSION_RATE * 100) / 100
  const stripeFee = Math.round((num * STRIPE_FEE_RATE + STRIPE_FEE_FIXED) * 100) / 100
  const netVendor = Math.round((num - commission - stripeFee) * 100) / 100

  return (
    <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-2xl space-y-4">
      <Input price={price} setPrice={setPrice} />

      <div className="space-y-2 text-sm">
        <Row label="Satış Fiyatı" value={num} bold />
        <Row label={`Estelongy Komisyonu (${(COMMISSION_RATE * 100).toFixed(0)}%)`} value={-commission} color="text-amber-400" />
        <Row label="Stripe Ödeme Komisyonu (~%2.9 + ₺1.70)" value={-stripeFee} color="text-amber-400" />
        <div className="border-t border-slate-700 pt-2">
          <Row label="Cebinize Geçen Net" value={netVendor} color="text-emerald-400" bold huge />
        </div>
      </div>

      <p className="text-slate-500 text-xs">
        Hesaplama yaklaşık değerdir. KDV satıcı tarafından beyan edilir. KYC sonrası yüksek hacim için özel komisyon oranı müzakere edilebilir.
      </p>
    </div>
  )
}

function Input({ price, setPrice }: { price: string; setPrice: (v: string) => void }) {
  return (
    <div>
      <label className="block text-slate-300 text-sm font-semibold mb-2">Bir ürünün satış fiyatı (₺)</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₺</span>
        <input
          type="text"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full pl-8 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xl font-bold focus:outline-none focus:border-[#C9A961]"
          placeholder="1000"
        />
      </div>
    </div>
  )
}

function Row({ label, value, color, bold, huge }: {
  label: string; value: number; color?: string; bold?: boolean; huge?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={`text-slate-400 ${bold ? 'font-semibold' : ''}`}>{label}</span>
      <span className={`${huge ? 'text-2xl font-black' : bold ? 'font-bold text-base' : ''} ${color ?? 'text-white'}`}>
        {value < 0 ? '−' : ''}₺{Math.abs(value).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  )
}
