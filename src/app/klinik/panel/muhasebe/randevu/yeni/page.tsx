export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner } from '@/lib/muhasebe-owner'
import YeniRandevuForm from './YeniRandevuForm'

export const metadata: Metadata = {
  title: 'Yeni Randevu | Muhasebe',
  robots: { index: false, follow: false },
}

export default async function YeniRandevuPage({
  searchParams,
}: { searchParams: { date?: string; time?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if (!isMuhasebeOwner(user.id)) redirect('/klinik/panel')

  const initialDate = typeof searchParams.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date) ? searchParams.date : undefined
  const initialTime = typeof searchParams.time === 'string' && /^\d{2}:\d{2}$/.test(searchParams.time) ? searchParams.time : undefined

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/klinik/panel" className="hover:text-white transition-colors">Klinik Panel</Link>
          <span>›</span>
          <Link href="/klinik/panel/muhasebe" className="hover:text-white transition-colors">Muhasebe</Link>
          <span>›</span>
          <span className="text-slate-300">Yeni Randevu</span>
        </nav>
        <h1 className="text-2xl font-black text-white">Yeni Randevu</h1>
        <p className="text-slate-400 mt-0.5 text-sm">
          Manuel randevu kaydı. Tekrarlayan seçilirse sistem ek randevuları otomatik üretir.
        </p>
      </div>

      <YeniRandevuForm initialDate={initialDate} initialTime={initialTime} />
    </div>
  )
}
