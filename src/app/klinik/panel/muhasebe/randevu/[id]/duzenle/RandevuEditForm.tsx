'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateAppointment } from '../../../actions'

const DURATIONS = [10, 15, 20, 30, 45, 60, 90, 120]
const APPOINTMENT_TYPES = ['İlk Muayene', 'Kontrol', 'İşlem', 'Konsültasyon']

interface AppointmentLite {
  id: string
  start_at: string
  duration_minutes: number
  appointment_type: string | null
  treatment_type: string | null
  reason: string | null
  detail: string | null
}

export default function RandevuEditForm({ appointment }: { appointment: AppointmentLite }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const start = new Date(appointment.start_at)
  const yyyy = start.getFullYear()
  const mm = String(start.getMonth() + 1).padStart(2, '0')
  const dd = String(start.getDate()).padStart(2, '0')
  const hh = String(start.getHours()).padStart(2, '0')
  const mi = String(start.getMinutes()).padStart(2, '0')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('id', appointment.id)
    startTransition(async () => {
      const res = await updateAppointment(fd)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.push('/klinik/panel/muhasebe/randevu')
      router.refresh()
    })
  }

  const labelCls = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5'
  const inputCls = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-base placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30'
  const selectCls = inputCls + ' appearance-none'
  const card = 'bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-5 sm:p-6'

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className={card}>
        <h2 className="text-white text-base font-bold mb-4">Randevu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={labelCls}>Randevu Tipi</label>
            <select name="appointment_type" defaultValue={appointment.appointment_type ?? ''} className={selectCls}>
              <option value="">— Seçim yok —</option>
              {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Tedavi Tipi</label>
            <input
              name="treatment_type"
              type="text"
              maxLength={120}
              defaultValue={appointment.treatment_type ?? ''}
              placeholder="örn. HA Dolgu"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Başlangıç Tarihi <span className="text-rose-400">*</span></label>
            <input name="date" type="date" required defaultValue={`${yyyy}-${mm}-${dd}`} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Saat <span className="text-rose-400">*</span></label>
            <input name="time" type="time" required defaultValue={`${hh}:${mi}`} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Süre (dk) <span className="text-rose-400">*</span></label>
            <select name="duration_minutes" defaultValue={appointment.duration_minutes} className={selectCls}>
              {DURATIONS.map(d => <option key={d} value={d}>{d} dakika</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className={card}>
        <h2 className="text-white text-base font-bold mb-4">Notlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Geliş Sebebi</label>
            <textarea name="reason" rows={3} maxLength={500} defaultValue={appointment.reason ?? ''} className={inputCls + ' resize-y'} />
          </div>
          <div>
            <label className={labelCls}>Randevu Detayı</label>
            <textarea name="detail" rows={3} maxLength={500} defaultValue={appointment.detail ?? ''} className={inputCls + ' resize-y'} />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-300 text-sm font-medium">{error}</div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="px-5 py-2.5 text-slate-300 hover:text-white text-base font-semibold">
          İptal
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white text-base font-bold rounded-xl shadow-lg shadow-violet-500/20"
        >
          {pending ? 'Kaydediliyor…' : 'Güncelle'}
        </button>
      </div>
    </form>
  )
}
