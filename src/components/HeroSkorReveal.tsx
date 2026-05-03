'use client'

import { useEffect, useState } from 'react'

/**
 * Hero'da gösterilen "demo skor kartı" — telefon mockup içinde 0'dan 87'ye
 * animate eden skor + "Klinik Onaylı" damgası. 8 saniyede bir loop.
 *
 * Video değil, CSS + state — LCP'yi öldürmez, hafiftir (~kb).
 */
export default function HeroSkorReveal() {
  const [score, setScore] = useState(0)
  const [stamped, setStamped] = useState(false)
  const [pulseKey, setPulseKey] = useState(0) // tetikleme

  useEffect(() => {
    const TARGET = 87
    const COUNT_DURATION = 1600 // ms
    const STAMP_DELAY = 1900    // counter bittikten kısa süre sonra
    const HOLD = 5500           // damga sonrası bekle
    const FADE = 600            // sıfırlama yumuşaması

    let raf: number
    const startedAt = performance.now()

    function tick(now: number) {
      const elapsed = now - startedAt
      if (elapsed < COUNT_DURATION) {
        // easeOutCubic
        const t = elapsed / COUNT_DURATION
        const eased = 1 - Math.pow(1 - t, 3)
        setScore(Math.round(eased * TARGET))
        raf = requestAnimationFrame(tick)
      } else {
        setScore(TARGET)
      }
    }
    raf = requestAnimationFrame(tick)

    const stampTimer = setTimeout(() => setStamped(true), STAMP_DELAY)
    const resetTimer = setTimeout(() => {
      setStamped(false)
      setScore(0)
      // bir sonraki turu yeniden tetikle
      setTimeout(() => setPulseKey(k => k + 1), FADE)
    }, STAMP_DELAY + HOLD)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(stampTimer)
      clearTimeout(resetTimer)
    }
  }, [pulseKey])

  // Skor zonu rengi — tasarım sistemiyle uyumlu (memory: 80-89 = İyi/emerald)
  const zone = score < 56 ? { label: 'Çok Düşük', color: 'text-red-400', ring: 'stroke-red-400' }
             : score < 66 ? { label: 'Düşük',     color: 'text-purple-400', ring: 'stroke-purple-400' }
             : score < 80 ? { label: 'Normal',    color: 'text-yellow-400', ring: 'stroke-yellow-400' }
             : score < 90 ? { label: 'İyi',       color: 'text-emerald-400', ring: 'stroke-emerald-400' }
             :              { label: 'Çok İyi',   color: 'text-blue-400',    ring: 'stroke-blue-400' }

  // Daire progress (0-100)
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative w-full max-w-[300px] mx-auto select-none" aria-hidden="true">
      {/* Glow halo */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-violet-600/30 via-purple-500/20 to-pink-500/10 blur-3xl rounded-[3rem]" />

      {/* Telefon çerçevesi */}
      <div className="relative bg-slate-950 border-[10px] border-slate-800 rounded-[2.5rem] shadow-2xl shadow-violet-900/40 aspect-[9/19]">
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-full z-10" />

        {/* Ekran içeriği */}
        <div className="absolute inset-2 rounded-[1.75rem] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 overflow-hidden flex flex-col">
          {/* Üst bar */}
          <div className="flex items-center justify-between px-4 pt-7 pb-3 text-[10px]">
            <span className="text-slate-500 font-medium">Estelongy</span>
            <div className="flex items-center gap-1 text-slate-500">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              <span>Canlı</span>
            </div>
          </div>

          {/* Demo profil */}
          <div className="px-4 pb-2">
            <p className="text-white text-[11px] font-bold">Aslı K.</p>
            <p className="text-slate-500 text-[9px]">34, İstanbul</p>
          </div>

          {/* Skor halkası */}
          <div className="flex-1 flex items-center justify-center relative">
            <svg viewBox="0 0 160 160" className="w-44 h-44">
              {/* Arka halka */}
              <circle cx="80" cy="80" r={radius} fill="none" stroke="rgb(30,41,59)" strokeWidth="10" />
              {/* İlerleme halkası */}
              <circle
                cx="80" cy="80" r={radius}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                className={`${zone.ring} transition-[stroke-dashoffset] duration-100 ease-out`}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 80 80)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-black ${zone.color} tabular-nums leading-none`}>
                {score}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-500 mt-1">
                Gençlik Skoru
              </span>
              <span className={`text-[10px] font-bold mt-1 ${zone.color}`}>
                {zone.label}
              </span>
            </div>
          </div>

          {/* Klinik onayı damgası */}
          <div className="relative h-20 flex items-center justify-center">
            <div
              className={`absolute transition-all duration-500 ${
                stamped ? 'opacity-100 scale-100 -rotate-6' : 'opacity-0 scale-150 rotate-12'
              }`}
            >
              <div className="px-3 py-1.5 rounded-lg border-2 border-emerald-400 bg-emerald-500/10 backdrop-blur-sm">
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-300">
                  ✓ Klinik Onaylı
                </p>
                <p className="text-[8px] text-emerald-400/70 text-center mt-0.5">
                  Estelongy Sertifikalı
                </p>
              </div>
            </div>
            {!stamped && (
              <p className="text-[9px] text-slate-600 italic">Hekim doğrulaması bekleniyor…</p>
            )}
          </div>

          {/* Alt boşluk */}
          <div className="h-3" />
        </div>
      </div>
    </div>
  )
}
