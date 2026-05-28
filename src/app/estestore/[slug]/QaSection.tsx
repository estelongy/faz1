'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { askQuestionAction, deleteQuestionAction } from './qa-actions'

interface Question {
  id: string
  question: string
  answer: string | null
  answered_at: string | null
  created_at: string
  asker_user_id: string
  asker_full_name: string | null
}

interface Props {
  productId: string
  productSlug: string | null
  questions: Question[]
  currentUserId: string | null
  loginRedirect: string
}

export default function QaSection({ productId, productSlug, questions, currentUserId, loginRedirect }: Props) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function submit() {
    setError(null); setSuccess(false)
    if (!currentUserId) {
      router.push(`/giris?g=estestore&next=${encodeURIComponent(loginRedirect)}`)
      return
    }
    startTransition(async () => {
      const res = await askQuestionAction(productId, text)
      if (!res.ok) { setError(res.error); return }
      setText(''); setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    })
  }

  function remove(qid: string) {
    if (!confirm('Bu soruyu silmek istediğinden emin misin?')) return
    startTransition(async () => {
      await deleteQuestionAction(qid)
      router.refresh()
    })
  }

  const answered = questions.filter(q => q.answer)
  const pendingQ = questions.filter(q => !q.answer)

  return (
    <section className="space-y-6">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h2 className="text-slate-900 font-bold text-xl tracking-[-0.01em]">
          Sorular & Cevaplar
          {questions.length > 0 && (
            <span className="text-slate-400 font-medium ml-2">({questions.length})</span>
          )}
        </h2>
        {answered.length > 0 && (
          <p className="text-sm text-slate-500">
            {answered.length} soru satıcı tarafından yanıtlandı
          </p>
        )}
      </div>

      {/* Soru sorma formu */}
      <div className="p-5 bg-[#FAFAF7] border border-slate-200 rounded-2xl space-y-3">
        <h3 className="text-slate-900 font-bold text-base">Soru Sor</h3>
        <p className="text-slate-500 text-sm">
          Bu ürünle ilgili merak ettiğin bir şey mi var? Satıcı 48 saat içinde yanıtlar.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Sorunu yaz..."
          rows={3}
          maxLength={800}
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-base focus:outline-none focus:border-[#C9A961] resize-none"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-slate-500 text-sm">{text.length}/800</p>
          {error && <p className="text-red-500 text-sm font-semibold flex-1">{error}</p>}
          {success && <p className="text-[#10876B] text-sm font-semibold flex-1">✓ Sorun gönderildi!</p>}
          <button
            onClick={submit}
            disabled={pending || text.trim().length < 5}
            className="px-5 py-2 bg-[#0F172A] hover:bg-slate-800 disabled:opacity-40 text-white font-bold rounded-lg text-sm"
          >
            {pending ? 'Gönderiliyor…' : 'Soru Gönder'}
          </button>
        </div>
      </div>

      {/* Liste */}
      {questions.length === 0 ? (
        <p className="text-center py-10 text-slate-400 text-sm">
          Bu ürün için henüz soru yok — ilkini sen sor!
        </p>
      ) : (
        <div className="space-y-3">
          {/* Önce cevaplananlar, sonra bekleyenler */}
          {[...answered, ...pendingQ].map(q => (
            <div key={q.id} className="p-5 bg-white border border-slate-200 rounded-2xl">
              {/* Soru */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0">
                  S
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 font-semibold text-base leading-snug">{q.question}</p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                    <span>{q.asker_full_name ?? 'Kullanıcı'}</span>
                    <span>·</span>
                    <span>{new Date(q.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {currentUserId === q.asker_user_id && (
                      <>
                        <span>·</span>
                        <button onClick={() => remove(q.id)} className="text-red-400 hover:text-red-600 font-semibold">
                          Sil
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Cevap */}
              {q.answer ? (
                <div className="mt-3 ml-11 pl-4 border-l-2 border-[#C9A961]/40 bg-[#C9A961]/5 rounded-r-lg py-2 px-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C9A961]/15 text-[#8B7339] text-xs font-bold">
                      ✓ Satıcı Yanıtı
                    </span>
                    {q.answered_at && (
                      <span className="text-slate-500 text-sm">
                        {new Date(q.answered_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap">{q.answer}</p>
                </div>
              ) : (
                <div className="mt-3 ml-11">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                    ⏳ Satıcı yanıtı bekleniyor
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SEO: gizli link — slug kullanılırsa ürün sayfasına geri bağlantı */}
      {productSlug && <link rel="canonical" href={`/estestore/${productSlug}#qa`} />}
    </section>
  )
}
