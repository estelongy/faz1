'use client'

import { useMemo, useState, useTransition } from 'react'
import { odemeYaz } from './actions'

export interface ReferansorBakiye {
  id: string
  ad: string
  tel: string | null
  onek: string
  aktif: boolean
  hakedis: number
  odenen: number
  bakiye: number
}

export interface LedgerSatir {
  id: string
  referrer_id: string
  tur: 'hakedis' | 'odeme' | 'duzeltme'
  tutar: number
  aciklama: string | null
  created_at: string
}

const TRY = (n: number) => '₺' + Math.round(n).toLocaleString('tr-TR')
const tarih = (iso: string) => new Date(iso).toLocaleDateString('tr-TR')

const inputCls = 'w-full px-2.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500'

export default function ParaPanel({
  referansorler, ledger,
}: { referansorler: ReferansorBakiye[]; ledger: LedgerSatir[] }) {
  const [pending, startTransition] = useTransition()
  const [mesaj, setMesaj] = useState<{ tip: 'ok' | 'hata'; metin: string } | null>(null)
  const [acik, setAcik] = useState<string | null>(null)

  const toplam = useMemo(() => ({
    hakedis: referansorler.reduce((s, r) => s + r.hakedis, 0),
    odenen: referansorler.reduce((s, r) => s + r.odenen, 0),
    bakiye: referansorler.reduce((s, r) => s + r.bakiye, 0),
  }), [referansorler])

  const adBul = useMemo(() => {
    const m = new Map(referansorler.map(r => [r.id, r.ad]))
    return (id: string) => m.get(id) ?? '—'
  }, [referansorler])

  function ode(form: HTMLFormElement, referrerId: string) {
    const fd = new FormData(form)
    fd.set('referrer_id', referrerId)
    form.reset()
    startTransition(async () => {
      const r = await odemeYaz(fd)
      setMesaj(r.ok
        ? { tip: 'ok', metin: 'Ödeme kaydedildi' }
        : { tip: 'hata', metin: r.error })
      setTimeout(() => setMesaj(null), 4000)
    })
  }

  return (
    <div className="space-y-3">
      {mesaj && (
        <p className={`text-sm font-semibold px-3 py-2 rounded-lg ${
          mesaj.tip === 'ok' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
          {mesaj.metin}
        </p>
      )}

      {/* Toplamlar */}
      <div className="grid grid-cols-3 gap-2">
        {[
          ['Hakediş', TRY(toplam.hakedis), 'text-slate-200'],
          ['Ödenen', TRY(toplam.odenen), 'text-emerald-300'],
          ['Açık bakiye', TRY(toplam.bakiye), toplam.bakiye > 0 ? 'text-amber-300' : 'text-slate-400'],
        ].map(([etiket, deger, renk]) => (
          <div key={etiket} className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-2.5 text-center">
            <p className={`text-base font-black tabular-nums ${renk}`}>{deger}</p>
            <p className="text-[11px] text-slate-500 font-semibold">{etiket}</p>
          </div>
        ))}
      </div>

      {referansorler.length === 0 && (
        <p className="text-sm text-slate-500 py-6 text-center">Henüz referansör yok.</p>
      )}

      {/* Referansör bazlı */}
      {referansorler.map(r => {
        const kendi = ledger.filter(l => l.referrer_id === r.id)
        const acikMi = acik === r.id
        return (
          <div key={r.id} className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
            <button onClick={() => setAcik(acikMi ? null : r.id)}
              className="w-full text-left flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white line-clamp-2 leading-tight">{r.ad}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="font-mono text-violet-300">{r.onek}</span>
                  {!r.aktif && <span className="ml-2 text-slate-600">pasif</span>}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-black tabular-nums ${r.bakiye > 0 ? 'text-amber-300' : 'text-slate-500'}`}>
                  {TRY(r.bakiye)}
                </p>
                <p className="text-[11px] text-slate-500">
                  {TRY(r.hakedis)} hakediş
                </p>
              </div>
            </button>

            {acikMi && (
              <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2">
                {/* Ödeme kaydı */}
                <form onSubmit={e => { e.preventDefault(); ode(e.currentTarget, r.id) }}
                  className="grid grid-cols-[110px,1fr,auto] gap-2">
                  <input name="tutar" inputMode="decimal" required
                    placeholder="Tutar ₺" defaultValue={r.bakiye > 0 ? String(Math.round(r.bakiye)) : ''}
                    className={inputCls} />
                  <input name="aciklama" placeholder="Açıklama (nakit, havale…)" className={inputCls} />
                  <button type="submit" disabled={pending}
                    className="px-3 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 whitespace-nowrap">
                    Ödendi
                  </button>
                </form>

                {/* Hareketler */}
                {kendi.length === 0 ? (
                  <p className="text-xs text-slate-500">Henüz hareket yok.</p>
                ) : kendi.map(l => (
                  <div key={l.id} className="flex items-baseline gap-2 text-xs">
                    <span className="text-slate-600 tabular-nums shrink-0">{tarih(l.created_at)}</span>
                    <span className="text-slate-400 min-w-0 flex-1 line-clamp-1">
                      {l.tur === 'hakedis' ? 'Hakediş' : l.tur === 'odeme' ? 'Ödeme' : 'Düzeltme'}
                      {l.aciklama ? ` · ${l.aciklama}` : ''}
                    </span>
                    <span className={`font-bold tabular-nums shrink-0 ${
                      l.tutar >= 0 ? 'text-slate-200' : 'text-emerald-400'}`}>
                      {l.tutar >= 0 ? '+' : ''}{TRY(l.tutar)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Son hareketler — tüm referansörler */}
      {ledger.length > 0 && (
        <section className="pt-2">
          <h2 className="text-sm font-black text-white mb-2">Son hareketler</h2>
          <div className="space-y-1">
            {ledger.slice(0, 20).map(l => (
              <div key={l.id} className="flex items-baseline gap-2 text-xs bg-slate-900/40 rounded-lg px-2.5 py-1.5">
                <span className="text-slate-600 tabular-nums shrink-0">{tarih(l.created_at)}</span>
                <span className="text-slate-300 min-w-0 flex-1 line-clamp-1">
                  {adBul(l.referrer_id)}
                  <span className="text-slate-500">
                    {' · '}{l.tur === 'hakedis' ? 'Hakediş' : l.tur === 'odeme' ? 'Ödeme' : 'Düzeltme'}
                    {l.aciklama ? ` · ${l.aciklama}` : ''}
                  </span>
                </span>
                <span className={`font-bold tabular-nums shrink-0 ${
                  l.tutar >= 0 ? 'text-slate-200' : 'text-emerald-400'}`}>
                  {l.tutar >= 0 ? '+' : ''}{TRY(l.tutar)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-[11px] text-slate-600 pt-2">
        Hareketler silinmez, değiştirilmez. Yanlış kayıt için düzeltme satırı yazılır.
      </p>
    </div>
  )
}
