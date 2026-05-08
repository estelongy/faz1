export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import { NPS_LABELS } from '@/lib/clinic-review'
import GecmisTabs from '@/components/GecmisTabs'

export const metadata: Metadata = {
  title: 'Yorumlarım — Estelongy',
}

interface AppointmentRow {
  id: string
  appointment_date: string | null
  status: string
  completed_at: string | null
  clinics: { id: string; name: string; slug: string | null } | null
}

interface ReviewRow {
  id: string
  appointment_id: string
  clinic_id: string
  nps: number
  pozitif_metin: string | null
  iyilestirme_metni: string | null
  is_anonymous: boolean
  edit_window_until: string
  clinic_response: string | null
  clinic_responded_at: string | null
  private_wants_reply: boolean
  private_clinic_response: string | null
  private_responded_at: string | null
  created_at: string
}

export default async function YorumlarimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role && role !== 'user') redirect(pathForRole(role))

  // Tamamlanmış randevular
  const { data: apptsRaw } = await supabase
    .from('appointments')
    .select('id, appointment_date, status, completed_at, clinics(id, name, slug)')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  const appts = (apptsRaw ?? []) as unknown as AppointmentRow[]
  const apptIds = appts.map(a => a.id)

  const { data: reviewsRaw } = apptIds.length > 0
    ? await supabase
        .from('clinic_reviews')
        .select('id, appointment_id, clinic_id, nps, pozitif_metin, iyilestirme_metni, is_anonymous, edit_window_until, clinic_response, clinic_responded_at, private_wants_reply, private_clinic_response, private_responded_at, created_at')
        .eq('user_id', user.id)
        .in('appointment_id', apptIds)
    : { data: [] }

  const reviews = (reviewsRaw ?? []) as ReviewRow[]
  const reviewByApptId = new Map<string, ReviewRow>()
  reviews.forEach(r => reviewByApptId.set(r.appointment_id, r))

  const totalReviews = reviews.length
  const yanitGelen = reviews.filter(
    r => !!r.private_clinic_response || !!r.clinic_response,
  ).length
  const bekleyen = appts.length - totalReviews

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 lg:left-[72px] right-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/panel" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 hover:bg-slate-800/40 text-slate-300 hover:text-white text-sm font-medium transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Panel
          </Link>
          <span className="text-white font-bold text-sm">Yorumlarım</span>
          <span className="w-[68px]" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16 space-y-6">

        <GecmisTabs active="yorumlar" yorumCount={totalReviews} unrespondedReplyCount={bekleyen > 0 ? bekleyen : undefined} />

        {/* Özet */}
        <section className="grid grid-cols-3 gap-3">
          <StatBox label="Yorum Yaptın" value={`${totalReviews}`} />
          <StatBox label="Yanıt Geldi" value={`${yanitGelen}`} accent="emerald" />
          <StatBox label="Beklemede" value={`${bekleyen}`} accent={bekleyen > 0 ? 'amber' : undefined} />
        </section>

        {/* Lansman özet metni */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs text-slate-400 leading-relaxed">
            Tamamlanmış randevuların burada listelenir. Her birine{' '}
            <strong className="text-white">7 gün</strong> içinde yorum yazabilirsin —
            sonrasında yorumun kalıcılaşır. Klinikten gelen{' '}
            <strong className="text-violet-300">özel yanıtlar</strong> da burada görünür.
          </p>
        </div>

        {appts.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
            <div className="text-5xl opacity-40 mb-3">💬</div>
            <p className="text-white font-semibold">Tamamlanmış randevun yok</p>
            <p className="text-slate-500 text-sm mt-1">Klinik ziyareti tamamlandığında burada listelenir.</p>
          </div>
        ) : (
          <section className="space-y-3">
            {appts.map(a => (
              <RandevuYorumKarti
                key={a.id}
                appt={a}
                review={reviewByApptId.get(a.id) ?? null}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

// ─────────────────────────────────────────────────────────────────

function StatBox({
  label, value, accent,
}: { label: string; value: string; accent?: 'emerald' | 'amber' }) {
  const accentText =
    accent === 'emerald' ? 'text-emerald-400' :
    accent === 'amber' ? 'text-amber-400' :
    'text-white'
  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
      <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-black ${accentText}`}>{value}</p>
    </div>
  )
}

function RandevuYorumKarti({
  appt, review,
}: { appt: AppointmentRow; review: ReviewRow | null }) {
  const clinicName = appt.clinics?.name ?? 'Klinik'
  const clinicSlug = appt.clinics?.slug ?? null
  const dateStr = appt.completed_at ?? appt.appointment_date
  const dateLabel = dateStr
    ? new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  if (!review) {
    return (
      <article className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-bold text-sm">{clinicName}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
              Yorum Bekliyor
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">{dateLabel}</p>
          <p className="text-slate-400 text-xs mt-2">
            Bu ziyareti henüz değerlendirmedin. Deneyimini paylaşmak ister misin?
          </p>
        </div>
        <Link
          href={`/panel/degerlendir/${appt.id}`}
          className="shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Yorum Yaz
        </Link>
      </article>
    )
  }

  const editLocked = new Date(review.edit_window_until) < new Date()
  const hasPublicResponse = !!review.clinic_response
  const hasPrivateResponse = !!review.private_clinic_response
  const hasPrivateMessage = !!review.iyilestirme_metni

  return (
    <article className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-bold text-sm">{clinicName}</p>
            {!editLocked && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                Düzenlenebilir
              </span>
            )}
            {(hasPublicResponse || hasPrivateResponse) && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                Yanıt Geldi
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            {dateLabel} · Tavsiye: <span className="text-slate-300">{NPS_LABELS[review.nps] ?? '—'}</span>
            {review.is_anonymous && <span className="ml-2 text-slate-600">· Anonim</span>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {!editLocked && (
            <Link
              href={`/panel/degerlendir/${appt.id}`}
              className="px-3 py-1 text-[10px] uppercase tracking-wider rounded-md border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition-colors"
            >
              Düzenle
            </Link>
          )}
          {clinicSlug && (
            <Link
              href={`/klinik/${clinicSlug}`}
              className="text-[10px] text-slate-500 hover:text-emerald-400"
            >
              Klinik sayfası →
            </Link>
          )}
        </div>
      </header>

      {/* Public yorum */}
      {review.pozitif_metin && (
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-emerald-300 text-[10px] uppercase tracking-wider font-bold mb-1">
            Public Yorumun
          </p>
          <p className="text-slate-200 text-sm whitespace-pre-wrap">{review.pozitif_metin}</p>
        </div>
      )}

      {/* Public yoruma klinik yanıtı */}
      {hasPublicResponse && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 ml-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-emerald-300 text-[10px] uppercase tracking-wider font-bold">
              ↳ {clinicName} yanıtladı
            </p>
            {review.clinic_responded_at && (
              <p className="text-slate-600 text-[10px]">
                {new Date(review.clinic_responded_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
          <p className="text-slate-200 text-sm whitespace-pre-wrap">{review.clinic_response}</p>
        </div>
      )}

      {/* Private mesaj */}
      {hasPrivateMessage && (
        <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
          <div className="flex items-center justify-between mb-1">
            <p className="text-violet-300 text-[10px] uppercase tracking-wider font-bold">
              🔒 Özel Mesajın
            </p>
            {review.private_wants_reply && !hasPrivateResponse && (
              <span className="text-[10px] text-amber-400">Yanıt bekleniyor…</span>
            )}
          </div>
          <p className="text-slate-300 text-sm whitespace-pre-wrap">{review.iyilestirme_metni}</p>
          <p className="text-[10px] text-slate-600 mt-1.5 italic">
            Bu mesaj sadece kliniğe gönderildi.
          </p>
        </div>
      )}

      {/* Private yanıt */}
      {hasPrivateResponse && (
        <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30 ml-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-violet-300 text-[10px] uppercase tracking-wider font-bold">
              ↳ {clinicName} özel yanıt verdi
            </p>
            {review.private_responded_at && (
              <p className="text-slate-600 text-[10px]">
                {new Date(review.private_responded_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
          <p className="text-slate-200 text-sm whitespace-pre-wrap">{review.private_clinic_response}</p>
        </div>
      )}
    </article>
  )
}
