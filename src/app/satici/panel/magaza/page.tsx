export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import MagazaEditor from './MagazaEditor'

export const metadata: Metadata = { title: 'Mağaza Vitrini — İş Ortağı' }

export default async function MagazaSayfasi() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin' || role === 'clinic') redirect(pathForRole(role))

  const { data: vendor } = await supabase
    .from('vendors')
    .select(`
      id, company_name, approval_status,
      logo_url, banner_url, tagline, about_text, social_links
    `)
    .eq('user_id', user.id)
    .single()

  if (!vendor) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-white font-bold text-xl mb-2">İş Ortağı Hesabı Yok</h1>
          <Link href="/satici/basvur"
            className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] text-white font-semibold rounded-xl text-base">
            İş Ortağı Başvurusu →
          </Link>
        </div>
      </main>
    )
  }

  if (vendor.approval_status !== 'approved') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-white font-bold text-xl mb-2">Hesabın onay bekliyor</h1>
          <p className="text-slate-400 text-sm">Onaylandığında mağaza vitrinini özelleştirebilirsin.</p>
          <Link href="/satici/panel" className="inline-block mt-6 text-[#C9A961] hover:text-[#D4B872] text-sm font-semibold">← Panele dön</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-200">

      <div className="max-w-3xl mx-auto px-4 pt-16 lg:pt-10 pb-16 space-y-6">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Mağaza Vitrini</h1>
            <p className="text-slate-400 text-base mt-2">
              Müşterilerin sayfanı ziyaret ettiğinde ilk gördüğü şey burası. Markanı tanıt.
            </p>
          </div>
          <Link href={`/estestore/satici/${vendor.id}`} target="_blank"
            className="px-3 py-1.5 rounded-lg border border-[#C9A961]/40 hover:border-[#C9A961] text-[#D4B872] hover:bg-[#C9A961]/10 text-sm font-bold transition-colors">
            Önizle ↗
          </Link>
        </div>

        <MagazaEditor
          vendorId={vendor.id}
          companyName={vendor.company_name ?? ''}
          initial={{
            logo_url:   vendor.logo_url ?? null,
            banner_url: vendor.banner_url ?? null,
            tagline:    vendor.tagline ?? '',
            about_text: vendor.about_text ?? '',
            social_links: (vendor.social_links as Record<string, string>) ?? {},
          }}
        />
      </div>
    </main>
  )
}
