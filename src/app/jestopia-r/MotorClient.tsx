'use client'

import { useState } from 'react'

/* ───────────────────────── MOTOR ─────────────────────────
 * Kesitsel randomizasyon.
 *
 * Evren akar, kesitlere bölünür. Her kesit başında o kesitin şanslı
 * pozisyonları Fisher-Yates ile karıştırılarak belirlenir; kaynak
 * donanım entropisidir (crypto.getRandomValues) — yani yöntemi
 * uygulayan taraf dahil hiç kimse çıktıyı yönlendiremez.
 *
 * Kesit dolunca sayaç sıfırlanır ve yeni kesitin randomizasyonu
 * son öğenin gelişiyle otomatik tetiklenir.
 *
 * Mekanizmanın hiçbir yerinde kimlik, tutar, zaman veya sıra
 * bilgisi girdi olarak kullanılmaz.
 * ───────────────────────────────────────────────────────── */

/** Donanım entropisinden 0..max-1 arası tamsayı (modulo yanlılığı giderilmiş). */
function rastgele(max: number): number {
  if (max <= 0) return 0
  const esik = Math.floor(0x100000000 / max) * max
  const buf = new Uint32Array(1)
  let x: number
  do {
    crypto.getRandomValues(buf)
    x = buf[0]
  } while (x >= esik)
  return x % max
}

/**
 * Fisher-Yates — kısmi uygulama.
 *
 * Tam diziyi karıştırmak yerine yalnızca ilk k adımı yürütülür; sonuç
 * matematiksel olarak tam karıştırmayla aynıdır (her pozisyonun seçilme
 * olasılığı k/n). Dokunulmayan pozisyonlar seyrek bir harita üzerinden
 * izlenir, böylece bellek k ile orantılı kalır — kesit boyutu milyonlar
 * mertebesinde olsa bile.
 */
function kesitRandomize(kesit: number, k: number): Set<number> {
  const takas = new Map<number, number>()
  const al = (i: number) => takas.get(i) ?? i + 1 // sanal dizi: [1..kesit]
  const sec = new Set<number>()

  const adet = Math.min(k, kesit)
  for (let i = 0; i < adet; i++) {
    const j = i + rastgele(kesit - i)
    sec.add(al(j))
    takas.set(j, al(i))
  }
  return sec
}

type Kazanan = { kesit: number; poz: number; oge: number }

type Sonuc = {
  kesitBoyu: number
  sans: number
  tamKesit: number
  yarimKesit: number
  dagitilan: number
  kazananlar: Kazanan[]
  dagilim: { bos: number; bir: number; iki: number; ucUstu: number }
  /* analiz */
  tekrarEdenPoz: { poz: number; adet: number }[]
  farkliPoz: number
  ortUzaklik: number
  minUzaklik: number
  maxUzaklik: number
  ilkCeyrek: number
  sonCeyrek: number
}

function calistir(evren: number, hedef: number): Sonuc {
  const kesitBoyu = Math.max(1, Math.floor(evren / hedef))
  const k = 1

  const tamKesit = Math.floor(evren / kesitBoyu)
  const yarimKesit = evren - tamKesit * kesitBoyu

  const kazananlar: Kazanan[] = []
  const perKesit: number[] = []

  /**
   * Öğeleri tek tek dolaşmaya gerek yok: her kesit için şanslı pozisyonlar
   * belirlenir ve öğe numarası doğrudan hesaplanır. Böylece döngü evren
   * boyutuyla değil KESİT SAYISI ile orantılı olur — 20 milyonluk bir evren
   * 365 adımda biter.
   */
  for (let kesitNo = 1; kesitNo <= tamKesit; kesitNo++) {
    const sansli = [...kesitRandomize(kesitBoyu, k)].sort((a, b) => a - b)
    const taban = (kesitNo - 1) * kesitBoyu
    for (const poz of sansli) kazananlar.push({ kesit: kesitNo, poz, oge: taban + poz })
    perKesit.push(sansli.length)
  }

  // Yarım kesit: randomizasyon yapılır ama yalnızca gelen öğeler kadarı sayılır
  if (yarimKesit > 0) {
    const sansli = [...kesitRandomize(kesitBoyu, k)].sort((a, b) => a - b)
    const taban = tamKesit * kesitBoyu
    for (const poz of sansli) {
      if (poz <= yarimKesit) kazananlar.push({ kesit: tamKesit + 1, poz, oge: taban + poz })
    }
  }

  /* ── ANALİZ ── */

  // Aynı pozisyonun kaç kez kazandığı (örüntü var mı?)
  const pozSayim = new Map<number, number>()
  for (const k of kazananlar) pozSayim.set(k.poz, (pozSayim.get(k.poz) ?? 0) + 1)
  const tekrarEdenPoz = [...pozSayim.entries()]
    .filter(([, adet]) => adet > 1)
    .map(([poz, adet]) => ({ poz, adet }))
    .sort((a, b) => b.adet - a.adet)

  // Ardışık kazananlar arası mesafe
  const uzakliklar: number[] = []
  for (let i = 1; i < kazananlar.length; i++) {
    uzakliklar.push(kazananlar[i].oge - kazananlar[i - 1].oge)
  }
  const ortUzaklik = uzakliklar.length
    ? uzakliklar.reduce((a, b) => a + b, 0) / uzakliklar.length
    : 0

  // Kazanan pozisyonların kesit içindeki dağılımı (ilk/son çeyrek dengeli mi?)
  const ceyrek = kesitBoyu / 4
  const ilkCeyrek = kazananlar.filter((k) => k.poz <= ceyrek).length
  const sonCeyrek = kazananlar.filter((k) => k.poz > kesitBoyu - ceyrek).length

  return {
    kesitBoyu,
    sans: 100 / kesitBoyu,
    tamKesit,
    yarimKesit,
    dagitilan: kazananlar.length,
    kazananlar,
    dagilim: {
      bos: perKesit.filter((x) => x === 0).length,
      bir: perKesit.filter((x) => x === 1).length,
      iki: perKesit.filter((x) => x === 2).length,
      ucUstu: perKesit.filter((x) => x >= 3).length,
    },
    tekrarEdenPoz,
    farkliPoz: pozSayim.size,
    ortUzaklik,
    minUzaklik: uzakliklar.length ? Math.min(...uzakliklar) : 0,
    maxUzaklik: uzakliklar.length ? Math.max(...uzakliklar) : 0,
    ilkCeyrek,
    sonCeyrek,
  }
}

const TRY = (n: number) => n.toLocaleString('tr-TR')

type Esit = {
  tur: number
  dilim: number
  sayim: number[]
  beklenen: number
  min: number
  max: number
  sapma: number
}

/**
 * EŞİHTİMALLİK TESTİ
 *
 * Kesit, eşit genişlikte 10 dilime bölünür ve binlerce tur randomize edilerek
 * her dilimin kaç kez kazandığı sayılır. Dilimler birbirine yakın çıkıyorsa
 * kesit içindeki konum (öğenin kaçıncı sırada geldiği) avantaj yaratmıyor
 * demektir — gerçek senaryoda yalnızca birkaç kazanan olsa bile.
 */
function esihtimallikTesti(kesitBoyu: number, k: number, tur: number): Esit {
  const DILIM = 10
  const sayim = new Array(DILIM).fill(0)

  for (let t = 0; t < tur; t++) {
    for (const poz of kesitRandomize(kesitBoyu, k)) {
      const d = Math.min(DILIM - 1, Math.floor(((poz - 1) / kesitBoyu) * DILIM))
      sayim[d]++
    }
  }

  const beklenen = (tur * k) / DILIM
  const min = Math.min(...sayim)
  const max = Math.max(...sayim)
  return {
    tur,
    dilim: DILIM,
    sayim,
    beklenen,
    min,
    max,
    sapma: beklenen ? (100 * (max - min)) / beklenen : 0,
  }
}

export default function MotorClient() {
  const [evren, setEvren] = useState('15300')
  const [hedef, setHedef] = useState('150')
  const [sonuc, setSonuc] = useState<Sonuc | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [calisiyor, setCalisiyor] = useState(false)
  const [esit, setEsit] = useState<Esit | null>(null)
  const [testCalisiyor, setTestCalisiyor] = useState(false)

  function testEt() {
    if (!sonuc) return
    setTestCalisiyor(true)
    setTimeout(() => {
      setEsit(esihtimallikTesti(sonuc.kesitBoyu, 1, 50_000))
      setTestCalisiyor(false)
    }, 10)
  }

  function uret() {
    const e = Number(evren.replace(/\D/g, ''))
    const h = Number(hedef.replace(/\D/g, ''))

    if (!e || !h) return setHata('İki alan da gerekli.')
    if (h > e) return setHata('Değer sayısı evrenden büyük olamaz.')
    if (h > 200_000) return setHata('Değer sayısı en fazla 200.000 olabilir (tablo sınırı).')

    setHata(null)
    setEsit(null)
    setCalisiyor(true)
    setTimeout(() => {
      setSonuc(calistir(e, h))
      setCalisiyor(false)
    }, 10)
  }

  const sapma = sonuc ? sonuc.dagitilan - Number(hedef.replace(/\D/g, '')) : 0

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-6">
      <div className="mx-auto max-w-[1600px] space-y-3">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-lg font-bold tracking-tight">Jestopia · Kesitsel Randomizasyon</h1>
          <p className="text-[11px] text-slate-500">
            Mekanizma yalnızca öğe sayar; kimlik, tutar, zaman ve sıra bilgisi kullanmaz.
          </p>
        </header>

        {/* ÜÇ SÜTUN — sol: analiz · orta: girdi + sonuç · sağ: kazananlar + test */}
        <div className="grid gap-3 xl:grid-cols-[1fr_1.15fr_1fr] xl:items-start">

          {/* ═══════════ SOL — ANALİZ ═══════════ */}
          <div className="space-y-3 xl:order-1">
            {sonuc && (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Analiz
                </h2>

                <dl className="mt-3 space-y-1.5">
                  <Satir
                    ad="Farklı kazanan pozisyon"
                    val={`${TRY(sonuc.farkliPoz)} / ${TRY(sonuc.kesitBoyu)}`}
                  />
                  <Satir ad="Tekrarlanan pozisyon" val={`${TRY(sonuc.tekrarEdenPoz.length)} adet`} />
                  <Satir ad="Ortalama uzaklık" val={TRY(Math.round(sonuc.ortUzaklik))} />
                  <Satir
                    ad="En yakın / en uzak"
                    val={`${TRY(sonuc.minUzaklik)} — ${TRY(sonuc.maxUzaklik)}`}
                  />
                  <Satir
                    ad="Kesit ilk çeyreğinde"
                    val={`${TRY(sonuc.ilkCeyrek)} (%${(
                      (100 * sonuc.ilkCeyrek) / Math.max(1, sonuc.dagitilan)
                    ).toFixed(1)})`}
                  />
                  <Satir
                    ad="Kesit son çeyreğinde"
                    val={`${TRY(sonuc.sonCeyrek)} (%${(
                      (100 * sonuc.sonCeyrek) / Math.max(1, sonuc.dagitilan)
                    ).toFixed(1)})`}
                  />
                </dl>

                <p className="mt-3 text-[11px] leading-relaxed text-slate-600">
                  Beklenen ortalama uzaklık <b>{TRY(sonuc.kesitBoyu)}</b> (kesit boyutu).
                  {sonuc.dagitilan < 20 ? (
                    <>
                      {' '}
                      Çeyrek yüzdeleri az sayıda kazananda doğal olarak dalgalanır; mekanizma her
                      kesitte eşit çalışır. Teyit için eşihtimallik testini çalıştırın.
                    </>
                  ) : (
                    <>
                      {' '}
                      İlk ve son çeyrek yüzdeleri birbirine yakınsa sıra avantaj yaratmıyor
                      demektir.
                    </>
                  )}
                </p>

                {sonuc.tekrarEdenPoz.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[11px] font-semibold text-slate-500">
                      En çok tekrarlanan pozisyonlar
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {sonuc.tekrarEdenPoz.slice(0, 12).map((t) => (
                        <span
                          key={t.poz}
                          className="rounded-md border border-slate-700 bg-slate-950 px-2 py-0.5 text-[11px]"
                        >
                          {TRY(t.poz)} · <b className="text-slate-300">{t.adet}×</b>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* ═══════════ ORTA — GİRDİ + SONUÇ ═══════════ */}
          <div className="space-y-3 xl:order-2">
            <section className="rounded-2xl border border-amber-500/20 bg-slate-900/60 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-400">Evren büyüklüğü</span>
                  <input
                    value={evren}
                    onChange={(e) => setEvren(e.target.value)}
                    inputMode="numeric"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5
                               text-sm focus:border-amber-500/60 focus:outline-none"
                    placeholder="15300"
                  />
                  <span className="mt-1 block text-[11px] text-slate-600">
                    Tahmini öğe sayısı
                  </span>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-400">
                    Değer verilecek öğe sayısı
                  </span>
                  <input
                    value={hedef}
                    onChange={(e) => setHedef(e.target.value)}
                    inputMode="numeric"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5
                               text-sm focus:border-amber-500/60 focus:outline-none"
                    placeholder="150"
                  />
                  <span className="mt-1 block text-[11px] text-slate-600">
                    Kesit boyutu türetilir
                  </span>
                </label>
              </div>

              {hata && <p className="mt-3 text-xs font-semibold text-rose-400">{hata}</p>}

              <button
                onClick={uret}
                disabled={calisiyor}
                className="mt-3 w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold
                           text-slate-900 hover:bg-amber-400 disabled:opacity-50"
              >
                {calisiyor ? 'Üretiliyor…' : 'Üret'}
              </button>
            </section>

            {sonuc && (
              <>
                <section className="grid grid-cols-3 gap-2">
                  <Kutu etiket="Kesit boyutu" deger={TRY(sonuc.kesitBoyu)} />
                  <Kutu etiket="Öğe şansı" deger={`%${sonuc.sans.toFixed(4)}`} />
                  <Kutu etiket="Dağıtılan" deger={TRY(sonuc.dagitilan)} vurgu />
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Akış</h2>
                  <dl className="mt-3 space-y-1.5">
                    <Satir ad="Tamamlanan kesit" val={TRY(sonuc.tamKesit)} />
                    <Satir ad="Yarım kesit" val={`${TRY(sonuc.yarimKesit)} öğe`} />
                    <Satir ad="Hedeften sapma" val={`${sapma >= 0 ? '+' : ''}${sapma}`} />
                    <Satir ad="Kesit başına değer" val="1 (sabit)" />
                    <Satir
                      ad="Değer çıkan kesit"
                      val={TRY(sonuc.dagilim.bir + sonuc.dagilim.iki + sonuc.dagilim.ucUstu)}
                    />
                    <Satir ad="Boş kesit" val={TRY(sonuc.dagilim.bos)} />
                  </dl>
                </section>
              </>
            )}
          </div>

          {/* ═══════════ SAĞ — KAZANANLAR + TEST ═══════════ */}
          <div className="space-y-3 xl:order-3">
            {sonuc && (
              <>
                <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Tüm kazanan öğeler
                    </h2>
                    <span className="text-[11px] text-slate-600">{TRY(sonuc.dagitilan)} kayıt</span>
                  </div>

                  <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-slate-800">
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 bg-slate-950 text-slate-500">
                        <tr className="text-left">
                          <th className="px-2 py-1.5 font-semibold">Kesit</th>
                          <th className="px-2 py-1.5 font-semibold">Öğe no</th>
                          <th className="px-2 py-1.5 font-semibold">Poz.</th>
                          <th className="px-2 py-1.5 font-semibold">Uzaklık</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sonuc.kazananlar.map((k, i) => (
                          <tr key={k.oge} className="border-t border-slate-800/60">
                            <td className="px-2 py-1 text-slate-500">#{k.kesit}</td>
                            <td className="px-2 py-1 font-bold text-amber-300">{TRY(k.oge)}</td>
                            <td className="px-2 py-1 text-slate-400">{TRY(k.poz)}</td>
                            <td className="px-2 py-1 text-slate-500">
                              {i === 0 ? '—' : TRY(k.oge - sonuc.kazananlar[i - 1].oge)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Eşihtimallik testi
                    </h2>
                    <button
                      onClick={testEt}
                      disabled={testCalisiyor}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5
                                 text-[11px] font-bold hover:border-amber-500/60 disabled:opacity-50"
                    >
                      {testCalisiyor ? 'Test ediliyor…' : 'Testi çalıştır'}
                    </button>
                  </div>

                  {!esit && (
                    <p className="mt-2 text-[11px] text-slate-600">
                      Kesit 10 dilime bölünür, 50.000 tur randomize edilir. Dilimler birbirine
                      yakınsa konum avantaj yaratmıyor demektir.
                    </p>
                  )}

                  {esit && (
                    <>
                      <div className="mt-3 space-y-1">
                        {esit.sayim.map((adet, i) => {
                          const oran = adet / esit.beklenen
                          const bas = Math.round((i * sonuc.kesitBoyu) / esit.dilim) + 1
                          const bit = Math.round(((i + 1) * sonuc.kesitBoyu) / esit.dilim)
                          return (
                            <div key={i} className="flex items-center gap-2 text-[10px]">
                              <span className="w-24 shrink-0 text-right text-slate-600">
                                {TRY(bas)}–{TRY(bit)}
                              </span>
                              <div className="h-2.5 flex-1 overflow-hidden rounded bg-slate-950">
                                <div
                                  className="h-full bg-amber-500/70"
                                  style={{ width: `${Math.min(100, oran * 50)}%` }}
                                />
                              </div>
                              <span className="w-12 shrink-0 text-right text-slate-400">
                                {TRY(adet)}
                              </span>
                              <span
                                className={`w-12 shrink-0 text-right ${
                                  Math.abs(oran - 1) < 0.05
                                    ? 'text-emerald-400/70'
                                    : 'text-amber-400/70'
                                }`}
                              >
                                {oran >= 1 ? '+' : ''}
                                {((oran - 1) * 100).toFixed(1)}%
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      <dl className="mt-3 space-y-1.5 text-sm">
                        <Satir ad="Dilim başına beklenen" val={TRY(Math.round(esit.beklenen))} />
                        <Satir ad="En az / en çok" val={`${TRY(esit.min)} — ${TRY(esit.max)}`} />
                        <Satir ad="Maks. sapma" val={`%${esit.sapma.toFixed(2)}`} />
                      </dl>

                      <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
                        Dilimler birbirine yakınsa kesit içindeki her konum eşit şansa sahiptir:
                        ilk gelen ile son gelen arasında fark yoktur.
                      </p>
                    </>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function Kutu({ etiket, deger, vurgu }: { etiket: string; deger: string; vurgu?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {etiket}
      </div>
      <div className={`mt-1 text-xl font-bold ${vurgu ? 'text-amber-300' : 'text-slate-100'}`}>
        {deger}
      </div>
    </div>
  )
}

function Satir({ ad, val }: { ad: string; val: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-800/60 pb-1.5">
      <dt className="text-xs text-slate-500">{ad}</dt>
      <dd className="font-semibold">{val}</dd>
    </div>
  )
}
