'use client'

import { useState } from 'react'
import Link from 'next/link'
import MuhasebeListClient from './MuhasebeListClient'

export interface PatientRow {
  id: string
  name: string
  phone: string | null
  notes: string | null
  total_amount: number
  paid_amount: number
  remaining: number
  treatment_count: number
  last_activity: string | null
}

interface DayTreatment {
  id: string
  patient_id: string
  patient_name: string
  name: string
  amount: number
}
interface DayPayment {
  id: string
  patient_id: string
  patient_name: string
  amount: number
  method: string | null
}
export interface DayGroup {
  date: string  // YYYY-MM-DD
  treatments: DayTreatment[]
  payments: DayPayment[]
  billed: number
  collected: number
}

interface Props {
  rows: PatientRow[]
  days: DayGroup[]
  monthLabel: string
  monthBilled: number
  monthCollected: number
  totalRemaining: number
  debtorCount: number
  patientCount: number
}

function formatTRY(n: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)
}

function formatDayLabel(dateStr: string): string {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
    .toISOString().slice(0, 10)
  if (dateStr === todayStr) return 'Bugün'
  if (dateStr === yesterday) return 'Dün'
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })
}

export default function MuhasebeShellClient({
  rows, days, monthLabel, monthBilled, monthCollected, totalRemaining, debtorCount, patientCount,
}: Props) {
  const [tab, setTab] = useState<'gunluk' | 'hastalar'>('gunluk')

  const monthRemaining = monthBilled - monthCollected

  return (
    <>
      {/* Aylık yekün banner — her zaman görünür */}
      <div className="mb-5 rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border border-violet-500/30 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-violet-300/80 font-bold">Bu Ay</p>
            <p className="text-white font-black text-lg sm:text-xl capitalize">{monthLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Net</p>
            <p className={`font-black text-lg sm:text-xl ${monthRemaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {monthRemaining > 0 ? '−' : '+'}{formatTRY(Math.abs(monthRemaining))}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <MiniStat label="Faturalanan" value={formatTRY(monthBilled)} tone="neutral" />
          <MiniStat label="Tahsil Edilen" value={formatTRY(monthCollected)} tone="positive" />
          <MiniStat
            label="Bu Ay Bekleyen"
            value={formatTRY(Math.max(0, monthRemaining))}
            tone={monthRemaining > 0 ? 'warning' : 'positive'}
          />
        </div>
      </div>

      {/* Genel toplam mini özet */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5 text-xs">
        <SoftCard label="Toplam Hasta" value={patientCount.toString()} />
        <SoftCard
          label={debtorCount > 0 ? `Borçlu Hasta (${debtorCount})` : 'Borçlu Hasta'}
          value={debtorCount.toString()}
          highlight={debtorCount > 0 ? 'amber' : undefined}
        />
        <SoftCard
          label="Tüm Zaman Kalan"
          value={formatTRY(totalRemaining)}
          highlight={totalRemaining > 0 ? 'amber' : undefined}
        />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 border-b border-slate-800">
        <TabButton active={tab === 'gunluk'} onClick={() => setTab('gunluk')}>
          Günlük Hareket
        </TabButton>
        <TabButton active={tab === 'hastalar'} onClick={() => setTab('hastalar')}>
          Hastalar ({rows.length})
        </TabButton>
      </div>

      {tab === 'gunluk' && <DailyTimeline days={days} />}
      {tab === 'hastalar' && <MuhasebeListClient initialRows={rows} />}
    </>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
        active ? 'text-white border-violet-500' : 'text-slate-500 hover:text-slate-300 border-transparent'
      }`}
    >
      {children}
    </button>
  )
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: 'neutral' | 'positive' | 'warning' }) {
  const colors =
    tone === 'positive' ? 'text-emerald-300' :
    tone === 'warning' ? 'text-amber-300' :
    'text-slate-200'
  return (
    <div className="rounded-lg bg-slate-900/50 border border-slate-700/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`text-base font-black mt-0.5 ${colors}`}>{value}</p>
    </div>
  )
}

function SoftCard({ label, value, highlight }: { label: string; value: string; highlight?: 'amber' | 'emerald' }) {
  const c =
    highlight === 'amber' ? 'border-amber-500/30 text-amber-300' :
    highlight === 'emerald' ? 'border-emerald-500/30 text-emerald-300' :
    'border-slate-700/60 text-slate-300'
  return (
    <div className={`rounded-lg border ${c} bg-slate-800/30 px-3 py-2`}>
      <p className="text-[10px] uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
    </div>
  )
}

function DailyTimeline({ days }: { days: DayGroup[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(days.length > 0 ? [days[0].date] : []))
  function toggle(d: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d); else next.add(d)
      return next
    })
  }

  if (days.length === 0) {
    return (
      <div className="p-12 rounded-xl border border-slate-700/50 border-dashed text-center text-slate-500 text-sm">
        Son 90 günde hareket yok. <span className="text-violet-400">Hastalar</span> sekmesinden hasta ekleyerek başla.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {days.map(d => {
        const isOpen = expanded.has(d.date)
        const totalCount = d.treatments.length + d.payments.length
        const net = d.collected - d.billed
        return (
          <div key={d.date} className="rounded-xl bg-slate-800/40 border border-slate-700/60 overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(d.date)}
              className="w-full flex items-center gap-3 p-3 sm:p-4 text-left hover:bg-slate-800/60 transition-colors"
            >
              <svg className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{formatDayLabel(d.date)}</p>
                <p className="text-slate-500 text-[11px] capitalize">
                  {totalCount} hareket
                  {d.treatments.length > 0 && <span> · {d.treatments.length} işlem</span>}
                  {d.payments.length > 0 && <span> · {d.payments.length} tahsilat</span>}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-2 text-xs">
                  {d.billed > 0 && <span className="text-slate-300">+{formatTRY(d.billed)}</span>}
                  {d.collected > 0 && <span className="text-emerald-400 font-bold">{formatTRY(d.collected)} ✓</span>}
                </div>
                {(d.billed > 0 || d.collected > 0) && (
                  <p className={`text-[10px] mt-0.5 ${net >= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    Net {net >= 0 ? '+' : '−'}{formatTRY(Math.abs(net))}
                  </p>
                )}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-slate-700/40 bg-slate-900/40 divide-y divide-slate-800/60">
                {d.treatments.length > 0 && (
                  <div className="p-3">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">İşlemler</p>
                    <div className="space-y-1">
                      {d.treatments.map(t => (
                        <Link
                          key={t.id}
                          href={`/klinik/panel/muhasebe/${t.patient_id}`}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800/60 text-xs transition-colors"
                        >
                          <span className="text-violet-300 font-medium truncate">{t.patient_name}</span>
                          <span className="text-slate-500 truncate">— {t.name}</span>
                          <span className="ml-auto text-slate-200 font-bold shrink-0">{formatTRY(t.amount)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {d.payments.length > 0 && (
                  <div className="p-3">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Tahsilatlar</p>
                    <div className="space-y-1">
                      {d.payments.map(p => (
                        <Link
                          key={p.id}
                          href={`/klinik/panel/muhasebe/${p.patient_id}`}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800/60 text-xs transition-colors"
                        >
                          <span className="text-emerald-300 font-medium truncate">{p.patient_name}</span>
                          {p.method && <span className="text-slate-600 truncate">— {p.method}</span>}
                          <span className="ml-auto text-emerald-400 font-bold shrink-0">{formatTRY(p.amount)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
