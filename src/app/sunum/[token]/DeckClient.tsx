'use client'

import { useEffect, useRef, useState } from 'react'

/* ─── Estelongy yatırımcı sunumu — Zamansız Güzellik Mimarlığı ───
   16 slayt · full-viewport scroll-snap · klavye nav · dark luxury
   Dr. İzzet Gök · Kurucu · CTO · Haziran 2026
*/

const GOLD = '#C9A961'
const GOLD_LIGHT = '#D4B872'
const GOLD_DEEP = '#8B7339'
const BG = '#0A0F1A'
const CREAM = '#F5F1E8'

const REVENUE_BASE = [
  { yil: 'Y1', komisyon: 3.6, marketplace: 0.72, lead: 0.9, saas: 0.9, akademi: 0.6 },
  { yil: 'Y2', komisyon: 23,  marketplace: 9.7,  lead: 6.4, saas: 5.5, akademi: 5.3 },
  { yil: 'Y3', komisyon: 114, marketplace: 60,   lead: 35,  saas: 19,  akademi: 24  },
  { yil: 'Y4', komisyon: 320, marketplace: 180,  lead: 126, saas: 50,  akademi: 81  },
  { yil: 'Y5', komisyon: 700, marketplace: 400,  lead: 294, saas: 110, akademi: 200 },
]
const TOTAL_BASE = REVENUE_BASE.map(r => r.komisyon + r.marketplace + r.lead + r.saas + r.akademi)

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
    function updateScale() {
      const sx = (window.innerWidth - 24) / 1280
      const sy = (window.innerHeight - 24) / 720
      const s = Math.min(sx, sy, 1)
      document.documentElement.style.setProperty('--deck-scale', String(s))
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', updateScale)
    updateScale()
    const el = containerRef.current
    el?.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', updateScale)
      el?.removeEventListener('scroll', onScroll)
    }
  }, [])

  function goTo(idx: number) {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: idx * window.innerHeight, behavior: 'smooth' })
  }

  const pillStyle: React.CSSProperties = {
    background: 'rgba(10,15,26,0.55)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(201,169,97,0.18)',
  }

  return (
    <div
      ref={containerRef}
      style={{ background: BG, color: CREAM, scrollSnapType: 'y mandatory' }}
      className="h-screen overflow-y-scroll overflow-x-hidden"
    >
      <div className="fixed top-5 right-5 z-50 px-3 py-1.5 rounded-full text-sm tracking-widest font-mono"
        style={{ color: GOLD, ...pillStyle }}>
        {String(current + 1).padStart(2, '0')} / {String(TOTAL_SLIDES).padStart(2, '0')}
      </div>

      <div className="fixed top-5 left-5 z-50 px-3 py-1.5 rounded-full text-sm tracking-[0.3em] font-light"
        style={{ color: GOLD_DEEP, ...pillStyle }}>
        ESTELONGY
      </div>

      <div className="fixed right-3 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
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
        <div className="mb-4 text-xs md:text-sm tracking-[0.5em] font-light" style={{ color: GOLD_DEEP }}>
          ZAMANSIZ GÜZELLİK MİMARLIĞI
        </div>
        <h1 className="font-light leading-none mb-6"
          style={{ fontSize: 'clamp(48px, 7vw, 100px)', color: CREAM, letterSpacing: '-0.04em' }}>
          Estelongy
        </h1>
        <div className="h-px w-24 mx-auto mb-6" style={{ background: GOLD }} />
        <p className="text-base md:text-lg font-light mb-2" style={{ color: CREAM, opacity: 0.85 }}>
          Bilimi güzelliğe dönüştüren ölçüm, kanıt ve simülasyon altyapısı.
        </p>
        <p className="text-xs md:text-sm mt-6 tracking-widest" style={{ color: GOLD }}>
          YATIRIMCI SUNUMU · HAZİRAN 2026
        </p>
        <p className="mt-2 text-xs md:text-sm font-light" style={{ color: CREAM, opacity: 0.55 }}>
          Dr. İzzet Gök · Kurucu · CTO
        </p>
      </div>
      <div className="absolute bottom-3 right-4 text-[10px] font-light tracking-wider"
        style={{ color: GOLD_DEEP, opacity: 0.6 }}>
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
          title="Estetik tıp, kanıtlanamayan bir sektördür."
          lead="Dünyada 50 milyar dolar, Türkiye&apos;de 2 milyar dolar; yıllık büyüme yüzde 18-22. Sektör hızla büyüyor — ancak ortak bir skor, doğrulanmış orijinallik ve ölçülebilir sonuç metriği yok." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <ProblemCard icon="👤" who="KULLANICI"
            pain="“Hangi klinik gerçekten iyi? Hangi ürün orijinal? Yaptırdığım işlem işe yaradı mı?”"
            note="Karar Instagram akışına, fiyat sözlü pazarlığa, sonuç gözleme bırakılıyor." />
          <ProblemCard icon="🏥" who="KLİNİK"
            pain="“Pazarlamaya bütçe ayırıyoruz, sonucu ölçemiyoruz. Hasta verisi parçalı. Sahte yorumlar marka değerini aşındırıyor.”"
            note="Sezonluk talep, sabit gider, ölçülemeyen edinme. Kanıtsız büyüme planı." />
          <ProblemCard icon="🤝" who="İŞ ORTAĞI" subtitle="(marka / vendor)"
            pain="“Sahte muadiller orijinal ürünün önünü kesiyor. Klinik dağıtımı opak, performans verisi yok.”"
            note="Klinik dağıtım, orijinallik doğrulaması ve birinci el kullanıcı geri bildirimi — üçü de eksik." />
        </div>
        <p className="text-center mt-5 text-sm md:text-base font-light" style={{ color: GOLD_LIGHT }}>
          Üç sorun, tek bir altyapı eksikliğinin üç farklı yansımasıdır.
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
          title="Estelongy estetik tıbbı ölçülebilir, tekrar edilebilir, kanıtlanabilir bir akışa dönüştürür."
          lead="Üç bağımsız markayı — BiyoAGE, EsteKlinik, EsteStore — tek bir veri ve kimlik altyapısı altında birleştirir." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <BenefitCard icon="👤" who="KULLANICIYA"
            headline="Biyolojik ve görünüm yaşı yönetimi"
            body="Hekim onaylı Estelongy Gençlik Skoru ile görünüm yaşının ölçümü ve takibi; longevity protokolleriyle biyolojik yaşın yönetimi. AI ön analizinden hekim onayına, ev rejiminden klinik müdahalesine kadar tüm yolculuk tek bir hesap üzerinde." />
          <BenefitCard icon="🏥" who="KLİNİĞE"
            headline="Niyetli hasta yönlendirmesi ve tek panel yönetimi"
            body="AI analizinden geçmiş, satın alma niyeti netleşmiş hasta akışı. Takvim, hasta dosyası, finans ve ürün satışı tek panelde yönetilir. Yorumlar yalnızca gerçek hastalardan; doğrulama altyapı seviyesinde sağlanır." />
          <BenefitCard icon="🤝" who="İŞ ORTAĞINA"
            headline="Bakanlık onaylı, doğrulanmış ürün satış altyapısı"
            body="EsteVerify ile ÜTS ve Sağlık Bakanlığı onaylı orijinallik kanıtı. Hem son tüketiciye (B2C) hem kliniklere (B2B) doğrudan iki kanallı satış. Birinci el kullanıcı ve klinik geri bildirimi." />
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
        <SlideHeader kicker="03 · TEMEL ÖNERME"
          title="Estelongy Gençlik Skoru bir özellik değil — birikim grafiğidir."
          lead="Her selfie, her klinik ziyareti, her ürün kullanımı skoru günceller. Zaman ilerledikçe veri sertleşir, model derinleşir, kullanıcının platformdaki değeri artar." />
        <div className="mt-8 mb-6">
          <ScoreTimeline />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MiniPoint big="1×" small="Kullanıcı bir kez skor aldıktan sonra geri çıkmaz; veri güncellendikçe katılım sürer." />
          <MiniPoint big="N×" small="Her yeni veri noktası modeli sertleştirir; birikim kopyalanamaz, çünkü zaman birikiyor." />
          <MiniPoint big="∞" small="Skor → klinik → işlem → ürün → bakım → yeniden ölçüm. Kapanmayan halka." />
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
          title="Tek mimari, üç bağımsız marka."
          lead="Estelongy vitrinde tek marka; onu inşa eden üç bağımsız iş kolu, her biri kendi pazarına hizmet eder ve hepsi tek bir veri kuyusunu besler." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <BrandCard
            name="BiyoAGE"
            role="Ölçüm motoru"
            desc="AI yüz analizi, longevity anketi ve Estelongy Gençlik Skoru motoru. Kullanıcının sisteme giriş noktası."
            kpi="“Zamansız Güzellik Mimarlığı.”"
          />
          <BrandCard
            name="EsteKlinik"
            role="Maddeleştirme katmanı"
            desc="Hekim onaylı klinik pazaryeri. Randevu, prosedür, hekim onayı ve doğrulanmış sonuç. Skorun klinik tedaviye dönüştüğü katman."
            kpi="“Bilimi Güzelliğe Çeviren Klinikler.”"
          />
          <BrandCard
            name="EsteStore"
            role="Sürdürme katmanı · Çift kanal"
            desc="EsteVerify damgalı, Bakanlık onaylı kozmetik ve longevity pazaryeri. Son tüketiciye (B2C) ve kliniklere özgü tedarik sistemiyle (B2B) çift kanallı satış. Skorun ev rejiminde ve klinik tedarikinde sürdürüldüğü katman."
            kpi="“Ürün Değil, Sana Özel Çözüm.”"
          />
        </div>
        <p className="text-center mt-5 text-sm md:text-base font-light" style={{ color: GOLD_LIGHT }}>
          Üç vitrin, tek veri kuyusu, tek mimari.
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
        <SlideHeader kicker="05 · KULLANICI DÖNGÜSÜ"
          title="Kapanmayan halka."
          lead="Skor ölçümü → hekim değerlendirmesi → işlem ve uygun ürün → yeniden skor ölçümü. Her döngüde veri sertleşir, kullanıcı katılımı derinleşir, yaşam boyu değer dört kat artar." />
        <div className="mt-6">
          <Flywheel />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <MiniPoint big="↓" small="BiyoAGE skoru ölçer; ihtiyaç tespit edildiğinde EsteKlinik öne çıkar." />
          <MiniPoint big="✓" small="EsteKlinik işlemi tamamlar; skor güncellenir, EsteStore rejimi devreye girer." />
          <MiniPoint big="↑" small="EsteStore bakımı sürdürür; BiyoAGE yeniden ölçer, döngü kapanır." />
        </div>
      </div>
    </Section>
  )
}

/* ─── Slayt 7: Zamanlama ──────────────────────────────── */
function Slide7() {
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="06 · ZAMANLAMA"
          title="Pazar büyürken talep yön değiştiriyor."
          lead="Estetik tıp küresel ve yerelde çift haneli büyüyor; ancak tüketicinin pusulası ‘daha fazla dolgu’dan ‘ölçülebilir, doğal, sürdürülebilir gençleşme’ye dönüyor. Estelongy tam bu yön değişiminin altyapısı." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <TrendCard
            tag="PAZAR HACMİ"
            stat="$109 milyar"
            yil="2026"
            metin="Küresel estetik tıp ~109 milyar dolara ulaşıyor; yıllık bileşik büyüme %12–14 aralığında. Türkiye sağlık turizmi pazarı 4,6 milyar dolar, CAGR %15–17 — küresel ortalamayı geride bırakıyor."
          />
          <TrendCard
            tag="DİREKSİYON"
            stat="Longevity"
            yil="2025 →"
            metin="Biyolojik yaş ve yaşlanma hızı ölçümü niş bilimden ana akıma geçti. Longevity klinikleri yıllık %37 personel büyütüyor; epigenetik test pazarı 2034’e kadar 4,3 milyar dolara koşuyor. Tüketici artık ‘genç görünmek’ değil, ‘sağlıklı yaşlanmak’ istiyor."
          />
          <TrendCard
            tag="BİLİM SINIRI"
            stat="Eksozom · Kök hücre"
            yil="Düzensiz alan"
            metin="Eksozom ve kök hücre tedavileri agresif şekilde pazarlanıyor; oysa FDA hâlâ estetik kullanım için onay vermedi, klinik kanıt sınırlı, advers olay raporları artıyor. Tüketici doğru hekimi ve doğrulanmış protokolü ayırt edemiyor."
          />
          <TrendCard
            tag="ESTETİK YÖN"
            stat="Doğal geri dönüş"
            yil="2026"
            metin="‘Filler Fatigue’ — aşırı dolguyu erittirmek küresel akım. Tüketici ‘daha az ama doğru’ diyor: doğru hekim, doğru zamanlama, doğru kombinasyon. Doğal güzellik kabulü artık bir endüstri yönü."
          />
        </div>
        <p className="text-center mt-6 text-base md:text-lg font-light max-w-4xl mx-auto"
          style={{ color: GOLD_LIGHT }}>
          Büyüyen pazar, olgunlaşan bilim, dönüşen estetik anlayışı — kategoriyi tanımlayan altyapı bu kesişimde inşa edilir.
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
        <SlideHeader kicker="07 · SİSTEM DURUMU"
          title="Bugünkü altyapı."
          lead="estelongy.com yayında. Üç mobil uygulama uçtan uca akıyor. Kimlik doğrulama ve pazaryeri altyapısı canlı. Bu sunum da aynı altyapı üzerinde çalışıyor." />
        <div className="grid grid-cols-3 gap-4 md:gap-6 mt-6">
          <PhoneFrame label="BiyoAGE" sub="Ölçüm" />
          <PhoneFrame label="EsteKlinik" sub="Pazaryeri" />
          <PhoneFrame label="EsteStore" sub="Marketplace" />
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <ProofTile k="3" v="canlı mobil uygulama" />
          <ProofTile k="1" v="server, 5 katman" />
          <ProofTile k="✓" v="OTP + kimlik doğrulama" />
          <ProofTile k="✓" v="pazaryeri altyapısı" />
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
    { label: 'AI kalifiye lead motoru',       e: true, a: false, b: false, c: true  },
    { label: 'Akademi (eğitim/sertifika)',     e: true, a: false, b: false, c: false },
    { label: 'Yaşlanma hızı + simülatör',      e: true, a: false, b: false, c: false },
  ]
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="08 · ASİMETRİ"
          title="Rakipler tek dikey. Estelongy bütünsel mimari."
          lead="Savunma alanı tekil özellikte değil, özelliklerin birbirine bağlandığı katmandadır." />
        <div className="mt-10 overflow-hidden rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,169,97,0.2)' }}>
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
          title="Yerel kırılma noktasından küresel kategoriye."
          lead="Türkiye estetik turizmde dünyada birinci. Yerel pazar, küresel kategoriye açılan ön kapımız." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <MarketCircle size="lg" tier="TAM" amount="$200B+"
            label="Küresel estetik tıp + longevity wellness" />
          <MarketCircle size="md" tier="SAM" amount="$25B"
            label="TR + EMEA estetik medikal ve ürün pazaryeri" />
          <MarketCircle size="sm" tier="SOM" amount="$2B"
            label="Beş yıl içinde ulaşılabilir hedef pazar payı" />
        </div>
      </div>
    </Section>
  )
}

/* ─── Slayt 11: İş Modeli — 5 Musluk ──────────────────────── */
function Slide11() {
  const muslukler = [
    { no: '1', ad: 'Hekim onaylı randevu komisyonu', metric: '%8–15', who: '🏥 👤',
      desc: 'Klinik tarafı işlemi tamamlar; platform doğrulama ve aracılık karşılığında oran alır.' },
    { no: '2', ad: 'EsteStore pazaryeri komisyonu', metric: '%15–20', who: '👤 🤝',
      desc: 'Orijinal ürün, güvenli alıcı ve marka için ölçülebilir kanal.' },
    { no: '3', ad: 'AI kalifiye lead satışı', metric: '₺300–800/lead', who: '🏥 🤝',
      desc: 'AI analiz çıktısı satın alma niyeti üretir; klinik ve markalara sıcak lead olarak iletilir. Yüksek marj, stoksuz operasyon.' },
    { no: '4', ad: 'EsteKlinikPRO / EsteStorePRO SaaS', metric: '₺2,5–5K/ay', who: '🏥 🤝',
      desc: 'Klinik ve vendor için PMS, finans ve analitik. Tekrarlı, tahmin edilebilir gelir.' },
    { no: '5', ad: 'Estelongy Akademi — eğitim ve sertifika', metric: '₺3–5K/kursiyer', who: '👤 🏥 🤝',
      desc: 'Klinik personeli, öğrenci ve vendor için kurs ve sertifika programları.' },
  ]
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="10 · İŞ MODELİ"
          title="Beş gelir katmanı."
          lead="Tek kullanıcı tabanı, çapraz beslenen kanallar; edinme maliyeti düşer, tek kanala bağımlılık ortadan kalkar." />
        <div className="mt-6 space-y-2">
          {muslukler.map(m => (
            <div key={m.no} className="grid grid-cols-12 gap-4 items-center p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,169,97,0.18)' }}>
              <div className="col-span-1 text-3xl font-light" style={{ color: GOLD }}>{m.no}</div>
              <div className="col-span-5">
                <div className="font-medium text-sm md:text-base" style={{ color: CREAM }}>{m.ad}</div>
                <div className="text-xs md:text-sm font-light mt-1 leading-snug" style={{ color: CREAM, opacity: 0.65 }}>{m.desc}</div>
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
          title="Beş yıllık ciro projeksiyonu."
          lead="Base senaryo beşinci yılda 1,7 milyar TL toplam ciroya ulaşır. Conservative senaryo bu rakamın yarısı, Bull senaryo bir buçuk katı olarak modellenir." />
        <div className="mt-8">
          <RevenueChart />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
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
          title="Estelongy bugün ölçer; yarın simüle eder."
          lead="Pazaryeri ilk dönem büyüme motorudur. Asıl ürün, güzelliği ve longevity&apos;yi bilimsel olarak modelleyen tek platform olmaktır." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <VisionTier
            tag="BUGÜN"
            yil="2026"
            baslik="Görünüm yaşı"
            altyazi="Estelongy Gençlik Skoru"
            metin="Selfie, longevity anketi, tetkik ve hekim onayı. Mevcut durumun sayısal karşılığı."
            light
          />
          <VisionTier
            tag="YAKIN GELECEK"
            yil="2027 — 2028"
            baslik="Yaşlanma hızı"
            altyazi="Biyolojik ivmenin ölçümü"
            metin="Skor durağan değil, değişim ivmesidir. Epigenetik saat ve longevity biyobelirteçlerinin entegrasyonu."
          />
          <VisionTier
            tag="UZAK VİZYON"
            yil="2028 +"
            baslik="Bilimsel Güzellik Simülatörü"
            altyazi="Geleceği gör, sonra seç"
            metin="“Bu işlemi yaptırırsam altı ay sonra nasıl görünürüm? Bu rejim beş yıl sonra biyolojik yaşımı kaça düşürür? Bu hekimde başarı olasılığım nedir?”"
            highlight
          />
        </div>
        <p className="text-center mt-6 text-sm md:text-base font-light max-w-3xl mx-auto"
          style={{ color: GOLD_LIGHT }}>
          Pazaryeri başlangıç motoru; hedef kategori bilimsel güzellik ve longevity simülasyon platformudur.
        </p>
      </div>
    </Section>
  )
}

/* ─── Slayt 14: Yol Haritası ────────────────────────────── */
function Slide14() {
  const yol = [
    { ne: 'ŞU AN', ic: [
      'estelongy.com canlı',
      'Üç mobil uygulama uçtan uca akıyor',
      'OTP ve kimlik doğrulama yayında',
      'Pazaryeri altyapısı canlı',
    ]},
    { ne: '+6 AY',  ic: [
      'Stripe ödeme canlı',
      'İlk 50 ortak klinik',
      'İlk 1.000 aktif kullanıcı',
      'EsteVerify pilot uygulaması',
    ]},
    { ne: '+12 AY', ic: [
      '200 klinik · 25.000 kullanıcı',
      'AI lead motoru canlı',
      'Akademi ilk beş kurs',
      'EsteKlinikPRO ölçeklenir',
    ]},
    { ne: '+24 AY', ic: [
      '600 klinik · 100.000 kullanıcı',
      'EsteVerify sektör standardı adayı',
      'Yaşlanma hızı modülü beta',
      'Series A hazırlığı',
    ]},
  ]
  return (
    <Section>
      <div className="max-w-6xl w-full">
        <SlideHeader kicker="13 · YOL HARİTASI"
          title="Sermayenin yön ve hızı."
          lead="Doğrulanmış akış: her milestone bir öncekinin kanıtı olmadan başlamaz." />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-10">
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
          title="Kurucu ekip."
          lead="Dr. İzzet Gök inşayı tek başına yürütüyor. Sermaye sonrası dört kritik pozisyon açılıyor." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
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
              KURUCU · CTO
            </div>
            <p className="text-sm font-light leading-relaxed" style={{ color: CREAM, opacity: 0.8 }}>
              Hekim olarak ürünün pazarına, CTO olarak ürünün koduna sahip. Strateji, mimari, ürün ve ilk satış tek elden yürütülüyor.
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm tracking-widest mb-6" style={{ color: GOLD_DEEP }}>
              YATIRIM SONRASI AÇILACAK POZİSYONLAR
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RoleCard title="VP Engineering"     note="Yığını ölçeklendirme; uzun vadeli vizyon Bilimsel Güzellik Simülatörü." />
              <RoleCard title="Klinik Network Lead" note="B2B satış. Birinci yıl 50 klinik, ikinci yıl 200." />
              <RoleCard title="Marketing & Brand"   note="Estelongy ana marka ve üç alt marka konumlandırması." />
              <RoleCard title="Akademi Director"    note="Eğitim ekosistemi, kurs üretimi ve sertifika programı." />
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
        <div className="text-sm tracking-[0.5em] mb-8" style={{ color: GOLD_DEEP }}>15 · YATIRIM TEKLİFİ</div>
        <h2 className="font-light leading-tight mb-12"
          style={{ fontSize: 'clamp(40px, 6vw, 80px)', color: CREAM, letterSpacing: '-0.02em' }}>
          Mimariyi <span style={{ color: GOLD }}>birlikte</span> inşa edelim.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <AskTile k="$2,5M"   v="Değerleme (post-money)" />
          <AskTile k="$500K"   v="Aranan tutar" big />
          <AskTile k="%20"     v="Dilution" />
          <AskTile k="18 ay"   v="Runway" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
          <WhyTile title="Neden şimdi"
            body="LLM yüz analizi, longevity ana akımı ve estetik turizm yoğunluğu — üç eğri ilk kez 2026&apos;da kesişiyor." />
          <WhyTile title="Neden biz"
            body="Hekim ve kurucu CTO tek kişide (Dr. İzzet Gök). Ürün sunum slaytında değil, sistemin içinde çalışıyor." highlight />
          <WhyTile title="Neden bu"
            body="Pazaryerinden başlayarak güzelliği ve longevity&apos;yi bilimsel olarak modelleyen platforma uzanan kategori." />
        </div>

        <div className="pt-8 border-t" style={{ borderColor: 'rgba(201,169,97,0.25)' }}>
          <p className="text-base font-light mb-2" style={{ color: CREAM, opacity: 0.7 }}>
            Sonraki adım: kırk beş dakikalık görüşme ve canlı ürün demosu.
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
      className="relative h-screen w-full flex items-center justify-center overflow-hidden"
    >
      <div
        className="relative flex items-center justify-center px-16 py-16"
        style={{
          width: '1280px',
          height: '720px',
          transform: 'scale(var(--deck-scale, 1))',
          transformOrigin: 'center center',
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </section>
  )
}

function SlideHeader({ kicker, title, lead }: { kicker: string; title: string; lead?: string }) {
  return (
    <div className="max-w-4xl">
      <div className="text-sm tracking-[0.4em] mb-3 font-light" style={{ color: GOLD_DEEP }}>
        {kicker}
      </div>
      <h2 className="font-light leading-tight mb-4"
        style={{ fontSize: 'clamp(28px, 3.4vw, 44px)', color: CREAM, letterSpacing: '-0.02em' }}>
        {title}
      </h2>
      {lead && (
        <p className="text-base md:text-lg font-light leading-relaxed max-w-3xl"
          style={{ color: CREAM, opacity: 0.78 }}>
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
      <div className="flex items-baseline gap-3 mb-4 flex-wrap">
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
    <div className="p-4 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,169,97,0.15)' }}>
      <div className="text-3xl font-light mb-1" style={{ color: GOLD }}>{big}</div>
      <div className="text-sm font-light leading-snug" style={{ color: CREAM, opacity: 0.75 }}>{small}</div>
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
    <svg viewBox="0 0 100 90" className="w-full h-36 md:h-44" style={{ overflow: 'visible' }}>
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
    <svg viewBox="0 0 400 240" className="w-full h-44 md:h-56">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={GOLD} />
        </marker>
      </defs>
      <FlywheelNode cx={80}  cy={120} title="Skor ölçümü" sub="BiyoAGE" />
      <FlywheelNode cx={200} cy={60}  title="Hekim değerlendirmesi" sub="EsteKlinik" />
      <FlywheelNode cx={320} cy={120} title="İşlem + ürün" sub="EsteKlinik / EsteStore" />
      <FlywheelNode cx={200} cy={200} title="Estelongy" sub="veri kuyusu" center />
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
      <circle cx={cx} cy={cy} r={center ? 28 : 24}
        fill={center ? GOLD : 'transparent'}
        stroke={center ? GOLD : GOLD_LIGHT} strokeWidth={center ? 0 : 1.5} />
      <text x={cx} y={cy - 1} textAnchor="middle" fontSize={center ? 9 : 7}
        fill={center ? BG : CREAM} fontWeight={center ? 700 : 500}>
        {title}
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="5"
        fill={center ? BG : CREAM} opacity={center ? 0.75 : 0.6}>
        {sub}
      </text>
    </g>
  )
}

function TrendCard({ tag, stat, yil, metin }:
  { tag: string; stat: string; yil: string; metin: string }) {
  return (
    <div className="p-5 rounded-2xl h-full flex flex-col"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,169,97,0.2)' }}>
      <div className="text-[11px] tracking-[0.3em] font-light mb-2" style={{ color: GOLD_DEEP }}>{tag}</div>
      <div className="text-xl md:text-2xl font-light leading-tight mb-1" style={{ color: GOLD }}>{stat}</div>
      <div className="text-xs font-mono mb-3" style={{ color: CREAM, opacity: 0.5 }}>{yil}</div>
      <p className="text-sm font-light leading-relaxed" style={{ color: CREAM, opacity: 0.78 }}>{metin}</p>
    </div>
  )
}

function PhoneFrame({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-32 h-56 md:w-36 md:h-64 rounded-[2rem] p-2"
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
  const dim = size === 'lg' ? 'h-36 w-36 md:h-44 md:w-44' : size === 'md' ? 'h-32 w-32 md:h-36 md:w-36' : 'h-28 w-28 md:h-32 md:w-32'
  const opacity = size === 'lg' ? 0.4 : size === 'md' ? 0.65 : 1
  return (
    <div className="flex flex-col items-center">
      <div className={`${dim} rounded-full flex flex-col items-center justify-center mb-4`}
        style={{
          background: `radial-gradient(circle, ${GOLD}${size === 'lg' ? '15' : size === 'md' ? '20' : '30'} 0%, transparent 70%)`,
          border: `1px solid ${GOLD}${size === 'lg' ? '30' : size === 'md' ? '50' : '99'}`,
          opacity,
        }}>
        <div className="text-sm tracking-[0.4em]" style={{ color: GOLD }}>{tier}</div>
        <div className="text-2xl md:text-3xl font-light my-2" style={{ color: CREAM }}>{amount}</div>
      </div>
      <p className="text-center text-sm font-light max-w-[220px]"
        style={{ color: CREAM, opacity: 0.75 }}>
        {label}
      </p>
    </div>
  )
}

function RevenueChart() {
  const maxTotal = Math.max(...TOTAL_BASE)
  const W = 800, H = 180, P = 30
  const barW = (W - 2 * P) / REVENUE_BASE.length * 0.55
  const gap = (W - 2 * P) / REVENUE_BASE.length

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 60}`} className="w-full" style={{ overflow: 'visible' }}>
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
        {REVENUE_BASE.map((row, i) => {
          const cx = P + gap * i + gap / 2
          const x = cx - barW / 2
          let yCursor = H - P
          const segments = [
            { val: row.komisyon,    renk: MUSLUK_RENK.komisyon },
            { val: row.marketplace, renk: MUSLUK_RENK.marketplace },
            { val: row.lead,        renk: MUSLUK_RENK.lead },
            { val: row.saas,        renk: MUSLUK_RENK.saas },
            { val: row.akademi,     renk: MUSLUK_RENK.akademi },
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
    <div className="p-5 rounded-2xl h-full flex flex-col"
      style={{
        background: highlight ? `linear-gradient(160deg, ${GOLD}22, transparent)` : 'rgba(255,255,255,0.02)',
        border: highlight ? `1px solid ${GOLD}` : light ? `1px solid ${GOLD}55` : '1px solid rgba(201,169,97,0.18)',
      }}>
      <div className="text-xs tracking-[0.4em] mb-1"
        style={{ color: highlight ? GOLD : GOLD_DEEP }}>
        {tag}
      </div>
      <div className="text-xs font-mono mb-3" style={{ color: GOLD }}>{yil}</div>
      <h3 className="text-xl font-light mb-1" style={{ color: CREAM }}>{baslik}</h3>
      <div className="text-xs italic mb-3" style={{ color: GOLD_LIGHT }}>{altyazi}</div>
      <p className="text-sm font-light leading-snug mt-auto" style={{ color: CREAM, opacity: 0.8 }}>
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
