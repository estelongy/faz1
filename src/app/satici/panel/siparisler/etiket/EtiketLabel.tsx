'use client'

import { useEffect } from 'react'

interface Settings {
  sender_name: string
  sender_phone: string
  sender_email: string | null
  sender_address_line: string
  sender_district: string
  sender_city: string
  sender_postal_code: string | null
  default_carrier: string
  note: string | null
}

interface LabelItem {
  orderItemId: string
  orderNumber: string
  labelCode: string
  carrier: string
  product: { name?: string }
  quantity: number
  address: Record<string, string>
}

interface Props {
  settings: Settings
  items: LabelItem[]
}

/**
 * Print-friendly kargo etiketi. Yazdırılınca her etiket A6 boyutu civarı.
 * Tarayıcı print dialogu otomatik açılır.
 */
export default function EtiketLabel({ settings, items }: Props) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500)
    return () => clearTimeout(t)
  }, [])

  return (
    <main className="min-h-screen bg-slate-100 print:bg-white">
      {/* Üst bar — yazdırma sırasında gizlenir */}
      <header className="print:hidden sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <a href="/satici/panel/siparisler" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            ← Siparişlere Dön
          </a>
          <p className="text-slate-700 text-sm font-semibold">
            {items.length} etiket hazır
          </p>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white text-sm font-bold rounded-lg"
          >
            🖨 Yazdır
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 print:p-0 print:max-w-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:gap-0 print:grid-cols-2">
          {items.map(item => (
            <LabelBox key={item.orderItemId} settings={settings} item={item} />
          ))}
        </div>
      </div>

      <style jsx global>{`
        @page { size: A4; margin: 8mm; }
        @media print {
          html, body { background: white; }
          .page-break-after { page-break-after: always; }
        }
      `}</style>
    </main>
  )
}

function LabelBox({ settings, item }: { settings: Settings; item: LabelItem }) {
  const addr = item.address ?? {}
  return (
    <div className="bg-white border-2 border-slate-900 rounded-none p-4 text-slate-900 text-sm flex flex-col break-inside-avoid print:border print:p-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Estelongy</p>
          <p className="text-lg font-black leading-tight">{item.carrier}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-slate-500">Etiket No</p>
          <p className="font-mono font-black text-base">{item.labelCode}</p>
        </div>
      </div>

      {/* Barkod simülasyonu */}
      <div className="border border-slate-900 p-2 mb-3 text-center">
        <BarcodeFromCode code={item.labelCode} />
        <p className="font-mono text-sm mt-1 font-bold">{item.labelCode}</p>
      </div>

      {/* GÖNDERİCİ */}
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Gönderici</p>
        <p className="font-bold text-base">{settings.sender_name}</p>
        <p className="text-sm">{settings.sender_address_line}</p>
        <p className="text-sm">
          {settings.sender_district} / {settings.sender_city}
          {settings.sender_postal_code ? ` · ${settings.sender_postal_code}` : ''}
        </p>
        <p className="text-sm">📞 {settings.sender_phone}</p>
      </div>

      {/* ALICI */}
      <div className="mb-3 p-2 bg-slate-100 border border-slate-300 rounded">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-700 mb-1">Alıcı</p>
        <p className="font-black text-lg leading-tight">{addr.full_name ?? '—'}</p>
        <p className="text-sm">{addr.address_line ?? ''}</p>
        {addr.neighborhood && <p className="text-sm">{addr.neighborhood}</p>}
        <p className="text-sm font-semibold">
          {addr.district ?? ''} / {addr.city ?? ''}
          {addr.postal_code ? ` · ${addr.postal_code}` : ''}
        </p>
        <p className="text-sm font-bold mt-1">📞 {addr.phone ?? '—'}</p>
      </div>

      {/* İçerik */}
      <div className="mt-auto pt-2 border-t border-slate-300 text-sm">
        <p className="text-xs uppercase tracking-wider text-slate-500">İçerik</p>
        <p className="font-semibold leading-tight line-clamp-2">
          {item.product?.name ?? 'Ürün'} <span className="text-slate-500 font-normal">× {item.quantity}</span>
        </p>
        <div className="flex items-baseline justify-between mt-1">
          <p className="text-xs text-slate-500">Sipariş</p>
          <p className="font-mono text-sm font-bold">{item.orderNumber}</p>
        </div>
        {settings.note && (
          <p className="mt-2 px-2 py-1 bg-amber-50 border border-amber-300 text-xs text-amber-900 font-semibold rounded">
            ⚠ {settings.note}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Basit barkod görseli — gerçek 1D/2D barkod değil, kod karakterleri
 * üzerinden deterministik dikey çizgi paterni. Cargo şirketi gerçek
 * barkod istiyorsa ileride JsBarcode kütüphanesi eklenebilir.
 */
function BarcodeFromCode({ code }: { code: string }) {
  // Her karakterin char-code'undan dikey çizgi kalınlığı türet
  const bars: Array<{ w: number; black: boolean }> = []
  for (let i = 0; i < code.length; i++) {
    const c = code.charCodeAt(i)
    bars.push({ w: ((c % 3) + 1), black: true })
    bars.push({ w: ((c % 2) + 1), black: false })
  }
  return (
    <div className="flex items-stretch h-12 mx-auto" style={{ width: 'max-content' }}>
      {bars.map((b, i) => (
        <div
          key={i}
          style={{
            width: `${b.w}px`,
            background: b.black ? '#0f172a' : 'white',
          }}
        />
      ))}
    </div>
  )
}
