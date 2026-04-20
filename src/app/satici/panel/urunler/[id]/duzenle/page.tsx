export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import UrunDuzenleForm from './UrunDuzenleForm'

export const metadata: Metadata = { title: 'Ürün Düzenle — Satıcı Paneli' }

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/satici/panel" className="text-slate-400 hover:text-white text-sm transition-colors">
              ← Satıcı Paneli
            </Link>
            <span className="text-slate-700">|</span>
            <span className="text-white text-sm font-bold">Ürün Düzenle</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">{product.name}</h1>
          <p className="text-slate-400 text-sm mt-1">{vendor.company_name}</p>
        </div>

        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm">
          ⚠ İçerik değişikliği (ad, kategori, açıklama, görseller, içerikler) yaptığında ürün yeniden admin onayına düşer ve mağazada geçici olarak pasif olur.
        </div>

        <UrunDuzenleForm
          vendorId={vendor.id}
          product={{
            id:            product.id,
            name:          product.name,
            category:      product.category ?? 'other',
            description:   product.description ?? '',
            price:         product.price,
            stock:         product.stock,
            ingredients:   product.ingredients ?? [],
            images:        product.images ?? [],
            is_active:     product.is_active ?? false,
            approval_status: product.approval_status,
          }}
        />
      </div>
    </main>
  )
}
