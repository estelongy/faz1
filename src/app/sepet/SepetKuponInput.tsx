'use client'

import { useState } from 'react'
import { Tag, Check } from 'lucide-react'

const PENDING_COUPON_KEY = 'estelongy_pending_coupon'

/**
 * Sepette gözükür ön-doldurma. Asıl validation ödeme adımında
 * `/api/checkout/validate-coupon` ile yapılır. Burada sadece kodu
 * localStorage'a yazıp ödeme açılınca pre-fill için tutuyoruz.
 *
 * Kullanıcı kupon kodunu erken görmek + yazmak için motive — hem psikolojik
 * "kazanç" sinyali, hem ödeme adımında tekrar girmek yorucu olmaz.
 */
export default function SepetKuponInput() {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [saved, setSaved] = useState(false)

  function save() {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    try {
      window.localStorage.setItem(PENDING_COUPON_KEY, trimmed)
      setSaved(true)
    } catch {
      /* localStorage erişimi yoksa sessiz */
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-[#8B7339] text-sm font-semibold mt-3 active:text-[#6B5828]"
      >
        <Tag size={14} /> Kupon kodun var mı?
      </button>
    )
  }

  return (
    <div className="mt-3">
      <label className="block text-slate-700 text-xs font-semibold mb-1.5 uppercase tracking-wider">Kupon Kodu</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); setSaved(false) }}
          placeholder="ESTELONGY10"
          className="flex-1 min-w-0 px-3 py-2 bg-[#FAFAF7] border border-slate-300 rounded-lg text-slate-900 text-base focus:outline-none focus:border-[#C9A961] uppercase placeholder:normal-case placeholder:text-slate-400"
          autoCapitalize="characters"
        />
        <button
          type="button"
          onClick={save}
          disabled={!code.trim() || saved}
          className="shrink-0 px-4 py-2 bg-slate-900 active:bg-slate-700 text-white text-sm font-bold rounded-lg disabled:opacity-50 disabled:bg-emerald-600 disabled:text-white"
        >
          {saved ? <Check size={16} /> : 'Hazırla'}
        </button>
      </div>
      {saved && (
        <p className="text-emerald-600 text-xs font-semibold mt-1.5">
          ✓ Hazır — ödeme adımında otomatik uygulanacak
        </p>
      )}
      {!saved && (
        <p className="text-slate-500 text-xs mt-1.5">
          Geçerlilik ödeme adımında doğrulanır
        </p>
      )}
    </div>
  )
}
