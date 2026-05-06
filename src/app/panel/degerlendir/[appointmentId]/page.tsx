import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DegerlendirForm from './DegerlendirForm'
import type { ClinicReviewRow } from '@/lib/clinic-review'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ appointmentId: string }>
}

export const metadata = {
  title: 'Deneyimini Paylaş | Estelongy',
}

export default async function DegerlendirPage({ params }: Props) {
  const { appointmentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/giris?next=${encodeURIComponent(`/panel/degerlendir/${appointmentId}`)}`)

  // Randevu — clinics join ile
  const { data: appt } = await supabase
    .from('appointments')
    .select(`
      id, user_id, status, appointment_date, completed_at,
      clinics:clinic_id (id, name, slug)
    `)
    .eq('id', appointmentId)
    .maybeSingle()

  if (!appt) notFound()
  if (appt.user_id !== user.id) redirect('/panel/analizlerim')
  if (appt.status !== 'completed') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center space-y-4">
          <div className="text-5xl opacity-40">⏳</div>
          <h1 className="text-2xl font-bold text-white">Henüz değerlendirilemez</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Bu randevu henüz tamamlanmadı. Klinik akışı bittikten sonra burada deneyimini paylaşabilirsin.
          </p>
          <Link href="/panel/analizlerim" className="inline-block px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
            Geçmişe Dön
          </Link>
        </div>
      </div>
    )
  }

  const clinic = appt.clinics as unknown as { id: string; name: string; slug: string | null } | null
  if (!clinic) notFound()

  // Mevcut yorum?
  const { data: existing } = await supabase
    .from('clinic_reviews')
    .select('*')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  const review = (existing ?? null) as ClinicReviewRow | null
  const editLocked = !!(review && new Date(review.edit_window_until) < new Date())

  const referenceDate = appt.completed_at ?? appt.appointment_date

  return (
    <DegerlendirForm
      appointmentId={appointmentId}
      clinicName={clinic.name}
      appointmentDate={referenceDate}
      existingReview={review}
      editLocked={editLocked}
    />
  )
}
