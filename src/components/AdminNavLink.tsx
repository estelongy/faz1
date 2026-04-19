'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  href: string
  label: string
  icon: React.ReactNode
  exact?: boolean
  mobile?: boolean
}

export default function AdminNavLink({ href, label, icon, exact = false, mobile = false }: Props) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  if (mobile) {
    return (
      <Link
        href={href}
        className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0 ${
          isActive
            ? 'bg-slate-800 text-white'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
        }`}
      >
        <span className={`transition-colors ${isActive ? 'text-orange-400' : ''}`}>
          {icon}
        </span>
        {label}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
        isActive
          ? 'bg-slate-800 text-white'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      <span className={`transition-colors ${isActive ? 'text-orange-400' : 'group-hover:text-orange-400'}`}>
        {icon}
      </span>
      {label}
      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />}
    </Link>
  )
}
