'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, ChevronRight } from 'lucide-react'
import type { HastaItem } from './HastalarimAppView'

interface Props {
  hastalar: HastaItem[]
}

/**
 * Mobil hasta listesi — sticky arama + scroll edilebilir kart akışı.
 */
export default function HastaSearchList({ hastalar }: Props) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    if (!needle) return hastalar
    return hastalar.filter(h => h.fullName.toLocaleLowerCase('tr-TR').includes(needle))
  }, [q, hastalar])

  const now = new Date()

  return (
    <>
      <div
        className="sticky z-10 px-5 pt-2 pb-3 bg-slate-950"
        style={{ top: 'env(safe-area-inset-top)' }}
      >
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Hasta ara…"
            className="w-full pl-10 pr-3 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      <section className="px-5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center">
            <p className="text-sm text-slate-400">Eşleşen hasta yok.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map(h => {
              const initial = (h.fullName[0] ?? '?').toUpperCase()
              const yas = h.birthYear ? now.getFullYear() - h.birthYear : null
              return (
                <li key={h.userId}>
                  <Link
                    href={`/klinik/panel/hasta/${h.userId}`}
                    className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 active:bg-slate-900 transition"
                  >
                    <div className="w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-300 font-bold shrink-0">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{h.fullName}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {h.lastVisit
                          ? `Son ziyaret ${new Date(h.lastVisit).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                            })}`
                          : 'Henüz ziyaret yok'}
                        {yas ? ` · ${yas} yaş` : ''}
                        {' · '}
                        {h.totalAppts} randevu
                      </p>
                    </div>
                    {h.score != null && (
                      <span
                        className={`text-base font-black shrink-0 ${scoreClass(h.score)}`}
                      >
                        {h.score}
                        {h.isFinalScore && <span className="text-emerald-400">✦</span>}
                      </span>
                    )}
                    <ChevronRight size={18} className="text-slate-600 shrink-0" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}

function scoreClass(s: number) {
  if (s >= 90) return 'text-cyan-300'
  if (s >= 80) return 'text-emerald-300'
  if (s >= 66) return 'text-amber-300'
  if (s >= 56) return 'text-orange-300'
  return 'text-rose-300'
}
