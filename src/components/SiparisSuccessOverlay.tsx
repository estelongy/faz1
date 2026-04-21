'use client'

import { useEffect, useState } from 'react'

interface Props {
  orderNumber: string
  total: number
}

/**
 * Başarılı sipariş sonrası gösterilen celebration overlay.
 * 3.5 saniye sonra otomatik fade out olur.
 */
export default function SiparisSuccessOverlay({ orderNumber, total }: Props) {
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // URL'den ?success=1 parametresini temizle (sayfa yenilense de overlay tekrar görünmesin)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.searchParams.get('success') === '1') {
        url.searchParams.delete('success')
        window.history.replaceState({}, '', url.toString())
      }
    }

    const fadeTimer = setTimeout(() => setFadeOut(true), 3000)
    const removeTimer = setTimeout(() => setVisible(false), 3500)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  if (!visible) return null

  // 24 adet confetti — renkleri ve konumları rastgele
  const confetti = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1.5,
    color: ['#8b5cf6', '#a78bfa', '#34d399', '#fbbf24', '#00d4ff', '#ec4899'][i % 6],
    size: 6 + Math.random() * 6,
  }))

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Arka plan overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden">
        {confetti.map(c => (
          <span
            key={c.id}
            className="absolute top-0 rounded-sm"
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size,
              background: c.color,
              animation: `confetti-fall ${c.duration}s ${c.delay}s ease-out forwards`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      {/* Merkez kartı */}
      <div className="relative bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50 rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl shadow-emerald-500/20 animate-scaleIn">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500 flex items-center justify-center mb-4 animate-bounce-once">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Siparişin Alındı! 🎉</h2>
        <p className="text-emerald-300 text-sm mb-4">Satıcılarımız hazırlığa başlıyor</p>
        <div className="flex items-center justify-between pt-4 border-t border-emerald-500/20">
          <div className="text-left">
            <p className="text-slate-400 text-xs">Sipariş No</p>
            <p className="text-white font-mono font-bold text-sm">{orderNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs">Toplam</p>
            <p className="text-white font-black">₺{total.toLocaleString('tr-TR')}</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(120vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes scaleIn {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes bounce-once {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-15px);
          }
          60% {
            transform: translateY(-8px);
          }
        }
        :global(.animate-scaleIn) {
          animation: scaleIn 0.4s ease-out;
        }
        :global(.animate-bounce-once) {
          animation: bounce-once 1.2s ease-out;
        }
      `}</style>
    </div>
  )
}
