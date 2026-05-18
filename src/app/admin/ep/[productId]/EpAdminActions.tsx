'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  addEpDocument,
  removeEpDocument,
  reportSahteTespit,
  clearSahteTespit,
  recomputeEp,
} from '../actions'

const DOC_TYPES: { value: string; label: string; defaultSeviye: number }[] = [
  { value: 'uts',            label: 'ÜTS Kayıtlı',           defaultSeviye: 1 },
  { value: 'tufam',          label: 'TÜFAM',                 defaultSeviye: 1 },
  { value: 'tse',            label: 'TSE',                   defaultSeviye: 2 },
  { value: 'ce',             label: 'CE',                    defaultSeviye: 3 },
  { value: 'ce_klas3',       label: 'CE Sınıf-3',            defaultSeviye: 4 },
  { value: 'klinik_calisma', label: 'Çift Kör Klinik Çalışma', defaultSeviye: 5 },
]

interface Doc {
  document_type: string
  seviye: number
  verified_at: string | null
}

interface Props {
  productId: string
  existingDocs: Doc[]
  sahteCount: number
  isBanned: boolean
}

export default function EpAdminActions({ productId, existingDocs, sahteCount, isBanned }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const [docType, setDocType] = useState(DOC_TYPES[0].value)
  const [seviye, setSeviye]   = useState<number>(DOC_TYPES[0].defaultSeviye)

  const existingTypes = new Set(existingDocs.map(d => d.document_type))

  function notify(message: string) {
    setMsg(message)
    setTimeout(() => setMsg(null), 2500)
  }

  function handleAddDoc() {
    setError(null)
    startTransition(async () => {
      const res = await addEpDocument(productId, docType, seviye)
      if (!res.ok) { setError(res.error ?? 'Hata'); return }
      notify('Belge eklendi, EP güncellendi')
      router.refresh()
    })
  }

  function handleRemoveDoc(type: string) {
    if (!confirm(`${type} belgesini kaldırmak istediğine emin misin?`)) return
    setError(null)
    startTransition(async () => {
      const res = await removeEpDocument(productId, type)
      if (!res.ok) { setError(res.error ?? 'Hata'); return }
      notify('Belge kaldırıldı')
      router.refresh()
    })
  }

  function handleSahte() {
    if (!confirm('Sahte ürün tespiti rapor et? Ceza uygulanacak.')) return
    setError(null)
    startTransition(async () => {
      const res = await reportSahteTespit(productId)
      if (!res.ok) { setError(res.error ?? 'Hata'); return }
      notify(res.isBanned ? `${res.newCount}. tespit — ürün BANLANDI` : `${res.newCount}. tespit kaydedildi`)
      router.refresh()
    })
  }

  function handleClear() {
    if (!confirm('Sahte tespit sayacını sıfırlamak istediğine emin misin?')) return
    setError(null)
    startTransition(async () => {
      const res = await clearSahteTespit(productId)
      if (!res.ok) { setError(res.error ?? 'Hata'); return }
      notify('Sahte tespit sıfırlandı')
      router.refresh()
    })
  }

  function handleRecompute() {
    setError(null)
    startTransition(async () => {
      await recomputeEp(productId)
      notify('EP yeniden hesaplandı')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
      {msg   && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">{msg}</div>}

      {/* Belge ekle */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-3">
        <h3 className="text-white font-bold">Belge Ekle / Güncelle</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={docType}
            onChange={e => {
              const t = DOC_TYPES.find(d => d.value === e.target.value)
              setDocType(e.target.value)
              if (t) setSeviye(t.defaultSeviye)
            }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
          >
            {DOC_TYPES.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <select
            value={seviye}
            onChange={e => setSeviye(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
          >
            {[1,2,3,4,5].map(n => <option key={n} value={n}>Seviye {n}</option>)}
          </select>
          <button
            onClick={handleAddDoc}
            disabled={isPending}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            {existingTypes.has(docType) ? 'Güncelle' : 'Ekle'}
          </button>
        </div>
      </div>

      {/* Mevcut belgeler */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-3">
        <h3 className="text-white font-bold">Mevcut Belgeler</h3>
        {existingDocs.length === 0 ? (
          <p className="text-slate-500 text-sm">Henüz belge yok.</p>
        ) : (
          <div className="space-y-2">
            {existingDocs.map(d => {
              const label = DOC_TYPES.find(t => t.value === d.document_type)?.label ?? d.document_type
              return (
                <div key={d.document_type} className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">✓</span>
                    <div>
                      <p className="text-white text-sm font-medium">{label}</p>
                      <p className="text-slate-500 text-xs">Seviye {d.seviye}/5</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveDoc(d.document_type)}
                    disabled={isPending}
                    className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors"
                  >
                    Kaldır
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* EsteVerify */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-3">
        <h3 className="text-white font-bold">EsteVerify — Sahte Tespit</h3>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-slate-400 text-xs">Tespit sayısı</p>
            <p className={`text-2xl font-black ${sahteCount >= 3 ? 'text-red-400' : sahteCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {sahteCount}
            </p>
          </div>
          {isBanned && (
            <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full font-bold">
              🚫 BANLI
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSahte}
            disabled={isPending || isBanned}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            ⚠ Sahte Tespiti Rapor Et
          </button>
          {sahteCount > 0 && (
            <button
              onClick={handleClear}
              disabled={isPending}
              className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              Sıfırla
            </button>
          )}
        </div>
        <p className="text-slate-500 text-xs">
          1. tespit: −2 puan · 2. tespit: −5 puan · 3. tespit: kalıcı ban
        </p>
      </div>

      {/* Yeniden hesapla */}
      <button
        onClick={handleRecompute}
        disabled={isPending}
        className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl text-sm transition-colors"
      >
        {'🔄 EP\'yi Yeniden Hesapla'}
      </button>
    </div>
  )
}
