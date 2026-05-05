export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import KlinikPanelDashboard from '@/components/klinik-panel/KlinikPanelDashboard'
import { computeAccreditation } from '@/lib/clinic-accreditation'
import { computeOnboarding } from '@/lib/clinic-onboarding'
import { fetchEditorialPosts } from '@/lib/editorial-posts'
import { fetchApprovedCases } from '@/lib/shared-cases'

export const metadata: Metadata = {
  title: 'Klinik Paneli',
}

export default async function KlinikPanelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, jeton_balance, free_appointments_remaining')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!clinic) redirect('/klinik/basvur')

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

  // Bugünün akışı
  const today = new Date().toISOString().split('T')[0]
  const todayAppts = apptsList.filter(a => a.appointment_date?.startsWith(today))
  const pendingCount = apptsList.filter(a => a.status === 'pending').length

  const totalCredit = (clinic.jeton_balance ?? 0) + (clinic.free_appointments_remaining ?? 0)

  // Akreditasyon, onboarding, editöryel postlar, vitrini vakalar — paralel
  const [accreditation, onboarding, postsByCategory, approvedCases] = await Promise.all([
    computeAccreditation(clinic.id, supabase),
    computeOnboarding(clinic.id, supabase),
    fetchEditorialPosts(supabase, 3),
    fetchApprovedCases(clinic.id, supabase, 5),
  ])

  return (
    <KlinikPanelDashboard
      hekimName={profile?.full_name ?? null}
      clinicName={clinic.name}
      todayAppts={todayAppts.map(a => ({
        id: a.id,
        time: a.appointment_date,
        patientName: (a.profiles as { full_name?: string | null } | null)?.full_name ?? 'Hasta',
        status: a.status as string,
      }))}
      pendingCount={pendingCount}
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
    />
  )
}
