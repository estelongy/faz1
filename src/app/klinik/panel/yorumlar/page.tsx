export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  STAR_DIMENSIONS,
  NPS_LABELS,
  TEKRAR_GELIR_LABELS,
  egpBadgeColor,
  egpLabel,
  type ClinicReviewRow,
  type TekrarGelir,
} from '@/lib/clinic-review'
import RespondToReviewForm from './RespondToReviewForm'

export const metadata: Metadata = {
  title: 'Yorumlarım — Klinik Paneli',
}

export default async function KlinikYorumlarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, review_count, avg_operational, avg_nps, clinic_egp, clinic_egp_updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!clinic) redirect('/klinik/basvur')

  // Tüm yorumlar — önce cevaplanmamış, sonra yeni
  const { data: reviewsRaw } = await supabase
    .from('clinic_reviews')
    .select('*')
    .eq('clinic_id', clinic.id)
    .order('created_at', { ascending: false })

  const reviews = (reviewsRaw ?? []) as ClinicReviewRow[]

  // Hasta isimlerini çek (anonim olmayan yorumlar için)
  const userIds = Array.from(new Set(reviews.filter(r => !r.is_anonymous).map(r => r.user_id)))
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] }
  const profileById = new Map<string, string>()
  ;(profiles ?? []).forEach(p => {
    profileById.set(p.id as string, (p as { full_name?: string | null }).full_name ?? 'Estelongy Kullanıcısı')
  })

  const totalReviews = reviews.length
  const respondedCount = reviews.filter(r => r.clinic_response).length
  const responseRate = totalReviews > 0 ? Math.round((respondedCount / totalReviews) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header>
        <Link href="/klinik/panel" className="text-slate-500 hover:text-white text-xs inline-flex items-center gap-1 mb-2">
          ← Klinik Panel
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Yorumlar</h1>
        <p className="text-slate-400 text-sm mt-1">
          Hastaların deneyim değerlendirmeleri. Her yoruma <strong>tek seferlik</strong> cevap yazabilirsin.
        </p>
      </header>

      {/* EGP Özet Kartı */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatBox label="Klinik EGP" value={clinic.clinic_egp != null ? Number(clinic.clinic_egp).toFixed(2) : '—'}
          extra={<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${egpBadgeColor(clinic.clinic_egp != null ? Number(clinic.clinic_egp) : null)}`}>
            {egpLabel(clinic.clinic_egp != null ? Number(clinic.clinic_egp) : null)}
          </span>}
        />
        <StatBox label="Toplam Yorum" value={`${clinic.review_count ?? 0}`} />
        <StatBox label="Operasyonel Ort." value={clinic.avg_operational != null ? `${Number(clinic.avg_operational).toFixed(2)}/10` : '—'} />
        <StatBox label="Cevap Oranı" value={`${responseRate}%`} extra={<span className="text-[10px] text-slate-500">{respondedCount}/{totalReviews}</span>} />
      </section>

      {/* Felsefe Notu */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 leading-relaxed">
        Estelongy <strong className="text-white">ölçüm platformu</strong>. EGP günlük güncellenir
        (formül: Sonuç Δ × 0.35 + NPS × 0.25 + Operasyonel × 0.20 + Akreditasyon × 0.15 + Profesyonellik × 0.05,
        Bayesian shrinkage ile). Az yorumlu klinikler global ortalamaya yaklaştırılır.
      </div>

      {/* Yorumlar */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
          <div className="text-5xl opacity-40 mb-3">💬</div>
          <p className="text-white font-semibold">Henüz yorum yok</p>
          <p className="text-slate-500 text-sm mt-1">İlk değerlendirmen tamamlanmış randevulardan gelecek.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <ReviewCard
              key={r.id}
              review={r}
              userName={r.is_anonymous ? null : (profileById.get(r.user_id) ?? null)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────

function StatBox({ label, value, extra }: { label: string; value: string; extra?: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
      <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-white text-2xl font-black">{value}</p>
        {extra}
      </div>
    </div>
  )
}

function ReviewCard({ review, userName }: { review: ClinicReviewRow; userName: string | null }) {
  const operationalAvg = (review.hijyen + review.personel + review.randevu_uyumu + review.iletisim) / 4
  const editLocked = new Date(review.edit_window_until) < new Date()
  const responded = !!review.clinic_response

  return (
    <article className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      {/* Üst: kullanıcı + tarih + tacir uyarı */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white font-bold text-sm">
            {userName ?? 'Estelongy Kullanıcısı'}
            {review.is_anonymous && <span className="ml-2 text-[10px] text-slate-600 uppercase">Anonim</span>}
          </p>
          <p className="text-slate-500 text-xs mt-0.5">
            {new Date(review.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {!editLocked && <span className="ml-2 text-amber-500">· hasta düzenleyebilir</span>}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 text-amber-400 text-sm">
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} className={n <= Math.round(operationalAvg) ? '' : 'text-slate-700'}>★</span>
            ))}
          </div>
          <p className="text-slate-500 text-[10px] mt-0.5">{operationalAvg.toFixed(1)}/5 ort.</p>
        </div>
      </header>

      {/* 4 boyut detay */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {STAR_DIMENSIONS.map(dim => {
          const k = dim.key === 'randevuUyumu' ? 'randevu_uyumu' : dim.key
          const v = review[k as keyof ClinicReviewRow] as number
          return (
            <div key={dim.key} className="p-2 rounded-lg bg-slate-800/40">
              <div className="text-slate-500 text-[10px] mb-0.5 flex items-center gap-1">
                <span>{dim.icon}</span>
                {dim.label}
              </div>
              <div className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map(n => (
                  <span key={n} className={`text-xs ${n <= v ? '' : 'text-slate-700'}`}>★</span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* NPS + tekrar gelir */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-slate-800/40">
          <span className="text-slate-500">Tavsiye eğilimi: </span>
          <span className="text-white font-medium">{NPS_LABELS[review.nps]}</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-800/40">
          <span className="text-slate-500">Tekrar gelir mi: </span>
          <span className="text-white font-medium">{TEKRAR_GELIR_LABELS[review.tekrar_gelir as TekrarGelir]}</span>
        </div>
      </div>

      {/* Serbest metin */}
      {review.pozitif_metin && (
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-emerald-300 text-[10px] uppercase tracking-wider font-bold mb-1">Pozitif</p>
          <p className="text-slate-200 text-sm whitespace-pre-wrap">{review.pozitif_metin}</p>
        </div>
      )}
      {review.iyilestirme_metni && (
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <p className="text-amber-300 text-[10px] uppercase tracking-wider font-bold mb-1">İyileştirme önerisi</p>
          <p className="text-slate-200 text-sm whitespace-pre-wrap">{review.iyilestirme_metni}</p>
        </div>
      )}

      {/* Klinik cevabı */}
      {responded ? (
        <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
          <div className="flex items-center justify-between mb-1">
            <p className="text-violet-300 text-[10px] uppercase tracking-wider font-bold">Klinik Cevabı</p>
            {review.clinic_responded_at && (
              <p className="text-slate-600 text-[10px]">
                {new Date(review.clinic_responded_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
          <p className="text-slate-200 text-sm whitespace-pre-wrap">{review.clinic_response}</p>
        </div>
      ) : (
        <RespondToReviewForm reviewId={review.id} />
      )}
    </article>
  )
}
