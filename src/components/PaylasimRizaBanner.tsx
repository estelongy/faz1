'use client'

import { useState, useTransition } from 'react'
import { respondToShareRequest } from '@/app/klinik/panel/hasta/[userId]/vitrine-actions'
import type { SharedCaseWithProfile, AnonymityLevel } from '@/lib/shared-cases'

interface Props {
  pendingRequests: SharedCaseWithProfile[]
}

export default function PaylasimRizaBanner({ pendingRequests }: Props) {
  if (pendingRequests.length === 0) return null

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-pink-500/5 border border-amber-500/20 p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2l2.5 5.5L18 8l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L10 2z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-amber-300 font-bold text-sm">
            {pendingRequests.length === 1
              ? 'Klinik vitrini paylaşım izni isteniyor'
              : `${pendingRequests.length} paylaşım izni isteği var`}
          </h3>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            Bir klinik, vakanın sonucunu Estelongy topluluk vitrininde anonim biçimde sergilemek istiyor.
            Onaylarsan ad baş harfleri + yaş + skor görünür, kimliğin korunur. KVKK kapsamında açık rıza alınır.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {pendingRequests.map(req => (
          <RequestRow key={req.id} request={req} />
        ))}
      </div>
    </div>
  )
}

function RequestRow({ request }: { request: SharedCaseWithProfile }) {
  const [isPending, startTransition] = useTransition()
  const [anonymity, setAnonymity] = useState<AnonymityLevel>(request.anonymity_level)
  const [hidden, setHidden] = useState(false)

  if (hidden) return null

  function respond(decision: 'approve' | 'reject') {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('sharedCaseId', request.id)
      fd.append('decision', decision)
      fd.append('anonymity', anonymity)
      const result = await respondToShareRequest(fd)
      if (result.success) setHidden(true)
    })
  }

  const delta = request.initial_score != null && request.final_score != null
    ? request.final_score - request.initial_score
    : null
  const reqDate = new Date(request.requested_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })

  return (
    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/60">
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <div>
          <p className="text-white text-sm font-bold">{request.clinic_name ?? 'Klinik'}</p>
          <p className="text-slate-500 text-xs mt-0.5">{reqDate} tarihli istek</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Skor:</span>
          <span className="text-slate-300 font-bold">{request.initial_score ?? '—'}</span>
          <span className="text-slate-700">→</span>
          <span className="text-emerald-400 font-bold">{request.final_score ?? '—'}</span>
          {delta != null && delta > 0 && (
            <span className="text-emerald-400 font-bold">(+{delta})</span>
          )}
        </div>
      </div>

      {/* Anonimlik seçimi */}
      <div className="mb-3">
        <p className="text-slate-400 text-xs mb-2">Vitrinde nasıl görüneyim?</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: 'initials',  label: 'Baş harfler', hint: 'Örn. A. K.' },
            { id: 'firstname', label: 'Sadece ad',   hint: 'Örn. Aslı' },
            { id: 'full_anon', label: 'Tam anonim',  hint: '"Hasta"' },
          ] as { id: AnonymityLevel; label: string; hint: string }[]).map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setAnonymity(opt.id)}
              className={`p-2 rounded-lg border text-left transition-colors ${
                anonymity === opt.id
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <p className="text-xs font-bold">{opt.label}</p>
              <p className="text-[10px] mt-0.5 opacity-70">{opt.hint}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => respond('approve')}
          disabled={isPending}
          className="flex-1 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50 text-emerald-300 text-sm font-bold transition-colors"
        >
          {isPending ? 'Gönderiliyor…' : '✓ Kabul ediyorum'}
        </button>
        <button
          type="button"
          onClick={() => respond('reject')}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-sm font-medium transition-colors"
        >
          Reddet
        </button>
      </div>
    </div>
  )
}
