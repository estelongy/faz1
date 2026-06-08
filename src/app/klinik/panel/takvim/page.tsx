export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import KlinikTakvimClient from './KlinikTakvimClient'
import { getServerFlavor } from '@/lib/server-flavor'
import TakvimAppView from '@/components/klinik-panel/TakvimAppView'

// ── Server Actions ─────────────────────────────────────────────
async function confirmAction(apptId: string): Promise<{ ok: boolean; error?: string }> {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }
  const { data: clinic } = await supabase.from('clinics').select('id').eq('user_id', user.id).single()
  if (!clinic) return { ok: false, error: 'Klinik bulunamadı' }
  const { error } = await supabase.from('appointments')
    .update({ status: 'confirmed' })
    .eq('id', apptId).eq('clinic_id', clinic.id).eq('status', 'pending')
  if (error) return { ok: false, error: error.message }
  revalidatePath('/klinik/panel/takvim')
  revalidatePath('/klinik/panel')
  return { ok: true }
}

async function rejectAction(apptId: string): Promise<{ ok: boolean; error?: string }> {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }
  const { data: clinic } = await supabase.from('clinics').select('id').eq('user_id', user.id).single()
  if (!clinic) return { ok: false, error: 'Klinik bulunamadı' }
  const { error } = await supabase.from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', apptId).eq('clinic_id', clinic.id).in('status', ['pending', 'confirmed'])
  if (error) return { ok: false, error: error.message }
  revalidatePath('/klinik/panel/takvim')
  revalidatePath('/klinik/panel')
  return { ok: true }
}

async function noShowAction(apptId: string): Promise<{ ok: boolean; error?: string }> {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }
  const { data: clinic } = await supabase.from('clinics').select('id').eq('user_id', user.id).single()
  if (!clinic) return { ok: false, error: 'Klinik bulunamadı' }
  const { error } = await supabase.from('appointments')
    .update({ status: 'no_show' })
    .eq('id', apptId).eq('clinic_id', clinic.id).eq('status', 'confirmed')
  if (error) return { ok: false, error: error.message }
  revalidatePath('/klinik/panel/takvim')
  revalidatePath('/klinik/panel')
  return { ok: true }
}

export default async function KlinikTakvimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, credit_balance')
    .eq('user_id', user.id)
    .single()
  if (!clinic) redirect('/klinik/panel')

  // Son 3 ay + önümüzdeki 3 ay
  const from = new Date()
  from.setMonth(from.getMonth() - 1)
  from.setDate(1)

  const to = new Date()
  to.setMonth(to.getMonth() + 3)
  to.setDate(0)

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, user_id, appointment_date, status, duration_minutes, profiles(full_name)')
    .eq('clinic_id', clinic.id)
    .gte('appointment_date', from.toISOString())
    .lte('appointment_date', to.toISOString())
    .order('appointment_date', { ascending: true })

  type RawAppt = {
    id: string
    user_id: string
    appointment_date: string | null
    status: string
    duration_minutes: number | null
    profiles: { full_name: string | null } | null
  }

  const appts = (appointments ?? []) as unknown as RawAppt[]

  const mappedAppts = appts.map(a => ({
    id: a.id,
    userId: a.user_id,
    date: a.appointment_date ?? '',
    status: a.status,
    durationMinutes: a.duration_minutes ?? 30,
    patientName: (a.profiles as { full_name?: string | null } | null)?.full_name ?? 'Hasta',
  }))

  const flavor = await getServerFlavor()
  if (flavor === 'esteklinikpro') {
    return (
      <TakvimAppView
        appointments={mappedAppts}
        onConfirm={confirmAction}
        onReject={rejectAction}
        onNoShow={noShowAction}
      />
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Takvim</h1>
        <Link href="/klinik/panel/musaitlik" className="text-base px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors font-semibold">
          ⚙ Müsaitlik Ayarları
        </Link>
      </div>
      <KlinikTakvimClient
        appointments={mappedAppts}
        onConfirm={confirmAction}
        onReject={rejectAction}
        onNoShow={noShowAction}
      />
    </div>
  )
}
