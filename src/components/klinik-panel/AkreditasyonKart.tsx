'use client'

import { useEffect, useState } from 'react'
import type { Accreditation } from '@/lib/clinic-accreditation'

interface Props {
  accreditation: Accreditation
}

export default function AkreditasyonKart({ accreditation }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full text-left group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 hover:border-violet-500/50 hover:from-violet-500/10 hover:to-purple-500/10 transition-all p-5"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white font-bold">Akreditasyon Yolu</h3>
            <p className={`${accreditation.phaseColor} text-sm mt-0.5 font-semibold`}>
              {accreditation.phase === 0 ? '' : `Faz ${accreditation.phase} — `}{accreditation.phaseLabel}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2l2.5 5.5L18 8l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L10 2z"/>
            </svg>
          </div>
        </div>

        {accreditation.nextPhaseLabel ? (
          <>
            {/* İlerleme barı */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-400">{accreditation.nextPhaseLabel}&apos;e ilerleme</span>
                <span className="text-violet-300 font-bold">%{accreditation.progressPct}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all"
                  style={{ width: `${accreditation.progressPct}%` }}
                />
              </div>
            </div>

            {/* Kriter listesi — kompakt */}
            <div className="space-y-1.5 text-sm">
              {accreditation.criteria.slice(0, 3).map(c => (
                <div key={c.id} className={`flex items-center gap-2 ${c.completed ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.completed ? 'bg-emerald-400' : 'bg-slate-700'}`}></span>
                  <span className="truncate">
                    {c.label}
                    {!c.completed && typeof c.current === 'number' && typeof c.target === 'number' && (
                      <span className="text-slate-600 ml-1.5">{c.current}/{c.target}</span>
                    )}
                  </span>
                  {c.completed && <span className="text-emerald-400 ml-auto">✓</span>}
                </div>
              ))}
            </div>
          </>
        ) : (
          // Faz 3 — en üst kademe
          <div className="py-3">
            <div className="flex items-center gap-2 text-amber-300 mb-2">
              <span className="text-2xl">🏆</span>
              <span className="font-bold text-sm">En Üst Kademe</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Estelongy Uzmanı statüsündesin. Tüm avantajların açık.
            </p>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-sm">
          <span className="text-slate-500">Detayları gör</span>
          <span className="text-violet-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">→</span>
        </div>
      </button>

      {/* Expand-modal */}
      {open && <AkreditasyonModal accreditation={accreditation} onClose={() => setOpen(false)} />}
    </>
  )
}

// ───────────────────────────────────────────────────────────────────
// Modal — faz detayı, tüm kriterler, ödüller
// ───────────────────────────────────────────────────────────────────

function AkreditasyonModal({ accreditation, onClose }: { accreditation: Accreditation; onClose: () => void }) {
  // ESC ile kapat
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2l2.5 5.5L18 8l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L10 2z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold">Akreditasyon Yolu</h2>
              <p className={`${accreditation.phaseColor} text-sm font-semibold`}>
                {accreditation.phase === 0 ? '' : `Faz ${accreditation.phase} — `}{accreditation.phaseLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Kapat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* İçerik */}
        <div className="p-6 space-y-6">

          {/* Mevcut faz ödülleri */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">
              {accreditation.phase === 0 ? 'Şu An' : 'Mevcut Avantajların'}
            </h3>
            <div className="space-y-2">
              {accreditation.rewards.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                  <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                  <span className="text-slate-200 text-sm">{r}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Sonraki faz hedefi */}
          {accreditation.nextPhaseLabel && (
            <>
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                    Sıradaki: {accreditation.nextPhaseLabel}
                  </h3>
                  <span className="text-violet-300 font-bold text-sm">%{accreditation.progressPct}</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${accreditation.progressPct}%` }}
                  />
                </div>
              </section>

              {/* Kriterler */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">
                  Yapılacaklar
                </h3>
                <div className="space-y-2">
                  {accreditation.criteria.map(c => (
                    <div
                      key={c.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border ${
                        c.completed
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-slate-800/50 border-slate-700'
                      }`}
                    >
                      <span className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                        c.completed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700/50 text-slate-500'
                      }`}>
                        {c.completed ? '✓' : '·'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className={`text-sm font-medium ${c.completed ? 'text-slate-300' : 'text-white'}`}>
                            {c.label}
                          </p>
                          <span className={`text-sm font-bold shrink-0 ${
                            c.completed ? 'text-emerald-400' : 'text-slate-400'
                          }`}>
                            {c.current}{typeof c.target === 'number' ? ` / ${c.target}` : ''}
                          </span>
                        </div>
                        {c.hint && !c.completed && (
                          <p className="text-slate-500 text-sm mt-1 leading-relaxed">{c.hint}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Bir sonraki faz ödülleri */}
              {accreditation.nextRewards.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">
                    Geçince Açılacaklar
                  </h3>
                  <div className="space-y-2">
                    {accreditation.nextRewards.map((r, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
                        <span className="text-violet-300 shrink-0 mt-0.5">★</span>
                        <span className="text-slate-300 text-sm">{r}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Faz 3 mesajı */}
          {!accreditation.nextPhaseLabel && (
            <section className="text-center py-4">
              <div className="text-5xl mb-3">🏆</div>
              <p className="text-amber-300 font-bold text-lg mb-2">Tebrikler!</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                En üst akreditasyon kademesine ulaştın. Estelongy Uzmanı olarak tüm avantajlar açık ve kongre konuşmaları için davet listesindesin.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
