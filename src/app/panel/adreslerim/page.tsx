export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdresListe, { type Adres } from './AdresListe'
import BackButton from '@/components/BackButton'

export const metadata: Metadata = { title: 'Adreslerim' }

export default async function AdreslerimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: addresses } = await supabase
    .from('addresses')
    .select('id, title, full_name, phone, city, district, neighborhood, address_line, postal_code, is_default')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-[#FAFAF7]">
      <div className="app-only" aria-hidden style={{ height: 'calc(56px + env(safe-area-inset-top))' }} />
      <header className="web-only fixed top-0 left-0 lg:left-[72px] right-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <BackButton href="/panel" label="Panelim" />
          <span className="text-slate-300">|</span>
          <span className="text-slate-900 text-sm font-bold">Adreslerim</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-6 lg:pt-24 pb-24 lg:pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">Adreslerim</h1>
          <p className="text-slate-500 text-sm mt-1">Sipariş teslim adreslerini yönet</p>
        </div>

        <AdresListe addresses={(addresses ?? []) as Adres[]} />
      </div>
    </main>
  )
}
