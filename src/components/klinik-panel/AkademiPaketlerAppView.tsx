import Link from 'next/link'
import { ChevronRight, Plus, GraduationCap } from 'lucide-react'
import { formatDuration, formatPrice, LEVEL_LABELS, AKADEMI_KATEGORILER } from '@/lib/akademi'
import type { CoursePackage } from '@/lib/akademi'

interface Props {
  isEducator: boolean
  packages: CoursePackage[]
  totalEarnings: number
  totalSales: number
}

export default function AkademiPaketlerAppView({
  isEducator,
  packages,
  totalEarnings,
  totalSales,
}: Props) {
  if (!isEducator) {
    return (
      <Shell>
        <div className="px-5 pt-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-3">
              <GraduationCap size={26} className="text-emerald-300" />
            </div>
            <p className="text-white font-bold">Eğitmen yetkin yok</p>
            <p className="text-sm text-slate-400 mt-2">
              Önce eğitmenlik başvurusu yapmalısın.
            </p>
            <Link
              href="/klinik/panel/akademi/basvur"
              className="inline-flex items-center mt-4 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold active:bg-emerald-400 transition"
            >
              Başvuruya Git →
            </Link>
          </div>
        </div>
      </Shell>
    )
  }

  const published = packages.filter((p) => p.is_published)
  const drafts = packages.filter((p) => !p.is_published)

  return (
    <Shell>
      {/* Yeni paket CTA */}
      <div className="px-5 pt-4">
        <Link
          href="/klinik/panel/akademi/paketler/yeni"
          className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3.5 text-emerald-200 text-sm font-bold active:bg-emerald-500/20 transition"
        >
          <Plus size={16} /> Yeni Paket
        </Link>
      </div>

      {/* Özet */}
      <section className="px-5 mt-4 grid grid-cols-3 gap-2">
        <Stat label="Yayında" value={`${published.length}`} accent="text-emerald-300" />
        <Stat label="Satış" value={`${totalSales}`} accent="text-white" />
        <Stat
          label="Kazanç"
          value={formatPrice(totalEarnings)}
          accent="text-emerald-300"
        />
      </section>

      {packages.length === 0 ? (
        <section className="px-5 mt-5">
          <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center">
            <div className="text-3xl mb-2">📹</div>
            <p className="text-white font-bold">Henüz paket yok</p>
            <p className="text-slate-400 text-sm mt-1">
              İlk video paketini oluştur. %70 gelir payı senin.
            </p>
          </div>
        </section>
      ) : (
        <>
          {published.length > 0 && (
            <Section title={`Yayında · ${published.length}`} dot="bg-emerald-400">
              {published.map((p) => (
                <PackageCard key={p.id} pkg={p} />
              ))}
            </Section>
          )}
          {drafts.length > 0 && (
            <Section title={`Taslak · ${drafts.length}`} dot="bg-amber-400">
              {drafts.map((p) => (
                <PackageCard key={p.id} pkg={p} />
              ))}
            </Section>
          )}
        </>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      {children}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-center">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-black tabular-nums ${accent}`}>{value}</p>
    </div>
  )
}

function Section({
  title,
  dot,
  children,
}: {
  title: string
  dot: string
  children: React.ReactNode
}) {
  return (
    <section className="px-5 mt-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2 flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function PackageCard({ pkg }: { pkg: CoursePackage }) {
  const categoryLabel = AKADEMI_KATEGORILER.find((c) => c.value === pkg.category)?.label
  return (
    <Link
      href={`/klinik/panel/akademi/paketler/${pkg.id}`}
      className="block rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 active:bg-slate-900 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-sm truncate">{pkg.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {categoryLabel && <>{categoryLabel} · </>}
            {LEVEL_LABELS[pkg.level]}
          </p>
        </div>
        <p className="text-emerald-300 font-bold text-sm shrink-0">
          {formatPrice(pkg.price, pkg.currency)}
        </p>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
        <span>
          📹 {pkg.total_videos}
          {pkg.total_duration_seconds > 0 && (
            <> · ⏱️ {formatDuration(pkg.total_duration_seconds)}</>
          )}
        </span>
        <span className="flex items-center gap-1">
          🛒 {pkg.total_purchases}
          <ChevronRight size={14} className="text-slate-600" />
        </span>
      </div>
    </Link>
  )
}
