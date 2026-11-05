'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { girisKodGonder, girisKodDogrula } from './giris-actions'
import { OTURUM_GUN } from './giris-sabit'

/**
 * Referansör giriş formu — telefon + SMS kodu.
 *
 * İki yerde kullanılır:
 *   /tavsiye            → önek bilinmiyor, doğrulama sonrası kendi paneline gider
 *   /tavsiye/<önek>     → çerez yoksa panelin önüne çıkar
 *
 * Kod 6 hanede otomatik gönderilir. Stale closure tuzağına düşmemek için
 * girilen değer doğrudan parametreyle geçilir (CLAUDE.md §14).
 */
export default function GirisFormu({ onek }: { onek?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [adim, setAdim] = useState<'telefon' | 'kod'>('telefon')
  const [tel, setTel] = useState('')
  const [kod, setKod] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [sayac, setSayac] = useState(0)

  useEffect(() => {
    if (sayac <= 0) return
    const t = setTimeout(() => setSayac(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [sayac])

  function kodIste() {
    setHata(null)
    startTransition(async () => {
      const r = await girisKodGonder(tel)
      if (!r.ok) { setHata(r.error); return }
      setAdim('kod')
      setSayac(180)
    })
  }

  function dogrula(girilen?: string) {
    const k = girilen ?? kod
    if (k.replace(/\D/g, '').length < 6) return
    setHata(null)
    startTransition(async () => {
      const r = await girisKodDogrula(tel, k)
      if (!r.ok) { setHata(r.error); setKod(''); return }
      // Kendi paneline git; zaten o paneldeyse yenile.
      if (onek && r.onek.toUpperCase() === onek.toUpperCase()) router.refresh()
      else router.replace(`/tavsiye/${r.onek}`)
    })
  }

  const inputCls = 'w-full px-3 py-3 rounded-xl bg-slate-900 ring-1 ring-slate-700 ' +
    'text-slate-100 placeholder:text-slate-500 outline-none focus:ring-violet-500'

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <p className="text-xs font-bold tracking-widest text-violet-400">ESTELONGY TAVSİYE</p>
        <h1 className="text-xl font-black text-white">Referansör Girişi</h1>
        <p className="text-sm text-slate-400">
          {adim === 'telefon'
            ? 'Telefon numaranızı yazın, giriş kodu gönderelim.'
            : 'Telefonunuza gelen 6 haneli kodu girin.'}
        </p>
      </div>

      {hata && (
        <p className="text-sm font-semibold px-3 py-2 rounded-lg bg-rose-500/15 text-rose-300">
          {hata}
        </p>
      )}

      {adim === 'telefon' ? (
        <form onSubmit={e => { e.preventDefault(); kodIste() }} className="space-y-3">
          <input
            value={tel}
            onChange={e => setTel(e.target.value)}
            placeholder="05xx xxx xx xx"
            inputMode="tel"
            autoComplete="tel"
            autoFocus
            className={inputCls}
          />
          <button
            type="submit"
            disabled={pending || tel.replace(/\D/g, '').length < 10}
            className="w-full px-3 py-3 rounded-xl text-sm font-bold bg-violet-600
                       hover:bg-violet-500 disabled:opacity-40 text-white">
            {pending ? '…' : 'Giriş Kodu Gönder'}
          </button>
        </form>
      ) : (
        <form onSubmit={e => { e.preventDefault(); dogrula() }} className="space-y-3">
          <input
            value={kod}
            onChange={e => {
              const next = e.target.value.replace(/\D/g, '').slice(0, 6)
              setKod(next)
              if (next.length === 6) dogrula(next)
            }}
            placeholder="______"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            className={`${inputCls} text-center font-mono text-2xl tracking-[0.4em]`}
          />
          <button
            type="submit"
            disabled={pending || kod.length < 6}
            className="w-full px-3 py-3 rounded-xl text-sm font-bold bg-violet-600
                       hover:bg-violet-500 disabled:opacity-40 text-white">
            {pending ? '…' : 'Giriş Yap'}
          </button>
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => { setAdim('telefon'); setKod(''); setHata(null) }}
              className="text-slate-400 hover:text-slate-200">
              Numarayı değiştir
            </button>
            <button
              type="button"
              disabled={sayac > 0 || pending}
              onClick={kodIste}
              className="text-violet-400 hover:text-violet-300 disabled:text-slate-600">
              {sayac > 0 ? `Tekrar gönder (${sayac})` : 'Tekrar gönder'}
            </button>
          </div>
        </form>
      )}

      <p className="text-[11px] text-center text-slate-500">
        Kayıtlı numaranıza kod gönderilir. Bu cihazda {OTURUM_GUN} gün açık kalır.
      </p>
    </div>
  )
}
