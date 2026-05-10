'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addPatient, deletePatient } from './actions'

interface Row {
  id: string
  name: string
  phone: string | null
  notes: string | null
  total_amount: number
  paid_amount: number
  remaining: number
  treatment_count: number
  last_activity: string | null
}

function trNorm(s: string) {
  return s.replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i').toLowerCase()
}
function formatTRY(n: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)
}

export default function MuhasebeListClient({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim()
    if (!q) return initialRows
    const qn = trNorm(q)
    return initialRows.filter(r =>
      trNorm(r.name).includes(qn) || (r.phone && r.phone.includes(q)),
    )
  }, [initialRows, query])

  function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await addPatient(fd)
      if (res.ok) {
        e.currentTarget.reset()
        setShowAdd(false)
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  function onDelete(id: string, name: string) {
    if (!confirm(`"${name}" hastasını ve tüm işlem/tahsilat kayıtlarını silmek istediğinden emin misin?`)) return
    startTransition(async () => {
      const res = await deletePatient(id)
      if (res.ok) router.refresh()
      else setError(res.error)
    })
  }

  return (
    <div>
      {/* Üst bar — arama + yeni hasta */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <svg className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Hasta ara (ad veya telefon)…"
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(s => !s)}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          {showAdd ? 'Vazgeç' : 'Yeni Hasta'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={onAdd} className="mb-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Ad Soyad *</label>
              <input
                name="name" required minLength={2} maxLength={120} autoFocus
                placeholder="Örn. Ayşe Y."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Telefon</label>
              <input
                name="phone" maxLength={32} type="tel"
                placeholder="0555…"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Not</label>
            <textarea
              name="notes" rows={2} maxLength={500}
              placeholder="Opsiyonel — alerjiler, özel durumlar…"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => { setShowAdd(false); setError(null) }} className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors">
              Vazgeç
            </button>
            <button type="submit" disabled={pending} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
              {pending ? 'Ekleniyor…' : 'Hasta Ekle'}
            </button>
          </div>
        </form>
      )}

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-xl border border-slate-700/50 border-dashed text-center text-slate-500 text-sm">
          {query ? 'Aramaya uyan hasta yok.' : 'Henüz hasta eklenmemiş — yukarıdan ekle.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id} className="group flex items-stretch rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-violet-500/40 transition-colors overflow-hidden">
              <Link href={`/klinik/panel/muhasebe/${r.id}`} className="flex-1 flex items-center gap-3 p-3 sm:p-4 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                  {r.name.charAt(0).toLocaleUpperCase('tr-TR')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate group-hover:text-violet-300 transition-colors">{r.name}</p>
                  <p className="text-slate-500 text-xs truncate">
                    {r.treatment_count > 0 ? `${r.treatment_count} işlem` : 'Henüz işlem yok'}
                    {r.phone && <span className="ml-2">· {r.phone}</span>}
                    {r.last_activity && <span className="ml-2">· {new Date(r.last_activity).toLocaleDateString('tr-TR')}</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {r.remaining > 0 ? (
                    <p className="text-amber-400 font-black text-sm">{formatTRY(r.remaining)}</p>
                  ) : r.total_amount > 0 ? (
                    <p className="text-emerald-400 font-black text-sm">✓ Tahsil edildi</p>
                  ) : (
                    <p className="text-slate-600 text-xs">—</p>
                  )}
                  <p className="text-slate-500 text-[10px]">
                    {formatTRY(r.paid_amount)} / {formatTRY(r.total_amount)}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => onDelete(r.id, r.name)}
                disabled={pending}
                className="px-3 text-slate-600 hover:text-red-400 hover:bg-red-500/5 transition-colors border-l border-slate-700/60"
                aria-label="Sil"
                title="Sil"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
