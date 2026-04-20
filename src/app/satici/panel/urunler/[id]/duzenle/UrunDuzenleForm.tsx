'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import ProductImageUploader from '@/components/ProductImageUploader'
import { urunGuncelleAction, urunSilAction } from '../../../urun-actions'

const CATEGORIES = [
  { value: 'botox',       label: 'Botoks' },
  { value: 'filler',      label: 'Dolgu' },
  { value: 'mezo',        label: 'Mezoterapi' },
  { value: 'laser',       label: 'Lazer' },
  { value: 'gold_needle', label: 'Altın İğne' },
  { value: 'peeling',     label: 'Peeling' },
  { value: 'serum',       label: 'Serum' },
  { value: 'supplement',  label: 'Takviye' },
  { value: 'device',      label: 'Cihaz' },
  { value: 'other',       label: 'Diğer' },
]

interface Product {
  id: string
  name: string
  category: string
  description: string
  price: number | null
  stock: number | null
  ingredients: string[]
  images: string[]
  is_active: boolean
  approval_status: string
}

interface Props {
  vendorId: string
  product: Product
}

export default function UrunDuzenleForm({ vendorId, product }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name,        setName]        = useState(product.name)
  const [category,    setCategory]    = useState(product.category)
  const [description, setDescription] = useState(product.description)
  const [price,       setPrice]       = useState(product.price?.toString() ?? '')
  const [stock,       setStock]       = useState(product.stock?.toString() ?? '')
  const [ingredients, setIngredients] = useState(product.ingredients.join(', '))
  const [images,      setImages]      = useState<string[]>(product.images)
  const [isActive,    setIsActive]    = useState(product.is_active)

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
        description: description.trim(),
        price: price ? Number(price) : null,
        stock: stock ? Number(stock) : null,
        ingredients: ingsArr,
        images,
        is_active: isActive,
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

      {/* Kategori */}
      <div>
        <label className="block text-slate-400 text-xs mb-1">Kategori</label>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500">
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
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
