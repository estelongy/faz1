import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import type { ClinicReviewRow } from '@/lib/clinic-review'
import {
  PrivateReplyForm,
  MarkReadButton,
} from '@/app/klinik/panel/mesajlar/PrivateReplyForm'

type Filter = 'inbox' | 'unread' | 'replied'

interface Props {
  rows: ClinicReviewRow[]
  filtered: ClinicReviewRow[]
  profileById: Map<string, string>
  activeFilter: Filter
  unreadCount: number
  repliedCount: number
}

/**
 * EsteKlinikPRO app — /klinik/panel/mesajlar mobil görünümü.
 * Filtre pill bar (yatay scroll) + chat-benzeri thread listesi.
 */
export default function MesajlarAppView({
  rows,
  filtered,
  profileById,
  activeFilter,
  unreadCount,
  repliedCount,
}: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-2">
        <p className="text-sm text-slate-400">
          Hastaların özel mesajları —{' '}
          <span className="text-white font-bold">{rows.length}</span> toplam,{' '}
          <span className={unreadCount > 0 ? 'text-amber-300 font-bold' : 'text-white'}>
            {unreadCount} okunmamış
          </span>
          .
        </p>
      </header>

      {/* Filtre pill bar */}
      <nav className="px-5 mt-2 flex gap-2 overflow-x-auto -mx-1 px-1">
        <Pill href="?f=inbox" active={activeFilter === 'inbox'} label="Tümü" count={rows.length} />
        <Pill
          href="?f=unread"
          active={activeFilter === 'unread'}
          label="Okunmamış"
          count={unreadCount}
          highlight={unreadCount > 0}
        />
        <Pill
          href="?f=replied"
          active={activeFilter === 'replied'}
          label="Yanıtlandı"
          count={repliedCount}
        />
      </nav>

      {filtered.length === 0 ? (
        <section className="px-5 mt-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center">
            <MessageCircle size={32} className="mx-auto text-slate-600" />
            <p className="mt-2 text-white font-semibold">Bu filtrede mesaj yok</p>
            <p className="mt-1 text-sm text-slate-400">Özel mesajlar buraya akar.</p>
          </div>
        </section>
      ) : (
        <section className="mt-4 px-5 space-y-3">
          {filtered.map(r => (
            <Thread
              key={r.id}
              review={r}
              userName={profileById.get(r.user_id) ?? 'Hasta'}
            />
          ))}
        </section>
      )}
    </div>
  )
}

function Pill({
  href,
  active,
  label,
  count,
  highlight,
}: {
  href: string
  active: boolean
  label: string
  count: number
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 px-3.5 py-2 rounded-full border text-xs font-bold transition-colors ${
        active
          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          : highlight
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          : 'bg-slate-900 border-slate-800 text-slate-400'
      }`}
    >
      {label}
      <span className="ml-1.5 opacity-70">{count}</span>
    </Link>
  )
}

function Thread({ review, userName }: { review: ClinicReviewRow; userName: string }) {
  const isUnread = !review.private_read_at
  const replied = !!review.private_clinic_response
  const initial = (userName[0] ?? '?').toUpperCase()

  return (
    <article
      className={`rounded-2xl border p-4 space-y-3 ${
        isUnread ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800'
      }`}
    >
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-300 font-bold shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-bold text-sm">{userName}</p>
            {isUnread && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                Yeni
              </span>
            )}
            {replied && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-bold uppercase">
                Yanıtlandı
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            {new Date(review.created_at).toLocaleString('tr-TR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        {isUnread && <MarkReadButton reviewId={review.id} />}
      </header>

      <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-3">
        <p className="text-slate-200 text-sm whitespace-pre-wrap">{review.iyilestirme_metni}</p>
      </div>

      {replied ? (
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3">
          <p className="text-emerald-300 text-[10px] uppercase tracking-wider font-bold mb-1">
            Yanıtın
          </p>
          <p className="text-slate-200 text-sm whitespace-pre-wrap">
            {review.private_clinic_response}
          </p>
        </div>
      ) : (
        <PrivateReplyForm reviewId={review.id} />
      )}
    </article>
  )
}
