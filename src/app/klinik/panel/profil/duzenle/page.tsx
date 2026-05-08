export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditForm from './EditForm'

export const metadata: Metadata = {
  title: 'Profili Düzenle | Klinik Paneli',
}

export default async function ProfilDuzenlePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, location, bio, specialties, clinic_type, phone')
    .eq('user_id', user.id)
    .single()
  if (!clinic) redirect('/klinik/basvur')

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Link href="/klinik/panel/profil" className="hover:text-white transition-colors">Klinik Profilim</Link>
          <span>›</span>
          <span className="text-slate-300">Düzenle</span>
        </nav>
        <h1 className="text-2xl font-black text-white">Profili Düzenle</h1>
        <p className="text-slate-400 mt-0.5 text-sm">Hastaların gördüğü kliniğine ait bilgileri güncelle.</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 sm:p-6">
        <EditForm initial={{
          name: clinic.name,
          location: clinic.location,
          bio: clinic.bio,
          clinic_type: clinic.clinic_type,
          specialties: (clinic.specialties as string[] | null) ?? null,
          phone: clinic.phone,
        }} />
      </div>

      <p className="mt-4 text-[11px] text-slate-600">
        Güncelleme sonrası değişiklikler hem klinik panelinde hem de hasta tarafında (klinik detayı, randevu önizleme) anında görünür.
      </p>
    </div>
  )
}
