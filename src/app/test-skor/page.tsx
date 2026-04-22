'use client'

import ScoreBar from '@/components/ScoreBar'
import ScoreChart from '@/components/ScoreChart'
import { useState } from 'react'

const PHASES = [
  'ai_analiz',
  'longevity_anketi',
  'randevu',
  'klinik_kabul',
  'klinik_anketi',
  'ileri_ai',
  'tetkik',
  'hekim_degerlendirme',
  'klinik_onayli',
] as const

const TEST_POINTS = [
  { date: '2024-01-10T10:00:00Z', score: 42, type: 'ai_analiz' as const },
  { date: '2024-02-15T10:00:00Z', score: 57, type: 'ai_analiz' as const },
  { date: '2024-03-01T10:00:00Z', score: 63, type: 'ai_analiz' as const },
  { date: '2024-03-01T10:00:01Z', score: 71, type: 'klinik_onayli' as const },
  { date: '2024-04-10T10:00:00Z', score: 78, type: 'ai_analiz' as const },
  { date: '2024-04-10T10:00:01Z', score: 84, type: 'klinik_onayli' as const },
  { date: '2024-05-20T10:00:00Z', score: 91, type: 'ai_analiz' as const },
]

export default function TestSkorPage() {
  const [score, setScore] = useState(77)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [isClinic, setIsClinic] = useState(false)

  const phase = PHASES[phaseIdx]

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">

        <h1 className="text-white text-2xl font-black text-center">EGS Skor Bar Test Sayfası</h1>

        {/* Kontroller */}
        <div className="bg-slate-800 rounded-2xl p-5 space-y-4 border border-slate-700">
          <div>
            <label className="text-slate-400 text-sm block mb-2">Skor: <span className="text-white font-bold">{score}</span></label>
            <input
              type="range" min={0} max={100} step={1} value={score}
              onChange={e => setScore(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-sm block mb-2">Aşama: <span className="text-white font-bold">{phase}</span></label>
            <input
              type="range" min={0} max={PHASES.length - 1} step={1} value={phaseIdx}
              onChange={e => setPhaseIdx(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsClinic(false)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${!isClinic ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
              Hasta Görünümü
            </button>
            <button
              onClick={() => setIsClinic(true)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isClinic ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
              Klinik Görünümü
            </button>
          </div>
        </div>

        {/* Hızlı skor butonları */}
        <div className="flex flex-wrap gap-2">
          {[20, 42, 55, 63, 72, 78, 85, 91, 97].map(s => (
            <button key={s}
              onClick={() => setScore(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
              {s}
            </button>
          ))}
        </div>

        {/* GAUGE */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <ScoreBar score={score} phase={phase} isClinicView={isClinic} animated />
        </div>

        {/* CHART */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-white font-bold mb-4">Skor Geçmişi Grafiği</h2>
          <ScoreChart points={TEST_POINTS} />
        </div>

      </div>
    </main>
  )
}
