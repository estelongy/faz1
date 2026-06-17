'use client'

import { useEffect, useRef, useState } from 'react'

/* ─── Estelongy yatırımcı sunumu — Zamansız Güzellik Mimarlığı ───
   16 slayt · full-viewport scroll-snap · klavye nav · dark luxury
   Dr. İzzet Gök · Kurucu Hekim-Mimar · Haziran 2026
*/

const GOLD = '#C9A961'
const GOLD_LIGHT = '#D4B872'
const GOLD_DEEP = '#8B7339'
const BG = '#0A0F1A'
const CREAM = '#F5F1E8'

// Gelir projeksiyonu — Base senaryo (milyon ₺)
const REVENUE_BASE = [
  { yil: 'Y1', komisyon: 3.6, marketplace: 0.72, lead: 0.9, saas: 0.9, akademi: 0.6 },
  { yil: 'Y2', komisyon: 23,  marketplace: 9.7,  lead: 6.4, saas: 5.5, akademi: 5.3 },
  { yil: 'Y3', komisyon: 114, marketplace: 60,   lead: 35,  saas: 19,  akademi: 24  },
  { yil: 'Y4', komisyon: 320, marketplace: 180,  lead: 126, saas: 50,  akademi: 81  },
  { yil: 'Y5', komisyon: 700, marketplace: 400,  lead: 294, saas: 110, akademi: 200 },
]
const TOTAL_BASE = REVENUE_BASE.map(r => r.komisyon + r.marketplace + r.lead + r.saas + r.akademi)
// Y1:6.72  Y2:49.9  Y3:252  Y4:757  Y5:1704

const SENARYO = [
  { ad: 'Conservative', factor: 0.5,  renk: '#6B7280' },
  { ad: 'Base',         factor: 1.0,  renk: GOLD },
  { ad: 'Bull',         factor: 1.5,  renk: '#10B981' },
]

const MUSLUK_RENK = {
  komisyon:    GOLD_DEEP,
  marketplace: GOLD,
  lead:        GOLD_LIGHT,
  saas:        '#7C8B6F',
  akademi:     '#A89878',
}

export default function DeckClient() {
  const [current, setCurrent] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const TOTAL_SLIDES = 16

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = containerRef.current
      if (!el) return
      const h = window.innerHeight
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        el.scrollBy({ top: h, behavior: 'smooth' })
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        el.scrollBy({ top: -h, behavior: 'smooth' })
      } else if (e.key === 'Home') {
        el.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (e.key === 'End') {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      }
    }
    function onScroll() {
      const el = containerRef.current
      if (!el) return
      const idx = Math.round(el.scrollTop / window.innerHeight)
      setCurrent(idx)
    }
    window.addEventListener('keydown', onKey)
    const el = containerRef.current
    el?.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      el?.removeEventListener('scroll', onScroll)
    }
  }, [])

  function goTo(idx: number) {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: idx * window.innerHeight, behavior: 'smooth' })
  }

  return (
    <div
      ref={containerRef}
      style={{ background: BG, color: CREAM, scrollSnapType: 'y mandatory' }}
      className="h-screen overflow-y-scroll overflow-x-hidden"
    >
      {/* Sağ üst — slayt sayacı */}
      <div className="fixed top-6 right-6 z-50 text-sm tracking-widest font-mono"
        style={{ color: GOLD }}>
        {String(current + 1).padStart(2, '0')} / {String(TOTAL_SLIDES).padStart(2, '0')}
      </div>

      {/* Sol üst — marka */}
      <div className="fixed top-6 left-6 z-50 text-sm tracking-[0.3em] font-light"
        style={{ color: GOLD_DEEP }}>
        ESTELONGY
      </div>

      {/* Sağ kenar — progress noktaları */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Slayt ${i + 1}`}
            className="w-1.5 h-1.5 rounded-full transition-all"
            style={{
              background: i === current ? GOLD : 'rgba(201,169,97,0.25)',
              transform: i === current ? 'scale(1.8)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Slaytlar */}
      <Slide1 />
      <Slide2 />
      <Slide3 />
      <Slide4 />
      <Slide5 />
      <Slide6 />
      <Slide7 />
      <Slide8 />
      <Slide9 />
      <Slide10 />
      <Slide11 />
      <Slide12 />
      <Slide13 />
      <Slide14 />
      <Slide15 />
      <Slide16 />
    </div>
  )
}

/* ─── Slayt 1: Kapak ─────────────────────────────────────── */
function Slide1() {
  return (
    <Section dark>
      <div className="text-center max-w-4xl">
        <div className="mb-8 text-sm tracking-[0.5em] font-light" style={{ color: GOLD_DEEP }}>
          ZAMANSIZ GÜZELLİK MİMARLIĞI
        </div>
        <h1 className="font-light leading-none mb-12"
          style={{ fontSize: 'clamp(64px, 11vw, 160px)', color: CREAM, letterSpacing: '-0.04em' }}>
          Estelongy
        </h1>
        <div className="h-px w-32 mx-auto mb-12" style={{ background: GOLD }} />
        <p className="text-xl md:text-2xl font-light mb-3" style={{ color: CREAM, opacity: 0.85 }}>
          Estetik tıbbın ölçüm, kanıt ve simülasyon altyapısı.
        </p>
        <p className="text-base mt-12 tracking-widest" style={{ color: GOLD }}>
          YATIRIMCI SUNUMU · HAZİRAN 2026
        </p>
        <p className="mt-4 text-sm font-light" style={{ color: CREAM, opacity: 0.55 }}>
          Dr. İzzet Gök · Kurucu Hekim-Mimar
        </p>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm tracking-widest"
        style={{ color: GOLD_DEEP, opacity: 0.7 }}>
        ↓ kaydır · ok tuşları
      </div>
      <div className="absolute bottom-8 right-8 text-sm font-light tracking-wider"
        style={{ color: GOLD_DEEP, opacity: 0.7 }}>
        ÖZEL ERİŞİM · PAYLAŞMAYINIZ
      </div>
    </Section>
  )
}

/* ─── Slayt 2: Problem ─────────────────────────────────── */
function Slide2() {
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="01 · PROBLEM"
          title="Güzelliğin değer kuyusu yer altında."
          lead="Estetik tıp dünyada $50 milyar, Türkiye'de $2 milyar. Yıllık büyüme %18-22. Ama sektör hala 1990&apos;lardan kalma bir karmaşa: ölçüm yok, kanıt yok, ortak skor yok." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <ProblemCard icon="👤" who="KULLANICI"
            pain="“Hangi klinik gerçekten iyi? Hangi ürün orijinal? Yaptırdığım iş işe yaradı mı?”"
            note="Karar Instagram'a, fiyat sözlü pazarlığa, sonuç ölçümsüz teslim ediliyor." />
          <ProblemCard icon="🏥" who="KLİNİK"
            pain="“Reklam veriyoruz, sonuç ölçemiyoruz. Hasta verisi 4 yerde dağınık. Sahte yorum markamızı düşürüyor.”"
            note="Sezonluk talep, sabit gider, ölçülemeyen pazarlama. Kanıtsız büyüme." />
          <ProblemCard icon="🤝" who="İŞ ORTAĞI" subtitle="(marka / vendor)"
            pain="“Sahte muadiller orijinalimi öldürüyor. Hangi kliniğe satabileceğimi bilmiyorum. Bütçem nereye gidiyor belirsiz.”"
            note="Klinik dağıtım, orijinallik kanıtı, kullanıcı geri bildirimi — üçü de eksik." />
        </div>
        <p className="text-center mt-12 text-lg font-light" style={{ color: GOLD_LIGHT }}>
          Üç sorun tek bir altyapı eksikliğinin yansıması.
        </p>
      </div>
    </Section>
  )
}

/* ─── Slayt 3: Çözüm — Estelongy ──────────────────────────── */
function Slide3() {
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="02 · ÇÖZÜM"
          title="Estelongy estetik tıbbı ölçülebilir, tekrar edilebilir, kanıtlanabilir hale getiriyor."
          lead="Estetik tıbbın IMDb'si, Amazon'u ve Verified'ı — tek kimlik altında." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <BenefitCard icon="👤" who="KULLANICIYA"
            headline="Hekim onaylı Estelongy Gençlik Skoru"
            body="Doğru klinik, doğru ürün, doğru zaman — her şey senin skorunun etrafında dönüyor. AI ön analizden hekim onayına; ev rejiminden klinik müdahalesine: tek hesap, tek skor, tek yolculuk." />
          <BenefitCard icon="🏥" who="KLİNİĞE"
            headline="Yeni hasta + ürün satışı + tek panel"
            body="Hekim onaylı yorumlarla güven inşa et. Takvim, hasta dosyası, finans, ürün satışı tek panelde. Sahte yorum yok — sadece tedavi olmuş hastanın verdiği skor." />
          <BenefitCard icon="🤝" who="İŞ ORTAĞINA"
            headline="Vitrin + EsteVerify + dağıtım kanalı"
            body="EsteVerify orijinallik damgası ile sahte ürünle savaş. Doğru klinik segmentine doğrudan eriş. Birinci el kullanıcı geri bildirimini kazan — bütçeni ölçülebilir kanala harca." />
        </div>
      </div>
    </Section>
  )
}

/* ─── Slayt 4: Aha — Gençlik Skoru ────────────────────────── */
function Slide4() {
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="03 · AHA"
          title="Estelongy Gençlik Skoru bir feature değil."
          lead="Birikim grafiği. Her selfie, her klinik ziyareti, her ürün, her ay — skoru günceller." />
        <div className="mt-16 mb-12">
          <ScoreTimeline />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MiniPoint big="1×" small="Kullanıcı bir kez skor aldı → geri çıkamıyor (sunk cost + güncellenen veri)" />
          <MiniPoint big="N×" small="Her yeni veri noktası modeli sertleştirir — rakip kopyalayamaz, çünkü zaman birikiyor" />
          <MiniPoint big="∞" small="Skor → klinik öner → işlem → ürün → bakım → tekrar ölç. Sonsuz halka." />
        </div>
      </div>
    </Section>
  )
}

/* ─── Slayt 5: Üç Ayak ─────────────────────────────────── */
function Slide5() {
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="04 · ÜÇ AYAK"
          title="Tek bir mimari, üç bağımsız marka."
          lead="Estelongy vitrine yazılı tek marka. Onu ayakta tutan üç bağımsız markadır — her biri kendi pazarına hizmet eder, hepsi tek veri kuyusunu besler." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <BrandCard
            name="BiyoAGE"
            role="Ölçüm motoru"
            desc="AI yüz analizi + longevity anketi + Estelongy Gençlik Skoru. Kullanıcı edinmenin sıfır noktası — her yeni kullanıcı buradan giriyor."
            kpi="Kullanıcı tabanını üretir"
          />
          <BrandCard
            name="EsteKlinik"
            role="Maddeleştirici"
            desc="Hekim onaylı klinik pazaryeri. Randevu, prosedür, hekim onayı, sertifikalı sonuç. Skoru somut bir tedaviye dönüştürür."
            kpi="Geliri maddeleştirir"
          />
          <BrandCard
            name="EsteStore"
            role="Sürdürücü"
            desc="Klinik kalite kozmetik & longevity marketplace. EsteVerify orijinallik damgalı. Skoru evde sürdürür."
            kpi="Yaşam boyu değeri uzatır"
          />
        </div>
        <p className="text-center mt-12 text-lg font-light" style={{ color: GOLD_LIGHT }}>
          Üç bağımsız vitrin. Tek veri kuyusu. Hepsi Estelongy&apos;yi inşa ediyor.
        </p>
      </div>
    </Section>
  )
}

/* ─── Slayt 6: Flywheel ─────────────────────────────────── */
function Slide6() {
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="05 · FLYWHEEL"
          title="Üç ayak nasıl çarpan üretir."
          lead="Bir kullanıcının üç ayakta da olması, tek ayakta olma ihtimalinden 4× değerlidir (LTV, retention)." />
        <div className="mt-12">
          <Flywheel />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <MiniPoint big="↓" small="BiyoAGE: skor düşük → EsteKlinik önerisi" />
          <MiniPoint big="✓" small="EsteKlinik: işlem → skor yükselir → EsteStore önerisi" />
          <MiniPoint big="↑" small="EsteStore: bakım → skor sürdür → BiyoAGE tekrar ölç" />
        </div>
      </div>
    </Section>
  )
}

/* ─── Slayt 7: Why Now ──────────────────────────────────── */
function Slide7() {
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="06 · WHY NOW"
          title="Üç eğri 2026&apos;da kesişti."
          lead="Bu üç dalga aynı anda akmadan Estelongy yapılamazdı. Şimdi tam zamanı." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <CurveCard
            yil="2023→"
            baslik="LLM yüz analizi"
            metin="Yüz noktası çıkarma + cilt durum modelleri 100× ucuzladı, klinik hassasiyetine yaklaştı. 3 yıl önce mümkün değildi."
          />
          <CurveCard
            yil="2024→"
            baslik="Longevity ana akım"
            metin="Bryan Johnson efekti. Biyolojik yaş ölçümü artık niş bilim değil — milyonlarca tüketicinin ilgi alanı."
          />
          <CurveCard
            yil="2025→"
            baslik="Aesthetic tourism"
            metin="Türkiye dünya 1.&apos;si. İstanbul&apos;a yılda 1.5M estetik turisti geliyor. Yerli + global pazara açılan körfez."
          />
        </div>
        <p className="text-center mt-14 text-lg font-light" style={{ color: GOLD_LIGHT }}>
          Üç dalga + bir hekim-mimar = Estelongy.
        </p>
      </div>
    </Section>
  )
}

/* ─── Slayt 8: Ürün Canlı ──────────────────────────────── */
function Slide8() {
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="07 · ÜRÜN"
          title="Slayt değil — ürün."
          lead="estelongy.com canlı. 3 mobil app emülatörde uçtan uca çalışıyor. OTP/auth canlı. Marketplace iskeleti yayında. Bu sunumu da Estelongy&apos;nin içinden okuyorsunuz." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <PhoneFrame label="BiyoAGE" sub="Ölçüm" />
          <PhoneFrame label="EsteKlinik" sub="Pazaryeri" />
          <PhoneFrame label="EsteStore" sub="Marketplace" />
        </div>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <ProofTile k="3" v="canlı mobil app" />
          <ProofTile k="1" v="server, 5 katman" />
          <ProofTile k="✓" v="OTP + Auth canlı" />
          <ProofTile k="✓" v="Marketplace iskelet" />
        </div>
      </div>
    </Section>
  )
}

/* ─── Slayt 9: Mimari Asimetri ─────────────────────────── */
function Slide9() {
  const rows = [
    { label: 'Hekim onaylı skor',              e: true, a: false, b: false, c: false },
    { label: 'Randevu + komisyon',             e: true, a: true,  b: false, c: false },
    { label: 'Marketplace + orijinallik',      e: true, a: false, b: true,  c: false },
    { label: 'Klinik SaaS (PMS)',              e: true, a: false, b: false, c: false },
    { label: 'AI kvalifiye lead motoru',       e: true, a: false, b: false, c: true  },
    { label: 'Akademi (eğitim/sertifika)',     e: true, a: false, b: false, c: false },
    { label: 'Yaşlanma hızı + simülatör',      e: true, a: false, b: false, c: false },
  ]
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="08 · MİMARİ ASİMETRİ"
          title="Rakipler bir dikey. Biz bütünsel mimari."
          lead="Moat tek bir özellikte değil — özelliklerin birbirine bağlandığı yerde." />
        <div className="mt-12 overflow-hidden rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(201,169,97,0.2)` }}>
          <table className="w-full text-sm md:text-base">
            <thead>
              <tr style={{ background: 'rgba(201,169,97,0.08)' }}>
                <th className="text-left p-4 font-light" style={{ color: GOLD }}>Özellik</th>
                <th className="p-4 font-bold" style={{ color: GOLD }}>Estelongy</th>
                <th className="p-4 font-light" style={{ color: CREAM, opacity: 0.7 }}>Sadece randevu</th>
                <th className="p-4 font-light" style={{ color: CREAM, opacity: 0.7 }}>Sadece marketplace</th>
                <th className="p-4 font-light" style={{ color: CREAM, opacity: 0.7 }}>Sadece AI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(201,169,97,0.1)' }}>
                  <td className="p-4 font-light" style={{ color: CREAM }}>{r.label}</td>
                  <td className="p-4 text-center" style={{ color: GOLD }}>{r.e ? '●' : '—'}</td>
                  <td className="p-4 text-center" style={{ opacity: 0.4 }}>{r.a ? '●' : '—'}</td>
                  <td className="p-4 text-center" style={{ opacity: 0.4 }}>{r.b ? '●' : '—'}</td>
                  <td className="p-4 text-center" style={{ opacity: 0.4 }}>{r.c ? '●' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  )
}

/* ─── Slayt 10: Pazar ──────────────────────────────────── */
function Slide10() {
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="09 · PAZAR"
          title="Bir Türkiye sorunundan global bir kategoriye."
          lead="Türkiye estetik turizmde dünya 1.&apos;si. Bizim için bu yerel pazar değil — global pazara açılan körfez." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <MarketCircle size="lg" tier="TAM" amount="$200B+"
            label="Global estetik tıp + longevity wellness" />
          <MarketCircle size="md" tier="SAM" amount="$25B"
            label="TR + EMEA estetik medikal + ürün marketplace" />
          <MarketCircle size="sm" tier="SOM" amount="$2B"
            label="5 yıl ulaşılabilir — TR pazaryeri + AI lead + marketplace" />
        </div>
      </div>
    </Section>
  )
}

/* ─── Slayt 11: İş Modeli — 5 Musluk ──────────────────────── */
function Slide11() {
  const muslukler = [
    { no: '1', ad: 'Hekim onaylı randevu komisyonu', metric: '%8-15', who: '🏥 👤',
      desc: 'Klinik kazanır, kullanıcı güvenle alır, biz oran alırız.' },
    { no: '2', ad: 'EsteStore marketplace mark-up', metric: '%15-20', who: '👤 🤝',
      desc: 'Orijinal ürün → güvenli alıcı → marka için ölçülebilir kanal.' },
    { no: '3', ad: 'AI-kvalifiye lead satışı', metric: '₺300-800/lead', who: '🏥 🤝',
      desc: 'AI analiz çıktısı → satın alma niyet sinyali → klinik/markaya sıcak lead. Yüksek marj, stok yok.' },
    { no: '4', ad: 'EsteKlinikPRO / EsteStorePRO SaaS', metric: '₺2.5-5K/ay', who: '🏥 🤝',
      desc: 'PMS + finans + analitik. Tekrarlı, defansif, tahmin edilebilir gelir.' },
    { no: '5', ad: 'Estelongy Akademi — eğitim & sertifika', metric: '₺3-5K/kursiyer', who: '👤 🏥 🤝',
      desc: 'Klinik personeli, öğrenci, vendor için kurs satışı + sertifika.' },
  ]
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="10 · İŞ MODELİ"
          title="Beş gelir musluğu. Her biri diğer dördünden besleniyor."
          lead="Diversifiye. Defansif. Çapraz. Bir musluğa şok geldiğinde diğerleri taşır." />
        <div className="mt-10 space-y-3">
          {muslukler.map(m => (
            <div key={m.no} className="grid grid-cols-12 gap-4 items-center p-5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(201,169,97,0.18)` }}>
              <div className="col-span-1 text-3xl font-light" style={{ color: GOLD }}>{m.no}</div>
              <div className="col-span-5">
                <div className="font-medium text-base md:text-lg" style={{ color: CREAM }}>{m.ad}</div>
                <div className="text-sm font-light mt-1" style={{ color: CREAM, opacity: 0.65 }}>{m.desc}</div>
              </div>
              <div className="col-span-3 text-sm font-mono tracking-wider" style={{ color: GOLD_LIGHT }}>
                {m.metric}
              </div>
              <div className="col-span-3 text-right text-xl">{m.who}</div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

/* ─── Slayt 12: Gelir Projeksiyonu ─────────────────────── */
function Slide12() {
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="11 · PROJEKSİYON"
          title="5 yıllık projeksiyon — üç senaryo."
          lead="Base senaryo: Y5&apos;te ₺1.7B (~$56M) toplam gelir, 5 musluktan dengeli dağılım. Conservative = ½ × Base, Bull = 1.5 × Base." />
        <div className="mt-10">
          <RevenueChart />
        </div>
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {SENARYO.map(s => {
            const y5 = TOTAL_BASE[4] * s.factor
            return (
              <div key={s.ad} className="p-5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.renk}55` }}>
                <div className="text-sm tracking-widest mb-2" style={{ color: s.renk }}>{s.ad.toUpperCase()}</div>
                <div className="text-3xl font-light" style={{ color: CREAM }}>
                  ₺{(y5 / 1000).toFixed(2)}B
                </div>
                <div className="text-sm font-light mt-1" style={{ color: CREAM, opacity: 0.6 }}>
                  Y5 toplam ciro
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

/* ─── Slayt 13: VİZYON — Bilimsel Güzellik Simülatörü ───── */
function Slide13() {
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="12 · VİZYON"
          title="Estelongy bugün ölçüyor. Yarın simüle edecek."
          lead="Pazaryeri ilk dönem motoru. Asıl ürün: geleceği bilimsel olarak modelleyen tek platform." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
          <VisionTier
            tag="BUGÜN"
            yil="2026"
            baslik="Görünüm yaşı"
            altyazi="Estelongy Gençlik Skoru"
            metin="Selfie + longevity anketi + tetkik + hekim onayı. Şu anki halinin sayısal karşılığı."
            light
          />
          <VisionTier
            tag="YAKIN GELECEK"
            yil="2027 — 2028"
            baslik="Yaşlanma hızı"
            altyazi="Senin biyolojik ivmen"
            metin="Skor durağan değil — değişim ivmesi. Horvath clock, telomer modelleri, longevity biomarker entegrasyonu."
          />
          <VisionTier
            tag="UZAK VİZYON"
            yil="2028 +"
            baslik="Bilimsel Güzellik Simülatörü"
            altyazi="Geleceğini gör, sonra seç"
            metin="“Bu işlemi yaptırırsam 6 ay sonra nasıl görünürüm? Bu rejimi uygulasam 5 yıl sonra biyolojik yaşım ne olur? Bu hekim bu prosedürde başarı olasılığım ne?”"
            highlight
          />
        </div>
        <p className="text-center mt-12 text-lg font-light max-w-3xl mx-auto" style={{ color: GOLD_LIGHT }}>
          Pazaryeri Trojan horse. Asıl kategori: <span style={{ color: GOLD }}>geleceğin güzellik & longevity simülasyon platformu.</span>
        </p>
      </div>
    </Section>
  )
}

/* ─── Slayt 14: Yol Haritası ────────────────────────────── */
function Slide14() {
  const yol = [
    { ne: 'ŞU AN', ic: ['Web canlı (estelongy.com)', '3 mobil app emülatörde uçtan uca', 'OTP / Auth canlı', 'Marketplace iskeleti yayında'] },
    { ne: '+6 AY',  ic: ['Stripe ödeme canlı', 'İlk 50 ortak klinik', 'İlk 1.000 aktif kullanıcı', 'EsteVerify pilot'] },
    { ne: '+12 AY', ic: ['200 klinik · 25.000 kullanıcı', 'AI lead motoru canlı', 'Akademi 5 kurs', 'EsteKlinikPRO ölçeklenir'] },
    { ne: '+24 AY', ic: ['600 klinik · 100.000 kullanıcı', 'EsteVerify sektör standardı', 'Yaşlanma hızı modülü beta', 'Series A hazırlığı'] },
  ]
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="13 · YOL HARİTASI"
          title="Para nereye, ne hızla."
          lead="Doğrulanmış akış: bir önceki milestone tamamlanmadan bir sonrakine geçilmez." />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12">
          {yol.map((y, i) => (
            <div key={i} className="p-6 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${i === 0 ? GOLD : 'rgba(201,169,97,0.2)'}` }}>
              <div className="text-sm tracking-widest mb-4 font-mono"
                style={{ color: i === 0 ? GOLD : GOLD_DEEP }}>
                {y.ne}
              </div>
              <ul className="space-y-2">
                {y.ic.map((it, j) => (
                  <li key={j} className="text-sm font-light flex gap-2" style={{ color: CREAM, opacity: 0.85 }}>
                    <span style={{ color: GOLD }}>›</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

/* ─── Slayt 15: Ekip ─────────────────────────────────────── */
function Slide15() {
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="14 · EKİP"
          title="Hekim + Mimar = Founder-Market Fit."
          lead="Sektör içinden gelen + bütün ekosistemi tek başına inşa eden tek kişi." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="md:col-span-1 p-8 rounded-2xl"
            style={{ background: 'rgba(201,169,97,0.06)', border: `1px solid ${GOLD}55` }}>
            <div className="w-24 h-24 rounded-full mb-6 flex items-center justify-center text-4xl"
              style={{ background: BG, border: `2px solid ${GOLD}`, color: GOLD }}>
              İG
            </div>
            <div className="text-2xl font-light mb-1" style={{ color: CREAM }}>
              Dr. İzzet Gök
            </div>
            <div className="text-sm tracking-widest mb-4" style={{ color: GOLD }}>
              KURUCU · HEKİM-MİMAR
            </div>
            <p className="text-sm font-light leading-relaxed" style={{ color: CREAM, opacity: 0.8 }}>
              Hekim olduğu için ürünün pazarına, mimar olduğu için ürünün koduna sahip.
              Mimari + strateji + ürün + ilk satış: hepsi tek elden.
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm tracking-widest mb-6" style={{ color: GOLD_DEEP }}>
              YATIRIM SONRASI AÇILACAK POZİSYONLAR
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RoleCard title="CTO / Tech Lead"     note="Yığını ölçekle. Vizyon: Bilimsel Güzellik Simülatörü." />
              <RoleCard title="Klinik Network Lead" note="B2B satış. Y1 sonu 50 klinik, Y2 sonu 200." />
              <RoleCard title="Marketing & Brand"   note="Estelongy ana marka + 3 alt marka pozisyonlama." />
              <RoleCard title="Akademi Director"    note="Eğitim ekosistemi, kurs üretim ve sertifika programı." />
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ─── Slayt 16: ASK + Kapanış ──────────────────────────── */
function Slide16() {
  return (
    <Section dark>
      <div className="max-w-5xl w-full text-center">
        <div className="text-sm tracking-[0.5em] mb-8" style={{ color: GOLD_DEEP }}>15 · ASK</div>
        <h2 className="font-light leading-tight mb-12"
          style={{ fontSize: 'clamp(40px, 6vw, 80px)', color: CREAM, letterSpacing: '-0.02em' }}>
          Mimariyi <span style={{ color: GOLD }}>birlikte</span> inşa edelim.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <AskTile k="$2.5M"   v="Değerleme (post-money)" />
          <AskTile k="$500K"   v="Aranan tutar" big />
          <AskTile k="%20"     v="Dilution" />
          <AskTile k="18 ay"   v="Runway" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
          <WhyTile title="Why now"
            body="LLM yüz analizi + longevity ana akımı + estetik turizm. Üç eğri 2026&apos;da kesişti." />
          <WhyTile title="Why us"
            body="Hekim + Mimar tek kişide (Dr. İzzet Gök). Ürün slaytta değil; canlı." highlight />
          <WhyTile title="Why this"
            body="Pazaryerinden başlayıp Bilimsel Güzellik Simülatörü olmak. Trojan horse → kategori liderliği." />
        </div>

        <div className="pt-8 border-t" style={{ borderColor: 'rgba(201,169,97,0.25)' }}>
          <p className="text-base font-light mb-2" style={{ color: CREAM, opacity: 0.7 }}>
            Sonraki adım: 45 dk yüz yüze + canlı ürün demo
          </p>
          <p className="text-lg" style={{ color: GOLD }}>
            estelongy.com  ·  Dr. İzzet Gök
          </p>
        </div>
      </div>
    </Section>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   Yapı blokları
   ═══════════════════════════════════════════════════════════════════ */

function Section({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <section
      style={{
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        background: dark
          ? `radial-gradient(ellipse at center, #14182A 0%, ${BG} 70%)`
          : BG,
      }}
      className="relative h-screen w-full flex items-center justify-center px-6 md:px-16 py-20"
    >
      {children}
    </section>
  )
}

function SlideHeader({ kicker, title, lead }: { kicker: string; title: string; lead?: string }) {
  return (
    <div className="max-w-4xl">
      <div className="text-sm tracking-[0.4em] mb-4 font-light" style={{ color: GOLD_DEEP }}>
        {kicker}
      </div>
      <h2 className="font-light leading-tight mb-4"
        style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', color: CREAM, letterSpacing: '-0.02em' }}>
        {title}
      </h2>
      {lead && (
        <p className="text-base md:text-lg font-light leading-relaxed max-w-3xl"
          style={{ color: CREAM, opacity: 0.7 }}>
          {lead}
        </p>
      )}
    </div>
  )
}

function ProblemCard({ icon, who, subtitle, pain, note }:
  { icon: string; who: string; subtitle?: string; pain: string; note: string }) {
  return (
    <div className="p-6 rounded-2xl h-full flex flex-col"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,169,97,0.18)' }}>
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        <span className="text-sm tracking-widest" style={{ color: GOLD }}>{who}</span>
        {subtitle && <span className="text-sm font-light" style={{ color: CREAM, opacity: 0.5 }}>{subtitle}</span>}
      </div>
      <p className="text-base font-light italic mb-4 leading-relaxed" style={{ color: CREAM }}>
        {pain}
      </p>
      <p className="text-sm font-light mt-auto pt-4 border-t leading-relaxed"
        style={{ borderColor: 'rgba(201,169,97,0.15)', color: CREAM, opacity: 0.6 }}>
        {note}
      </p>
    </div>
  )
}

function BenefitCard({ icon, who, headline, body }:
  { icon: string; who: string; headline: string; body: string }) {
  return (
    <div className="p-6 rounded-2xl h-full"
      style={{ background: 'rgba(201,169,97,0.04)', border: `1px solid ${GOLD}33` }}>
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        <span className="text-sm tracking-widest" style={{ color: GOLD }}>{who}</span>
      </div>
      <h3 className="text-xl font-light mb-3 leading-snug" style={{ color: CREAM }}>
        {headline}
      </h3>
      <p className="text-sm font-light leading-relaxed" style={{ color: CREAM, opacity: 0.75 }}>
        {body}
      </p>
    </div>
  )
}

function MiniPoint({ big, small }: { big: string; small: string }) {
  return (
    <div className="p-5 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,169,97,0.15)' }}>
      <div className="text-4xl font-light mb-2" style={{ color: GOLD }}>{big}</div>
      <div className="text-sm font-light leading-relaxed" style={{ color: CREAM, opacity: 0.75 }}>{small}</div>
    </div>
  )
}

function BrandCard({ name, role, desc, kpi }:
  { name: string; role: string; desc: string; kpi: string }) {
  return (
    <div className="p-6 rounded-2xl h-full"
      style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${GOLD}30` }}>
      <div className="text-sm tracking-widest mb-2" style={{ color: GOLD_DEEP }}>{role.toUpperCase()}</div>
      <h3 className="text-2xl font-light mb-4" style={{ color: CREAM }}>{name}</h3>
      <p className="text-sm font-light leading-relaxed mb-5" style={{ color: CREAM, opacity: 0.75 }}>{desc}</p>
      <div className="pt-4 border-t text-sm tracking-wider"
        style={{ borderColor: 'rgba(201,169,97,0.2)', color: GOLD_LIGHT }}>
        {kpi}
      </div>
    </div>
  )
}

function ScoreTimeline() {
  const points = [
    { x: 8,  y: 70, score: 64, label: 'AI ön analiz' },
    { x: 28, y: 60, score: 71, label: 'Klinik onayı' },
    { x: 50, y: 45, score: 78, label: 'İşlem' },
    { x: 72, y: 38, score: 82, label: 'Ürün rejimi' },
    { x: 92, y: 32, score: 86, label: '3 ay sonra' },
  ]
  return (
    <svg viewBox="0 0 100 90" className="w-full h-48 md:h-64" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="scoreLine" x1="0" x2="100%" y1="0" y2="0">
          <stop offset="0%" stopColor={GOLD_DEEP} />
          <stop offset="100%" stopColor={GOLD_LIGHT} />
        </linearGradient>
        <linearGradient id="scoreFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.25" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M ${points[0].x},90 L ${points.map(p => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},90 Z`}
        fill="url(#scoreFill)"
      />
      <path
        d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`}
        fill="none"
        stroke="url(#scoreLine)"
        strokeWidth="0.7"
      />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="1.4" fill={GOLD} />
          <text x={p.x} y={p.y - 4} textAnchor="middle" fontSize="4" fill={CREAM} fontWeight="300">
            {p.score}
          </text>
          <text x={p.x} y={88} textAnchor="middle" fontSize="2.6" fill={CREAM} opacity="0.55">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function Flywheel() {
  return (
    <svg viewBox="0 0 400 240" className="w-full h-64 md:h-80">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={GOLD} />
        </marker>
      </defs>
      {/* daireler */}
      <FlywheelNode cx={80}  cy={120} title="BiyoAGE" sub="ölç" />
      <FlywheelNode cx={200} cy={60}  title="EsteKlinik" sub="işlem" />
      <FlywheelNode cx={320} cy={120} title="EsteStore" sub="sürdür" />
      <FlywheelNode cx={200} cy={200} title="Estelongy" sub="veri kuyusu" center />
      {/* okları */}
      <path d="M 110 105 Q 150 70 175 65" fill="none" stroke={GOLD} strokeWidth="1.5" markerEnd="url(#arrow)" />
      <path d="M 225 65  Q 270 75 295 105" fill="none" stroke={GOLD} strokeWidth="1.5" markerEnd="url(#arrow)" />
      <path d="M 295 135 Q 270 180 225 195" fill="none" stroke={GOLD} strokeWidth="1.5" markerEnd="url(#arrow)" />
      <path d="M 175 195 Q 130 180 110 135" fill="none" stroke={GOLD} strokeWidth="1.5" markerEnd="url(#arrow)" />
      <path d="M 200 80  L 200 175" fill="none" stroke={GOLD_DEEP} strokeWidth="0.8" strokeDasharray="2 2" />
      <path d="M 95  120 L 185 200" fill="none" stroke={GOLD_DEEP} strokeWidth="0.8" strokeDasharray="2 2" />
      <path d="M 305 120 L 215 200" fill="none" stroke={GOLD_DEEP} strokeWidth="0.8" strokeDasharray="2 2" />
    </svg>
  )
}

function FlywheelNode({ cx, cy, title, sub, center }:
  { cx: number; cy: number; title: string; sub: string; center?: boolean }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={center ? 26 : 22}
        fill={center ? GOLD : 'transparent'}
        stroke={center ? GOLD : GOLD_LIGHT} strokeWidth={center ? 0 : 1.5} />
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="9"
        fill={center ? BG : CREAM} fontWeight={center ? 700 : 400}>
        {title}
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="6"
        fill={center ? BG : CREAM} opacity={center ? 0.75 : 0.6}>
        {sub}
      </text>
    </g>
  )
}

function CurveCard({ yil, baslik, metin }: { yil: string; baslik: string; metin: string }) {
  return (
    <div className="p-6 rounded-2xl h-full"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,169,97,0.18)' }}>
      <div className="text-xs tracking-widest font-mono mb-3" style={{ color: GOLD }}>{yil}</div>
      <h3 className="text-xl font-light mb-3" style={{ color: CREAM }}>{baslik}</h3>
      <p className="text-sm font-light leading-relaxed" style={{ color: CREAM, opacity: 0.75 }}>{metin}</p>
    </div>
  )
}

function PhoneFrame({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-44 h-80 rounded-[2rem] p-2"
        style={{ background: 'rgba(201,169,97,0.1)', border: `1px solid ${GOLD}55` }}>
        <div className="w-full h-full rounded-[1.7rem] flex flex-col items-center justify-center"
          style={{ background: `linear-gradient(180deg, #14182A, ${BG})` }}>
          <div className="text-xs tracking-widest mb-2" style={{ color: GOLD_DEEP }}>{sub.toUpperCase()}</div>
          <div className="text-2xl font-light" style={{ color: GOLD }}>{label}</div>
          <div className="mt-6 px-3 py-1 rounded-full text-xs tracking-widest"
            style={{ background: GOLD, color: BG }}>
            CANLI
          </div>
        </div>
      </div>
      <div className="text-sm tracking-widest mt-4" style={{ color: CREAM, opacity: 0.7 }}>{label}</div>
    </div>
  )
}

function ProofTile({ k, v }: { k: string; v: string }) {
  return (
    <div className="p-4 rounded-xl"
      style={{ background: 'rgba(201,169,97,0.05)', border: '1px solid rgba(201,169,97,0.2)' }}>
      <div className="text-2xl font-light" style={{ color: GOLD }}>{k}</div>
      <div className="text-xs font-light mt-1 tracking-wide" style={{ color: CREAM, opacity: 0.7 }}>{v}</div>
    </div>
  )
}

function MarketCircle({ size, tier, amount, label }:
  { size: 'lg' | 'md' | 'sm'; tier: string; amount: string; label: string }) {
  const dim = size === 'lg' ? 'h-72 w-72' : size === 'md' ? 'h-60 w-60' : 'h-48 w-48'
  const opacity = size === 'lg' ? 0.35 : size === 'md' ? 0.55 : 1
  return (
    <div className="flex flex-col items-center">
      <div className={`${dim} rounded-full flex flex-col items-center justify-center mb-4`}
        style={{
          background: `radial-gradient(circle, ${GOLD}${size === 'lg' ? '15' : size === 'md' ? '20' : '30'} 0%, transparent 70%)`,
          border: `1px solid ${GOLD}${size === 'lg' ? '30' : size === 'md' ? '50' : '99'}`,
          opacity,
        }}>
        <div className="text-sm tracking-[0.4em]" style={{ color: GOLD }}>{tier}</div>
        <div className="text-4xl font-light my-3" style={{ color: CREAM }}>{amount}</div>
      </div>
      <p className="text-center text-sm font-light max-w-[220px]"
        style={{ color: CREAM, opacity: 0.7 }}>
        {label}
      </p>
    </div>
  )
}

function RevenueChart() {
  // Stacked bar — 5 musluk, 5 yıl, Base senaryo
  const maxTotal = Math.max(...TOTAL_BASE)
  const W = 800, H = 320, P = 40
  const barW = (W - 2 * P) / REVENUE_BASE.length * 0.55
  const gap = (W - 2 * P) / REVENUE_BASE.length

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 60}`} className="w-full" style={{ overflow: 'visible' }}>
        {/* grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <g key={i}>
            <line
              x1={P} y1={H - p * (H - 2 * P)}
              x2={W - P} y2={H - p * (H - 2 * P)}
              stroke={GOLD_DEEP} strokeOpacity="0.15" strokeWidth="0.5"
              strokeDasharray="2 4"
            />
            <text x={P - 6} y={H - p * (H - 2 * P) + 3}
              fontSize="10" fill={CREAM} opacity="0.45" textAnchor="end">
              ₺{Math.round(maxTotal * p)}M
            </text>
          </g>
        ))}
        {/* bars */}
        {REVENUE_BASE.map((row, i) => {
          const cx = P + gap * i + gap / 2
          const x = cx - barW / 2
          let yCursor = H - P
          const segments = [
            { val: row.komisyon,    renk: MUSLUK_RENK.komisyon,    ad: 'Komisyon' },
            { val: row.marketplace, renk: MUSLUK_RENK.marketplace, ad: 'Marketplace' },
            { val: row.lead,        renk: MUSLUK_RENK.lead,        ad: 'AI Lead' },
            { val: row.saas,        renk: MUSLUK_RENK.saas,        ad: 'SaaS' },
            { val: row.akademi,     renk: MUSLUK_RENK.akademi,     ad: 'Akademi' },
          ]
          return (
            <g key={i}>
              {segments.map((s, j) => {
                const h = (s.val / maxTotal) * (H - 2 * P)
                yCursor -= h
                return <rect key={j} x={x} y={yCursor} width={barW} height={h} fill={s.renk} />
              })}
              <text x={cx} y={H - P + 18} textAnchor="middle" fontSize="12" fill={GOLD}>
                {row.yil}
              </text>
              <text x={cx} y={H - P + 34} textAnchor="middle" fontSize="11" fill={CREAM} opacity="0.7">
                ₺{TOTAL_BASE[i].toFixed(TOTAL_BASE[i] < 100 ? 1 : 0)}M
              </text>
            </g>
          )
        })}
      </svg>
      {/* legend */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 text-sm">
        {[
          { renk: MUSLUK_RENK.komisyon, ad: 'Randevu komisyonu' },
          { renk: MUSLUK_RENK.marketplace, ad: 'Marketplace' },
          { renk: MUSLUK_RENK.lead, ad: 'AI lead satışı' },
          { renk: MUSLUK_RENK.saas, ad: 'SaaS (PRO)' },
          { renk: MUSLUK_RENK.akademi, ad: 'Akademi' },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm" style={{ background: l.renk }} />
            <span style={{ color: CREAM, opacity: 0.8 }}>{l.ad}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function VisionTier({ tag, yil, baslik, altyazi, metin, light, highlight }:
  { tag: string; yil: string; baslik: string; altyazi: string; metin: string; light?: boolean; highlight?: boolean }) {
  return (
    <div className="p-6 rounded-2xl h-full flex flex-col"
      style={{
        background: highlight ? `linear-gradient(160deg, ${GOLD}22, transparent)` : 'rgba(255,255,255,0.02)',
        border: highlight ? `1px solid ${GOLD}` : light ? `1px solid ${GOLD}55` : '1px solid rgba(201,169,97,0.18)',
      }}>
      <div className="text-xs tracking-[0.4em] mb-2"
        style={{ color: highlight ? GOLD : GOLD_DEEP }}>
        {tag}
      </div>
      <div className="text-sm font-mono mb-4" style={{ color: GOLD }}>{yil}</div>
      <h3 className="text-2xl font-light mb-1" style={{ color: CREAM }}>{baslik}</h3>
      <div className="text-sm italic mb-4" style={{ color: GOLD_LIGHT }}>{altyazi}</div>
      <p className="text-sm font-light leading-relaxed mt-auto" style={{ color: CREAM, opacity: 0.8 }}>
        {metin}
      </p>
    </div>
  )
}

function RoleCard({ title, note }: { title: string; note: string }) {
  return (
    <div className="p-4 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,169,97,0.18)' }}>
      <div className="text-base font-medium mb-1" style={{ color: CREAM }}>{title}</div>
      <div className="text-sm font-light" style={{ color: CREAM, opacity: 0.65 }}>{note}</div>
    </div>
  )
}

function AskTile({ k, v, big }: { k: string; v: string; big?: boolean }) {
  return (
    <div className="p-5 rounded-xl"
      style={{
        background: big ? `linear-gradient(160deg, ${GOLD}22, transparent)` : 'rgba(255,255,255,0.02)',
        border: big ? `1px solid ${GOLD}` : '1px solid rgba(201,169,97,0.2)',
      }}>
      <div className="text-3xl md:text-4xl font-light"
        style={{ color: big ? GOLD : CREAM }}>
        {k}
      </div>
      <div className="text-xs tracking-widest mt-2"
        style={{ color: CREAM, opacity: 0.65 }}>
        {v}
      </div>
    </div>
  )
}

function WhyTile({ title, body, highlight }: { title: string; body: string; highlight?: boolean }) {
  return (
    <div className="p-5 rounded-xl"
      style={{
        background: highlight ? `linear-gradient(160deg, ${GOLD}18, transparent)` : 'rgba(255,255,255,0.02)',
        border: highlight ? `1px solid ${GOLD}` : '1px solid rgba(201,169,97,0.18)',
      }}>
      <div className="text-sm tracking-widest mb-2"
        style={{ color: highlight ? GOLD : GOLD_DEEP }}>
        {title.toUpperCase()}
      </div>
      <p className="text-sm font-light leading-relaxed" style={{ color: CREAM, opacity: 0.85 }}>
        {body}
      </p>
    </div>
  )
}
