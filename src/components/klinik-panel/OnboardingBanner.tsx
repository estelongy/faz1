'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { OnboardingStatus } from '@/lib/clinic-onboarding'

const DISMISS_KEY = 'estelongy_klinik_onboarding_celebrated'

interface Props {
  onboarding: OnboardingStatus
}

export default function OnboardingBanner({ onboarding }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [celebrated, setCelebrated] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Tamamlanma kutlandı mı? (sadece 1 kez göster)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISMISS_KEY)
      if (stored === '1') setCelebrated(true)
    } catch {}
    setHydrated(true)
  }, [])

  function markCelebrated() {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
    setCelebrated(true)
  }

  // Tamamlandıysa ve kutlandıysa hiç gösterme
  if (onboarding.isComplete && celebrated && hydrated) return null

  // Tamamlandı + ilk kez görüyor → kutlama mesajı
  if (onboarding.isComplete && hydrated && !celebrated) {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/5 border border-emerald-500/30 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="text-4xl shrink-0">🎉</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-emerald-300 font-bold text-lg">Hoşgeldin yolculuğu tamamlandı!</h3>
              <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                Tüm 4 adımı bitirdin. Artık <strong className="text-white">Faz 1 Doğrulanmış Hekim</strong> statüsündesin.
                Akreditasyon yolu kartından sonraki seviyelere ilerlemeye başlayabilirsin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={markCelebrated}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-colors"
          >
            Anladım
          </button>
        </div>
      </div>
    )
  }

  // Devam ediyor — ilerleme ve adımlar
  const progressPct = Math.round((onboarding.completedCount / onboarding.totalCount) * 100)

  return (
    <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-pink-500/5 border border-violet-500/20 overflow-hidden">

      {/* Üst kısım: özet + toggle */}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="w-full text-left p-4 sm:p-5 flex items-center gap-4 hover:bg-violet-500/5 transition-colors"
      >
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-white font-bold text-sm sm:text-base">
              Hoşgeldin Yolculuğu
            </h3>
            <span className="text-violet-300 text-xs font-semibold">
              {onboarding.completedCount}/{onboarding.totalCount} tamam · %{progressPct}
            </span>
          </div>
          {onboarding.nextStep && !expanded && (
            <p className="text-slate-400 text-xs mt-0.5 truncate">
              Sıradaki: {onboarding.nextStep.title}
            </p>
          )}
        </div>

        <svg
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* İlerleme barı */}
      <div className="px-4 sm:px-5">
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Adımlar — collapsed modda sadece sıradaki, expanded modda hepsi */}
      <div className={`overflow-hidden transition-[max-height] duration-300 ${expanded ? 'max-h-[1000px]' : 'max-h-32'}`}>
        <div className="p-4 sm:p-5 space-y-2">
          {(expanded ? onboarding.steps : onboarding.nextStep ? [onboarding.nextStep] : []).map(step => (
            <StepRow key={step.id} step={step} />
          ))}
        </div>
      </div>
    </div>
  )
}

function StepRow({ step }: { step: { id: string; number: number; title: string; description: string; reward: string; rewardEmoji: string; ctaLabel: string; ctaHref: string; completed: boolean } }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
      step.completed
        ? 'bg-emerald-500/5 border-emerald-500/20'
        : 'bg-slate-800/40 border-slate-700/60'
    }`}>
      {/* Sıra numarası / check */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
        step.completed
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'bg-slate-700/60 text-slate-400'
      }`}>
        {step.completed ? '✓' : step.number}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <p className={`text-sm font-semibold ${step.completed ? 'text-slate-300 line-through opacity-70' : 'text-white'}`}>
            {step.title}
          </p>
          {!step.completed && (
            <Link
              href={step.ctaHref}
              className="text-violet-300 hover:text-violet-200 text-xs font-bold transition-colors shrink-0"
            >
              {step.ctaLabel} →
            </Link>
          )}
        </div>
        <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{step.description}</p>
        <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${step.completed ? 'text-emerald-400/70' : 'text-amber-300/80'}`}>
          <span>{step.rewardEmoji}</span>
          <span className="font-medium">{step.reward}</span>
        </div>
      </div>
    </div>
  )
}
