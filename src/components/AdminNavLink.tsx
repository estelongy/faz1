'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  href: string
  label: string
  icon: React.ReactNode
  exact?: boolean
}

export default function AdminNavLink({ href, label, icon, exact = false }: Props) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

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
