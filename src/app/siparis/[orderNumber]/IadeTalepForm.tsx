'use client'

import { useState } from 'react'
import { iadeTalebiOlusturAction, iadeIptalAction } from './iade-actions'

const REASONS = [
  'Ürün hasarlı/bozuk geldi',
  'Yanlış ürün gönderildi',
  'Ürün açıklamayla uyuşmuyor',
  'Ürünü beğenmedim / fikir değiştirdim',
  'Geç teslimat',
  'Diğer',
]

interface ExistingReturn {
  id: string
  status: string
  reason: string
  description: string | null
  created_at: string
}

export function IadeTalepForm({
  orderItemId,
  productName,
  fulfillmentStatus,
  existingReturn,
}: {
  orderItemId: string
  productName: string
  fulfillmentStatus: string | null
  existingReturn?: ExistingReturn | null
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState(REASONS[0])
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const canRequest = ['shipped', 'delivered'].includes(fulfillmentStatus ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await iadeTalebiOlusturAction({ orderItemId, reason, description: description.trim() || undefined })
    setLoading(false)
    if (!res.ok) { setError(res.error ?? 'Hata'); return }
    setSuccess(true)
    setOpen(false)
  }

  async function handleCancel() {
    if (!existingReturn) return
    setCancelLoading(true)
    await iadeIptalAction(existingReturn.id)
    setCancelLoading(false)
    window.location.reload()
  }

  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    pending:   { label: 'İnceleniyor', color: 'text-amber-400' },
    approved:  { label: 'Onaylandı',   color: 'text-emerald-400' },
    rejected:  { label: 'Reddedildi',  color: 'text-red-400' },
    completed: { label: 'Tamamlandı',  color: 'text-blue-400' },
    cancelled: { label: 'İptal',       color: 'text-slate-500' },
  }

  if (existingReturn && existingReturn.status !== 'cancelled') {
    const badge = STATUS_LABEL[existingReturn.status]
    return (
      <div className="mt-3 p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-xs">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-slate-400">İade talebi: </span>
            <span className={`font-bold ${badge?.color ?? 'text-slate-300'}`}>{badge?.label ?? existingReturn.status}</span>
            <p className="text-slate-500 mt-0.5">{existingReturn.reason}</p>
          </div>
          {existingReturn.status === 'pending' && (
            <button onClick={handleCancel} disabled={cancelLoading}
              className="shrink-0 text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors">
              {cancelLoading ? '...' : 'İptal Et'}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400">
        İade talebin alındı. Satıcı 2 iş günü içinde yanıtlayacak.
      </div>
    )
  }

  if (!canRequest) return null

  return (
    <div className="mt-3">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2">
          İade / Değişim Talebi Oluştur
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-900/60 border border-slate-700 rounded-xl space-y-3">
          <p className="text-white text-xs font-bold">{productName} — İade Talebi</p>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Sebep</label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-violet-500">
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Açıklama (opsiyonel)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={2} maxLength={500} placeholder="Detay eklemek istersen..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs resize-none focus:outline-none focus:border-violet-500 placeholder-slate-600" />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors">
              {loading ? 'Gönderiliyor...' : 'Talep Gönder'}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-xs rounded-lg transition-colors">
              Vazgeç
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
