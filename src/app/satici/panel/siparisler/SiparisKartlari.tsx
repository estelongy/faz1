'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { kargoGuncelleAction, fulfillmentGuncelleAction, etiketOlusturAction } from './siparis-actions'

interface Profile { full_name?: string | null }
interface OrderInfo {
  order_number: string
  payment_status: string
  paid_at: string | null
  address_snapshot: Record<string, string>
  user_id: string
  profiles?: Profile | null
}
interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_snapshot: { name?: string; image?: string }
  quantity: number
  unit_price: number
  line_total: number
  vendor_payout: number
  fulfillment_status: string
  tracking_number: string | null
  tracking_carrier: string | null
  shipping_label_code: string | null
  shipped_at: string | null
  created_at: string
  orders: OrderInfo
}

interface Props {
  items: OrderItem[]
  hasShippingSettings: boolean
  /** "Ayarlar tamam değil" durumda vendor'a granular mesaj (settings yok / email eksik / postal eksik). */
  shippingHint?: string | null
  /** Etiket basarken default seçim — vendor'un kargo ayarlarında işaretlediği "varsayılan". */
  defaultCarrier: string
  /** Vendor'un anlaşmalı/tercih ettiği kargolar — etiket basarken seçim menüsünde bunlar listelenir. */
  preferredCarriers: string[]
}

const ALL_CARRIERS_FALLBACK = ['Yurtiçi Kargo', 'Aras Kargo', 'MNG Kargo', 'PTT Kargo', 'Sürat Kargo', 'HepsiJet', 'Trendyol Express', 'Diğer']

export default function SiparisKartlari({ items, hasShippingSettings, shippingHint, defaultCarrier, preferredCarriers }: Props) {
  // Etiket basma & manuel kargo girişi seçim listesi — vendor sadece anlaştığı
  // kargolarla görünür. preferred yoksa (yeni hesap) tüm CARRIERS fallback.
  const CARRIERS = preferredCarriers.length > 0 ? preferredCarriers : ALL_CARRIERS_FALLBACK
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, { no: string; carrier: string }>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [showManual, setShowManual] = useState<Set<string>>(new Set())
  // Tek tek etiket basarken her item için seçili carrier (default = vendor settings'teki).
  // Vendor "bu paketi Sürat'la diğerini Aras'la" derse her item kartında ayrı dropdown'dan seçer.
  const [carrierByItem, setCarrierByItem] = useState<Record<string, string>>({})
  // Toplu etiket için tek bir carrier seçimi — hepsi aynı kargo şirketine gider.
  const [bulkCarrier, setBulkCarrier] = useState<string>(defaultCarrier)

  function carrierFor(itemId: string): string {
    return carrierByItem[itemId] ?? defaultCarrier
  }
  function setCarrier(itemId: string, carrier: string) {
    setCarrierByItem(p => ({ ...p, [itemId]: carrier }))
  }

  function setDraft(id: string, field: 'no' | 'carrier', value: string) {
    setTrackingDrafts(p => ({
      ...p,
      [id]: { ...p[id], [field]: value },
    }))
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllPreparing() {
    const eligible = items.filter(i => i.fulfillment_status === 'preparing').map(i => i.id)
    setSelected(new Set(eligible))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  function toggleManual(id: string) {
    setShowManual(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function handleStatus(itemId: string, status: 'preparing' | 'delivered' | 'cancelled') {
    startTransition(async () => {
      await fulfillmentGuncelleAction(itemId, status)
      router.refresh()
    })
  }

  function handleKargo(itemId: string) {
    const draft = trackingDrafts[itemId]
    if (!draft?.no?.trim()) return
    startTransition(async () => {
      await kargoGuncelleAction(itemId, draft.no.trim(), draft.carrier || 'Diğer')
      router.refresh()
    })
  }

  function handleEtiketTekli(itemId: string) {
    if (!hasShippingSettings) {
      setBulkError('Önce kargo ayarlarını doldur: /satici/panel/kargo')
      return
    }
    setBulkError(null)
    const carrier = carrierFor(itemId)
    startTransition(async () => {
      const res = await etiketOlusturAction([itemId], carrier)
      if (!res.ok) { setBulkError(res.error ?? 'Etiket oluşturulamadı.'); return }
      // Print sayfasını yeni sekmede aç
      window.open(`/satici/panel/siparisler/etiket/${itemId}`, '_blank')
      router.refresh()
    })
  }

  function handleEtiketToplu() {
    if (!hasShippingSettings) {
      setBulkError('Önce kargo ayarlarını doldur: /satici/panel/kargo')
      return
    }
    const ids = Array.from(selected)
    if (ids.length === 0) return
    setBulkError(null)
    startTransition(async () => {
      const res = await etiketOlusturAction(ids, bulkCarrier)
      if (!res.ok) { setBulkError(res.error ?? 'Toplu etiket oluşturulamadı.'); return }
      window.open(`/satici/panel/siparisler/etiket/toplu?ids=${ids.join(',')}`, '_blank')
      clearSelection()
      router.refresh()
    })
  }

  const eligibleCount = items.filter(i => i.fulfillment_status === 'preparing').length
  const allSelected = eligibleCount > 0 && eligibleCount === selected.size

  return (
    <div className="space-y-4">
      {/* Toplu işlem barı */}
      {!hasShippingSettings && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex items-center justify-between flex-wrap gap-2">
          <span>⚠️ {shippingHint ?? 'Kargo ayarların eksik — etiket basamazsın.'}</span>
          <a href="/satici/panel/kargo" className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg text-sm shrink-0">Ayarları Aç →</a>
        </div>
      )}

      {eligibleCount > 0 && (
        <div className="sticky top-16 z-20 p-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl flex items-center justify-between flex-wrap gap-2 shadow-lg">
          <div className="flex items-center gap-3 text-sm">
            <label className="inline-flex items-center gap-2 text-slate-300 cursor-pointer">
              <input type="checkbox"
                checked={allSelected}
                onChange={() => allSelected ? clearSelection() : selectAllPreparing()}
                className="w-4 h-4 accent-[#C9A961]" />
              <span className="font-semibold">Hepsini seç</span>
            </label>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">
              <strong className="text-white">{selected.size}</strong> / {eligibleCount} kargolanmaya hazır
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={bulkCarrier}
              onChange={e => setBulkCarrier(e.target.value)}
              disabled={CARRIERS.length <= 1}
              title="Toplu etiket için kargo şirketi"
              className="px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-semibold focus:outline-none focus:border-[#C9A961] disabled:opacity-60"
            >
              {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              onClick={handleEtiketToplu}
              disabled={selected.size === 0 || isPending}
              className="px-4 py-2 bg-gradient-to-r from-[#C9A961] to-[#B8964F] disabled:opacity-40 hover:from-[#D4B872] hover:to-[#C9A961] text-slate-900 font-bold rounded-lg text-sm transition-all"
            >
              🏷️ Toplu Etiket ({selected.size})
            </button>
          </div>
        </div>
      )}

      {bulkError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-semibold">
          {bulkError}
        </div>
      )}

      {items.map(item => {
        const snap = item.product_snapshot
        const addr = item.orders.address_snapshot
        const customerName = item.orders.profiles?.full_name ?? addr?.full_name ?? 'Müşteri'
        const expanded = expandedId === item.id

        const isSelectable = item.fulfillment_status === 'preparing'
        const isSelected = selected.has(item.id)

        return (
          <div key={item.id} className={`bg-slate-800/50 border rounded-2xl overflow-hidden transition-colors ${
            isSelected ? 'border-[#C9A961]' : 'border-slate-700'
          }`}>
            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Checkbox — sadece preparing aşamasındakiler seçilebilir */}
                {isSelectable && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item.id)}
                    className="mt-1 w-5 h-5 accent-[#C9A961] cursor-pointer shrink-0"
                  />
                )}
                {/* Thumbnail */}
                <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700">
                  {snap?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={snap.image} alt={snap.name ?? ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">📦</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-white font-bold">{snap?.name ?? 'Ürün'}</p>
                    <StatusBadge status={item.fulfillment_status} />
                  </div>
                  <div className="text-slate-500 text-sm">
                    {item.quantity} adet · ₺{Number(item.unit_price).toLocaleString('tr-TR')} birim
                  </div>
                  <div className="text-slate-400 text-sm mt-2">
                    {item.orders.order_number} · {customerName}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-slate-500 text-sm">Net Kazanç</p>
                  <p className="text-emerald-400 font-black text-lg">₺{Number(item.vendor_payout).toLocaleString('tr-TR')}</p>
                </div>
              </div>

              <button onClick={() => setExpandedId(expanded ? null : item.id)}
                className="mt-4 text-sm text-[#C9A961] hover:text-[#C9A961] transition-colors">
                {expanded ? '− Küçült' : '+ Detay & İşlemler'}
              </button>
            </div>

            {expanded && (
              <div className="px-5 pb-5 pt-0 border-t border-slate-700/50 space-y-4">
                {/* Teslim adresi */}
                <div className="bg-slate-900/50 rounded-xl p-4 text-sm">
                  <p className="text-slate-500 text-sm uppercase tracking-wider mb-2">Teslimat Adresi</p>
                  <p className="text-white font-medium">{addr?.full_name}</p>
                  <p className="text-slate-400 text-sm mt-0.5">{addr?.phone}</p>
                  <p className="text-slate-300 mt-2">
                    {addr?.address_line}, {addr?.neighborhood && `${addr.neighborhood}, `}
                    {addr?.district} / {addr?.city}
                    {addr?.postal_code && ` · ${addr.postal_code}`}
                  </p>
                </div>

                {/* Aksiyon butonları */}
                {item.fulfillment_status === 'pending' && (
                  <button onClick={() => handleStatus(item.id, 'preparing')}
                    disabled={isPending}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-all">
                    📦 Hazırlamaya Başla
                  </button>
                )}

                {item.fulfillment_status === 'preparing' && (
                  <div className="space-y-3">
                    {/* Kargo şirketi seçimi (vendor anlaşmalı listeden) — her paket farklı kargo şirketine gidebilir */}
                    {CARRIERS.length > 1 && (
                      <div className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-lg">
                        <span className="text-slate-500 text-xs uppercase tracking-wide shrink-0">Kargo:</span>
                        <select
                          value={carrierFor(item.id)}
                          onChange={e => setCarrier(item.id, e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-semibold focus:outline-none focus:border-[#C9A961]"
                        >
                          {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Tek tıkla etiket — birincil aksiyon */}
                    <button
                      onClick={() => handleEtiketTekli(item.id)}
                      disabled={isPending || !hasShippingSettings}
                      className="w-full py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:from-[#D4B872] hover:to-[#C9A961] disabled:opacity-40 text-slate-900 font-bold rounded-xl text-base shadow-lg shadow-[#C9A961]/20 transition-all"
                    >
                      🏷️ Etiket Oluştur & Yazdır {CARRIERS.length > 1 && <span className="opacity-70 text-sm">({carrierFor(item.id)})</span>}
                    </button>

                    {/* Manuel kargo girişi — opsiyonel */}
                    <button
                      onClick={() => toggleManual(item.id)}
                      className="w-full text-slate-400 hover:text-slate-200 text-sm font-semibold py-1 transition-colors"
                    >
                      {showManual.has(item.id) ? '− Manuel girişi kapat' : '+ Kendi kargo numaramı girmek istiyorum'}
                    </button>

                    {showManual.has(item.id) && (
                      <div className="space-y-2 p-3 bg-slate-900/50 rounded-xl">
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={trackingDrafts[item.id]?.carrier ?? 'Yurtiçi Kargo'}
                            onChange={e => setDraft(item.id, 'carrier', e.target.value)}
                            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A961]">
                            {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <input type="text"
                            value={trackingDrafts[item.id]?.no ?? ''}
                            onChange={e => setDraft(item.id, 'no', e.target.value)}
                            placeholder="Takip numarası"
                            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A961]" />
                        </div>
                        <button onClick={() => handleKargo(item.id)}
                          disabled={isPending || !trackingDrafts[item.id]?.no?.trim()}
                          className="w-full py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white font-semibold rounded-lg text-sm">
                          🚚 Kargoya Verdim (Manuel)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {item.fulfillment_status === 'shipped' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-[#C9A961]/10 border border-[#C9A961]/30 rounded-xl">
                      <p className="text-[#C9A961] text-sm font-medium">Kargoda</p>
                      <p className="text-slate-400 text-sm mt-1">
                        {item.tracking_carrier} · <span className="font-mono">{item.tracking_number}</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {item.shipping_label_code && (
                        <a href={`/satici/panel/siparisler/etiket/${item.id}`} target="_blank" rel="noopener"
                          className="py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-sm text-center transition-colors">
                          🖨 Etiketi Yeniden Yazdır
                        </a>
                      )}
                      <button onClick={() => handleStatus(item.id, 'delivered')}
                        disabled={isPending}
                        className={`py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm ${
                          item.shipping_label_code ? '' : 'col-span-2'
                        }`}>
                        ✓ Teslim Edildi
                      </button>
                    </div>
                  </div>
                )}

                {item.fulfillment_status === 'delivered' && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm text-center">
                    ✓ Teslim edildi
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:    { label: 'Bekliyor',   cls: 'bg-[#C9A961]/20 text-[#C9A961]' },
    preparing:  { label: 'Hazırlanıyor', cls: 'bg-blue-500/20 text-blue-400' },
    shipped:    { label: 'Kargoda',    cls: 'bg-[#C9A961]/20 text-[#C9A961]' },
    delivered:  { label: 'Teslim',     cls: 'bg-emerald-500/20 text-emerald-400' },
    cancelled:  { label: 'İptal',      cls: 'bg-red-500/20 text-red-400' },
    returned:   { label: 'İade',       cls: 'bg-slate-500/20 text-slate-400' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-slate-700 text-slate-400' }
  return <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
}
