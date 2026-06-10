'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveAvailability } from '../../actions'
import type { AvailabilityWeek } from '../slot-utils'

// Pzt başlangıçlı sıra (UI), kayıt yine 0-6 day_of_week
const GUNLER = [
  { id: 1, label: 'Pazartesi', short: 'Pzt' },
  { id: 2, label: 'Salı',      short: 'Sal' },
  { id: 3, label: 'Çarşamba',  short: 'Çar' },
  { id: 4, label: 'Perşembe',  short: 'Per' },
  { id: 5, label: 'Cuma',      short: 'Cum' },
  { id: 6, label: 'Cumartesi', short: 'Cmt' },
  { id: 0, label: 'Pazar',     short: 'Paz' },
]

type DayState = {
  is_active: boolean
  start_min: number  // 0..1425
  end_min: number    // 15..1440  (1440 = 24:00)
  slot_duration_minutes: number
}

function hhmmToMin(s: string): number {
  const [h, m] = s.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return 0
  return h * 60 + m
}

function minToHHMM(m: number): string {
  if (m >= 1440) return '24:00'
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function buildInitial(week: AvailabilityWeek): Record<number, DayState> {
  const map: Record<number, DayState> = {}
  for (const d of GUNLER) {
    map[d.id] = { is_active: false, start_min: 9 * 60, end_min: 19 * 60, slot_duration_minutes: 30 }
  }
  for (const row of week) {
    map[row.day_of_week] = {
      is_active: !row.is_closed,
      start_min: hhmmToMin(row.open_time.slice(0, 5)),
      end_min: hhmmToMin(row.close_time.slice(0, 5)) || 1140,
      slot_duration_minutes: row.slot_duration_minutes,
    }
  }
  return map
}

function slotCount(startMin: number, endMin: number, duration: number): number {
  const totalMins = endMin - startMin
  if (totalMins <= 0) return 0
  return Math.floor(totalMins / duration)
}

function formatDuration(mins: number): string {
  if (mins <= 0) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} dk`
  if (m === 0) return `${h} saat`
  return `${h}s ${m}dk`
}

const STEP = 15
const MAX_MIN = 1440

export default function MusaitlikForm({ week }: { week: AvailabilityWeek }) {
  const router = useRouter()
  const [days, setDays] = useState<Record<number, DayState>>(() => buildInitial(week))
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateDay(dayId: number, patch: Partial<DayState>) {
    setDays(prev => {
      const cur = { ...prev[dayId], ...patch }
      // start < end zorunluluğu (en az 1 step boşluk)
      if (cur.start_min >= cur.end_min) {
        if ('start_min' in patch) cur.end_min = Math.min(MAX_MIN, cur.start_min + STEP)
        if ('end_min' in patch) cur.start_min = Math.max(0, cur.end_min - STEP)
      }
      return { ...prev, [dayId]: cur }
    })
    setSaved(false)
  }

  function applyToWeekdays() {
    const ref = days[1]
    setDays(prev => {
      const next = { ...prev }
      for (const d of [2, 3, 4, 5]) next[d] = { ...ref }
      return next
    })
    setSaved(false)
  }

  function handleSave() {
    setError(null)
    const fd = new FormData()
    for (let dow = 0; dow < 7; dow++) {
      const d = days[dow]
      fd.set(`open_${dow}`, minToHHMM(d.start_min))
      fd.set(`close_${dow}`, minToHHMM(d.end_min))
      fd.set(`closed_${dow}`, d.is_active ? '' : 'on')
      fd.set(`duration_${dow}`, String(d.slot_duration_minutes))
    }
    startTransition(async () => {
      const res = await saveAvailability(fd)
      if (!res.ok) { setError(res.error ?? 'Kayıt hatası'); return }
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    })
  }

  const activeDays = GUNLER.filter(d => days[d.id]?.is_active)
  const totalSlotsPerWeek = activeDays.reduce((sum, d) => {
    const day = days[d.id]
    return sum + slotCount(day.start_min, day.end_min, day.slot_duration_minutes)
  }, 0)

  return (
    <div className="space-y-4">
      {/* Özet */}
      <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center gap-4 flex-wrap">
        <div className="text-center">
          <p className="text-3xl font-black text-violet-400">{activeDays.length}</p>
          <p className="text-slate-500 text-sm">Aktif Gün</p>
        </div>
        <div className="w-px h-10 bg-slate-700" />
        <div className="text-center">
          <p className="text-3xl font-black text-emerald-400">{totalSlotsPerWeek}</p>
          <p className="text-slate-500 text-sm">Haftalık Slot</p>
        </div>
        <div className="ml-auto">
          <button
            type="button"
            onClick={applyToWeekdays}
            className="text-sm px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors font-semibold">
            Pzt&apos;yi Sal-Cum&apos;a uygula
          </button>
        </div>
      </div>

      {/* Gün kartları */}
      {GUNLER.map(gun => {
        const d = days[gun.id]
        const slots = d.is_active ? slotCount(d.start_min, d.end_min, d.slot_duration_minutes) : 0
        const duration = d.end_min - d.start_min
        return (
          <div
            key={gun.id}
            className={`p-5 rounded-2xl border transition-all ${
              d.is_active ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-900/30 border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateDay(gun.id, { is_active: !d.is_active })}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center ${
                    d.is_active ? 'bg-violet-500 justify-end' : 'bg-slate-700 justify-start'
                  } p-0.5`}
                >
                  <span className="w-5 h-5 rounded-full bg-white block" />
                </button>
                <span className="text-white font-bold">{gun.label}</span>
              </div>
              {d.is_active && (
                <span className="text-slate-400 text-xs">{slots} slot · {formatDuration(duration)}</span>
              )}
            </div>

            {d.is_active && (
              <div className="space-y-4">
                {/* Saat aralığı seçici */}
                <div>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Açılış</p>
                      <p className="text-2xl font-black text-white tabular-nums">{minToHHMM(d.start_min)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Kapanış</p>
                      <p className="text-2xl font-black text-white tabular-nums">{minToHHMM(d.end_min)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Açılış kaydır</label>
                      <input
                        type="range"
                        min={0}
                        max={MAX_MIN - STEP}
                        step={STEP}
                        value={d.start_min}
                        onChange={e => updateDay(gun.id, { start_min: Number(e.target.value) })}
                        className="w-full accent-violet-500 h-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Kapanış kaydır</label>
                      <input
                        type="range"
                        min={STEP}
                        max={MAX_MIN}
                        step={STEP}
                        value={d.end_min}
                        onChange={e => updateDay(gun.id, { end_min: Number(e.target.value) })}
                        className="w-full accent-emerald-500 h-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Slot süresi */}
                <div>
                  <label className="block text-slate-500 text-xs mb-1">Slot Süresi</label>
                  <select
                    value={d.slot_duration_minutes}
                    onChange={e => updateDay(gun.id, { slot_duration_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                  >
                    <option value={10}>10 dk</option>
                    <option value={15}>15 dk</option>
                    <option value={20}>20 dk</option>
                    <option value={30}>30 dk</option>
                    <option value={45}>45 dk</option>
                    <option value={60}>60 dk</option>
                    <option value={90}>90 dk</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
          ✓ Müsaitlik takvimi kaydedildi.
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold rounded-2xl transition-all">
        {isPending ? 'Kaydediliyor...' : 'Müsaitliği Kaydet'}
      </button>
    </div>
  )
}
