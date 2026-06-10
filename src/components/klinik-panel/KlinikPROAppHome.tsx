import Link from 'next/link'
import { Calendar, ClipboardCheck, Users, MessageCircle, CreditCard, BarChart3, ShoppingBag, Clock, ChevronRight } from 'lucide-react'
import type { OnboardingStatus } from '@/lib/clinic-onboarding'

interface AppointmentLite {
  id: string
  time: string | null
  patientName: string
  status: string
}

interface Props {
  greeting: string
  hekimTitle: string
  hekimFirstName: string
  clinicName: string
  totalCredit: number
  todayAppts: AppointmentLite[]
  pendingCount: number
  inProgressCount: number
  tomorrowApptsCount: number
  onboarding?: OnboardingStatus
}

/**
 * EsteKlinikPRO app için /klinik/panel ev ekranı — mobil-first.
 *
 * Web dashboard (KlinikPanelDashboard) masaüstü 7xl ızgaralı.
 * Bu sürüm: dikey akış, büyük dokunma alanları, status bar / safe-area + bottom-nav
 * boşluğu hesaplı padding, çıkış görünür yerde (top bar değil burada da var).
 *
 * Render edilme yeri: src/app/klinik/panel/page.tsx → flavor === 'esteklinikpro' ise.
 * Aksi halde mevcut KlinikPanelDashboard (web) render edilir.
 */
export default function KlinikPROAppHome({
  greeting,
  hekimTitle,
  hekimFirstName,
  clinicName,
  totalCredit,
  todayAppts,
  pendingCount,
  inProgressCount,
  tomorrowApptsCount,
  onboarding,
}: Props) {
  const showOnboarding = onboarding && !onboarding.isComplete && onboarding.nextStep
  const progressPct = onboarding ? Math.round((onboarding.completedCount / onboarding.totalCount) * 100) : 0
  return (
    <div
      // -m-4 lg:-m-8: panel layout'unun main p-4/p-8'ini iptal ederek full-bleed
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{
        // NativeTopBar + safe-area zaten layout'ta var; burada ek alt boşluk
        // KlinikBottomNav için (60 + safe-area-bottom)
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
      }}
    >
      {/* Karşılama */}
      <header className="px-5 pt-4 pb-3">
        <p className="text-xs uppercase tracking-[0.18em] text-emerald-400/80">{clinicName}</p>
        <h1 className="mt-1 text-2xl font-bold leading-tight">
          {greeting},<br />
          <span className="text-emerald-300">{hekimTitle} {hekimFirstName}</span>
        </h1>
      </header>

      {/* Onboarding kompakt banner — kalan adım varsa */}
      {showOnboarding && onboarding && onboarding.nextStep && (
        <section className="px-5 mb-3">
          <Link
            href={onboarding.nextStep.ctaHref}
            className="block rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/15 to-purple-500/10 px-4 py-3.5 active:from-violet-500/25 active:to-purple-500/15 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center shrink-0 text-violet-200 font-bold text-sm tabular-nums">
                {onboarding.completedCount}/{onboarding.totalCount}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">
                  Sıradaki: {onboarding.nextStep.title}
                </p>
                <p className="mt-0.5 text-xs text-violet-200/80 truncate">
                  {onboarding.nextStep.rewardEmoji} {onboarding.nextStep.reward}
                </p>
              </div>
              <ChevronRight size={18} className="text-violet-300 shrink-0" />
            </div>
            <div className="mt-2.5 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </Link>
        </section>
      )}

      {/* Çekirdek aksiyon — Müsaitlik aç. Hekim sabah app'i açar, ilk niyet:
          "bugün/yarın boş saatlerimi düzenle". En sık aksiyon → en görünür yer. */}
      <div className="px-5 mb-3">
        <Link
          href="/klinik/panel/musaitlik"
          className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 px-4 py-3.5 active:from-emerald-500/30 active:to-emerald-500/15 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Clock size={20} className="text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-base leading-tight">Müsaitlik aç / kapa</p>
            <p className="text-xs text-emerald-300/80 mt-0.5">Bugün / yarın boş saatlerini düzenle</p>
          </div>
          <span className="text-emerald-300">→</span>
        </Link>
      </div>

      {/* Üst hızlı durum şeridi — kredi + EsteStore kapısı */}
      <div className="px-5 grid grid-cols-2 gap-2.5">
        <Link
          href="/klinik/panel/kredi"
          className="flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 active:bg-emerald-500/20 transition"
        >
          <CreditCard size={18} className="text-emerald-300 shrink-0" />
          <div className="min-w-0">
            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Kredi</p>
            <p className="text-white font-bold text-base leading-tight truncate">{totalCredit}</p>
          </div>
        </Link>
        <Link
          href="/estestore"
          className="flex items-center gap-2 rounded-2xl border border-violet-500/25 bg-violet-500/10 px-4 py-3 active:bg-violet-500/20 transition"
        >
          <ShoppingBag size={18} className="text-violet-300 shrink-0" />
          <div className="min-w-0">
            <p className="text-violet-400 text-[10px] font-bold uppercase tracking-wider">Mağaza</p>
            <p className="text-white font-bold text-base leading-tight truncate">EsteStore</p>
          </div>
        </Link>
      </div>

      {/* ŞİMDİ — bekleyen + akıştaki rakamları büyük göster */}
      <section className="mt-5 px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2">Şimdi</p>
        <Link
          href="/klinik/panel/takvim"
          className="block rounded-2xl border border-slate-800 bg-slate-900/60 p-4 active:bg-slate-900 transition"
        >
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Bugün" value={todayAppts.length} accent="text-white" />
            <Stat label="Bekleyen" value={pendingCount} accent={pendingCount > 0 ? 'text-amber-300' : 'text-white'} />
            <Stat label="Akışta" value={inProgressCount} accent={inProgressCount > 0 ? 'text-emerald-300' : 'text-white'} />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Yarın {tomorrowApptsCount} randevu · Randevuları aç →
          </p>
        </Link>
      </section>

      {/* Bugün — kart listesi */}
      <section className="mt-5 px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2">Bugünün Akışı</p>
        {todayAppts.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-center">
            <Calendar size={28} className="mx-auto text-slate-600" />
            <p className="mt-2 text-sm text-slate-400">Bugün randevu yok.</p>
            <Link
              href="/klinik/panel/musaitlik"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 active:text-emerald-200"
            >
              <Clock size={13} />
              Müsaitlik saatlerini kontrol et →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {todayAppts.slice(0, 4).map((a) => (
              <li key={a.id}>
                <Link
                  href={`/klinik/panel/takvim`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 active:bg-slate-900 transition"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
                    <ClipboardCheck size={20} className="text-emerald-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{a.patientName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatTime(a.time)} · {statusLabel(a.status)}
                    </p>
                  </div>
                  <span className="text-slate-500">→</span>
                </Link>
              </li>
            ))}
            {todayAppts.length > 4 && (
              <li>
                <Link
                  href="/klinik/panel/takvim"
                  className="block text-center text-xs font-medium text-emerald-400 py-2 active:text-emerald-300"
                >
                  +{todayAppts.length - 4} randevu — tümünü göster
                </Link>
              </li>
            )}
          </ul>
        )}
      </section>

      {/* Hızlı eylemler */}
      <section className="mt-5 px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2">Hızlı Erişim</p>
        <div className="grid grid-cols-2 gap-2.5">
          <QuickAction href="/klinik/panel/hastalarim" Icon={Users} label="Hastalarım" />
          <QuickAction href="/klinik/panel/mesajlar" Icon={MessageCircle} label="Mesajlar" />
          <QuickAction href="/klinik/panel/musaitlik" Icon={Calendar} label="Müsaitlik" />
          <QuickAction href="/klinik/panel/rapor" Icon={BarChart3} label="Rapor" />
        </div>
      </section>

    </div>
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

function QuickAction({
  href,
  Icon,
  label,
}: {
  href: string
  Icon: typeof Users
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3.5 active:bg-slate-900 transition"
    >
      <Icon size={18} className="text-slate-300 shrink-0" />
      <span className="text-sm font-medium text-white">{label}</span>
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
