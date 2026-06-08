export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import { getServerFlavor } from '@/lib/server-flavor'
import UrunlerAppView from '@/components/satici-panel/UrunlerAppView'

export const metadata: Metadata = { title: 'Ürünlerim — İş Ortağı' }

export default async function SaticiUrunlerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin' || role === 'clinic') redirect(pathForRole(role))

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name, approval_status')
    .eq('user_id', user.id)
    .single()
  if (!vendor || vendor.approval_status !== 'approved') notFound()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, category, price, stock, approval_status, is_active, images, final_score')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  const list = (products ?? []).map(p => ({
    id: p.id as string,
    name: p.name as string,
    category: (p.category as string | null) ?? null,
    price: p.price != null ? Number(p.price) : null,
    stock: p.stock as number | null,
    approval_status: p.approval_status as string,
    is_active: p.is_active as boolean | null,
    cover_image: Array.isArray(p.images) && p.images.length > 0 ? (p.images[0] as string) : null,
    final_score: p.final_score != null ? Number(p.final_score) : null,
  }))

  const totalProducts = list.length
  const approvedCount = list.filter(p => p.approval_status === 'approved').length
  const pendingCount = list.filter(p => p.approval_status === 'pending').length

  const flavor = await getServerFlavor()
  if (flavor === 'estestorepro') {
    return (
      <UrunlerAppView
        vendorId={vendor.id}
        companyName={vendor.company_name ?? 'İş Ortağı'}
        totalProducts={totalProducts}
        approvedCount={approvedCount}
        pendingCount={pendingCount}
        products={list}
      />
    )
  }

  // Web fallback — basit liste, dashboard'a yönlendir
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-5xl mx-auto px-4 pt-16 lg:pt-10 pb-16">
        <div className="mb-8 flex items-baseline justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-black text-white">Ürünlerim</h1>
            <p className="text-slate-400 text-sm mt-1">{vendor.company_name} · {totalProducts} ürün</p>
          </div>
          <Link href="/satici/panel" className="text-[#C9A961] text-sm font-bold hover:text-[#D4B872]">← Panele dön</Link>
        </div>
        <div className="space-y-3">
          {list.map(p => (
            <Link key={p.id} href={`/satici/panel/urunler/${p.id}/duzenle`}
              className="flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-2xl transition-all">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 flex items-center justify-center">
                {p.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover_image} alt={p.name} className="w-full h-full object-cover" />
                ) : <span className="text-slate-600">📦</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{p.name}</p>
                <p className="text-slate-500 text-sm mt-0.5">
                  {p.price != null && <>₺{p.price.toLocaleString('tr-TR')} · </>}
                  stok: {p.stock ?? 0} · {p.approval_status}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
