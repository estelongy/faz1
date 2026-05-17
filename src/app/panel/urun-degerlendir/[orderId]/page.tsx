import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BackButton from '@/components/BackButton'
import UrunDegerlendirForm from './UrunDegerlendirForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Ürünleri Değerlendir | EsteStore' }

interface Props {
  params: Promise<{ orderId: string }>
}

export default async function UrunDegerlendirPage({ params }: Props) {
  const { orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/giris?g=estestore&next=/panel/urun-degerlendir/${orderId}`)

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, user_id, order_number')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!order) notFound()

  if (order.status !== 'delivered') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="flex flex-col items-center justify-center py-32 gap-4 px-4 text-center">
          <div className="text-5xl opacity-40">⏳</div>
          <h1 className="text-xl font-bold text-white">Sipariş henüz teslim edilmedi</h1>
          <p className="text-slate-400 text-sm">Ürünler teslim edildikten sonra değerlendirebilirsin.</p>
        </div>
      </main>
    )
  }

  // Sipariş ürünleri
  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, product_snapshot')
    .eq('order_id', orderId)

  if (!items || items.length === 0) notFound()

  // Daha önce değerlendirilen ürünler
  const productIds = [...new Set(items.map(i => i.product_id).filter(Boolean))]
  const { data: existing } = await supabase
    .from('egp_reviews')
    .select('product_id')
    .eq('user_id', user.id)
    .in('product_id', productIds)

  const reviewedSet = new Set((existing ?? []).map(r => r.product_id))

  const products = productIds.map(pid => {
    const item = items.find(i => i.product_id === pid)
    const snap = item?.product_snapshot as { name?: string; cover_image_url?: string; images?: string[] } | null
    return {
      productId: pid,
      name: snap?.name ?? 'Ürün',
      imageUrl: snap?.cover_image_url ?? snap?.images?.[0],
      alreadyReviewed: reviewedSet.has(pid),
    }
  })

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 lg:left-[72px] right-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <BackButton href="/panel/siparislerim" label="Siparişlerim" />
          <span className="text-slate-700">|</span>
          <span className="text-white text-sm font-bold">Değerlendir</span>
        </div>
      </header>
      <UrunDegerlendirForm orderId={orderId} products={products} />
    </main>
  )
}
