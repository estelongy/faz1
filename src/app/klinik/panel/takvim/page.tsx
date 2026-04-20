export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import KlinikTakvimClient from './KlinikTakvimClient'

export default async function KlinikTakvimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, jeton_balance')
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/klinik/panel" className="text-slate-400 hover:text-white transition-colors text-sm">← Panel</Link>
            <span className="text-slate-700">|</span>
            <span className="text-white font-bold text-sm">Takvim</span>
          </div>
          <Link href="/klinik/panel/musaitlik" className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">
            ⚙ Müsaitlik Ayarları
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        <KlinikTakvimClient appointments={appts.map(a => ({
          id: a.id,
          userId: a.user_id,
          date: a.appointment_date ?? '',
          status: a.status,
          durationMinutes: a.duration_minutes ?? 30,
          patientName: (a.profiles as { full_name?: string | null } | null)?.full_name ?? 'Hasta',
        }))} />
      </div>
    </main>
  )
}
