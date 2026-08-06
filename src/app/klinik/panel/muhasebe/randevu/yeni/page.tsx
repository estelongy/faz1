export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner, getMuhasebeOwnerProfile, clinicOwnerIdFor } from '@/lib/muhasebe-owner'
import { normalizeWeek, type DayAvailability } from '../slot-utils'
import YeniRandevuForm from './YeniRandevuForm'
import { getServerFlavor } from '@/lib/server-flavor'
import MuhasebeRandevuYeniAppView from '@/components/klinik-panel/MuhasebeRandevuYeniAppView'

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
  const clinicOwner = clinicOwnerIdFor(user.id) ?? user.id
  const ownerProfile = getMuhasebeOwnerProfile(user.id)

  const initialDate = typeof searchParams.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date) ? searchParams.date : undefined
  const initialTime = typeof searchParams.time === 'string' && /^\d{2}:\d{2}$/.test(searchParams.time) ? searchParams.time : undefined

  const { data: availabilityRows } = await supabase
    .from('internal_availability')
    .select('day_of_week, open_time, close_time, is_closed, slot_duration_minutes')
    .eq('owner_id', clinicOwner)
  const week = normalizeWeek((availabilityRows ?? []) as Partial<DayAvailability>[])

  const flavor = await getServerFlavor()
  if (flavor === 'esteklinikpro') {
    return (
      <MuhasebeRandevuYeniAppView
        initialDate={initialDate}
        initialTime={initialTime}
        week={week}
        doctorName={ownerProfile.displayName}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/klinik/panel/muhasebe"
          className="inline-flex items-center gap-1.5 px-3 py-2 mb-2 rounded-lg text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors">
          🏠 Ana Sayfa
        </Link>
        <h1 className="text-2xl font-black text-white">Yeni Randevu</h1>
        <p className="text-slate-400 mt-0.5 text-sm">
          Manuel randevu kaydı. Tekrarlayan seçilirse sistem ek randevuları otomatik üretir.
        </p>
      </div>

      <YeniRandevuForm initialDate={initialDate} initialTime={initialTime} week={week} doctorName={ownerProfile.displayName} />
    </div>
  )
}
