'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  href: string
  label?: string
  className?: string
  variant?: 'light' | 'dark' | 'auto'
}

/**
 * Geri butonu — sayfa temasına göre otomatik light/dark renk.
 *
 * variant:
 *  - 'auto' (default): pathname'den çıkar — EsteStore/krem zeminler light,
 *    panel/admin/klinik dark.
 *  - 'light': beyaz/krem zemin için (slate-300 border, koyu metin)
 *  - 'dark':  dark slate zemin için (slate-700 border, açık metin)
 *
 * Tipografi: 16px font-semibold (CLAUDE.md tıklanabilir kuralı)
 */
const LIGHT_BG_PATHS = [
  '/sepet', '/odeme', '/siparis', '/estestore',
  // /panel/iadelerim ve /panel/siparislerim kasten DARK kalıyor (mevcut panel hep dark)
]

function inferVariant(pathname: string): 'light' | 'dark' {
  return LIGHT_BG_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
    ? 'light'
    : 'dark'
}

export default function BackButton({ href, label = 'Geri', className = '', variant = 'auto' }: Props) {
  const pathname = usePathname()
  const v = variant === 'auto' ? inferVariant(pathname) : variant

  const themeCls = v === 'light'
    ? 'border-slate-300 hover:border-[#C9A961] hover:bg-[#FAFAF7] text-slate-700 hover:text-slate-900'
    : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/40 text-slate-300 hover:text-white'

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border ${themeCls} text-base font-semibold transition-colors ${className}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </Link>
  )
}
