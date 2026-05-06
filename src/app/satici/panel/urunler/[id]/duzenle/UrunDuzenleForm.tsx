'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import ProductImageUploader from '@/components/ProductImageUploader'
import TierBuilder from '@/components/TierBuilder'
import { urunGuncelleAction, urunSilAction } from '../../../urun-actions'
import type { EsteStoreCategory, PricingTiers } from '@/lib/estestore'

const ANA_KATEGORI: { value: EsteStoreCategory; label: string }[] = [
  { value: 'kozmetik',     label: '🧴 Kozmetik' },
  { value: 'sarf_medikal', label: '💉 Sarf & Medikal' },
]

const ALT_KATEGORILER = [
  { value: 'serum',       label: 'Serum' },
  { value: 'krem',        label: 'Krem' },
  { value: 'maske',       label: 'Maske' },
  { value: 'temizleyici', label: 'Temizleyici' },
  { value: 'gunes',       label: 'Güneş Koruyucu' },
  { value: 'supplement',  label: 'Takviye' },
  { value: 'mezoterapi',  label: 'Mezoterapi' },
  { value: 'dolgu',       label: 'Dolgu' },
  { value: 'botoks',      label: 'Botoks' },
  { value: 'altin_igne',  label: 'Altın İğne' },
  { value: 'peeling',     label: 'Peeling' },
  { value: 'lazer',       label: 'Lazer' },
  { value: 'cihaz',       label: 'Cihaz' },
  { value: 'other',       label: 'Diğer' },
]

interface Product {
  id: string
  name: string
  category: string
  subcategory?: string | null
  description: string
  price: number | null
  stock: number | null
  ingredients: string[]
  images: string[]
  is_active: boolean
  approval_status: string
  pricing_tiers?: PricingTiers
}

interface Props {
  vendorId: string
  product: Product
}

function normalizeCategory(c: string): EsteStoreCategory {
  if (c === 'kozmetik' || c === 'sarf_medikal') return c
  return 'kozmetik'
}

export default function UrunDuzenleForm({ vendorId, product }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name,        setName]        = useState(product.name)
  const [category,    setCategory]    = useState<EsteStoreCategory>(normalizeCategory(product.category))
  const [subcategory, setSubcategory] = useState(product.subcategory ?? 'serum')
  const [description, setDescription] = useState(product.description)
  const [price,       setPrice]       = useState(product.price?.toString() ?? '')
  const [stock,       setStock]       = useState(product.stock?.toString() ?? '')
  const [ingredients, setIngredients] = useState(product.ingredients.join(', '))
  const [images,      setImages]      = useState<string[]>(product.images)
  const [isActive,    setIsActive]    = useState(product.is_active)
  const [tiers,       setTiers]       = useState<PricingTiers>(product.pricing_tiers ?? [])

  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Ürün adı zorunludur.'); return }
    setError(null)

    const ingsArr = ingredients
      ? ingredients.split(',').map(s => s.trim()).filter(Boolean)
      : []

    startTransition(async () => {
      const res = await urunGuncelleAction({
        id: product.id,
        name: name.trim(),
        category,
        subcategory,
        description: description.trim(),
        price: price ? Number(price) : null,
        stock: stock ? Number(stock) : null,
        ingredients: ingsArr,
        images,
        is_active: isActive,
        pricingTiers: tiers,
      })
      if (!res.ok) {
        setError(res.error ?? 'Güncellenemedi.')
        return
      }
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    })
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    startTransition(async () => {
      const res = await urunSilAction(product.id)
      if (!res.ok) {
        setError(res.error ?? 'Silinemedi.')
        return
      }
      router.push('/satici/panel')
    })
  }

  const statusBadge = product.approval_status === 'approved'
    ? { label: 'Onaylı', cls: 'bg-emerald-500/20 text-emerald-400' }
    : product.approval_status === 'rejected'
    ? { label: 'Reddedildi', cls: 'bg-red-500/20 text-red-400' }
    : { label: 'Admin İncelemesinde', cls: 'bg-amber-500/20 text-amber-400' }

  const numericPrice = price ? Number(price) : 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Durum */}
      <div className="flex items-center gap-3 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
        <label className="flex items-center gap-2 cursor-pointer ml-auto">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
            disabled={product.approval_status !== 'approved'}
            className="w-4 h-4 accent-violet-600" />
          <span className="text-sm text-slate-300">Mağazada aktif</span>
        </label>
      </div>

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
          ✓ Kaydedildi.
        </div>
      )}

      {/* Ad */}
      <div>
        <label className="block text-slate-400 text-xs mb-1">Ürün Adı <span className="text-red-400">*</span></label>
        <input type="text" required value={name} onChange={e => setName(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500" />
      </div>

      {/* Ana kategori */}
      <div>
        <label className="block text-slate-400 text-xs mb-2">EsteStore Mağazası</label>
        <div className="grid grid-cols-2 gap-2">
          {ANA_KATEGORI.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                category === c.value
                  ? 'bg-violet-500/15 border-violet-500/50 text-white'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alt kategori */}
      <div>
        <label className="block text-slate-400 text-xs mb-1">Alt Kategori</label>
        <select value={subcategory} onChange={e => setSubcategory(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500">
          {ALT_KATEGORILER.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Fiyat + Stok */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-400 text-xs mb-1">Fiyat (₺)</label>
          <input type="number" min={0} step="0.01" value={price} onChange={e => setPrice(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500" />
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1">Stok (adet)</label>
          <input type="number" min={0} value={stock} onChange={e => setStock(e.target.value)}
            placeholder="Boş = sınırsız"
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500" />
        </div>
      </div>

      {/* Tier builder */}
      {numericPrice > 0 && (
        <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
          <TierBuilder
            basePrice={numericPrice}
            category={category}
            value={tiers}
            onChange={setTiers}
          />
        </div>
      )}

      {/* Açıklama */}
      <div>
        <label className="block text-slate-400 text-xs mb-1">Açıklama</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          rows={4} maxLength={500}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500 resize-none" />
      </div>

      {/* İçerikler */}
      <div>
        <label className="block text-slate-400 text-xs mb-1">İçerikler (virgülle ayır)</label>
        <input type="text" value={ingredients} onChange={e => setIngredients(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500" />
      </div>

      {/* Görseller */}
      <div>
        <label className="block text-slate-400 text-xs mb-2">Görseller</label>
        <ProductImageUploader vendorId={vendorId} initialImages={images} onChange={setImages} />
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      {/* Aksiyon butonları */}
      <div className="flex gap-3 pt-4 border-t border-slate-800">
        <button type="submit" disabled={isPending}
          className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-all text-sm">
          {isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </button>
        <button type="button" onClick={handleDelete} disabled={isPending}
          className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
            confirmDelete
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400'
          }`}>
          {confirmDelete ? '✓ Sil (onaylamak için tekrar)' : 'Ürünü Sil'}
        </button>
      </div>
    </form>
  )
}
