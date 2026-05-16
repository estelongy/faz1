'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner } from '@/lib/muhasebe-owner'
import type { SupabaseClient, User } from '@supabase/supabase-js'

type Result = { ok: true } | { ok: false; error: string }

type OwnerCtx =
  | { ok: true; user: User; supabase: SupabaseClient }
  | { ok: false; error: string }

async function requireOwner(): Promise<OwnerCtx> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isMuhasebeOwner(user.id)) {
    return { ok: false, error: 'Yetkisiz' }
  }
  return { ok: true, user, supabase }
}

// ─── Hasta ────────────────────────────────────────────────────────────────
export async function addPatient(formData: FormData): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const phone = (formData.get('phone') as string | null)?.trim() || null
  const notes = (formData.get('notes') as string | null)?.trim() || null

  if (name.length < 2) return { ok: false, error: 'Hasta adı en az 2 karakter.' }
  if (name.length > 120) return { ok: false, error: 'Hasta adı çok uzun.' }

  const { error } = await ctx.supabase.from('internal_patient').insert({
    owner_id: ctx.user.id, name, phone, notes,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/klinik/panel/muhasebe')
  return { ok: true }
}

export async function updatePatient(id: string, formData: FormData): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const phone = (formData.get('phone') as string | null)?.trim() || null
  const notes = (formData.get('notes') as string | null)?.trim() || null

  if (name.length < 2) return { ok: false, error: 'Hasta adı en az 2 karakter.' }

  const { error } = await ctx.supabase
    .from('internal_patient')
    .update({ name, phone, notes, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/klinik/panel/muhasebe')
  revalidatePath(`/klinik/panel/muhasebe/${id}`)
  return { ok: true }
}

export async function deletePatient(id: string): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const { error } = await ctx.supabase.from('internal_patient').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/klinik/panel/muhasebe')
  return { ok: true }
}

// ─── İşlem (treatment) ────────────────────────────────────────────────────
export async function addTreatment(patientId: string, formData: FormData): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const dateStr = (formData.get('treatment_date') as string | null)?.trim() ?? ''
  const amountStr = (formData.get('amount') as string | null)?.trim() ?? '0'
  const notes = (formData.get('notes') as string | null)?.trim() || null

  if (name.length < 2) return { ok: false, error: 'İşlem adı en az 2 karakter.' }
  const amount = Number(amountStr.replace(',', '.'))
  if (!Number.isFinite(amount) || amount < 0) return { ok: false, error: 'Geçersiz ücret.' }

  const { error } = await ctx.supabase.from('internal_treatment').insert({
    owner_id: ctx.user.id,
    patient_id: patientId,
    name,
    treatment_date: dateStr || new Date().toISOString().slice(0, 10),
    amount,
    notes,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/klinik/panel/muhasebe/${patientId}`)
  revalidatePath('/klinik/panel/muhasebe')
  return { ok: true }
}

export async function deleteTreatment(id: string, patientId: string): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const { error } = await ctx.supabase.from('internal_treatment').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/klinik/panel/muhasebe/${patientId}`)
  revalidatePath('/klinik/panel/muhasebe')
  return { ok: true }
}

// ─── Ürün (product use) ───────────────────────────────────────────────────
export async function addProduct(treatmentId: string, patientId: string, formData: FormData): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const qtyStr = (formData.get('quantity') as string | null)?.trim() ?? '1'
  const unit = (formData.get('unit') as string | null)?.trim() || null
  const notes = (formData.get('notes') as string | null)?.trim() || null

  if (name.length < 2) return { ok: false, error: 'Ürün adı en az 2 karakter.' }
  const quantity = Number(qtyStr.replace(',', '.'))
  if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, error: 'Geçersiz miktar.' }

  const { error } = await ctx.supabase.from('internal_product').insert({
    owner_id: ctx.user.id,
    treatment_id: treatmentId,
    name, quantity, unit, notes,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/klinik/panel/muhasebe/${patientId}`)
  return { ok: true }
}

export async function deleteProduct(id: string, patientId: string): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const { error } = await ctx.supabase.from('internal_product').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/klinik/panel/muhasebe/${patientId}`)
  return { ok: true }
}

// ─── Tahsilat (payment) ───────────────────────────────────────────────────
export async function addPayment(patientId: string, formData: FormData): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const amountStr = (formData.get('amount') as string | null)?.trim() ?? ''
  const dateStr = (formData.get('paid_at') as string | null)?.trim() ?? ''
  const method = (formData.get('method') as string | null)?.trim() || null
  const notes = (formData.get('notes') as string | null)?.trim() || null
  const treatmentId = (formData.get('treatment_id') as string | null)?.trim() || null

  const amount = Number(amountStr.replace(',', '.'))
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Geçersiz tutar.' }

  const { error } = await ctx.supabase.from('internal_payment').insert({
    owner_id: ctx.user.id,
    patient_id: patientId,
    treatment_id: treatmentId,
    amount,
    paid_at: dateStr || new Date().toISOString().slice(0, 10),
    method, notes,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/klinik/panel/muhasebe/${patientId}`)
  revalidatePath('/klinik/panel/muhasebe')
  return { ok: true }
}

export async function deletePayment(id: string, patientId: string): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const { error } = await ctx.supabase.from('internal_payment').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/klinik/panel/muhasebe/${patientId}`)
  revalidatePath('/klinik/panel/muhasebe')
  return { ok: true }
}

// ─── Hızlı Kayıt (hasta + işlem + tahsilat tek seferde) ─────────────────
type QuickResult = { ok: true; patientId: string } | { ok: false; error: string }

export async function addQuickEntry(formData: FormData): Promise<QuickResult> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  // Hasta — mevcut seç veya yeni oluştur
  const existingPatientId = (formData.get('existing_patient_id') as string | null)?.trim() || null
  const newPatientName = (formData.get('new_patient_name') as string | null)?.trim() || null
  const newPatientPhone = (formData.get('new_patient_phone') as string | null)?.trim() || null

  let patientId: string

  if (existingPatientId) {
    patientId = existingPatientId
  } else if (newPatientName) {
    if (newPatientName.length < 2) return { ok: false, error: 'Hasta adı en az 2 karakter.' }
    if (newPatientName.length > 120) return { ok: false, error: 'Hasta adı çok uzun.' }
    const { data, error } = await ctx.supabase.from('internal_patient').insert({
      owner_id: ctx.user.id,
      name: newPatientName,
      phone: newPatientPhone || null,
    }).select('id').single()
    if (error || !data) return { ok: false, error: error?.message ?? 'Hasta oluşturulamadı.' }
    patientId = data.id
  } else {
    return { ok: false, error: 'Hasta seçin veya yeni hasta adı girin.' }
  }

  // İşlem
  const treatmentName = (formData.get('treatment_name') as string | null)?.trim() ?? ''
  const treatmentCatalogId = (formData.get('treatment_catalog_id') as string | null)?.trim() || null
  const treatmentDateStr = (formData.get('treatment_date') as string | null)?.trim() ?? ''
  const treatmentAmountStr = (formData.get('treatment_amount') as string | null)?.trim() ?? '0'
  const treatmentNotes = (formData.get('treatment_notes') as string | null)?.trim() || null

  if (treatmentName.length < 2) return { ok: false, error: 'İşlem adı en az 2 karakter.' }
  const treatmentAmount = Number(treatmentAmountStr.replace(',', '.'))
  if (!Number.isFinite(treatmentAmount) || treatmentAmount < 0) return { ok: false, error: 'Geçersiz işlem ücreti.' }

  // Güvenlik: catalog_id verilmişse, kayıt sahibinin owner_id'sine ait olduğunu doğrula (FK + RLS yeterli ama yine de açık kontrol).
  let safeCatalogId: string | null = null
  if (treatmentCatalogId) {
    const { data: cat } = await ctx.supabase
      .from('internal_treatment_catalog')
      .select('id')
      .eq('id', treatmentCatalogId)
      .eq('owner_id', ctx.user.id)
      .maybeSingle()
    if (cat) safeCatalogId = cat.id
  }

  const { data: treatmentData, error: treatmentErr } = await ctx.supabase.from('internal_treatment').insert({
    owner_id: ctx.user.id,
    patient_id: patientId,
    name: treatmentName,
    catalog_id: safeCatalogId,
    treatment_date: treatmentDateStr || new Date().toISOString().slice(0, 10),
    amount: treatmentAmount,
    notes: treatmentNotes,
  }).select('id').single()
  if (treatmentErr) return { ok: false, error: treatmentErr.message }

  // Tahsilat (opsiyonel — tutar > 0 ise)
  const paymentAmountStr = (formData.get('payment_amount') as string | null)?.trim() ?? '0'
  const paymentAmount = Number(paymentAmountStr.replace(',', '.'))

  if (Number.isFinite(paymentAmount) && paymentAmount > 0) {
    const paymentDateStr = (formData.get('payment_date') as string | null)?.trim() ?? ''
    const paymentMethod = (formData.get('payment_method') as string | null)?.trim() || null

    const { error: payErr } = await ctx.supabase.from('internal_payment').insert({
      owner_id: ctx.user.id,
      patient_id: patientId,
      treatment_id: treatmentData?.id ?? null,
      amount: paymentAmount,
      paid_at: paymentDateStr || new Date().toISOString().slice(0, 10),
      method: paymentMethod,
    })
    if (payErr) return { ok: false, error: payErr.message }
  }

  // Ürünler (opsiyonel)
  const productCount = Number((formData.get('product_count') as string | null) ?? '0')
  if (Number.isFinite(productCount) && productCount > 0 && treatmentData) {
    for (let i = 0; i < productCount; i++) {
      const pName = (formData.get(`product_name_${i}`) as string | null)?.trim() ?? ''
      const pQtyStr = (formData.get(`product_qty_${i}`) as string | null)?.trim() ?? '1'
      const pUnit = (formData.get(`product_unit_${i}`) as string | null)?.trim() || null
      if (pName.length < 2) continue
      const pQty = Number(pQtyStr.replace(',', '.'))
      await ctx.supabase.from('internal_product').insert({
        owner_id: ctx.user.id,
        treatment_id: treatmentData.id,
        name: pName,
        quantity: Number.isFinite(pQty) && pQty > 0 ? pQty : 1,
        unit: pUnit,
      })
    }
  }

  revalidatePath('/klinik/panel/muhasebe')
  revalidatePath(`/klinik/panel/muhasebe/${patientId}`)
  return { ok: true, patientId }
}

// ─── Randevu ──────────────────────────────────────────────────────────────
// Manuel randevu (Dr. İzzet özel akışı). Tekrarlama: weekly / biweekly / triweekly / monthly
// + 1..6 ay süre. Tüm tekrarlar tek seferde insert edilir, ortak recurrence_group_id ile bağlanır.
type AppointmentResult = { ok: true; count: number; groupId: string | null } | { ok: false; error: string }

const RECURRENCE_FREQ_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  triweekly: 21,
}

function addMonthsSafe(base: Date, months: number): Date {
  const d = new Date(base)
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)
  // 31 Ocak + 1 ay = 28/29 Şubat (taşma kontrolü)
  if (d.getDate() !== day) d.setDate(0)
  return d
}

function buildOccurrences(start: Date, freq: string | null, months: number | null): Date[] {
  if (!freq || !months) return [start]
  const out: Date[] = [start]
  const horizon = addMonthsSafe(start, months)
  if (freq === 'monthly') {
    for (let i = 1; i <= 6; i++) {
      const next = addMonthsSafe(start, i)
      if (next > horizon) break
      out.push(next)
    }
  } else {
    const stepDays = RECURRENCE_FREQ_DAYS[freq]
    if (!stepDays) return [start]
    let cursor = new Date(start)
    while (true) {
      cursor = new Date(cursor.getTime() + stepDays * 86_400_000)
      if (cursor > horizon) break
      out.push(cursor)
    }
  }
  return out
}

export async function createAppointment(formData: FormData): Promise<AppointmentResult> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  // ─── Hasta bilgileri ─────
  const phoneRaw = (formData.get('phone') as string | null)?.trim() ?? ''
  const firstName = (formData.get('first_name') as string | null)?.trim() ?? ''
  const lastName = (formData.get('last_name') as string | null)?.trim() ?? ''
  const phone = phoneRaw.replace(/\s+/g, '').replace(/^\+?90/, '').replace(/\D/g, '')

  if (firstName.length < 2) return { ok: false, error: 'Ad en az 2 karakter olmalı.' }
  if (lastName.length < 2) return { ok: false, error: 'Soyad en az 2 karakter olmalı.' }
  if (phone.length !== 10) return { ok: false, error: 'Telefon 10 haneli olmalı (+90 hariç).' }

  // ─── Randevu detayları ─────
  const dateStr = (formData.get('date') as string | null)?.trim() ?? ''         // YYYY-MM-DD
  const timeStr = (formData.get('time') as string | null)?.trim() ?? ''         // HH:MM
  const durationMin = Number(formData.get('duration_minutes') ?? 30)
  const appointmentType = ((formData.get('appointment_type') as string | null)?.trim() || null)
  const treatmentType = ((formData.get('treatment_type') as string | null)?.trim() || null)
  const reason = ((formData.get('reason') as string | null)?.trim() || null)
  const detail = ((formData.get('detail') as string | null)?.trim() || null)

  if (!dateStr || !timeStr) return { ok: false, error: 'Tarih ve saat zorunlu.' }
  if (!Number.isFinite(durationMin) || durationMin < 5 || durationMin > 480) {
    return { ok: false, error: 'Geçersiz randevu süresi.' }
  }

  const startAt = new Date(`${dateStr}T${timeStr}:00`)
  if (Number.isNaN(startAt.getTime())) return { ok: false, error: 'Geçersiz tarih/saat.' }

  // ─── Tekrarlama ─────
  const isRecurring = formData.get('is_recurring') === 'on' || formData.get('is_recurring') === 'true'
  const recurrenceFreq = isRecurring ? ((formData.get('recurrence_freq') as string | null) || null) : null
  const recurrenceMonths = isRecurring ? Number(formData.get('recurrence_months') ?? 0) : null

  if (isRecurring) {
    if (!recurrenceFreq || !['weekly', 'biweekly', 'triweekly', 'monthly'].includes(recurrenceFreq)) {
      return { ok: false, error: 'Tekrar sıklığı geçersiz.' }
    }
    if (!recurrenceMonths || recurrenceMonths < 1 || recurrenceMonths > 6) {
      return { ok: false, error: 'Tekrar süresi 1-6 ay arasında olmalı.' }
    }
  }

  // ─── Hasta upsert (telefon eşleşmesi varsa kullan) ─────
  const fullName = `${firstName} ${lastName}`.trim()
  const { data: existing } = await ctx.supabase
    .from('internal_patient')
    .select('id, name')
    .eq('owner_id', ctx.user.id)
    .eq('phone', phone)
    .maybeSingle()

  let patientId: string
  if (existing) {
    patientId = existing.id
  } else {
    const { data: created, error: pErr } = await ctx.supabase
      .from('internal_patient')
      .insert({ owner_id: ctx.user.id, name: fullName, phone })
      .select('id')
      .single()
    if (pErr || !created) return { ok: false, error: pErr?.message ?? 'Hasta kaydı oluşturulamadı.' }
    patientId = created.id
  }

  // ─── Tekrarlama hesaplama ─────
  const occurrences = buildOccurrences(startAt, recurrenceFreq, recurrenceMonths)
  const groupId = occurrences.length > 1 ? crypto.randomUUID() : null

  const rows = occurrences.map((occ, idx) => ({
    owner_id: ctx.user.id,
    patient_id: patientId,
    start_at: occ.toISOString(),
    duration_minutes: durationMin,
    appointment_type: appointmentType,
    treatment_type: treatmentType,
    reason,
    detail,
    status: 'scheduled' as const,
    recurrence_group_id: groupId,
    recurrence_freq: groupId ? recurrenceFreq : null,
    recurrence_months: groupId ? recurrenceMonths : null,
    is_recurrence_root: groupId ? idx === 0 : false,
  }))

  const { error: insErr } = await ctx.supabase.from('internal_appointment').insert(rows)
  if (insErr) return { ok: false, error: insErr.message }

  revalidatePath('/klinik/panel/muhasebe')
  revalidatePath(`/klinik/panel/muhasebe/${patientId}`)
  return { ok: true, count: rows.length, groupId }
}
