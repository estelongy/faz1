'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart, groupByVendor } from '@/lib/cart'

export default function SepetPage() {
  const router = useRouter()
  const { items, hydrated, subtotal, update, remove, clear } = useCart()

  const grouped = groupByVendor(items)
  const vendorKeys = Object.keys(grouped)
  const empty = hydrated && items.length === 0

  return (
    <main className="min-h-screen bg-[#FAFAF7]">
      <header className="web-only fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/estestore" className="text-base font-semibold text-slate-300 hover:text-white transition-colors">
              ← EsteStore
            </Link>
            <span className="text-slate-700">|</span>
            <span className="text-white text-base font-bold">Sepetim</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-6 lg:pt-24 pb-32 lg:pb-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-[-0.02em]">Sepetim</h1>
            <p className="text-base text-slate-600 mt-1">
              {hydrated && items.length > 0 && `${items.reduce((n,i)=>n+i.quantity,0)} ürün`}
            </p>
          </div>
          {hydrated && items.length > 0 && (
            <button onClick={clear}
              className="text-base font-semibold text-slate-500 hover:text-red-600 transition-colors">
              Sepeti Boşalt
            </button>
          )}
        </div>

        {!hydrated ? (
          <div className="py-24 text-center text-base text-slate-500">Yükleniyor...</div>
        ) : empty ? (
          <div className="py-24 text-center">
            <div className="text-slate-300 text-6xl mb-4">🛒</div>
            <p className="text-lg font-semibold text-slate-700 mb-2">Sepetin boş</p>
            <p className="text-base text-slate-500 mb-6">EsteStore’dan ürün seçerek başla</p>
            <Link href="/estestore"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:from-[#D4B872] hover:to-[#C9A961] text-[#0F172A] text-base font-semibold rounded-xl transition-all shadow-lg shadow-[#C9A961]/20">
              EsteStore’a Git →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sol — İş Ortağı bazlı gruplandırılmış ürün listesi */}
            <div className="lg:col-span-2 space-y-6">
              {vendorKeys.map(vendorId => {
                const vendorItems = grouped[vendorId]
                const vendorName = vendorItems[0]?.vendorName ?? 'Estelongy İş Ortağı'
                const vendorTotal = vendorItems.reduce((s, i) => s + i.price * i.quantity, 0)
                return (
                  <div key={vendorId} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-[#FAFAF7]">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#8B7339]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
                        </svg>
                        <span className="text-slate-700 text-base font-semibold">{vendorName}</span>
                      </div>
                      <span className="text-slate-700 text-base font-bold">₺{vendorTotal.toLocaleString('tr-TR')}</span>
                    </div>

                    <div className="divide-y divide-slate-200">
                      {vendorItems.map(item => (
                        <div key={item.productId} className="flex gap-4 p-4">
                          <Link href={item.slug ? `/estestore/${item.slug}` : '/estestore'}
                            className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center">
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </Link>

                          <div className="flex-1 min-w-0">
                            <Link href={item.slug ? `/estestore/${item.slug}` : '/estestore'}
                              className="text-slate-900 font-semibold text-base hover:text-[#8B7339] transition-colors line-clamp-2">
                              {item.name}
                            </Link>
                            <p className="text-slate-500 text-sm font-bold mt-1">
                              ₺{item.price.toLocaleString('tr-TR')} · birim
                            </p>

                            <div className="flex items-center justify-between mt-3 gap-3">
                              {/* Miktar kontrol */}
                              <div className="flex items-center gap-2 bg-[#FAFAF7] border border-slate-200 rounded-lg p-1">
                                <button onClick={() => update(item.productId, item.quantity - 1)}
                                  className="w-7 h-7 text-base font-semibold text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors flex items-center justify-center">
                                  −
                                </button>
                                <span className="w-6 text-center text-slate-900 text-base font-semibold">{item.quantity}</span>
                                <button onClick={() => update(item.productId, item.quantity + 1)}
                                  className="w-7 h-7 text-base font-semibold text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors flex items-center justify-center">
                                  +
                                </button>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-slate-900 font-bold text-base">
                                  ₺{(item.price * item.quantity).toLocaleString('tr-TR')}
                                </span>
                                <button onClick={() => remove(item.productId)}
                                  className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                  aria-label="Ürünü kaldır">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Sağ — Özet (desktop) */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-slate-900 font-bold text-lg mb-4">Sipariş Özeti</h2>

                <div className="space-y-3 text-base mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ara Toplam</span>
                    <span className="text-slate-900 font-semibold">₺{subtotal.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Kargo</span>
                    <span className="text-slate-500 text-sm font-bold">Ödeme adımında</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="text-slate-900 font-semibold">Toplam</span>
                    <span className="text-slate-900 font-black text-xl">₺{subtotal.toLocaleString('tr-TR')}</span>
                  </div>
                </div>

                <button onClick={() => router.push('/odeme')}
                  className="w-full py-4 bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:from-[#D4B872] hover:to-[#C9A961] text-[#0F172A] font-bold rounded-xl transition-all text-base shadow-lg shadow-[#C9A961]/20">
                  Ödemeye Geç →
                </button>

                <div className="mt-4 flex items-start gap-2 text-slate-600 text-sm font-bold leading-relaxed">
                  <svg className="w-4 h-4 text-[#10876B] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>
                    Güvenli ödeme (Stripe) · 15 gün cayma hakkı · Her iş ortağı kendi kargosunu organize eder
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky bottom bar — yalnız mobile/app */}
      {hydrated && items.length > 0 && (
        <div
          className="lg:hidden fixed inset-x-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
          style={{ bottom: 'calc(60px + env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Toplam</p>
              <p className="text-slate-900 font-black text-lg tabular-nums leading-tight">
                ₺{subtotal.toLocaleString('tr-TR')}
              </p>
            </div>
            <button
              onClick={() => router.push('/odeme')}
              className="px-5 py-3.5 bg-gradient-to-r from-[#C9A961] to-[#B8964F] active:from-[#D4B872] active:to-[#C9A961] text-[#0F172A] font-bold rounded-xl text-sm shadow-md shadow-[#C9A961]/30"
            >
              Ödemeye Geç →
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
