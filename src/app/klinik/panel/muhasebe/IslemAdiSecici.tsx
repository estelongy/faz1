'use client'

import { useState, useRef, useEffect, useMemo, useTransition } from 'react'
import { addKatalogKalem } from './actions'
import type { CatalogItem } from './MuhasebeShellClient'

/**
 * İşlem adı seçici — katalogda ara, yoksa ekle.
 *
 * Önceki hali `<input list=…>` (datalist) idi: tarayıcıya göre farklı
 * davranıyor, yazdıkça süzme güvenilmez, mobilde kötü açılıyordu. Üstelik
 * katalog dışı bir ad girilince hiçbir yere kaydedilmiyordu — aynı işlem
 * her seferinde elle yazılıyordu.
 *
 * Şimdi: yazdıkça süzülen liste, Türkçe duyarlı arama (İ/ı), bulunamazsa
 * "listeye ekleyeyim mi?" sorusu. Katalog kullanıldıkça kendi kendine
 * zenginleşir.
 *
 * Form uyumu: gizli input ile `name` korunur, mevcut submitIslem akışı
 * değişmez.
 */

/** Türkçe duyarlı karşılaştırma: "İĞNE" ile "igne" eşleşsin. */
const sadele = (s: string) =>
  s.toLocaleLowerCase('tr')
    .replace(/[ıİ]/g, 'i').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c')
    .trim()

export default function IslemAdiSecici({
  catalog, name, placeholder = 'İşlem adı *', required, inputCls,
  onSec,
}: {
  catalog: CatalogItem[]
  name: string
  placeholder?: string
  required?: boolean
  inputCls: string
  /** Katalogdan seçilince varsayılan fiyatı forma yazdırmak için. */
  onSec?: (kalem: CatalogItem) => void
}) {
  const [deger, setDeger] = useState('')
  const [acik, setAcik] = useState(false)
  const [eklendi, setEklendi] = useState<string[]>([])
  const [pending, startTransition] = useTransition()
  const kutu = useRef<HTMLDivElement>(null)

  // Dışarı tıklayınca kapansın.
  useEffect(() => {
    function dinle(e: MouseEvent) {
      if (kutu.current && !kutu.current.contains(e.target as Node)) setAcik(false)
    }
    document.addEventListener('mousedown', dinle)
    return () => document.removeEventListener('mousedown', dinle)
  }, [])

  const tumKalemler = useMemo(
    () => [...catalog.map(c => c.name), ...eklendi],
    [catalog, eklendi])

  // Boş kutuda TÜM katalog listelenir — kesersek alfabetik sıra yüzünden
  // yalnız ilk harfler görünüyordu (55 kalemde hepsi "Botoks" çıkıyordu).
  // Kutu zaten kaydırılabilir; arama yazıldıkça süzülür.
  const suzulen = useMemo(() => {
    const q = sadele(deger)
    if (!q) return catalog
    return catalog.filter(c => sadele(c.name).includes(q))
  }, [catalog, deger])

  /** Kategoriye göre grupla — başlıklı liste için. */
  const gruplu = useMemo(() => {
    const m = new Map<string, CatalogItem[]>()
    for (const c of suzulen) {
      const k = c.category || 'Diğer'
      const v = m.get(k)
      if (v) v.push(c)
      else m.set(k, [c])
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0], 'tr'))
  }, [suzulen])

  // Yazılan ad katalogda var mı? Yoksa "ekle" teklifi çıkar.
  const tamEslesme = tumKalemler.some(n => sadele(n) === sadele(deger))
  const ekleTeklifi = deger.trim().length >= 2 && !tamEslesme

  function sec(kalem: CatalogItem) {
    setDeger(kalem.name)
    setAcik(false)
    onSec?.(kalem)
  }

  function katalogaEkle() {
    const ad = deger.trim()
    startTransition(async () => {
      const r = await addKatalogKalem(ad)
      if (r.ok) {
        setEklendi(p => [...p, ad])
        setAcik(false)
      }
    })
  }

  return (
    <div ref={kutu} className="relative min-w-0">
      <input type="hidden" name={name} value={deger} />
      <input
        value={deger}
        onChange={e => { setDeger(e.target.value); setAcik(true) }}
        onFocus={() => setAcik(true)}
        onKeyDown={e => {
          if (e.key === 'Escape') setAcik(false)
          // Tek sonuç varsa Enter onu seçsin — formu erken göndermesin.
          if (e.key === 'Enter' && acik && suzulen.length === 1) {
            e.preventDefault(); sec(suzulen[0])
          }
        }}
        placeholder={placeholder}
        required={required}
        /* Tarayıcının kendi "daha önce yazdıkların" önerisi KAPALI: katalog
           listesinin üstüne biniyor, iki ayrı öneri kutusu çıkıyordu.
           Chrome "off" değerini sık sık yok sayar; tanımadığı bir değer
           verince hatırlamayı gerçekten bırakır. */
        autoComplete="new-password"
        name={`islem-ara-${name}`}
        className={inputCls}
      />

      {acik && (suzulen.length > 0 || ekleTeklifi) && (
        <div className="absolute z-30 left-0 right-0 mt-1 rounded-lg bg-slate-900 border border-slate-700
                        shadow-xl h-64 overflow-y-auto">
          {/* Kategori başlıklarıyla gruplu: 55 kalem düz liste olunca göz
              kayboluyor, hangi grupta olduğu anlaşılmıyor. */}
          {gruplu.map(([kategori, kalemler]) => (
            <div key={kategori}>
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider
                            text-slate-500 bg-slate-900 sticky top-0">
                {kategori}
              </p>
              {kalemler.map(c => (
                <button key={c.id} type="button" onClick={() => sec(c)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-violet-600/30
                             flex items-center justify-between gap-2">
                  <span className="truncate">{c.name}</span>
                  {c.default_price ? (
                    <span className="text-[11px] text-slate-500 tabular-nums shrink-0">
                      ₺{Math.round(c.default_price).toLocaleString('tr-TR')}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ))}

          {ekleTeklifi && (
            <div className="border-t border-slate-700 p-2">
              <p className="text-[11px] text-slate-400 mb-1.5">
                &ldquo;<b className="text-slate-200">{deger.trim()}</b>&rdquo; listede yok.
              </p>
              <button type="button" disabled={pending} onClick={katalogaEkle}
                className="w-full px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600
                           hover:bg-emerald-500 text-white disabled:opacity-50">
                {pending ? 'Ekleniyor…' : 'İşlem listesine ekle'}
              </button>
              <p className="text-[11px] text-slate-500 mt-1 text-center">
                Eklemeden de kullanabilirsiniz.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
