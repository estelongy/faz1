import Link from 'next/link'
import { Mail } from 'lucide-react'
import {
  NPS_LABELS,
  TEKRAR_GELIR_LABELS,
  egpBadgeColor,
  egpLabel,
  type ClinicReviewRow,
  type TekrarGelir,
} from '@/lib/clinic-review'
import RespondToReviewForm from '@/app/klinik/panel/yorumlar/RespondToReviewForm'

interface Props {
  clinicEgp: number | null
  reviewCount: number
  avgNps: number | null
  responseRate: number
  respondedCount: number
  totalReviews: number
  reviews: ClinicReviewRow[]
  profileById: Map<string, string>
}

export default function YorumlarAppView({
  clinicEgp,
  reviewCount,
  avgNps,
  responseRate,
  respondedCount,
  totalReviews,
  reviews,
  profileById,
}: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-3">
        <p className="text-sm text-slate-400">
          Hasta değerlendirmeleri. Her yoruma tek seferlik cevap yazabilirsin.
        </p>
      </header>

      {/* EGP özet — 2x2 mobil ızgara */}
      <section className="px-5 grid grid-cols-2 gap-2.5">
        <StatBox
          label="Klinik EGP"
          value={clinicEgp != null ? clinicEgp.toFixed(2) : '—'}
          extra={
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${egpBadgeColor(clinicEgp)}`}
            >
              {egpLabel(clinicEgp)}
            </span>
          }
        />
        <StatBox label="Toplam Yorum" value={`${reviewCount}`} />
        <StatBox label="Tavsiye (NPS)" value={avgNps != null ? `${avgNps.toFixed(1)}/10` : '—'} />
        <StatBox
          label="Cevap Oranı"
          value={`${responseRate}%`}
          extra={<span className="text-[10px] text-slate-500">{respondedCount}/{totalReviews}</span>}
        />
      </section>

      {reviews.length === 0 ? (
        <section className="px-5 mt-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center">
            <div className="text-4xl opacity-50 mb-2">💬</div>
            <p className="text-white font-semibold">Henüz yorum yok</p>
            <p className="text-slate-500 text-xs mt-1">
              İlk değerlendirme tamamlanmış randevulardan gelecek.
            </p>
          </div>
        </section>
      ) : (
        <section className="px-5 mt-4 space-y-3">
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              userName={r.is_anonymous ? null : profileById.get(r.user_id) ?? null}
            />
          ))}
        </section>
      )}
    </div>
  )
}

function StatBox({
  label,
  value,
  extra,
}: {
  label: string
  value: string
  extra?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p className="text-white text-lg font-black tabular-nums">{value}</p>
        {extra}
      </div>
    </div>
  )
}

function ReviewCard({
  review,
  userName,
}: {
  review: ClinicReviewRow
  userName: string | null
}) {
  const editLocked = new Date(review.edit_window_until) < new Date()
  const responded = !!review.clinic_response

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate">
            {userName ?? 'Estelongy Kullanıcısı'}
            {review.is_anonymous && (
              <span className="ml-2 text-[10px] text-slate-500 uppercase">Anonim</span>
            )}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date(review.created_at).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            {!editLocked && <span className="ml-2 text-amber-500">· düzenleyebilir</span>}
          </p>
        </div>
      </header>

      <div className="space-y-1.5 text-xs">
        <div className="px-2.5 py-1.5 rounded-lg bg-slate-800/50">
          <span className="text-slate-500">Tavsiye eğilimi: </span>
          <span className="text-white font-medium">{NPS_LABELS[review.nps]}</span>
        </div>
        <div className="px-2.5 py-1.5 rounded-lg bg-slate-800/50">
          <span className="text-slate-500">Tekrar gelir mi: </span>
          <span className="text-white font-medium">
            {TEKRAR_GELIR_LABELS[review.tekrar_gelir as TekrarGelir]}
          </span>
        </div>
      </div>

      {review.pozitif_metin && (
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-emerald-300 text-[10px] uppercase tracking-wider font-bold mb-1">
            Hasta Yorumu
          </p>
          <p className="text-slate-200 text-sm whitespace-pre-wrap">{review.pozitif_metin}</p>
        </div>
      )}

      {responded ? (
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-emerald-300 text-[10px] uppercase tracking-wider font-bold mb-1">
            Klinik Cevabı
          </p>
          <p className="text-slate-200 text-sm whitespace-pre-wrap">{review.clinic_response}</p>
        </div>
      ) : (
        <RespondToReviewForm reviewId={review.id} />
      )}

      {/* Özel (private) mesaj köprüsü — hasta iyilestirme_metni yazdiysa
          klinik bu yorumu Mesajlar sekmesine geçip yanıtlamalı (tek seferlik). */}
      {review.iyilestirme_metni && !review.private_clinic_response && (
        <Link
          href="/klinik/panel/mesajlar?f=unread"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs font-bold active:bg-amber-500/20 transition"
        >
          <Mail size={14} className="shrink-0" />
          <span className="flex-1">
            Bu hastadan sana özel mesaj var — Mesajlardan yanıtla
          </span>
          <span className="text-amber-300">→</span>
        </Link>
      )}
    </article>
  )
}
