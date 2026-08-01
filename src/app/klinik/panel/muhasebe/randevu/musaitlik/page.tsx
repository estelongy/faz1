export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner, getMuhasebeOwnerProfile, clinicOwnerIdFor } from '@/lib/muhasebe-owner'
import { normalizeWeek, type DayAvailability } from '../slot-utils'
import MusaitlikForm from './MusaitlikForm'
import AutoConfirmCard from './AutoConfirmCard'
import { getServerFlavor } from '@/lib/server-flavor'
import MuhasebeMusaitlikAppView from '@/components/klinik-panel/MuhasebeMusaitlikAppView'

export const metadata: Metadata = {
  title: 'Müsaitlik | Muhasebe Randevu',
  robots: { index: false, follow: false },
}

export default async function MusaitlikPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if (!isMuhasebeOwner(user.id)) redirect('/klinik/panel')
  const clinicOwner = clinicOwnerIdFor(user.id) ?? user.id
  const ownerProfile = getMuhasebeOwnerProfile(user.id)

  const [{ data }, { data: clinicRow }] = await Promise.all([
    supabase
      .from('internal_availability')
      .select('day_of_week, open_time, close_time, is_closed, slot_duration_minutes')
      .eq('owner_id', clinicOwner)
      .order('day_of_week', { ascending: true }),
    supabase
      .from('clinics')
      .select('auto_confirm_appointments')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const week = normalizeWeek((data ?? []) as Partial<DayAvailability>[])
  const autoConfirm = clinicRow?.auto_confirm_appointments ?? true

  const flavor = await getServerFlavor()
  if (flavor === 'esteklinikpro') {
    return (
      <MuhasebeMusaitlikAppView week={week} doctorName={ownerProfile.displayName} autoConfirm={autoConfirm} />
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/klinik/panel/muhasebe/randevu" className="text-slate-400 hover:text-white transition-colors text-base font-semibold">← Takvim</Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Müsaitlik Takvimi</h1>
        <p className="text-slate-400 mt-0.5 text-sm">
          {ownerProfile.displayName} — Özel pratik için hangi günler ve saatlerde randevu kabul ettiğini belirle.
          Marketplace klinik müsaitliğinden bağımsız çalışır.
        </p>
      </div>

      <div className="mb-4">
        <AutoConfirmCard initial={autoConfirm} />
      </div>

      <MusaitlikForm week={week} />
    </div>
  )
}
