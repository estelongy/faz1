'use client'

import { useState, useTransition } from 'react'
import { uretLinkOnek } from './actions'
import { turBilgi } from '@/app/klinik/panel/muhasebe/referans-tipler'
import { waDavetMetni } from '@/app/klinik/panel/muhasebe/referans-mesajlar'

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
  bekleyen_link: {
    token: string; teklif: string; son: string
    ayricalik: string | null; gecerli_zaman: string | null
  }[]
}

const TRY = (n: number) => '₺' + Math.round(n).toLocaleString('tr-TR')

/** '0532 123 45 67' → '905321234567'. Geçersizse null. */
function waNumara(ham: string): string | null {
  let d = ham.replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('00')) d = d.slice(2)
  if (d.length === 11 && d.startsWith('0')) d = '90' + d.slice(1)
  else if (d.length === 10 && d.startsWith('5')) d = '90' + d
  return d.length >= 11 && d.length <= 15 ? d : null
}

export default function ReferansorPanel({ veri }: { veri: PanelVerisi }) {
  const [pending, startTransition] = useTransition()
  const [hata, setHata] = useState<string | null>(null)
  const [yeniLink, setYeniLink] = useState<{ url: string; mesaj: string } | null>(null)
  // Kampanya başına girilen telefon — sadece WhatsApp'ı o sohbette açmak için.
  const [telefonlar, setTelefonlar] = useState<Record<string, string>>({})

  const gelen = veri.davetler.filter(d => d.geldi === true).length
  const bekleyen = veri.davetler.filter(d => d.geldi === null && d.durum === 'aktif').length

  /**
   * Davet bağlantısı üretir ve WhatsApp'ı arkadaşın sohbetinde açar.
   * Mesaj referansörün KENDİ telefonundan gider — biz bir yere bağlanmıyoruz,
   * numara sisteme kaydedilmiyor, SMS maliyeti yok.
   */
  function uret(offerId: string, hamTel: string) {
    setHata(null)
    const t = veri.teklifler.find(x => x.id === offerId)
    const wa = waNumara(hamTel)
    if (hamTel.trim() && !wa) {
      setHata('Telefon numarası geçersiz. Örn: 0532 123 45 67')
      return
    }
    startTransition(async () => {
      const r = await uretLinkOnek(veri.onek, offerId)
      if (!r.ok) { setHata(r.error); return }
      const url = `${window.location.origin}/t/${r.token}`
      const mesaj = waDavetMetni({
        ayricalik: t?.ayricalik ?? '',
        gecerliZaman: t?.gecerli_zaman ?? null,
        url,
      })
      setYeniLink({ url, mesaj })
      setTelefonlar(p => ({ ...p, [offerId]: '' }))
      // Numara girildiyse doğrudan o sohbeti aç; yoksa kişi seçtirir.
      window.open(
        `https://wa.me/${wa ?? ''}?text=${encodeURIComponent(mesaj)}`,
        '_blank', 'noopener',
      )
    })
  }

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <header>
        <p className="text-xs font-bold text-violet-300 tracking-wider">ESTELONGY TAVSİYE</p>
        <h1 className="text-xl font-black text-white mt-0.5 leading-tight">{veri.ad}</h1>
        <p className="font-mono text-sm text-slate-500 mt-0.5">{veri.onek}</p>
      </header>

      {/* Özet */}
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

      {/* Yeni üretilen link — paylaşıma hazır */}
      {yeniLink && (
        <div className="bg-emerald-500/10 ring-1 ring-emerald-500/30 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-emerald-300">Davet bağlantınız hazır</p>
          <p className="text-[11px] text-slate-400 break-all font-mono bg-slate-900/60 rounded-lg px-2 py-1.5">
            {yeniLink.url}
          </p>
          <div className="flex gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(yeniLink.mesaj)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center px-3 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white">
              WhatsApp&rsquo;tan Gönder
            </a>
            <button
              onClick={() => { navigator.clipboard?.writeText(yeniLink.url).catch(() => {}) }}
              className="px-3 py-2.5 rounded-lg text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-300">
              Kopyala
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Bağlantıyı açan kişi numarasını girip kodunu alır. Her bağlantı tek kişiye özeldir.
          </p>
        </div>
      )}

      {/* Teklifler */}
      <section className="space-y-2">
        <h2 className="text-sm font-black text-white">Tavsiye edebileceklerim</h2>
        {veri.teklifler.length === 0 ? (
          <p className="text-sm text-slate-500">Şu an aktif teklif yok.</p>
        ) : veri.teklifler.map(t => (
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
            {/* Arkadaşının numarası — WhatsApp onun sohbetinde açılır.
                Mesaj referansörün KENDİ telefonundan gider: SMS maliyeti yok,
                numara bize kaydedilmez. */}
            <form className="mt-2.5 space-y-2"
              onSubmit={e => { e.preventDefault(); uret(t.id, telefonlar[t.id] ?? '') }}>
              <input
                value={telefonlar[t.id] ?? ''}
                onChange={e => setTelefonlar(p => ({ ...p, [t.id]: e.target.value }))}
                placeholder="Arkadaşının numarası" inputMode="tel"
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500" />
              <button type="submit" disabled={pending}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50">
                {pending ? 'Hazırlanıyor…' : 'WhatsApp’tan Gönder'}
              </button>
            </form>
          </div>
        ))}
      </section>

      {/* Henüz kullanılmamış linkler */}
      {veri.bekleyen_link.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-black text-white">Gönderilmeyi bekleyen bağlantılar</h2>
          {veri.bekleyen_link.map(l => (
            <div key={l.token} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-300 line-clamp-1">{l.teklif}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{l.son} tarihine kadar geçerli</p>
              <div className="flex gap-2 mt-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${l.teklif}\n\n${typeof window !== 'undefined' ? window.location.origin : ''}/t/${l.token}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 text-center px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600/80 hover:bg-emerald-500 text-white">
                  WhatsApp
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(`${window.location.origin}/t/${l.token}`).catch(() => {})
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300">
                  Kopyala
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Davet geçmişi */}
      <section className="space-y-2">
        <h2 className="text-sm font-black text-white">Tavsiyelerim</h2>
        {veri.davetler.length === 0 ? (
          <p className="text-sm text-slate-500">Henüz tavsiye bağlantınız kullanılmadı.</p>
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
