'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { respondToReviewAction, clearReviewResponseAction } from './actions'

interface ReviewItem {
  id: string
  rating: number
  title: string | null
  body: string | null
  created_at: string
  is_verified: boolean
  vendor_response: string | null
  vendor_responded_at: string | null
  customer_name: string
  product_id: string
  product_name: string
  product_slug: string | null
}

export default function YorumKartlari({ reviews }: { reviews: ReviewItem[] }) {
  return (
    <div className="space-y-3">
      {reviews.map(r => <YorumKart key={r.id} r={r} />)}
    </div>
  )
}

function YorumKart({ r }: { r: ReviewItem }) {
  const router = useRouter()
  const [editing, setEditing] = useState(!r.vendor_response)
  const [response, setResponse] = useState(r.vendor_response ?? '')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit() {
    setError(null)
    startTransition(async () => {
      const res = await respondToReviewAction(r.id, response)
      if (!res.ok) { setError(res.error); return }
      setEditing(false)
      router.refresh()
    })
  }

  function clear() {
    if (!confirm('Yanıtını kaldırmak istiyor musun?')) return
    startTransition(async () => {
      await clearReviewResponseAction(r.id)
      setResponse('')
      setEditing(true)
      router.refresh()
    })
  }

  const ratingColor = r.rating >= 4 ? 'text-[#10876B]' : r.rating === 3 ? 'text-amber-500' : 'text-red-400'

  return (
    <div className={`p-5 rounded-2xl border ${
      r.vendor_response ? 'bg-slate-800/40 border-slate-700' : 'bg-amber-500/5 border-amber-500/30'
    }`}>
      {/* Üst meta */}
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
        <a href={`/estestore/${r.product_slug ?? r.product_id}`} target="_blank"
          className="text-[#C9A961] hover:text-[#D4B872] text-sm font-bold truncate max-w-xs">
          {r.product_name} ↗
        </a>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{r.customer_name}</span>
          {r.is_verified && <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">Doğrulanmış</span>}
          <span>·</span>
          <span>{new Date(r.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Rating + yorum */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-bold ${ratingColor}`}>{r.rating}/10</span>
          {r.title && <span className="text-white font-semibold text-base">— {r.title}</span>}
        </div>
        {r.body && <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{r.body}</p>}
      </div>

      {/* Yanıt */}
      {r.vendor_response && !editing ? (
        <div className="ml-4 pl-4 border-l-2 border-[#C9A961]/40 bg-[#C9A961]/5 rounded-r-lg py-2 px-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C9A961]">✓ Yanıtın</span>
            {r.vendor_responded_at && (
              <span className="text-slate-500 text-xs">
                {new Date(r.vendor_responded_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
          <p className="text-slate-200 text-base leading-relaxed whitespace-pre-wrap">{r.vendor_response}</p>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setEditing(true)}
              className="text-xs text-slate-400 hover:text-white font-semibold underline">Düzenle</button>
            <button onClick={clear} disabled={pending}
              className="text-xs text-slate-400 hover:text-red-400 font-semibold underline">Kaldır</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Müşteriye yanıtını yaz..."
            rows={3}
            maxLength={1500}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-base focus:outline-none focus:border-[#C9A961] resize-none"
          />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-slate-500 text-xs">{response.length}/1500</p>
            <div className="flex gap-2">
              {r.vendor_response && (
                <button onClick={() => { setEditing(false); setResponse(r.vendor_response ?? '') }}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg">
                  Vazgeç
                </button>
              )}
              <button onClick={submit} disabled={pending || response.trim().length < 1}
                className="px-4 py-1.5 bg-gradient-to-r from-[#C9A961] to-[#B8964F] disabled:opacity-40 text-slate-900 text-sm font-bold rounded-lg">
                {pending ? 'Kaydediliyor…' : (r.vendor_response ? 'Güncelle' : 'Yanıtla')}
              </button>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}
        </div>
      )}
    </div>
  )
}
