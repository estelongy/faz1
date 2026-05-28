export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import KargoAyarForm from './KargoAyarForm'
import { CARRIERS } from './actions'

export const metadata: Metadata = { title: 'Kargo Ayarları — İş Ortağı' }

export default async function KargoAyarSayfasi() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin' || role === 'clinic') redirect(pathForRole(role))

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name, approval_status, company_address')
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
          <p className="text-slate-400 text-sm">Satıcı hesabın onaylandığında kargo ayarlarını doldurabilirsin.</p>
          <Link href="/satici/panel" className="inline-block mt-6 text-[#C9A961] hover:text-[#D4B872] text-sm font-semibold">← Panele dön</Link>
        </div>
      </main>
    )
  }

  const { data: settings } = await supabase
    .from('vendor_shipping_settings')
    .select('*')
    .eq('vendor_id', vendor.id)
    .maybeSingle()

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-200">
      <div className="max-w-3xl mx-auto px-4 pt-16 lg:pt-10 pb-16 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Kargo Ayarları</h1>
          <p className="text-slate-400 text-base mt-2">
            Gönderici bilgilerin ve tercih ettiğin kargo şirketleri. Bu bilgilerle{' '}
            <strong className="text-[#C9A961]">tek tıkla kargo etiketi</strong> üretebilirsin.
          </p>
        </div>

        {!settings && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
            ⚠️ Henüz kargo ayarların yok. Sipariş geldiğinde etiket üretebilmek için bu formu doldur.
          </div>
        )}

        <KargoAyarForm
          carriers={CARRIERS}
          companyName={vendor.company_name ?? ''}
          companyAddress={vendor.company_address ?? ''}
          existing={settings ?? null}
        />

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-slate-400 space-y-2">
          <p className="font-semibold text-slate-300">🚚 Nasıl çalışır?</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-400">
            <li>Sipariş geldiğinde &quot;Hazırlamaya Başla&quot; → &quot;🏷️ Etiket Oluştur&quot; tek tıkla kargo kodu üretilir.</li>
            <li>Etiket sayfası açılır — yazdır, kargoya yapıştır.</li>
            <li>Birden fazla sipariş varsa &quot;Toplu Etiket&quot; tek sayfada hepsi yazdırılır.</li>
            <li>Müşteriye otomatik takip kodu mail+SMS olarak iletilir.</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
