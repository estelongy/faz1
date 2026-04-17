'use client'

import { useEffect, useState, useRef } from 'react'

export type EGSPhase =
  | 'ai_analiz'
  | 'longevity_anketi'
  | 'randevu'
  | 'klinik_kabul'
  | 'klinik_anketi'
  | 'ileri_ai'
  | 'tetkik'
  | 'hekim_degerlendirme'
  | 'klinik_onayli'

interface EGSScoreBarProps {
  score: number
  previousScore?: number
  phase: EGSPhase
  age?: number          // hastanın gerçek yaşı — "X yaş genç görünüyorsunuz" için
  isClinicView?: boolean // klinik/hekim ekranı için farklı mesajlar
  animated?: boolean
}

const ZONES = [
  { label: 'Kritik', range: '0–49', min: 0, max: 49, color: '#ef4444', bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/40', glow: 'shadow-red-500/30' },
  { label: 'Gelişmeli', range: '50–74', min: 50, max: 74, color: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/40', glow: 'shadow-amber-500/30' },
  { label: 'İyi', range: '75–89', min: 75, max: 89, color: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/40', glow: 'shadow-emerald-500/30' },
  { label: 'Mükemmel', range: '90–100', min: 90, max: 100, color: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/40', glow: 'shadow-blue-500/30' },
]

const PHASES: { key: EGSPhase; label: string; short: string }[] = [
  { key: 'ai_analiz', label: 'AI Ön Analiz', short: 'AI' },
  { key: 'longevity_anketi', label: 'Anket', short: 'Anket' },
  { key: 'randevu', label: 'Randevu', short: 'Randevu' },
  { key: 'klinik_kabul', label: 'Klinik Kabul', short: 'Kabul' },
  { key: 'klinik_anketi', label: 'Klinik Anketi', short: 'Klinik' },
  { key: 'ileri_ai', label: 'İleri AI', short: 'İleri AI' },
  { key: 'tetkik', label: 'Tetkik', short: 'Tetkik' },
  { key: 'hekim_degerlendirme', label: 'Hekim', short: 'Hekim' },
  { key: 'klinik_onayli', label: 'Onaylı EGS', short: 'Onaylı' },
]

function getZone(score: number) {
  return ZONES.find(z => score >= z.min && score <= z.max) ?? ZONES[0]
}

function getAgeMessage(score: number, age?: number): string {
  if (!age) {
    if (score >= 90) return 'Olağanüstü bir gençlik skoruna sahipsiniz!'
    if (score >= 75) return 'Yaşınızdan genç görünüyorsunuz.'
    if (score >= 50) return 'Yaşınıza göre normal aralıkta.'
    return 'Uzman desteğiyle skorunuzu yükseltebilirsiniz.'
  }
  // C250 yaklaşımı: her 10 puan ≈ 5 yaş farkı (MVP için basit formül)
  const estimatedAge = Math.round(age * (1 - (score - 50) / 200))
  const diff = age - estimatedAge
  if (diff >= 10) return `Yaşınızdan ${diff} yaş genç görünüyorsunuz! 🎉`
  if (diff >= 5) return `Yaşınızdan ${diff} yaş genç görünüyorsunuz.`
  if (diff >= 1) return `Yaşınızdan ${diff} yaş genç görünüyorsunuz.`
  if (diff === 0) return 'Yaşınıza tam uygun görünüyorsunuz.'
  return `Cilt yaşlanma belirtileri mevcut.`
}

function getClinicMessage(score: number, previousScore?: number): string {
  if (previousScore !== undefined) {
    const diff = score - previousScore
    if (diff > 0) return `Hasta ${diff} puan kazandı — harika bir sonuç!`
    if (diff === 0) return 'Skor stabil kaldı.'
    return `Skor ${Math.abs(diff)} puan düzeltildi.`
  }
  if (score >= 90) return 'İşlem yapmaya ihtiyacı yok — koruma protokolü öner.'
  if (score >= 75) return 'Hafif bakım programı yeterli.'
  if (score >= 50) return 'Tedavi planı için uygun profil.'
  return 'Kapsamlı tedavi protokolü gerekiyor.'
}

function getPhaseIndex(phase: EGSPhase): number {
  return PHASES.findIndex(p => p.key === phase)
}

export default function EGSScoreBar({
  score,
  previousScore,
  phase,
  age,
  isClinicView = false,
  animated = true,
}: EGSScoreBarProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score)
  const [barWidth, setBarWidth] = useState(animated ? 0 : score)
  const [showDelta, setShowDelta] = useState(false)
  const prevScoreRef = useRef(score)
  const zone = getZone(score)
  const phaseIndex = getPhaseIndex(phase)

  // Skor sayacı animasyonu
  useEffect(() => {
    if (!animated) {
      setDisplayScore(score)
      setBarWidth(score)
      return
    }

    const start = prevScoreRef.current === score ? 0 : prevScoreRef.current
    const end = score
    const duration = 1200
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (end - start) * eased)
      setDisplayScore(current)
      setBarWidth(current)
      if (progress < 1) requestAnimationFrame(tick)
      else {
        prevScoreRef.current = end
        if (previousScore !== undefined && previousScore !== score) {
          setShowDelta(true)
          setTimeout(() => setShowDelta(false), 3000)
        }
      }
    }
    requestAnimationFrame(tick)
  }, [score, animated, previousScore])

  const delta = previousScore !== undefined ? score - previousScore : null
  const isLastPhase = phase === 'klinik_onayli'

  return (
    <div className="w-full select-none">
      {/* Üst kısım: skor + etiket */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">
            {isLastPhase ? 'KLİNİK ONAYLI EGS' : 'EGS Gençlik Skoru'}
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-6xl font-black tabular-nums transition-colors duration-700 ${zone.text}`}
              style={{ textShadow: `0 0 40px ${zone.color}60` }}
            >
              {displayScore}
            </span>
            <span className="text-slate-600 text-xl font-light">/100</span>

            {/* Delta göstergesi */}
            {showDelta && delta !== null && delta !== 0 && (
              <span
                className={`text-lg font-bold animate-bounce ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {delta > 0 ? `+${delta}` : delta}
              </span>
            )}
          </div>
        </div>

        {/* Zone etiketi */}
        <div
          className={`px-3 py-1.5 rounded-full border text-xs font-bold ${zone.text} ${zone.border} bg-slate-900/50`}
          style={{ boxShadow: `0 0 20px ${zone.color}25` }}
        >
          {zone.label}
        </div>
      </div>

      {/* Ana bar */}
      <div className="relative h-5 rounded-full overflow-hidden mb-1.5 bg-slate-800">
        {/* Gradient zemin (tüm zonlar) */}
        <div
          className="absolute inset-0 rounded-full opacity-20"
          style={{
            background: 'linear-gradient(to right, #ef4444 0%, #ef4444 25%, #f59e0b 25%, #f59e0b 50%, #10b981 50%, #10b981 75%, #3b82f6 75%, #3b82f6 100%)'
          }}
        />
        {/* Aktif dolgu */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-none"
          style={{
            width: `${barWidth}%`,
            background: `linear-gradient(to right, #ef4444, ${
              barWidth > 75 ? '#3b82f6' : barWidth > 50 ? '#10b981' : '#f59e0b'
            })`,
            boxShadow: `0 0 12px ${zone.color}80`,
            transition: 'width 0.05s linear',
          }}
        />
        {/* Bölge çizgileri */}
        {[50, 75, 90].map(mark => (
          <div
            key={mark}
            className="absolute inset-y-0 w-px bg-slate-900/60"
            style={{ left: `${mark}%` }}
          />
        ))}
        {/* İbre */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white bg-slate-900 transition-none"
          style={{
            left: `${barWidth}%`,
            boxShadow: `0 0 8px ${zone.color}`,
            transition: 'left 0.05s linear',
          }}
        />
      </div>

      {/* Zone etiketleri */}
      <div className="grid grid-cols-4 text-center mb-5">
        {ZONES.map(z => (
          <div key={z.label} className="flex flex-col items-center gap-0.5">
            <span className={`text-[10px] font-semibold ${score >= z.min && score <= z.max ? z.text : 'text-slate-600'}`}>
              {z.label}
            </span>
            <span className="text-[9px] text-slate-700">{z.range}</span>
          </div>
        ))}
      </div>

      {/* Mesaj kutusu */}
      <div
        className={`p-3.5 rounded-xl border mb-5 ${zone.border}`}
        style={{ background: `${zone.color}0d` }}
      >
        <p className={`text-sm font-medium ${zone.text}`}>
          {isClinicView
            ? getClinicMessage(score, previousScore)
            : getAgeMessage(score, age)}
        </p>
        {isLastPhase && (
          <p className="text-xs text-slate-500 mt-1">
            ✓ Hekim tarafından doğrulandı
          </p>
        )}
      </div>

      {/* Aşama yolculuğu */}
      <div className="relative">
        <div className="flex items-center gap-0">
          {PHASES.map((p, i) => {
            const isDone = i < phaseIndex
            const isCurrent = i === phaseIndex
            const isUpcoming = i > phaseIndex
            const isLast = i === PHASES.length - 1

            return (
              <div key={p.key} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isDone
                        ? 'bg-emerald-500'
                        : isCurrent
                        ? `${zone.bg} shadow-lg`
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                    style={isCurrent ? { boxShadow: `0 0 12px ${zone.color}60` } : undefined}
                  >
                    {isDone ? (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isCurrent ? (
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-medium text-center leading-tight max-w-[40px] ${
                      isDone ? 'text-emerald-400' : isCurrent ? zone.text : 'text-slate-700'
                    } ${isUpcoming ? 'opacity-50' : ''}`}
                  >
                    {p.short}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={`h-px flex-1 mx-0.5 transition-all duration-500 ${
                      isDone ? 'bg-emerald-500/50' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
