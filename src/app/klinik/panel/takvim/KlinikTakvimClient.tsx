'use client'

import { useState } from 'react'
import Link from 'next/link'

type Appointment = {
  id: string
  userId: string
  date: string
  status: string
  durationMinutes: number
  patientName: string
}

const STATUS_COLOR: Record<string, string> = {
  pending:     'bg-amber-500/80 text-white',
  confirmed:   'bg-blue-500/80 text-white',
  in_progress: 'bg-violet-500/80 text-white',
  completed:   'bg-emerald-500/80 text-white',
  cancelled:   'bg-slate-600/80 text-slate-300',
  no_show:     'bg-red-900/80 text-red-300',
}

const STATUS_DOT: Record<string, string> = {
  pending:     'bg-amber-400',
  confirmed:   'bg-blue-400',
  in_progress: 'bg-violet-400',
  completed:   'bg-emerald-400',
  cancelled:   'bg-slate-500',
  no_show:     'bg-red-400',
}

const STATUS_LABEL: Record<string, string> = {
  pending:     'Beklemede',
  confirmed:   'Onaylandı',
  in_progress: 'Görüşmede',
  completed:   'Tamamlandı',
  cancelled:   'İptal',
  no_show:     'Gelmedi',
}

const DAYS_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1)
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export default function KlinikTakvimClient({ appointments }: { appointments: Appointment[] }) {
  const now = new Date()
  const [viewYear, setViewYear]   = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selected, setSelected]   = useState<string | null>(null) // YYYY-MM-DD

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // Grup: date string (YYYY-MM-DD) → appointments
  const byDate = new Map<string, Appointment[]>()
  for (const a of appointments) {
    if (!a.date) continue
    const d = a.date.slice(0, 10)
    if (!byDate.has(d)) byDate.set(d, [])
    byDate.get(d)!.push(a)
  }

  const firstDay = startOfMonth(viewYear, viewMonth)
  const totalDays = daysInMonth(viewYear, viewMonth)
  const startWeekday = firstDay.getDay() // 0=Sun

  // Seçilen günün randevuları
  const selectedAppts = selected ? (byDate.get(selected) ?? []) : []

  // Aylık istatistikler
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
  const monthAppts = appointments.filter(a => a.date.startsWith(monthPrefix))
  const monthStats = {
    total:     monthAppts.length,
    completed: monthAppts.filter(a => a.status === 'completed').length,
    cancelled: monthAppts.filter(a => a.status === 'cancelled').length,
    noShow:    monthAppts.filter(a => a.status === 'no_show').length,
  }

  return (
    <div>
      {/* Başlık + Ay Navigasyon */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Randevu Takvimi</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {MONTHS_TR[viewMonth]} {viewYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth}
            className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center transition-colors">
            ‹
          </button>
          <button
            onClick={() => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()) }}
            className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors">
            Bugün
          </button>
          <button onClick={nextMonth}
            className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center transition-colors">
            ›
          </button>
        </div>
      </div>

      {/* Aylık istatistikler */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Toplam',    value: monthStats.total,     color: 'text-white' },
          { label: 'Tamamlandı',value: monthStats.completed, color: 'text-emerald-400' },
          { label: 'İptal',     value: monthStats.cancelled, color: 'text-red-400' },
          { label: 'Gelmedi',   value: monthStats.noShow,    color: 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Takvim grid */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
          {/* Gün başlıkları */}
          <div className="grid grid-cols-7 border-b border-slate-700">
            {DAYS_TR.map(d => (
              <div key={d} className="text-center text-slate-500 text-xs py-3 font-medium">{d}</div>
            ))}
          </div>
          {/* Günler */}
          <div className="grid grid-cols-7">
            {/* Boş hücreler (ay başı offset) */}
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`empty-${i}`} className="border-b border-r border-slate-800/50 min-h-[72px]" />
            ))}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayAppts = byDate.get(dateStr) ?? []
              const isToday = dateStr === now.toISOString().slice(0, 10)
              const isSelected = dateStr === selected
              const colIndex = (startWeekday + i) % 7
              const isLastCol = colIndex === 6

              return (
                <button
                  key={day}
                  onClick={() => setSelected(isSelected ? null : dateStr)}
                  className={`text-left p-2 min-h-[72px] border-b ${isLastCol ? '' : 'border-r'} border-slate-800/50 transition-all ${
                    isSelected
                      ? 'bg-violet-500/20 border-violet-500/40'
                      : 'hover:bg-slate-700/30'
                  }`}
                >
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                    isToday ? 'bg-violet-500 text-white' : isSelected ? 'text-violet-300' : 'text-slate-400'
                  }`}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {dayAppts.slice(0, 2).map(a => (
                      <div key={a.id} className={`text-[10px] truncate rounded px-1 ${STATUS_COLOR[a.status] ?? 'bg-slate-600 text-slate-300'}`}>
                        {new Date(a.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} {a.patientName.split(' ')[0]}
                      </div>
                    ))}
                    {dayAppts.length > 2 && (
                      <div className="text-[9px] text-slate-500 pl-1">+{dayAppts.length - 2} daha</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Seçili gün detayı */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          {selected ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">
                  {new Date(selected + 'T12:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                </h3>
                <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white text-sm">✕</button>
              </div>
              {selectedAppts.length > 0 ? (
                <div className="space-y-3">
                  {selectedAppts.map(a => (
                    <div key={a.id} className="p-3 bg-slate-900/50 rounded-xl">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Link href={`/klinik/panel/hasta/${a.userId}`}
                          className="text-white text-sm font-medium hover:text-violet-400 transition-colors truncate">
                          {a.patientName}
                        </Link>
                        <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full ${
                          STATUS_COLOR[a.status] ?? 'bg-slate-600 text-slate-300'
                        }`}>
                          {STATUS_LABEL[a.status] ?? a.status}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs">
                        {new Date(a.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{a.durationMinutes} dk
                      </p>
                      {['confirmed', 'in_progress'].includes(a.status) && (
                        <Link href={`/klinik/panel/randevu/${a.id}`}
                          className="mt-2 inline-block text-[10px] px-2 py-1 bg-violet-600/40 hover:bg-violet-600/60 text-violet-300 rounded-lg transition-colors">
                          {a.status === 'in_progress' ? 'Devam Et →' : 'Başlat →'}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-6">Bu günde randevu yok</p>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-slate-700 text-4xl mb-3">📅</div>
              <p className="text-slate-500 text-sm">Detayları görmek için takvimden bir gün seçin</p>
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-slate-700">
            <p className="text-slate-600 text-xs mb-3 font-medium uppercase tracking-wide">Durum</p>
            <div className="space-y-1.5">
              {Object.entries(STATUS_LABEL).filter(([k]) => k !== 'in_progress').map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[key]}`} />
                  <span className="text-slate-400 text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
