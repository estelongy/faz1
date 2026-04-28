export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import RandevuQRModal from '@/components/RandevuQRModal'

export const metadata: Metadata = {
  title: 'Randevularım — Estelongy',
}

const APT_STATUS_LABEL: Record<string, string> = {
  pending:     'Beklemede',
  confirmed:   'Onaylandı',
  in_progress: 'Görüşmede',
  completed:   'Tamamlandı',
  cancelled:   'İptal',
  no_show:     'Gelmedi',
}

const APT_STATUS_COLOR: Record<string, string> = {
  pending:     'bg-amber-500/20 text-amber-400',
  confirmed:   'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-violet-500/20 text-violet-400',
  completed:   'bg-emerald-500/20 text-emerald-400',
  cancelled:   'bg-red-500/20 text-red-400',
  no_show:     'bg-slate-500/20 text-slate-400',
}

async function cancelAppointment(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  const appointmentId = formData.get('appointmentId') as string
  await supabase.from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)
    .eq('user_id', user.id)
  redirect('/panel/randevularim')
}

export default async function RandevularimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role && role !== 'user') redirect(pathForRole(role))

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, appointment_date, status, clinics(name)')
    .eq('user_id', user.id)
    .order('appointment_date', { ascending: false })

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/panel" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Panel
          </Link>
          <span className="text-white font-bold text-sm">Randevularım</span>
          <Link href="/randevu" className="text-violet-400 hover:text-violet-300 text-sm">+ Yeni</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        {appointments && appointments.length > 0 ? (
          <div className="space-y-3">
            {(appointments as unknown as Array<{ id: string; appointment_date: string | null; status: string; clinics: { name: string } | null }>).map(apt => (
              <div key={apt.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="min-w-0 flex-1">
                  <div className="text-white text-sm font-medium">{apt.clinics?.name ?? 'Klinik'}</div>
                  <div className="text-slate-500 text-xs mt-0.5">
                    {apt.appointment_date
                      ? new Date(apt.appointment_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${APT_STATUS_COLOR[apt.status] ?? APT_STATUS_COLOR.pending}`}>
                    {APT_STATUS_LABEL[apt.status] ?? apt.status}
                  </span>
                  {(apt.status === 'pending' || apt.status === 'confirmed') && (
                    <>
                      <RandevuQRModal
                        appointmentId={apt.id}
                        clinicName={apt.clinics?.name ?? 'Klinik'}
                        appointmentDate={apt.appointment_date}
                      />
                      <form action={cancelAppointment}>
                        <input type="hidden" name="appointmentId" value={apt.id} />
                        <button type="submit" className="text-slate-500 hover:text-red-400 transition-colors" title="İptal et">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center mb-4 text-4xl">📅</div>
            <p className="text-white font-semibold mb-2">Henüz randevunuz yok</p>
            <p className="text-slate-400 text-sm mb-5">Klinik seçerek skorunuzu hekim onayına ulaştırın</p>
            <Link href="/randevu" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl">
              Randevu Al →
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
