export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { ClinicReviewRow } from '@/lib/clinic-review'
import { PrivateReplyForm, MarkReadButton } from './PrivateReplyForm'

export const metadata: Metadata = {
  title: 'Mesajlar — Klinik Paneli',
}

type Filter = 'inbox' | 'unread' | 'replied'

export default async function KlinikMesajlarPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!clinic) redirect('/esteklinik/basvur')

  const sp = await searchParams
  const f: Filter = ((sp.f as Filter) ?? 'inbox')

  const { data: rows } = await supabase
    .from('clinic_reviews')
    .select('*')
    .eq('clinic_id', clinic.id)
    .not('iyilestirme_metni', 'is', null)
    .order('created_at', { ascending: false })

  const all = ((rows ?? []) as ClinicReviewRow[])

  const unreadCount = all.filter(r => !r.private_read_at).length
  const repliedCount = all.filter(r => r.private_clinic_response).length

  const filtered = (() => {
    switch (f) {
      case 'unread':       return all.filter(r => !r.private_read_at)
      case 'replied':      return all.filter(r => !!r.private_clinic_response)
      default:             return all
    }
  })()

  // İsim çek (tüm private mesajlar — anonim ayarı public yorumla ilgili, burada isim her zaman görünür)
  const userIds = Array.from(new Set(all.map(r => r.user_id)))
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] }
  const profileById = new Map<string, string>()
  ;(profiles ?? []).forEach(p => {
    profileById.set(p.id as string, (p as { full_name?: string | null }).full_name ?? 'Hasta')
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header>
        <Link href="/klinik/panel" className="text-slate-500 hover:text-white text-sm inline-flex items-center gap-1 mb-2">
          ← Klinik Panel
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Hasta Mesajları</h1>
        <p className="text-slate-400 text-sm mt-1">
          Hastaların sana özel ilettiği <strong className="text-white">dilek, istek, şikayet ve teşekkür</strong> mesajları.
          Bu içerikler klinik sayfanda <strong className="text-white">görünmez</strong> — sadece sen okursun.
        </p>
      </header>

      {/* Filtreler */}
      <nav className="flex flex-wrap gap-2 text-sm">
        <FilterTab href="?f=inbox" active={f === 'inbox'} label="Tümü" count={all.length} />
        <FilterTab href="?f=unread" active={f === 'unread'} label="Okunmamış" count={unreadCount} highlight={unreadCount > 0} />
        <FilterTab href="?f=replied" active={f === 'replied'} label="Yanıtlandı" count={repliedCount} />
      </nav>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
          <div className="text-5xl opacity-40 mb-3">✉️</div>
          <p className="text-white font-semibold">Bu filtrede mesaj yok</p>
          <p className="text-slate-500 text-sm mt-1">Hastaların özel mesajları buraya akacak.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <MessageCard
              key={r.id}
              review={r}
              userName={profileById.get(r.user_id) ?? 'Hasta'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────

function FilterTab({
  href, active, label, count, highlight,
}: { href: string; active: boolean; label: string; count: number; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg border transition-colors ${
        active
          ? 'bg-violet-500/20 border-violet-500 text-white'
          : highlight
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:border-amber-400'
          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
      }`}
    >
      {label}
      <span className="ml-1.5 text-sm opacity-70">({count})</span>
    </Link>
  )
}

function MessageCard({ review, userName }: { review: ClinicReviewRow; userName: string }) {
  const isUnread = !review.private_read_at
  const replied = !!review.private_clinic_response

  return (
    <article
      className={`p-5 rounded-2xl border space-y-3 transition-colors ${
        isUnread ? 'bg-violet-500/5 border-violet-500/30' : 'bg-slate-900 border-slate-800'
      }`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-bold text-sm">{userName}</p>
            {isUnread && (
              <span className="text-sm px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-bold uppercase">
                Yeni
              </span>
            )}
            {replied && (
              <span className="text-sm px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                Yanıtlandı
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date(review.created_at).toLocaleString('tr-TR', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
            {review.private_read_at && (
              <span className="ml-2 text-slate-600">
                · Okundu {new Date(review.private_read_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </p>
        </div>
        {isUnread && <MarkReadButton reviewId={review.id} />}
      </header>

      {/* Mesaj */}
      <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
        <p className="text-slate-200 text-sm whitespace-pre-wrap">{review.iyilestirme_metni}</p>
      </div>

      {/* Klinik yanıt alanı */}
      {replied ? (
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-1">
            <p className="text-emerald-300 text-sm uppercase tracking-wider font-bold">Yanıtın</p>
            {review.private_responded_at && (
              <p className="text-slate-600 text-sm">
                {new Date(review.private_responded_at).toLocaleDateString('tr-TR', {
                  day: 'numeric', month: 'short',
                })}
              </p>
            )}
          </div>
          <p className="text-slate-200 text-sm whitespace-pre-wrap">{review.private_clinic_response}</p>
          <p className="text-sm text-slate-600 mt-1.5 italic">
            Hastanın panelinde yanıtın görünüyor.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm italic text-slate-500">
            İstersen yanıtla — hastanın panelinde görünür. Yanıt vermek zorunlu değil.
          </p>
          <PrivateReplyForm reviewId={review.id} />
        </div>
      )}
    </article>
  )
}
