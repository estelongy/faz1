'use client'

import { useState } from 'react'
import { iadeKararAction } from '@/app/siparis/[orderNumber]/iade-actions'
import { useRouter } from 'next/navigation'

export default function IadeKararForm({ returnId }: { returnId: string }) {
  const router = useRouter()
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!decision) return
    setLoading(true)
    setError(null)
    const res = await iadeKararAction(returnId, decision, note.trim() || undefined)
    setLoading(false)
    if (!res.ok) { setError(res.error ?? 'Hata'); return }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-700 pt-4 space-y-3">
      <p className="text-white text-xs font-bold">Karar Ver</p>

      <div className="flex gap-2">
        <button type="button"
          onClick={() => setDecision('approved')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
            decision === 'approved'
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-emerald-400'
          }`}>
          Onayla
        </button>
        <button type="button"
          onClick={() => setDecision('rejected')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
            decision === 'rejected'
              ? 'bg-red-600 border-red-500 text-white'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-red-500 hover:text-red-400'
          }`}>
          Reddet
        </button>
      </div>

      {decision && (
        <>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={decision === 'approved' ? 'Müşteriye not (opsiyonel)...' : 'Red sebebi (opsiyonel)...'}
            rows={2}
            maxLength={500}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs resize-none focus:outline-none focus:border-violet-500 placeholder-slate-600"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={loading}
            className={`w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all ${
              decision === 'approved'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}>
            {loading ? 'Kaydediliyor...' : decision === 'approved' ? 'Onayı Kaydet' : 'Reddi Kaydet'}
          </button>
        </>
      )}
    </form>
  )
}
