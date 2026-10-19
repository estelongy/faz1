'use client'

import { useState, useTransition } from 'react'
import { davetBaslat, kodDogrula } from './actions'
import { turBilgi } from '@/app/klinik/panel/muhasebe/referans-tipler'

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
  /** Birikmiş referans cirosu — kademe bundan belirlenir. */
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
  }[]
}

const TRY = (n: number) => '₺' + Math.round(n).toLocaleString('tr-TR')
/** Puan TL değil — ₺ işareti kullanılmaz ki para ile karışmasın. */
const PUAN = (n: number) => Math.round(n).toLocaleString('tr-TR')

const inputCls = 'w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500'

function maskeTel(tel: string | null): string {
  if (!tel) return ''
  const d = tel.replace(/\D/g, '')
  if (d.length < 10) return tel
  return `${d.slice(0, 4)} *** ** ${d.slice(-2)}`
}

export default function ReferansorPanel({ veri }: { veri: PanelVerisi }) {
  const [pending, startTransition] = useTransition()
  const [sekme, setSekme] = useState<'kod' | 'puan' | 'referans' | 'davet'>('kod')
  const [hata, setHata] = useState<string | null>(null)
  const [altinKod, setAltinKod] = useState<{ kod: string; kisa: string } | null>(null)
  // Referansör adayı başvuru linki — pano çalışmazsa ekranda kalır.
  const [basvuruLink, setBasvuruLink] = useState<string | null>(null)

  // Kampanya başına ad/telefon girişi
  const [form, setForm] = useState<Record<string, { ad: string; tel: string }>>({})
  // Bekleyen davet başına doğrulama kodu girişi
  const [kodlar, setKodlar] = useState<Record<string, string>>({})

  const gelen = veri.davetler.filter(d => d.geldi === true).length
  const bekleyen = veri.bekleyen_link.length

  const alan = (id: string) => form[id] ?? { ad: '', tel: '' }

  /** 1. adım — ad + telefon gir, müşteriye doğrulama SMS'i gitsin. */
  function basla(offerId: string) {
    setHata(null); setAltinKod(null)
    const f = alan(offerId)
    startTransition(async () => {
      const r = await davetBaslat(veri.onek, offerId, f.ad, f.tel)
      if (!r.ok) { setHata(r.error); return }
      setForm(p => ({ ...p, [offerId]: { ad: '', tel: '' } }))
    })
  }

  /** Onay kodu süresi dolduysa aynı kişiye yeni kod gönderir. */
  function tekrarGonder(offerId: string, ad: string, tel: string) {
    setHata(null); setAltinKod(null)
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
      setAltinKod({ kod: r.kod, kisa: r.kisa })
      setKodlar(p => ({ ...p, [token]: '' }))
    })
  }

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs font-bold text-violet-300 tracking-wider">ESTELONGY TAVSİYE</p>
        <h1 className="text-xl font-black text-white mt-0.5 leading-tight">{veri.ad}</h1>
        <p className="font-mono text-sm text-slate-500 mt-0.5">{veri.onek}</p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        {[
          ['Gelen', String(gelen), 'text-emerald-300'],
          ['Bekleyen', String(bekleyen), 'text-amber-300'],
          ['Puan', PUAN(veri.puan), 'text-violet-300'],
        ].map(([etiket, deger, renk]) => (
          <div key={etiket} className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-2.5 text-center">
            <p className={`text-lg font-black tabular-nums ${renk}`}>{deger}</p>
            <p className="text-[11px] text-slate-500 font-semibold">{etiket}</p>
          </div>
        ))}
      </div>

      {hata && (
        <p className="text-sm font-semibold px-3 py-2 rounded-lg bg-rose-500/15 text-rose-300">{hata}</p>
      )}

      {/* Altın kod çıktı */}
      {altinKod && (
        <div className="bg-amber-500/10 ring-1 ring-amber-500/40 rounded-2xl p-5 text-center space-y-2">
          <p className="text-xs font-bold text-amber-300">ALTIN KOD HAZIR</p>
          <p className="font-mono text-xs text-slate-500">{altinKod.kod.split('-')[0]}-</p>
          <p className="font-mono text-4xl font-black text-amber-300 tracking-[0.2em]">
            {altinKod.kisa}
          </p>
          <p className="text-[11px] text-slate-400">
            Kod müşteriye SMS&rsquo;le de gönderildi. Klinikte bunu söylemesi yeterli.
          </p>
          <button
            onClick={() => navigator.clipboard?.writeText(altinKod.kisa).catch(() => {})}
            className="w-full mt-1 px-3 py-2 rounded-lg text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-200">
            Kodu Kopyala
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
                <input value={f.ad}
                  onChange={e => setForm(p => ({ ...p, [t.id]: { ...alan(t.id), ad: e.target.value } }))}
                  placeholder="Adı Soyadı" className={inputCls} />
                <input value={f.tel}
                  onChange={e => setForm(p => ({ ...p, [t.id]: { ...alan(t.id), tel: e.target.value } }))}
                  placeholder="Telefonu" inputMode="tel" className={inputCls} />
                <button type="submit" disabled={pending || !f.ad.trim() || !f.tel.trim()}
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
              Gönderdiğiniz her işlemde size <b className="text-violet-300">%{veri.havuz}</b> pay
              ayrılır. Bunun en az <b className="text-white">%{veri.musteri_min}</b>ini
              müşterinize indirim olarak verirsiniz, en çok %{veri.musteri_max} verebilirsiniz.
              Kalanı puan olarak size geçer.
            </p>
            <p className="text-[11px] text-slate-500">
              Müşterinize daha fazla indirim verirseniz puanınız azalır — oranı siz seçersiniz.
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
              {veri.tip === 'uye' && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Ciro arttıkça payınız yükselir — şu an %{veri.havuz}.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── DAVET — referansör adayı başvuru linki ── */}
      {sekme === 'davet' && (
        <section className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <p className="text-sm font-bold text-white">Tanıdığınızı referansör yapın</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Başvuru linkini paylaşın. Başvuran kişi bilgilerini girer,
              klinik onayladıktan sonra o da referansör olur.
            </p>
            <button type="button"
              onClick={() => {
                const link = `${window.location.origin}/referansor-basvuru?ref=${veri.onek}`
                navigator.clipboard?.writeText(link).catch(() => {})
                setBasvuruLink(link)
              }}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white">
              Başvuru linkini kopyala
            </button>
            {basvuruLink && (
              <div className="bg-slate-950/60 rounded-lg p-2 space-y-1">
                <p className="text-[11px] text-emerald-300 font-semibold">Link kopyalandı</p>
                <p className="font-mono text-[11px] text-slate-400 break-all">{basvuruLink}</p>
                <a href={`https://wa.me/?text=${encodeURIComponent(`Merhaba, buradan referansör başvurusu yapabilirsin: ${basvuruLink}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="block text-center mt-1 px-3 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white">
                  WhatsApp&rsquo;tan gönder
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      <p className="text-[11px] text-slate-600 text-center pt-2">
        Bu sayfa size özeldir. Bağlantıyı paylaşmayın.
      </p>

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
