'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FilterInput } from '@/components/FilterInput'
import { BRANCHES, ALL_TREATMENTS, LOCATIONS, branchMatches, locationMatches } from '@/lib/randevu-filters'
import RandevuOnayModal, { type RandevuTaslak } from '@/components/RandevuOnayModal'
import ClinicPreviewModal from '@/components/ClinicPreviewModal'
import { formatClinicName, formatClinicTypeEyebrow, formatLocation } from '@/lib/clinic-format'
import { egpBadgeColor, egpDisplayPublic, MIN_REVIEWS_THRESHOLD } from '@/lib/clinic-review'
import MeasuringBadge from '@/components/MeasuringBadge'

import SafeLink from '@/components/SafeLink'
interface Clinic {
  id: string
  name: string
  location: string | null
  bio: string | null
  specialties: string[] | null
  clinic_type: string | null
  clinic_egp?: number | null
  review_count?: number | null
  avg_nps?: number | null
  logo_url?: string | null
  cover_image_url?: string | null
}

interface Availability {
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  is_active: boolean
}

interface Props {
  /** Gömülü mod: <main>/<header> render etmez, kompakt iç görünüm */
  embedded?: boolean
  /** Önceden seçilmiş klinik ID'si (paylaşım linki vs) */
  preselectedClinicId?: string | null
  /** Önceden seçilmiş tedavi türü (filtre) */
  preselectedTip?: string | null
  /** Önceden seçilmiş gün (YYYY-MM-DD) — kart slot popover'dan gelir */
  preselectedDate?: string | null
  /** Önceden seçilmiş saat (HH:MM) — kart slot popover'dan gelir */
  preselectedTime?: string | null
  /** Başarı callback'i (gömülü kullanım için) */
  onSuccess?: () => void
}

function getNext14Days() {
  const days: Date[] = []
  const today = new Date()
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d)
  }
  return days
}

function timeToMinutes(t: string): number { const [h, m] = t.split(':').map(Number); return h * 60 + m }
function minutesToTime(min: number): string { const h = Math.floor(min / 60); const m = min % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` }

function generateSlots(avail: Availability | undefined): string[] {
  if (!avail || !avail.is_active) return []
  const start = timeToMinutes(avail.start_time)
  const end = timeToMinutes(avail.end_time)
  const step = avail.slot_duration_minutes || 30
  const slots: string[] = []
  for (let t = start; t + step <= end; t += step) slots.push(minutesToTime(t))
  return slots
}

export default function RandevuFlow({ embedded = false, preselectedClinicId, preselectedTip, preselectedDate, preselectedTime, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [taslak, setTaslak] = useState<RandevuTaslak | null>(null)
  const [previewClinic, setPreviewClinic] = useState<Clinic | null>(null)

  const [filterUzman, setFilterUzman] = useState<string>('')
  const [filterBranch, setFilterBranch] = useState<string>(preselectedTip ?? '')
  const [filterTreatment, setFilterTreatment] = useState<string>('')
  const [filterLocation, setFilterLocation] = useState<string>('')

  const [availability, setAvailability] = useState<Availability[]>([])
  const [busySlots, setBusySlots] = useState<Set<string>>(new Set())
  const [loadingAvail, setLoadingAvail] = useState(false)

  const allDays = useMemo(getNext14Days, [])

  const days = useMemo(() => {
    if (availability.length === 0) return allDays
    const activeDays = new Set(availability.filter(a => a.is_active).map(a => a.day_of_week))
    return allDays.filter(d => activeDays.has(d.getDay()))
  }, [allDays, availability])

  const daySlots = useMemo(() => {
    if (!selectedDay) return []
    const dow = selectedDay.getDay()
    const avail = availability.find(a => a.day_of_week === dow)
    return generateSlots(avail)
  }, [selectedDay, availability])

  const busyForDay = useMemo(() => {
    if (!selectedDay) return new Set<string>()
    const dateKey = selectedDay.toISOString().split('T')[0]
    const out = new Set<string>()
    busySlots.forEach(s => { if (s.startsWith(dateKey)) out.add(s.split(' ')[1]) })
    return out
  }, [selectedDay, busySlots])

  const uzmanSuggestions = useMemo(() => clinics.map(c => c.name).sort((a, b) => a.localeCompare(b, 'tr')), [clinics])

  const filteredClinics = useMemo(() => {
    return clinics.filter(c => {
      if (filterUzman && !c.name.toLowerCase().includes(filterUzman.toLowerCase())) return false
      if (filterBranch && !branchMatches(c.clinic_type, filterBranch)) return false
      if (filterTreatment && !(c.specialties?.some(s => s.toLowerCase().includes(filterTreatment.toLowerCase())))) return false
      if (filterLocation && !locationMatches(c.location, filterLocation)) return false
      return true
    })
  }, [clinics, filterUzman, filterBranch, filterTreatment, filterLocation])

  const hasFilter = !!(filterUzman || filterBranch || filterTreatment || filterLocation)
  function clearAllFilters() { setFilterUzman(''); setFilterBranch(''); setFilterTreatment(''); setFilterLocation('') }

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('clinics_with_credit_status')
      .select('id, name, location, bio, specialties, clinic_type, clinic_egp, review_count, avg_nps, logo_url, cover_image_url')
      .eq('approval_status', 'approved')
      .eq('is_active', true)
      .gt('total_credit_balance', 0)
      .then(({ data }) => {
        const list = (data ?? []) as Clinic[]
        setClinics(list)
        setLoading(false)
        if (preselectedClinicId) {
          const preselected = list.find(c => c.id === preselectedClinicId)
          if (preselected) {
            setSelectedClinic(preselected)
            setStep(2)
          }
        }
      })
  }, [preselectedClinicId])

  useEffect(() => {
    if (!selectedClinic) {
      setAvailability([])
      setBusySlots(new Set())
      setSelectedDay(null)
      setSelectedTime(null)
      return
    }
    const supabase = createClient()
    setLoadingAvail(true)

    Promise.all([
      supabase
        .from('clinic_availability')
        .select('day_of_week, start_time, end_time, slot_duration_minutes, is_active')
        .eq('clinic_id', selectedClinic.id),
      supabase
        .from('appointments')
        .select('appointment_date')
        .eq('clinic_id', selectedClinic.id)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .gte('appointment_date', new Date().toISOString())
        .lte('appointment_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]).then(([availRes, apptRes]) => {
      setAvailability((availRes.data ?? []) as Availability[])
      const busy = new Set<string>()
      for (const a of apptRes.data ?? []) {
        const dt = new Date(a.appointment_date)
        const dateKey = dt.toISOString().split('T')[0]
        const timeKey = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
        busy.add(`${dateKey} ${timeKey}`)
      }
      setBusySlots(busy)
      setLoadingAvail(false)
    })
  }, [selectedClinic])

  // Kart slot popover'dan gelen preselected d + t — Adım 3'e atla
  useEffect(() => {
    if (!selectedClinic || !preselectedDate || !preselectedTime) return
    if (availability.length === 0 || loadingAvail) return
    const d = new Date(preselectedDate + 'T00:00:00')
    if (isNaN(d.getTime())) return
    setSelectedDay(d)
    setSelectedTime(preselectedTime)
    setStep(3)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClinic, preselectedDate, preselectedTime, availability, loadingAvail])

  // Adım 2'de ilk MÜSAİT SLOT'U OLAN günü varsayılan seç (slot'lar hemen görünsün).
  // Sadece klinik açık olan ilk günü seçmek yetmez — o günün tüm saatleri rezerve olmuş olabilir.
  // Boş slot'u olan ilk günü bul; hepsi doluysa fallback olarak ilk günü seç.
  useEffect(() => {
    if (step !== 2 || loadingAvail || selectedDay) return
    if (days.length === 0) return

    const firstWithFreeSlot = days.find(d => {
      const dow = d.getDay()
      const avail = availability.find(a => a.day_of_week === dow)
      const slots = generateSlots(avail)
      const dateKey = d.toISOString().split('T')[0]
      return slots.some(s => !busySlots.has(`${dateKey} ${s}`))
    })

    setSelectedDay(firstWithFreeSlot ?? days[0])
  }, [step, days, loadingAvail, selectedDay, availability, busySlots])

  async function handleConfirm() {
    if (!selectedClinic || !selectedDay || !selectedTime) return
    setSaving(true)
    setError(null)

    const [h, m] = selectedTime.split(':').map(Number)
    const dt = new Date(selectedDay)
    dt.setHours(h, m, 0, 0)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setTaslak({
        clinicId: selectedClinic.id,
        clinicName: selectedClinic.name,
        dateTime: dt.toISOString(),
        dayLabel: selectedDay.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        timeLabel: selectedTime,
        notes: notes,
      })
      setShowOtpModal(true)
      setSaving(false)
      return
    }

    const { error: err } = await supabase.from('appointments').insert({
      user_id: user.id,
      clinic_id: selectedClinic.id,
      appointment_date: dt.toISOString(),
      status: 'pending',
      notes: notes || null,
    })

    if (err) { setError('Randevu oluşturulamadı. Lütfen tekrar deneyin.'); setSaving(false); return }
    setSuccess(true)
    if (embedded && onSuccess) {
      setTimeout(() => onSuccess(), 1500)
    }
  }

  // ─── Success Render ──────────────────────────────────────────────────────
  if (success) {
    const successContent = (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Randevunuz Alındı!</h2>
        <p className="text-slate-400 mb-2">
          <span className="text-white font-medium">{selectedClinic?.name}</span> kliniği için
        </p>
        <p className="text-emerald-400 font-medium mb-8">
          {selectedDay?.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} · {selectedTime}
        </p>
        {!embedded && (
          <SafeLink href="/panel" className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl">
            Panele Dön
          </SafeLink>
        )}
      </div>
    )
    return embedded ? <div className="py-8">{successContent}</div> : (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        {successContent}
      </main>
    )
  }

  // ─── Ana İçerik ──────────────────────────────────────────────────────────
  const content = (
    <>
      {/* ADIM 1 — Klinik Seç */}
      {step === 1 && (
        <div>
          <div className="mb-6">
            <h1 className={`font-bold text-white ${embedded ? 'text-xl' : 'text-2xl'}`}>Klinik Seçin</h1>
            <p className="text-slate-400 text-sm mt-1">Onaylı kliniklerimizden birini seçin</p>
          </div>

          {!loading && clinics.length > 0 && (
            <div className="mb-6 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <FilterInput
                  placeholder="Uzman ara... (ör: İzzet Gök)"
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                  value={filterUzman}
                  suggestions={uzmanSuggestions}
                  onSelect={setFilterUzman}
                  onClear={() => setFilterUzman('')}
                />
                <FilterInput
                  placeholder="Branş ara... (ör: Cildiye)"
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                  value={filterBranch}
                  suggestions={BRANCHES}
                  onSelect={setFilterBranch}
                  onClear={() => setFilterBranch('')}
                />
                <FilterInput
                  placeholder="Tedavi ara... (ör: Meme dikleştirme)"
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                  value={filterTreatment}
                  suggestions={ALL_TREATMENTS}
                  onSelect={setFilterTreatment}
                  onClear={() => setFilterTreatment('')}
                />
                <FilterInput
                  placeholder="Konum ara... (ör: Beylikdüzü)"
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                  value={filterLocation}
                  suggestions={LOCATIONS}
                  onSelect={setFilterLocation}
                  onClear={() => setFilterLocation('')}
                />
              </div>
              {hasFilter && (
                <div className="flex items-center justify-between text-sm pt-0.5">
                  <span className="text-slate-500">{filteredClinics.length} klinik bulundu</span>
                  <button onClick={clearAllFilters} className="text-emerald-400 hover:text-emerald-300 transition-colors">
                    Tüm filtreleri temizle
                  </button>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-40 rounded-2xl bg-slate-800 animate-pulse" />)}
            </div>
          ) : clinics.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <p className="text-slate-400">Henüz onaylı klinik bulunmuyor.</p>
              <p className="text-slate-500 text-sm mt-1">Yakında yeni klinikler eklenecek.</p>
            </div>
          ) : filteredClinics.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <p className="text-slate-400">Arama kriterlerinize uygun klinik bulunamadı.</p>
              <button onClick={clearAllFilters} className="mt-3 text-emerald-400 hover:text-emerald-300 text-base transition-colors font-semibold">
                Filtreleri temizle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredClinics.map(clinic => {
                const egp = clinic.clinic_egp != null ? Number(clinic.clinic_egp) : null
                const reviewCount = clinic.review_count ?? 0
                const showMeasuring = reviewCount < MIN_REVIEWS_THRESHOLD
                const egpPublic = egpDisplayPublic(egp, reviewCount)
                const isSelected = selectedClinic?.id === clinic.id
                const visibleChips = (clinic.specialties ?? []).slice(0, 3)
                const extraChips = Math.max(0, (clinic.specialties ?? []).length - 3)
                return (
                  <button
                    key={clinic.id}
                    onClick={() => setPreviewClinic(clinic)}
                    className={`group text-left rounded-2xl border transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 ${
                      isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700/80 bg-slate-900/60'
                    }`}
                  >
                    {/* Üst blok — foto + bilgi */}
                    <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
                      {/* Foto sol — 3:4 dikey portrait, kart genişliğinin ~%40'ı */}
                      <div className="shrink-0 w-[40%] max-w-[170px] aspect-[3/4] rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80">
                        {clinic.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={clinic.logo_url} alt={formatClinicName(clinic.name)} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-black text-5xl">
                            {(clinic.name?.charAt(0) ?? '?').toLocaleUpperCase('tr-TR')}
                          </div>
                        )}
                      </div>

                      {/* Sağ kolon */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        {/* Sağ üst — sadece rozet (büyütüldü) */}
                        <div className="flex justify-end mb-2.5">
                          {showMeasuring ? (
                            <MeasuringBadge reviewCount={reviewCount} variant="mini" />
                          ) : egpPublic ? (
                            <div className={`px-3 py-1.5 rounded-full border ${egpBadgeColor(egp)}`}>
                              <span className="text-sm font-black">{egpPublic}</span>
                              <span className="ml-1 text-sm uppercase tracking-wider opacity-70">EGP</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Eyebrow — clinic_type uppercase yeşil */}
                        {clinic.clinic_type && (
                          <p className="text-emerald-400 text-sm font-bold uppercase tracking-[0.15em] mb-1">
                            {formatClinicTypeEyebrow(clinic.clinic_type)}
                          </p>
                        )}

                        {/* İsim — büyük başlık */}
                        <h3 className="text-white font-extrabold text-base sm:text-lg leading-[1.2] tracking-tight group-hover:text-emerald-200 transition-colors line-clamp-2">
                          {formatClinicName(clinic.name)}
                        </h3>

                        {/* Metrik satırı */}
                        <p className="text-slate-400 text-sm mt-2">
                          <span className="text-white font-bold">{reviewCount}</span> deneyim
                          <span className="text-slate-600 mx-1.5">·</span>
                          son 12 ay
                        </p>

                        {/* Çipler — sağ kolon altta, foto hizasına kadar dolduruyor */}
                        {visibleChips.length > 0 && (
                          <div className="mt-auto pt-3 flex flex-wrap gap-1.5">
                            {visibleChips.map(s => (
                              <span key={s} className="text-sm px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-200 border border-slate-700">
                                {s}
                              </span>
                            ))}
                            {extraChips > 0 && (
                              <span className="text-sm px-2 py-0.5 rounded-full text-emerald-300 border border-emerald-500/40 bg-emerald-500/10 font-semibold">
                                +{extraChips}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Alt şerit — konum sol, Önizle sağ */}
                    <div className="px-3 sm:px-4 py-2.5 border-t border-slate-700/60 flex items-center justify-between gap-3">
                      {clinic.location ? (
                        <p className="text-slate-300 text-sm sm:text-sm inline-flex items-center gap-1.5 min-w-0">
                          <svg className="w-4 h-4 shrink-0 text-rose-400/80" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
                          </svg>
                          <span className="truncate">{formatLocation(clinic.location)}</span>
                        </p>
                      ) : <span />}
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 group-hover:bg-emerald-500 text-white text-sm font-semibold transition-colors shadow-md shadow-emerald-600/20">
                        Önizle
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ADIM 2 — Tarih & Saat */}
      {step === 2 && selectedClinic && (
        <div>
          <button onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            {selectedClinic.name}
          </button>
          <div className="mb-8">
            <h1 className={`font-bold text-white ${embedded ? 'text-xl' : 'text-2xl'}`}>Tarih & Saat Seçin</h1>
            <p className="text-slate-400 text-sm mt-1">Uygun bir gün ve saat seçin</p>
          </div>

          {loadingAvail ? (
            <div className="py-8 text-center text-slate-500 text-sm">Müsaitlik yükleniyor...</div>
          ) : days.length === 0 ? (
            <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-6">
              ⚠ Bu klinik önümüzdeki 14 gün için müsaitlik saatlerini henüz tanımlamamış. Lütfen başka bir klinik seçin.
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Gün</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {days.map(day => (
                    <button key={day.toISOString()} onClick={() => { setSelectedDay(day); setSelectedTime(null) }}
                      className={`shrink-0 flex flex-col items-center px-4 py-3 rounded-xl border transition-all ${
                        selectedDay?.toDateString() === day.toDateString()
                          ? 'border-emerald-500 bg-emerald-500/20 text-white'
                          : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                      }`}>
                      <span className="text-sm uppercase">{day.toLocaleDateString('tr-TR', { weekday: 'short' })}</span>
                      <span className="text-lg font-bold mt-0.5">{day.getDate()}</span>
                      <span className="text-sm">{day.toLocaleDateString('tr-TR', { month: 'short' })}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedDay && (
                <div className="mb-8">
                  <h3 className="text-white font-medium mb-3">
                    Saat
                    <span className="ml-2 text-sm text-slate-500 font-normal">
                      · {daySlots.filter(t => !busyForDay.has(t)).length} müsait slot
                    </span>
                  </h3>
                  {daySlots.length === 0 ? (
                    <p className="text-slate-500 text-sm py-4">Bu gün için saat tanımlanmamış.</p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {daySlots.map(t => {
                        const isBusy = busyForDay.has(t)
                        return (
                          <button
                            key={t}
                            onClick={() => !isBusy && setSelectedTime(t)}
                            disabled={isBusy}
                            className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                              isBusy
                                ? 'border-slate-800 bg-slate-900 text-slate-700 cursor-not-allowed line-through'
                                : selectedTime === t
                                  ? 'border-emerald-500 bg-emerald-500/20 text-white'
                                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                            }`}>
                            {t}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {daySlots.some(t => busyForDay.has(t)) && (
                    <p className="text-slate-500 text-sm mt-2">
                      <span className="line-through">Üzeri çizili</span> saatler dolu
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <button onClick={() => setStep(3)} disabled={!selectedDay || !selectedTime}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all">
            Devam Et
          </button>
        </div>
      )}

      {/* ADIM 3 — Onay */}
      {step === 3 && selectedClinic && selectedDay && selectedTime && (
        <div>
          <button onClick={() => setStep(2)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Geri
          </button>
          <div className="mb-8">
            <h1 className={`font-bold text-white ${embedded ? 'text-xl' : 'text-2xl'}`}>Randevuyu Onayla</h1>
            <p className="text-slate-400 text-sm mt-1">Bilgileri kontrol edip onaylayın</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 mb-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <div>
                <div className="text-slate-400 text-sm">Klinik</div>
                <div className="text-white font-bold">{selectedClinic.name}</div>
                {selectedClinic.location && <div className="text-slate-400 text-sm">📍 {selectedClinic.location}</div>}
              </div>
            </div>
            <div className="h-px bg-slate-700" />
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <div className="text-slate-400 text-sm">Tarih & Saat</div>
                <div className="text-white font-bold">
                  {selectedDay.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="text-emerald-400 text-sm font-medium">{selectedTime}</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-2">Notlar (isteğe bağlı)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Şikayetleriniz veya eklemek istediğiniz bilgiler..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none" />
          </div>

          {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

          <button onClick={handleConfirm} disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-lg">
            {saving ? 'Kaydediliyor...' : 'Randevuyu Onayla'}
          </button>
        </div>
      )}

      {showOtpModal && taslak && (
        <RandevuOnayModal
          taslak={taslak}
          onClose={() => { setShowOtpModal(false); setTaslak(null) }}
          onSuccess={() => {
            setShowOtpModal(false)
            setSuccess(true)
            if (embedded && onSuccess) setTimeout(() => onSuccess(), 1500)
          }}
        />
      )}

      <ClinicPreviewModal
        clinic={previewClinic}
        onClose={() => setPreviewClinic(null)}
        onSelect={() => {
          if (previewClinic) {
            setSelectedClinic(previewClinic)
            setStep(2)
            setPreviewClinic(null)
          }
        }}
      />
    </>
  )

  // Tüm tüketiciler embedded modda çağırıyor — non-embedded path kaldırıldı
  return content
}
