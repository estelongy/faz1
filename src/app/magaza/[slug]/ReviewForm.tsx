'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitReviewAction } from './review-actions'

export default function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rating, setRating]   = useState<number>(8)
  const [title, setTitle]     = useState('')
  const [body, setBody]       = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [open, setOpen]       = useState(false)
  const [done, setDone]       = useState(false)
  const [verified, setVerified] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await submitReviewAction({ productId, rating, title, body })
      if (!res.ok) {
        setError(res.error ?? 'Bir hata oluştu')
        return
      }
      setVerified(!!res.isVerified)
      setDone(true)
      router.refresh()
    })
  }

  const ratingColor = rating >= 9 ? 'text-emerald-400' : rating >= 7 ? 'text-amber-400' : 'text-red-400'

  if (done) {
    return (
      <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-6 text-center">
        <p className="text-emerald-400 font-bold mb-1">Yorumun paylaşıldı!</p>
        {verified && (
          <p className="text-emerald-300 text-sm">✓ Satın alma doğrulandı — yorumun &quot;Doğrulanmış&quot; olarak işaretlendi.</p>
        )}
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-4 mb-6 border border-dashed border-slate-600 hover:border-violet-500 rounded-2xl text-slate-400 hover:text-violet-400 transition-all text-sm font-medium">
        + Deneyimini Paylaş
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 bg-slate-800/50 border border-violet-500/30 rounded-2xl mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold">Deneyimini Paylaş</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-500 hover:text-white text-sm">İptal</button>
      </div>

      {/* Puan Seçici */}
      <div>
        <label className="block text-slate-400 text-xs mb-2 uppercase tracking-wide">
          Puan: <span className={`font-black text-lg ${ratingColor}`}>{rating}<span className="text-slate-500 text-xs font-normal">/10</span></span>
        </label>
        <input
          type="range" min={1} max={10} step={0.5}
          value={rating}
          onChange={e => setRating(Number(e.target.value))}
          className="w-full accent-violet-500"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>1</span><span>5</span><span>10</span>
        </div>
      </div>

      {/* Başlık */}
      <div>
        <label className="block text-slate-400 text-xs mb-1">Başlık <span className="text-slate-600">(isteğe bağlı)</span></label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Kısa bir başlık..."
          maxLength={100}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>

      {/* Deneyim */}
      <div>
        <label className="block text-slate-400 text-xs mb-1">Deneyim <span className="text-slate-600">(isteğe bağlı)</span></label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Bu ürün veya işlem hakkında deneyimini yaz..."
          maxLength={1000}
          rows={3}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-all text-sm">
        {isPending ? 'Gönderiliyor...' : 'Paylaş'}
      </button>
    </form>
  )
}
