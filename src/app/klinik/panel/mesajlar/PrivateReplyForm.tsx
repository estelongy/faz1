'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { privateRespondAction, markPrivateReadAction } from './actions'

export function PrivateReplyForm({ reviewId }: { reviewId: string }) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit() {
    if (text.trim().length < 3) {
      setError('Cevap çok kısa')
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await privateRespondAction(reviewId, text)
      if (!res.ok) {
        setError(res.error ?? 'Yanıt kaydedilemedi')
      } else {
        setText('')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={e => setText(e.target.value.slice(0, 1000))}
        rows={3}
        placeholder="Hastaya özel yanıt yaz…"
        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 resize-y"
      />
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-slate-600">{text.length}/1000</p>
        <button
          type="button"
          onClick={submit}
          disabled={pending || text.trim().length < 3}
          className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          {pending ? 'Gönderiliyor…' : 'Yanıt Gönder'}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}

export function MarkReadButton({ reviewId }: { reviewId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function mark() {
    startTransition(async () => {
      await markPrivateReadAction(reviewId)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={mark}
      disabled={pending}
      className="px-3 py-1 text-[10px] uppercase tracking-wider rounded-md border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
    >
      {pending ? '…' : 'Okundu işaretle'}
    </button>
  )
}
