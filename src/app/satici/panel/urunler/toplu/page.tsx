export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import TopluYukleClient from './TopluYukleClient'

export const metadata: Metadata = { title: 'Toplu Ürün Yükle — İş Ortağı' }

export default async function TopluUrunYuklemeSayfasi() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin' || role === 'clinic') redirect(pathForRole(role))

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, approval_status')
    .eq('user_id', user.id)
    .single()

  if (!vendor || vendor.approval_status !== 'approved') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-white font-bold text-xl mb-2">Onaylı satıcı hesabı gerekli</h1>
          <Link href="/satici/panel" className="inline-block mt-6 text-[#C9A961] text-sm font-semibold">← Panele dön</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-200">
      <div className="max-w-5xl mx-auto px-4 pt-16 lg:pt-10 pb-16 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Toplu Ürün Yükle</h1>
          <p className="text-slate-400 text-base mt-2">
            CSV dosyasıyla bir seferde 500 ürüne kadar yükleyebilirsin.
            Yüklenen ürünler &quot;onay bekliyor&quot; statüsünde başlar.
          </p>
        </div>

        <TopluYukleClient />
      </div>
    </main>
  )
}
