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

  const ratingColor = rating >= 9 ? 'text-[#10876B]' : rating >= 7 ? 'text-[#8B7339]' : 'text-red-500'

  if (done) {
    return (
      <div className="p-5 bg-[#10876B]/10 border border-[#10876B]/30 rounded-2xl mb-6 text-center">
        <p className="text-[#10876B] font-bold mb-1">Yorumun paylaşıldı!</p>
        {verified && (
          <p className="text-[#0d6f57] text-sm">✓ Satın alma doğrulandı — yorumun &quot;Doğrulanmış&quot; olarak işaretlendi.</p>
        )}
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-4 mb-6 border border-dashed border-slate-300 hover:border-[#C9A961] rounded-2xl text-slate-500 hover:text-[#8B7339] transition-all text-sm font-medium">
        + Deneyimini Paylaş
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 bg-[#FAFAF7] border border-[#C9A961]/40 rounded-2xl mb-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-900 font-bold">Deneyimini Paylaş</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm">İptal</button>
      </div>

      <div>
        <label className="block text-slate-500 text-sm mb-2 uppercase tracking-wide font-semibold">
          Puan: <span className={`font-black text-lg ${ratingColor}`}>{rating}<span className="text-slate-400 text-sm font-normal">/10</span></span>
        </label>
        <input
          type="range" min={1} max={10} step={0.5}
          value={rating}
          onChange={e => setRating(Number(e.target.value))}
          className="w-full accent-[#C9A961]"
        />
        <div className="flex justify-between text-sm text-slate-400 mt-1">
          <span>1</span><span>5</span><span>10</span>
        </div>
      </div>

      <div>
        <label className="block text-slate-500 text-sm mb-1 font-semibold">Başlık <span className="text-slate-400 font-normal">(isteğe bağlı)</span></label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Kısa bir başlık..."
          maxLength={100}
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#C9A961] transition-colors"
        />
      </div>

      <div>
        <label className="block text-slate-500 text-sm mb-1 font-semibold">Deneyim <span className="text-slate-400 font-normal">(isteğe bağlı)</span></label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Bu ürün veya işlem hakkında deneyimini yaz..."
          maxLength={1000}
          rows={3}
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#C9A961] transition-colors resize-none"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-[#10876B] hover:bg-[#0d6f57] disabled:opacity-40 text-white font-semibold rounded-xl transition-all text-sm">
        {isPending ? 'Gönderiliyor...' : 'Paylaş'}
      </button>
    </form>
  )
}
