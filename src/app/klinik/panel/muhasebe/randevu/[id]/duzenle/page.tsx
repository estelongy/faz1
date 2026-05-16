export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner } from '@/lib/muhasebe-owner'
import { normalizeWeek, type DayAvailability } from '../../slot-utils'
import RandevuEditForm from './RandevuEditForm'

export const metadata: Metadata = {
  title: 'Randevu Düzenle | Muhasebe',
  robots: { index: false, follow: false },
}

export default async function RandevuEditPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if (!isMuhasebeOwner(user.id)) redirect('/klinik/panel')

  const { data: appt } = await supabase
    .from('internal_appointment')
    .select('id, patient_id, start_at, duration_minutes, appointment_type, treatment_type, reason, detail, status, recurrence_group_id')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!appt) notFound()

  const [patientRes, availabilityRes] = await Promise.all([
    supabase.from('internal_patient').select('name, phone').eq('id', appt.patient_id).maybeSingle(),
    supabase.from('internal_availability').select('day_of_week, open_time, close_time, is_closed').eq('owner_id', user.id),
  ])
  const patient = patientRes.data
  const week = normalizeWeek((availabilityRes.data ?? []) as Partial<DayAvailability>[])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/klinik/panel" className="hover:text-white transition-colors">Klinik Panel</Link>
          <span>›</span>
          <Link href="/klinik/panel/muhasebe" className="hover:text-white transition-colors">Muhasebe</Link>
          <span>›</span>
          <Link href="/klinik/panel/muhasebe/randevu" className="hover:text-white transition-colors">Randevular</Link>
          <span>›</span>
          <span className="text-slate-300">Düzenle</span>
        </nav>
        <h1 className="text-2xl font-black text-white">Randevu Düzenle</h1>
        <p className="text-slate-400 mt-0.5 text-sm">
          <span className="text-white font-semibold">{patient?.name ?? '—'}</span>
          {patient?.phone && <span className="ml-2 text-slate-500">{patient.phone}</span>}
          {appt.recurrence_group_id && (
            <span className="ml-2 text-violet-400">↻ tekrarlayan serinin parçası</span>
          )}
        </p>
      </div>

      <RandevuEditForm appointment={appt} week={week} />
    </div>
  )
}
