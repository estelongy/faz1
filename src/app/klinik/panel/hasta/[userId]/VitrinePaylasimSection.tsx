'use client'

import { useState, useTransition } from 'react'
import { requestVitrineShare, revokeVitrineShare } from './vitrine-actions'

interface AnalysisWithShare {
  id: string
  created_at: string
  web_overall: number | null
  temp_overall: number | null
  final_overall: number
  shared_case: {
    id: string
    status: 'pending' | 'approved' | 'rejected' | 'revoked'
    requested_at: string
  } | null
}

interface Props {
  userId: string
  analyses: AnalysisWithShare[]
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Hasta cevabı bekleniyor', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  approved: { label: 'Onaylı — vitrinde gösteriliyor', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  rejected: { label: 'Hasta reddetti', color: 'bg-red-500/15 text-red-300 border-red-500/30' },
  revoked:  { label: 'İptal edildi', color: 'bg-slate-700/40 text-slate-400 border-slate-600' },
}

export default function VitrinePaylasimSection({ userId, analyses }: Props) {
  if (analyses.length === 0) {
    return (
      <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-5">
        <h2 className="text-white font-bold mb-2">Sonuç Vitrini Paylaşımı</h2>
        <p className="text-slate-500 text-sm">
          Bu hastanın klinik onaylı analizi henüz yok. İzin isteğinde bulunabilmek için skor doğrulaması gerekli.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/40 rounded-2xl border border-slate-700 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-white font-bold flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2l2.5 5.5L18 8l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L10 2z"/>
            </svg>
            Sonuç Vitrini Paylaşımı
          </h2>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed">
            Hastadan açık rıza alarak bu vakayı topluluk vitrininde anonim biçimde sergileyebilirsin.
            Hasta kabul ederse vitrinde ad baş harfleri + yaş + skor görünür. KVKK uyumlu.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {analyses.map(a => (
          <AnalysisShareRow key={a.id} userId={userId} analysis={a} />
        ))}
      </div>
    </div>
  )
}

function AnalysisShareRow({ userId, analysis }: { userId: string; analysis: AnalysisWithShare }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const initial = analysis.web_overall ?? analysis.temp_overall ?? null
  const delta = initial != null ? analysis.final_overall - initial : null
  const dateStr = new Date(analysis.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

  function handleRequest() {
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('analysisId', analysis.id)
      fd.append('userId', userId)
      const result = await requestVitrineShare(fd)
      if (result.error) setError(result.error)
    })
  }

  function handleRevoke() {
    if (!analysis.shared_case) return
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('sharedCaseId', analysis.shared_case!.id)
      fd.append('userId', userId)
      await revokeVitrineShare(fd)
    })
  }

  const sc = analysis.shared_case
  const statusMeta = sc ? STATUS_META[sc.status] : null
  const showRequestButton = !sc || sc.status === 'rejected' || sc.status === 'revoked'

  return (
    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/60">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-slate-500 text-sm shrink-0">{dateStr}</div>
          <div className="flex items-center gap-1.5 shrink-0">
            {initial != null && <span className="text-slate-600 text-sm font-bold">{initial}</span>}
            <span className="text-slate-700">→</span>
            <span className="text-emerald-400 font-black text-base">{analysis.final_overall}</span>
            {delta != null && delta !== 0 && (
              <span className={`text-sm font-bold ${delta > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                ({delta > 0 ? '+' : ''}{delta})
              </span>
            )}
          </div>
          {statusMeta && (
            <span className={`text-sm font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusMeta.color} truncate`}>
              {statusMeta.label}
            </span>
          )}
        </div>

        <div className="shrink-0">
          {showRequestButton && (
            <button
              type="button"
              onClick={handleRequest}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 text-amber-300 text-base font-bold transition-colors"
            >
              {isPending ? 'Gönderiliyor…' : 'Paylaşım izni iste'}
            </button>
          )}
          {sc && sc.status === 'approved' && (
            <button
              type="button"
              onClick={handleRevoke}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-base font-medium transition-colors"
            >
              Vitrinden kaldır
            </button>
          )}
          {sc && sc.status === 'pending' && (
            <span className="text-slate-500 text-sm italic px-2">Hasta cevabı bekleniyor</span>
          )}
        </div>
      </div>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  )
}
