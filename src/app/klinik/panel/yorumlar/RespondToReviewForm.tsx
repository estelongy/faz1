'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { clinicRespondAction } from '@/app/panel/degerlendir/[appointmentId]/actions'

export default function RespondToReviewForm({ reviewId }: { reviewId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (text.trim().length < 3) {
      setError('Cevap çok kısa')
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await clinicRespondAction(reviewId, text)
      if (!res.ok) {
        setError(res.error ?? 'Cevap kaydedilemedi')
      } else {
        setOpen(false)
        setText('')
        router.refresh()
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-violet-400 hover:text-violet-300 text-sm font-semibold inline-flex items-center gap-1 transition-colors"
      >
        💬 Bu yoruma cevap yaz
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={text}
        onChange={e => setText(e.target.value.slice(0, 1000))}
        rows={3}
        placeholder="Hastana saygılı, profesyonel bir cevap yaz. Bu cevap herkese açıktır ve düzenlenemez."
        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 resize-y"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          {text.length}/1000 · <span className="text-amber-500">Tek seferlik — sonradan değiştirilemez</span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setOpen(false); setText(''); setError(null) }}
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={pending || text.trim().length < 3}
            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-base font-semibold rounded-lg transition-colors"
          >
            {pending ? 'Kaydediliyor…' : 'Cevap Gönder'}
          </button>
        </div>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  )
}
