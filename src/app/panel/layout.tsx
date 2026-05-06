import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import HastaSidebar from '@/components/HastaSidebar'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  // Rol kontrolü — user ve health_professional
  const role = (user.app_metadata as Record<string, string>)?.role
  if (role && role !== 'user' && role !== 'health_professional') redirect(pathForRole(role))

  // Profil — isim ve puan için
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, points_balance')
    .eq('id', user.id)
    .maybeSingle()

  // Klinik erişimi var mı? (sidebar alt linki için)
  const { data: userClinic } = await supabase
    .from('clinics')
    .select('id, approval_status')
    .eq('user_id', user.id)
    .maybeSingle()

  const hasClinicAccess = !!(userClinic && userClinic.approval_status === 'approved')

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <HastaSidebar
        userName={profile?.full_name ?? user.email ?? null}
        pointsBalance={profile?.points_balance ?? 0}
        hasClinicAccess={hasClinicAccess}
      />

      {/* Sidebar collapsed = 72px offset (desktop). Mobile: full width. */}
      <div className="lg:pl-[72px]">
        {children}
      </div>
    </div>
  )
}
