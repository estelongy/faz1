'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { urunEkleAction } from './urun-ekle-action'
import ProductImageUploader from '@/components/ProductImageUploader'
import TierBuilder from '@/components/TierBuilder'
import type { PricingTiers } from '@/lib/estestore'
import {
  HASTA_CATEGORIES,
  KLINIK_CATEGORY_GROUPS,
} from '@/lib/estestore-categories'

/**
 * İki ana ürün türü:
 *  - product  → "Dermo-Kozmetik"  (category=kozmetik)     → herkes görür
 *                                                           kullanıcı sadece perakende,
 *                                                           klinik + sağlık-pro perakende + toplu alım
 *  - treatment → "Medikal-Sarf"    (category=sarf_medikal) → sadece klinik + sağlık-pro görür
 *                                                           perakende + toplu alım
 *
 * Alt kategori listesi türle değişir:
 *  - Dermo-Kozmetik → 18 hasta kategorisi (HASTA_CATEGORIES)
 *  - Medikal-Sarf   → 24 klinik kategori, 6 grup (KLINIK_CATEGORY_GROUPS)
 */

type ProductType = 'product' | 'treatment'

export default function UrunEkleForm({ vendorId }: { vendorId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const [name,          setName]          = useState('')
  const [utsNo,         setUtsNo]         = useState('')
  const [productType,   setProductType]   = useState<ProductType>('product')
  const [subcategory,   setSubcategory]   = useState<string>(HASTA_CATEGORIES[0].slug)
  const [description,   setDescription]   = useState('')
  const [price,         setPrice]         = useState('')
  const [ingredients,   setIngredients]   = useState('')
  const [images,        setImages]        = useState<string[]>([])
  const [tiers,         setTiers]         = useState<PricingTiers>([])

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Tür değişince alt kategoriyi o türün ilk seçeneğine düşür.
  useEffect(() => {
    if (productType === 'product') {
      setSubcategory(HASTA_CATEGORIES[0].slug)
    } else {
      setSubcategory(KLINIK_CATEGORY_GROUPS[0].categories[0].slug)
    }
    // Tür değişince tier'ları sıfırla (farklı alıcı kitlesi, farklı min indirim)
    setTiers([])
  }, [productType])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Ürün adı zorunludur.'); return }
    if (!utsNo.trim()) { setError('ÜTS kayıt numarası zorunludur — Estelongy yalnız ÜTS kayıtlı ürün satar.'); return }
    setError(null)
    setLoading(true)

    const ingsArr = ingredients
      ? ingredients.split(',').map(s => s.trim()).filter(Boolean)
      : []

    // Tür → ana kategori eşlemesi
    const category = productType === 'product' ? 'kozmetik' : 'sarf_medikal'

    const res = await urunEkleAction({
      name: name.trim(),
      utsNo: utsNo.trim(),
      category,
      subcategory,
      treatmentType: productType,
      description: description.trim(),
      price: price ? Number(price) : null,
      ingredients: ingsArr,
      images,
      pricingTiers: tiers,
    })

    if (!res.ok) {
      setError(res.error ?? 'Ürün eklenemedi.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setName(''); setUtsNo(''); setDescription(''); setPrice(''); setIngredients(''); setImages([]); setTiers([])
    router.refresh()
    setTimeout(() => { setSuccess(false); setOpen(false) }, 2000)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-4 border border-dashed border-slate-600 hover:border-[#C9A961] rounded-2xl text-slate-400 hover:text-[#C9A961] transition-all text-sm font-medium">
        + Yeni Ürün / İşlem Ekle
      </button>
    )
  }

  const numericPrice = price ? Number(price) : 0
  const category = productType === 'product' ? 'kozmetik' : 'sarf_medikal'

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-slate-800/50 border border-[#C9A961]/30 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold">Yeni Ürün / İşlem</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-500 hover:text-white text-sm">İptal</button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
          ✓ Ürün eklendi. Admin onayından sonra mağazada görünecek.
        </div>
      )}

      {/* Tür seçimi — Dermo-Kozmetik / Medikal-Sarf */}
      <div className="grid grid-cols-2 gap-2">
        {([
          {
            value: 'product' as const,
            icon: '📦',
            label: 'Dermo-Kozmetik',
            sub: 'Herkes görür · klinik/sağlık-pro toplu alımı görür',
          },
          {
            value: 'treatment' as const,
            icon: '💉',
            label: 'Medikal-Sarf',
            sub: 'Sadece klinik + sağlık-pro · perakende + toplu alım',
          },
        ]).map(t => (
          <button
            key={t.value}
            type="button"
            onClick={() => setProductType(t.value)}
            className={`p-3 rounded-xl text-left border transition-all ${
              productType === t.value
                ? 'bg-[#C9A961] border-[#C9A961] text-white'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}>
            <p className="font-bold text-sm">{t.icon} {t.label}</p>
            <p className={`text-xs mt-1 ${productType === t.value ? 'text-white/85' : 'text-slate-500'}`}>{t.sub}</p>
          </button>
        ))}
      </div>

      {/* Ad */}
      <div>
        <label className="block text-slate-400 text-sm mb-1">Ürün / İşlem Adı <span className="text-red-400">*</span></label>
        <input
          type="text" required value={name} onChange={e => setName(e.target.value)}
          placeholder={productType === 'product' ? 'ör. Hyaluronik Asit Serum' : 'ör. Restylane Defyne 1ml'}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#C9A961] transition-colors"
        />
      </div>

      {/* ÜTS Kayıt Numarası — ZORUNLU. Estelongy yalnız ÜTS kayıtlı ürün satar. */}
      <div>
        <label className="block text-slate-400 text-sm mb-1">
          ÜTS Kayıt Numarası <span className="text-red-400">*</span>
        </label>
        <input
          type="text" required value={utsNo} onChange={e => setUtsNo(e.target.value)}
          placeholder={productType === 'product' ? 'Kozmetik ürün bildirim numarası' : 'Tıbbi cihaz / sarf kayıt numarası'}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#C9A961] transition-colors"
        />
        <p className="text-slate-500 text-sm mt-1.5">
          {productType === 'product'
            ? 'Ürünün T.C. Sağlık Bakanlığı ÜTS kozmetik bildirim numarası. '
            : 'Ürünün T.C. Sağlık Bakanlığı ÜTS tıbbi cihaz/sarf kayıt numarası. '}
          <span className="text-[#C9A961] font-semibold">Estelongy yalnız ÜTS kayıtlı ürün satar</span> — bu alan zorunludur.
        </p>
      </div>

      {/* Alt kategori — türe göre liste */}
      <div>
        <label className="block text-slate-400 text-sm mb-1">Kategori</label>
        <select
          value={subcategory}
          onChange={e => setSubcategory(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#C9A961]">
          {productType === 'product' ? (
            HASTA_CATEGORIES.map(c => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))
          ) : (
            KLINIK_CATEGORY_GROUPS.map(g => (
              <optgroup key={g.groupSlug} label={g.groupName}>
                {g.categories.map(c => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </optgroup>
            ))
          )}
        </select>
        <p className="text-slate-500 text-sm mt-1.5">
          {productType === 'product'
            ? <>Mağazada <span className="text-[#C9A961] font-semibold">EsteStore</span> kataloğunda herkes görür. Toplu alım sadece klinik/sağlık-pro hesaplarına gösterilir.</>
            : <>Mağazada <span className="text-[#C9A961] font-semibold">Klinik Kataloğu</span> altında görünür. Yalnız klinik ve sağlık-pro hesapları erişebilir — hasta kullanıcı bu ürünü göremez.</>
          }
        </p>
      </div>

      {/* Perakende fiyat */}
      <div>
        <label className="block text-slate-400 text-sm mb-1">
          Perakende Fiyat (₺) <span className="text-slate-600">(isteğe bağlı)</span>
        </label>
        <input
          type="number" min={0} step={0.01} value={price} onChange={e => setPrice(e.target.value)}
          placeholder="ör. 450"
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#C9A961] transition-colors"
        />
      </div>

      {/* Toplu alım — HER İKİ TÜRDE DE açık (klinik fiyatlandırması) */}
      {numericPrice > 0 && (
        <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
          <TierBuilder
            basePrice={numericPrice}
            category={category}
            value={tiers}
            onChange={setTiers}
          />
          <p className="text-slate-500 text-xs mt-2">
            {productType === 'product'
              ? 'Toplu alım fiyatları sadece klinik ve sağlık-pro hesaplarına gösterilir. Hasta kullanıcılar yalnız perakende fiyatı görür.'
              : 'Bu ürün sadece klinik ve sağlık-pro hesaplarına açıktır. Perakende ve toplu alım fiyatlarını her ikisi de görür.'}
          </p>
        </div>
      )}

      {/* Açıklama */}
      <div>
        <label className="block text-slate-400 text-sm mb-1">Açıklama <span className="text-slate-600">(isteğe bağlı)</span></label>
        <textarea
          value={description} onChange={e => setDescription(e.target.value)}
          placeholder={productType === 'product' ? 'Ürün hakkında kısa bilgi...' : 'Ürün spesifikasyonu, içerik miktarı, kullanım notu...'}
          rows={3} maxLength={500}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#C9A961] transition-colors resize-none"
        />
      </div>

      {/* İçerikler / Etken Maddeler — her ikisinde */}
      <div>
        <label className="block text-slate-400 text-sm mb-1">
          {productType === 'product' ? 'İçerikler / Bileşenler' : 'Etken Madde / İçerik'}
          {' '}
          <span className="text-slate-600">(virgülle ayır)</span>
        </label>
        <input
          type="text" value={ingredients} onChange={e => setIngredients(e.target.value)}
          placeholder={productType === 'product' ? 'ör. Hyaluronik Asit, Retinol, Niasinamid' : 'ör. Cross-linked HA, Lidokain %0.3'}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#C9A961] transition-colors"
        />
      </div>

      {/* Görseller */}
      <div>
        <label className="block text-slate-400 text-sm mb-2">Görseller <span className="text-slate-600">(en az 1 önerilir)</span></label>
        <ProductImageUploader vendorId={vendorId} initialImages={images} onChange={setImages} />
      </div>

      <p className="text-slate-600 text-sm">* Eklenen ürünler admin onayından sonra mağazada yayınlanır.</p>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:from-[#D4B872] hover:to-[#C9A961] disabled:opacity-40 text-white font-semibold rounded-xl transition-all text-base">
        {loading ? 'Ekleniyor...' : 'Ürünü Gönder'}
      </button>
    </form>
  )
}
