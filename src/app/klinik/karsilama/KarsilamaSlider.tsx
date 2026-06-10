'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Stethoscope, ShieldCheck, BarChart3 } from 'lucide-react'

interface Slide {
  Icon: typeof Stethoscope
  title: string
  body: string
}

const SLIDES: Slide[] = [
  {
    Icon: Stethoscope,
    title: 'EsteKlinik PRO nedir?',
    body: 'Klinik operasyonunu cebe taşıyan panel. Randevu, hasta dosyası, mesaj, kredi — hareket halinde de yönet.',
  },
  {
    Icon: ShieldCheck,
    title: 'Hekim Dostu Model',
    body: '"Genç görünmek değil, sağlıklı görünmek." Estelongy yorum platformu değil, ölçüm platformudur. Skor değişimi · NPS · doğru endikasyon — algoritmik EGP rozeti yolda.',
  },
  {
    Icon: BarChart3,
    title: 'Performans skoruyla büyü',
    body: 'Sonuç etkinliği · hasta tavsiyesi · operasyonel kalite — ölçülen klinik vitrinde öne çıkar. ELS sertifika kademeleri (Bronze → Platinum).',
  },
]

// Play Store linkleri yayına çıkana kadar consumer app'lerin web galaksilerine
// yönlendir — klinik kullanıcısı doğru galaksiyi tarayıcıda görür. Play Store
// yayını başlayınca href'leri play.google.com'a güncelle.
const ALT_APPS = [
  { name: 'BiyoAGE',    tag: 'Görünüm yaşını hemen öğren',           href: 'https://biyoage.com' },
  { name: 'EsteStore',  tag: 'Sana özel ürünü al',                   href: 'https://estelongy.com/estestore' },
  { name: 'EsteKlinik', tag: 'Bilimi güzelliğe dönüştüren uzmanı bul', href: 'https://esteklinik.com' },
]

function setOnboardCookie() {
  document.cookie = `eg_onboard_seen=1; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
}

export default function KarsilamaSlider() {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [idx, setIdx] = useState(0)

  // Geri tuşu/çıkış: global AppBackHandler (root layout) yönetir.
  // /klinik/karsilama root path olarak işaretli — çıkış onay modal'ı açar.

  function onScroll() {
    const el = trackRef.current
    if (!el) return
    const newIdx = Math.round(el.scrollLeft / el.clientWidth)
    if (newIdx !== idx) setIdx(newIdx)
  }

  function jumpTo(i: number) {
    const el = trackRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div
      className="min-h-screen bg-slate-950 text-white flex flex-col"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
      }}
    >
      {/* Marka rozeti — PRO vurgusu */}
      <header className="px-5 pt-4 pb-2 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.22em] font-bold flex items-baseline gap-1">
          <span className="text-slate-400">EsteKlinik</span>
          <span className="text-emerald-400 text-sm tracking-[0.3em]">PRO</span>
        </p>
        <button
          onClick={() => jumpTo(SLIDES.length - 1)}
          className="text-xs text-slate-500 active:text-slate-300"
        >
          Geç
        </button>
      </header>

      {/* Yatay swipe slaytlar */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {SLIDES.map((s, i) => (
          <section
            key={i}
            className="shrink-0 w-full snap-center flex flex-col items-center justify-center px-8 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mb-6">
              <s.Icon size={36} className="text-emerald-300" />
            </div>
            <h2 className="text-2xl font-black leading-tight mb-3">{s.title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">{s.body}</p>
          </section>
        ))}
      </div>

      {/* Nokta göstergesi */}
      <div className="flex items-center justify-center gap-2 py-4">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => jumpTo(i)}
            aria-label={`Slayt ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? 'w-8 bg-emerald-400' : 'w-1.5 bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* 2 CTA */}
      <div className="px-5 space-y-2.5">
        <Link
          href="/giris?g=esteklinik&next=/klinik/panel"
          onClick={setOnboardCookie}
          className="block w-full text-center py-3.5 rounded-2xl bg-emerald-400 text-slate-950 font-bold active:bg-emerald-500 transition"
        >
          Giriş yap
        </Link>
        <Link
          href="/esteklinik/basvur"
          onClick={setOnboardCookie}
          className="block w-full text-center py-3.5 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 text-emerald-300 font-semibold active:bg-emerald-500/20 transition"
        >
          Klinik başvurusu
        </Link>
      </div>

      {/* Alt secondary — diğer Estelongy app'leri */}
      <div className="mt-6 px-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600 text-center mb-2.5">
          Estelongy ekosistemi
        </p>
        <div className="grid grid-cols-3 gap-2">
          {ALT_APPS.map(a => (
            <a
              key={a.name}
              href={a.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center px-2 py-2.5 rounded-xl border border-slate-800 bg-slate-900/40 active:bg-slate-900 transition"
            >
              <p className="text-xs font-bold text-slate-300">{a.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{a.tag}</p>
            </a>
          ))}
        </div>
      </div>

    </div>
  )
}
