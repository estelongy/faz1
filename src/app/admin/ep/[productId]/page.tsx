export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EpAdminActions from './EpAdminActions'

export const metadata: Metadata = { title: 'EP Ürün Yönetimi — Admin' }

interface Props {
  params: Promise<{ productId: string }>
}

export default async function AdminEpProductPage({ params }: Props) {
  const { productId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  const role = (user.app_metadata as Record<string, string>)?.role
  if (role !== 'admin') redirect('/panel')

  const { data: product } = await supabase
    .from('products')
    .select('id, name, slug, category, ep_score, ep_baz, ep_baz2, ep_belge_seviye, ep_review_count, is_active, vendors(company_name)')
    .eq('id', productId)
    .maybeSingle()

  if (!product) notFound()

  const { data: docs } = await supabase
    .from('ep_documents')
    .select('document_type, seviye, verified_at')
    .eq('product_id', productId)
    .order('seviye', { ascending: false })

  const { data: verify } = await supabase
    .from('ep_verify')
    .select('sahte_count, penalty, is_banned')
    .eq('product_id', productId)
    .maybeSingle()

  const vendor = (product.vendors as { company_name?: string } | null)?.company_name

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/admin/ep" className="text-violet-400 hover:text-violet-300 text-sm font-bold">
          ← EP Yönetimi
        </Link>
        <h1 className="text-2xl font-black text-white mt-2">{product.name}</h1>
        {vendor && <p className="text-slate-500 text-sm mt-1">İş Ortağı: {vendor}</p>}
      </div>

      {/* Mevcut EP özeti */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">EP</p>
          <p className={`text-2xl font-black mt-1 ${
            (product.ep_score ?? 0) >= 9 ? 'text-emerald-400' :
            (product.ep_score ?? 0) >= 7 ? 'text-amber-400' :
            (product.ep_score ?? 0) >= 5 ? 'text-orange-400' : 'text-red-400'
          }`}>
            {product.ep_score != null ? Number(product.ep_score).toFixed(2) : '—'}
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Baz</p>
          <p className="text-2xl font-black text-white mt-1">
            {product.ep_baz != null ? Number(product.ep_baz).toFixed(2) : '—'}
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Belge Sev.</p>
          <p className="text-2xl font-black text-white mt-1">{product.ep_belge_seviye ?? 0}/5</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Oy</p>
          <p className="text-2xl font-black text-white mt-1">{product.ep_review_count ?? 0}</p>
        </div>
      </div>

      <EpAdminActions
        productId={productId}
        existingDocs={docs ?? []}
        sahteCount={verify?.sahte_count ?? 0}
        isBanned={verify?.is_banned ?? false}
      />
    </div>
  )
}
