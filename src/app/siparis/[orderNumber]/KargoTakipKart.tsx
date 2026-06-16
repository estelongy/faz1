'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { carrierTrackingUrl, trackingLabel } from '@/lib/kargo-tracking'
import { teslimAldimAction } from './teslim-action'

interface Props {
  orderNumber: string
  orderItemIds: string[]            // bu vendor'a ait kalem id'leri
  trackingNumber: string | null
  carrier: string | null
  shippedAt: string | null          // ISO
  fulfillmentStatus: string         // shipped | delivered | preparing | pending | cancelled | returned
  canConfirmDelivery: boolean       // sadece kayıtlı kullanıcı + shipped durumunda true
}

const STATUS_META: Record<string, { label: string; chip: string; line: string }> = {
  pending:    { label: 'Hazırlanacak',     chip: 'bg-amber-50 text-amber-700 border-amber-200',     line: 'İş Ortağı kısa süre içinde hazırlığa başlayacak.' },
  preparing:  { label: 'Hazırlanıyor',     chip: 'bg-blue-50 text-blue-700 border-blue-200',         line: 'İş Ortağı paketi hazırlıyor — yakında kargoya verilecek.' },
  shipped:    { label: 'Kargoya Verildi',  chip: 'bg-[#C9A961]/15 text-[#8B7339] border-[#C9A961]/40',     line: 'Paket yola çıktı. Aşağıdaki takip numarasıyla kargo şirketinden anlık konumu görebilirsin.' },
  delivered:  { label: 'Teslim Edildi',    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', line: 'Paket teslim alındı. İade hakkın 14 gün boyunca açık.' },
  cancelled:  { label: 'İptal Edildi',     chip: 'bg-red-50 text-red-700 border-red-200',           line: 'Bu kalem iptal edildi.' },
  returned:   { label: 'İade',             chip: 'bg-slate-100 text-slate-700 border-slate-300',         line: 'Bu kalem için iade tamamlandı.' },
}

export default function KargoTakipKart({
  orderNumber, orderItemIds, trackingNumber, carrier, shippedAt,
  fulfillmentStatus, canConfirmDelivery,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const meta = STATUS_META[fulfillmentStatus] ?? STATUS_META.pending
  const url = carrierTrackingUrl(carrier, trackingNumber)
  const label = trackingLabel(carrier, trackingNumber)

  function copy() {
    if (!trackingNumber) return
    navigator.clipboard.writeText(trackingNumber).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  function handleTeslimAldim() {
    if (!confirm) {
      setConfirm(true)
      setTimeout(() => setConfirm(false), 4000)
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await teslimAldimAction(orderItemIds, orderNumber)
      if (!res.ok) {
        setError(res.error ?? 'İşlem başarısız.')
        setConfirm(false)
        return
      }
      router.refresh()
    })
  }

  // shipped'dan önceki aşamalar — sadece durum satırı
  if (fulfillmentStatus !== 'shipped' && fulfillmentStatus !== 'delivered') {
    return (
      <div className="px-5 py-3 bg-[#FAFAF7] border-t border-slate-200">
        <div className="flex items-center gap-2">
          <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${meta.chip}`}>
            {meta.label}
          </span>
        </div>
        <p className="text-slate-600 text-sm mt-2">{meta.line}</p>
      </div>
    )
  }

  // shipped veya delivered — kargo takip kartı
  return (
    <div className="px-5 py-4 bg-[#FAFAF7] border-t border-slate-200">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${meta.chip}`}>
          {meta.label}
        </span>
        {shippedAt && (
          <span className="text-slate-500 text-xs">
            {new Date(shippedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} tarihinde
          </span>
        )}
      </div>

      {trackingNumber && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">{label}</p>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#8B7339] font-mono text-base font-bold break-all">{trackingNumber}</span>
              <button type="button" onClick={copy}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors">
                {copied ? '✓ Kopyalandı' : 'Kopyala'}
              </button>
            </div>
            {carrier && trackingNumber.startsWith('EST-') === false && (
              <p className="text-slate-500 text-xs mt-1.5">{carrier}</p>
            )}
          </div>

          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#C9A961]/10 hover:bg-[#C9A961]/20 border border-[#C9A961]/40 text-[#8B7339] text-sm font-bold transition-colors">
              🔗 {carrier} sitesinde takip et
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}

          {trackingNumber.startsWith('EST-') && (
            <p className="text-slate-500 text-xs text-center">
              Estelongy etiket kodu — kargo şirketine teslim alırken bu kodu söyle.
            </p>
          )}
        </div>
      )}

      {fulfillmentStatus === 'shipped' && canConfirmDelivery && (
        <div className="mt-3">
          <button type="button" onClick={handleTeslimAldim} disabled={isPending}
            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all border ${
              confirm
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600'
                : 'bg-white hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700'
            } ${isPending ? 'opacity-60' : ''}`}>
            {isPending ? 'Onaylanıyor...' : confirm ? '✓ Teslim aldığını onaylamak için tekrar tıkla' : 'Teslim Aldım'}
          </button>
          <p className="text-slate-500 text-xs mt-1.5 text-center">
            Teslim aldığını onayladığında 14 günlük iade pencereni başlatır.
          </p>
          {error && (
            <p className="text-red-600 text-xs mt-2 text-center">{error}</p>
          )}
        </div>
      )}

      {fulfillmentStatus === 'shipped' && !canConfirmDelivery && (
        <p className="text-slate-500 text-xs mt-3 text-center">{meta.line}</p>
      )}
    </div>
  )
}
