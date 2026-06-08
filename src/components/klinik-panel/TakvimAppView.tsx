import Link from 'next/link'
import { Calendar, Clock, ChevronRight } from 'lucide-react'
import TakvimApptActions from './TakvimApptActions'

type Appointment = {
  id: string
  userId: string
  date: string
  status: string
  durationMinutes: number
  patientName: string
}

interface Props {
  appointments: Appointment[]
  onConfirm: (id: string) => Promise<{ ok: boolean; error?: string }>
  onReject: (id: string) => Promise<{ ok: boolean; error?: string }>
  onNoShow: (id: string) => Promise<{ ok: boolean; error?: string }>
}

/**
 * EsteKlinikPRO app — /klinik/panel/takvim mobil görünümü.
 * Web takvim ızgarası mobilde kullanılamaz; yerine kronolojik liste:
 * Bugün / Yarın / Bu Hafta / Daha Sonra gruplarında randevu kartları.
 */
export default function TakvimAppView({ appointments, onConfirm, onReject, onNoShow }: Props) {
  const now = new Date()
  const todayStr = isoDay(now)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = isoDay(tomorrow)

  const endOfWeek = new Date(now)
  endOfWeek.setDate(endOfWeek.getDate() + 7)

  // Aktif olmayanları gizle (iptal/gelmedi)
  const visible = appointments
    .filter(a => a.date && a.status !== 'cancelled' && a.status !== 'no_show')
    .filter(a => new Date(a.date).getTime() >= startOfDay(now).getTime())
    .sort((a, b) => a.date.localeCompare(b.date))

  const groups: Record<string, Appointment[]> = {
    today: [],
    tomorrow: [],
    week: [],
    later: [],
  }
  for (const a of visible) {
    const d = a.date.slice(0, 10)
    if (d === todayStr) groups.today.push(a)
    else if (d === tomorrowStr) groups.tomorrow.push(a)
    else if (new Date(a.date).getTime() <= endOfWeek.getTime()) groups.week.push(a)
    else groups.later.push(a)
  }

  const pendingCount = visible.filter(a => a.status === 'pending').length

  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      {/* Üst özet şeridi */}
      <section className="px-5 pt-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Bugün" value={groups.today.length} accent="text-white" />
            <Stat
              label="Yarın"
              value={groups.tomorrow.length}
              accent="text-emerald-300"
            />
            <Stat
              label="Bekleyen"
              value={pendingCount}
              accent={pendingCount > 0 ? 'text-amber-300' : 'text-white'}
            />
          </div>
          <Link
            href="/klinik/panel/musaitlik"
            className="mt-3 block text-center text-xs font-medium text-emerald-400 active:text-emerald-300"
          >
            Musaitlik ayarlarini ac →
          </Link>
        </div>
      </section>

      {/* Gruplar */}
      <Group title="Bugün" appts={groups.today} empty="Bugün randevu yok.">
        {groups.today.map(a => (
          <ApptCard
            key={a.id}
            a={a}
            onConfirm={onConfirm}
            onReject={onReject}
            onNoShow={onNoShow}
          />
        ))}
      </Group>

      <Group title="Yarın" appts={groups.tomorrow}>
        {groups.tomorrow.map(a => (
          <ApptCard
            key={a.id}
            a={a}
            onConfirm={onConfirm}
            onReject={onReject}
            onNoShow={onNoShow}
          />
        ))}
      </Group>

      <Group title="Bu Hafta" appts={groups.week}>
        {groups.week.map(a => (
          <ApptCard
            key={a.id}
            a={a}
            onConfirm={onConfirm}
            onReject={onReject}
            onNoShow={onNoShow}
          />
        ))}
      </Group>

      <Group title="Daha Sonra" appts={groups.later}>
        {groups.later.map(a => (
          <ApptCard
            key={a.id}
            a={a}
            onConfirm={onConfirm}
            onReject={onReject}
            onNoShow={onNoShow}
          />
        ))}
      </Group>

      {visible.length === 0 && (
        <section className="px-5 mt-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center">
            <Calendar size={32} className="mx-auto text-slate-600" />
            <p className="mt-2 text-sm text-slate-400">Yaklaşan randevu yok.</p>
          </div>
        </section>
      )}
    </div>
  )
}

function Group({
  title,
  appts,
  empty,
  children,
}: {
  title: string
  appts: Appointment[]
  empty?: string
  children: React.ReactNode
}) {
  if (appts.length === 0 && !empty) return null
  return (
    <section className="mt-5 px-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2">
        {title} {appts.length > 0 && <span className="text-slate-600">· {appts.length}</span>}
      </p>
      {appts.length === 0 ? (
        empty ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-center">
            <Calendar size={24} className="mx-auto text-slate-600" />
            <p className="mt-2 text-sm text-slate-400">{empty}</p>
          </div>
        ) : null
      ) : (
        <ul className="space-y-2">{children}</ul>
      )}
    </section>
  )
}

function ApptCard({
  a,
  onConfirm,
  onReject,
  onNoShow,
}: {
  a: Appointment
  onConfirm: (id: string) => Promise<{ ok: boolean; error?: string }>
  onReject: (id: string) => Promise<{ ok: boolean; error?: string }>
  onNoShow: (id: string) => Promise<{ ok: boolean; error?: string }>
}) {
  return (
    <li>
      <div
        className={`rounded-2xl border p-3.5 ${
          a.status === 'pending'
            ? 'border-amber-500/30 bg-amber-500/5'
            : a.status === 'in_progress'
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-slate-800 bg-slate-900/60'
        }`}
      >
        <Link
          href={`/klinik/panel/hasta/${a.userId}`}
          className="flex items-center gap-3 active:opacity-80"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0 text-emerald-300 font-bold">
            {a.patientName[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{a.patientName}</p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <Clock size={11} className="text-slate-500" />
              {formatDateTime(a.date)} · {statusLabel(a.status)}
            </p>
          </div>
          <ChevronRight size={18} className="text-slate-600 shrink-0" />
        </Link>
        <TakvimApptActions
          apptId={a.id}
          status={a.status}
          onConfirm={onConfirm}
          onReject={onReject}
          onNoShow={onNoShow}
        />
      </div>
    </li>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-black tabular-nums ${accent}`}>{value}</p>
    </div>
  )
}

function isoDay(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Onay bekliyor'
    case 'confirmed':
      return 'Onaylandı'
    case 'in_progress':
      return 'Akışta'
    case 'completed':
      return 'Tamamlandı'
    case 'cancelled':
      return 'İptal'
    case 'no_show':
      return 'Gelmedi'
    default:
      return status
  }
}
