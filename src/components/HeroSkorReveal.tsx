'use client'

import { useEffect, useState } from 'react'

/**
 * Hero görsel — iki telefon, before/after hikayesi:
 * Sol: "Ön Analiz" (skor 64, hekim onayı bekleniyor)
 * Sağ: "Klinik Onaylı" (skor 87, damgalı)
 *
 * Sayfa yüklenince her iki skor 0'dan hedefe count-up + sağ damga slide-in.
 * Tek seferlik reveal (loop yok — gözü yormaz, hâlâ canlı). CSS-only, video yok.
 */
export default function HeroSkorReveal() {
  const [scoreLeft, setScoreLeft] = useState(0)
  const [scoreRight, setScoreRight] = useState(0)
  const [stamped, setStamped] = useState(false)
  const [cycle, setCycle] = useState(0) // her 3sn artıp döngüyü yeniler

  useEffect(() => {
    const COUNT_DURATION = 1200  // 1.2sn count-up
    const STAMP_DELAY = 1400     // count bittiğinde damga
    const LOOP_INTERVAL = 3000   // 3sn'de bir yeniden başla

    // Cycle başlangıcında sıfırla
    setScoreLeft(0)
    setScoreRight(0)
    setStamped(false)

    let raf: number
    const startedAt = performance.now()

    function tick(now: number) {
      const elapsed = now - startedAt
      if (elapsed < COUNT_DURATION) {
        const t = elapsed / COUNT_DURATION
        const eased = 1 - Math.pow(1 - t, 3)
        setScoreLeft(Math.round(eased * 64))
        setScoreRight(Math.round(eased * 87))
        raf = requestAnimationFrame(tick)
      } else {
        setScoreLeft(64)
        setScoreRight(87)
      }
    }
    raf = requestAnimationFrame(tick)

    const stampTimer = setTimeout(() => setStamped(true), STAMP_DELAY)
    const loopTimer = setTimeout(() => setCycle(c => c + 1), LOOP_INTERVAL)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(stampTimer)
      clearTimeout(loopTimer)
    }
  }, [cycle])

  return (
    <div className="relative w-full max-w-[480px] mx-auto select-none" aria-hidden="true">
      {/* Glow halo */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-violet-600/30 via-purple-500/20 to-pink-500/10 blur-3xl rounded-full" />

      {/* İki telefon, açılı, overlap, sakin float */}
      <div className="relative h-[260px] sm:h-[300px] lg:h-[320px]">
        {/* SOL — Ön Analiz, skor 64 (sağa kaydırıldı, telefonlar bitişik) */}
        <div className="absolute left-1/2 -translate-x-[110%] top-6 -rotate-[10deg] origin-bottom-right scale-[0.82] sm:scale-90 hidden sm:block z-10">
          <div className="phone-float-a">
            <PhoneCard
              badge="ÖN ANALIZ"
              badgeColor="text-slate-300 bg-slate-700/60 border-slate-600"
              name="Aslı K."
              sub="Selfie ile ölçüldü"
              score={scoreLeft}
              zone={zoneFor(scoreLeft)}
              stamp={false}
              stampVisible={false}
              footnote="Hekim onayı bekleniyor"
            />
          </div>
        </div>

        {/* SAĞ — Klinik Onaylı, skor 87 (sola kaydırıldı, telefonlar bitişik) */}
        <div className="absolute left-1/2 -translate-x-[10%] top-0 sm:rotate-[6deg] origin-bottom-left z-20">
          <div className="phone-float-b">
            <PhoneCard
              badge="KLINIK ONAYLI"
              badgeColor="text-emerald-300 bg-emerald-500/15 border-emerald-500/40"
              name="Aslı K."
              sub="Hekim doğruladı"
              score={scoreRight}
              zone={zoneFor(scoreRight)}
              stamp={true}
              stampVisible={stamped}
              footnote="Estelongy Sertifikalı"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────

type Zone = { label: string; color: string; ring: string }

function zoneFor(score: number): Zone {
  if (score < 56)  return { label: 'Çok Düşük', color: 'text-red-400',     ring: 'stroke-red-400' }
  if (score < 66)  return { label: 'Düşük',     color: 'text-purple-400',  ring: 'stroke-purple-400' }
  if (score < 80)  return { label: 'Normal',    color: 'text-yellow-400',  ring: 'stroke-yellow-400' }
  if (score < 90)  return { label: 'İyi',       color: 'text-emerald-400', ring: 'stroke-emerald-400' }
  return            { label: 'Çok İyi',   color: 'text-blue-400',    ring: 'stroke-blue-400' }
}

function PhoneCard({
  badge, badgeColor, name, sub, score, zone, stamp, stampVisible, footnote,
}: {
  badge: string
  badgeColor: string
  name: string
  sub: string
  score: number
  zone: Zone
  stamp: boolean
  stampVisible: boolean
  footnote: string
}) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative w-[150px] bg-slate-950 border-[7px] border-slate-800 rounded-[1.75rem] shadow-2xl shadow-violet-900/40 aspect-[9/17.5]">
      {/* Notch */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-slate-900 rounded-full z-10" />

      {/* Ekran */}
      <div className="absolute inset-1.5 rounded-[1.4rem] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 overflow-hidden flex flex-col">
        {/* Üst durum */}
        <div className="flex items-center justify-between px-3 pt-5 pb-2 text-[8px]">
          <span className="text-slate-500 font-medium">Estelongy</span>
          <span className="text-slate-500">{stamp ? '✓' : '⋯'}</span>
        </div>

        {/* Badge */}
        <div className="px-3 pb-1.5">
          <span className={`inline-block px-1.5 py-0.5 rounded-md border text-[7px] font-black tracking-widest ${badgeColor}`}>
            {badge}
          </span>
        </div>

        {/* Profil */}
        <div className="px-3 pb-1">
          <p className="text-white text-[10px] font-bold leading-tight">{name}</p>
          <p className="text-slate-500 text-[8px]">{sub}</p>
        </div>

        {/* Skor halkası */}
        <div className="flex-1 flex items-center justify-center relative">
          <svg viewBox="0 0 120 120" className="w-28 h-28">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="rgb(30,41,59)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={`${zone.ring} transition-[stroke-dashoffset] duration-100 ease-out`}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-black ${zone.color} tabular-nums leading-none`}>
              {score}
            </span>
            <span className="text-[7px] uppercase tracking-widest text-slate-500 mt-0.5">
              Gençlik Skoru
            </span>
            <span className={`text-[8px] font-bold mt-0.5 ${zone.color}`}>
              {zone.label}
            </span>
          </div>
        </div>

        {/* Alt — damga veya footnote */}
        <div className="relative h-12 flex items-center justify-center px-2">
          {stamp ? (
            <div
              className={`transition-all duration-500 ${
                stampVisible ? 'opacity-100 scale-100 -rotate-6' : 'opacity-0 scale-150 rotate-12'
              }`}
            >
              <div className="px-2 py-1 rounded-md border-2 border-emerald-400 bg-emerald-500/10 backdrop-blur-sm">
                <p className="text-[7px] font-black uppercase tracking-widest text-emerald-300 text-center">
                  ✓ Klinik Onaylı
                </p>
                <p className="text-[6px] text-emerald-400/70 text-center mt-0.5">
                  {footnote}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[7px] text-slate-600 italic text-center">
              {footnote}…
            </p>
          )}
        </div>

        <div className="h-2" />
      </div>
    </div>
  )
}
