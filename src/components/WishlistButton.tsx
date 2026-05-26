'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleWishlistAction } from '@/app/estestore/wishlist-actions'

interface Props {
  productId: string
  initialInWishlist: boolean
  /** Giriş yapılmamışsa hangi sayfaya yönlensin */
  loginRedirect?: string
  /** "card" → mutlak konumlu küçük kalp; "inline" → buton */
  variant?: 'card' | 'inline'
}

export default function WishlistButton({
  productId,
  initialInWishlist,
  loginRedirect,
  variant = 'card',
}: Props) {
  const router = useRouter()
  const [inList, setInList] = useState(initialInWishlist)
  const [pending, startTransition] = useTransition()
  const [flash, setFlash] = useState<string | null>(null)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      const res = await toggleWishlistAction(productId)
      if (!res.ok) {
        if (res.error === 'Giriş yapmalısın.') {
          router.push(`/giris?g=estestore&next=${encodeURIComponent(loginRedirect ?? '/estestore')}`)
          return
        }
        setFlash(res.error)
        setTimeout(() => setFlash(null), 2500)
        return
      }
      setInList(res.inWishlist)
    })
  }

  if (variant === 'card') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label={inList ? 'Favoriden çıkar' : 'Favoriye ekle'}
        title={inList ? 'Favoriden çıkar' : 'Favoriye ekle'}
        className={`absolute top-2 right-2 z-10 w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md border transition-all ${
          inList
            ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30'
            : 'bg-white/85 border-white text-slate-600 hover:bg-white hover:text-rose-500'
        } ${pending ? 'opacity-60 scale-95' : 'hover:scale-110'}`}
      >
        <svg className="w-5 h-5" fill={inList ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
        </svg>
        {flash && (
          <span className="absolute top-full right-0 mt-1 px-2 py-1 rounded bg-slate-900 text-white text-xs whitespace-nowrap">
            {flash}
          </span>
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-base font-semibold transition-colors ${
        inList
          ? 'bg-rose-500/10 border-rose-400 text-rose-600 hover:bg-rose-500/20'
          : 'bg-white border-slate-300 text-slate-700 hover:border-rose-400 hover:text-rose-500'
      } ${pending ? 'opacity-60' : ''}`}
    >
      <svg className="w-5 h-5" fill={inList ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
      </svg>
      {inList ? 'Favoride' : 'Favoriye Ekle'}
    </button>
  )
}
