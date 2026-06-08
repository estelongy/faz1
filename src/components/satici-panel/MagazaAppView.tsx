import Link from 'next/link'
import MagazaEditor from '@/app/satici/panel/magaza/MagazaEditor'

interface Props {
  vendorId: string
  companyName: string
  initial: {
    logo_url: string | null
    banner_url: string | null
    tagline: string
    about_text: string
    social_links: Record<string, string>
  }
}

export default function MagazaAppView({ vendorId, companyName, initial }: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-400/80 truncate">{companyName}</p>
          <p className="mt-1 text-sm text-slate-400">Vitrin görünümü ve markan</p>
        </div>
        <Link
          href={`/estestore/satici/${vendorId}`}
          target="_blank"
          className="shrink-0 px-3 py-1.5 rounded-lg border border-amber-400/40 text-amber-300 text-xs font-bold active:bg-amber-500/10"
        >
          Önizle ↗
        </Link>
      </header>

      <section className="px-5 mt-2">
        <MagazaEditor
          vendorId={vendorId}
          companyName={companyName}
          initial={initial}
        />
      </section>
    </div>
  )
}
