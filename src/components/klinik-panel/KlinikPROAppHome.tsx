import Link from 'next/link'
import {
  Users, MessageCircle, CreditCard, Clock, ChevronRight,
  Star, ShoppingBag, Sparkles, Activity,
} from 'lucide-react'
import type { OnboardingStatus } from '@/lib/clinic-onboarding'
import { MIN_REVIEWS_THRESHOLD } from '@/lib/clinic-review'
import BugunCizelgesi from './BugunCizelgesi'

type ActionResult = { ok: boolean; error?: string }

interface AppointmentLite {
  id: string
  time: string | null
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

interface Props {
  greeting: string
  hekimTitle: string
  hekimFirstName: string
  clinicName: string
  totalCredit: number
  todayAppts: AppointmentLite[]
  clinicEgp: number | null
  reviewCount: number
  onboarding?: OnboardingStatus
  weekSummary?: WeekDay[]
  todayIso: string
  dayOpenTime: string
  dayCloseTime: string
  dayStepMinutes: number
  onConfirmAppointment: (id: string) => Promise<ActionResult>
  onStartAppointment: (id: string) => Promise<ActionResult>
  onCompleteAppointment: (id: string) => Promise<ActionResult>
  onRejectAppointment: (id: string) => Promise<ActionResult>
}

/**
 * EsteKlinikPRO ev ekranı — mobil-first.
 *
 * Hiyerarşi (hekim sabah açar, ne öğrenmek ister?):
 *   1. Kimlik + EGP/ELS rozeti — kim olduğunu ve skorunu hatırlat
 *   2. Sıradaki hasta — şu an bekleyen aksiyon
 *   3. Bugün özet — Bugün/Bekleyen/Akışta
 *   4. Bugünün akışı — saat çizelgesi
 *   5. Hızlı erişim — Müsaitlik / Hastalar / Mesajlar / Yorumlar / Kredi / Mağaza
 *   6. Onboarding şeridi — eksikse, en altta kompakt
 */
export default function KlinikPROAppHome({
  greeting,
  hekimTitle,
  hekimFirstName,
  clinicName,
  totalCredit,
  todayAppts,
  clinicEgp,
  reviewCount,
  onboarding,
  weekSummary,
  todayIso,
  dayOpenTime,
  dayCloseTime,
  dayStepMinutes,
  onConfirmAppointment,
  onStartAppointment,
  onCompleteAppointment,
  onRejectAppointment,
}: Props) {
  const showOnboarding = onboarding && !onboarding.isComplete && onboarding.nextStep
  const progressPct = onboarding ? Math.round((onboarding.completedCount / onboarding.totalCount) * 100) : 0
  const els = computeELS(clinicEgp, reviewCount)

  // Sıradaki randevu: tamamlanmamış/iptal olmayan ilk randevu
  const nextAppt = todayAppts.find(a => a.status !== 'completed' && a.status !== 'cancelled') ?? null

  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      {/* ─── 1. Kimlik + EGP rozeti ─── */}
      <header className="px-5 pt-4 pb-3">
        <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-400/80 font-bold">{clinicName}</p>
        <h1 className="mt-1 text-2xl font-bold leading-tight">
          {greeting},<br />
          <span className="text-emerald-300">{hekimTitle} {hekimFirstName}</span>
        </h1>

        {/* EGP/ELS rozet şeridi */}
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5">
          <div className={`w-9 h-9 rounded-xl ${els.bgClass} ${els.borderClass} border flex items-center justify-center shrink-0`}>
            <els.Icon size={18} className={els.textClass} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold">{els.title}</p>
            <p className="text-sm font-bold text-white truncate">
              {els.scoreLabel} <span className="text-slate-500 font-normal">· {reviewCount} yorum</span>
            </p>
          </div>
          <Link
            href="/klinik/panel/rapor"
            className={`text-xs font-bold ${els.textClass} active:opacity-70`}
          >
            Detay →
          </Link>
        </div>
      </header>

      {/* ─── 2. Sıradaki randevu — günün ilk açık aksiyon ─── */}
      {nextAppt && (
        <section className="px-5 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2">Sıradaki</p>
          <Link
            href="/klinik/panel/takvim"
            className="block rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 p-4 active:from-emerald-500/30 active:to-emerald-500/10 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <Clock size={22} className="text-emerald-200" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-emerald-200 text-2xl font-black leading-none tabular-nums">
                  {formatTime(nextAppt.time)}
                </p>
                <p className="text-white font-semibold mt-1 truncate">{nextAppt.patientName}</p>
                <p className="text-xs text-emerald-300/80 mt-0.5">{statusLabel(nextAppt.status)}</p>
              </div>
              <ChevronRight size={18} className="text-emerald-300 shrink-0" />
            </div>
          </Link>
        </section>
      )}

      {/* ─── BUGÜN — Bu Hafta şeridi + saat çizelgesi (in-page gün seçici) ─── */}
      <BugunCizelgesi
        todayIso={todayIso}
        weekSummary={weekSummary ?? []}
        openTime={dayOpenTime}
        closeTime={dayCloseTime}
        stepMinutes={dayStepMinutes}
        onConfirm={onConfirmAppointment}
        onStart={onStartAppointment}
        onComplete={onCompleteAppointment}
        onReject={onRejectAppointment}
      />

      {/* ─── 5. Hızlı erişim ─── */}
      <section className="mt-5 px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2">Hızlı Erişim</p>
        <div className="grid grid-cols-3 gap-2.5">
          <QuickAction href="/klinik/panel/hastalarim" Icon={Users} label="Hastalar" />
          <QuickAction href="/klinik/panel/mesajlar" Icon={MessageCircle} label="Mesajlar" />
          <QuickAction href="/klinik/panel/yorumlar" Icon={Star} label="Yorumlar" />
          <QuickAction href="/klinik/panel/musaitlik" Icon={Clock} label="Müsaitlik" />
          <QuickAction
            href="/klinik/panel/kredi"
            Icon={CreditCard}
            label="Kredi"
            badge={totalCredit.toString()}
          />
          <QuickAction href="/estestore" Icon={ShoppingBag} label="Mağaza" />
        </div>
      </section>

      {/* ─── 6. Onboarding şeridi — eksikse, en altta kompakt ─── */}
      {showOnboarding && onboarding && onboarding.nextStep && (
        <section className="px-5 mt-5">
          <Link
            href={onboarding.nextStep.ctaHref}
            className="block rounded-2xl border border-violet-500/30 bg-violet-500/5 px-4 py-3 active:bg-violet-500/10 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-400/30 flex items-center justify-center shrink-0 text-violet-200 font-bold text-xs tabular-nums">
                {onboarding.completedCount}/{onboarding.totalCount}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-xs leading-tight truncate">
                  Sıradaki adım: {onboarding.nextStep.title}
                </p>
                <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
              <ChevronRight size={16} className="text-violet-300 shrink-0" />
            </div>
          </Link>
        </section>
      )}
    </div>
  )
}

interface ELSResult {
  title: string
  scoreLabel: string
  Icon: typeof Star
  bgClass: string
  borderClass: string
  textClass: string
}

function computeELS(egp: number | null, reviewCount: number): ELSResult {
  // Eşik altı → Ölçülüyor perdesi
  if (reviewCount < MIN_REVIEWS_THRESHOLD || egp == null) {
    return {
      title: 'Ölçülüyor',
      scoreLabel: `${reviewCount}/${MIN_REVIEWS_THRESHOLD} yorum`,
      Icon: Activity,
      bgClass: 'bg-slate-500/15',
      borderClass: 'border-slate-500/30',
      textClass: 'text-slate-300',
    }
  }
  // ELS kademesi: 9+ Platinum · 8+ Gold · 7+ Silver · <7 Bronze
  if (egp >= 9) {
    return {
      title: 'Platinum',
      scoreLabel: `EGP ${egp.toFixed(1)}`,
      Icon: Sparkles,
      bgClass: 'bg-cyan-400/15',
      borderClass: 'border-cyan-400/40',
      textClass: 'text-cyan-300',
    }
  }
  if (egp >= 8) {
    return {
      title: 'Gold',
      scoreLabel: `EGP ${egp.toFixed(1)}`,
      Icon: Star,
      bgClass: 'bg-amber-400/15',
      borderClass: 'border-amber-400/40',
      textClass: 'text-amber-300',
    }
  }
  if (egp >= 7) {
    return {
      title: 'Silver',
      scoreLabel: `EGP ${egp.toFixed(1)}`,
      Icon: Star,
      bgClass: 'bg-slate-300/15',
      borderClass: 'border-slate-300/40',
      textClass: 'text-slate-200',
    }
  }
  return {
    title: 'Bronze',
    scoreLabel: `EGP ${egp.toFixed(1)}`,
    Icon: Star,
    bgClass: 'bg-orange-500/15',
    borderClass: 'border-orange-500/40',
    textClass: 'text-orange-300',
  }
}

function QuickAction({
  href,
  Icon,
  label,
  badge,
}: {
  href: string
  Icon: typeof Users
  label: string
  badge?: string
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/60 px-2 py-3.5 active:bg-slate-900 transition"
    >
      <Icon size={20} className="text-slate-300" />
      <span className="text-xs font-medium text-white text-center leading-tight">{label}</span>
      {badge !== undefined && (
        <span className="absolute top-1.5 right-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 rounded-md px-1.5 py-0.5 tabular-nums">
          {badge}
        </span>
      )}
    </Link>
  )
}

function formatTime(iso: string | null): string {
  if (!iso) return '--:--'
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '--:--'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Onay bekliyor'
    case 'confirmed': return 'Onaylandı'
    case 'in_progress': return 'Akışta'
    case 'completed': return 'Tamamlandı'
    case 'cancelled': return 'İptal'
    default: return status
  }
}
