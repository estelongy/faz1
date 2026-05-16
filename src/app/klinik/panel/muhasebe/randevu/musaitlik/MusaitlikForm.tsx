'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveAvailability } from '../../actions'
import { DAY_LABELS_TR, type AvailabilityWeek } from '../slot-utils'

// Pzt başlangıçlı sıralama (UI için), depo formatı 0=Paz, kayıt yine 0-6
const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0]

export default function MusaitlikForm({ week }: { week: AvailabilityWeek }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Local state
  const [days, setDays] = useState(() =>
    week.reduce((acc, d) => {
      acc[d.day_of_week] = { open: d.open_time.slice(0, 5), close: d.close_time.slice(0, 5), closed: d.is_closed }
      return acc
    }, {} as Record<number, { open: string; close: string; closed: boolean }>)
  )

  function update(dow: number, field: 'open' | 'close' | 'closed', value: string | boolean) {
    setDays(d => ({ ...d, [dow]: { ...d[dow], [field]: value } }))
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const fd = new FormData()
    for (let dow = 0; dow < 7; dow++) {
      const d = days[dow]
      fd.set(`open_${dow}`, d.open)
      fd.set(`close_${dow}`, d.close)
      fd.set(`closed_${dow}`, d.closed ? 'on' : '')
    }
    startTransition(async () => {
      const res = await saveAvailability(fd)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    })
  }

  const inputCls = 'bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30'
  const card = 'bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-5 sm:p-6'

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className={card}>
        <div className="space-y-3">
          {ORDERED_DAYS.map(dow => {
            const d = days[dow]
            return (
              <div key={dow} className="grid grid-cols-[120px_1fr_1fr_auto] gap-3 items-center">
                <label className="text-white font-semibold text-sm">{DAY_LABELS_TR[dow]}</label>
                <input
                  type="time"
                  value={d.open}
                  disabled={d.closed}
                  onChange={e => update(dow, 'open', e.target.value)}
                  className={inputCls + (d.closed ? ' opacity-40' : '')}
                />
                <input
                  type="time"
                  value={d.close}
                  disabled={d.closed}
                  onChange={e => update(dow, 'close', e.target.value)}
                  className={inputCls + (d.closed ? ' opacity-40' : '')}
                />
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={d.closed}
                    onChange={e => update(dow, 'closed', e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-rose-500 focus:ring-offset-0"
                  />
                  <span className={d.closed ? 'text-rose-300 font-semibold' : 'text-slate-400'}>Kapalı</span>
                </label>
              </div>
            )
          })}
        </div>

        <p className="text-slate-500 text-xs mt-4">
          Açılış-kapanış arası slot pattern&apos;ine göre üretilir (10 dk yeşil + 20 dk kırmızı). Kapalı günlerde slot oluşmaz.
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-300 text-sm font-medium">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-300 text-sm font-medium">
          ✓ Müsaitlik kaydedildi.
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="px-5 py-2.5 text-slate-300 hover:text-white text-base font-semibold">
          Geri
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white text-base font-bold rounded-xl shadow-lg shadow-violet-500/20"
        >
          {pending ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </div>
    </form>
  )
}
