import Link from 'next/link'

type Props = {
  href: string
  label?: string
  className?: string
}

/**
 * Geri butonu — header üstlerinde "← Panelim" gibi yerleri tutarlı bir buton
 * stiline taşır. Plain text-link yerine kullanılır.
 */
export default function BackButton({ href, label = 'Geri', className = '' }: Props) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 hover:bg-slate-800/40 text-slate-300 hover:text-white text-sm font-medium transition-colors ${className}`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </Link>
  )
}
