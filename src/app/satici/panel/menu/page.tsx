export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Truck, Wallet, FileBadge2, Store, CreditCard, BarChart3, MessageCircleQuestion,
  Star, User, LifeBuoy, LogOut, Home, ChevronRight, FileText,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Menü',
}

/**
 * EsteStorePRO app için "Menü" sayfası — SaticiBottomNav'ın 5. sekmesi buraya gider.
 *
 * Web'de sidebar var, app'te sidebar gizli (SaticiSidebar isApp guard'ı); bu sayfa
 * sidebar'ın içeriğini tam mobil layout ile sunar. Çıkış burada görünür.
 */
export default async function SaticiPanelMenuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name, approval_status, kyc_status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!vendor) redirect('/satici/basvur')

  const kycLabel =
    vendor.kyc_status === 'approved' ? 'KYC onaylı' :
    vendor.kyc_status === 'pending' ? 'KYC incelemede' :
    vendor.kyc_status === 'rejected' ? 'KYC reddedildi' :
                                       'KYC eksik'

  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      {/* Vendor kimliği */}
      <header className="px-5 pt-4 pb-3 border-b border-slate-800/60">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-400/80">İş Ortağı</p>
        <h1 className="mt-1 text-xl font-bold truncate">{vendor.company_name ?? 'İş Ortağı'}</h1>
        <p className="mt-1 text-sm text-slate-400">{kycLabel}</p>
      </header>

      {/* GRUP 1 — Operasyon */}
      <Group title="Operasyon">
        <Item href="/satici/panel/kargo" Icon={Truck} label="Kargo" />
        <Item href="/satici/panel/sorular" Icon={MessageCircleQuestion} label="Sorular" />
        <Item href="/satici/panel/yorumlar" Icon={Star} label="Yorumlar" />
        <Item href="/satici/panel/performans" Icon={BarChart3} label="Performans" />
      </Group>

      {/* GRUP 2 — İş Hesabı */}
      <Group title="İş Hesabı">
        <Item href="/satici/panel/kazanc" Icon={Wallet} label="Kazanç" />
        <Item href="/satici/panel/odeme-hesabi" Icon={CreditCard} label="Ödeme Hesabı" />
        <Item href="/satici/panel/kyc" Icon={FileBadge2} label="KYC / Belgeler" />
        <Item href="/satici/panel/magaza" Icon={Store} label="Mağaza" />
        <Item href="/satici/panel/hesabim" Icon={User} label="Hesabım" />
      </Group>

      {/* GRUP 3 — Yardım */}
      <Group title="Yardım">
        <Item href="/satici/panel" Icon={Home} label="Anasayfa (Panel)" />
        <Item href="/satici/panel/destek" Icon={LifeBuoy} label="Destek" />
      </Group>

      {/* Çıkış */}
      <section className="mt-6 px-5">
        <form action="/api/auth/sign-out" method="post">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/5 px-4 py-3.5 text-rose-300 active:bg-rose-500/10 transition text-sm font-medium"
          >
            <LogOut size={16} />
            Çıkış yap
          </button>
        </form>
        <p className="mt-3 text-center text-[10px] text-slate-600">
          v{(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? 'dev').slice(0, 7)} · EsteStorePRO
        </p>
      </section>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 px-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2">{title}</p>
      <ul className="rounded-2xl border border-slate-800 bg-slate-900/40 divide-y divide-slate-800/60 overflow-hidden">
        {children}
      </ul>
    </section>
  )
}

function Item({ href, Icon, label }: { href: string; Icon: typeof FileText; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 px-4 py-3.5 active:bg-slate-900 transition"
      >
        <Icon size={18} className="text-slate-300 shrink-0" />
        <span className="flex-1 text-sm font-medium text-white truncate">{label}</span>
        <ChevronRight size={16} className="text-slate-600" />
      </Link>
    </li>
  )
}
