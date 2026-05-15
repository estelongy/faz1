export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({ params }: { params: Promise<{ vendorId: string }> }): Promise<Metadata> {
  const { vendorId } = await params
  const supabase = await createClient()
  const { data: vendor } = await supabase
    .from('vendors')
    .select('company_name')
    .eq('id', vendorId)
    .single()
  return {
    title: vendor?.company_name ? `${vendor.company_name} — EsteStore` : 'İş Ortağı',
  }
}

// EsteStore ana kategori (DB enum) etiketleri.
// Alt-kategori detayı ürün kartında ayrıca göstermek yerine ana kategori burada yeterli.
const CATEGORY_LABELS: Record<string, string> = {
  kozmetik:      'Kozmetik',
  sarf_medikal:  'Sarf & Medikal',
  // Legacy fallback
  botox: 'Botoks', filler: 'Dolgu', mezo: 'Mezoterapi', laser: 'Lazer',
  gold_needle: 'Altın İğne', peeling: 'Peeling', serum: 'Serum',
  supplement: 'Takviye', device: 'Cihaz', other: 'Diğer',
}

export default async function SaticiMagazaPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params
  const supabase = await createClient()

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name, approval_status')
    .eq('id', vendorId)
    .eq('approval_status', 'approved')
    .single()

  if (!vendor) notFound()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, description, category, price, final_score, preference_count, treatment_type, images')
    .eq('vendor_id', vendor.id)
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .order('final_score', { ascending: false })

  const totalProducts = products?.length ?? 0
  const avgScore = products && products.length > 0
    ? products.reduce((s, p) => s + Number(p.final_score ?? 0), 0) / products.length
    : null

  return (
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-[#0F172A] border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/estestore" className="text-slate-300 hover:text-white transition-colors text-base font-semibold">← EsteStore</Link>
          <span className="text-slate-700">|</span>
          <span className="text-white text-base font-bold truncate">{vendor.company_name}</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        {/* İş Ortağı banner */}
        <div className="mb-10 p-8 rounded-3xl bg-gradient-to-br from-[#C9A961]/15 via-[#C9A961]/5 to-transparent border border-[#C9A961]/30">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C9A961] to-[#8B7339] flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-[-0.02em]">{vendor.company_name}</h1>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#8B7339] mb-4">Estelongy Onaylı İş Ortağı</p>

              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Ürün Sayısı</p>
                  <p className="text-slate-900 font-black text-xl mt-1">{totalProducts}</p>
                </div>
                {avgScore !== null && (
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Ortalama EGP</p>
                    <p className={`font-black text-xl mt-1 ${
                      avgScore >= 9 ? 'text-[#10876B]' : avgScore >= 7 ? 'text-[#8B7339]' : 'text-red-500'
                    }`}>
                      {avgScore.toFixed(1)}<span className="text-slate-400 text-sm font-bold ml-0.5">/10</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ürünler */}
        {products && products.length > 0 ? (
          <>
            <h2 className="text-slate-900 font-bold text-xl mb-4 tracking-[-0.01em]">Ürünler <span className="text-slate-400 font-medium">({totalProducts})</span></h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map(p => (
                <Link key={p.id} href={`/estestore/${p.slug ?? p.id}`}
                  className="group bg-white border border-slate-200 hover:border-[#C9A961]/60 rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-0.5">
                  <div className="h-44 bg-slate-100 flex items-center justify-center relative">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-300 text-5xl">✦</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-slate-900 font-semibold text-base group-hover:text-[#8B7339] transition-colors line-clamp-2 leading-snug">{p.name}</h3>
                    {p.category && (
                      <p className="text-sm font-bold text-slate-500 mt-1">{CATEGORY_LABELS[p.category] ?? p.category}</p>
                    )}
                    <div className="flex items-end justify-between mt-3">
                      {p.price && (
                        <span className="text-slate-900 font-black text-base">₺{Number(p.price).toLocaleString('tr-TR')}</span>
                      )}
                      {p.final_score && (
                        <span className={`font-bold text-sm ${
                          p.final_score >= 9 ? 'text-[#10876B]' :
                          p.final_score >= 7 ? 'text-[#8B7339]' : 'text-red-500'
                        }`}>★ {Number(p.final_score).toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4 text-slate-300">📦</div>
            <p className="text-base font-semibold text-slate-500">Bu mağazada henüz aktif ürün yok</p>
          </div>
        )}
      </div>
    </main>
  )
}
