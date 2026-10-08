'use client'

import { useMemo, useState, useTransition } from 'react'
import type { PatientRow } from './MuhasebeShellClient'
import { kisaKod, KAMPANYA_TURLERI, turBilgi, type KampanyaTur, type ReferansAyar, type ReferansTeklif, type ReferansorRow, type ReferansKod } from './referans-tipler'
import {
  saveReferansAyar, addReferansTeklif, toggleReferansTeklif,
  addReferansor, toggleReferansor, uretReferansLink, isaretleReferansZiyaret,
} from './referans-actions'

const inputCls = 'w-full px-2.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500'
const btnPrimary = 'px-3 py-2 rounded-lg text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50'

const gunFarki = (iso: string) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)

/** Telefonu maskele: 0532 *** ** 67 */
function maskeTel(tel: string | null): string {
  if (!tel) return '—'
  const d = tel.replace(/\D/g, '')
  if (d.length < 10) return tel
  return `${d.slice(0, 4)} *** ** ${d.slice(-2)}`
}

export default function ReferansPanel({
  ayar, teklifler, referansorler, kodlar, patients,
}: {
  ayar: ReferansAyar | null
  teklifler: ReferansTeklif[]
  referansorler: ReferansorRow[]
  kodlar: ReferansKod[]
  patients: PatientRow[]
}) {
  const [pending, startTransition] = useTransition()
  const [mesaj, setMesaj] = useState<{ tip: 'ok' | 'hata'; metin: string } | null>(null)
  const [arama, setArama] = useState('')
  const [sekme, setSekme] = useState<'kodlar' | 'referansorler' | 'teklifler' | 'ayar'>('kodlar')
  const [yeniRefArama, setYeniRefArama] = useState('')
  const [yeniTur, setYeniTur] = useState<KampanyaTur>('tanisma')

  const isletmeKodu = ayar?.isletme_kodu ?? 'GOK'

  const hastaBul = useMemo(() => {
    const m = new Map(patients.map(p => [p.id, p]))
    return (id: string) => m.get(id)
  }, [patients])

  const teklifAdi = useMemo(() => {
    const m = new Map(teklifler.map(t => [t.id, t.baslik]))
    return (id: string) => m.get(id) ?? '—'
  }, [teklifler])

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const r = await fn()
      setMesaj(r.ok ? { tip: 'ok', metin: 'Kaydedildi' } : { tip: 'hata', metin: r.error ?? 'Hata' })
      setTimeout(() => setMesaj(null), 4000)
    })
  }

  const bekleyen = kodlar.filter(k => k.geldi === null && k.durum === 'aktif')

  // Arama boşken SADECE bekleyenler listelenir — kasada bakılan budur.
  // Geçmiş kodlar yüzlerceyi bulur; onlara ancak kod yazarak ulaşılır.
  // Arama: müşteri sadece kısa kodu söyler ("K7MP"); tam kod ve ad da aranır.
  const filtreliKodlar = useMemo(() => {
    const q = arama.trim().toUpperCase().replace(/-/g, '')
    if (!q) return bekleyen
    return kodlar.filter(k =>
      k.kod.toUpperCase().replace(/-/g, '').includes(q) ||
      (k.musteri_ad ?? '').toUpperCase().includes(arama.trim().toUpperCase()))
  }, [kodlar, bekleyen, arama])

  const mevcutRefIds = useMemo(
    () => new Set(referansorler.map(r => r.patient_id)), [referansorler])
  const adaylar = useMemo(() => {
    const q = yeniRefArama.trim().toLocaleLowerCase('tr')
    if (q.length < 2) return []
    return patients
      .filter(p => !mevcutRefIds.has(p.id) && p.name.toLocaleLowerCase('tr').includes(q))
      .slice(0, 6)
  }, [patients, yeniRefArama, mevcutRefIds])

  return (
    <div className="space-y-3">
      {mesaj && (
        <p className={`text-sm font-semibold px-3 py-2 rounded-lg ${
          mesaj.tip === 'ok' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
          {mesaj.metin}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {([
          ['kodlar', `Kodlar${bekleyen.length ? ` · ${bekleyen.length} bekliyor` : ''}`],
          ['referansorler', `Referansörler · ${referansorler.length}`],
          ['teklifler', `Kampanyalar · ${teklifler.filter(t => t.aktif).length}`],
          ['ayar', 'Ayarlar'],
        ] as const).map(([k, etiket]) => (
          <button key={k} onClick={() => setSekme(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              sekme === k ? 'bg-violet-500/25 text-violet-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}>
            {etiket}
          </button>
        ))}
      </div>

      {/* ══ KODLAR ══ */}
      {sekme === 'kodlar' && (
        <div className="space-y-2">
          <input value={arama} onChange={e => setArama(e.target.value)}
            placeholder="Müşterinin söylediği kod (örn. K7MP) veya adı"
            className={inputCls} />

          {!arama && (
            <p className="text-[11px] text-slate-500 -mt-1">
              Bekleyen kodlar listeleniyor. Geçmişe ulaşmak için kodu yazın.
            </p>
          )}

          {filtreliKodlar.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              {arama ? 'Kod bulunamadı.'
                : kodlar.length ? 'Bekleyen kod yok.'
                : 'Henüz kod üretilmedi.'}
            </p>
          ) : filtreliKodlar.map(k => {
            const ref = referansorler.find(r => r.id === k.referrer_id)
            const refHasta = ref ? hastaBul(ref.patient_id) : undefined
            const kalan = gunFarki(k.son_kullanma)
            return (
              <div key={k.id} className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  {/* Okunan kısım baskın; önek sadece teyit için */}
                  <span className="font-mono text-xs text-slate-500">{k.kod.split('-')[0]}-</span>
                  <span className="font-mono text-xl font-black text-amber-300 tracking-wider">{kisaKod(k.kod)}</span>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ml-auto shrink-0 ${
                    k.geldi === true ? 'bg-emerald-500/20 text-emerald-300'
                    : k.geldi === false ? 'bg-slate-700 text-slate-400'
                    : k.durum !== 'aktif' ? 'bg-slate-700 text-slate-500'
                    : 'bg-amber-500/20 text-amber-300'}`}>
                    {k.geldi === true ? 'Geldi' : k.geldi === false ? 'Gelmedi'
                      : k.durum === 'suresi_doldu' ? 'Süresi doldu'
                      : kalan > 0 ? `${kalan} gün kaldı` : 'Son gün'}
                  </span>
                </div>

                <p className="text-sm text-white font-semibold mt-1.5 line-clamp-1">{k.musteri_ad ?? '—'}</p>
                <p className="text-xs text-slate-400">
                  {maskeTel(k.musteri_tel)} · {teklifAdi(k.offer_id)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  Referansör: <span className="text-slate-300">{refHasta?.name ?? '—'}</span>
                </p>

                {/* "Gelmedi" butonu kaldırıldı: hiçbir şey değiştirmiyordu,
                    kod zaten süresi dolunca kendiliğinden ölüyor. Gelmezse
                    hiçbir şeye basılmaz. */}
                {k.geldi === null && k.durum === 'aktif' && (
                  <button disabled={pending}
                    onClick={() => run(() => isaretleReferansZiyaret(k.id, true))}
                    className="w-full mt-2.5 px-3 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50">
                    Geldi
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ══ REFERANSÖRLER ══ */}
      {sekme === 'referansorler' && (
        <div className="space-y-2">
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
            <p className="text-xs font-bold text-slate-300 mb-2">Hastayı referansör yap</p>
            <input value={yeniRefArama} onChange={e => setYeniRefArama(e.target.value)}
              placeholder="Hasta adı ara…" className={inputCls} />
            {adaylar.map(p => (
              <button key={p.id} disabled={pending}
                onClick={() => { run(() => addReferansor(p.id)); setYeniRefArama('') }}
                className="w-full text-left px-2.5 py-2 mt-1 rounded-lg bg-slate-800 hover:bg-violet-600/30 text-sm text-white disabled:opacity-50">
                {p.name}
                {p.patient_code && <span className="ml-2 text-[10px] font-mono text-slate-500">{p.patient_code}</span>}
              </button>
            ))}
          </div>

          {referansorler.map(r => {
            const p = hastaBul(r.patient_id)
            const kendi = kodlar.filter(k => k.referrer_id === r.id)
            const gelen = kendi.filter(k => k.geldi === true).length
            return (
              <div key={r.id} className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white line-clamp-2 leading-tight">{p?.name ?? '—'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className="font-mono text-violet-300">{r.onek}{isletmeKodu}</span>
                      {' · '}{kendi.length} davet · <span className="text-emerald-400">{gelen} geldi</span>
                    </p>
                  </div>
                  <button disabled={pending}
                    onClick={() => run(() => toggleReferansor(r.id, !r.aktif))}
                    className={`text-[11px] font-bold px-2 py-1 rounded shrink-0 ${
                      r.aktif ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-500'}`}>
                    {r.aktif ? 'Aktif' : 'Pasif'}
                  </button>
                </div>

                {r.aktif && teklifler.some(t => t.aktif) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {teklifler.filter(t => t.aktif).map(t => (
                      <button key={t.id} disabled={pending}
                        onClick={() => run(async () => {
                          const res = await uretReferansLink(r.id, t.id)
                          if (res.ok) {
                            const row = Array.isArray(res.data) ? res.data[0] as { token?: string } : null
                            if (row?.token) {
                              try {
                                await navigator.clipboard.writeText(`${window.location.origin}/t/${row.token}`)
                              } catch { /* pano yoksa sessiz geç */ }
                            }
                          }
                          return res
                        })}
                        title="Boş davet linki üretir ve panoya kopyalar"
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-violet-600/40 text-slate-300 disabled:opacity-50">
                        🔗 {t.baslik}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ══ TEKLİFLER ══ */}
      {sekme === 'teklifler' && (
        <div className="space-y-2">
          <form className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 space-y-2"
            onSubmit={e => {
              e.preventDefault()
              const form = e.currentTarget
              const fd = new FormData(form)
              form.reset()
              run(() => addReferansTeklif(fd))
            }}>
            {/* Tür — referansörün taşıdığı haberin cinsi */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 mb-1.5">Kampanya türü</p>
              <div className="flex flex-wrap gap-1.5">
                {KAMPANYA_TURLERI.map(t => (
                  <button key={t.k} type="button" onClick={() => setYeniTur(t.k)}
                    title={t.aciklama}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold ring-1 transition-colors ${
                      yeniTur === t.k ? t.ton : 'bg-slate-800 ring-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                    {t.ikon} {t.ad}
                  </button>
                ))}
              </div>
              <input type="hidden" name="tur" value={yeniTur} />
              <p className="text-[11px] text-slate-500 mt-1.5">{turBilgi(yeniTur).aciklama}</p>
            </div>

            <input name="baslik" placeholder="Kampanya başlığı * (örn. Botoks tanışma)" required className={inputCls} />
            <input name="ayricalik" placeholder="Müşteriye görünen ayrıcalık *" required className={inputCls} />

            {/* Sakin saat: hangi gün/saat geçerli */}
            {yeniTur === 'sakin_saat' && (
              <input name="gecerli_zaman" placeholder="Geçerli gün/saat (örn. Salı–Çarşamba 10:00-14:00)"
                className={inputCls} />
            )}

            {/* Model: görsel kullanım izni */}
            {yeniTur === 'model' && (
              <label className="flex items-start gap-2 text-xs text-slate-300 bg-fuchsia-500/10 ring-1 ring-fuchsia-500/25 rounded-lg px-2.5 py-2">
                <input type="checkbox" name="gorsel_izni" defaultChecked className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Müşteriden <b>görsel kullanım izni</b> istenir; rıza ayrı sürümle kaydedilir.
                  <span className="block text-slate-500 mt-0.5">
                    Fotoğraf sağlık verisidir — izin yazılı alınmadan kullanılamaz.
                  </span>
                </span>
              </label>
            )}

            <div className="grid grid-cols-3 gap-2">
              <input name="odul_tutar" type="number" min="0" placeholder="Referansör ödülü ₺"
                className={inputCls} title="Gelen her kişi için referansöre yazılacak tutar" />
              <input name="kontenjan" type="number" min="0" placeholder="Kontenjan" className={inputCls} />
              <input name="gecerli_bitis" type="date" className={inputCls} title="Geçerlilik bitişi" />
            </div>
            <button type="submit" disabled={pending} className={btnPrimary}>Kampanya Ekle</button>
          </form>

          {teklifler.map(t => {
            const tb = turBilgi(t.tur)
            return (
              <div key={t.id} className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <span className={`inline-block text-[11px] font-bold px-1.5 py-0.5 rounded ring-1 mb-1 ${tb.ton}`}>
                      {tb.ikon} {tb.ad}
                    </span>
                    <p className="text-sm font-semibold text-white line-clamp-2 leading-tight">{t.baslik}</p>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{t.ayricalik}</p>
                    {t.gecerli_zaman && (
                      <p className="text-[11px] text-teal-300/90 mt-0.5">🕐 {t.gecerli_zaman}</p>
                    )}
                    {t.gorsel_izni && (
                      <p className="text-[11px] text-fuchsia-300/90 mt-0.5">📸 Görsel kullanım izni istenir</p>
                    )}
                    <p className="text-[11px] text-slate-500 mt-1">
                      {t.odul_tutar > 0 ? `Ödül ₺${t.odul_tutar.toLocaleString('tr-TR')} · ` : ''}
                      {t.kontenjan ? `Kontenjan ${t.kontenjan}` : 'Sınırsız'}
                      {t.gecerli_bitis ? ` · ${t.gecerli_bitis} tarihine kadar` : ''}
                    </p>
                  </div>
                  <button disabled={pending}
                    onClick={() => run(() => toggleReferansTeklif(t.id, !t.aktif))}
                    className={`text-[11px] font-bold px-2 py-1 rounded shrink-0 ${
                      t.aktif ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-500'}`}>
                    {t.aktif ? 'Aktif' : 'Pasif'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══ AYARLAR ══ */}
      {sekme === 'ayar' && (
        <form className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 space-y-3"
          onSubmit={e => { e.preventDefault(); run(() => saveReferansAyar(new FormData(e.currentTarget))) }}>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" name="aktif" defaultChecked={ayar?.aktif ?? true} className="w-4 h-4" />
            Referans sistemi açık
          </label>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">İşletme kodu (2-5 harf)</label>
            <input name="isletme_kodu" defaultValue={isletmeKodu} maxLength={5}
              className={`${inputCls} font-mono uppercase`} />
            <p className="text-[11px] text-slate-500 mt-1">
              Kodda şöyle görünür: <span className="font-mono text-slate-400">GA3{isletmeKodu}-</span>
              <span className="font-mono text-amber-300 font-bold">K7MP</span>
              {' — müşteri sadece sarı kısmı söyler.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Kod ömrü (gün)</label>
              <input name="kod_omru_gun" type="number" min="1" max="90"
                defaultValue={ayar?.kod_omru_gun ?? 7} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Aylık davet limiti</label>
              <input name="aylik_limit" type="number" min="0"
                defaultValue={ayar?.aylik_limit ?? 10} className={inputCls} />
              <p className="text-[11px] text-slate-500 mt-1">Referansör başına · 0 = sınırsız</p>
            </div>
          </div>

          <button type="submit" disabled={pending} className={btnPrimary}>Ayarları Kaydet</button>
        </form>
      )}
    </div>
  )
}
