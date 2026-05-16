/* ============================================================
   Muhasebe randevu modülü — slot üretme ve müsaitlik tipleri
   Hem TimeSlotPicker hem RandevuTakvim aynı mantığı paylaşır.
   ============================================================ */

export interface DayAvailability {
  day_of_week: number   // 0=Pazar, 1=Pzt ... 6=Cmt (Date.getDay() ile uyumlu)
  open_time: string     // HH:MM
  close_time: string    // HH:MM
  is_closed: boolean
  slot_duration_minutes: number  // 10/15/20/30/45/60/90 — varsayılan randevu süresi
}

export type AvailabilityWeek = DayAvailability[]   // length 7

export interface Slot {
  time: string          // HH:MM
  endTime: string       // HH:MM
  durationMinutes: number
}

export const DAY_LABELS_TR: Record<number, string> = {
  0: 'Pazar', 1: 'Pazartesi', 2: 'Salı', 3: 'Çarşamba', 4: 'Perşembe', 5: 'Cuma', 6: 'Cumartesi',
}

export const DAY_SHORT_TR: Record<number, string> = {
  0: 'Paz', 1: 'Pzt', 2: 'Sal', 3: 'Çar', 4: 'Per', 5: 'Cum', 6: 'Cmt',
}

export function fmtMin(minutes: number): string {
  const hh = Math.floor(minutes / 60)
  const mm = minutes % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/**
 * Slot listesi: gün açılıştan başlar, her adım slot_duration_minutes,
 * kapanışa kadar tam sığan tüm slotları üretir. Tüm slotlar tek tip
 * (rezerve edilebilir).
 */
export function generateSlotsForDay(day: DayAvailability | null | undefined): Slot[] {
  if (!day || day.is_closed) return []
  const start = parseTime(day.open_time)
  const end = parseTime(day.close_time)
  const step = day.slot_duration_minutes
  if (end <= start || step <= 0) return []
  const out: Slot[] = []
  for (let m = start; m + step <= end; m += step) {
    out.push({ time: fmtMin(m), endTime: fmtMin(m + step), durationMinutes: step })
  }
  return out
}

/** Date → 0-6 lookup'tan ilgili gün ayarını çek */
export function availabilityForDate(week: AvailabilityWeek, d: Date): DayAvailability | null {
  const dow = d.getDay()
  return week.find(w => w.day_of_week === dow) ?? null
}

/** ISO YYYY-MM-DD → 0-6 lookup */
export function availabilityForIsoDate(week: AvailabilityWeek, iso: string): DayAvailability | null {
  const d = new Date(`${iso}T00:00:00`)
  return availabilityForDate(week, d)
}

/** Default haftalık şablon — DB seed başarısız olursa fallback */
export const DEFAULT_AVAILABILITY: AvailabilityWeek = [
  { day_of_week: 0, open_time: '00:00', close_time: '00:00', is_closed: true,  slot_duration_minutes: 30 }, // Paz
  { day_of_week: 1, open_time: '09:00', close_time: '19:00', is_closed: false, slot_duration_minutes: 30 },
  { day_of_week: 2, open_time: '09:00', close_time: '19:00', is_closed: false, slot_duration_minutes: 30 },
  { day_of_week: 3, open_time: '09:00', close_time: '19:00', is_closed: false, slot_duration_minutes: 30 },
  { day_of_week: 4, open_time: '09:00', close_time: '19:00', is_closed: false, slot_duration_minutes: 30 },
  { day_of_week: 5, open_time: '09:00', close_time: '19:00', is_closed: false, slot_duration_minutes: 30 },
  { day_of_week: 6, open_time: '09:00', close_time: '19:00', is_closed: false, slot_duration_minutes: 30 },
]

/** Hafta boyu en erken açılış + en geç kapanış (takvim grid'i için ortak aralık) */
export function unionRange(week: AvailabilityWeek): { open: number; close: number } | null {
  let earliestOpen = Number.POSITIVE_INFINITY
  let latestClose = 0
  for (const d of week) {
    if (d.is_closed) continue
    const o = parseTime(d.open_time)
    const c = parseTime(d.close_time)
    if (c <= o) continue
    if (o < earliestOpen) earliestOpen = o
    if (c > latestClose) latestClose = c
  }
  if (!Number.isFinite(earliestOpen) || earliestOpen >= latestClose) return null
  return { open: earliestOpen, close: latestClose }
}

/** Takvim grid step'i = aktif günler arasındaki en küçük slot süresi (yoksa 30) */
export function unionStep(week: AvailabilityWeek): number {
  let min = Number.POSITIVE_INFINITY
  for (const d of week) {
    if (d.is_closed || d.slot_duration_minutes <= 0) continue
    if (d.slot_duration_minutes < min) min = d.slot_duration_minutes
  }
  return Number.isFinite(min) ? min : 30
}

/** Verilen aralıkta sabit step'le slot üretir (haftalık takvim grid'i için) */
export function generateSlotsForRange(openMin: number, closeMin: number, stepMin: number): Slot[] {
  const out: Slot[] = []
  if (stepMin <= 0) return out
  for (let m = openMin; m + stepMin <= closeMin; m += stepMin) {
    out.push({ time: fmtMin(m), endTime: fmtMin(m + stepMin), durationMinutes: stepMin })
  }
  return out
}

/**
 * Slot saati o günün açık aralığında VE günün kendi grid'ine hizalı mı.
 * Hizalama: (slot - open) % slot_duration_minutes === 0.
 */
export function slotInDay(slotTime: string, day: DayAvailability | null): boolean {
  if (!day || day.is_closed) return false
  const m = parseTime(slotTime)
  const open = parseTime(day.open_time)
  const close = parseTime(day.close_time)
  const step = day.slot_duration_minutes
  if (step <= 0) return false
  if (m < open || m + step > close) return false
  return ((m - open) % step) === 0
}

/** DB'den gelen kısmi satırları 7 günlük tam haftaya genişlet */
export function normalizeWeek(raw: Partial<DayAvailability>[]): AvailabilityWeek {
  return DEFAULT_AVAILABILITY.map(def => {
    const row = raw.find(r => r.day_of_week === def.day_of_week)
    if (!row) return def
    return {
      day_of_week: def.day_of_week,
      open_time: row.open_time ?? def.open_time,
      close_time: row.close_time ?? def.close_time,
      is_closed: row.is_closed ?? def.is_closed,
      slot_duration_minutes: row.slot_duration_minutes ?? def.slot_duration_minutes,
    }
  })
}
