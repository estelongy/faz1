export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import UrunEkleForm from './UrunEkleForm'
import { getVendorStats } from '@/lib/vendor-stats'

export const metadata: Metadata = { title: 'İş Ortağı Paneli — Estelongy' }

const CATEGORY_LABELS: Record<string, string> = {
  // EsteStore ana kategoriler
  kozmetik: 'Kozmetik',
  sarf_medikal: 'Sarf & Medikal',
  // Eski/legacy değerler için fallback
  botox: 'Botoks', filler: 'Dolgu', mezo: 'Mezoterapi', laser: 'Lazer',
  gold_needle: 'Altın İğne', peeling: 'Peeling', serum: 'Serum',
  supplement: 'Takviye', device: 'Cihaz', other: 'Diğer',
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:  { label: 'İncelemede', cls: 'bg-[#C9A961]/20 text-[#C9A961]' },
    approved: { label: 'Onaylı',     cls: 'bg-emerald-500/20 text-emerald-400' },
    rejected: { label: 'Reddedildi', cls: 'bg-red-500/20 text-red-400' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-slate-700 text-slate-400' }
  return <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
}

async function handleSignOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export default async function SaticiPanelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin' || role === 'clinic') redirect(pathForRole(role))

  // İş Ortağı kaydını bul
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name, approval_status, kyc_status, kyc_review_note, stripe_account_id, stripe_charges_enabled')
    .eq('user_id', user.id)
    .single()

  if (!vendor) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-white font-bold text-xl mb-2">İş Ortağı Hesabı Bulunamadı</h1>
          <p className="text-slate-400 text-sm mb-6">Ürün eklemek için önce iş ortağı başvurusu yapmanız gerekiyor.</p>
          <Link href="/satici/basvur"
            className="px-6 py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] text-white font-semibold rounded-xl text-base">
            İş Ortağı Başvurusu Yap →
          </Link>
        </div>
      </main>
    )
  }

  // ── KYC zorunluluğu — approved öncesi şart ──
  if (vendor.kyc_status === 'not_submitted' || vendor.kyc_status === 'rejected') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📋</div>
          <h1 className="text-white font-bold text-xl mb-2">
            {vendor.kyc_status === 'rejected' ? 'KYC Reddedildi — Düzelt' : 'KYC Bilgileri Gerekli'}
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            Satışa başlamak için vergi levhası, banka bilgisi ve sözleşme onayı gerekiyor.
          </p>
          <Link href="/satici/panel/kyc"
            className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-90 text-white font-semibold rounded-xl text-base">
            KYC Formuna Git →
          </Link>
        </div>
      </main>
    )
  }

  if (vendor.kyc_status === 'pending') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-white font-bold text-xl mb-2">KYC İncelemede</h1>
          <p className="text-slate-400 text-sm mb-4">
            KYC bilgileriniz admin onayında. Onay sonrası satışa başlayabilirsiniz (1-2 iş günü).
          </p>
          <Link href="/satici/panel/kyc" className="text-[#C9A961] hover:underline text-base font-semibold">
            Gönderilen bilgileri gör →
          </Link>
        </div>
      </main>
    )
  }

  // Vendor approval (eski akış) — KYC onaylı + admin tarafından vendor approved
  if (vendor.approval_status === 'pending') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-white font-bold text-xl mb-2">Başvurunuz İnceleniyor</h1>
          <p className="text-slate-400 text-sm">KYC&apos;niz onaylandı, son admin onayı bekleniyor.</p>
        </div>
      </main>
    )
  }

  if (vendor.approval_status !== 'approved') {
    notFound()
  }

  // Ürünleri getir
  const { data: products } = await supabase
    .from('products')
    .select('id, name, category, price, stock, final_score, approval_status, treatment_type, is_active, images, created_at')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  const totalProducts = products?.length ?? 0
  const approvedCount = products?.filter(p => p.approval_status === 'approved').length ?? 0
  const pendingCount  = products?.filter(p => p.approval_status === 'pending').length ?? 0

  // Satış analitikleri (bu ay, geçen ay, top ürünler)
  const stats = await getVendorStats(vendor.id)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white font-black text-lg tracking-tight">ESTELONGY</Link>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400 text-sm">İş Ortağı Paneli</span>
          </div>
          <div className="flex items-center gap-4">
            <form action={handleSignOut}>
              <button type="submit" className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-700 hover:border-red-400/50 hover:bg-red-500/10 text-slate-300 hover:text-red-400 text-base font-medium transition-colors">Çıkış Yap</button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        {/* Başlık */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">{vendor.company_name}</h1>
          <p className="text-slate-400 text-sm mt-1">Ürün ve işlem yönetiminiz</p>
        </div>

        {/* Bu ay satış KPI satırı */}
        <div className="mb-6 bg-gradient-to-br from-slate-800/70 to-slate-800/30 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Bu Ay</p>
              <p className="text-slate-500 text-sm mt-0.5">
                {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            {stats.grossChangePct !== null && (
              <div className={`px-3 py-1 rounded-lg text-sm font-bold ${
                stats.grossChangePct >= 0
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-red-500/15 text-red-400'
              }`}>
                {stats.grossChangePct >= 0 ? '↑' : '↓'} %{Math.abs(stats.grossChangePct)} geçen aya göre
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Ciro</p>
              <p className="text-2xl font-black text-white">₺{stats.thisMonth.gross.toLocaleString('tr-TR')}</p>
              <p className="text-slate-600 text-xs mt-0.5">geçen ay ₺{stats.lastMonth.gross.toLocaleString('tr-TR')}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Net Kazanç</p>
              <p className="text-2xl font-black text-emerald-400">₺{stats.thisMonth.net.toLocaleString('tr-TR')}</p>
              <p className="text-slate-600 text-xs mt-0.5">komisyondan sonra</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Sipariş</p>
              <p className="text-2xl font-black text-white">{stats.thisMonth.count}</p>
              <p className="text-slate-600 text-xs mt-0.5">geçen ay {stats.lastMonth.count}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Bekleyen</p>
              <p className="text-2xl font-black text-[#C9A961]">{stats.pendingItems + stats.shippedItems}</p>
              <p className="text-slate-600 text-xs mt-0.5">{stats.pendingItems} hazırlık · {stats.shippedItems} kargoda</p>
            </div>
          </div>
        </div>

        {/* Ürün özet kartlar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-white">{totalProducts}</p>
            <p className="text-slate-400 text-sm mt-1">Toplam Ürün</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-emerald-400">{approvedCount}</p>
            <p className="text-slate-400 text-sm mt-1">Onaylı</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-[#C9A961]">{pendingCount}</p>
            <p className="text-slate-400 text-sm mt-1">İncelemede</p>
          </div>
          <Link href="/satici/panel/siparisler"
            className="bg-gradient-to-br from-[#C9A961]/20 to-[#B8964F]/20 hover:from-[#C9A961]/30 hover:to-[#B8964F]/30 border border-[#C9A961]/30 rounded-2xl p-5 text-center transition-all group">
            <p className="text-3xl font-black text-[#C9A961] group-hover:text-white transition-colors">📦</p>
            <p className="text-[#C9A961] text-sm font-bold mt-1 uppercase tracking-wider">Siparişlerim</p>
          </Link>
        </div>

        {/* Alt navigasyon linkleri */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link href="/satici/panel/kazanc"
            className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-2xl transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl">💰</div>
            <div>
              <p className="text-white font-bold text-sm">Kazançlarım</p>
              <p className="text-slate-500 text-sm mt-0.5">Satış + komisyon özeti</p>
            </div>
          </Link>
          <Link href="/satici/panel/odeme-hesabi"
            className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-2xl transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl">💳</div>
            <div>
              <p className="text-white font-bold text-sm">Ödeme Hesabı</p>
              <p className="text-slate-500 text-sm mt-0.5">Stripe · banka bilgileri</p>
            </div>
          </Link>
          <Link href="/satici/panel/iadeler"
            className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-[#C9A961]/50 rounded-2xl transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A961]/10 flex items-center justify-center text-xl">↩</div>
            <div>
              <p className="text-white font-bold text-sm">İade Talepleri</p>
              <p className="text-slate-500 text-sm mt-0.5">Müşteri iade yönetimi</p>
            </div>
          </Link>
          <Link href="/satici/panel/kargo"
            className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-violet-500/50 rounded-2xl transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-xl">🚚</div>
            <div>
              <p className="text-white font-bold text-sm">Kargo Ayarları</p>
              <p className="text-slate-500 text-sm mt-0.5">Gönderici · tek tık etiket</p>
            </div>
          </Link>
          <Link href="/satici/panel/magaza"
            className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-rose-500/50 rounded-2xl transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-xl">🏪</div>
            <div>
              <p className="text-white font-bold text-sm">Mağaza Vitrini</p>
              <p className="text-slate-500 text-sm mt-0.5">Logo · banner · hakkımızda</p>
            </div>
          </Link>
        </div>

        {/* Ödeme hesabı uyarı banner — henüz stripe_account_id yoksa */}
        {!vendor.stripe_account_id && (
          <Link href="/satici/panel/odeme-hesabi"
            className="flex items-center gap-3 mb-8 p-4 bg-gradient-to-r from-[#C9A961]/10 to-[#B8964F]/10 border border-[#C9A961]/30 rounded-2xl hover:border-[#C9A961]/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#C9A961]/20 flex items-center justify-center text-xl shrink-0">💳</div>
            <div className="flex-1">
              <p className="text-[#D4B872] font-bold text-sm">Ödeme hesabı kur</p>
              <p className="text-slate-400 text-sm mt-0.5">Müşteri ödemelerini alabilmek için Stripe üzerinden hesap oluştur</p>
            </div>
            <svg className="w-5 h-5 text-[#C9A961]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}

        {/* En çok satan ürünler */}
        {stats.topProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-white font-bold text-lg mb-4">En Çok Satan Ürünlerin</h2>
            <div className="space-y-2">
              {stats.topProducts.map((p, idx) => (
                <div key={p.productId} className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                    <span className={`text-sm font-black ${
                      idx === 0 ? 'text-[#C9A961]' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-[#B8964F]' : 'text-slate-500'
                    }`}>#{idx + 1}</span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-600 text-sm">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{p.quantity} adet satıldı</p>
                  </div>
                  <p className="text-emerald-400 font-bold text-sm shrink-0">
                    ₺{p.gross.toLocaleString('tr-TR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ürün Ekle Formu */}
        <div className="mb-10">
          <h2 className="text-white font-bold text-lg mb-4">Yeni Ürün / İşlem Ekle</h2>
          <UrunEkleForm vendorId={vendor.id} />
        </div>

        {/* Ürün Listesi */}
        <div>
          <h2 className="text-white font-bold text-lg mb-4">Ürünlerim</h2>

          {products && products.length > 0 ? (
            <div className="space-y-3">
              {products.map(product => {
                const cover = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null
                return (
                  <Link key={product.id} href={`/satici/panel/urunler/${product.id}/duzenle`}
                    className="flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-[#C9A961]/50 rounded-2xl transition-all">
                    {/* Thumbnail */}
                    <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    {/* Bilgi */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-medium text-sm truncate">{product.name}</span>
                        <StatusBadge status={product.approval_status} />
                        {product.treatment_type === 'treatment' && (
                          <span className="text-sm bg-[#C9A961]/20 text-[#C9A961] px-2 py-0.5 rounded-full">Klinik İşlem</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        {product.category && <span>{CATEGORY_LABELS[product.category] ?? product.category}</span>}
                        {product.price && <span>₺{Number(product.price).toLocaleString('tr-TR')}</span>}
                        {product.stock != null && <span>Stok: {product.stock}</span>}
                        {product.final_score && (
                          <span className={
                            product.final_score >= 9 ? 'text-emerald-400' :
                            product.final_score >= 7 ? 'text-[#C9A961]' : 'text-red-400'
                          }>
                            ★ {product.final_score.toFixed(1)}/10
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Durum + ok */}
                    <div className="shrink-0 flex items-center gap-3">
                      <span className={`text-sm px-2 py-0.5 rounded-full ${product.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700 text-slate-500'}`}>
                        {product.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-600">
              <div className="text-4xl mb-3">📦</div>
              <p>Henüz ürün eklenmemiş</p>
              <p className="text-sm mt-1">Yukarıdaki formu kullanarak ürün ekleyebilirsiniz.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
