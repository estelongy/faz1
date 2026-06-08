export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import UrunDuzenleForm from './UrunDuzenleForm'
import { getServerFlavor } from '@/lib/server-flavor'
import UrunDuzenleAppView from '@/components/satici-panel/UrunDuzenleAppView'

export const metadata: Metadata = { title: 'Ürün Düzenle — İş Ortağı Paneli' }

export default async function UrunDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('vendor_id', vendor.id)
    .single()
  if (!product) notFound()

  const productInit = {
    id:            product.id,
    name:          product.name,
    category:      product.category ?? 'kozmetik',
    subcategory:   product.subcategory,
    description:   product.description ?? '',
    price:         product.price,
    stock:         product.stock,
    ingredients:   product.ingredients ?? [],
    images:        product.images ?? [],
    is_active:     product.is_active ?? false,
    approval_status: product.approval_status,
    pricing_tiers: Array.isArray(product.pricing_tiers) ? product.pricing_tiers : [],
  }

  const flavor = await getServerFlavor()
  if (flavor === 'estestorepro') {
    return <UrunDuzenleAppView vendorId={vendor.id} product={productInit} />
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-3xl mx-auto px-4 pt-16 lg:pt-10 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">{product.name}</h1>
          <p className="text-slate-400 text-sm mt-1">{vendor.company_name}</p>
        </div>

        <div className="mb-6 p-4 bg-[#C9A961]/10 border border-[#C9A961]/30 rounded-xl text-[#C9A961] text-sm">
          ⚠ İçerik değişikliği (ad, kategori, açıklama, görseller, içerikler) yaptığında ürün yeniden admin onayına düşer ve mağazada geçici olarak pasif olur.
        </div>

        <UrunDuzenleForm vendorId={vendor.id} product={productInit} />
      </div>
    </main>
  )
}
