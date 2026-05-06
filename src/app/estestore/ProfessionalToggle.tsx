'use client'

import { useState } from 'react'

/**
 * Girişsiz ve role:user kullanıcılar için profesyonel kategorileri (Sarf+Akademi)
 * gösteren toggle. Profesyonel girişliyse bu component hiç render edilmez —
 * page tarafı doğrudan açık gösterir.
 */
export default function ProfessionalToggle({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          className={`group flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold transition-all ${
            open
              ? 'bg-violet-500/15 border-violet-500/40 text-violet-200 hover:bg-violet-500/20'
              : 'bg-violet-500/10 border-violet-500/30 text-violet-300 hover:bg-violet-500/15 hover:border-violet-400/50'
          }`}
        >
          <span className="text-lg">{open ? '🔒' : '🔓'}</span>
          <span>
            {open
              ? 'Profesyonel ürünleri gizle'
              : 'Profesyoneller için ürünleri de göster'}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-300">
          {children}
        </div>
      )}
    </div>
  )
}
