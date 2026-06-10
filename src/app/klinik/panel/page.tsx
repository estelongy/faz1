export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import KlinikPanelDashboard from '@/components/klinik-panel/KlinikPanelDashboard'
import KlinikPROAppHome from '@/components/klinik-panel/KlinikPROAppHome'
import { getServerFlavor } from '@/lib/server-flavor'
import { computeAccreditation } from '@/lib/clinic-accreditation'
import { computeOnboarding } from '@/lib/clinic-onboarding'
import { fetchEditorialPosts } from '@/lib/editorial-posts'
import { fetchApprovedCases } from '@/lib/shared-cases'

export const metadata: Metadata = {
  title: 'Klinik Paneli',
}

// ── Server Actions: hızlı randevu yönetimi ─────────────────────────────
async function confirmAppointmentAction(apptId: string): Promise<{ ok: boolean; error?: string }> {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }

  const { data: clinic } = await supabase
    .from('clinics').select('id').eq('user_id', user.id).single()
  if (!clinic) return { ok: false, error: 'Klinik bulunamadı' }

  const { error } = await supabase.from('appointments')
    .update({ status: 'confirmed' })
    .eq('id', apptId)
    .eq('clinic_id', clinic.id)
    .eq('status', 'pending')

  if (error) return { ok: false, error: error.message }
  revalidatePath('/klinik/panel')
  return { ok: true }
}

async function rejectAppointmentAction(apptId: string): Promise<{ ok: boolean; error?: string }> {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }

  const { data: clinic } = await supabase
    .from('clinics').select('id').eq('user_id', user.id).single()
  if (!clinic) return { ok: false, error: 'Klinik bulunamadı' }

  const { error } = await supabase.from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', apptId)
    .eq('clinic_id', clinic.id)
    .in('status', ['pending', 'confirmed', 'in_progress'])

  if (error) return { ok: false, error: error.message }
  revalidatePath('/klinik/panel')
  return { ok: true }
}

async function startAppointmentAction(apptId: string): Promise<{ ok: boolean; error?: string }> {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }

  const { data: clinic } = await supabase
    .from('clinics').select('id').eq('user_id', user.id).single()
  if (!clinic) return { ok: false, error: 'Klinik bulunamadı' }

  const { error } = await supabase.from('appointments')
    .update({ status: 'in_progress' })
    .eq('id', apptId)
    .eq('clinic_id', clinic.id)
    .in('status', ['pending', 'confirmed'])

  if (error) return { ok: false, error: error.message }
  revalidatePath('/klinik/panel')
  return { ok: true }
}

async function completeAppointmentAction(apptId: string): Promise<{ ok: boolean; error?: string }> {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }

  const { data: clinic } = await supabase
    .from('clinics').select('id').eq('user_id', user.id).single()
  if (!clinic) return { ok: false, error: 'Klinik bulunamadı' }

  const { error } = await supabase.from('appointments')
    .update({ status: 'completed' })
    .eq('id', apptId)
    .eq('clinic_id', clinic.id)
    .in('status', ['confirmed', 'in_progress'])

  if (error) return { ok: false, error: error.message }
  revalidatePath('/klinik/panel')
  return { ok: true }
}

export default async function KlinikPanelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, title, credit_balance, free_appointments_remaining, clinic_egp, review_count')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!clinic) redirect('/esteklinik/basvur')

  // Profil — hekim adı için
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  // Randevular — son 100
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, user_id, appointment_date, status, profiles(full_name)')
    .eq('clinic_id', clinic.id)
    .order('appointment_date', { ascending: true })
    .limit(100)

  const apptsList = appointments ?? []

  // Üretimin metrikleri — bu ay
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const prevMonthEnd = monthStart

  const thisMonthAppts = apptsList.filter(a => a.appointment_date && a.appointment_date >= monthStart)
  const prevMonthAppts = apptsList.filter(
    a => a.appointment_date && a.appointment_date >= prevMonthStart && a.appointment_date < prevMonthEnd
  )

  const thisMonthCount = thisMonthAppts.length
  const prevMonthCount = prevMonthAppts.length
  const monthDelta = thisMonthCount - prevMonthCount

  const acceptedThisMonth = thisMonthAppts.filter(a => a.status === 'confirmed' || a.status === 'completed' || a.status === 'in_progress').length
  const acceptanceRate = thisMonthCount > 0 ? Math.round((acceptedThisMonth / thisMonthCount) * 100) : 0

  // Klinik onayı sayısı — completed randevularda final score'u doğrulanmış olanlar
  const completedThisMonth = thisMonthAppts.filter(a => a.status === 'completed')
  const userIds = Array.from(new Set(completedThisMonth.map(a => a.user_id).filter(Boolean)))
  const { data: finalScores } = userIds.length > 0
    ? await supabase
        .from('analyses')
        .select('user_id, final_overall')
        .in('user_id', userIds)
        .not('final_overall', 'is', null)
    : { data: [] }

  const klinikOnayiSayisi = finalScores?.length ?? 0

  // Bugünün akışı + önceliklendirilmiş listeler
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400_000).toISOString().split('T')[0]

  const todayAppts = apptsList.filter(a => a.appointment_date?.startsWith(today))
  const tomorrowAppts = apptsList.filter(a => a.appointment_date?.startsWith(tomorrow))

  // Onay bekleyen tüm pending randevular (bugüne özgü değil — klinik gelir akışı)
  const pendingAppts = apptsList
    .filter(a => a.status === 'pending')
    .sort((a, b) => (a.appointment_date ?? '').localeCompare(b.appointment_date ?? ''))

  // Şu an akışta (in_progress)
  const inProgressAppts = apptsList.filter(a => a.status === 'in_progress')

  const totalCredit = (clinic.credit_balance ?? 0) + (clinic.free_appointments_remaining ?? 0)

  // ── EsteKlinikPRO app — mobil-first ev (web dashboard değil) ──────────
  const flavor = await getServerFlavor()
  if (flavor === 'esteklinikpro') {
    const apptToViewLite = (a: typeof apptsList[number]) => ({
      id: a.id,
      time: a.appointment_date,
      patientName: (a.profiles as { full_name?: string | null } | null)?.full_name ?? 'Hasta',
      status: a.status as string,
    })

    // Haftalık özet — bu takvim haftası (Pzt-Paz). Pazar açıksa 7 gün, değilse 6.
    const nowD = new Date()
    const dow = nowD.getDay() // 0=Paz, 1=Pzt, ...
    const monOffset = dow === 0 ? -6 : (1 - dow)
    const monday = new Date(nowD)
    monday.setDate(nowD.getDate() + monOffset)
    monday.setHours(0, 0, 0, 0)
    const sundayEnd = new Date(monday)
    sundayEnd.setDate(monday.getDate() + 6)
    sundayEnd.setHours(23, 59, 59, 999)

    const { data: weekApptsRaw } = await supabase
      .from('appointments')
      .select('appointment_date, status')
      .eq('clinic_id', clinic.id)
      .gte('appointment_date', monday.toISOString())
      .lte('appointment_date', sundayEnd.toISOString())

    const dailyCounts = new Map<string, number>()
    ;(weekApptsRaw ?? []).forEach(a => {
      if (!a.appointment_date) return
      if (a.status === 'cancelled') return
      const d = a.appointment_date.slice(0, 10)
      dailyCounts.set(d, (dailyCounts.get(d) ?? 0) + 1)
    })

    // Pazar açık mı? internal_availability varsa oku, yoksa veri-driven (pazar randevu sayısı > 0)
    const sundayDate = new Date(monday)
    sundayDate.setDate(monday.getDate() + 6)
    const sundayIso = sundayDate.toISOString().slice(0, 10)
    const { data: sundayAvail } = await supabase
      .from('internal_availability')
      .select('is_closed')
      .eq('owner_id', user.id)
      .eq('day_of_week', 0)
      .maybeSingle()
    const sundayOpen = sundayAvail
      ? !sundayAvail.is_closed
      : (dailyCounts.get(sundayIso) ?? 0) > 0

    const DAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
    const weekSummary: { iso: string; label: string; day: number; count: number; isToday: boolean; isPast: boolean }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dWeekDay = d.getDay()
      if (dWeekDay === 0 && !sundayOpen) continue
      const iso = d.toISOString().slice(0, 10)
      weekSummary.push({
        iso,
        label: DAY_LABELS[dWeekDay],
        day: d.getDate(),
        count: dailyCounts.get(iso) ?? 0,
        isToday: iso === today,
        isPast: iso < today,
      })
    }

    // Bugünün çalışma saati: internal_availability'den (varsa), yoksa 09:00-19:00 / 30dk default
    const { data: todayAvail } = await supabase
      .from('internal_availability')
      .select('open_time, close_time, slot_duration_minutes, is_closed')
      .eq('owner_id', user.id)
      .eq('day_of_week', nowD.getDay())
      .maybeSingle()
    const dayOpenTime = todayAvail && !todayAvail.is_closed ? todayAvail.open_time.slice(0, 5) : '09:00'
    const dayCloseTime = todayAvail && !todayAvail.is_closed ? todayAvail.close_time.slice(0, 5) : '19:00'
    const dayStepMinutes = todayAvail?.slot_duration_minutes ?? 30

    const todayLabel = nowD.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })

    // Onboarding — yeni klinik app'i açtığında 4 adım checklist görünür.
    // Web'deki tam banner yerine app'te kompakt versiyon (KlinikPROAppHome içinde).
    const onboarding = await computeOnboarding(clinic.id, supabase)
    return (
      <KlinikPROAppHome
        greeting={getGreeting()}
        hekimTitle={clinic.title ?? 'Dr.'}
        hekimFirstName={(clinic.name?.split(' ')[0]) ?? 'Hekim'}
        clinicName={clinic.name}
        totalCredit={totalCredit}
        todayAppts={todayAppts.map(apptToViewLite)}
        clinicEgp={clinic.clinic_egp ?? null}
        reviewCount={clinic.review_count ?? 0}
        onboarding={onboarding}
        weekSummary={weekSummary}
        todayIso={today}
        todayLabel={todayLabel}
        dayOpenTime={dayOpenTime}
        dayCloseTime={dayCloseTime}
        dayStepMinutes={dayStepMinutes}
        onConfirmAppointment={confirmAppointmentAction}
        onStartAppointment={startAppointmentAction}
        onCompleteAppointment={completeAppointmentAction}
        onRejectAppointment={rejectAppointmentAction}
      />
    )
  }

  // Akreditasyon, onboarding, editöryel postlar, vitrini vakalar — paralel
  const [accreditation, onboarding, postsByCategory, approvedCases] = await Promise.all([
    computeAccreditation(clinic.id, supabase),
    computeOnboarding(clinic.id, supabase),
    fetchEditorialPosts(supabase, 3),
    fetchApprovedCases(clinic.id, supabase, 5),
  ])

  const apptToView = (a: typeof apptsList[number]) => ({
    id: a.id,
    time: a.appointment_date,
    patientName: (a.profiles as { full_name?: string | null } | null)?.full_name ?? 'Hasta',
    status: a.status as string,
  })

  return (
    <KlinikPanelDashboard
      hekimName={profile?.full_name ?? null}
      clinicName={clinic.name}
      todayAppts={todayAppts.map(apptToView)}
      tomorrowApptsCount={tomorrowAppts.length}
      pendingAppts={pendingAppts.map(apptToView)}
      inProgressAppts={inProgressAppts.map(apptToView)}
      uretimMetrics={{
        thisMonthCount,
        monthDelta,
        acceptanceRate,
        klinikOnayiSayisi,
      }}
      totalCredit={totalCredit}
      accreditation={accreditation}
      onboarding={onboarding}
      postsByCategory={postsByCategory}
      approvedCases={approvedCases}
      onConfirmAppointment={confirmAppointmentAction}
      onRejectAppointment={rejectAppointmentAction}
    />
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 6) return 'İyi geceler'
  if (h < 12) return 'Günaydın'
  if (h < 18) return 'İyi günler'
  return 'İyi akşamlar'
}
