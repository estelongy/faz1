'use client'

import { useState, useTransition } from 'react'
import { turBilgi } from '@/app/klinik/panel/muhasebe/referans-tipler'
import { kodGonder, dogrulaVeKilitle } from './actions'

export interface DavetVerisi {
  token: string
  gecerli: boolean
  kilitli: boolean
  referansor: string | null
  baslik: string
  ayricalik: string
  tur: string
  gecerliZaman: string | null
  gorselIzni: boolean
}

const inputCls = 'w-full px-3 py-3 rounded-xl bg-slate-800 border border-slate-700 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500'
const btnCls = 'w-full px-4 py-3.5 rounded-xl text-base font-bold bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50'

export default function DavetAkisi({ veri }: { veri: DavetVerisi }) {
  const [pending, startTransition] = useTransition()
  const [adim, setAdim] = useState<'numara' | 'kod' | 'bitti'>('numara')
  const [hata, setHata] = useState<string | null>(null)
  const [ad, setAd] = useState('')
  const [tel, setTel] = useState('')
  const [smsKod, setSmsKod] = useState('')
  const [sonuc, setSonuc] = useState<{ kod: string; kisa: string } | null>(null)

  const tb = turBilgi(veri.tur)

  // ─── Geçersiz link ───
  if (!veri.gecerli) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">⌛</p>
        <h1 className="text-lg font-black text-white">
          {veri.kilitli ? 'Bu bağlantı kullanılmış' : 'Bağlantı geçerli değil'}
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          {veri.kilitli
            ? 'Her bağlantı tek kişiye özeldir. Sizi davet eden kişiden yeni bir bağlantı isteyebilirsiniz.'
            : 'Bağlantının süresi dolmuş olabilir. Sizi davet eden kişiden yeni bir bağlantı isteyin.'}
        </p>
      </div>
    )
  }

  function gonder() {
    setHata(null)
    startTransition(async () => {
      const r = await kodGonder(veri.token, tel)
      if (!r.ok) { setHata(r.error); return }
      setAdim('kod')
    })
  }

  function dogrula(kodDegeri?: string) {
    setHata(null)
    const k = kodDegeri ?? smsKod
    startTransition(async () => {
      const r = await dogrulaVeKilitle(veri.token, ad, k)
      if (!r.ok) { setHata(r.error); return }
      setSonuc({ kod: r.kod, kisa: r.kisa })
      setAdim('bitti')
    })
  }

  // ─── Kod alındı ───
  if (adim === 'bitti' && sonuc) {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <p className="text-4xl mb-2">🎉</p>
          <h1 className="text-lg font-black text-white">Kodunuz hazır</h1>
          <p className="text-sm text-slate-400 mt-1">Klinikte bu kodu söylemeniz yeterli.</p>
        </div>

        <div className="bg-amber-500/10 ring-1 ring-amber-500/40 rounded-2xl p-5 text-center">
          <p className="font-mono text-xs text-slate-500">{sonuc.kod.split('-')[0]}-</p>
          <p className="font-mono text-4xl font-black text-amber-300 tracking-[0.2em] mt-1">
            {sonuc.kisa}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <p className="text-sm font-bold text-white">{veri.baslik}</p>
          <p className="text-xs text-slate-400 mt-1">{veri.ayricalik}</p>
          {veri.gecerliZaman && (
            <p className="text-[11px] text-teal-300/90 mt-1">🕐 {veri.gecerliZaman}</p>
          )}
        </div>

        <button
          onClick={() => navigator.clipboard?.writeText(sonuc.kisa).catch(() => {})}
          className="w-full px-4 py-3 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-200">
          Kodu Kopyala
        </button>

        <p className="text-[11px] text-slate-500 text-center">
          Ekran görüntüsü alabilirsiniz. Kod size özeldir, bir kez kullanılır.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Teklif */}
      <div>
        <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded ring-1 ${tb.ton}`}>
          {tb.ikon} {tb.ad}
        </span>
        <h1 className="text-xl font-black text-white mt-2 leading-tight">{veri.baslik}</h1>
        <p className="text-sm text-slate-300 mt-1.5">{veri.ayricalik}</p>
        {veri.gecerliZaman && (
          <p className="text-xs text-teal-300/90 mt-1.5">🕐 {veri.gecerliZaman}</p>
        )}
        {veri.referansor && (
          <p className="text-xs text-slate-500 mt-2">
            <span className="text-slate-400">{veri.referansor}</span> sizi davet etti
          </p>
        )}
      </div>

      {hata && (
        <p className="text-sm font-semibold px-3 py-2 rounded-lg bg-rose-500/15 text-rose-300">{hata}</p>
      )}

      {/* 1. adım — ad + numara */}
      {adim === 'numara' && (
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); gonder() }}>
          <input value={ad} onChange={e => setAd(e.target.value)}
            placeholder="Adınız Soyadınız" required autoComplete="name" className={inputCls} />
          <input value={tel} onChange={e => setTel(e.target.value)}
            placeholder="Telefon numaranız" required inputMode="tel" autoComplete="tel"
            className={inputCls} />

          <label className="flex items-start gap-2 text-[11px] text-slate-400">
            <input type="checkbox" required className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Numaramın doğrulama ve randevu amacıyla işlenmesini kabul ediyorum.
              {veri.gorselIzni && (
                <span className="block text-fuchsia-300/90 mt-1">
                  Bu kampanya görsel kullanım izni içerir; detayı klinikte yazılı olarak onaylarsınız.
                </span>
              )}
            </span>
          </label>

          <button type="submit" disabled={pending || !ad.trim() || !tel.trim()} className={btnCls}>
            {pending ? 'Gönderiliyor…' : 'Doğrulama Kodu Gönder'}
          </button>
        </form>
      )}

      {/* 2. adım — SMS kodu */}
      {adim === 'kod' && (
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); dogrula() }}>
          <p className="text-sm text-slate-400">
            <span className="text-white font-semibold">{tel}</span> numarasına gönderilen 6 haneli kodu girin.
          </p>
          <input value={smsKod}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 6)
              setSmsKod(v)
              // 6 hane dolunca otomatik gönder — stale closure'a düşmemek için
              // değeri doğrudan geçiyoruz.
              if (v.length === 6) dogrula(v)
            }}
            placeholder="______" required inputMode="numeric" autoComplete="one-time-code"
            className={`${inputCls} text-center text-2xl font-mono tracking-[0.4em]`} />

          <button type="submit" disabled={pending || smsKod.length < 6} className={btnCls}>
            {pending ? 'Doğrulanıyor…' : 'Doğrula ve Kodumu Al'}
          </button>

          <button type="button" onClick={() => { setAdim('numara'); setSmsKod(''); setHata(null) }}
            className="w-full px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400">
            Numarayı değiştir
          </button>
        </form>
      )}

      <p className="text-[11px] text-slate-600 text-center">
        Bu bağlantı tek kişiye özeldir. Doğruladığınızda size kilitlenir.
      </p>
    </div>
  )
}
