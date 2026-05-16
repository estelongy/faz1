'use client'

import { useMemo, useState } from 'react'

interface Slot {
  time: string         // HH:MM
  type: 'green' | 'red'
  endTime: string      // HH:MM (slot bitişi — yeşil 30 dk sonra, kırmızı 10 dk sonra)
}

interface Props {
  name: string                   // form hidden input adı (örn. "time")
  defaultValue?: string          // HH:MM önceden seçili
  startHour?: number             // varsayılan 9
  endHour?: number               // varsayılan 19
}

function fmt(minutes: number): string {
  const hh = Math.floor(minutes / 60)
  const mm = minutes % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export default function TimeSlotPicker({
  name,
  defaultValue = '',
  startHour = 9,
  endHour = 19,
}: Props) {
  const [selected, setSelected] = useState(defaultValue)

  // Pattern: G-R-R döngüsü. Her slot 10 dk. Yeşil her 30 dk'da bir.
  const slots = useMemo<Slot[]>(() => {
    const out: Slot[] = []
    let m = startHour * 60
    const end = endHour * 60
    let cycle = 0  // 0=yeşil, 1=kırmızı, 2=kırmızı
    while (m + 10 <= end) {
      out.push({
        time: fmt(m),
        type: cycle === 0 ? 'green' : 'red',
        endTime: fmt(m + 10),
      })
      m += 10
      cycle = (cycle + 1) % 3
    }
    return out
  }, [startHour, endHour])

  // Mevcut değer slot listesinde yoksa kullanıcıya bildir (eski randevu vs.)
  const legacySelected = defaultValue && !slots.some(s => s.time === defaultValue)
    ? defaultValue
    : null
  const selectedType = slots.find(s => s.time === selected)?.type ?? null

  return (
    <div>
      <input type="hidden" name={name} value={selected} required />

      <div className="flex flex-wrap gap-1.5 max-h-72 overflow-y-auto p-2 bg-slate-950/40 border border-slate-800 rounded-lg">
        {slots.map(s =>
          s.type === 'green' ? (
            <button
              key={s.time}
              type="button"
              onClick={() => setSelected(s.time)}
              className={`px-3 py-1.5 rounded-md text-sm font-bold border transition-all ${
                selected === s.time
                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/40 scale-105'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-400'
              }`}
              title={`${s.time} – ${s.endTime} · müsait (30 dk)`}
            >
              {s.time}
            </button>
          ) : (
            <button
              key={s.time}
              type="button"
              onClick={() => setSelected(s.time)}
              title={`${s.time} – ${s.endTime} · ara slot (10 dk)`}
              className={`px-2 py-1.5 rounded-md text-xs font-bold border transition-all ${
                selected === s.time
                  ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/40 scale-105'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/30 hover:border-rose-400'
              }`}
            >
              {s.time}
            </button>
          )
        )}
      </div>

      <div className="flex items-center justify-between mt-2 text-xs">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500/40 border border-emerald-500/60" />
            yeşil (10 dk)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-rose-500/20 border border-rose-500/50" />
            kırmızı (10 dk)
          </span>
        </div>
        <div className="text-slate-400 font-medium">
          {selected ? (
            <span className={selectedType === 'red' ? 'text-rose-300' : 'text-emerald-300'}>
              Seçili: <span className="font-bold">{selected}</span>
              {selectedType === 'red' && <span className="ml-1 text-rose-400/70">(ara)</span>}
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
