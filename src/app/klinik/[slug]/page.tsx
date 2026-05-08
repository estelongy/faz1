import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/components/SiteHeader'
import Footer from '@/components/Footer'
import {
  NPS_LABELS,
  egpBadgeColor,
  egpLabel,
  type ClinicReviewRow,
} from '@/lib/clinic-review'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('clinics')
    .select('name, location')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (!data) return { title: 'Klinik bulunamadı | Estelongy' }
  return {
    title: `${data.name} | Estelongy`,
    description: data.location ? `${data.name} — ${data.location}. Estelongy ölçüm ekosisteminde değerlendirilen klinik.` : `${data.name} — Estelongy ölçüm ekosisteminde değerlendirilen klinik.`,
  }
}

export default async function PublicClinicPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, location, bio, specialties, clinic_egp, review_count, avg_operational, avg_nps')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (!clinic) notFound()

  // Public yorumlar (en yeni 20)
  const { data: reviewsRaw } = await supabase
    .from('clinic_reviews')
    .select('*')
    .eq('clinic_id', clinic.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const reviews = (reviewsRaw ?? []) as ClinicReviewRow[]

  const userIds = Array.from(new Set(reviews.filter(r => !r.is_anonymous).map(r => r.user_id)))
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] }
  const profileById = new Map<string, string>()
  ;(profiles ?? []).forEach(p => {
    profileById.set(p.id as string, (p as { full_name?: string | null }).full_name ?? 'Estelongy Kullanıcısı')
  })

  const egp = clinic.clinic_egp != null ? Number(clinic.clinic_egp) : null

  return (
    <>
      <SiteHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Link href="/" className="hover:text-white transition-colors">Anasayfa</Link>
          <span>›</span>
          <Link href="/randevu" className="hover:text-white transition-colors">Klinikler</Link>
          <span>›</span>
          <span className="text-slate-300 truncate">{clinic.name}</span>
        </nav>

        {/* Üst kart: klinik kimlik + EGP rozet */}
        <header className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <h1 className="text-3xl font-bold text-white mb-2">{clinic.name}</h1>
            {clinic.location && (
              <p className="text-slate-400 text-sm mb-3">📍 {clinic.location}</p>
            )}
            {clinic.bio && (
              <p className="text-slate-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{clinic.bio}</p>
            )}
            {Array.isArray(clinic.specialties) && clinic.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {clinic.specialties.map((s: string, i: number) => (
                  <span key={i} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={`p-6 rounded-2xl border ${egpBadgeColor(egp)}`}>
            <p className="text-[10px] uppercase tracking-widest opacity-80 mb-1">Klinik EGP</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-black">{egp != null ? egp.toFixed(1) : '—'}</span>
              <span className="text-xs opacity-70">/10</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3">{egpLabel(egp)}</p>
            <p className="text-[11px] opacity-80 leading-relaxed">
              <strong>{clinic.review_count ?? 0}</strong> deneyim · <strong>{clinic.avg_nps != null ? Number(clinic.avg_nps).toFixed(1) : '—'}</strong>/10 tavsiye
            </p>
          </div>
        </header>

        {/* Felsefe notu */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 leading-relaxed mb-6">
          Estelongy <strong className="text-white">Deneyim Merkezi</strong>. Klinik EGP; sonuç etkinliği (skor Δ),
          tavsiye eğilimi, akreditasyon ve profesyonelliği birleştirerek hesaplanır.
          Az yorumlu klinikler global ortalamaya yaklaştırılır (Bayesian shrinkage).
        </div>

        {/* Yorumlar */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">
            Hasta Deneyimleri
            <span className="ml-2 text-slate-500 text-sm font-normal">({reviews.length} yorum)</span>
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
              <div className="text-4xl opacity-40 mb-2">💬</div>
              <p className="text-white font-semibold">Henüz değerlendirme yok</p>
              <p className="text-slate-500 text-sm mt-1">İlk yorum tamamlanan randevudan sonra görünecek.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => (
                <PublicReviewCard
                  key={r.id}
                  review={r}
                  userName={r.is_anonymous ? null : (profileById.get(r.user_id) ?? null)}
                />
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-center">
          <p className="text-white font-bold text-base mb-1">Bu klinikten randevu almak ister misin?</p>
          <p className="text-slate-300 text-sm mb-4">
            Estelongy ön analizinden sonra klinikler senin skor bandına göre eşleşir.
          </p>
          <Link href="/analiz" className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors">
            Ücretsiz Ön Analiz →
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}

// ───────────────────────────────────────────────────────────────────

function PublicReviewCard({ review, userName }: { review: ClinicReviewRow; userName: string | null }) {
  return (
    <article className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm">
            {userName ?? 'Estelongy Kullanıcısı'}
            {review.is_anonymous && <span className="ml-2 text-[10px] text-slate-600 uppercase">Anonim</span>}
          </p>
          <p className="text-slate-500 text-xs mt-0.5">
            {new Date(review.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-slate-500">Tavsiye</p>
          <p className="text-white font-semibold text-sm">{NPS_LABELS[review.nps] ?? '—'}</p>
        </div>
      </header>

      {review.pozitif_metin && (
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-slate-200 text-sm whitespace-pre-wrap">{review.pozitif_metin}</p>
        </div>
      )}
      {/* iyilestirme_metni private mesajdır — public sayfada gösterilmez */}

      {review.clinic_response && (
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
      )}
    </article>
  )
}
