'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setAutoConfirmAppointments } from '../../actions'

interface Props {
  initial: boolean
}

export default function AutoConfirmCard({ initial }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle() {
    const next = !value
    setValue(next)
    setError(null)
    startTransition(async () => {
      const res = await setAutoConfirmAppointments(next)
      if (!res.ok) {
        setValue(!next)
        setError(res.error ?? 'Kayıt hatası')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="p-5 rounded-2xl border bg-slate-800/50 border-slate-600">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-1">Randevu Kabul</p>
          <p className="text-white font-bold text-base">Otomatik Onay</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={isPending}
          aria-pressed={value}
          className={`w-11 h-6 rounded-full transition-colors flex items-center disabled:opacity-50 ${
            value ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
          } p-0.5`}
        >
          <span className="w-5 h-5 rounded-full bg-white block" />
        </button>
      </div>
      <p className="text-slate-400 text-xs leading-relaxed">
        {value
          ? 'Müsait slot\'a tıklayan hasta randevuyu kesinleştirir. İstediğin zaman iptal edebilirsin.'
          : 'Yeni randevular onay bekler. "Onay Bekleyenler" listesinden onaylayana kadar kesinleşmez.'}
      </p>
      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}
