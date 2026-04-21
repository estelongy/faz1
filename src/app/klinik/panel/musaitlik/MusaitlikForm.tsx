'use client'

import { useState, useTransition } from 'react'
import { saveMusaitlikAction } from './musaitlik-actions'

const GUNLER = [
  { id: 1, label: 'Pazartesi', short: 'Pzt' },
  { id: 2, label: 'Salı',     short: 'Sal' },
  { id: 3, label: 'Çarşamba', short: 'Çar' },
  { id: 4, label: 'Perşembe', short: 'Per' },
  { id: 5, label: 'Cuma',     short: 'Cum' },
  { id: 6, label: 'Cumartesi',short: 'Cmt' },
  { id: 0, label: 'Pazar',    short: 'Paz' },
]

type AvailabilityRow = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  is_active: boolean
}

type DayState = {
  is_active: boolean
  start_time: string
  end_time: string
  slot_duration_minutes: number
}

function defaultDay(): DayState {
  return { is_active: false, start_time: '09:00', end_time: '18:00', slot_duration_minutes: 30 }
}

function buildInitialState(availability: AvailabilityRow[]): Record<number, DayState> {
  const map: Record<number, DayState> = {}
  for (const d of GUNLER) map[d.id] = defaultDay()
  for (const row of availability) {
    map[row.day_of_week] = {
      is_active: row.is_active,
      start_time: row.start_time.slice(0, 5),
      end_time: row.end_time.slice(0, 5),
      slot_duration_minutes: row.slot_duration_minutes,
    }
  }
  return map
}

// Slot sayısını hesapla
function slotCount(start: string, end: string, duration: number): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const totalMins = (eh * 60 + em) - (sh * 60 + sm)
  if (totalMins <= 0) return 0
  return Math.floor(totalMins / duration)
}

export default function MusaitlikForm({
  clinicId,
  availability,
}: {
  clinicId: string
  availability: AvailabilityRow[]
}) {
  const [days, setDays] = useState<Record<number, DayState>>(() => buildInitialState(availability))
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateDay(dayId: number, patch: Partial<DayState>) {
    setDays(prev => ({ ...prev, [dayId]: { ...prev[dayId], ...patch } }))
    setSaved(false)
  }

  function applyToWeekdays() {
    const ref = days[1] // Pazartesi'yi template olarak kullan
    setDays(prev => {
      const next = { ...prev }
      for (const d of [2, 3, 4, 5]) {
        next[d] = { ...ref }
      }
      return next
    })
    setSaved(false)
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const res = await saveMusaitlikAction({ clinicId, days })
      if (!res.ok) { setError(res.error ?? 'Kayıt hatası'); return }
      setSaved(true)
    })
  }

  const activeDays = GUNLER.filter(d => days[d.id]?.is_active)
  const totalSlotsPerWeek = activeDays.reduce((sum, d) => {
    const day = days[d.id]
    return sum + slotCount(day.start_time, day.end_time, day.slot_duration_minutes)
  }, 0)

  return (
    <div className="space-y-4">

      {/* Özet */}
      <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center gap-4">
        <div className="text-center">
          <p className="text-3xl font-black text-violet-400">{activeDays.length}</p>
          <p className="text-slate-500 text-xs">Aktif Gün</p>
        </div>
        <div className="w-px h-10 bg-slate-700" />
        <div className="text-center">
          <p className="text-3xl font-black text-emerald-400">{totalSlotsPerWeek}</p>
          <p className="text-slate-500 text-xs">Haftalık Slot</p>
        </div>
        <div className="ml-auto">
          <button
            type="button"
            onClick={applyToWeekdays}
            className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">
            Pazartesi ayarlarını Sal-Cum&apos;a uygula
          </button>
        </div>
      </div>

      {/* Gün kartları */}
      {GUNLER.map(gun => {
        const d = days[gun.id]
        const slots = d.is_active ? slotCount(d.start_time, d.end_time, d.slot_duration_minutes) : 0
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
                <span className="text-slate-400 text-xs">{slots} slot / gün</span>
              )}
            </div>

            {d.is_active && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 text-xs mb-1">Açılış</label>
                  <input
                    type="time"
                    value={d.start_time}
                    onChange={e => updateDay(gun.id, { start_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs mb-1">Kapanış</label>
                  <input
                    type="time"
                    value={d.end_time}
                    onChange={e => updateDay(gun.id, { end_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs mb-1">Slot Süresi</label>
                  <select
                    value={d.slot_duration_minutes}
                    onChange={e => updateDay(gun.id, { slot_duration_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
                  >
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
