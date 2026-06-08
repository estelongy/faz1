export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import UrunEkleForm from '../../UrunEkleForm'

/**
 * Yeni ürün ekleme sayfası — app'te ayrı route (SaticiPROAppHome ana ekran
 * olduğu için /satici/panel'deki inline UrunEkleForm app'te görünmüyordu).
 * Web tarafı da bu sayfayı kullanabilir; layout sidebar + guard sağlar.
 */
export default async function UrunEklePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, approval_status, kyc_status')
    .eq('user_id', user.id)
    .single()

  if (!vendor || vendor.approval_status !== 'approved' || vendor.kyc_status !== 'approved') {
    redirect('/satici/panel')
  }

  return (
    <div className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
         style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
      <header className="px-5 pt-4 pb-3 border-b border-slate-800/60">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-400/80">Ürün</p>
        <h1 className="mt-1 text-xl font-bold">Yeni Ürün Ekle</h1>
        <p className="mt-1 text-sm text-slate-400">Onay sürecinden geçtikten sonra mağazada yayınlanır.</p>
      </header>

      <div className="px-4 pt-4">
        <UrunEkleForm vendorId={vendor.id} />
      </div>
    </div>
  )
}
