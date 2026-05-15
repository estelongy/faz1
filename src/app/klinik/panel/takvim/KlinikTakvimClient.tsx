'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Appointment = {
  id: string
  userId: string
  date: string
  status: string
  durationMinutes: number
  patientName: string
}

type FilterKind = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'today' | 'all'

interface Props {
  appointments: Appointment[]
  onConfirm: (id: string) => Promise<{ ok: boolean; error?: string }>
  onReject:  (id: string) => Promise<{ ok: boolean; error?: string }>
  onNoShow:  (id: string) => Promise<{ ok: boolean; error?: string }>
}

const STATUS_COLOR: Record<string, string> = {
  pending:     'bg-amber-500/80 text-white',
  confirmed:   'bg-blue-500/80 text-white',
  in_progress: 'bg-violet-500/80 text-white',
  completed:   'bg-emerald-500/80 text-white',
  cancelled:   'bg-slate-600/80 text-slate-300',
  no_show:     'bg-red-900/80 text-red-300',
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

const startOfMonth = (y: number, m: number) => new Date(y, m, 1)
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate()

export default function KlinikTakvimClient({ appointments, onConfirm, onReject, onNoShow }: Props) {
  const now = new Date()
  const [viewYear, setViewYear]   = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selected, setSelected]   = useState<string | null>(null) // YYYY-MM-DD (gün seçimi)
  const [filter, setFilter]       = useState<FilterKind>('today') // default: bugün

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
  const startWeekday = firstDay.getDay()

  // Aylık istatistikler
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
  const monthAppts = appointments.filter(a => a.date.startsWith(monthPrefix))

  const todayStr = now.toISOString().slice(0, 10)
  const counts = {
    today:       appointments.filter(a => a.date.startsWith(todayStr)).length,
    pending:     appointments.filter(a => a.status === 'pending').length,
    confirmed:   monthAppts.filter(a => a.status === 'confirmed').length,
    in_progress: appointments.filter(a => a.status === 'in_progress').length,
    completed:   monthAppts.filter(a => a.status === 'completed').length,
    cancelled:   monthAppts.filter(a => a.status === 'cancelled').length,
    no_show:     monthAppts.filter(a => a.status === 'no_show').length,
  }

  // Sağ panel listesi: gün seçilmişse o gün, değilse filtre
  // İş listelerinden iptal/gelmedi gizle — sadece kendi tab'larında gösterilir
  const hideCancelled = (a: Appointment) => a.status !== 'cancelled' && a.status !== 'no_show'

  const listAppts: Appointment[] = (() => {
    if (selected) return (byDate.get(selected) ?? []).filter(hideCancelled)
    if (filter === 'today') return appointments
      .filter(a => a.date.startsWith(todayStr))
      .filter(hideCancelled)
      .sort((a, b) => a.date.localeCompare(b.date))
    if (filter === 'pending') return appointments
      .filter(a => a.status === 'pending')
      .sort((a, b) => a.date.localeCompare(b.date))
    if (filter === 'in_progress') return appointments.filter(a => a.status === 'in_progress')
    if (filter === 'all') return monthAppts.filter(hideCancelled)
    return monthAppts.filter(a => a.status === filter)
  })()

  return (
    <div>
      {/* Başlık + Ay Navigasyon */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-white">Randevu Takvimi</h2>
          <p className="text-slate-400 text-sm mt-0.5">{MONTHS_TR[viewMonth]} {viewYear}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center transition-colors">‹</button>
          <button onClick={() => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()) }}
            className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium transition-colors">Bugün</button>
          <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center transition-colors">›</button>
        </div>
      </div>

      {/* ─── ŞEKİL 1: TIKLANABİLİR FİLTRE BUTONLARI ─────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 mb-6">
        <FilterPill label="Bugün"      count={counts.today}       active={filter === 'today' && !selected}       onClick={() => { setFilter('today'); setSelected(null) }} accent="violet" />
        <FilterPill label="Bekleyen"   count={counts.pending}     active={filter === 'pending' && !selected}     onClick={() => { setFilter('pending'); setSelected(null) }} accent="amber"  badge />
        <FilterPill label="Görüşmede"  count={counts.in_progress} active={filter === 'in_progress' && !selected} onClick={() => { setFilter('in_progress'); setSelected(null) }} accent="violet" badge />
        <FilterPill label="Onaylı"     count={counts.confirmed}   active={filter === 'confirmed' && !selected}   onClick={() => { setFilter('confirmed'); setSelected(null) }} accent="blue" />
        <FilterPill label="Tamamlanan" count={counts.completed}   active={filter === 'completed' && !selected}   onClick={() => { setFilter('completed'); setSelected(null) }} accent="emerald" />
        <FilterPill label="İptal"      count={counts.cancelled}   active={filter === 'cancelled' && !selected}   onClick={() => { setFilter('cancelled'); setSelected(null) }} accent="slate" />
        <FilterPill label="Gelmedi"    count={counts.no_show}     active={filter === 'no_show' && !selected}     onClick={() => { setFilter('no_show'); setSelected(null) }} accent="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Takvim grid */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-700">
            {DAYS_TR.map(d => (
              <div key={d} className="text-center text-slate-500 text-sm py-3 font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`empty-${i}`} className="border-b border-r border-slate-800/50 min-h-[72px]" />
            ))}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayAppts = byDate.get(dateStr) ?? []
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selected
              const colIndex = (startWeekday + i) % 7
              const isLastCol = colIndex === 6

              return (
                <button
                  key={day}
                  onClick={() => setSelected(isSelected ? null : dateStr)}
                  className={`text-left p-2 min-h-[72px] border-b ${isLastCol ? '' : 'border-r'} border-slate-800/50 transition-all ${
                    isSelected ? 'bg-violet-500/20 border-violet-500/40' : 'hover:bg-slate-700/30'
                  }`}
                >
                  <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                    isToday ? 'bg-violet-500 text-white' : isSelected ? 'text-violet-300' : 'text-slate-400'
                  }`}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {dayAppts.slice(0, 2).map(a => (
                      <div key={a.id} className={`text-sm truncate rounded px-1 ${STATUS_COLOR[a.status] ?? 'bg-slate-600 text-slate-300'}`}>
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

        {/* ─── ŞEKİL 2: AKSİYON LİSTESİ (sağ panel) ─────────────────── */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="min-w-0">
              <h3 className="text-white font-bold text-sm truncate">
                {selected
                  ? new Date(selected + 'T12:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
                  : filterTitle(filter)}
              </h3>
              <p className="text-slate-500 text-sm mt-0.5">{listAppts.length} randevu</p>
            </div>
            {selected && (
              <button onClick={() => setSelected(null)}
                className="text-slate-500 hover:text-white text-sm px-2 py-1 rounded transition-colors">
                ✕ Filtreye Dön
              </button>
            )}
          </div>

          {listAppts.length > 0 ? (
            <div className="space-y-2 max-h-[600px] overflow-y-auto klinik-sidebar-scroll pr-1">
              {listAppts.map(a => (
                <RandevuListSatir
                  key={a.id}
                  appt={a}
                  onConfirm={onConfirm}
                  onReject={onReject}
                  onNoShow={onNoShow}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-slate-700 text-3xl mb-2">∅</div>
              <p className="text-slate-500 text-sm">{emptyText(filter, !!selected)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-bileşenler ─────────────────────────────────────────────

function FilterPill({
  label, count, active, onClick, accent, badge,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
  accent: 'violet' | 'amber' | 'blue' | 'emerald' | 'slate' | 'red'
  badge?: boolean
}) {
  const accentMap = {
    violet:  { active: 'bg-violet-500/15 border-violet-500/40 text-violet-300',  num: 'text-violet-300' },
    amber:   { active: 'bg-amber-500/15 border-amber-500/40 text-amber-300',     num: 'text-amber-300'  },
    blue:    { active: 'bg-blue-500/15 border-blue-500/40 text-blue-300',        num: 'text-blue-300'   },
    emerald: { active: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300', num: 'text-emerald-300' },
    slate:   { active: 'bg-slate-700 border-slate-600 text-slate-300',            num: 'text-slate-300'  },
    red:     { active: 'bg-red-500/15 border-red-500/40 text-red-300',            num: 'text-red-300'    },
  }
  const a = accentMap[accent]
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-3 rounded-xl border text-center transition-all ${
        active ? a.active : 'bg-slate-800/40 border-slate-700 hover:border-slate-600 text-slate-400'
      }`}
    >
      {badge && count > 0 && !active && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      )}
      <div className={`text-xl font-black ${active ? a.num : 'text-white'}`}>{count}</div>
      <div className="text-sm mt-0.5 font-semibold uppercase tracking-wide">{label}</div>
    </button>
  )
}

function RandevuListSatir({
  appt, onConfirm, onReject, onNoShow,
}: {
  appt: Appointment
  onConfirm: (id: string) => Promise<{ ok: boolean; error?: string }>
  onReject:  (id: string) => Promise<{ ok: boolean; error?: string }>
  onNoShow:  (id: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [hidden, setHidden] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (hidden) return null

  function doAction(action: 'confirm' | 'reject' | 'noshow') {
    setErr(null)
    startTransition(async () => {
      const fn = action === 'confirm' ? onConfirm : action === 'reject' ? onReject : onNoShow
      const res = await fn(appt.id)
      if (res.ok) {
        setHidden(true)
        router.refresh()
      } else setErr(res.error ?? 'Hata')
    })
  }

  const dateStr = appt.date
    ? new Date(appt.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    : '—'
  const timeStr = appt.date
    ? new Date(appt.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className={`p-3 rounded-xl border transition-colors ${
      appt.status === 'pending'     ? 'bg-amber-500/5 border-amber-500/20' :
      appt.status === 'in_progress' ? 'bg-violet-500/10 border-violet-500/30' :
      appt.status === 'confirmed'   ? 'bg-slate-900/40 border-slate-700' :
                                       'bg-slate-900/30 border-slate-800'
    }`}>
      {/* Üst satır: hasta + saat + status */}
      <div className="flex items-center gap-2 mb-2">
        <Link href={`/klinik/panel/hasta/${appt.userId}`}
          className="text-white text-sm font-bold hover:text-violet-400 transition-colors truncate flex-1 min-w-0">
          {appt.patientName}
        </Link>
        <span className={`text-sm px-2 py-0.5 rounded-full shrink-0 ${
          STATUS_COLOR[appt.status] ?? 'bg-slate-600 text-slate-300'
        }`}>
          {STATUS_LABEL[appt.status] ?? appt.status}
        </span>
      </div>
      <p className="text-slate-500 text-sm mb-2">
        {dateStr} · {timeStr}
      </p>

      {/* Aksiyon butonları */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {appt.status === 'pending' && (
          <>
            <button
              onClick={() => doAction('confirm')}
              disabled={isPending}
              className="flex-1 min-w-[80px] px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-bold transition-colors">
              {isPending ? '…' : '✓ Onayla'}
            </button>
            <button
              onClick={() => doAction('reject')}
              disabled={isPending}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-sm font-bold transition-colors border border-slate-700"
              title="Reddet">
              ✕
            </button>
          </>
        )}
        {appt.status === 'confirmed' && (
          <>
            <Link
              href={`/klinik/panel/randevu/${appt.id}`}
              className="flex-1 min-w-[120px] text-center px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-sm font-bold transition-colors">
              Hasta Geldi →
            </Link>
            <button
              onClick={() => doAction('noshow')}
              disabled={isPending}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-sm font-bold transition-colors border border-slate-700"
              title="Gelmedi">
              ⊘
            </button>
            <button
              onClick={() => doAction('reject')}
              disabled={isPending}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-sm font-bold transition-colors border border-slate-700"
              title="İptal">
              ✕
            </button>
          </>
        )}
        {appt.status === 'in_progress' && (
          <Link
            href={`/klinik/panel/randevu/${appt.id}`}
            className="flex-1 text-center px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors">
            Akışı Sürdür →
          </Link>
        )}
        {appt.status === 'completed' && (
          <Link
            href={`/klinik/panel/randevu/${appt.id}`}
            className="flex-1 text-center px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold transition-colors">
            Detayı Gör →
          </Link>
        )}
        {(appt.status === 'cancelled' || appt.status === 'no_show') && (
          <Link
            href={`/klinik/panel/hasta/${appt.userId}`}
            className="flex-1 text-center px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-500 text-sm transition-colors">
            Hasta Detayı
          </Link>
        )}
      </div>
      {err && <p className="text-red-400 text-sm mt-1.5">{err}</p>}
    </div>
  )
}

function filterTitle(f: FilterKind): string {
  switch (f) {
    case 'today':       return 'Bugün'
    case 'pending':     return 'Onay Bekleyen'
    case 'confirmed':   return 'Onaylı (bu ay)'
    case 'in_progress': return 'Görüşmede'
    case 'completed':   return 'Tamamlanan (bu ay)'
    case 'cancelled':   return 'İptal (bu ay)'
    case 'no_show':     return 'Gelmedi (bu ay)'
    case 'all':         return 'Bu ay tümü'
  }
}

function emptyText(f: FilterKind, daySelected: boolean): string {
  if (daySelected) return 'Bu günde randevu yok'
  if (f === 'today')       return 'Bugün için randevu yok'
  if (f === 'pending')     return 'Onay bekleyen randevu yok'
  if (f === 'in_progress') return 'Şu an görüşmede randevu yok'
  return 'Bu kategoride randevu yok'
}
