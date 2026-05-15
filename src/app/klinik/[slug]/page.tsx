import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Footer from '@/components/Footer'
import EsteKlinikNav from '@/app/klinikler/EsteKlinikNav'
import {
  NPS_LABELS,
  egpBadgeColor,
  egpLabel,
  egpDisplayPublic,
  MIN_REVIEWS_THRESHOLD,
  type ClinicReviewRow,
} from '@/lib/clinic-review'
import MeasuringBadge from '@/components/MeasuringBadge'
import { Calendar, MapPin, MessageCircle } from 'lucide-react'

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
  if (!data) return { title: 'Klinik bulunamadı | EsteKlinik' }
  return {
    title: `${data.name} | EsteKlinik`,
    description: data.location
      ? `${data.name} — ${data.location}. EsteKlinik ekosisteminde değerlendirilen klinik.`
      : `${data.name} — EsteKlinik ekosisteminde değerlendirilen klinik.`,
  }
}

export default async function PublicClinicPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, location, bio, specialties, clinic_type, clinic_egp, review_count, avg_operational, avg_nps, logo_url, cover_image_url')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (!clinic) notFound()

  const { data: reviewsRaw } = await supabase
    .from('clinic_reviews')
    .select('*')
    .eq('clinic_id', clinic.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const reviews = (reviewsRaw ?? []) as ClinicReviewRow[]

  const userIds = Array.from(new Set(reviews.map(r => r.user_id)))
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] }
  const profileById = new Map<string, string>()
  ;(profiles ?? []).forEach(p => {
    const fn = (p as { full_name?: string | null }).full_name
    if (fn) profileById.set(p.id as string, fn)
  })

  function maskName(full: string): string {
    return full.trim().split(/\s+/).filter(Boolean).map(part => {
      const first = part.charAt(0).toLocaleUpperCase('tr-TR')
      return first + '*'.repeat(Math.max(part.length - 1, 1))
    }).join(' ')
  }

  const egp = clinic.clinic_egp != null ? Number(clinic.clinic_egp) : null
  const reviewCount = clinic.review_count ?? 0
  const showMeasuringBadge = reviewCount < MIN_REVIEWS_THRESHOLD
  const egpPublic = egpDisplayPublic(egp, reviewCount)

  return (
    <>
      <EsteKlinikNav />

      <main className="bg-white min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <Link href="/klinikler" className="hover:text-[#10876B] transition-colors font-semibold text-[#10876B]">EsteKlinik</Link>
            <span>›</span>
            <span className="text-slate-900 truncate font-medium">{clinic.name}</span>
          </nav>

          {/* Kapak — overlay YOK, görsel net görünür */}
          <div className="relative aspect-[3/1] rounded-2xl overflow-hidden mb-5 border border-slate-200">
            {clinic.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clinic.cover_image_url} alt={clinic.name} className="w-full h-full object-cover" />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#10876B] via-[#0A6347] to-[#064E3B]" />
                <div className="absolute inset-0 opacity-40" style={{
                  backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(110,231,183,0.5), transparent 50%), radial-gradient(circle at 70% 70%, rgba(16,135,107,0.45), transparent 50%)'
                }} />
              </>
            )}
          </div>

          {/* Üst kart: klinik kimlik + EGP rozet */}
          <header className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-start gap-3 mb-2">
                {clinic.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={clinic.logo_url} alt={clinic.name} className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#10876B] to-[#064E3B] flex items-center justify-center text-white font-black text-xl shrink-0">
                    {clinic.name.charAt(0).toLocaleUpperCase('tr-TR')}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{clinic.name}</h1>
                </div>
              </div>
              {clinic.location && (
                <p className="text-slate-500 text-sm mb-3 flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#10876B]" /> {clinic.location}
                </p>
              )}
              {clinic.bio && (
                <p className="text-slate-700 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{clinic.bio}</p>
              )}
              {Array.isArray(clinic.specialties) && clinic.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {clinic.specialties.map((s: string, i: number) => (
                    <span key={i} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-[#10876B]/10 text-[#0E7559] border border-[#10876B]/25">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {showMeasuringBadge ? (
              <MeasuringBadge reviewCount={reviewCount} variant="badge" />
            ) : (
              <div className={`p-6 rounded-2xl border-2 bg-white ${egpBadgeColor(egp)}`}>
                <p className="text-[10px] uppercase tracking-widest opacity-70 font-semibold mb-1">Klinik EGP</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-black">{egpPublic ?? '—'}</span>
                  {egpPublic && egpPublic !== '<7' && <span className="text-xs opacity-70">/10</span>}
                </div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3">{egpLabel(egp)}</p>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  <strong>{reviewCount}</strong> deneyim · son 12 ay
                </p>
              </div>
            )}
          </header>

          {/* Felsefe notu */}
          <div className="p-4 rounded-xl bg-[#FAFAF7] border border-slate-200 text-xs text-slate-600 leading-relaxed mb-6">
            <strong className="text-slate-900">Estelongy Güven Puanı (EGP)</strong>, son 12 ayda
            tavsiye veren hastaların oranı (NHS FFT yöntemi) + Bayesian shrinkage (m=10, C=7) ile hesaplanır.
            {' '}<strong className="text-slate-900">{MIN_REVIEWS_THRESHOLD}</strong> yorum altındaki klinikler &ldquo;Ölçülüyor&rdquo; rozeti taşır.
            Puanı 7&apos;nin altında kalan klinikler hasta tarafında <strong className="text-slate-900">&lt;7</strong> olarak gösterilir.
          </div>

          {/* Yorumlar */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MessageCircle size={18} className="text-[#10876B]" />
              Hasta Deneyimleri
              <span className="ml-1 text-slate-400 text-sm font-normal">({reviews.length} yorum)</span>
            </h2>

            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-[#FAFAF7] rounded-2xl border border-slate-200">
                <div className="text-4xl opacity-30 mb-2">💬</div>
                <p className="text-slate-900 font-semibold">Henüz değerlendirme yok</p>
                <p className="text-slate-500 text-sm mt-1">İlk yorum tamamlanan randevudan sonra görünecek.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(r => {
                  const fullName = profileById.get(r.user_id)
                  const displayName = r.is_anonymous
                    ? (fullName ? maskName(fullName) : 'Estelongy Kullanıcısı')
                    : (fullName ?? 'Estelongy Kullanıcısı')
                  return (
                    <PublicReviewCard
                      key={r.id}
                      review={r}
                      userName={displayName}
                    />
                  )
                })}
              </div>
            )}
          </section>

          {/* CTA */}
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-[#064E3B] via-[#0A6347] to-[#053527] border border-[#10876B]/40 shadow-xl shadow-[#064E3B]/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-white font-bold text-base mb-1">Randevu almak ister misin?</p>
                <p className="text-emerald-100/85 text-sm leading-relaxed">
                  Klinik müsaitliğini gör, doğrudan saat seç. Önceden ön analiz yapmadıysan randevu sonrası yapabilirsin.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Link
                  href={`/randevu?k=${clinic.id}`}
                  className="inline-flex items-center gap-1.5 px-5 py-3 bg-white hover:bg-emerald-50 text-[#064E3B] text-sm font-bold rounded-xl transition-colors shadow-lg"
                >
                  <Calendar size={14} />
                  Randevu Al
                </Link>
                <Link
                  href="/analiz"
                  className="inline-block px-4 py-3 border border-emerald-300/40 hover:border-emerald-200/80 text-emerald-100 hover:text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Ön Analiz
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobil sticky CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-[#064E3B]/95 backdrop-blur-md border-t border-[#10876B]/40">
        <Link
          href={`/randevu?k=${clinic.id}`}
          className="flex items-center justify-center gap-1.5 w-full text-center px-5 py-3 bg-white text-[#064E3B] text-sm font-bold rounded-xl transition-colors shadow-lg"
        >
          <Calendar size={14} />
          Bu Klinikten Randevu Al
        </Link>
      </div>

      <Footer />
    </>
  )
}

// ───────────────────────────────────────────────────────────────────

function PublicReviewCard({ review, userName }: { review: ClinicReviewRow; userName: string | null }) {
  return (
    <article className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-slate-900 font-semibold text-sm">
            {userName ?? 'Estelongy Kullanıcısı'}
            {review.is_anonymous && <span className="ml-2 text-[10px] text-slate-400 uppercase font-medium">Anonim</span>}
          </p>
          <p className="text-slate-500 text-xs mt-0.5">
            {new Date(review.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-slate-400">Tavsiye</p>
          <p className="text-slate-900 font-semibold text-sm">{NPS_LABELS[review.nps] ?? '—'}</p>
        </div>
      </header>

      {review.pozitif_metin && (
        <div className="p-3 rounded-lg bg-[#10876B]/8 border border-[#10876B]/25">
          <p className="text-slate-700 text-sm whitespace-pre-wrap">{review.pozitif_metin}</p>
        </div>
      )}

      {review.clinic_response && (
        <div className="p-3 rounded-lg bg-slate-100 border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[#0E7559] text-[10px] uppercase tracking-wider font-bold">Klinik Cevabı</p>
            {review.clinic_responded_at && (
              <p className="text-slate-400 text-[10px]">
                {new Date(review.clinic_responded_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
          <p className="text-slate-700 text-sm whitespace-pre-wrap">{review.clinic_response}</p>
        </div>
      )}
    </article>
  )
}
