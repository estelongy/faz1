'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search, Package, Plus, Upload } from 'lucide-react'

export type UrunListeKalem = {
  id: string
  name: string
  category: string | null
  price: number | null
  stock: number | null
  approval_status: string
  is_active: boolean | null
  cover_image: string | null
  final_score: number | null
}

interface Props {
  vendorId: string
  companyName: string
  totalProducts: number
  approvedCount: number
  pendingCount: number
  products: UrunListeKalem[]
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: 'İncelemede', cls: 'bg-amber-500/15 text-amber-300' },
  approved: { label: 'Onaylı', cls: 'bg-emerald-500/15 text-emerald-300' },
  rejected: { label: 'Reddedildi', cls: 'bg-rose-500/15 text-rose-300' },
}

export default function UrunlerAppView({
  companyName,
  totalProducts,
  approvedCount,
  pendingCount,
  products,
}: Props) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!q.trim()) return products
    const needle = q.toLowerCase().trim()
    return products.filter(p => p.name.toLowerCase().includes(needle))
  }, [products, q])

  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-2">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-400/80 truncate">{companyName}</p>
        <p className="mt-1 text-sm text-slate-400">{totalProducts} ürün · {approvedCount} onaylı · {pendingCount} incelemede</p>
      </header>

      {/* Sticky search */}
      <div className="sticky top-0 z-10 px-5 py-3 bg-slate-950/95 backdrop-blur border-b border-slate-900">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Ürün ara…"
            className="w-full pl-9 pr-3 py-3 text-base rounded-2xl bg-slate-900/80 border border-slate-800 focus:border-amber-400/50 outline-none text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      <section className="px-5 mt-3 grid grid-cols-2 gap-2.5">
        <Link
          href="/satici/panel/urunler/ekle"
          className="flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 active:bg-amber-500/20 transition"
        >
          <Plus size={16} className="text-amber-300 shrink-0" />
          <span className="text-sm font-medium text-white">Yeni Ürün</span>
        </Link>
        <Link
          href="/satici/panel/urunler/toplu"
          className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 active:bg-slate-900 transition"
        >
          <Upload size={16} className="text-slate-300 shrink-0" />
          <span className="text-sm font-medium text-white">Toplu CSV</span>
        </Link>
      </section>

      {/* Liste */}
      <section className="px-5 mt-4 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center text-slate-500 text-sm">
            <Package size={28} className="mx-auto mb-2 opacity-50" />
            {q ? 'Aramana uyan ürün yok' : 'Henüz ürün eklenmemiş'}
          </div>
        ) : (
          filtered.map(p => {
            const status = STATUS_LABEL[p.approval_status] ?? { label: p.approval_status, cls: 'bg-slate-700 text-slate-300' }
            return (
              <Link
                key={p.id}
                href={`/satici/panel/urunler/${p.id}/duzenle`}
                className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 active:bg-slate-900 transition"
              >
                <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {p.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.cover_image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={18} className="text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.name}</p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${status.cls}`}>{status.label}</span>
                    {p.price != null && <span className="text-xs text-slate-400">₺{Number(p.price).toLocaleString('tr-TR')}</span>}
                    {p.stock != null && <span className="text-xs text-slate-500">stok: {p.stock}</span>}
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${p.is_active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                  {p.is_active ? 'Aktif' : 'Pasif'}
                </span>
              </Link>
            )
          })
        )}
      </section>
    </div>
  )
}
