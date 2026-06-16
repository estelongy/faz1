'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart, type CartItem } from '@/lib/cart'

interface Props {
  product: Omit<CartItem, 'quantity'>
  disabled?: boolean
  fullWidth?: boolean
  /** Sıkışık alan (mobil sticky bar) — "Sepete Ekle" text gizli, ikon kalır */
  compact?: boolean
}

/**
 * EsteStore ürün kartı / detay sayfası alış butonları.
 * Tema: krem-altın (#C9A961). 'Hemen Al' → /sepet (sepet/ödeme akışı galaxy-aware redirect yapar).
 */
export default function AddToCartButton({ product, disabled, fullWidth, compact }: Props) {
  const router = useRouter()
  const { add } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    add(product, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  function handleBuyNow() {
    add(product, 1)
    router.push('/sepet')
  }

  const base = fullWidth ? 'w-full' : ''

  return (
    <div className={`flex gap-3 ${base}`}>
      <button
        onClick={handleAdd}
        disabled={disabled || added}
        className={`${fullWidth ? 'flex-1' : ''} inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-base transition-all ${
          added
            ? 'bg-[#10876B] text-white border border-[#10876B]'
            : 'bg-white hover:bg-[#FAFAF7] text-slate-900 border border-slate-300 hover:border-[#C9A961]'
        } disabled:opacity-40 disabled:cursor-not-allowed`}>
        {added ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className={compact ? 'hidden' : ''}>Eklendi</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className={compact ? 'hidden' : ''}>Sepete Ekle</span>
          </>
        )}
      </button>
      <button
        onClick={handleBuyNow}
        disabled={disabled}
        className={`${fullWidth ? 'flex-1' : ''} inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:from-[#D4B872] hover:to-[#C9A961] text-[#0F172A] font-bold rounded-xl text-base transition-all shadow-lg shadow-[#C9A961]/30 disabled:opacity-40 disabled:cursor-not-allowed`}>
        Hemen Al
      </button>
    </div>
  )
}
