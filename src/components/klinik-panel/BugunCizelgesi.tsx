'use client'

import { useState, useTransition, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Play, X, ChevronRight, Clock, CheckCircle2 } from 'lucide-react'

interface AppointmentLite {
  id: string
  time: string | null  // ISO datetime
  patientName: string
  status: string
}

interface WeekDay {
  iso: string
  label: string
  day: number
  count: number
  isToday: boolean
  isPast: boolean
  appts: AppointmentLite[]
}

type ActionResult = { ok: boolean; error?: string }

interface Props {
  todayIso: string  // YYYY-MM-DD
  weekSummary: WeekDay[]
  openTime: string   // "09:00"
  closeTime: string  // "19:00"
  stepMinutes: number  // 30
  onConfirm: (id: string) => Promise<ActionResult>
  onStart: (id: string) => Promise<ActionResult>
  onComplete: (id: string) => Promise<ActionResult>
  onReject: (id: string) => Promise<ActionResult>
}

function parseHHMM(s: string): number {
  const [h, m] = s.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}
function fmtMin(m: number): string {
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function statusMeta(status: string): { label: string; color: string; bg: string; border: string } {
  switch (status) {
    case 'pending':
      return { label: 'Onay bekliyor', color: 'text-amber-200', bg: 'bg-amber-500/10', border: 'border-amber-500/40' }
    case 'confirmed':
      return { label: 'Onaylı', color: 'text-emerald-200', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40' }
    case 'in_progress':
      return { label: 'Akışta', color: 'text-violet-200', bg: 'bg-violet-500/15', border: 'border-violet-500/50' }
    case 'completed':
      return { label: 'Tamamlandı', color: 'text-slate-300', bg: 'bg-slate-700/30', border: 'border-slate-600/60' }
    case 'cancelled':
      return { label: 'İptal', color: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/40' }
    default:
      return { label: status, color: 'text-slate-300', bg: 'bg-slate-700/30', border: 'border-slate-600/60' }
  }
}

export default function BugunCizelgesi({
  todayIso,
  weekSummary,
  openTime,
  closeTime,
  stepMinutes,
  onConfirm,
  onStart,
  onComplete,
  onReject,
}: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedIso, setSelectedIso] = useState<string>(todayIso)
  const nowRef = useRef<HTMLDivElement | null>(null)

  const selectedDay = useMemo(() => weekSummary.find(d => d.iso === selectedIso) ?? weekSummary.find(d => d.isToday) ?? weekSummary[0], [weekSummary, selectedIso])
  const appts = useMemo(() => selectedDay?.appts ?? [], [selectedDay])
  const dayLabel = useMemo(() => {
    if (!selectedDay) return ''
    const d = new Date(`${selectedDay.iso}T00:00:00`)
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })
  }, [selectedDay])
  const isToday = selectedDay?.isToday ?? false

  // Slot grid: 09:00–19:00 step
  const slots = useMemo(() => {
    const start = parseHHMM(openTime)
    const end = parseHHMM(closeTime)
    const step = Math.max(15, stepMinutes)
    const out: string[] = []
    for (let m = start; m + step <= end; m += step) out.push(fmtMin(m))
    return out
  }, [openTime, closeTime, stepMinutes])

  // Eşle: HH:MM → appt
  const apptByTime = useMemo(() => {
    const map = new Map<string, AppointmentLite>()
    appts.forEach(a => {
      if (!a.time) return
      const hh = new Date(a.time).toTimeString().slice(0, 5)
      // Slot'a hizalı olanlar map'e — değilse de map'e koy (orijinal saatte göster)
      map.set(hh, a)
    })
    return map
  }, [appts])

  // Off-grid randevular (slot'a denk gelmeyenler)
  const offGrid = useMemo(() => {
    return appts.filter(a => {
      if (!a.time) return false
      const hh = new Date(a.time).toTimeString().slice(0, 5)
      return !slots.includes(hh)
    })
  }, [appts, slots])

  // Şu an saati
  const nowMin = useMemo(() => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  }, [])

  // İlk render'da "şimdi"ye scroll
  useEffect(() => {
    if (nowRef.current) {
      nowRef.current.scrollIntoView({ block: 'center', behavior: 'auto' })
    }
  }, [])

  async function run(id: string, fn: (id: string) => Promise<ActionResult>) {
    setBusy(id)
    setError(null)
    const res = await fn(id)
    setBusy(null)
    if (!res.ok) {
      setError(res.error ?? 'İşlem başarısız')
      return
    }
    startTransition(() => router.refresh())
  }

  return (
    <section className="px-5">
      {/* Bu hafta şeridi — tıklanır gün seçici */}
      {weekSummary.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Bu Hafta</p>
            <Link
              href="/klinik/panel/takvim"
              className="text-xs font-semibold text-emerald-300 active:text-emerald-200 flex items-center gap-0.5"
            >
              Takvim <ChevronRight size={14} />
            </Link>
          </div>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${weekSummary.length}, minmax(0, 1fr))` }}
          >
            {weekSummary.map(d => {
              const selected = d.iso === selectedDay?.iso
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setSelectedIso(d.iso)}
                  className={`rounded-xl border px-1 py-2 text-center transition ${
                    selected
                      ? 'border-emerald-400 bg-emerald-500/20'
                      : d.isToday
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : d.isPast
                      ? 'border-slate-800/60 bg-slate-900/30 opacity-60'
                      : 'border-slate-800 bg-slate-900/60 active:bg-slate-800'
                  }`}
                >
                  <p className={`text-[9px] uppercase tracking-[0.08em] font-bold ${selected ? 'text-emerald-200' : 'text-slate-500'}`}>{d.label}</p>
                  <p className={`text-base font-black leading-tight ${selected || d.isToday ? 'text-emerald-300' : 'text-white'}`}>
                    {d.day}
                  </p>
                  <p className={`text-[10px] font-semibold ${d.count > 0 ? (selected ? 'text-emerald-200' : 'text-slate-300') : 'text-slate-600'}`}>
                    {d.count > 0 ? d.count : '·'}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Seçili gün başlığı */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
            {isToday ? 'Bugün' : selectedDay?.isPast ? 'Geçmiş gün' : 'Gelecek gün'}
          </p>
          <p className="text-white font-bold text-sm mt-0.5">{dayLabel}</p>
        </div>
        {selectedDay && !selectedDay.isToday && (
          <button
            type="button"
            onClick={() => {
              const todayDay = weekSummary.find(d => d.isToday)
              if (todayDay) setSelectedIso(todayDay.iso)
            }}
            className="text-xs font-semibold text-emerald-300 active:text-emerald-200"
          >
            Bugüne dön →
          </button>
        )}
      </div>

      {error && (
        <div className="mb-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-1.5">
        {slots.map(t => {
          const slotMin = parseHHMM(t)
          const isPast = isToday
            ? slotMin + stepMinutes <= nowMin
            : (selectedDay?.isPast ?? false)
          const isNow = isToday && slotMin <= nowMin && nowMin < slotMin + stepMinutes
          const appt = apptByTime.get(t)
          return (
            <SlotRow
              key={t}
              time={t}
              isPast={isPast}
              isNow={isNow}
              appt={appt}
              busy={busy}
nowRef={isNow ? nowRef : undefined}
              onConfirm={(id) => run(id, onConfirm)}
              onStart={(id) => run(id, onStart)}
              onComplete={(id) => run(id, onComplete)}
              onReject={(id) => run(id, onReject)}
            />
          )
        })}
      </div>

      {offGrid.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-1.5">Çizelge Dışı</p>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-1.5">
            {offGrid.map(a => {
              const hh = a.time ? new Date(a.time).toTimeString().slice(0, 5) : '—'
              const slotMin = parseHHMM(hh)
              const isPast = isToday
                ? slotMin + stepMinutes <= nowMin
                : (selectedDay?.isPast ?? false)
              return (
                <SlotRow
                  key={a.id}
                  time={hh}
                  isPast={isPast}
                  isNow={false}
                  appt={a}
                  busy={busy}
        onConfirm={(id) => run(id, onConfirm)}
                  onStart={(id) => run(id, onStart)}
                  onComplete={(id) => run(id, onComplete)}
                  onReject={(id) => run(id, onReject)}
                />
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

interface SlotRowProps {
  time: string
  isPast: boolean
  isNow: boolean
  appt?: AppointmentLite
  busy: string | null
  nowRef?: React.RefObject<HTMLDivElement>
  onConfirm: (id: string) => void
  onStart: (id: string) => void
  onComplete: (id: string) => void
  onReject: (id: string) => void
}

function SlotRow({ time, isPast, isNow, appt, busy, nowRef, onConfirm, onStart, onComplete, onReject }: SlotRowProps) {
  const meta = appt ? statusMeta(appt.status) : null
  const apptBusy = appt && busy === appt.id

  return (
    <div
      ref={nowRef}
      className={`flex gap-2 py-1.5 px-1 rounded-lg ${isNow ? 'bg-emerald-500/5' : ''} ${isPast && !appt ? 'opacity-30' : ''}`}
    >
      {/* Saat kolonu */}
      <div className="w-12 shrink-0 pt-2.5 text-right">
        <p className={`text-xs font-bold tabular-nums ${isNow ? 'text-emerald-300' : isPast ? 'text-slate-600' : 'text-slate-400'}`}>
          {time}
        </p>
        {isNow && (
          <p className="text-[8px] uppercase tracking-wider text-emerald-400 font-bold mt-0.5">şimdi</p>
        )}
      </div>

      {/* Sağ kart */}
      <div className="flex-1 min-w-0">
        {appt && meta ? (
          <div className={`rounded-xl border ${meta.border} ${meta.bg} p-2.5`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold text-sm truncate">{appt.patientName}</p>
                <p className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 ${meta.color}`}>
                  {meta.label}
                </p>
              </div>
              <Link
                href={`/klinik/panel/randevu/${appt.id}`}
                className="text-slate-400 active:text-white shrink-0 -mr-1 -mt-1 p-1"
                aria-label="Randevu detayı"
              >
                <ChevronRight size={16} />
              </Link>
            </div>

            {/* Aksiyon butonları — statüye göre */}
            {(appt.status === 'pending' || appt.status === 'confirmed' || appt.status === 'in_progress') && (
              <div className="flex gap-1.5 mt-2">
                {appt.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => onConfirm(appt.id)}
                    disabled={apptBusy}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-500/90 active:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50"
                  >
                    <Check size={13} /> Onayla
                  </button>
                )}
                {appt.status === 'confirmed' && (
                  <button
                    type="button"
                    onClick={() => onStart(appt.id)}
                    disabled={apptBusy}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-violet-500/90 active:bg-violet-500 text-white text-xs font-bold disabled:opacity-50"
                  >
                    <Play size={12} /> Başlat
                  </button>
                )}
                {appt.status === 'in_progress' && (
                  <button
                    type="button"
                    onClick={() => onComplete(appt.id)}
                    disabled={apptBusy}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-500/90 active:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} /> Bitir
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onReject(appt.id)}
                  disabled={apptBusy}
                  className="flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 disabled:opacity-50"
                  aria-label="İptal"
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={`flex items-center gap-1.5 py-2.5 text-xs ${isPast ? 'text-slate-700' : 'text-slate-600'}`}>
            <Clock size={11} /> boş
          </div>
        )}
      </div>
    </div>
  )
}
