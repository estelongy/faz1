'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { AppointmentRow } from './RandevuListClient'
import {
  unionRange,
  unionStep,
  generateSlotsForRange,
  availabilityForDate,
  slotInDay,
  type AvailabilityWeek,
} from './slot-utils'

interface Props {
  rows: AppointmentRow[]
  week: AvailabilityWeek
}

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-violet-500/30 border-violet-400 text-violet-100 hover:bg-violet-500/50',
  completed: 'bg-emerald-500/30 border-emerald-400 text-emerald-100 hover:bg-emerald-500/50',
  no_show: 'bg-amber-500/30 border-amber-400 text-amber-100 hover:bg-amber-500/50',
  cancelled: 'bg-slate-700/40 border-slate-600 text-slate-400 hover:bg-slate-700/60',
}

function startOfWeek(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = x.getDay()       // 0=Paz, 1=Pzt
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function RandevuTakvim({ rows: appointments, week }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = isoDate(new Date())

  // Haftanın union aralığını min slot süresi adımıyla doldur
  const range = useMemo(() => unionRange(week), [week])
  const stepMin = useMemo(() => unionStep(week), [week])
  const slots = useMemo(() => range ? generateSlotsForRange(range.open, range.close, stepMin) : [], [range, stepMin])
  const slotTimes = useMemo(() => new Set(slots.map(s => s.time)), [slots])

  // Randevuları gün+saat anahtarıyla indeksle
  const { byKey, orphans } = useMemo(() => {
    const m = new Map<string, AppointmentRow>()
    const orphans: AppointmentRow[] = []
    const weekStartTime = weekStart.getTime()
    const weekEndTime = addDays(weekStart, 7).getTime()
    for (const a of appointments) {
      const d = new Date(a.start_at)
      const t = d.getTime()
      if (t < weekStartTime || t >= weekEndTime) continue
      const dateStr = isoDate(d)
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      if (slotTimes.has(timeStr)) {
        m.set(`${dateStr}|${timeStr}`, a)
      } else {
        orphans.push(a)
      }
    }
    return { byKey: m, orphans }
  }, [appointments, weekStart, slotTimes])

  function jumpWeek(delta: number) { setWeekStart(s => addDays(s, delta * 7)) }
  function goToday() { setWeekStart(startOfWeek(new Date())) }

  const weekLabel = `${weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} – ${addDays(weekStart, 6).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`

  return (
    <div className="space-y-3">
      {/* Hafta navigasyonu */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => jumpWeek(-1)} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm font-bold">←</button>
          <button type="button" onClick={goToday} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm font-semibold">Bu Hafta</button>
          <button type="button" onClick={() => jumpWeek(1)} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm font-bold">→</button>
        </div>
        <div className="text-slate-300 text-sm font-semibold">{weekLabel}</div>
      </div>

      {/* Takvim — grid */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Header */}
          <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10">
            <div className="px-2 py-2" />
            {days.map((d, i) => {
              const isToday = isoDate(d) === today
              return (
                <div
                  key={i}
                  className={`px-2 py-2 text-center border-l border-slate-800 ${
                    isToday ? 'bg-violet-500/15 text-violet-200' : 'text-slate-300'
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider">{DAY_LABELS[i]}</div>
                  <div className={`text-base font-black ${isToday ? 'text-white' : ''}`}>{d.getDate()}</div>
                </div>
              )
            })}
          </div>

          {/* Slots */}
          {slots.map(slot => (
            <div
              key={slot.time}
              className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-slate-800 last:border-0"
            >
              {/* Saat etiketi */}
              <div className="px-2 flex items-center py-1.5 text-xs text-slate-400 font-mono font-semibold">
                {slot.time}
              </div>

              {/* Gün hücreleri */}
              {days.map((d, i) => {
                const dateStr = isoDate(d)
                const key = `${dateStr}|${slot.time}`
                const appt = byKey.get(key)
                const dayAvail = availabilityForDate(week, d)
                const inDay = slotInDay(slot.time, dayAvail)

                // Saat o günün slot pattern'inde değilse (kapalı / aralık dışı / step'e oturmuyor) — gri hücre
                if (!inDay && !appt) {
                  return (
                    <div
                      key={i}
                      className="border-l border-slate-800 bg-slate-950/50"
                      title={dayAvail?.is_closed ? 'Kapalı gün' : 'Slot dışı'}
                    />
                  )
                }

                if (appt) {
                  const colorCls = STATUS_BADGE[appt.status] ?? STATUS_BADGE.scheduled
                  return (
                    <Link
                      key={i}
                      href={`/klinik/panel/muhasebe/randevu/${appt.id}/duzenle`}
                      className={`border-l border-slate-800 p-1.5 text-xs border-l-2 ${colorCls} transition-all overflow-hidden block`}
                      title={`${appt.patient_name} · ${appt.treatment_type || '—'} · ${appt.duration_minutes} dk`}
                    >
                      <div className="font-bold truncate leading-tight">{appt.patient_name}</div>
                      <div className="truncate opacity-80 text-[10px] leading-tight">{appt.treatment_type || '—'}</div>
                    </Link>
                  )
                }
                return (
                  <Link
                    key={i}
                    href={`/klinik/panel/muhasebe/randevu/yeni?date=${dateStr}&time=${slot.time}`}
                    className="border-l border-slate-800 hover:bg-emerald-500/10 transition-colors flex items-center justify-center group"
                    title={`${slot.time} · boş`}
                  >
                    <span className="opacity-0 group-hover:opacity-100 font-bold transition-opacity text-emerald-300 text-lg">+</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Slot dışı (eski) randevular */}
      {orphans.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-sm">
          <div className="text-amber-300 font-semibold mb-2">Standart slot&apos;a oturmayan randevular ({orphans.length}):</div>
          <ul className="space-y-1 text-amber-200/80 text-xs">
            {orphans.map(o => (
              <li key={o.id}>
                <Link href={`/klinik/panel/muhasebe/randevu/${o.id}/duzenle`} className="hover:underline">
                  {new Date(o.start_at).toLocaleString('tr-TR')} · {o.patient_name} · {o.treatment_type || '—'}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
