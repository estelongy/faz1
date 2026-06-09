'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Props {
  apptId: string
  status: string
  onConfirm: (id: string) => Promise<{ ok: boolean; error?: string }>
  onReject: (id: string) => Promise<{ ok: boolean; error?: string }>
  onNoShow: (id: string) => Promise<{ ok: boolean; error?: string }>
}

/**
 * Mobil randevu kartı için inline aksiyon butonları.
 * Server action prop'larını çağırır; router.refresh ile listeyi günceller.
 */
export default function TakvimApptActions({ apptId, status, onConfirm, onReject, onNoShow }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  function run(action: 'confirm' | 'reject' | 'noshow') {
    setErr(null)
    startTransition(async () => {
      const fn = action === 'confirm' ? onConfirm : action === 'reject' ? onReject : onNoShow
      const res = await fn(apptId)
      if (!res.ok) setErr(res.error ?? 'Hata')
      else router.refresh()
    })
  }

  if (status !== 'pending' && status !== 'confirmed' && status !== 'in_progress' && status !== 'completed') {
    return null
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      {status === 'pending' && (
        <>
          <button
            type="button"
            onClick={() => run('confirm')}
            disabled={pending}
            className="flex-1 py-3 rounded-xl bg-emerald-600 active:bg-emerald-500 disabled:opacity-40 text-white text-sm font-bold transition-colors"
          >
            {pending ? '…' : 'Onayla'}
          </button>
          <button
            type="button"
            onClick={() => run('reject')}
            disabled={pending}
            className="py-3 px-4 rounded-xl bg-slate-800 active:bg-rose-500/20 text-slate-400 active:text-rose-300 text-sm font-bold border border-slate-700"
            aria-label="Reddet"
          >
            ✕
          </button>
        </>
      )}
      {status === 'confirmed' && (
        <>
          <Link
            href={`/klinik/panel/randevu/${apptId}`}
            className="flex-1 text-center py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-bold active:bg-emerald-500/25"
          >
            Hasta geldi →
          </Link>
          <button
            type="button"
            onClick={() => run('noshow')}
            disabled={pending}
            className="py-3 px-3 rounded-xl bg-slate-800 active:bg-rose-500/20 text-slate-400 text-sm font-bold border border-slate-700"
            aria-label="Gelmedi"
          >
            ⊘
          </button>
          <button
            type="button"
            onClick={() => run('reject')}
            disabled={pending}
            className="py-3 px-3 rounded-xl bg-slate-800 active:bg-rose-500/20 text-slate-400 text-sm font-bold border border-slate-700"
            aria-label="İptal"
          >
            ✕
          </button>
        </>
      )}
      {status === 'in_progress' && (
        <Link
          href={`/klinik/panel/randevu/${apptId}`}
          className="flex-1 text-center py-3 rounded-xl bg-emerald-600 active:bg-emerald-500 text-white text-sm font-bold"
        >
          Akışı sürdür →
        </Link>
      )}
      {status === 'completed' && (
        <Link
          href={`/klinik/panel/randevu/${apptId}`}
          className="flex-1 text-center py-3 rounded-xl bg-slate-800 active:bg-slate-700 text-slate-300 text-sm font-semibold border border-slate-700"
        >
          Detayı gör →
        </Link>
      )}
      {err && (
        <div className="basis-full mt-1 flex items-center gap-2 flex-wrap">
          <p className="text-rose-400 text-xs">{err}</p>
          {/^.*kredi.*$/i.test(err) && (
            <Link
              href="/klinik/panel/kredi"
              className="text-xs font-bold text-amber-300 active:text-amber-200 underline underline-offset-2"
            >
              Kredi yükle →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
