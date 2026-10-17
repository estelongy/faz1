'use client'

import { useState, useTransition } from 'react'
import { kurumKabulEt, kurumReddet } from './actions'

/**
 * Kurum daveti ekranı. Anlaşmanın ne getirdiği sayıyla anlatılır:
 * kurum havuzun tamamını alır, içinden müşterisine indirim verir,
 * kalan kendi işlem puanı olur.
 */
export default function KurumDavetAkisi({
  token, kurumAd, yetkili, havuz, musteriMin, musteriMax, durum,
}: {
  token: string
  kurumAd: string
  yetkili: string | null
  havuz: number
  musteriMin: number
  musteriMax: number
  durum: 'davet' | 'aktif' | 'red'
}) {
  const [pending, startTransition] = useTransition()
  const [sonuc, setSonuc] = useState<'aktif' | 'red' | null>(
    durum === 'davet' ? null : durum)
  const [hata, setHata] = useState<string | null>(null)

  // Örnek hesap: 8.000 ₺ işlem, asgari indirim verildiğinde
  const ornek = 8000
  const ornekIndirim = Math.round(ornek * musteriMin / 100)
  const ornekPuan = Math.round(ornek * havuz / 100) - ornekIndirim

  function yanitla(kabul: boolean) {
    setHata(null)
    startTransition(async () => {
      const r = kabul ? await kurumKabulEt(token) : await kurumReddet(token)
      if (!r.ok) { setHata(r.error); return }
      setSonuc(kabul ? 'aktif' : 'red')
    })
  }

  if (sonuc === 'aktif') {
    return (
      <main className="min-h-dvh bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-4xl mb-3">✓</p>
          <h1 className="text-lg font-bold text-emerald-300">Anlaşma başladı</h1>
          <p className="text-sm text-slate-300 mt-2">
            {kurumAd} artık referans gönderebilir. Klinik size kod linklerinizi
            iletecek.
          </p>
        </div>
      </main>
    )
  }

  if (sonuc === 'red') {
    return (
      <main className="min-h-dvh bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-bold text-slate-300">Davet reddedildi</h1>
          <p className="text-sm text-slate-500 mt-2">
            Fikrinizi değiştirirseniz klinikle görüşebilirsiniz.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-8">
      <div className="mx-auto w-full max-w-md space-y-4">
        <header>
          <p className="text-xs font-bold text-violet-400 uppercase tracking-wide">
            Referans Anlaşması
          </p>
          <h1 className="text-xl font-black text-white mt-1">{kurumAd}</h1>
          {yetkili && (
            <p className="text-sm text-slate-400 mt-0.5">Sayın {yetkili}</p>
          )}
        </header>

        <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-3xl font-black text-violet-300 tabular-nums">%{havuz}</p>
            <p className="text-xs text-slate-400 font-semibold">
              gönderdiğiniz her işlemde size ayrılan pay
            </p>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Bu payın <b className="text-white">en az %{musteriMin}</b>ini
            müşterinize indirim olarak verirsiniz; en çok %{musteriMax} verebilirsiniz.
            Kalanı <b className="text-violet-300">işlem puanı</b> olarak hesabınıza
            geçer — kliniğin hizmetlerinde kullanırsınız.
          </p>

          <div className="bg-slate-950/60 rounded-lg p-3 text-sm space-y-1.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase">
              Örnek · {ornek.toLocaleString('tr-TR')} ₺ işlem
            </p>
            <div className="flex justify-between text-slate-300">
              <span>Müşterinize indirim (%{musteriMin})</span>
              <span className="tabular-nums font-semibold">
                {ornekIndirim.toLocaleString('tr-TR')} ₺
              </span>
            </div>
            <div className="flex justify-between text-violet-300">
              <span className="font-semibold">Size işlem puanı</span>
              <span className="tabular-nums font-bold">
                {ornekPuan.toLocaleString('tr-TR')}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Müşterinize daha fazla indirim verirseniz puanınız azalır — oranı
            siz seçersiniz. Puanlar kazanıldığı tarihten 6 ay geçerlidir.
          </p>
        </div>

        {hata && (
          <p className="text-sm font-semibold px-3 py-2 rounded-lg bg-rose-500/15 text-rose-300">
            {hata}
          </p>
        )}

        <div className="flex gap-2">
          <button type="button" disabled={pending}
            onClick={() => yanitla(true)}
            className="flex-1 py-3 rounded-xl font-bold bg-violet-500 hover:bg-violet-400 text-white disabled:opacity-40">
            {pending ? '…' : 'Anlaşmayı kabul et'}
          </button>
          <button type="button" disabled={pending}
            onClick={() => yanitla(false)}
            className="px-4 py-3 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-40">
            Reddet
          </button>
        </div>
      </div>
    </main>
  )
}
