'use client'

import { useState } from 'react'
import Link from 'next/link'
import ScoreBar from '@/components/ScoreBar'

export interface OncekiAnaliz {
  id: string
  created_at: string
  web_overall: number | null
  temp_overall: number | null
  final_overall: number | null
  web_scores: {
    wrinkles?: number
    pigmentation?: number
    hydration?: number
    tone_uniformity?: number
    under_eye?: number
  } | null
}

interface Props {
  analyses: OncekiAnaliz[]  // max 3, en yeniden eskiye
}

function aktifSkor(a: OncekiAnaliz): number | null {
  return a.final_overall ?? a.temp_overall ?? a.web_overall
}

function analizDurumu(a: OncekiAnaliz): { label: string; renk: string } {
  if (a.final_overall != null) return { label: 'Klinik Onaylı', renk: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
  if (a.temp_overall != null) return { label: 'Anket Yapıldı', renk: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
  return { label: 'Ön Analiz', renk: 'bg-violet-500/20 text-violet-400 border-violet-500/30' }
}

function zoneRenk(score: number): string {
  if (score < 56) return 'bg-red-500'
  if (score < 66) return 'bg-purple-500'
  if (score < 80) return 'bg-amber-500'
  if (score < 90) return 'bg-emerald-500'
  return 'bg-blue-500'
}

export default function OncekiAnalizler({ analyses }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (analyses.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-center">
        <p className="text-slate-500 text-sm">Henüz önceki analiz yok.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {analyses.map(a => {
        const score = aktifSkor(a)
        const durum = analizDurumu(a)
        const isExpanded = expandedId === a.id
        const tarih = new Date(a.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
        const saat = new Date(a.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

        return (
          <div
            key={a.id}
            className={`rounded-2xl border transition-all ${
              isExpanded
                ? 'bg-slate-800 border-violet-500/50'
                : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            {/* Önizleme (her zaman görünür) */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : a.id)}
              className="w-full text-left p-4"
            >
              <div className="flex items-center gap-4">
                {/* Skor daire */}
                <div className="shrink-0 w-14 h-14 rounded-full bg-slate-900 border-2 border-slate-700 flex flex-col items-center justify-center">
                  <span className="text-white text-lg font-black leading-none">{score ?? '—'}</span>
                  <span className="text-slate-500 text-[9px] leading-none mt-0.5">/100</span>
                </div>

                {/* Orta: tarih + progress bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-white text-sm font-semibold">{tarih}</span>
                    <span className="text-slate-500 text-xs">· {saat}</span>
                  </div>
                  {/* İlerleme skalası (mini) */}
                  {score !== null && (
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${zoneRenk(score)} transition-all`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Sağ: durum + chevron */}
                <div className="shrink-0 flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${durum.renk}`}>
                    {durum.label}
                  </span>
                  <svg
                    className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Genişletilmiş içerik */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-2 border-t border-slate-700">
                {/* Tam skor ibresi */}
                {score !== null && (
                  <div className="py-3">
                    <ScoreBar score={score} phase="ai_analiz" animated={false} />
                  </div>
                )}

                {/* Cilt metrikleri */}
                {a.web_scores && (
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                    {a.web_scores.hydration !== undefined && (
                      <MiniMetric label="Nem" value={a.web_scores.hydration} />
                    )}
                    {a.web_scores.wrinkles !== undefined && (
                      <MiniMetric label="Kırışıklık" value={a.web_scores.wrinkles} invert />
                    )}
                    {a.web_scores.pigmentation !== undefined && (
                      <MiniMetric label="Pigmentasyon" value={a.web_scores.pigmentation} invert />
                    )}
                    {a.web_scores.tone_uniformity !== undefined && (
                      <MiniMetric label="Cilt Tonu" value={a.web_scores.tone_uniformity} />
                    )}
                  </div>
                )}

                {/* Skor Merkezi butonu */}
                <Link
                  href={`/skor?analysisId=${a.id}`}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Bu Analizin Skor Merkezi
                </Link>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MiniMetric({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const displayVal = invert ? 100 - value : value
  const renk = displayVal >= 75 ? 'bg-emerald-500' : displayVal >= 50 ? 'bg-amber-500' : 'bg-red-500'
  const textRenk = displayVal >= 75 ? 'text-emerald-400' : displayVal >= 50 ? 'text-amber-400' : 'text-red-400'
  return (
    <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50">
      <div className="flex justify-between items-center mb-1">
        <span className="text-slate-400">{label}</span>
        <span className={`font-bold ${textRenk}`}>{value}{invert ? '/100' : '%'}</span>
      </div>
      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${renk}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
