'use client'

import { useState, useTransition } from 'react'
import { updateVideoProgress } from './actions'

interface Props {
  videoId: string
  packageId: string
  slug: string
  streamUid: string | null
  streamStatus: string
  duration: number
  initialWatched: number
  initialCompleted: boolean
}

/**
 * Video player — Cloudflare Stream iframe ile.
 *
 * Stream UID'si yoksa veya status 'ready' değilse "hazırlanıyor" placeholder gösterir.
 * "Tamamlandı işaretle" butonu ile manual progress (otomatik tracking Stream Embed
 * postMessage API ile sonra eklenecek; şimdilik manuel tamamlama yeterli).
 */
export default function VideoPlayer({
  videoId,
  packageId,
  slug,
  streamUid,
  streamStatus,
  duration,
  initialWatched,
  initialCompleted,
}: Props) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggleComplete() {
    setError(null)
    const next = !completed
    setCompleted(next)

    const fd = new FormData()
    fd.set('video_id', videoId)
    fd.set('package_id', packageId)
    fd.set('slug', slug)
    fd.set('completed', String(next))
    fd.set('watched_seconds', String(next ? duration : initialWatched))

    startTransition(async () => {
      try {
        await updateVideoProgress(fd)
      } catch (e) {
        setCompleted(!next) // revert
        setError(e instanceof Error ? e.message : 'İlerleme güncellenemedi.')
      }
    })
  }

  // Cloudflare Stream embed
  const accountId = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE
  const canPlay = !!streamUid && streamStatus === 'ready'
  const embedUrl = canPlay && accountId
    ? `https://customer-${accountId}.cloudflarestream.com/${streamUid}/iframe`
    : canPlay
    ? `https://iframe.cloudflarestream.com/${streamUid}`
    : null

  return (
    <div className="space-y-3">
      <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            <div className="text-5xl mb-3">🎬</div>
            <p className="text-sm font-medium text-slate-300 mb-1">Video hazırlanıyor</p>
            <p className="text-sm">
              {streamStatus === 'pending'
                ? 'Eğitmen henüz video yüklemedi.'
                : streamStatus === 'processing'
                ? 'Video kodlanıyor, kısa süre içinde izlenebilir olacak.'
                : streamStatus === 'error'
                ? 'Video işlenemedi, eğitmenle iletişime geçildi.'
                : 'Video yakında hazır.'}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={toggleComplete}
          disabled={pending}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
            completed
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          <span>{completed ? '✓' : '○'}</span>
          <span>{completed ? 'Tamamlandı' : 'Tamamlandı işaretle'}</span>
        </button>
        {error && (
          <span className="text-red-400 text-sm">{error}</span>
        )}
      </div>
    </div>
  )
}
