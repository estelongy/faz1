'use client'

import { useState, useTransition } from 'react'
import { davetBaslat, kodDogrula } from './actions'
import { turBilgi } from '@/app/klinik/panel/muhasebe/referans-tipler'

export interface PanelVerisi {
  onek: string
  ad: string
  aktif: boolean
  referrer_id: string
  bakiye: number
  teklifler: {
    id: string; baslik: string; ayricalik: string; odul: number
    tur: string; gecerli_zaman: string | null
  }[]
  davetler: {
    kod: string; durum: string; musteri: string | null; teklif: string
    geldi: boolean | null; tarih: string; son: string
  }[]
  /** Doğrulama bekleyenler — referansör kodu sorup girecek. */
  bekleyen_link: {
    token: string; teklif: string; son: string
    ayricalik: string | null; gecerli_zaman: string | null
    aday_ad: string | null; aday_tel: string | null
  }[]
}

const TRY = (n: number) => '₺' + Math.round(n).toLocaleString('tr-TR')

const inputCls = 'w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500'

function maskeTel(tel: string | null): string {
  if (!tel) return ''
  const d = tel.replace(/\D/g, '')
  if (d.length < 10) return tel
  return `${d.slice(0, 4)} *** ** ${d.slice(-2)}`
}

export default function ReferansorPanel({ veri }: { veri: PanelVerisi }) {
  const [pending, startTransition] = useTransition()
  const [hata, setHata] = useState<string | null>(null)
  const [altinKod, setAltinKod] = useState<{ kod: string; kisa: string } | null>(null)

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
          ['Kazanç', TRY(veri.bakiye), 'text-violet-300'],
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
      {veri.bekleyen_link.length > 0 && (
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
            </div>
          ))}
        </section>
      )}

      {/* ── Kampanyalar — yeni davet ── */}
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

      {/* ── Geçmiş ── */}
      <section className="space-y-2">
        <h2 className="text-sm font-black text-white">Tavsiyelerim</h2>
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
          </div>
        ))}
      </section>

      <p className="text-[11px] text-slate-600 text-center pt-2">
        Bu sayfa size özeldir. Bağlantıyı paylaşmayın.
      </p>
    </div>
  )
}
