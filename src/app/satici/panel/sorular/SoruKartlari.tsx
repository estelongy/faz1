'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { answerQuestionAction, hideQuestionAction } from './actions'

interface Question {
  id: string
  question: string
  answer: string | null
  answered_at: string | null
  created_at: string
  is_hidden: boolean
  asker_full_name: string
  product_id: string
  product_name: string
  product_slug: string | null
}

export default function SoruKartlari({ questions }: { questions: Question[] }) {
  return (
    <div className="space-y-3">
      {questions.map(q => <SoruKart key={q.id} q={q} />)}
    </div>
  )
}

function SoruKart({ q }: { q: Question }) {
  const router = useRouter()
  const [editing, setEditing] = useState(!q.answer)
  const [answer, setAnswer] = useState(q.answer ?? '')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit() {
    setError(null)
    startTransition(async () => {
      const res = await answerQuestionAction(q.id, answer)
      if (!res.ok) { setError(res.error); return }
      setEditing(false)
      router.refresh()
    })
  }

  function toggleHide() {
    startTransition(async () => {
      await hideQuestionAction(q.id, !q.is_hidden)
      router.refresh()
    })
  }

  return (
    <div className={`p-5 rounded-2xl border ${
      q.answer ? 'bg-slate-800/40 border-slate-700' : 'bg-amber-500/5 border-amber-500/30'
    } ${q.is_hidden ? 'opacity-50' : ''}`}>
      {/* Üst meta */}
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
        <a href={`/estestore/${q.product_slug ?? q.product_id}#qa`} target="_blank"
          className="text-[#C9A961] hover:text-[#D4B872] text-sm font-bold truncate max-w-xs">
          {q.product_name} ↗
        </a>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{q.asker_full_name}</span>
          <span>·</span>
          <span>{new Date(q.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Soru */}
      <p className="text-white font-semibold text-base leading-snug mb-3">
        ❓ {q.question}
      </p>

      {/* Cevap */}
      {q.answer && !editing ? (
        <div className="ml-4 pl-4 border-l-2 border-[#C9A961]/40 bg-[#C9A961]/5 rounded-r-lg py-2 px-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C9A961]">✓ Yanıtın</span>
            {q.answered_at && (
              <span className="text-slate-500 text-xs">
                {new Date(q.answered_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
          <p className="text-slate-200 text-base leading-relaxed whitespace-pre-wrap">{q.answer}</p>
          <button onClick={() => setEditing(true)}
            className="mt-2 text-xs text-slate-400 hover:text-white font-semibold underline">
            Düzenle
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Müşteriye yanıtını yaz..."
            rows={3}
            maxLength={1500}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-base focus:outline-none focus:border-[#C9A961] resize-none"
          />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-slate-500 text-xs">{answer.length}/1500</p>
            <div className="flex gap-2">
              {q.answer && (
                <button onClick={() => { setEditing(false); setAnswer(q.answer ?? '') }}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg">
                  Vazgeç
                </button>
              )}
              <button onClick={submit} disabled={pending || answer.trim().length < 1}
                className="px-4 py-1.5 bg-gradient-to-r from-[#C9A961] to-[#B8964F] disabled:opacity-40 text-slate-900 text-sm font-bold rounded-lg">
                {pending ? 'Kaydediliyor…' : (q.answer ? 'Güncelle' : 'Yanıtla')}
              </button>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}
        </div>
      )}

      {/* Moderasyon */}
      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <button onClick={toggleHide} disabled={pending}
          className="text-xs text-slate-500 hover:text-red-400 font-semibold">
          {q.is_hidden ? '👁 Tekrar görünür yap' : '🚫 Bu soruyu vitrinden gizle'}
        </button>
      </div>
    </div>
  )
}
