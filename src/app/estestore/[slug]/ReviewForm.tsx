'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitReviewAction } from './review-actions'

interface Existing {
  qEtkinlik:    number
  qSosyalKanit: number
  qGuvenlik:    number
  qEtkiSuresi:  number
  qKullanim:    number
  title:   string | null
  comment: string | null
}

const QUESTIONS: Array<{ key: keyof Existing; label: string; hint: string }> = [
  { key: 'qEtkinlik',    label: 'Etkinlik',        hint: 'Vaat ettiği sonucu gerçekten verdi mi?' },
  { key: 'qSosyalKanit', label: 'Sosyal Kanıt',    hint: 'Çevren tarafından fark edildi mi?' },
  { key: 'qGuvenlik',    label: 'Güvenlik',        hint: 'Yan etki / tahriş yaşadın mı?' },
  { key: 'qEtkiSuresi',  label: 'Etki Süresi',     hint: 'Etkisi ne kadar kalıcı?' },
  { key: 'qKullanim',    label: 'Kullanım Kolaylığı', hint: 'Uygulaması/kullanımı pratik mi?' },
]

export default function ReviewForm({ productId, existing }: { productId: string; existing?: Existing | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(!!existing)
  const [done, setDone] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [scores, setScores] = useState<Record<string, number>>({
    qEtkinlik:    existing?.qEtkinlik    ?? 0,
    qSosyalKanit: existing?.qSosyalKanit ?? 0,
    qGuvenlik:    existing?.qGuvenlik    ?? 0,
    qEtkiSuresi:  existing?.qEtkiSuresi  ?? 0,
    qKullanim:    existing?.qKullanim    ?? 0,
  })
  const [title, setTitle]     = useState(existing?.title ?? '')
  const [comment, setComment] = useState(existing?.comment ?? '')

  const filled = QUESTIONS.every(q => scores[q.key] >= 1)
  const avg5 = filled
    ? QUESTIONS.reduce((s, q) => s + scores[q.key], 0) / QUESTIONS.length
    : 0
  const epPreview = filled ? Math.round(avg5 * 2 * 10) / 10 : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!filled) { setError('Tüm başlıklarda en az 1 yıldız ver.'); return }
    startTransition(async () => {
      const res = await submitReviewAction({
        productId,
        qEtkinlik:    scores.qEtkinlik,
        qSosyalKanit: scores.qSosyalKanit,
        qGuvenlik:    scores.qGuvenlik,
        qEtkiSuresi:  scores.qEtkiSuresi,
        qKullanim:    scores.qKullanim,
        title,
        comment,
      })
      if (!res.ok) { setError(res.error ?? 'Bir hata oluştu'); return }
      setVerified(res.isVerified)
      setDone(true)
      router.refresh()
    })
  }

  if (done) {
    return (
      <div className="p-5 bg-[#10876B]/10 border border-[#10876B]/30 rounded-2xl mb-6 text-center">
        <p className="text-[#10876B] font-bold mb-1">Değerlendirmen paylaşıldı!</p>
        {verified ? (
          <p className="text-[#0d6f57] text-sm">✓ Satın alma doğrulandı — &quot;Doğrulanmış Alışveriş&quot; rozeti aldın.</p>
        ) : (
          <p className="text-slate-500 text-sm">Yorumun yayında. Bu ürünü satın alırsan &quot;Doğrulanmış&quot; rozeti kazanırsın.</p>
        )}
      </div>
    )
  }

  if (!open && !existing) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full py-4 mb-6 border border-dashed border-slate-300 hover:border-[#C9A961] rounded-2xl text-slate-500 hover:text-[#8B7339] transition-all text-base font-semibold">
        ★ Bu Ürünü Değerlendir
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 bg-[#FAFAF7] border border-[#C9A961]/40 rounded-2xl mb-6 space-y-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-900 font-bold text-lg">
          {existing ? 'Değerlendirmeni Güncelle' : 'Bu Ürünü Değerlendir'}
        </h3>
        {!existing && (
          <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm">İptal</button>
        )}
      </div>

      {/* 5 başlık */}
      <div className="space-y-3">
        {QUESTIONS.map(q => (
          <div key={q.key} className="flex items-start gap-3 flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <p className="text-slate-900 font-bold text-base">{q.label}</p>
              <p className="text-slate-500 text-sm leading-snug">{q.hint}</p>
            </div>
            <StarRow value={scores[q.key]} onChange={v => setScores(s => ({ ...s, [q.key]: v }))} />
          </div>
        ))}
      </div>

      {/* EP preview */}
      {filled && epPreview !== null && (
        <div className="flex items-center justify-between p-3 bg-[#C9A961]/10 border border-[#C9A961]/30 rounded-xl">
          <span className="text-slate-700 text-sm font-semibold">EP Skorun (önizleme)</span>
          <span className={`font-black text-2xl ${
            epPreview >= 9 ? 'text-[#10876B]' : epPreview >= 7 ? 'text-[#8B7339]' : 'text-red-500'
          }`}>
            {epPreview}<span className="text-slate-400 text-sm font-normal">/10</span>
          </span>
        </div>
      )}

      {/* Başlık */}
      <div>
        <label className="block text-slate-500 text-sm mb-1 font-semibold">
          Başlık <span className="text-slate-400 font-normal">(isteğe bağlı)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Kısa bir başlık..."
          maxLength={120}
          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-base focus:outline-none focus:border-[#C9A961] transition-colors"
        />
      </div>

      {/* Yorum */}
      <div>
        <label className="block text-slate-500 text-sm mb-1 font-semibold">
          Deneyim <span className="text-slate-400 font-normal">(isteğe bağlı)</span>
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Ürünü kullanım deneyimini, başkalarına faydalı olacak bir şeyleri yaz..."
          maxLength={1000}
          rows={3}
          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-base focus:outline-none focus:border-[#C9A961] transition-colors resize-none"
        />
        <p className="text-slate-500 text-sm mt-1">{comment.length}/1000</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">{error}</div>
      )}

      <button
        type="submit"
        disabled={isPending || !filled}
        className="w-full py-3 bg-[#0F172A] hover:bg-slate-800 disabled:opacity-40 text-white font-bold rounded-xl transition-all text-base">
        {isPending ? 'Gönderiliyor...' : existing ? 'Değerlendirmeyi Güncelle' : 'Değerlendirmeyi Yayınla'}
      </button>
    </form>
  )
}

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl leading-none transition-transform hover:scale-110"
          aria-label={`${n} yıldız`}
        >
          <span className={(hover || value) >= n ? 'text-[#C9A961]' : 'text-slate-300'}>★</span>
        </button>
      ))}
      <span className="ml-2 text-slate-600 text-sm font-semibold w-10 text-right">
        {value > 0 ? `${value}/5` : ''}
      </span>
    </div>
  )
}
