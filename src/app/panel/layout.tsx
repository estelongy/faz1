import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import HastaSidebar from '@/components/HastaSidebar'
import { GALAXY_THEMES, resolveGalaxy } from '@/lib/galaxy-themes'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  // Rol kontrolü — user ve health_professional
  const role = (user.app_metadata as Record<string, string>)?.role
  if (role && role !== 'user' && role !== 'health_professional') redirect(pathForRole(role))

  const sidebarRole: 'user' | 'health_professional' = role === 'health_professional' ? 'health_professional' : 'user'

  // Profil — isim, puan, ev galaksisi (signup_source)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, points_balance, signup_source')
    .eq('id', user.id)
    .maybeSingle()

  // Kullanıcının ev galaksisi: signup_source > default (Estelongy çatı)
  const galaxy = resolveGalaxy(profile?.signup_source ?? null)
  const t = GALAXY_THEMES[galaxy]

  // Klinik erişimi var mı? (sidebar alt linki için)
  const { data: userClinic } = await supabase
    .from('clinics')
    .select('id, approval_status')
    .eq('user_id', user.id)
    .maybeSingle()

  const hasClinicAccess = !!(userClinic && userClinic.approval_status === 'approved')

  return (
    <div className={`min-h-screen bg-gradient-to-b ${t.bgFrom} ${t.bgVia} ${t.bgTo} text-white`}>
      <HastaSidebar
        userName={profile?.full_name ?? user.email ?? null}
        pointsBalance={profile?.points_balance ?? 0}
        hasClinicAccess={hasClinicAccess}
        role={sidebarRole}
      />

      {/* Sidebar collapsed = 72px offset (desktop). Mobile: full width. */}
      <div className="lg:pl-[72px]">
        {children}
      </div>
    </div>
  )
}
