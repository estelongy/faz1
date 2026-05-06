'use client'

import { useState } from 'react'

interface Props {
  packageId: string
}

export default function BuyButton({ packageId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleBuy() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/akademi/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: packageId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || 'Ödeme başlatılamadı.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Beklenmedik hata. Lütfen tekrar deneyin.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleBuy}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
      >
        {loading ? 'Yönlendiriliyor...' : 'Satın Al'}
      </button>
      {error && (
        <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
          {error}
        </div>
      )}
    </div>
  )
}
