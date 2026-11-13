'use client'

import { useState, useTransition } from 'react'
import { basvuruGonder } from './actions'

const inputCls = 'w-full px-4 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700 ' +
  'text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500'

/**
 * Referansör adayı başvuru sayfası.
 *
 * WhatsApp daveti "detayları incelemek ve katılmak istersen" diyor — sayfa
 * o sözü tutmak zorunda. Önceki hali üç satır özet + formdu; aday ne
 * kazanacağını, ne yapacağını okumadan ad-telefon giriyordu.
 *
 * Sıra, insanın aklındaki soru sırası:
 *   bu ne? → bana ne faydası var? → ne yapmam gerekiyor? → aklımdaki soru → başvuru
 *
 * Dil: rakam yığmıyoruz. Tek örnek üzerinden anlatıyoruz, çünkü "%20 puan,
 * ilk 10.000'e %20 üstüne %10" cümlesi kimsenin kafasında resim oluşturmuyor;
 * "20.000 liralık işlemde 3.000 puan" oluşturuyor.
 */
export default function BasvuruFormu({
  onek, davetEden,
}: { onek: string; davetEden?: string | null }) {
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
      <main className="min-h-dvh bg-slate-950 flex items-center justify-center px-5">
        <div className="max-w-xs text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15
                          ring-1 ring-emerald-500/40 grid place-items-center">
            <span className="text-2xl text-emerald-300">✓</span>
          </div>
          <h1 className="text-lg font-bold text-white mt-4">Başvurunuz bize ulaştı</h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Klinik başvurunuzu değerlendirecek. Onaylandığında telefonunuza bir
            SMS gelir — içindeki bağlantı sizin tavsiye paneliniz olur.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-slate-950">
      <div className="mx-auto w-full max-w-md px-5 py-9 space-y-8">

        {/* ── Bu ne? ──────────────────────────────────────────────── */}
        <header>
          <p className="text-[11px] font-bold text-violet-400 uppercase tracking-[0.12em]">
            Dr. İzzet GÖK · Medikal Estetik
          </p>
          <h1 className="text-[26px] font-black text-white mt-2 leading-[1.15]">
            Tavsiye edin,<br />ikiniz de kazanın
          </h1>
          <p className="text-[15px] text-slate-400 mt-3.5 leading-relaxed">
            {davetEden ? <><b className="text-slate-300">{davetEden}</b> sizi bu programa davet etti. </> : null}
            Kliniğe yönlendirdiğiniz kişi, anlaştığı fiyatın üzerine ek indirim
            alır. İşlemi tamamlandığında size puan yazılır.
          </p>
        </header>

        {/* ── Bana ne faydası var? ────────────────────────────────── */}
        {/* İndirim TEK SEFERLİK DEĞİL: tanıdığınız her işleminde %10 alır,
            her işleminde size puan yazılır. Örnek iki işlem üzerinden
            anlatılıyor, yoksa insan "bir kez indirim" diye anlıyor. */}
        <section className="rounded-2xl bg-gradient-to-b from-violet-500/10 to-transparent
                            ring-1 ring-violet-500/25 p-5">
          <p className="text-xs font-bold text-violet-300 uppercase tracking-wide">
            Örnekle
          </p>
          <p className="text-[15px] text-slate-200 mt-2.5 leading-relaxed">
            Tanıdığınızı kliniğimize yönlendirdiniz. Anlaştığı fiyat
            <b className="text-white"> 20.000 TL</b>.
          </p>

          {/* 1. işlem */}
          <div className="mt-4 rounded-xl bg-slate-900/60 ring-1 ring-slate-800 p-4">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              İlk işlemi
            </p>
            <div className="mt-2.5 space-y-2.5">
              <div className="flex items-baseline gap-3">
                <span className="shrink-0 text-xl font-black text-emerald-300 tabular-nums">
                  2.000₺
                </span>
                <span className="text-[13px] text-slate-400 leading-snug">
                  ona indirim — 18.000 TL öder
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="shrink-0 text-xl font-black text-violet-300 tabular-nums">
                  3.000
                </span>
                <span className="text-[13px] text-slate-400 leading-snug">
                  puan size yazılır
                </span>
              </div>
            </div>
          </div>

          {/* 2. işlem — asıl mesaj burada */}
          <div className="mt-2.5 rounded-xl bg-slate-900/60 ring-1 ring-slate-800 p-4">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Üç ay sonra ikinci işlemi · 12.000 TL
            </p>
            <div className="mt-2.5 space-y-2.5">
              <div className="flex items-baseline gap-3">
                <span className="shrink-0 text-xl font-black text-emerald-300 tabular-nums">
                  1.200₺
                </span>
                <span className="text-[13px] text-slate-400 leading-snug">
                  indirimi yine var
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="shrink-0 text-xl font-black text-violet-300 tabular-nums">
                  2.200
                </span>
                <span className="text-[13px] text-slate-400 leading-snug">
                  puan yine size
                </span>
              </div>
            </div>
          </div>

          <p className="text-[13px] text-slate-300 mt-4 leading-relaxed">
            <b className="text-white">İndirim bir kerelik değil.</b> Yönlendirdiğiniz
            kişi bizde yaptırdığı <b className="text-white">her işlemde</b> %10
            indirimini alır; her işleminde size de puan yazılır.
          </p>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            Puanı kliniğimizde yaptıracağınız işlemin ödemesinde kullanırsınız —
            bir işlemin yarısına kadarını puanla kapatabilirsiniz.
          </p>
        </section>

        {/* ── Ne yapmam gerekiyor? ────────────────────────────────── */}
        <section>
          <h2 className="text-[15px] font-bold text-white">Sizden ne isteniyor?</h2>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Satış yapmanız gerekmiyor. Yalnızca tanıdığınızın numarasını
            girersiniz, gerisini klinik yürütür.
          </p>

          <ol className="mt-4 space-y-4">
            {([
              ['Aşağıdaki formu doldurun',
               'Klinik onaylar, panel bağlantınız telefonunuza gelir.'],
              ['Tanıdığınızın numarasını girin',
               'Ona indirimini anlatan tek bir SMS gider.'],
              ['O klinikte kodunu söyler',
               'İndirimi uygulanır, işlemi yapılır.'],
              ['Puanınız panelinize düşer',
               'Kim geldi, ne kazandınız — telefonunuzdan görürsünüz.'],
            ] as const).map(([bas, alt], i) => (
              <li key={i} className="flex gap-3.5">
                <span className="shrink-0 w-7 h-7 rounded-full bg-violet-500/15
                                 ring-1 ring-violet-500/35 grid place-items-center
                                 text-xs font-bold text-violet-300 tabular-nums">
                  {i + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-slate-100 leading-snug">{bas}</p>
                  <p className="text-[13px] text-slate-500 leading-snug mt-1">{alt}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Aklımdaki soru ──────────────────────────────────────── */}
        <section className="space-y-2">
          <h2 className="text-[15px] font-bold text-white mb-3">Merak ettikleriniz</h2>
          {([
            ['Bir ücret ödeyecek miyim?',
             'Hayır. Üyelik ücreti, aidat ya da alım zorunluluğu yok. Katılmak ve ayrılmak serbest.'],
            ['Puanım yanar mı?',
             'Puanınız yazıldığı günden 180 gün geçerlidir. Panelinizde hangi puanın ne zaman biteceği yazılı durur.'],
            ['Kaç kişiye tanımlayabilirim?',
             'Ayda 10 kişiye. Tanımladığınız indirim kodu 7 gün geçerli olur.'],
            ['Numarasını verdiğim kişi rahatsız olur mu?',
             'Tek bir SMS gider, indirimini anlatır. İlgilenmezse yanıtlamaz; ikinci bir mesaj gitmez.'],
            ['Tanıdığım zaten hastanız ise olur mu?',
             'Olur. İndirim, kliniğimizde anlaştığı fiyatın üzerine uygulanır.'],
          ] as const).map(([s, c], i) => (
            <details key={i} className="group rounded-xl bg-slate-900/70 ring-1 ring-slate-800">
              <summary className="cursor-pointer list-none px-4 py-3.5 flex items-center
                                  justify-between gap-3 text-sm font-semibold text-slate-200">
                {s}
                <span className="shrink-0 text-slate-600 text-xs
                                 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="px-4 pb-4 -mt-0.5 text-[13px] text-slate-400 leading-relaxed">
                {c}
              </p>
            </details>
          ))}
        </section>

        {/* ── Başvuru ─────────────────────────────────────────────── */}
        <form onSubmit={gonder} className="space-y-3 pt-2">
          <div>
            <h2 className="text-[15px] font-bold text-white">Başvurunuzu bırakın</h2>
            <p className="text-sm text-slate-500 mt-1">
              İki bilgi yeterli. Klinik onayladığında size haber verilir.
            </p>
          </div>

          <input value={ad} onChange={e => setAd(e.target.value)}
            placeholder="Adınız Soyadınız" autoComplete="name" className={inputCls} />
          <input value={tel} onChange={e => setTel(e.target.value)}
            placeholder="Telefon numaranız" inputMode="tel" autoComplete="tel"
            className={inputCls} />
          <textarea value={not} onChange={e => setNot(e.target.value)}
            placeholder="Eklemek istediğiniz bir şey var mı? (isteğe bağlı)"
            rows={3} className={inputCls} />

          {hata && (
            <p className="text-sm font-semibold px-4 py-3 rounded-xl bg-rose-500/15 text-rose-300">
              {hata}
            </p>
          )}

          <button type="submit" disabled={pending || !gecerli}
            className="w-full py-4 rounded-xl text-[15px] font-bold bg-violet-500
                       hover:bg-violet-400 text-white disabled:opacity-40
                       transition-colors">
            {pending ? 'Gönderiliyor…' : 'Başvurumu gönder'}
          </button>

          <p className="text-[11px] text-slate-600 text-center leading-relaxed pt-1">
            Bilgileriniz yalnızca başvurunuzu değerlendirmek için kullanılır,
            üçüncü kişilerle paylaşılmaz. Başvurunuz klinik onayından sonra
            geçerlilik kazanır.
          </p>
        </form>
      </div>
    </main>
  )
}
