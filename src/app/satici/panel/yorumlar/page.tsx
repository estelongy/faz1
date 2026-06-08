export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import YorumKartlari from './YorumKartlari'
import { getServerFlavor } from '@/lib/server-flavor'
import YorumlarAppView from '@/components/satici-panel/YorumlarAppView'

export const metadata: Metadata = { title: 'Müşteri Yorumları — İş Ortağı' }

export default async function SaticiYorumlarPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>
}) {
  const { durum } = await searchParams
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

  // Vendor'un kendi ürünlerinin ID'leri
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug')
    .eq('vendor_id', vendor.id)

  const productIds = (products ?? []).map(p => p.id)
  const productMap = new Map((products ?? []).map(p => [p.id, { name: p.name, slug: p.slug as string | null }]))

  if (productIds.length === 0) {
    return (
      <SimplePage title="Müşteri Yorumları" empty="Henüz ürünün yok — önce ürün ekle." />
    )
  }

  let query = supabase
    .from('reviews')
    .select('id, product_id, user_id, rating, title, body, created_at, is_verified, vendor_response, vendor_responded_at')
    .in('product_id', productIds)
    .order('created_at', { ascending: false })

  if (durum === 'bekleyen') query = query.is('vendor_response', null)
  else if (durum === 'yanitli') query = query.not('vendor_response', 'is', null)

  const { data: rawReviews } = await query.limit(100)
  const reviews = rawReviews ?? []

  // Müşteri isimleri
  const userIds = Array.from(new Set(reviews.map(r => r.user_id).filter(Boolean) as string[]))
  const { data: profs } = userIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] }
  const nameMap = new Map((profs ?? []).map(p => [p.id, p.full_name as string | null]))

  const items = reviews.map(r => ({
    id: r.id,
    rating: r.rating as number,
    title: r.title as string | null,
    body: r.body as string | null,
    created_at: r.created_at as string,
    is_verified: !!r.is_verified,
    vendor_response: r.vendor_response as string | null,
    vendor_responded_at: r.vendor_responded_at as string | null,
    customer_name: nameMap.get(r.user_id as string) ?? 'Kullanıcı',
    product_id: r.product_id as string,
    product_name: productMap.get(r.product_id as string)?.name ?? '—',
    product_slug: productMap.get(r.product_id as string)?.slug ?? null,
  }))

  // Sayım
  const { data: allCount } = await supabase
    .from('reviews')
    .select('id, vendor_response')
    .in('product_id', productIds)
  const pendingCount = (allCount ?? []).filter(r => !r.vendor_response).length
  const answeredCount = (allCount ?? []).filter(r => r.vendor_response).length

  const flavor = await getServerFlavor()
  if (flavor === 'estestorepro') {
    return (
      <YorumlarAppView
        reviews={items}
        durum={durum}
        pendingCount={pendingCount}
        answeredCount={answeredCount}
      />
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-5xl mx-auto px-4 pt-16 lg:pt-10 pb-16 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Müşteri Yorumları</h1>
          <p className="text-slate-400 text-base mt-2">
            Yorumlara yanıt verince ürün sayfasında diğer müşteriler de görür.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/satici/panel/yorumlar"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!durum ? 'bg-[#C9A961] text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            Tümü ({pendingCount + answeredCount})
          </Link>
          <Link href="/satici/panel/yorumlar?durum=bekleyen"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${durum === 'bekleyen' ? 'bg-[#C9A961] text-slate-900' : 'bg-slate-800 text-amber-400 hover:text-white border border-slate-700'}`}>
            ⏳ Yanıtsız ({pendingCount})
          </Link>
          <Link href="/satici/panel/yorumlar?durum=yanitli"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${durum === 'yanitli' ? 'bg-[#C9A961] text-slate-900' : 'bg-slate-800 text-emerald-400 hover:text-white border border-slate-700'}`}>
            ✓ Yanıtlı ({answeredCount})
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-slate-400">
              {durum === 'bekleyen' ? 'Yanıtsız yorum yok 🎉' : 'Henüz yorum yok.'}
            </p>
          </div>
        ) : (
          <YorumKartlari reviews={items} />
        )}
      </div>
    </main>
  )
}

function SimplePage({ title, empty }: { title: string; empty: string }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">💬</div>
        <h1 className="text-white font-bold text-xl mb-2">{title}</h1>
        <p className="text-slate-400 text-sm">{empty}</p>
        <Link href="/satici/panel" className="inline-block mt-6 text-[#C9A961] text-sm font-semibold">← Panele dön</Link>
      </div>
    </main>
  )
}
