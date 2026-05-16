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
  type: 'green' | 'red'
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
 * Pattern: G-R-R döngüsü, her slot 10 dakika.
 * Yeşil her 30 dk'da bir başlar (09:00, 09:30, 10:00 ...).
 */
export function generateSlotsForDay(day: DayAvailability | null | undefined): Slot[] {
  if (!day || day.is_closed) return []
  const start = parseTime(day.open_time)
  const end = parseTime(day.close_time)
  if (end <= start) return []
  const out: Slot[] = []
  let m = start
  let cycle = 0
  while (m + 10 <= end) {
    out.push({ time: fmtMin(m), endTime: fmtMin(m + 10), type: cycle === 0 ? 'green' : 'red' })
    m += 10
    cycle = (cycle + 1) % 3
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

/** Verilen aralıkta G-R-R pattern slot üretir (takvim union grid'i için) */
export function generateSlotsForRange(openMin: number, closeMin: number): Slot[] {
  const out: Slot[] = []
  let m = openMin
  let cycle = 0
  while (m + 10 <= closeMin) {
    out.push({ time: fmtMin(m), endTime: fmtMin(m + 10), type: cycle === 0 ? 'green' : 'red' })
    m += 10
    cycle = (cycle + 1) % 3
  }
  return out
}

/** Bir slot saatinin o günün açık aralığında olup olmadığı */
export function slotInDay(slotTime: string, day: DayAvailability | null): boolean {
  if (!day || day.is_closed) return false
  const m = parseTime(slotTime)
  return m >= parseTime(day.open_time) && m + 10 <= parseTime(day.close_time)
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
