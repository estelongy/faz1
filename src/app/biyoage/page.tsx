import type { Metadata } from 'next'
import Link from 'next/link'
import SafeLink from '@/components/SafeLink'
import { Camera, Activity, BookOpen, LayoutDashboard, ArrowRight } from 'lucide-react'
import Footer from '@/components/Footer'
import BiyoAGENav from './BiyoAGENav'
import GalaxyVisitBeacon from '@/components/GalaxyVisitBeacon'
import AppHome from '@/components/native/AppHome'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://estelongy.com'

export const metadata: Metadata = {
  title: 'BiyoAGE — Biyolojik Yaşını Öğren',
  description:
    'BiyoAGE, Estelongy ekosisteminin ölçüm galaksisi. Selfie ile ön analiz, klinik onaylı gençlik skoru ve longevity yolculuğu — tek çatı altında.',
  alternates: { canonical: '/biyoage' },
  openGraph: {
    title: 'BiyoAGE — Biyolojik Yaşını Öğren',
    description: 'Estelongy ölçüm galaksisi: ön analiz, gençlik skoru, longevity rehberi.',
    url: `${SITE_URL}/biyoage`,
    type: 'website',
  },
}

const DOORS = [
  {
    href: '/analiz',
    eyebrow: 'Ölç',
    title: 'Ön Analiz',
    desc: 'Selfie ile saniyeler içinde gençlik skoru tahmini. Ücretsiz, kayıt gerekmez.',
    icon: Camera,
    accent: 'from-[#9F8CE0]/30 to-[#9F8CE0]/5',
    border: 'border-[#9F8CE0]/40',
    glow: '#9F8CE0',
  },
  {
    href: '/skor',
    eyebrow: 'Yorumla',
    title: 'Klinik Onaylı Skor',
    desc: 'Hekim değerlendirmesiyle doğrulanmış, paylaşılabilir gençlik skoru sertifikan.',
    icon: Activity,
    accent: 'from-[#B7A6E8]/30 to-[#B7A6E8]/5',
    border: 'border-[#B7A6E8]/40',
    glow: '#B7A6E8',
  },
  {
    href: '/rehber',
    eyebrow: 'Anla',
    title: 'Longevity Rehberi',
    desc: 'Biyolojik yaşlanmayı yavaşlatan bilimsel kaynaklar, protokoller, makaleler.',
    icon: BookOpen,
    accent: 'from-[#7E6BC9]/30 to-[#7E6BC9]/5',
    border: 'border-[#7E6BC9]/40',
    glow: '#7E6BC9',
  },
  {
    href: '/panel',
    eyebrow: 'Sürdür',
    title: 'Panelim',
    desc: 'Skor takibi, randevu geçmişi, longevity yolculuğun — hepsi tek panelde.',
    icon: LayoutDashboard,
    accent: 'from-[#6553A8]/30 to-[#6553A8]/5',
    border: 'border-[#6553A8]/40',
    glow: '#6553A8',
  },
]

export default async function BiyoAGEPage() {
  // Not: SafeLink auth-gate'leri otomatik yapıyor; sayfa içinde isLoggedIn'e ihtiyaç kalmadı.
  return (
    <>
      <GalaxyVisitBeacon galaxy="biyoage" />

      {/* App içinde: skor-önce mobil ev. Web'de null render eder. */}
      <AppHome />

      {/* Web pazarlama landing'i — app içinde `web-only` ile gizlenir. */}
      <div className="web-only">
      <BiyoAGENav />

      <main className="min-h-screen bg-white">
        {/* ============================================================
            HERO — mor sahne girişi, sayfanın aşağısı beyaz
            ============================================================ */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#1B1330] via-[#241942] to-[#1B1330]">
          {/* DNA helix dokusu — radial blur */}
          <div
            aria-hidden
            className="absolute -top-40 -right-32 w-[480px] h-[480px] rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, #9F8CE0 0%, transparent 70%)' }}
          />
          <div
            aria-hidden
            className="absolute -bottom-48 -left-40 w-[520px] h-[520px] rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #C9BBF5 0%, transparent 70%)' }}
          />
          {/* DNA helix SVG — sade, dekoratif */}
          <svg
            aria-hidden
            className="absolute right-6 top-12 opacity-[0.07] hidden lg:block"
            width="320"
            height="420"
            viewBox="0 0 200 260"
            fill="none"
          >
            <path d="M40 0 Q100 65 160 130 Q100 195 40 260" stroke="#C9BBF5" strokeWidth="1.2" />
            <path d="M160 0 Q100 65 40 130 Q100 195 160 260" stroke="#C9BBF5" strokeWidth="1.2" />
            {Array.from({ length: 13 }).map((_, i) => {
              const y = (i + 0.5) * 20
              return <line key={i} x1="55" x2="145" y1={y} y2={y} stroke="#C9BBF5" strokeWidth="0.6" />
            })}
          </svg>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-12 sm:pt-20 sm:pb-16">
            {/* Eyebrow — 14px bold (kural: min 14, bold) */}
            <p className="text-sm font-bold uppercase tracking-[0.32em] text-[#C9BBF5] mb-3">
              BiyoAGE · Ölçüm Galaksisi
            </p>
            {/* Display H1 — 36/48px */}
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.05] max-w-2xl">
              Biyolojik Yaşını <span className="text-[#C9BBF5]">Öğren.</span>
            </h1>
            {/* Body lead — 16/18px */}
            <p className="text-violet-100 text-base sm:text-lg mt-4 max-w-xl leading-relaxed">
              Selfie ile ön analiz · hekim onaylı gençlik skoru · longevity yolculuğu.
              Veri konuşur, yaşlanma hızını yavaşlat.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-7">
              {/* Button — 16px semibold (kural: tıklanma min 16) */}
              <Link
                href="/analiz"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#9F8CE0] hover:bg-[#8B76D4] text-[#1B1330] font-bold text-base transition-colors shadow-lg shadow-[#9F8CE0]/30"
              >
                Ön Analizi Başlat
                <ArrowRight size={16} />
              </Link>
              <Link
                href="#nasil-isler"
                scroll={true}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-violet-300/40 text-white hover:bg-white/10 text-base font-semibold transition-colors"
              >
                Skorlama Nasıl İşler?
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================
            4 KAPI — ölç / yorumla / anla / sürdür  (beyaz zemin, mor aksent)
            ============================================================ */}
        <section id="nasil-isler" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 scroll-mt-20">
          {/* Eyebrow — 14px bold */}
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#7C3AED] mb-5">
            BiyoAGE 4 perde · Skorlama Nasıl İşler?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DOORS.map(d => {
              const Icon = d.icon
              // SafeLink auth-gate'i otomatik yapar; isLoggedIn bilgisine ihtiyaç yok.
              return (
                <SafeLink
                  key={d.href}
                  href={d.href}
                  className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-[#7C3AED]/60 hover:shadow-lg hover:shadow-[#7C3AED]/10 transition-all p-6 sm:p-7"
                >
                  <div
                    className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-25 transition-opacity"
                    style={{ background: d.glow }}
                  />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md"
                        style={{ background: d.glow, boxShadow: `0 4px 14px ${d.glow}50` }}
                      >
                        <Icon size={20} />
                      </div>
                      {/* Kart eyebrow — 14px bold */}
                      <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-600">
                        {d.eyebrow}
                      </p>
                    </div>
                    {/* H3 — 18px */}
                    <h3 className="text-slate-900 font-bold text-lg mb-1.5">{d.title}</h3>
                    {/* Body — 16px */}
                    <p className="text-slate-700 text-base leading-relaxed">{d.desc}</p>
                    {/* Link — 16px semibold (tıklanabilir) */}
                    <div className="flex items-center gap-1.5 text-[#7C3AED] text-base font-semibold mt-4 group-hover:gap-2.5 transition-all">
                      <span>Gir</span>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </SafeLink>
              )
            })}
          </div>
        </section>

        {/* ============================================================
            Felsefe — krem-yeşil tint, galaksi bağlantıları renkli
            ============================================================ */}
        <section className="border-t border-slate-200 bg-gradient-to-b from-[#F0FDF4] via-white to-[#FAFAF7]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-16 text-center">
            {/* Eyebrow — 14px bold */}
            <p className="text-sm font-bold uppercase tracking-[0.32em] text-[#7C3AED] mb-3">
              Estelongy ölçüm felsefesi
            </p>
            {/* H1 section başlığı — 24/30px */}
            <h2 className="text-slate-900 font-bold text-2xl sm:text-3xl mb-4">
              Ölçemediğini iyileştiremezsin.
            </h2>
            {/* Body — 16px */}
            <p className="text-slate-700 text-base leading-relaxed">
              BiyoAGE, biyolojik yaşlanmanı ölçülebilir kılar. Skor bir hedef değil, bir başlangıç çizgisi.
              Aksiyon <span className="text-[#10876B] font-semibold">EsteKlinik</span>&apos;te,
              süreklilik <span className="text-[#8B7339] font-semibold">EsteStore</span>&apos;da —
              ama hepsi bu rakamla başlar.
            </p>
          </div>
        </section>
      </main>

      <Footer />
      </div>
    </>
  )
}
