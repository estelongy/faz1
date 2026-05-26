'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertVendorReviewAction, deleteVendorReviewAction } from './vendor-review-actions'

interface Props {
  vendorId: string
  existing?: {
    rating: number
    title: string | null
    body: string | null
  } | null
}

export default function VendorReviewForm({ vendorId, existing }: Props) {
  const router = useRouter()
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState(existing?.title ?? '')
  const [body, setBody] = useState(existing?.body ?? '')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function submit() {
    setError(null)
    setSuccess(false)
    if (rating < 1) {
      setError('Lütfen puan ver.')
      return
    }
    startTransition(async () => {
      const res = await upsertVendorReviewAction(vendorId, rating, title, body)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setSuccess(true)
      router.refresh()
    })
  }

  function remove() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const res = await deleteVendorReviewAction(vendorId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setRating(0); setTitle(''); setBody('')
      router.refresh()
    })
  }

  return (
    <div className="p-5 bg-[#FAFAF7] border border-slate-200 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-900 font-bold text-base">
          {existing ? 'Puanını Güncelle' : 'Bu Satıcıyı Puanla'}
        </h3>
        {existing && (
          <button onClick={remove} disabled={pending}
            className="text-sm text-slate-500 hover:text-red-500 font-semibold underline">
            Sil
          </button>
        )}
      </div>

      {/* Yıldız */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="text-3xl leading-none transition-transform hover:scale-110"
            aria-label={`${n} yıldız`}
          >
            <span className={(hover || rating) >= n ? 'text-[#C9A961]' : 'text-slate-300'}>★</span>
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm font-semibold text-slate-600">
            {rating}/5
          </span>
        )}
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Başlık (opsiyonel)"
        maxLength={120}
        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-base focus:outline-none focus:border-[#C9A961]"
      />

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Deneyimini paylaş (opsiyonel) — kargolama, paketleme, müşteri hizmeti..."
        maxLength={1000}
        rows={3}
        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-base focus:outline-none focus:border-[#C9A961] resize-none"
      />

      {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
      {success && <p className="text-[#10876B] text-sm font-semibold">Teşekkürler! Puanın kaydedildi.</p>}

      <button
        onClick={submit}
        disabled={pending}
        className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-lg text-base transition-colors disabled:opacity-60"
      >
        {pending ? 'Kaydediliyor...' : existing ? 'Güncelle' : 'Puanla'}
      </button>
    </div>
  )
}
