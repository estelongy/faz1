export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner } from '@/lib/muhasebe-owner'
import { type AppointmentRow } from './RandevuListClient'
import RandevuTabsClient from './RandevuTabsClient'
import { normalizeWeek, type DayAvailability } from './slot-utils'

export const metadata: Metadata = {
  title: 'Randevular | Muhasebe',
  robots: { index: false, follow: false },
}

export default async function RandevuListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if (!isMuhasebeOwner(user.id)) redirect('/klinik/panel')

  const [apptRes, patientRes, availabilityRes] = await Promise.all([
    supabase
      .from('internal_appointment')
      .select('id, patient_id, start_at, duration_minutes, appointment_type, treatment_type, reason, detail, status, recurrence_group_id')
      .eq('owner_id', user.id)
      .order('start_at', { ascending: true }),
    supabase
      .from('internal_patient')
      .select('id, name, phone')
      .eq('owner_id', user.id),
    supabase
      .from('internal_availability')
      .select('day_of_week, open_time, close_time, is_closed, slot_duration_minutes')
      .eq('owner_id', user.id),
  ])
  const week = normalizeWeek((availabilityRes.data ?? []) as Partial<DayAvailability>[])

  const patients = patientRes.data ?? []
  const patientMap = new Map(patients.map(p => [p.id, p]))
  const rows: AppointmentRow[] = (apptRes.data ?? []).map(a => {
    const p = patientMap.get(a.patient_id)
    return {
      id: a.id,
      patient_id: a.patient_id,
      patient_name: p?.name ?? '—',
      patient_phone: p?.phone ?? null,
      start_at: a.start_at,
      duration_minutes: a.duration_minutes,
      appointment_type: a.appointment_type,
      treatment_type: a.treatment_type,
      reason: a.reason,
      detail: a.detail,
      status: a.status,
      recurrence_group_id: a.recurrence_group_id,
    }
  })

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link href="/klinik/panel" className="hover:text-white transition-colors">Klinik Panel</Link>
            <span>›</span>
            <Link href="/klinik/panel/muhasebe" className="hover:text-white transition-colors">Muhasebe</Link>
            <span>›</span>
            <span className="text-slate-300">Randevular</span>
          </nav>
          <h1 className="text-2xl font-black text-white">Randevular</h1>
          <p className="text-slate-400 mt-0.5 text-sm">
            {rows.length} kayıt — yaklaşan, tamamlanan ve iptal randevu yönetimi.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/klinik/panel/muhasebe/randevu/musaitlik"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-xl"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Müsaitlik
          </Link>
          <Link
            href="/klinik/panel/muhasebe/randevu/yeni"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-base font-bold rounded-xl shadow-lg shadow-violet-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" />
            </svg>
            Yeni Randevu
          </Link>
        </div>
      </div>

      <RandevuTabsClient rows={rows} week={week} />
    </div>
  )
}
