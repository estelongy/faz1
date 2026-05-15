'use client'

import { useState } from 'react'

export default function EmailTestButton() {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<
    | { type: 'ok'; sentTo: string; messageId?: string; from: string }
    | { type: 'err'; message: string }
    | null
  >(null)

  async function send() {
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/test-email', { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setResult({ type: 'err', message: json.error ?? 'Bilinmeyen hata' })
      } else {
        setResult({ type: 'ok', sentTo: json.sentTo, messageId: json.messageId, from: json.from })
      }
    } catch (e) {
      setResult({ type: 'err', message: e instanceof Error ? e.message : 'Ağ hatası' })
    }
    setSending(false)
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={send}
        disabled={sending}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-all"
      >
        {sending ? 'Gönderiliyor…' : 'Kendime Test Maili Gönder'}
      </button>

      {result && result.type === 'ok' && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm space-y-1">
          <p className="font-semibold">✓ Mail gönderildi</p>
          <div className="text-sm space-y-0.5 font-mono text-emerald-200/80">
            <div>From: {result.from}</div>
            <div>To: {result.sentTo}</div>
            {result.messageId && <div>MessageID: {result.messageId}</div>}
          </div>
          <p className="text-sm mt-2 text-emerald-200/70">
            Inbox&apos;ı kontrol et. Spam&apos;a düşmüş olabilir, oraya da bak.
            Postmark Dashboard → Activity sekmesinde de &quot;Delivered&quot; olarak görünmeli.
          </p>
        </div>
      )}

      {result && result.type === 'err' && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          <p className="font-semibold">✗ Hata</p>
          <p className="text-sm mt-1 font-mono">{result.message}</p>
        </div>
      )}
    </div>
  )
}
