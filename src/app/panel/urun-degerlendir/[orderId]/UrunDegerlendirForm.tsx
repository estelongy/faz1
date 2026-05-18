'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { submitEpReview, type EpReviewPayload } from './actions'

interface Product {
  productId: string
  name: string
  imageUrl?: string
  alreadyReviewed: boolean
}

interface Props {
  orderId: string
  products: Product[]
}

const QUESTIONS = [
  { key: 'qEtkinlik',    label: 'Beklediğiniz sonucu aldınız mı?' },
  { key: 'qSosyalKanit', label: 'Tavsiye eder misiniz?' },
  { key: 'qGuvenlik',    label: 'Ürün kullanım süresince sağlığınız açısından güvende kaldınız mı?' },
  { key: 'qEtkiSuresi',  label: 'Etkinin süresi beklentinizi karşıladı mı?' },
  { key: 'qKullanim',    label: 'Kullanımı kolay mıydı?' },
] as const

type QuestionKey = typeof QUESTIONS[number]['key']
type Ratings = Record<string, Record<QuestionKey, number>>

function StarRow({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl transition-transform hover:scale-110 focus:outline-none"
          aria-label={`${n} yıldız`}
        >
          <span className={(hovered || value) >= n ? 'text-amber-400' : 'text-slate-600'}>
            ★
          </span>
        </button>
      ))}
    </div>
  )
}

export default function UrunDegerlendirForm({ orderId, products }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const reviewable = products.filter(p => !p.alreadyReviewed)

  const initRatings = (): Ratings => {
    const r: Ratings = {}
    for (const p of reviewable) {
      r[p.productId] = {
        qEtkinlik: 0, qSosyalKanit: 0, qGuvenlik: 0, qEtkiSuresi: 0, qKullanim: 0,
      }
    }
    return r
  }

  const [ratings, setRatings] = useState<Ratings>(initRatings)

  function setRating(productId: string, key: QuestionKey, value: number) {
    setRatings(prev => ({
      ...prev,
      [productId]: { ...prev[productId], [key]: value },
    }))
  }

  function isComplete() {
    return reviewable.every(p =>
      QUESTIONS.every(q => ratings[p.productId]?.[q.key] > 0)
    )
  }

  function handleSubmit() {
    if (!isComplete()) { setError('Lütfen tüm soruları yanıtlayın.'); return }
    setError(null)
    startTransition(async () => {
      const payload: EpReviewPayload[] = reviewable.map(p => ({
        productId: p.productId,
        qEtkinlik:    ratings[p.productId].qEtkinlik,
        qSosyalKanit: ratings[p.productId].qSosyalKanit,
        qGuvenlik:    ratings[p.productId].qGuvenlik,
        qEtkiSuresi:  ratings[p.productId].qEtkiSuresi,
        qKullanim:    ratings[p.productId].qKullanim,
      }))
      const res = await submitEpReview(orderId, payload)
      if (!res.ok) { setError(res.error ?? 'Bir hata oluştu'); return }
      setDone(true)
      setTimeout(() => router.push('/panel/siparislerim'), 2000)
    })
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-5xl">✅</div>
        <p className="text-white text-xl font-bold">Değerlendirmen alındı!</p>
        <p className="text-slate-400 text-sm">Siparişlerime yönlendiriliyorsun...</p>
      </div>
    )
  }

  if (reviewable.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-5xl">✅</div>
        <p className="text-white text-xl font-bold">Bu siparişi zaten değerlendirdin</p>
        <button onClick={() => router.push('/panel/siparislerim')}
          className="mt-2 text-[#C9A961] font-semibold hover:underline">
          Siparişlerime Dön
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-24 pb-16 space-y-6">
      <h1 className="text-2xl font-black text-white">Ürünleri Değerlendir</h1>
      <p className="text-slate-400 text-sm">Her soru için 1-5 yıldız ver. 5 yıldız en iyi.</p>

      {products.filter(p => p.alreadyReviewed).length > 0 && (
        <div className="text-xs text-slate-500 bg-slate-800/50 rounded-xl px-4 py-2">
          Daha önce değerlendirdiğin ürünler gösterilmiyor.
        </div>
      )}

      {reviewable.map(product => (
        <div key={product.productId} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-3">
            {product.imageUrl && (
              <Image src={product.imageUrl} alt={product.name} width={56} height={56}
                className="w-14 h-14 rounded-xl object-cover border border-slate-700" />
            )}
            <h2 className="text-white font-bold text-base">{product.name}</h2>
          </div>

          <div className="space-y-4">
            {QUESTIONS.map(q => (
              <div key={q.key} className="space-y-1.5">
                <p className="text-slate-300 text-sm leading-snug">{q.label}</p>
                <StarRow
                  value={ratings[product.productId]?.[q.key] ?? 0}
                  onChange={v => setRating(product.productId, q.key, v)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full py-3.5 rounded-2xl bg-[#C9A961] hover:bg-[#b8973e] disabled:opacity-50 text-black font-black text-base transition-colors"
      >
        {isPending ? 'Kaydediliyor...' : 'Değerlendirmeyi Gönder'}
      </button>
    </div>
  )
}
