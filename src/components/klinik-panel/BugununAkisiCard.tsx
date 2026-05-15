'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export interface ApptView {
  id: string
  time: string | null
  patientName: string
  status: string
}

interface Props {
  todayAppts: ApptView[]
  tomorrowApptsCount: number
  pendingAppts: ApptView[]
  inProgressAppts: ApptView[]
  onConfirm: (apptId: string) => Promise<{ ok: boolean; error?: string }>
  onReject: (apptId: string) => Promise<{ ok: boolean; error?: string }>
}

function formatTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function formatRelativeDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(Date.now() + 86400_000)
  const isToday = d.toDateString() === today.toDateString()
  const isTomorrow = d.toDateString() === tomorrow.toDateString()
  if (isToday) return `Bugün · ${formatTime(iso)}`
  if (isTomorrow) return `Yarın · ${formatTime(iso)}`
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function BugununAkisiCard({
  todayAppts, tomorrowApptsCount, pendingAppts, inProgressAppts, onConfirm, onReject,
}: Props) {
  // Pending'leri ve confirmed/scheduled bugünleri ayrı göstereceğiz
  const todayConfirmed = todayAppts.filter(a => ['confirmed'].includes(a.status))
  const todayCompleted = todayAppts.filter(a => a.status === 'completed').length
  const todayCancelled = todayAppts.filter(a => ['cancelled', 'no_show'].includes(a.status)).length

  const totalAcil = pendingAppts.length + inProgressAppts.length

  const isEmpty = pendingAppts.length === 0
    && inProgressAppts.length === 0
    && todayConfirmed.length === 0
    && todayCompleted === 0

  return (
    <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800/80 via-slate-800/50 to-slate-900/30 overflow-hidden">
      {/* Başlık */}
      <div className="px-5 sm:px-6 py-4 border-b border-slate-700/60 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-bold text-lg leading-tight">Aksiyon Planın</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {totalAcil > 0
                ? `${totalAcil} acil · ${todayAppts.length} bugün`
                : `Bugün ${todayAppts.length} randevu${todayCompleted > 0 ? ` · ${todayCompleted} tamam` : ''}`}
            </p>
          </div>
        </div>
        <Link
          href="/klinik/panel/takvim"
          className="text-sm font-semibold px-3 py-1.5 rounded-lg border border-slate-600 hover:border-violet-500/50 hover:bg-violet-500/10 text-slate-300 hover:text-violet-300 transition-colors"
        >
          Takvim →
        </Link>
      </div>

      {/* İçerik */}
      <div className="p-4 sm:p-5 space-y-4">

        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            {/* ŞU AN AKIŞTA — en yüksek öncelik */}
            {inProgressAppts.length > 0 && (
              <Bolme
                icon="🟢"
                title="Şu an görüşmede"
                count={inProgressAppts.length}
                accent="violet"
              >
                {inProgressAppts.map(apt => (
                  <RandevuSatir key={apt.id} apt={apt} variant="in_progress" />
                ))}
              </Bolme>
            )}

            {/* ONAY BEKLEYEN — kabul/red butonları */}
            {pendingAppts.length > 0 && (
              <Bolme
                icon="⚠"
                title="Onay bekleyen"
                count={pendingAppts.length}
                accent="amber"
              >
                {pendingAppts.slice(0, 5).map(apt => (
                  <PendingSatir
                    key={apt.id}
                    apt={apt}
                    onConfirm={onConfirm}
                    onReject={onReject}
                  />
                ))}
                {pendingAppts.length > 5 && (
                  <Link
                    href="/klinik/panel/randevular?status=pending"
                    className="block text-center text-sm text-slate-500 hover:text-amber-300 py-1.5 transition-colors"
                  >
                    +{pendingAppts.length - 5} bekleyen daha →
                  </Link>
                )}
              </Bolme>
            )}

            {/* BUGÜN ONAYLI — hasta geldi butonları */}
            {todayConfirmed.length > 0 && (
              <Bolme
                icon="📅"
                title="Bugün onaylı randevular"
                count={todayConfirmed.length}
                accent="blue"
              >
                {todayConfirmed.map(apt => (
                  <RandevuSatir key={apt.id} apt={apt} variant="confirmed" />
                ))}
              </Bolme>
            )}

            {/* BUGÜN TAMAMLANAN — özet */}
            {todayCompleted > 0 && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-sm">
                  <span>✓</span>
                  <span className="text-emerald-300 font-semibold">
                    Bugün {todayCompleted} hasta tamamlandı
                  </span>
                </div>
                {todayCancelled > 0 && (
                  <span className="text-sm text-slate-500">{todayCancelled} iptal/gelmedi</span>
                )}
              </div>
            )}
          </>
        )}

        {/* Yarın özeti */}
        {tomorrowApptsCount > 0 && (
          <div className="pt-2 mt-2 border-t border-slate-700/40 flex items-center justify-between text-sm">
            <span className="text-slate-500">🌅 Yarın {tomorrowApptsCount} randevu</span>
            <Link
              href="/klinik/panel/takvim"
              className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
            >
              Takvime bak →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-bileşenler ────────────────────────────────────────────────

function Bolme({
  icon, title, count, accent, children,
}: {
  icon: string
  title: string
  count: number
  accent: 'violet' | 'amber' | 'blue'
  children: React.ReactNode
}) {
  const accentMap = {
    violet: 'text-violet-300',
    amber: 'text-amber-300',
    blue:  'text-blue-300',
  }
  return (
    <div>
      <div className={`flex items-center gap-1.5 mb-2 ${accentMap[accent]} text-sm font-bold uppercase tracking-wider`}>
        <span>{icon}</span>
        <span>{title}</span>
        <span className="text-slate-600 font-normal normal-case tracking-normal">· {count}</span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function RandevuSatir({ apt, variant }: { apt: ApptView; variant: 'in_progress' | 'confirmed' }) {
  const cta = variant === 'in_progress' ? 'Akışı sürdür' : 'Hasta geldi'
  const ctaColor = variant === 'in_progress'
    ? 'bg-violet-600 hover:bg-violet-500 text-white'
    : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30'

  return (
    <Link
      href={`/klinik/panel/randevu/${apt.id}`}
      className="group flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 hover:border-violet-500/40 transition-colors"
    >
      <div className="text-slate-300 font-mono text-sm font-bold w-14 shrink-0">
        {formatTime(apt.time)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{apt.patientName}</p>
        {variant === 'in_progress' && (
          <p className="text-violet-400/70 text-sm uppercase tracking-wide mt-0.5">Görüşmede</p>
        )}
      </div>
      <span className={`text-sm font-bold px-3 py-1.5 rounded-lg shrink-0 transition-all ${ctaColor}`}>
        {cta} →
      </span>
    </Link>
  )
}

function PendingSatir({
  apt, onConfirm, onReject,
}: {
  apt: ApptView
  onConfirm: (id: string) => Promise<{ ok: boolean; error?: string }>
  onReject: (id: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [hidden, setHidden] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (hidden) return null

  function doAction(action: 'confirm' | 'reject') {
    setErr(null)
    startTransition(async () => {
      const fn = action === 'confirm' ? onConfirm : onReject
      const res = await fn(apt.id)
      if (res.ok) {
        setHidden(true)
        router.refresh()
      } else {
        setErr(res.error ?? 'İşlem başarısız')
      }
    })
  }

  return (
    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-amber-300 font-mono text-sm font-bold w-20 shrink-0 truncate">
          {formatRelativeDate(apt.time)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{apt.patientName}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => doAction('confirm')}
            disabled={isPending}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-bold transition-colors"
          >
            {isPending ? '…' : '✓ Onayla'}
          </button>
          <button
            type="button"
            onClick={() => doAction('reject')}
            disabled={isPending}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 disabled:opacity-40 text-slate-400 hover:text-red-400 text-sm font-bold transition-colors border border-slate-700"
            title="Reddet"
          >
            ✕
          </button>
          <Link
            href={`/klinik/panel/randevu/${apt.id}`}
            className="px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-300 text-sm transition-colors"
            title="Detay"
          >
            ⋯
          </Link>
        </div>
      </div>
      {err && <p className="text-red-400 text-sm mt-1.5">{err}</p>}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="py-8 text-center">
      <div className="text-3xl opacity-50 mb-2">☕</div>
      <p className="text-slate-300 font-medium text-sm mb-1">Aksiyon yok — kahve molası</p>
      <p className="text-slate-500 text-sm">Bugün için onay bekleyen ya da akışta randevu yok.</p>
    </div>
  )
}
