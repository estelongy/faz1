'use client'

import { useState, useTransition } from 'react'
import { basvuruGonder } from './actions'

const inputCls = 'w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500'

export default function BasvuruFormu({ onek }: { onek: string }) {
  const [pending, startTransition] = useTransition()
  const [ad, setAd] = useState('')
  const [tel, setTel] = useState('')
  const [not, setNot] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderildi, setGonderildi] = useState(false)

  const gecerli = ad.trim().length >= 3 && tel.replace(/\D/g, '').length >= 10

  function gonder(e: React.FormEvent) {
    e.preventDefault()
    setHata(null)
    startTransition(async () => {
      const r = await basvuruGonder(onek, ad, tel, not)
      if (!r.ok) { setHata(r.error); return }
      setGonderildi(true)
    })
  }

  if (gonderildi) {
    return (
      <main className="min-h-dvh bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-4xl mb-3">✓</p>
          <h1 className="text-lg font-bold text-emerald-300">Başvurunuz alındı</h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Klinik başvurunuzu değerlendirecek. Onaylandığında size haber
            verilecek ve kendi tavsiye panelinizi kullanmaya başlayacaksınız.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-8">
      <form onSubmit={gonder} className="mx-auto w-full max-w-md space-y-4">
        <header>
          <p className="text-xs font-bold text-violet-400 uppercase tracking-wide">
            Referansör Başvurusu
          </p>
          <h1 className="text-xl font-black text-white mt-1">
            Tavsiye edin, kazanın
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Tanıdıklarınızı kliniğe yönlendirin; onlar indirimli işlem yaptırsın,
            siz işlem puanı kazanın. Puanlarınızı kliniğin hizmetlerinde
            kullanırsınız.
          </p>
        </header>

        <div className="space-y-2">
          <input value={ad} onChange={e => setAd(e.target.value)}
            placeholder="Adınız Soyadınız" autoComplete="name" className={inputCls} />
          <input value={tel} onChange={e => setTel(e.target.value)}
            placeholder="Telefon numaranız" inputMode="tel" autoComplete="tel"
            className={inputCls} />
          <textarea value={not} onChange={e => setNot(e.target.value)}
            placeholder="Eklemek istediğiniz bir şey var mı? (isteğe bağlı)"
            rows={3} className={inputCls} />
        </div>

        {hata && (
          <p className="text-sm font-semibold px-3 py-2 rounded-lg bg-rose-500/15 text-rose-300">
            {hata}
          </p>
        )}

        <button type="submit" disabled={pending || !gecerli}
          className="w-full py-3 rounded-xl font-bold bg-violet-500 hover:bg-violet-400 text-white disabled:opacity-40">
          {pending ? 'Gönderiliyor…' : 'Başvur'}
        </button>

        <p className="text-[11px] text-slate-600 text-center leading-relaxed">
          Bilgileriniz yalnızca başvurunuzu değerlendirmek için kullanılır.
          Başvurunuz klinik onayından sonra geçerlilik kazanır.
        </p>
      </form>
    </main>
  )
}
