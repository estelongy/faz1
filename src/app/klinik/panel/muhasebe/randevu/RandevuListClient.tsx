'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  setAppointmentStatus,
  deleteAppointment,
  cancelRecurrenceSeries,
} from '../actions'

export interface AppointmentRow {
  id: string
  patient_id: string
  patient_name: string
  patient_phone: string | null
  start_at: string
  duration_minutes: number
  appointment_type: string | null
  treatment_type: string | null
  reason: string | null
  detail: string | null
  status: 'scheduled' | 'completed' | 'no_show' | 'cancelled'
  recurrence_group_id: string | null
}

type Filter = 'upcoming' | 'all' | 'today' | 'completed' | 'cancelled'

const STATUS_META: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'Planlandı', cls: 'bg-violet-500/15 text-violet-300 border border-violet-500/30' },
  completed: { label: 'Tamamlandı', cls: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
  no_show: { label: 'Gelmedi', cls: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
  cancelled: { label: 'İptal', cls: 'bg-slate-700/40 text-slate-400 border border-slate-600' },
}

function formatStart(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  const date = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', weekday: 'short' })
  const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  return { date, time }
}

function formatPhone(p: string | null): string {
  if (!p) return ''
  const d = p.replace(/\D/g, '')
  if (d.length === 10) return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`
  return p
}

interface Props {
  rows: AppointmentRow[]
  variant?: 'compact' | 'full'
  showFilters?: boolean
}

export default function RandevuListClient({ rows, variant = 'full', showFilters = true }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('upcoming')
  const [seriesFor, setSeriesFor] = useState<AppointmentRow | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const now = Date.now()
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
    return rows.filter(r => {
      const t = new Date(r.start_at).getTime()
      if (filter === 'upcoming') return r.status === 'scheduled' && t >= now - 3600_000
      if (filter === 'today') return t >= todayStart.getTime() && t <= todayEnd.getTime()
      if (filter === 'completed') return r.status === 'completed'
      if (filter === 'cancelled') return r.status === 'cancelled' || r.status === 'no_show'
      return true
    })
  }, [rows, filter])

  function runStatus(id: string, status: 'no_show' | 'cancelled') {
    if (!confirm(status === 'no_show' ? 'Hasta gelmedi olarak işaretlensin mi?' : 'Randevu iptal edilsin mi?')) return
    setBusyId(id)
    startTransition(async () => {
      const res = await setAppointmentStatus(id, status)
      setBusyId(null)
      setMenuOpenId(null)
      if (!res.ok) alert(res.error)
      else router.refresh()
    })
  }

  function runDelete(id: string) {
    if (!confirm('Bu randevu silinsin mi? Geri alınamaz.')) return
    setBusyId(id)
    startTransition(async () => {
      const res = await deleteAppointment(id)
      setBusyId(null)
      setMenuOpenId(null)
      if (!res.ok) alert(res.error)
      else router.refresh()
    })
  }

  function runReopen(id: string) {
    setBusyId(id)
    startTransition(async () => {
      const res = await setAppointmentStatus(id, 'scheduled')
      setBusyId(null)
      setMenuOpenId(null)
      if (!res.ok) alert(res.error)
      else router.refresh()
    })
  }

  const tableHeadCls = 'text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-3 py-2'
  const tableCellCls = 'px-3 py-3 text-slate-200 text-sm'

  return (
    <div className="space-y-3">
      {showFilters && variant === 'full' && (
        <div className="flex flex-wrap gap-2">
          {(['upcoming', 'today', 'all', 'completed', 'cancelled'] as Filter[]).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                filter === f ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {f === 'upcoming' && 'Yaklaşan'}
              {f === 'today' && 'Bugün'}
              {f === 'all' && 'Tümü'}
              {f === 'completed' && 'Tamamlanan'}
              {f === 'cancelled' && 'İptal/Gelmedi'}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-sm">
          Bu filtrede randevu yok.
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/80 border-b border-slate-800">
              <tr>
                <th className={tableHeadCls}>Tarih / Saat</th>
                <th className={tableHeadCls}>Hasta</th>
                <th className={tableHeadCls}>Tedavi</th>
                <th className={tableHeadCls}>Durum</th>
                <th className={tableHeadCls + ' text-right'}>Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const { date, time } = formatStart(r.start_at)
                const meta = STATUS_META[r.status]
                const isSeries = !!r.recurrence_group_id
                const isBusy = busyId === r.id && pending
                return (
                  <tr key={r.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                    <td className={tableCellCls}>
                      <div className="font-semibold text-white">{date}</div>
                      <div className="text-slate-400 text-xs">
                        {time} · {r.duration_minutes} dk
                        {isSeries && <span className="ml-1.5 text-violet-400" title="Tekrarlayan seri">↻</span>}
                      </div>
                    </td>
                    <td className={tableCellCls}>
                      <Link href={`/klinik/panel/muhasebe/${r.patient_id}`} className="font-semibold text-white hover:text-violet-300">
                        {r.patient_name}
                      </Link>
                      {r.patient_phone && (
                        <div className="text-slate-500 text-xs">{formatPhone(r.patient_phone)}</div>
                      )}
                    </td>
                    <td className={tableCellCls}>
                      <div>{r.treatment_type || <span className="text-slate-500">—</span>}</div>
                      {r.appointment_type && <div className="text-slate-500 text-xs">{r.appointment_type}</div>}
                    </td>
                    <td className={tableCellCls}>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className={tableCellCls + ' text-right relative'}>
                      <div className="inline-flex items-center gap-1">
                        {r.status === 'scheduled' && (
                          <Link
                            href={`/klinik/panel/muhasebe?from_appointment=${r.id}`}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-md"
                          >
                            İşleme Al
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => setMenuOpenId(menuOpenId === r.id ? null : r.id)}
                          className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white"
                          aria-label="Daha fazla"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01" />
                          </svg>
                        </button>
                      </div>
                      {menuOpenId === r.id && (
                        <div className="absolute right-3 top-full mt-1 z-20 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl py-1 text-left">
                          <Link
                            href={`/klinik/panel/muhasebe/randevu/${r.id}/duzenle`}
                            className="block px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
                          >
                            ✏️ Düzenle
                          </Link>
                          {r.status === 'scheduled' && (
                            <>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => runStatus(r.id, 'no_show')}
                                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                              >
                                ⚠️ Gelmedi say
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => runStatus(r.id, 'cancelled')}
                                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                              >
                                ✖ İptal et
                              </button>
                            </>
                          )}
                          {(r.status === 'cancelled' || r.status === 'no_show') && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => runReopen(r.id)}
                              className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                            >
                              ↻ Tekrar planla
                            </button>
                          )}
                          {isSeries && r.status === 'scheduled' && (
                            <button
                              type="button"
                              onClick={() => { setSeriesFor(r); setMenuOpenId(null) }}
                              className="w-full text-left px-3 py-2 text-sm text-violet-300 hover:bg-slate-700"
                            >
                              ↻ Seri yönetimi…
                            </button>
                          )}
                          <div className="border-t border-slate-700 my-1" />
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => runDelete(r.id)}
                            className="w-full text-left px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/15 disabled:opacity-50"
                          >
                            🗑 Sil
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {seriesFor && (
        <SeriesModal
          appt={seriesFor}
          onClose={() => setSeriesFor(null)}
          onDone={() => { setSeriesFor(null); router.refresh() }}
        />
      )}
    </div>
  )
}

/* ─── Seri yönetimi modal ──────────────────────────────────────────────── */
function SeriesModal({ appt, onClose, onDone }: { appt: AppointmentRow; onClose: () => void; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  if (!appt.recurrence_group_id) return null

  function run(scope: 'all' | 'future') {
    setError(null)
    const groupId = appt.recurrence_group_id
    if (!groupId) return
    const label = scope === 'all' ? 'Serideki tüm planlı randevuları iptal et?' : 'Bu tarihten sonraki planlı randevuları iptal et?'
    if (!confirm(label)) return
    startTransition(async () => {
      const res = await cancelRecurrenceSeries({
        groupId,
        scope,
        fromAppointmentId: scope === 'future' ? appt.id : undefined,
      })
      if (!res.ok) setError(res.error)
      else onDone()
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4">
        <div>
          <h3 className="text-white text-lg font-bold">Seri Yönetimi</h3>
          <p className="text-slate-400 text-sm mt-0.5">
            Bu randevu tekrarlayan bir serinin parçası. İptal kapsamını seç.
          </p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => run('future')}
            className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700"
          >
            <div className="text-white font-semibold text-sm">Bu tarihten sonrasını iptal et</div>
            <div className="text-slate-400 text-xs mt-0.5">
              {formatStart(appt.start_at).date} {formatStart(appt.start_at).time} ve sonrası — sadece planlı randevular.
            </div>
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run('all')}
            className="w-full text-left px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg border border-rose-500/30"
          >
            <div className="text-rose-200 font-semibold text-sm">Serinin tümünü iptal et</div>
            <div className="text-rose-300/70 text-xs mt-0.5">Geçmişte tamamlanmış randevular korunur; planlı olanların hepsi iptal.</div>
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2 text-rose-300 text-sm">{error}</div>
        )}

        <div className="flex items-center justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white text-sm font-semibold">
            Kapat
          </button>
        </div>
      </div>
    </div>
  )
}
