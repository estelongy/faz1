'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createAppointment } from '../../actions'
import TimeSlotPicker from '../TimeSlotPicker'
import type { AvailabilityWeek } from '../slot-utils'

const DURATIONS = [
  { value: 10, label: '10 dakika' },
  { value: 15, label: '15 dakika' },
  { value: 20, label: '20 dakika' },
  { value: 30, label: '30 dakika' },
  { value: 45, label: '45 dakika' },
  { value: 60, label: '60 dakika' },
  { value: 90, label: '90 dakika' },
  { value: 120, label: '120 dakika' },
]

const APPOINTMENT_TYPES = [
  'İlk Muayene',
  'Kontrol',
  'İşlem',
  'Konsültasyon',
]

const FREQ_OPTIONS = [
  { value: 'weekly', label: 'Haftalık' },
  { value: 'biweekly', label: '2 Haftalık' },
  { value: 'triweekly', label: '3 Haftalık' },
  { value: 'monthly', label: 'Aylık' },
]

const MONTH_OPTIONS = [1, 2, 3, 4, 5, 6]

interface Props {
  initialDate?: string
  initialTime?: string
  week: AvailabilityWeek
  doctorName: string
}

export default function YeniRandevuForm({ initialDate, initialTime, week, doctorName }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isRecurring, setIsRecurring] = useState(false)

  // varsayılan tarih: query'den gelirse o, yoksa bugün
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const defaultDate = initialDate ?? `${yyyy}-${mm}-${dd}`
  const defaultTime = initialTime ?? '09:00'

  // Date state — picker bunun availability'sini kullanır
  const [date, setDate] = useState(defaultDate)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createAppointment(fd)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.push('/klinik/panel/muhasebe')
      router.refresh()
    })
  }

  const labelCls = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5'
  const inputCls = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-base placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30'
  const selectCls = inputCls + ' appearance-none'
  const card = 'bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-5 sm:p-6'

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* HASTA */}
      <div className={card}>
        <h2 className="text-white text-base font-bold mb-4">Hasta</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className={labelCls}>Telefon <span className="text-rose-400">*</span></label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-slate-800 border border-r-0 border-slate-700 rounded-l-lg text-slate-400 text-sm font-medium">🇹🇷 +90</span>
              <input
                name="phone"
                type="tel"
                inputMode="numeric"
                maxLength={13}
                required
                placeholder="5XX XXX XX XX"
                className={inputCls + ' rounded-l-none'}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Ad <span className="text-rose-400">*</span></label>
            <input name="first_name" type="text" required maxLength={60} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Soyad <span className="text-rose-400">*</span></label>
            <input name="last_name" type="text" required maxLength={60} className={inputCls} />
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-3">
          Telefon eşleşirse mevcut hasta kaydı kullanılır. Eşleşme yoksa yeni kayıt açılır.
        </p>
      </div>

      {/* RANDEVU */}
      <div className={card}>
        <h2 className="text-white text-base font-bold mb-4">Randevu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={labelCls}>Doktor</label>
            <input value={doctorName} disabled className={inputCls + ' opacity-70 cursor-not-allowed'} />
          </div>
          <div>
            <label className={labelCls}>Randevu Tipi</label>
            <select name="appointment_type" defaultValue="" className={selectCls}>
              <option value="">— Seçim yok —</option>
              {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tedavi Tipi</label>
            <input name="treatment_type" type="text" maxLength={120} placeholder="örn. HA Dolgu" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>Başlangıç Tarihi <span className="text-rose-400">*</span></label>
            <input name="date" type="date" required value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Randevu Süresi <span className="text-rose-400">*</span></label>
            <select name="duration_minutes" defaultValue={30} className={selectCls}>
              {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Randevu Saati <span className="text-rose-400">*</span></label>
          <TimeSlotPicker name="time" defaultValue={defaultTime} isoDate={date} week={week} />
        </div>
      </div>

      {/* TEKRARLAYAN */}
      <div className={card}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="is_recurring"
            checked={isRecurring}
            onChange={e => setIsRecurring(e.target.checked)}
            className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-violet-600 focus:ring-violet-500 focus:ring-offset-0"
          />
          <span className="text-white font-semibold">Tekrarlayan Randevu</span>
        </label>

        {isRecurring && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={labelCls}>Yenilenme Sıklığı <span className="text-rose-400">*</span></label>
              <select name="recurrence_freq" defaultValue="weekly" className={selectCls} required={isRecurring}>
                {FREQ_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Süre <span className="text-rose-400">*</span></label>
              <select name="recurrence_months" defaultValue={1} className={selectCls} required={isRecurring}>
                {MONTH_OPTIONS.map(m => <option key={m} value={m}>{m} Ay</option>)}
              </select>
            </div>
            <p className="md:col-span-2 text-slate-500 text-xs">
              İlk randevu seçilen tarihte oluşturulur, ardından bu sıklık ve süreye göre ek randevular otomatik üretilir.
            </p>
          </div>
        )}
      </div>

      {/* NOTLAR */}
      <div className={card}>
        <h2 className="text-white text-base font-bold mb-4">Notlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Geliş Sebebi</label>
            <textarea name="reason" rows={3} maxLength={500} className={inputCls + ' resize-y'} />
          </div>
          <div>
            <label className={labelCls}>Randevu Detayı</label>
            <textarea name="detail" rows={3} maxLength={500} className={inputCls + ' resize-y'} />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-300 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-slate-300 hover:text-white text-base font-semibold"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-bold rounded-xl transition-all shadow-lg shadow-violet-500/20"
        >
          {pending ? 'Kaydediliyor…' : 'Randevu Oluştur'}
        </button>
      </div>
    </form>
  )
}
