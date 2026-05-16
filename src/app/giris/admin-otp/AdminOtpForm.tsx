'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  next: string
}

export default function AdminOtpForm({ next }: Props) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [masked, setMasked] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [sentAt, setSentAt] = useState<number | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // İlk açılışta otomatik kod gönder
  useEffect(() => {
    void send()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cooldown
  useEffect(() => {
    if (!sentAt) return
    const tick = () => {
      const elapsed = Math.floor((Date.now() - sentAt) / 1000)
      const remaining = Math.max(0, 60 - elapsed)
      setCooldown(remaining)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [sentAt])

  async function send() {
    setSending(true)
    setError(null)
    setInfo(null)
    try {
      const res = await fetch('/api/admin-otp/send', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'SMS gönderilemedi.')
      } else {
        setMasked(json.masked ?? null)
        setSentAt(Date.now())
        setInfo('Kod gönderildi.')
      }
    } catch {
      setError('Ağ hatası. Tekrar deneyin.')
    }
    setSending(false)
  }

  async function verify(e?: React.FormEvent, submittedCode?: string) {
    e?.preventDefault()
    const c = submittedCode ?? code
    if (c.length !== 6) {
      setError('6 haneli kodu girin.')
      return
    }
    setVerifying(true)
    setError(null)
    setInfo(null)
    try {
      const res = await fetch('/api/admin-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: c }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Doğrulama başarısız.')
      } else {
        setInfo('Doğrulandı, yönlendiriliyorsunuz...')
        router.push(next)
        router.refresh()
      }
    } catch {
      setError('Ağ hatası. Tekrar deneyin.')
    }
    setVerifying(false)
  }

  // 6 hane girilince otomatik doğrula
  useEffect(() => {
    if (code.length === 6 && !verifying) {
      verify(undefined, code)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  return (
    <div className="space-y-4">
      {masked && (
        <div className="text-center text-slate-300 text-sm">
          Kod gönderilen telefon:{' '}
          <span className="font-mono font-bold text-white">{masked}</span>
        </div>
      )}

      <form onSubmit={verify} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2 text-center">6 haneli kod</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={e => {
              setCode(e.target.value.replace(/\D/g, ''))
              if (error) setError(null)
            }}
            placeholder="123456"
            autoFocus
            className={`w-full px-4 py-3 bg-slate-900 border-2 rounded-xl text-white text-2xl font-mono text-center tracking-[0.5em] focus:outline-none transition-colors ${
              error
                ? 'border-red-500 focus:border-red-500 shake'
                : 'border-slate-700 focus:border-amber-500'
            }`}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}
        {info && !error && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={verifying || code.length !== 6}
          className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-all"
        >
          {verifying ? 'Doğrulanıyor...' : 'Doğrula ve Devam Et'}
        </button>

        <button
          type="button"
          onClick={send}
          disabled={sending || cooldown > 0}
          className="w-full py-2.5 text-slate-400 hover:text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending
            ? 'Gönderiliyor...'
            : cooldown > 0
            ? `Yeni kod (${cooldown}s)`
            : 'Yeni kod iste'}
        </button>
      </form>

      <style jsx>{`
        @keyframes otp-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .shake { animation: otp-shake 0.4s ease-in-out; }
      `}</style>
    </div>
  )
}
