'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import AdresForm from './AdresForm'
import { adresSilAction, adresVarsayilanYapAction } from './adres-actions'

export interface Adres {
  id: string
  title: string
  full_name: string
  phone: string
  city: string
  district: string
  neighborhood: string | null
  address_line: string
  postal_code: string | null
  is_default: boolean
}

export default function AdresListe({ addresses }: { addresses: Adres[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Adresi silmek istediğine emin misin?')) return
    startTransition(async () => {
      await adresSilAction(id)
      router.refresh()
    })
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      await adresVarsayilanYapAction(id)
      router.refresh()
    })
  }

  if (addresses.length === 0 && !adding) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-slate-300 rounded-2xl shadow-sm">
        <div className="text-slate-300 text-5xl mb-3">📍</div>
        <p className="text-slate-600 mb-4">Henüz kayıtlı adres yok</p>
        <button onClick={() => setAdding(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:from-[#D4B872] hover:to-[#C9A961] text-[#0F172A] text-sm font-bold rounded-xl transition-all">
          + İlk Adresi Ekle
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {addresses.map(a =>
        editingId === a.id ? (
          <AdresForm key={a.id} initial={a}
            onClose={() => setEditingId(null)}
            onSaved={() => setEditingId(null)} />
        ) : (
          <div key={a.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-900 font-bold text-sm">{a.title}</span>
                {a.is_default && (
                  <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    VARSAYILAN
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!a.is_default && (
                  <button onClick={() => handleSetDefault(a.id)} disabled={isPending}
                    className="text-sm text-slate-500 hover:text-emerald-700 transition-colors">
                    Varsayılan yap
                  </button>
                )}
                <button onClick={() => setEditingId(a.id)}
                  className="text-sm text-slate-500 hover:text-[#8B7339] transition-colors">
                  Düzenle
                </button>
                <button onClick={() => handleDelete(a.id)} disabled={isPending}
                  className="text-sm text-slate-500 hover:text-red-600 transition-colors">
                  Sil
                </button>
              </div>
            </div>
            <p className="text-slate-700 text-sm">{a.full_name}</p>
            <p className="text-slate-500 text-sm mt-0.5">{a.phone}</p>
            <p className="text-slate-600 text-sm mt-2 leading-relaxed">
              {a.address_line}
              {a.neighborhood && <>, {a.neighborhood}</>}
              , {a.district} / {a.city}
              {a.postal_code && <> · {a.postal_code}</>}
            </p>
          </div>
        )
      )}

      {adding ? (
        <AdresForm onClose={() => setAdding(false)} onSaved={() => setAdding(false)} />
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full py-4 bg-white border border-dashed border-slate-300 hover:border-[#C9A961] rounded-2xl text-slate-500 hover:text-[#8B7339] transition-all text-sm font-semibold">
          + Yeni Adres Ekle
        </button>
      )}
    </div>
  )
}
