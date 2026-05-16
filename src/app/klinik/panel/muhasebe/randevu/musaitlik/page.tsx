export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner } from '@/lib/muhasebe-owner'
import { normalizeWeek, type DayAvailability } from '../slot-utils'
import MusaitlikForm from './MusaitlikForm'

export const metadata: Metadata = {
  title: 'Müsaitlik | Muhasebe Randevu',
  robots: { index: false, follow: false },
}

export default async function MusaitlikPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if (!isMuhasebeOwner(user.id)) redirect('/klinik/panel')

  const { data } = await supabase
    .from('internal_availability')
    .select('day_of_week, open_time, close_time, is_closed')
    .eq('owner_id', user.id)
    .order('day_of_week', { ascending: true })

  const week = normalizeWeek((data ?? []) as Partial<DayAvailability>[])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/klinik/panel" className="hover:text-white transition-colors">Klinik Panel</Link>
          <span>›</span>
          <Link href="/klinik/panel/muhasebe" className="hover:text-white transition-colors">Muhasebe</Link>
          <span>›</span>
          <Link href="/klinik/panel/muhasebe/randevu" className="hover:text-white transition-colors">Randevular</Link>
          <span>›</span>
          <span className="text-slate-300">Müsaitlik</span>
        </nav>
        <h1 className="text-2xl font-black text-white">Müsaitlik Ayarları</h1>
        <p className="text-slate-400 mt-0.5 text-sm">
          Haftanın günlerinde özel pratik çalışma saatlerin. Marketplace klinik müsaitliğinden bağımsız.
        </p>
      </div>

      <MusaitlikForm week={week} />
    </div>
  )
}
