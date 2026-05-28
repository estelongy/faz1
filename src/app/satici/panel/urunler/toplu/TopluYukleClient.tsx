'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { parseCsvAsObjects } from '@/lib/csv'
import { validateBulkRowsAction, bulkInsertProductsAction, type BulkProductRow, type BulkUploadResult } from './actions'

const SAMPLE_CSV = `name,uts_no,category,subcategory,description,price,stock,ingredients,images
"NMN Premium 500mg","ABC1234567","kozmetik","longevity","Bilim destekli longevity takviyesi. 30 günlük kullanım.","1450","45","NMN, Resveratrol, B12","https://example.com/p1.jpg|https://example.com/p2.jpg"
"Vitamin C Serum","DEF7654321","kozmetik","anti-aging","Yüksek konsantrasyon C vitamini serumu.","890","120","Vitamin C, Hyaluronik Asit",""
`

export default function TopluYukleClient() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [preview, setPreview] = useState<BulkProductRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkUploadResult | null>(null)

  async function handleFile(file: File) {
    setError(null)
    if (file.size > 5 * 1024 * 1024) { setError('Maks 5MB CSV dosyası.'); return }
    const text = await file.text()
    const { headers, rows } = parseCsvAsObjects(text)
    if (rows.length === 0) { setError('CSV içinde veri bulunamadı.'); return }

    const requiredHeaders = ['name', 'uts_no', 'category', 'price']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      setError(`Zorunlu sütunlar eksik: ${missingHeaders.join(', ')}`)
      return
    }

    startTransition(async () => {
      const res = await validateBulkRowsAction(rows)
      if (!res.ok || !res.preview) {
        setError(res.error ?? 'CSV doğrulanamadı.')
        return
      }
      setPreview(res.preview)
      setStep('preview')
    })
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'estelongy-urun-sablonu.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function confirmUpload() {
    setError(null)
    startTransition(async () => {
      const res = await bulkInsertProductsAction(preview)
      if (!res.ok || !res.result) {
        setError(res.error ?? 'Yükleme başarısız.')
        return
      }
      setResult(res.result)
      setStep('done')
      router.refresh()
    })
  }

  function reset() {
    setStep('upload')
    setPreview([])
    setError(null)
    setResult(null)
  }

  const validCount = preview.filter(r => r.errors.length === 0).length
  const errorCount = preview.length - validCount

  if (step === 'done' && result) {
    return (
      <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
        <h2 className="text-emerald-300 font-bold text-xl mb-2">✓ Yükleme Tamamlandı</h2>
        <p className="text-slate-300 text-base">
          <strong className="text-white">{result.inserted}</strong> ürün başarıyla yüklendi ve onay bekliyor.
          {result.skipped > 0 && <span> {result.skipped} satır atlandı.</span>}
        </p>
        {result.errors.length > 0 && (
          <details className="mt-3">
            <summary className="text-amber-300 text-sm font-semibold cursor-pointer">
              {result.errors.length} satırda hata oluştu — detay
            </summary>
            <ul className="mt-2 space-y-1 text-sm text-slate-400 list-disc pl-5">
              {result.errors.map((e, i) => (
                <li key={i}>Satır {e.row}: {e.message}</li>
              ))}
            </ul>
          </details>
        )}
        <div className="flex gap-3 mt-5">
          <button onClick={reset}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg text-sm">
            Yeni Yükleme
          </button>
          <a href="/satici/panel" className="px-4 py-2 bg-[#C9A961] hover:bg-[#D4B872] text-slate-900 font-bold rounded-lg text-sm">
            Panele Dön →
          </a>
        </div>
      </div>
    )
  }

  if (step === 'preview') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
          <div className="text-base">
            <span className="text-emerald-400 font-bold">{validCount}</span>
            <span className="text-slate-400"> yüklenebilir</span>
            {errorCount > 0 && (
              <>
                <span className="text-slate-500 mx-2">·</span>
                <span className="text-red-400 font-bold">{errorCount}</span>
                <span className="text-slate-400"> hatalı (atlanacak)</span>
              </>
            )}
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={reset}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg text-sm">
              ← Vazgeç
            </button>
            <button onClick={confirmUpload} disabled={pending || validCount === 0}
              className="px-4 py-2 bg-gradient-to-r from-[#C9A961] to-[#B8964F] disabled:opacity-40 text-slate-900 font-bold rounded-lg text-sm">
              {pending ? 'Yükleniyor…' : `✓ ${validCount} Ürünü Yükle`}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-semibold">{error}</div>
        )}

        {/* Preview tablosu */}
        <div className="overflow-x-auto bg-slate-800/50 border border-slate-700 rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Ürün</th>
                <th className="px-3 py-2 text-left">ÜTS</th>
                <th className="px-3 py-2 text-left">Kategori</th>
                <th className="px-3 py-2 text-right">Fiyat</th>
                <th className="px-3 py-2 text-right">Stok</th>
                <th className="px-3 py-2 text-left">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {preview.map(r => (
                <tr key={r.rowNumber} className={r.errors.length > 0 ? 'bg-red-500/5' : ''}>
                  <td className="px-3 py-2 text-slate-500 font-mono">{r.rowNumber}</td>
                  <td className="px-3 py-2 text-slate-200 font-semibold">{r.name || '—'}</td>
                  <td className="px-3 py-2 text-slate-400 font-mono text-xs">{r.uts_no || '—'}</td>
                  <td className="px-3 py-2 text-slate-400">
                    {r.category}{r.subcategory ? ` · ${r.subcategory}` : ''}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-200">
                    {r.price ? `₺${r.price.toLocaleString('tr-TR')}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-400">{r.stock ?? '—'}</td>
                  <td className="px-3 py-2">
                    {r.errors.length === 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                        ✓ Hazır
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400 text-xs font-semibold" title={r.errors.join(', ')}>
                        ✗ {r.errors[0]}{r.errors.length > 1 ? ` +${r.errors.length - 1}` : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // step === 'upload'
  return (
    <div className="space-y-4">
      {/* Şablon indir */}
      <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📋</div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-base mb-1">1. Şablonu İndir</h2>
            <p className="text-slate-400 text-sm mb-3">
              CSV dosyasını Excel ya da Google Sheets ile aç, ürünlerini ekle ve kaydet.
            </p>
            <button onClick={downloadSample}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg text-sm">
              ⬇ Sablon İndir (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Dosya yükle */}
      <div className="p-5 bg-slate-800/50 border-2 border-dashed border-slate-700 hover:border-[#C9A961] rounded-2xl transition-colors text-center">
        <div className="text-4xl mb-3">📤</div>
        <h2 className="text-white font-bold text-base mb-1">2. CSV Dosyasını Yükle</h2>
        <p className="text-slate-400 text-sm mb-4">
          Doldurduğun şablonu seç. Maks 500 satır, 5MB.
        </p>
        <button onClick={() => inputRef.current?.click()} disabled={pending}
          className="px-6 py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:from-[#D4B872] hover:to-[#C9A961] disabled:opacity-50 text-slate-900 font-bold rounded-xl text-base">
          {pending ? 'Okunuyor…' : 'CSV Dosyası Seç'}
        </button>
        <input ref={inputRef} type="file" accept=".csv,text/csv"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = ''
          }} />
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-semibold">{error}</div>
      )}

      {/* Kolon kılavuzu */}
      <div className="p-5 bg-slate-800/30 border border-slate-700 rounded-2xl text-sm space-y-2">
        <p className="text-white font-bold mb-2">📚 Kolon kılavuzu</p>
        <ul className="space-y-1 text-slate-400 list-disc pl-5">
          <li><strong className="text-slate-200">name</strong> (zorunlu) — ürün adı</li>
          <li><strong className="text-slate-200">uts_no</strong> (zorunlu) — T.C. Sağlık Bakanlığı ÜTS kayıt numarası, min 5 karakter</li>
          <li><strong className="text-slate-200">category</strong> (zorunlu) — <code className="text-[#C9A961]">kozmetik</code> veya <code className="text-[#C9A961]">sarf_medikal</code></li>
          <li><strong className="text-slate-200">price</strong> (zorunlu) — TL fiyat, ondalık için virgül ya da nokta</li>
          <li><strong>subcategory</strong> — alt kategori adı (longevity, anti-aging, vs.)</li>
          <li><strong>description</strong> — ürün açıklaması</li>
          <li><strong>stock</strong> — stok adedi (boş = sınırsız)</li>
          <li><strong>ingredients</strong> — virgül veya | ile ayrılmış</li>
          <li><strong>images</strong> — http(s) URL&apos;ler, | veya virgül ile ayrılmış</li>
        </ul>
        <p className="text-slate-500 text-xs mt-2">
          Yüklenen ürünlerin tamamı &quot;onay bekliyor&quot; olarak başlar — admin onayından sonra mağazada görünür.
        </p>
      </div>
    </div>
  )
}
