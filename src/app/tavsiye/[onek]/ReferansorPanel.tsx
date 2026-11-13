'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  davetBaslat, kodDogrula, adayOner, adayKodGonder, musaitlikGetir,
} from './actions'
import RandevuSecici, { type MusaitlikVerisi } from './RandevuSecici'
import { girisCik } from '../giris-actions'
import { turBilgi } from '@/app/klinik/panel/muhasebe/referans-tipler'
import { duzgunAd } from '@/app/klinik/panel/muhasebe/referans-mesajlar'

/** Aday tanıtımı — kararın dayanağı olduğu için alt sınır var. */
const TANITIM_MIN = 100
const TANITIM_MAX = 2000

export interface PanelVerisi {
  onek: string
  ad: string
  tip: 'uye' | 'kurumsal'
  aktif: boolean
  referrer_id: string
  /** Para defteri — puan satırları HARİÇ. */
  bakiye: number
  /** İşlem puanı bakiyesi; TL değil, ayrı birim. */
  puan: number
  puan_suresi_gecen: number
  puan_omru_gun: number | null
  /** Nakde dönerse eline geçecek tutar (hasta indiriminin yarısı düşülmüş). */
  nakit_karsiligi: number
  /** Birikmiş referans cirosu — gösterim amaçlı; kademe sistemi kalktı. */
  ciro: number
  /** Toplam iskonto havuzu % — müşteri indirimi + kendi puanı. */
  havuz: number
  musteri_min: number
  musteri_max: number
  puan_oran: number
  teklifler: {
    id: string; baslik: string; ayricalik: string; odul: number
    tur: string; gecerli_zaman: string | null
  }[]
  davetler: {
    kod: string; durum: string; musteri: string | null; teklif: string
    geldi: boolean | null; tarih: string; son: string
    tutar: number | null; indirim: number | null; puan: number | null
  }[]
  /** Doğrulama bekleyenler — referansör kodu sorup girecek. */
  bekleyen_link: {
    token: string; teklif: string; son: string
    ayricalik: string | null; gecerli_zaman: string | null
    offer_id: string
    aday_ad: string | null; aday_tel: string | null
    islem_notu: string | null
  }[]
}

const TRY = (n: number) => '₺' + Math.round(n).toLocaleString('tr-TR')
/** Puan TL değil — ₺ işareti kullanılmaz ki para ile karışmasın. */
const PUAN = (n: number) => Math.round(n).toLocaleString('tr-TR')

const inputCls = 'w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500'

/**
 * Telefonu yazarken biçimler: 5551112233 → 0(555) 111 22 33
 * Sunucu zaten normalize ediyor; bu yalnız ekran içindir — referansör
 * numarayı okurken hata yapmasın.
 */
function telMaskele(ham: string): string {
  let r = ham.replace(/\D/g, '')
  if (r.startsWith('90')) r = r.slice(2)
  if (r.startsWith('0')) r = r.slice(1)
  r = r.slice(0, 10)
  if (!r) return ''
  const p = [r.slice(0, 3), r.slice(3, 6), r.slice(6, 8), r.slice(8, 10)]
  let s = `0(${p[0]}`
  if (r.length > 3) s += `) ${p[1]}`
  if (r.length > 6) s += ` ${p[2]}`
  if (r.length > 8) s += ` ${p[3]}`
  return s
}

/** Ad SOYAD şart: tek kelime yeterli değil, klinik kimi bekleyeceğini bilmeli. */
const adGecerli = (ad: string) =>
  ad.trim().split(/\s+/).filter(p => p.length > 1).length >= 2

const telGecerli = (tel: string) => tel.replace(/\D/g, '').length >= 10

function maskeTel(tel: string | null): string {
  if (!tel) return ''
  const d = tel.replace(/\D/g, '')
  if (d.length < 10) return tel
  return `${d.slice(0, 4)} *** ** ${d.slice(-2)}`
}

export default function ReferansorPanel({ veri }: { veri: PanelVerisi }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [sekme, setSekme] = useState<'kod' | 'puan' | 'referans' | 'davet'>('kod')
  const [hata, setHata] = useState<string | null>(null)
  // Yalnızca "davet tamamlandı" bilgisi tutulur — kodun kendisi müşterinin,
  // referansör ekranında gösterilmez.
  const [altinKod, setAltinKod] = useState(false)
  // Aday önerisi formu. Link paylaşımı kaldırıldı: referansör adayı
  // tanıtıyor, klinik okuyup karar veriyor.
  const [aday, setAday] = useState({
    ad: '', tel: '', tip: '' as '' | 'bireysel' | 'isletme', tanitim: '',
  })
  const [adayGonderildi, setAdayGonderildi] = useState(false)
  // İki adım: 'form' bilgileri toplar, 'kod' adayın onayını bekler.
  // Aday kendi telefonuna gelen kodu söylemeden öneri gönderilemez.
  const [adayAdim, setAdayAdim] = useState<'form' | 'kod'>('form')
  const [adayKod, setAdayKod] = useState('')
  // Randevu takvimi — kampanya başına seçilen saat tutulur.
  const [musaitlik, setMusaitlik] = useState<MusaitlikVerisi | null>(null)
  const [randevu, setRandevu] = useState<Record<string, string | null>>({})

  // Takvim bir kez çekilir; panel açıkken yeniden sorulmaz.
  useEffect(() => {
    let iptal = false
    musaitlikGetir(veri.onek).then(d => {
      if (!iptal && d) setMusaitlik(d as unknown as MusaitlikVerisi)
    })
    return () => { iptal = true }
  }, [veri.onek])

  // Kampanya başına ad/telefon girişi
  const [form, setForm] = useState<Record<string, { ad: string; tel: string; not: string; ekstra: string }>>({})
  // Bekleyen davet başına doğrulama kodu girişi
  const [kodlar, setKodlar] = useState<Record<string, string>>({})

  const gelen = veri.davetler.filter(d => d.geldi === true).length
  const bekleyen = veri.bekleyen_link.length

  const alan = (id: string) => form[id] ?? { ad: '', tel: '', not: '', ekstra: '' }

  /** 1. adım — ad + telefon gir, müşteriye doğrulama SMS'i gitsin. */
  function basla(offerId: string) {
    setHata(null); setAltinKod(false)
    const f = alan(offerId)
    startTransition(async () => {
      const r = await davetBaslat(
        veri.onek, offerId, f.ad, f.tel, f.not, Number(f.ekstra) || 0,
        randevu[offerId] ?? null,
      )
      if (!r.ok) { setHata(r.error); return }
      setForm(p => ({ ...p, [offerId]: { ad: '', tel: '', not: '', ekstra: '' } }))
      setRandevu(p => ({ ...p, [offerId]: null }))
      // Slot artık rezerve: takvim yenilensin, başka davette dolu görünsün.
      musaitlikGetir(veri.onek).then(d => d && setMusaitlik(d as unknown as MusaitlikVerisi))
    })
  }

  /** Onay kodu süresi dolduysa aynı kişiye yeni kod gönderir. */
  function tekrarGonder(offerId: string, ad: string, tel: string) {
    setHata(null); setAltinKod(false)
    startTransition(async () => {
      const r = await davetBaslat(veri.onek, offerId, ad, tel)
      if (!r.ok) { setHata(r.error); return }
    })
  }

  /** 2. adım — müşteriden alınan kodu gir, altın kod üretilsin. */
  function dogrula(token: string) {
    setHata(null)
    startTransition(async () => {
      const r = await kodDogrula(veri.onek, token, kodlar[token] ?? '')
      if (!r.ok) { setHata(r.error); return }
      setAltinKod(true)
      setKodlar(p => ({ ...p, [token]: '' }))
    })
  }

  return (
    <div className="space-y-4">
      {/* ── ÜST ŞERİT — ad, önek ve üç sayı TEK SATIRDA ──
          Eskiden başlık 3 satır + 3 kutu = ekranın üçte biri yer kaplıyordu
          ve telefonda asıl iş (randevu, kod) ancak kaydırınca görünüyordu.
          Bilgi aynı, yer onda biri. */}
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-base font-black text-white leading-tight truncate">{veri.ad}</h1>
          <p className="font-mono text-[11px] text-slate-500 leading-tight">{veri.onek}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-right">
          {([
            [String(gelen), 'Gelen', 'text-emerald-300'],
            [String(bekleyen), 'Bekleyen', 'text-amber-300'],
            [PUAN(veri.puan), 'Puan', 'text-violet-300'],
          ] as const).map(([deger, etiket, renk]) => (
            <div key={etiket} className="leading-none">
              <p className={`text-sm font-black tabular-nums ${renk}`}>{deger}</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{etiket}</p>
            </div>
          ))}
        </div>
      </header>

      {hata && (
        <p className="text-sm font-semibold px-3 py-2 rounded-lg bg-rose-500/15 text-rose-300">{hata}</p>
      )}

      {/* Davet tamamlandı — kodun kendisi GÖSTERİLMEZ.
          Kod müşterinin; referansörün bilmesi gerekmiyor, takip
          "Referanslarım"da zaten duruyor. Kapatılabilir. */}
      {altinKod && (
        <div className="bg-emerald-500/10 ring-1 ring-emerald-500/40 rounded-2xl p-4
                        flex items-start gap-3">
          <p className="text-xl leading-none mt-0.5">✓</p>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-emerald-300">Altın kod müşteriye gönderildi</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Klinikte kodu söylemesi yeterli. Durumu Referanslarım&rsquo;dan takip edebilirsiniz.
            </p>
          </div>
          <button
            onClick={() => setAltinKod(false)}
            aria-label="Kapat"
            className="shrink-0 px-2 py-1 rounded-lg text-slate-400 hover:text-slate-200
                       hover:bg-slate-800 text-lg leading-none">
            ×
          </button>
        </div>
      )}

      {/* ── Doğrulama bekleyenler — ÖNCE, çünkü iş burada ── */}
      {sekme === 'kod' && veri.bekleyen_link.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-black text-white">Onay bekleyenler</h2>
          <p className="text-[11px] text-slate-500 -mt-1">
            Arayıp SMS&rsquo;le gelen onay kodunu sorun, buraya yazın.
          </p>
          {veri.bekleyen_link.map(l => (
            <div key={l.token} className="bg-slate-900 border border-amber-500/30 rounded-xl p-3">
              <p className="text-sm font-semibold text-white line-clamp-1">{l.aday_ad ?? '—'}</p>
              <p className="text-xs text-slate-500">
                {maskeTel(l.aday_tel)} · {l.teklif}
              </p>
              {l.islem_notu && (
                <p className="text-xs text-slate-400 mt-1 italic">&ldquo;{l.islem_notu}&rdquo;</p>
              )}
              <form className="flex gap-2 mt-2.5"
                onSubmit={e => { e.preventDefault(); dogrula(l.token) }}>
                <input
                  value={kodlar[l.token] ?? ''}
                  onChange={e => setKodlar(p => ({
                    ...p, [l.token]: e.target.value.replace(/\D/g, '').slice(0, 6),
                  }))}
                  placeholder="______" inputMode="numeric"
                  className={`${inputCls} text-center font-mono tracking-[0.3em]`} />
                <button type="submit" disabled={pending || (kodlar[l.token] ?? '').length < 6}
                  className="px-4 py-2.5 rounded-lg text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 disabled:opacity-40 whitespace-nowrap">
                  {pending ? '…' : 'Kodu Al'}
                </button>
              </form>
              {/* Onay kodunun süresi 30 dk; dolduysa buradan yenisi gönderilir. */}
              <button type="button" disabled={pending}
                onClick={() => tekrarGonder(l.offer_id, l.aday_ad ?? '', l.aday_tel ?? '')}
                className="mt-2 text-[11px] font-semibold text-slate-500 hover:text-slate-300 disabled:opacity-40">
                Kod gelmedi mi? Yeni onay kodu gönder
              </button>
            </div>
          ))}
        </section>
      )}

      {/* ── Kampanyalar — yeni davet ── */}
      {sekme === 'kod' && (
      <section className="space-y-2">
        <h2 className="text-sm font-black text-white">Tavsiye edebileceklerim</h2>
        {veri.teklifler.length === 0 ? (
          <p className="text-sm text-slate-500">Şu an aktif kampanya yok.</p>
        ) : veri.teklifler.map(t => {
          const f = alan(t.id)
          return (
            <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className={`inline-block text-[11px] font-bold px-1.5 py-0.5 rounded ring-1 mb-1.5 ${turBilgi(t.tur).ton}`}>
                {turBilgi(t.tur).ikon} {turBilgi(t.tur).ad}
              </span>
              <p className="text-sm font-bold text-white line-clamp-2 leading-tight">{t.baslik}</p>
              <p className="text-xs text-slate-400 mt-1 line-clamp-3">{t.ayricalik}</p>
              {t.gecerli_zaman && (
                <p className="text-[11px] text-teal-300/90 mt-1">🕐 {t.gecerli_zaman}</p>
              )}
              {t.odul > 0 && (
                <p className="text-[11px] text-violet-300 font-semibold mt-1">
                  Gelen her kişi için {TRY(t.odul)}
                </p>
              )}

              <form className="mt-2.5 space-y-2"
                onSubmit={e => { e.preventDefault(); basla(t.id) }}>
                <div>
                  <input value={f.ad}
                    onChange={e => setForm(p => ({ ...p, [t.id]: { ...alan(t.id), ad: e.target.value } }))}
                    placeholder="Adı Soyadı"
                    autoComplete="name"
                    className={`${inputCls} ${f.ad.trim() && !adGecerli(f.ad) ? 'border-rose-500' : ''}`} />
                  {f.ad.trim() && !adGecerli(f.ad) && (
                    <p className="text-[11px] text-rose-400 mt-1">Ad ve soyadı birlikte yazın.</p>
                  )}
                </div>
                <input value={f.tel}
                  onChange={e => setForm(p => ({
                    ...p, [t.id]: { ...alan(t.id), tel: telMaskele(e.target.value) },
                  }))}
                  placeholder="0(5__) ___ __ __"
                  inputMode="tel" autoComplete="tel" className={inputCls} />
                {/* Serbest not — klinik kodu uygularken görür. */}
                <input value={f.not}
                  onChange={e => setForm(p => ({ ...p, [t.id]: { ...alan(t.id), not: e.target.value } }))}
                  placeholder="İşlem / not (isteğe bağlı)" className={inputCls} />
                {/* Ek indirim KENDİ PUANINDAN. Klinik indirimi sabit, burada
                    seçilmiyor — sunulan tek şey bu. Bakiye yetmezse sunucu
                    daveti açmıyor. */}
                {veri.puan > 0 && (() => {
                  // Bakiye aşımı YAZARKEN görünmeli: sunucu zaten reddediyor
                  // ama referansör formu doldurup bastıktan sonra öğrenmesin.
                  const asim = (Number(f.ekstra) || 0) > veri.puan
                  return (
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Puanımdan ek indirim (isteğe bağlı)
                      </label>
                      <div className="relative">
                        <input value={f.ekstra}
                          onChange={e => setForm(p => ({
                            ...p, [t.id]: { ...alan(t.id), ekstra: e.target.value.replace(/\D/g, '') },
                          }))}
                          placeholder="0"
                          inputMode="numeric"
                          className={`${inputCls} pr-7 ${asim ? 'border-rose-500' : ''}`} />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-500">₺</span>
                      </div>
                      <p className={`text-[11px] mt-1 ${asim ? 'text-rose-400 font-semibold' : 'text-slate-500'}`}>
                        {asim
                          ? `Puanınız yetmiyor — en çok ${PUAN(veri.puan)} ₺`
                          : <>Kullanılabilir: <b className="text-violet-300">{PUAN(veri.puan)}</b> puan</>}
                      </p>
                    </div>
                  )
                })()}
                {/* Randevu seçimi — davet gönderilmeden önce.
                    Akış: bilgi → telefon → not → randevu → gönder. */}
                <RandevuSecici
                  musaitlik={musaitlik}
                  secili={randevu[t.id] ?? null}
                  onSec={d => setRandevu(p => ({ ...p, [t.id]: d }))} />

                <button type="submit"
                  disabled={pending || !adGecerli(f.ad) || !telGecerli(f.tel)
                    || (Number(f.ekstra) || 0) > veri.puan}
                  className="w-full px-3 py-2.5 rounded-lg text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50">
                  {pending ? 'Gönderiliyor…' : 'Davet Gönder'}
                </button>
              </form>
            </div>
          )
        })}
      </section>
      )}

      {/* ── Geçmiş ── */}
      {sekme === 'referans' && (
      <section className="space-y-2">
        <h2 className="text-sm font-black text-white">Referanslarım</h2>
        {veri.davetler.length === 0 ? (
          <p className="text-sm text-slate-500">Henüz altın kod üretmediniz.</p>
        ) : veri.davetler.map(d => (
          <div key={d.kod} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white line-clamp-1">{d.musteri ?? '—'}</p>
                <p className="text-xs text-slate-500 line-clamp-1">{d.teklif}</p>
                <p className="font-mono text-[11px] text-slate-600 mt-0.5">{d.kod}</p>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded shrink-0 ${
                d.geldi === true ? 'bg-emerald-500/20 text-emerald-300'
                : d.geldi === false ? 'bg-slate-800 text-slate-500'
                : d.durum !== 'aktif' ? 'bg-slate-800 text-slate-500'
                : 'bg-amber-500/20 text-amber-300'}`}>
                {d.geldi === true ? 'Geldi'
                  : d.geldi === false ? 'Gelmedi'
                  : d.durum === 'suresi_doldu' ? 'Süresi doldu'
                  : 'Bekliyor'}
              </span>
            </div>

            {/* Geldiyse para tarafı: ne ödedi, ne indirim gitti, ne kazandım */}
            {d.geldi === true && d.tutar !== null && (
              <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  İşlem <b className="text-slate-200 tabular-nums">{TRY(d.tutar)}</b>
                  {d.indirim ? (
                    <span className="text-slate-500"> · indirim {TRY(d.indirim)}</span>
                  ) : null}
                </span>
                {d.puan ? (
                  <span className="font-bold text-violet-300 tabular-nums">
                    +{PUAN(d.puan)} puan
                  </span>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </section>
      )}

      {/* ── PUAN ── */}
      {sekme === 'puan' && (
        <section className="space-y-3">
          <div className="bg-violet-500/10 ring-1 ring-violet-500/30 rounded-2xl p-5 text-center">
            <p className="text-4xl font-black text-violet-300 tabular-nums">
              {PUAN(veri.puan)}
            </p>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">kullanılabilir işlem puanı</p>
            <p className="text-[11px] text-slate-500 mt-2">
              1 puan = 1 ₺ · kliniğin işlemlerinde geçerli
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
            <p className="text-xs font-bold text-slate-300">Nasıl kazanıyorum?</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Gönderdiğiniz kişi <b className="text-white">%{veri.musteri_min}</b> indirim alır.
              Siz işlemin <b className="text-violet-300">%{veri.puan_oran}</b>&apos;sini puan
              olarak kazanırsınız.
            </p>
            <p className="text-[11px] text-slate-500">
              İşlemin ilk {TRY(10000)} lirasına %{veri.puan_oran}, üstüne %
              {Math.round(veri.puan_oran / 2)} puan yazılır.
            </p>
          </div>

          {veri.nakit_karsiligi > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-300">Nakde dönerse</span>
                <span className="text-lg font-black text-emerald-300 tabular-nums">
                  {TRY(veri.nakit_karsiligi)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Nakit tercih ederseniz müşterilerinize verdiğiniz indirimin yarısı düşülür.
                İşlem puanı olarak kullanmak her zaman daha avantajlıdır.
              </p>
            </div>
          )}

          {veri.puan_omru_gun && (
            <p className="text-[11px] text-slate-500 text-center">
              Puanlar kazanıldığı tarihten {Math.round(veri.puan_omru_gun / 30)} ay geçerlidir.
              {veri.puan_suresi_gecen > 0 && (
                <span className="block text-amber-400/80 mt-1">
                  {PUAN(veri.puan_suresi_gecen)} puanın süresi dolmuş.
                </span>
              )}
            </p>
          )}

          {veri.ciro > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-300">Toplam referans cironuz</span>
                <span className="text-sm font-black text-white tabular-nums">{TRY(veri.ciro)}</span>
              </div>
              {/* "Ciro arttıkça payınız yükselir" kaldırıldı: kademe sistemi
                  kalktı, oran herkes için sabit. Tutmayan vaat güven kırar. */}
              <p className="text-[11px] text-slate-500 mt-1">
                Gönderdiğiniz işlemlerin toplamı.
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── DAVET — aday önerisi (link paylaşımı YOK) ──
          Eskiden burada kopyalanabilir bir başvuru linki vardı: sabitti,
          sınırsızdı, gruba atılabiliyordu. Artık referansör adayı tanıtıyor,
          klinik okuyup karar veriyor. */}
      {sekme === 'davet' && (
        <section className="space-y-3">
          {adayGonderildi ? (
            <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 text-center space-y-2">
              <p className="text-3xl">✓</p>
              <p className="text-sm font-bold text-emerald-300">Öneriniz iletildi</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                Klinik tanıtımınızı okuyup karar verecek. Uygun görülürse
                adaya bilgilendirme mesajı gönderilir.
              </p>
              <button type="button"
                onClick={() => {
                  setAdayGonderildi(false)
                  setAday({ ad: '', tel: '', tip: '', tanitim: '' })
                  setAdayAdim('form')
                  setAdayKod('')
                }}
                className="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2">
                Başka birini öner
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div>
                {/* Büyük harf: başlık kutunun içinde kaybolmasın, referansör
                    ne yapacağını bir bakışta görsün. */}
                <p className="text-sm font-black text-white uppercase tracking-wide">
                  TANIDIĞINIZI REFERANSÖR OLARAK ÖNERİN
                </p>
                <p className="text-sm text-slate-400 leading-relaxed mt-1">
                  Bilgilerini bırakın ve kısaca tanıtın. Klinik değerlendirir;
                  uygun görülürse adaya kendi paneli açılır.
                </p>
              </div>

              <input
                value={aday.ad}
                onChange={e => setAday(a => ({ ...a, ad: e.target.value }))}
                placeholder="Adı Soyadı"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700
                           text-base text-white placeholder:text-slate-500
                           focus:outline-none focus:border-violet-500" />

              <input
                value={aday.tel}
                onChange={e => setAday(a => ({ ...a, tel: e.target.value }))}
                placeholder="0(5__) ___ __ __"
                inputMode="tel"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700
                           text-base text-white placeholder:text-slate-500
                           focus:outline-none focus:border-violet-500" />

              <div>
                <p className="text-xs font-bold text-slate-400 mb-1.5">Aday kim?</p>
                <div className="grid grid-cols-2 gap-2">
                  {([['bireysel', 'Bireysel'], ['isletme', 'İşletme']] as const).map(([d, etiket]) => (
                    <button key={d} type="button"
                      onClick={() => setAday(a => ({ ...a, tip: d }))}
                      className={`px-3 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                        aday.tip === d
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}>
                      {etiket}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <p className="text-xs font-bold text-slate-400">Adayı tanıtın</p>
                  <p className={`text-[11px] tabular-nums ${
                    aday.tanitim.trim().length < TANITIM_MIN ? 'text-slate-600' : 'text-emerald-400'
                  }`}>
                    {aday.tanitim.trim().length} / {TANITIM_MIN}
                  </p>
                </div>
                <textarea
                  value={aday.tanitim}
                  onChange={e => setAday(a => ({ ...a, tanitim: e.target.value.slice(0, TANITIM_MAX) }))}
                  rows={6}
                  placeholder="Kim olduğunu, ne iş yaptığını, çevresini ve neden uygun olduğunu yazın. Klinik kararını bu metne göre verecek."
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700
                             text-sm text-white placeholder:text-slate-600 leading-relaxed
                             focus:outline-none focus:border-violet-500" />
                <p className="text-[11px] text-slate-600 mt-1">
                  En az {TANITIM_MIN}, en fazla {TANITIM_MAX} karakter.
                </p>
              </div>

              {/* ADIM 1 — bilgiler tamam, adayın onayı isteniyor.
                  Rıza olmadan öneri gönderilmez: aday kendi telefonuna
                  gelen kodu referansöre söyleyerek kabul etmiş olur. */}
              {adayAdim === 'form' ? (
                <button type="button"
                  disabled={pending
                    || aday.ad.trim().split(/\s+/).filter(p => p.length > 1).length < 2
                    || aday.tel.replace(/\D/g, '').length < 10
                    || !aday.tip
                    || aday.tanitim.trim().length < TANITIM_MIN}
                  onClick={() => startTransition(async () => {
                    setHata(null)
                    const r = await adayKodGonder(aday.ad, aday.tel)
                    if (!r.ok) { setHata(r.error); return }
                    setAdayAdim('kod')
                  })}
                  className="w-full px-3 py-3 rounded-lg text-sm font-bold bg-violet-600
                             hover:bg-violet-500 disabled:opacity-40 text-white">
                  {pending ? 'Gönderiliyor…' : 'Onay kodu gönder'}
                </button>
              ) : (
                /* ADIM 2 — aday kodu söyledi, referansör giriyor. */
                <div className="space-y-2.5 pt-1 border-t border-slate-800">
                  <div className="rounded-lg bg-violet-500/10 ring-1 ring-violet-500/25 p-3">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <b className="text-white">{duzgunAd(aday.ad).split(' ')[0]}</b> adlı
                      kişiye onay kodu gönderildi. Kendisini arayın, kabul
                      ediyorsa size kodu söylesin.
                    </p>
                  </div>

                  <input
                    value={adayKod}
                    onChange={e => {
                      const next = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setAdayKod(next)
                    }}
                    placeholder="______"
                    inputMode="numeric"
                    autoFocus
                    className="w-full px-3 py-3 rounded-lg bg-slate-950 border border-slate-700
                               text-center font-mono text-2xl tracking-[0.4em] text-white
                               placeholder:text-slate-700 focus:outline-none focus:border-violet-500" />

                  <button type="button"
                    disabled={pending || adayKod.length < 6}
                    onClick={() => startTransition(async () => {
                      setHata(null)
                      const r = await adayOner(
                        veri.onek, aday.ad, aday.tel,
                        aday.tip as 'bireysel' | 'isletme', aday.tanitim, adayKod,
                      )
                      if (!r.ok) { setHata(r.error); setAdayKod(''); return }
                      setAdayGonderildi(true)
                      setAdayAdim('form')
                      setAdayKod('')
                    })}
                    className="w-full px-3 py-3 rounded-lg text-sm font-bold bg-violet-600
                               hover:bg-violet-500 disabled:opacity-40 text-white">
                    {pending ? 'Gönderiliyor…' : 'Değerlendirmeye gönder'}
                  </button>

                  <button type="button"
                    onClick={() => { setAdayAdim('form'); setAdayKod(''); setHata(null) }}
                    className="w-full text-xs text-slate-500 hover:text-slate-300">
                    Bilgileri düzelt
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <div className="pt-2 space-y-2 text-center">
        <p className="text-[11px] text-slate-600">
          Bu sayfa size özeldir. Bağlantıyı paylaşmayın.
        </p>
        {/* Ortak/ödünç cihazda oturumu kapatabilmeli. */}
        <button
          onClick={() => startTransition(async () => {
            await girisCik(veri.onek)
            router.refresh()
          })}
          className="text-[11px] text-slate-500 hover:text-slate-300 underline underline-offset-2">
          Çıkış yap
        </button>
      </div>

      {/* ── MOBİL ALT NAV — başparmak menzilinde 4 sekme ── */}
      <div className="h-20" aria-hidden />
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/98 backdrop-blur border-t border-slate-700"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto max-w-md grid grid-cols-4">
          {([
            { v: 'kod' as const, icon: '💳', label: 'Kod', badge: bekleyen },
            { v: 'puan' as const, icon: '⭐', label: 'Puan', badge: 0 },
            { v: 'referans' as const, icon: '👥', label: 'Referanslarım', badge: 0 },
            { v: 'davet' as const, icon: '🤝', label: 'Davet', badge: 0 },
          ]).map(t => (
            <button key={t.v}
              onClick={() => { setSekme(t.v); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                sekme === t.v ? 'text-violet-300' : 'text-slate-400'}`}>
              <span className="text-lg leading-none">{t.icon}</span>
              <span className="text-[10px] font-bold">{t.label}</span>
              {t.badge > 0 && (
                <span className="absolute top-1.5 right-1/2 translate-x-4 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center bg-amber-500/40 text-amber-100">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
