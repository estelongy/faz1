'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'

interface Availability {
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  is_active: boolean
}

interface Props {
  clinicId: string
  /** Popover'ı kapatmak için (parent state'i temizler) */
  onClose: () => void
  /** Butonun ekrana göre rect'i — portal popover'ı buraya hizalar */
  anchorRect: DOMRect | null
}

function timeToMinutes(t: string): number { const [h, m] = t.split(':').map(Number); return h * 60 + m }
function minutesToTime(min: number): string {
  const h = Math.floor(min / 60); const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
function generateSlots(avail: Availability | undefined): string[] {
  if (!avail || !avail.is_active) return []
  const start = timeToMinutes(avail.start_time)
  const end = timeToMinutes(avail.end_time)
  const step = avail.slot_duration_minutes || 30
  const slots: string[] = []
  for (let t = start; t + step <= end; t += step) slots.push(minutesToTime(t))
  return slots
}

const DAY_NAMES_TR = ['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT']
const MONTH_NAMES_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function KlinikSlotPopover({ clinicId, onClose, anchorRect }: Props) {
  const [availability, setAvailability] = useState<Availability[]>([])
  const [busySlots, setBusySlots] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0)

  // Önümüzdeki 14 günü oluştur, sonra is_active günlerle kesişimi al
  const allDays = useMemo(() => {
    const days: Date[] = []
    const today = new Date()
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      d.setHours(0, 0, 0, 0)
      days.push(d)
    }
    return days
  }, [])

  const activeDays = useMemo(() => {
    if (availability.length === 0) return allDays.slice(0, 6)
    const activeSet = new Set(availability.filter(a => a.is_active).map(a => a.day_of_week))
    return allDays.filter(d => activeSet.has(d.getDay())).slice(0, 6)
  }, [allDays, availability])

  const selectedDay = activeDays[selectedDayIdx] ?? null

  const daySlots = useMemo(() => {
    if (!selectedDay) return []
    const dow = selectedDay.getDay()
    const avail = availability.find(a => a.day_of_week === dow)
    return generateSlots(avail)
  }, [selectedDay, availability])

  const busyForDay = useMemo(() => {
    if (!selectedDay) return new Set<string>()
    const dKey = dateKey(selectedDay)
    const out = new Set<string>()
    busySlots.forEach(s => { if (s.startsWith(dKey)) out.add(s.split(' ')[1]) })
    return out
  }, [selectedDay, busySlots])

  const availableSlots = useMemo(() => daySlots.filter(s => !busyForDay.has(s)), [daySlots, busyForDay])

  useEffect(() => {
    const supabase = createClient()
    setLoading(true)
    Promise.all([
      supabase
        .from('clinic_availability')
        .select('day_of_week, start_time, end_time, slot_duration_minutes, is_active')
        .eq('clinic_id', clinicId),
      supabase
        .from('appointments')
        .select('appointment_date')
        .eq('clinic_id', clinicId)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .gte('appointment_date', new Date().toISOString())
        .lte('appointment_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]).then(([availRes, apptRes]) => {
      setAvailability((availRes.data ?? []) as Availability[])
      const busy = new Set<string>()
      for (const a of apptRes.data ?? []) {
        const dt = new Date(a.appointment_date)
        const dKey = dateKey(dt)
        const timeKey = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
        busy.add(`${dKey} ${timeKey}`)
      }
      setBusySlots(busy)
      setLoading(false)
    })
  }, [clinicId])

  function handleSlotClick(time: string) {
    if (!selectedDay) return
    const d = dateKey(selectedDay)
    window.location.href = `/esteklinik/randevu?k=${clinicId}&d=${d}&t=${encodeURIComponent(time)}`
  }

  if (typeof window === 'undefined' || !anchorRect) return null

  const POPOVER_WIDTH = 420
  const POPOVER_EST_HEIGHT = 360
  const MARGIN = 8
  // Sağ kenar referansı + viewport içine sıkıştır
  let left = anchorRect.right - POPOVER_WIDTH
  if (left < MARGIN) left = MARGIN
  if (left + POPOVER_WIDTH > window.innerWidth - MARGIN) left = window.innerWidth - POPOVER_WIDTH - MARGIN
  // Üstte aç; üstte yer yoksa altta fallback
  const spaceAbove = anchorRect.top
  const openAbove = spaceAbove >= POPOVER_EST_HEIGHT + 8
  const style: React.CSSProperties = openAbove
    ? { position: 'fixed', bottom: window.innerHeight - anchorRect.top + 8, left, width: POPOVER_WIDTH, maxWidth: 'calc(100vw - 16px)' }
    : { position: 'fixed', top: anchorRect.bottom + 8, left, width: POPOVER_WIDTH, maxWidth: 'calc(100vw - 16px)' }

  return createPortal(
    <div
      style={style}
      className={`z-[100] rounded-2xl bg-[#0F1B2C] border border-[#10876B]/40 shadow-2xl shadow-[#064E3B]/40 p-4 animate-in fade-in duration-150 ${openAbove ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'}`}
      onMouseEnter={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 5-6 günlük strip */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Yakın Günler</p>
        <button
          onClick={onClose}
          className="text-emerald-200/60 hover:text-white transition-colors text-xs"
          aria-label="Kapat"
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeDays.length === 0 ? (
        <p className="text-emerald-200/70 text-xs py-6 text-center">Yakın zamanda müsait gün bulunamadı.</p>
      ) : (
        <>
          <div className="grid grid-cols-6 gap-1.5 mb-4">
            {activeDays.map((day, i) => {
              const isSelected = i === selectedDayIdx
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDayIdx(i)}
                  className={`flex flex-col items-center py-2 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-emerald-400 bg-[#10876B]/20 text-white shadow-md shadow-[#10876B]/30'
                      : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wider font-bold">
                    {DAY_NAMES_TR[day.getDay()]}
                  </span>
                  <span className={`text-base font-black mt-0.5 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {day.getDate()}
                  </span>
                  <span className="text-[9px] text-slate-500">{MONTH_NAMES_TR[day.getMonth()]}</span>
                </button>
              )
            })}
          </div>

          {/* Slot grid */}
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-xs font-bold text-white">Saat</p>
            <p className="text-[10px] text-emerald-200/70">
              {availableSlots.length} müsait slot
            </p>
          </div>

          {availableSlots.length === 0 ? (
            <p className="text-emerald-200/70 text-xs py-4 text-center bg-slate-900/40 rounded-lg">
              Bu güne ait müsait saat yok.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-1">
              {availableSlots.map(slot => (
                <button
                  key={slot}
                  onClick={() => handleSlotClick(slot)}
                  className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/60 hover:border-emerald-400 hover:bg-[#10876B]/20 text-slate-200 hover:text-white text-sm font-semibold transition-all"
                >
                  {slot}
                </button>
              ))}
            </div>
          )}

          <p className="text-[10px] text-emerald-200/60 mt-3 text-center">
            Slot tıklayınca randevu onayına yönlenirsin
          </p>
        </>
      )}
    </div>,
    document.body
  )
}
