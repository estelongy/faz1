'use client'

import { useState, useRef, useEffect } from 'react'

type Theme = 'violet' | 'emerald'

interface FilterInputProps {
  placeholder: string
  icon: React.ReactNode
  value: string
  suggestions: string[]
  onSelect: (val: string) => void
  onClear: () => void
  /** Renk teması — default violet (RandevuFlow), emerald = EsteKlinik */
  theme?: Theme
}

function trNorm(s: string) {
  return s.replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i').toLowerCase()
}

const THEMES: Record<Theme, {
  activeBg: string
  activeBorder: string
  activeIcon: string
  focusBorder: string
  panelBg: string
  panelBorder: string
  panelText: string
  panelHoverBg: string
  panelHoverText: string
  inputBg: string
  inputBorder: string
  inputText: string
  iconColor: string
  closeColor: string
}> = {
  violet: {
    activeBg: 'bg-violet-500/15',
    activeBorder: 'border-violet-500/40',
    activeIcon: 'text-violet-400',
    focusBorder: 'focus-within:border-violet-500/60',
    panelBg: 'bg-slate-800',
    panelBorder: 'border-slate-700',
    panelText: 'text-slate-300',
    panelHoverBg: 'hover:bg-slate-700',
    panelHoverText: 'hover:text-white',
    inputBg: 'bg-slate-800/50',
    inputBorder: 'border-slate-700',
    inputText: 'text-white placeholder-slate-500',
    iconColor: 'text-slate-500',
    closeColor: 'text-slate-500 hover:text-white',
  },
  emerald: {
    activeBg: 'bg-[#10876B]/20',
    activeBorder: 'border-[#10876B]/60',
    activeIcon: 'text-emerald-200',
    focusBorder: 'focus-within:border-emerald-300/70',
    panelBg: 'bg-white',
    panelBorder: 'border-slate-200',
    panelText: 'text-slate-700',
    panelHoverBg: 'hover:bg-[#10876B]/10',
    panelHoverText: 'hover:text-[#0E7559]',
    inputBg: 'bg-white/10',
    inputBorder: 'border-white/20',
    inputText: 'text-white placeholder-emerald-100/60',
    iconColor: 'text-emerald-200/70',
    closeColor: 'text-emerald-100/60 hover:text-white',
  },
}

export function FilterInput({ placeholder, icon, value, suggestions, onSelect, onClear, theme = 'violet' }: FilterInputProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const t = THEMES[theme]

  const filtered = query.trim().length >= 1
    ? suggestions
        .filter(s => trNorm(s).includes(trNorm(query.trim())))
        .slice(0, 10)
    : []

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Aktif filtre gösterimi
  if (value) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2.5 ${t.activeBg} border ${t.activeBorder} rounded-xl min-w-0`}>
        <span className={`${t.activeIcon} shrink-0`}>{icon}</span>
        <span className="text-white text-sm font-medium flex-1 truncate">{value}</span>
        <button
          onClick={onClear}
          className={`${t.closeColor} transition-colors shrink-0 ml-1`}
          aria-label="Filtreyi temizle"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <div className={`flex items-center gap-2 px-3 py-2.5 ${t.inputBg} border ${t.inputBorder} rounded-xl ${t.focusBorder} transition-colors`}>
        <span className={`${t.iconColor} shrink-0`}>{icon}</span>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { if (query.trim().length >= 1) setOpen(true) }}
          placeholder={placeholder}
          className={`flex-1 bg-transparent ${t.inputText} text-sm focus:outline-none min-w-0`}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false) }}
            className={`${t.closeColor} transition-colors shrink-0`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className={`absolute top-full left-0 right-0 mt-1 ${t.panelBg} border ${t.panelBorder} rounded-xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto`}>
          {filtered.map(s => (
            <button
              key={s}
              onMouseDown={() => { onSelect(s); setQuery(''); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm ${t.panelText} ${t.panelHoverBg} ${t.panelHoverText} transition-colors border-b ${t.panelBorder} last:border-0`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
