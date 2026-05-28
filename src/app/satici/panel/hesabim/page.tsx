export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import HesabimClient from './HesabimClient'

export const metadata: Metadata = { title: 'Hesabım — İş Ortağı' }

export default async function SaticiHesabimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin' || role === 'clinic') redirect(pathForRole(role))

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name, approval_status, phone')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!vendor || vendor.approval_status !== 'approved') notFound()

  const phone = (user.phone || vendor.phone || null) as string | null

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-3xl mx-auto px-4 py-8 lg:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white">Hesabım</h1>
          <p className="text-slate-400 text-base mt-2">
            {vendor.company_name} · oturum açtığınız hesap
          </p>
        </div>

        <HesabimClient
          email={user.email ?? ''}
          phone={phone}
          companyName={vendor.company_name ?? ''}
        />
      </div>
    </main>
  )
}
