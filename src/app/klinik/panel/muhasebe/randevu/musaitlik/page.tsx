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
    .select('day_of_week, open_time, close_time, is_closed, slot_duration_minutes')
    .eq('owner_id', user.id)
    .order('day_of_week', { ascending: true })

  const week = normalizeWeek((data ?? []) as Partial<DayAvailability>[])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/klinik/panel/muhasebe/randevu" className="text-slate-400 hover:text-white transition-colors text-base font-semibold">← Takvim</Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Müsaitlik Takvimi</h1>
        <p className="text-slate-400 mt-0.5 text-sm">
          Dr. İzzet GÖK — Özel pratik için hangi günler ve saatlerde randevu kabul ettiğini belirle.
          Marketplace klinik müsaitliğinden bağımsız çalışır.
        </p>
      </div>

      <MusaitlikForm week={week} />
    </div>
  )
}
