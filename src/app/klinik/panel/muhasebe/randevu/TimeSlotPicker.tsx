'use client'

import { useMemo, useState } from 'react'
import {
  generateSlotsForDay,
  availabilityForIsoDate,
  DAY_LABELS_TR,
  type AvailabilityWeek,
  type Slot,
} from './slot-utils'

interface Props {
  name: string                   // form hidden input adı (örn. "time")
  defaultValue?: string          // HH:MM önceden seçili
  isoDate: string                // YYYY-MM-DD — picker bu günün müsaitliğini kullanır
  week: AvailabilityWeek
}

export default function TimeSlotPicker({ name, defaultValue = '', isoDate, week }: Props) {
  const [selected, setSelected] = useState(defaultValue)

  const day = useMemo(() => availabilityForIsoDate(week, isoDate), [week, isoDate])
  const dow = useMemo(() => new Date(`${isoDate}T00:00:00`).getDay(), [isoDate])
  const slots = useMemo<Slot[]>(() => generateSlotsForDay(day), [day])

  // Mevcut değer slot listesinde yoksa kullanıcıya bildir (eski randevu vs.)
  const legacySelected = defaultValue && !slots.some(s => s.time === defaultValue) ? defaultValue : null

  if (!day || day.is_closed) {
    return (
      <div>
        <input type="hidden" name={name} value="" required />
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 text-center text-rose-300 text-sm font-semibold">
          {DAY_LABELS_TR[dow]} günü kapalı — başka bir gün seçin.
        </div>
      </div>
    )
  }

  return (
    <div>
      <input type="hidden" name={name} value={selected} required />

      <div className="flex flex-wrap gap-1.5 max-h-72 overflow-y-auto p-2 bg-slate-950/40 border border-slate-800 rounded-lg">
        {slots.map(s => (
          <button
            key={s.time}
            type="button"
            onClick={() => setSelected(s.time)}
            className={`px-3 py-1.5 rounded-md text-sm font-bold border transition-all ${
              selected === s.time
                ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/40 scale-105'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-400'
            }`}
            title={`${s.time} – ${s.endTime} · ${s.durationMinutes} dk`}
          >
            {s.time}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mt-2 text-xs">
        <div className="flex items-center gap-3 text-slate-500">
          <span>{DAY_LABELS_TR[dow]}</span>
          <span>·</span>
          <span>{day.open_time.slice(0, 5)} – {day.close_time.slice(0, 5)}</span>
          <span>·</span>
          <span>{slots.length} × {day.slot_duration_minutes} dk slot</span>
        </div>
        <div className="text-slate-400 font-medium">
          {selected ? (
            <span className="text-emerald-300">
              Seçili: <span className="font-bold">{selected}</span>
            </span>
          ) : legacySelected ? (
            <span className="text-amber-300">Eski saat: <span className="font-bold">{legacySelected}</span> — yeni slot seçin</span>
          ) : (
            <span>Bir slot seçin</span>
          )}
        </div>
      </div>
    </div>
  )
}
