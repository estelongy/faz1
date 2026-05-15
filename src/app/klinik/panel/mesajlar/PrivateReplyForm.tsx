'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { privateRespondAction, markPrivateReadAction } from './actions'

export function PrivateReplyForm({ reviewId }: { reviewId: string }) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    const trimmed = text.trim()
    if (trimmed.length < 3) {
      setError('Yanıt en az 3 karakter olmalı')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const res = await privateRespondAction(reviewId, trimmed)
        if (!res.ok) {
          setError(res.error ?? 'Yanıt kaydedilemedi')
          return
        }
        setSuccess(true)
        setText('')
        router.refresh()
        setTimeout(() => setSuccess(false), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Beklenmeyen hata')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={text}
        onChange={e => setText(e.target.value.slice(0, 1000))}
        rows={3}
        placeholder="Hastaya özel yanıtını yaz…"
        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 resize-y"
        disabled={pending}
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          {text.length}/1000 · <span className="text-amber-500">Tek seferlik — sonradan değiştirilemez</span>
        </p>
        <button
          type="submit"
          disabled={pending || text.trim().length < 3}
          className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {pending ? 'Gönderiliyor…' : 'Yanıt Gönder'}
        </button>
      </div>
      {error && (
        <p className="text-red-400 text-sm px-2 py-1.5 bg-red-500/10 border border-red-500/20 rounded">
          ✗ {error}
        </p>
      )}
      {success && (
        <p className="text-emerald-400 text-sm px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
          ✓ Yanıtın hastaya iletildi
        </p>
      )}
    </form>
  )
}

export function MarkReadButton({ reviewId }: { reviewId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function mark() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await markPrivateReadAction(reviewId)
        if (!res.ok) {
          setError(res.error ?? 'İşaretleme başarısız')
          return
        }
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Beklenmeyen hata')
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={mark}
        disabled={pending}
        className="px-3 py-1 text-sm uppercase tracking-wider rounded-md border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
      >
        {pending ? '…' : 'Okundu işaretle'}
      </button>
      {error && <span className="text-red-400 text-sm">✗ {error}</span>}
    </div>
  )
}
