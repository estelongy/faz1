import Link from 'next/link'
import { CreditCard, ShieldCheck, Store, User } from 'lucide-react'
import HesabimClient from '@/app/satici/panel/hesabim/HesabimClient'

interface Props {
  email: string
  phone: string | null
  companyName: string
}

export default function HesabimAppView({ email, phone, companyName }: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-2">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-400/80 truncate">{companyName}</p>
        <p className="mt-1 text-sm text-slate-400">Hesap bilgileri & kestirme bağlantılar</p>
      </header>

      <section className="px-5 mt-3">
        <HesabimClient email={email} phone={phone} companyName={companyName} />
      </section>

      <section className="px-5 mt-5 space-y-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Kestirmeler</p>
        <LinkRow href="/satici/panel/kyc" Icon={ShieldCheck} label="KYC Bilgileri" />
        <LinkRow href="/satici/panel/odeme-hesabi" Icon={CreditCard} label="Ödeme Hesabı (Stripe)" />
        <LinkRow href="/satici/panel/magaza" Icon={Store} label="Mağaza Vitrini" />
        <LinkRow href="/satici/panel/performans" Icon={User} label="Performans Skoru" />
      </section>
    </div>
  )
}

function LinkRow({
  href, Icon, label,
}: { href: string; Icon: typeof User; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3.5 active:bg-slate-900 transition"
    >
      <Icon size={18} className="text-slate-300 shrink-0" />
      <span className="flex-1 text-sm font-medium text-white">{label}</span>
      <span className="text-slate-500">→</span>
    </Link>
  )
}
