export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner } from '@/lib/muhasebe-owner'
import {
  Calendar, Clock, BarChart3, CreditCard, ShoppingBag, FileText, MessageCircleQuestion,
  Users2, GraduationCap, Wallet, User, LifeBuoy, LogOut, Home, ChevronRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Menü',
}

/**
 * EsteKlinikPRO app için "Menü" sayfası — KlinikBottomNav'ın 5. sekmesi buraya gider.
 *
 * Web'de sidebar var, app'te sidebar gizli (KlinikSidebar isApp guard'ı); bu sayfa
 * sidebar'ın içeriğini tam mobil layout ile sunar. Çıkış burada görünür.
 */
export default async function KlinikPanelMenuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, credit_balance, free_appointments_remaining, is_educator')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!clinic) redirect('/esteklinik/basvur')

  const isEducator = clinic.is_educator ?? false
  const showMuhasebe = isMuhasebeOwner(user.id)
  const totalCredit = (clinic.credit_balance ?? 0) + (clinic.free_appointments_remaining ?? 0)

  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      {/* Klinik kimliği */}
      <header className="px-5 pt-4 pb-3 border-b border-slate-800/60">
        <p className="text-xs uppercase tracking-[0.18em] text-emerald-400/80">Klinik</p>
        <h1 className="mt-1 text-xl font-bold truncate">{clinic.name}</h1>
        <p className="mt-1 text-sm text-slate-400">{totalCredit} kredi</p>
      </header>

      {/* GRUP 1 — İşlem */}
      <Group title="İşlem">
        <Item href="/klinik/panel/takvim" Icon={Calendar} label="Takvim" />
        <Item href="/klinik/panel/musaitlik" Icon={Clock} label="Müsaitlik" />
        <Item href="/klinik/panel/yorumlar" Icon={MessageCircleQuestion} label="Yorumlar" />
        <Item href="/klinik/panel/rapor" Icon={BarChart3} label="Rapor" />
      </Group>

      {/* GRUP 2 — Klinik */}
      <Group title="Klinik">
        <Item href="/klinik/panel/profil" Icon={User} label="Klinik Profilim" />
        <Item href="/klinik/panel/kredi" Icon={CreditCard} label="Krediler" />
        {showMuhasebe && (
          <Item href="/klinik/panel/muhasebe" Icon={Wallet} label="Muhasebe" />
        )}
      </Group>

      {/* GRUP 3 — Estelongy Topluluk */}
      <Group title="Estelongy Topluluk">
        <Item href="/klinik/panel/topluluk" Icon={Users2} label="Topluluk" />
        <Item
          href={isEducator ? '/klinik/panel/akademi/paketler' : '/klinik/panel/akademi/basvur'}
          Icon={GraduationCap}
          label={isEducator ? 'Eğitmen Paneli' : 'Eğitmen Ol'}
        />
        <Item href="/estestore" Icon={ShoppingBag} label="EsteStore (klinik fiyatlı)" />
      </Group>

      {/* GRUP 4 — Yardım */}
      <Group title="Yardım">
        <Item href="/klinik/panel/destek" Icon={LifeBuoy} label="Destek" />
        <Item href="/panel" Icon={Home} label="Hasta Paneline Geç" />
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
          v{(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? 'dev').slice(0, 7)} · EsteKlinikPRO
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
