'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { urunEkleAction } from './urun-ekle-action'
import ProductImageUploader from '@/components/ProductImageUploader'
import TierBuilder from '@/components/TierBuilder'
import type { EsteStoreCategory, PricingTiers } from '@/lib/estestore'

const ANA_KATEGORI = [
  { value: 'kozmetik', label: '🧴 Kozmetik', help: 'Tüketici tarafına da satılabilir. Profesyonel indirim opsiyonel.' },
  { value: 'sarf_medikal', label: '💉 Sarf & Medikal', help: 'Yalnızca klinik / sağlık profesyonellerine satılır.' },
] as const

/**
 * Alt kategori = storefront section eşlemesi.
 * `section` alanı satıcıya hangi vitrinde görüneceğini söyler (UI hint).
 * `cat` filtresi: hangi ana kategoride (kozmetik / sarf_medikal) bu alt kategori geçerli.
 * Slug'lar src/lib/estestore.ts ESTESTORE_SECTIONS subcategoryIn listeleriyle birebir eşleşmeli.
 */
interface AltKategori {
  value: string
  label: string
  cat: 'kozmetik' | 'sarf_medikal' | 'both'
  section: string  // landing'de görüneceği bölüm (kullanıcıya gösterilen ipucu)
}

const ALT_KATEGORILER: AltKategori[] = [
  // ─── Kozmetik → Longevity bölümü ───
  { value: 'nmn',          label: 'NMN / NAD+ Öncülü',           cat: 'kozmetik', section: 'Longevity' },
  { value: 'longevity',    label: 'Longevity / Resveratrol vb.', cat: 'kozmetik', section: 'Longevity' },
  { value: 'supplement',   label: 'Takviye (genel)',             cat: 'kozmetik', section: 'Longevity' },
  { value: 'takviye',      label: 'Glutatyon / Antioksidan',     cat: 'kozmetik', section: 'Longevity' },
  { value: 'nad',          label: 'NAD+ Direkt',                 cat: 'kozmetik', section: 'Longevity' },

  // ─── Kozmetik → İşlem Sonrası bölümü ───
  { value: 'post-treatment', label: 'İşlem Sonrası Bakım',  cat: 'kozmetik', section: 'İşlem Sonrası' },
  { value: 'islem-sonrasi',  label: 'Lazer / Dolgu Sonrası', cat: 'kozmetik', section: 'İşlem Sonrası' },
  { value: 'iyilesme',       label: 'İyileşme & Onarım',     cat: 'kozmetik', section: 'İşlem Sonrası' },
  { value: 'serum',          label: 'Serum',                 cat: 'kozmetik', section: 'İşlem Sonrası' },

  // ─── Kozmetik → Biyohacking & Ölçüm bölümü ───
  { value: 'dna',          label: 'DNA / Epigenetik Test',  cat: 'kozmetik', section: 'Biyohacking & Ölçüm' },
  { value: 'mikrobiyom',   label: 'Mikrobiyom Kiti',        cat: 'kozmetik', section: 'Biyohacking & Ölçüm' },
  { value: 'cgm',          label: 'CGM / Glukoz Monitör',   cat: 'kozmetik', section: 'Biyohacking & Ölçüm' },
  { value: 'wearable',     label: 'Wearable / Sensör',      cat: 'kozmetik', section: 'Biyohacking & Ölçüm' },
  { value: 'biyohacking',  label: 'Biyohacking (genel)',    cat: 'kozmetik', section: 'Biyohacking & Ölçüm' },
  { value: 'olcum',        label: 'Ölçüm / Kit (diğer)',    cat: 'kozmetik', section: 'Biyohacking & Ölçüm' },

  // ─── Kozmetik → bölüm dışı (sadece /estestore/kategori/kozmetik) ───
  { value: 'krem',        label: 'Krem',           cat: 'kozmetik', section: 'Kozmetik (genel)' },
  { value: 'maske',       label: 'Maske',          cat: 'kozmetik', section: 'Kozmetik (genel)' },
  { value: 'temizleyici', label: 'Temizleyici',    cat: 'kozmetik', section: 'Kozmetik (genel)' },
  { value: 'gunes',       label: 'Güneş Koruyucu', cat: 'kozmetik', section: 'Kozmetik (genel)' },

  // ─── Sarf & Medikal (hep klinik tarafı) ───
  { value: 'dolgu',       label: 'Dolgu (HA / Cross-linked)', cat: 'sarf_medikal', section: 'Sarf & Medikal' },
  { value: 'botoks',      label: 'Botoks / Botulinum',        cat: 'sarf_medikal', section: 'Sarf & Medikal' },
  { value: 'altin-igne',  label: 'Altın İğne / RF Kartuş',    cat: 'sarf_medikal', section: 'Sarf & Medikal' },
  { value: 'mikroigne',   label: 'Mikroiğne / Derma Roller',  cat: 'sarf_medikal', section: 'Sarf & Medikal' },
  { value: 'mezoterapi',  label: 'Mezoterapi',                cat: 'sarf_medikal', section: 'Sarf & Medikal' },
  { value: 'peeling',     label: 'Peeling',                   cat: 'sarf_medikal', section: 'Sarf & Medikal' },
  { value: 'lazer',       label: 'Lazer Sarfı',               cat: 'sarf_medikal', section: 'Sarf & Medikal' },
  { value: 'cihaz',       label: 'Cihaz / Ekipman',           cat: 'sarf_medikal', section: 'Sarf & Medikal' },

  { value: 'other',       label: 'Diğer',                     cat: 'both',         section: '—' },
]

export default function UrunEkleForm({ vendorId }: { vendorId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const [name,          setName]          = useState('')
  const [category,      setCategory]      = useState<EsteStoreCategory>('kozmetik')
  const [subcategory,   setSubcategory]   = useState('post-treatment')
  const [treatmentType, setTreatmentType] = useState<'product' | 'treatment'>('product')
  const [description,   setDescription]   = useState('')
  const [price,         setPrice]         = useState('')
  const [ingredients,   setIngredients]   = useState('')
  const [images,        setImages]        = useState<string[]>([])
  const [tiers,         setTiers]         = useState<PricingTiers>([])

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Kategori değişince alt-kategori uyumsuz kaldıysa ilk uygun olana düşür.
  useEffect(() => {
    const available = ALT_KATEGORILER.filter(c => c.cat === category || c.cat === 'both')
    if (!available.some(c => c.value === subcategory)) {
      setSubcategory(available[0]?.value ?? 'other')
    }
  }, [category, subcategory])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Ürün adı zorunludur.'); return }
    setError(null)
    setLoading(true)

    const ingsArr = ingredients
      ? ingredients.split(',').map(s => s.trim()).filter(Boolean)
      : []

    const res = await urunEkleAction({
      name: name.trim(),
      category,
      subcategory,
      treatmentType,
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
    setName(''); setDescription(''); setPrice(''); setIngredients(''); setImages([]); setTiers([])
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

      {/* Tür seçimi */}
      <div className="grid grid-cols-2 gap-2">
        {(['product', 'treatment'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTreatmentType(t)}
            className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
              treatmentType === t
                ? 'bg-[#C9A961] border-[#C9A961] text-white'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}>
            {t === 'product' ? '📦 Ürün' : '💉 Klinik İşlem'}
          </button>
        ))}
      </div>

      {/* Ad */}
      <div>
        <label className="block text-slate-400 text-sm mb-1">Ürün / İşlem Adı <span className="text-red-400">*</span></label>
        <input
          type="text" required value={name} onChange={e => setName(e.target.value)}
          placeholder="ör. Hyaluronik Asit Serum"
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#C9A961] transition-colors"
        />
      </div>

      {/* Ana kategori (EsteStore) */}
      {treatmentType === 'product' && (
        <div>
          <label className="block text-slate-400 text-sm mb-2">EsteStore Ana Kategori</label>
          <div className="grid grid-cols-2 gap-2">
            {ANA_KATEGORI.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  category === c.value
                    ? 'bg-[#C9A961]/15 border-[#C9A961]/50 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <p className="font-bold text-sm">{c.label}</p>
                <p className="text-sm mt-1 opacity-80">{c.help}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alt kategori — kategoriye göre filtrelenir + storefront section ipucu */}
      {(() => {
        const available = ALT_KATEGORILER.filter(c => c.cat === category || c.cat === 'both')
        const currentSection = available.find(c => c.value === subcategory)?.section

        // Section'a göre grupla (optgroup için)
        const grouped = available.reduce<Record<string, AltKategori[]>>((acc, c) => {
          (acc[c.section] = acc[c.section] || []).push(c)
          return acc
        }, {})

        return (
          <div>
            <label className="block text-slate-400 text-sm mb-1">Alt Kategori</label>
            <select
              value={subcategory}
              onChange={e => setSubcategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#C9A961]">
              {Object.entries(grouped).map(([section, items]) => (
                <optgroup key={section} label={section}>
                  {items.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </optgroup>
              ))}
            </select>
            {currentSection && currentSection !== '—' && (
              <p className="text-slate-500 text-sm mt-1.5">
                Mağazada <span className="text-[#C9A961] font-semibold">{currentSection}</span> bölümünde görünür.
              </p>
            )}
          </div>
        )
      })()}

      {/* Fiyat */}
      <div>
        <label className="block text-slate-400 text-sm mb-1">Fiyat (₺) <span className="text-slate-600">(isteğe bağlı)</span></label>
        <input
          type="number" min={0} step={0.01} value={price} onChange={e => setPrice(e.target.value)}
          placeholder="ör. 450"
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#C9A961] transition-colors"
        />
      </div>

      {/* Tier — sadece ürün modunda */}
      {treatmentType === 'product' && numericPrice > 0 && (
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
        <label className="block text-slate-400 text-sm mb-1">Açıklama <span className="text-slate-600">(isteğe bağlı)</span></label>
        <textarea
          value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Ürün veya işlem hakkında kısa bilgi..."
          rows={3} maxLength={500}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#C9A961] transition-colors resize-none"
        />
      </div>

      {/* İçerikler */}
      {treatmentType === 'product' && (
        <div>
          <label className="block text-slate-400 text-sm mb-1">İçerikler / Bileşenler <span className="text-slate-600">(virgülle ayır)</span></label>
          <input
            type="text" value={ingredients} onChange={e => setIngredients(e.target.value)}
            placeholder="ör. Hyaluronik Asit, Retinol, Niasinamid"
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#C9A961] transition-colors"
          />
        </div>
      )}

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
        className="w-full py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:from-[#D4B872] hover:to-[#C9A961] disabled:opacity-40 text-white font-semibold rounded-xl transition-all text-sm">
        {loading ? 'Ekleniyor...' : 'Ürünü Gönder'}
      </button>
    </form>
  )
}
