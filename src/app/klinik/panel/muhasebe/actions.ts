'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getKlinikStaff, type KlinikRole } from '@/lib/muhasebe-owner'
import type { SupabaseClient, User } from '@supabase/supabase-js'

type Result = { ok: true } | { ok: false; error: string }

type OwnerCtx =
  | { ok: true; user: User; supabase: SupabaseClient; clinicOwnerId: string; role: KlinikRole }
  | { ok: false; error: string }

async function requireOwner(): Promise<OwnerCtx> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const staff = getKlinikStaff(user?.id)
  if (!user || !staff) {
    return { ok: false, error: 'Yetkisiz' }
  }
  return { ok: true, user, supabase, clinicOwnerId: staff.clinicOwnerId, role: staff.role }
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
    owner_id: ctx.clinicOwnerId, name, phone, notes, created_by: ctx.user.id,
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
    owner_id: ctx.clinicOwnerId,
    patient_id: patientId,
    name,
    treatment_date: dateStr || new Date().toISOString().slice(0, 10),
    amount,
    notes,
    created_by: ctx.user.id,
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
    owner_id: ctx.clinicOwnerId,
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
    owner_id: ctx.clinicOwnerId,
    patient_id: patientId,
    treatment_id: treatmentId,
    amount,
    paid_at: dateStr || new Date().toISOString().slice(0, 10),
    method, notes,
    created_by: ctx.user.id,
  })
  if (error) return { ok: false, error: error.message }

  // Kalan için ödeme sözü (opsiyonel): tarih + tutar birlikte verilirse kaydet
  const promiseDate = (formData.get('promise_date') as string | null)?.trim() || null
  const promiseAmountStr = (formData.get('promise_amount') as string | null)?.trim() || ''
  if (promiseDate && promiseAmountStr) {
    const pAmt = Number(promiseAmountStr.replace(',', '.'))
    if (Number.isFinite(pAmt) && pAmt > 0) {
      await ctx.supabase.from('internal_payment_promise').insert({
        owner_id: ctx.clinicOwnerId,
        patient_id: patientId,
        due_date: promiseDate,
        amount: pAmt,
        created_by: ctx.user.id,
      })
    }
  }

  revalidatePath(`/klinik/panel/muhasebe/${patientId}`)
  revalidatePath('/klinik/panel/muhasebe')
  return { ok: true }
}

// ─── Ödeme sözü / plan ────────────────────────────────────────────────────
export async function addPaymentPromise(patientId: string, formData: FormData): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const dueDate = (formData.get('due_date') as string | null)?.trim() ?? ''
  const amountStr = (formData.get('amount') as string | null)?.trim() ?? ''
  const note = (formData.get('note') as string | null)?.trim() || null
  const amount = Number(amountStr.replace(',', '.'))
  if (!dueDate) return { ok: false, error: 'Tarih zorunlu.' }
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Geçersiz tutar.' }

  const { error } = await ctx.supabase.from('internal_payment_promise').insert({
    owner_id: ctx.clinicOwnerId,
    patient_id: patientId,
    due_date: dueDate,
    amount, note,
    created_by: ctx.user.id,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/klinik/panel/muhasebe')
  return { ok: true }
}

// Sözü kapat: 'paid' → aynı anda tahsilat kaydı da açılır (tek tık tahsilat).
export async function settlePaymentPromise(id: string, mode: 'paid' | 'cancelled', method?: string): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const { data: pr, error: gErr } = await ctx.supabase
    .from('internal_payment_promise')
    .select('id, patient_id, amount, status')
    .eq('id', id)
    .eq('owner_id', ctx.clinicOwnerId)
    .single()
  if (gErr || !pr) return { ok: false, error: 'Söz bulunamadı.' }
  if (pr.status !== 'open') return { ok: false, error: 'Söz zaten kapatılmış.' }

  if (mode === 'paid') {
    const { error: payErr } = await ctx.supabase.from('internal_payment').insert({
      owner_id: ctx.clinicOwnerId,
      patient_id: pr.patient_id,
      amount: pr.amount,
      paid_at: new Date().toISOString().slice(0, 10),
      method: method || null,
      notes: 'Ödeme sözü tahsilatı',
      created_by: ctx.user.id,
    })
    if (payErr) return { ok: false, error: payErr.message }
  }

  const { error } = await ctx.supabase
    .from('internal_payment_promise')
    .update({ status: mode, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', ctx.clinicOwnerId)
  if (error) return { ok: false, error: error.message }
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
      owner_id: ctx.clinicOwnerId,
      name: newPatientName,
      phone: newPatientPhone || null,
      created_by: ctx.user.id,
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

  // Paket: seans sayısı (1 = tek seans → null bırak)
  const sessionTotalStr = (formData.get('session_total') as string | null)?.trim() ?? ''
  let sessionTotal: number | null = null
  if (sessionTotalStr) {
    const n = Number(sessionTotalStr)
    if (!Number.isInteger(n) || n < 1 || n > 60) return { ok: false, error: 'Geçersiz seans sayısı.' }
    if (n > 1) sessionTotal = n
  }

  // Güvenlik: catalog_id verilmişse, kayıt sahibinin owner_id'sine ait olduğunu doğrula (FK + RLS yeterli ama yine de açık kontrol).
  let safeCatalogId: string | null = null
  if (treatmentCatalogId) {
    const { data: cat } = await ctx.supabase
      .from('internal_treatment_catalog')
      .select('id')
      .eq('id', treatmentCatalogId)
      .eq('owner_id', ctx.clinicOwnerId)
      .maybeSingle()
    if (cat) safeCatalogId = cat.id
  }

  const { data: treatmentData, error: treatmentErr } = await ctx.supabase.from('internal_treatment').insert({
    owner_id: ctx.clinicOwnerId,
    patient_id: patientId,
    name: treatmentName,
    catalog_id: safeCatalogId,
    treatment_date: treatmentDateStr || new Date().toISOString().slice(0, 10),
    amount: treatmentAmount,
    notes: treatmentNotes,
    session_total: sessionTotal,
    created_by: ctx.user.id,
  }).select('id').single()
  if (treatmentErr) return { ok: false, error: treatmentErr.message }

  // Tahsilat (opsiyonel — tutar > 0 ise)
  const paymentAmountStr = (formData.get('payment_amount') as string | null)?.trim() ?? '0'
  const paymentAmount = Number(paymentAmountStr.replace(',', '.'))

  if (Number.isFinite(paymentAmount) && paymentAmount > 0) {
    const paymentDateStr = (formData.get('payment_date') as string | null)?.trim() ?? ''
    const paymentMethod = (formData.get('payment_method') as string | null)?.trim() || null

    const { error: payErr } = await ctx.supabase.from('internal_payment').insert({
      owner_id: ctx.clinicOwnerId,
      patient_id: patientId,
      treatment_id: treatmentData?.id ?? null,
      amount: paymentAmount,
      paid_at: paymentDateStr || new Date().toISOString().slice(0, 10),
      method: paymentMethod,
      created_by: ctx.user.id,
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
        owner_id: ctx.clinicOwnerId,
        treatment_id: treatmentData.id,
        name: pName,
        quantity: Number.isFinite(pQty) && pQty > 0 ? pQty : 1,
        unit: pUnit,
      })
    }
  }

  // Randevudan geliyor (İşleme Al akışı) — randevuyu da completed yap
  const completeApptId = (formData.get('complete_appointment_id') as string | null)?.trim() || null
  if (completeApptId) {
    await ctx.supabase
      .from('internal_appointment')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', completeApptId)
      .eq('owner_id', ctx.clinicOwnerId)
    revalidatePath('/klinik/panel/muhasebe/randevu')
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
    .eq('owner_id', ctx.clinicOwnerId)
    .eq('phone', phone)
    .maybeSingle()

  let patientId: string
  if (existing) {
    patientId = existing.id
  } else {
    const { data: created, error: pErr } = await ctx.supabase
      .from('internal_patient')
      .insert({ owner_id: ctx.clinicOwnerId, name: fullName, phone, created_by: ctx.user.id })
      .select('id')
      .single()
    if (pErr || !created) return { ok: false, error: pErr?.message ?? 'Hasta kaydı oluşturulamadı.' }
    patientId = created.id
  }

  // ─── Tekrarlama hesaplama ─────
  const occurrences = buildOccurrences(startAt, recurrenceFreq, recurrenceMonths)
  const groupId = occurrences.length > 1 ? crypto.randomUUID() : null

  const rows = occurrences.map((occ, idx) => ({
    owner_id: ctx.clinicOwnerId,
    created_by: ctx.user.id,
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

// ─── Mevcut hastaya randevu (tek ekran akışı) ────────────────────────────
export async function createAppointmentForPatient(formData: FormData): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const patientId = (formData.get('patient_id') as string | null)?.trim() ?? ''
  const dateStr = (formData.get('date') as string | null)?.trim() ?? ''
  const timeStr = (formData.get('time') as string | null)?.trim() ?? ''
  const durationMin = Number(formData.get('duration_minutes') ?? 30)
  const treatmentType = ((formData.get('treatment_type') as string | null)?.trim() || null)

  if (!patientId) return { ok: false, error: 'Hasta seçilmedi.' }
  if (!dateStr || !timeStr) return { ok: false, error: 'Tarih ve saat zorunlu.' }
  if (!Number.isFinite(durationMin) || durationMin < 5 || durationMin > 480) {
    return { ok: false, error: 'Geçersiz randevu süresi.' }
  }
  const startAt = new Date(`${dateStr}T${timeStr}:00`)
  if (Number.isNaN(startAt.getTime())) return { ok: false, error: 'Geçersiz tarih/saat.' }

  // Pakete bağlama (opsiyonel) — paket işlemi bu hastaya ve bu kliniğe ait olmalı
  const packageTreatmentId = (formData.get('package_treatment_id') as string | null)?.trim() || null
  let safePackageId: string | null = null
  let pkgRemaining = 0
  if (packageTreatmentId) {
    const { data: pkg } = await ctx.supabase
      .from('internal_treatment')
      .select('id, session_total')
      .eq('id', packageTreatmentId)
      .eq('owner_id', ctx.clinicOwnerId)
      .eq('patient_id', patientId)
      .maybeSingle()
    if (!pkg || !pkg.session_total) return { ok: false, error: 'Paket bulunamadı.' }
    safePackageId = pkg.id
    // Henüz randevusu açılmamış seans sayısı (tamamlanan + planlı düşülür)
    const { count } = await ctx.supabase
      .from('internal_appointment')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', ctx.clinicOwnerId)
      .eq('package_treatment_id', pkg.id)
      .in('status', ['completed', 'scheduled'])
    pkgRemaining = Math.max(0, pkg.session_total - (count ?? 0))
    if (pkgRemaining === 0) return { ok: false, error: 'Paketin tüm seansları zaten planlı veya tamamlanmış.' }
  }

  // Tekrarlama: weekly / biweekly / triweekly / monthly
  const recurFreq = (formData.get('recurrence_freq') as string | null)?.trim() || null
  let occurrences: Date[]
  if (safePackageId && recurFreq) {
    // SEANS MANTIĞI: pakete bağlı + sıklık seçili → kalan seans sayısı kadar randevu
    const stepDays = RECURRENCE_FREQ_DAYS[recurFreq] ?? null
    occurrences = [startAt]
    for (let i = 1; i < pkgRemaining; i++) {
      occurrences.push(stepDays
        ? new Date(startAt.getTime() + i * stepDays * 86_400_000)
        : addMonthsSafe(startAt, i))
    }
  } else {
    // Paketsiz: klasik süreli tekrar (1..6 ay)
    const recurMonthsRaw = Number(formData.get('recurrence_months') ?? 0)
    const recurMonths = recurFreq && Number.isInteger(recurMonthsRaw) && recurMonthsRaw >= 1 && recurMonthsRaw <= 6
      ? recurMonthsRaw : null
    occurrences = buildOccurrences(startAt, recurFreq, recurMonths)
  }
  const groupId = occurrences.length > 1 ? crypto.randomUUID() : null

  const rows = occurrences.map(d => ({
    owner_id: ctx.clinicOwnerId,
    created_by: ctx.user.id,
    patient_id: patientId,
    start_at: d.toISOString(),
    duration_minutes: durationMin,
    treatment_type: treatmentType,
    package_treatment_id: safePackageId,
    recurrence_group_id: groupId,
    status: 'scheduled',
  }))
  const { error } = await ctx.supabase.from('internal_appointment').insert(rows)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/klinik/panel/muhasebe')
  revalidatePath('/klinik/panel/muhasebe/randevu')
  return { ok: true }
}

// ─── İşleme Al ────────────────────────────────────────────────────────────
// Randevuyu tamamla + tedavi (gelir) kaydı aç. Ödeme ayrı eklenir.
export async function processAppointment(formData: FormData): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const id = (formData.get('id') as string | null) ?? ''
  const amountRaw = (formData.get('amount') as string | null) ?? '0'
  const nameOverride = ((formData.get('treatment_name') as string | null)?.trim() || null)
  if (!id) return { ok: false, error: 'Randevu ID eksik.' }

  const amount = Number(amountRaw)
  if (!Number.isFinite(amount) || amount < 0) return { ok: false, error: 'Geçersiz tutar.' }

  // Randevuyu çek
  const { data: appt, error: aErr } = await ctx.supabase
    .from('internal_appointment')
    .select('id, patient_id, start_at, treatment_type, status')
    .eq('id', id)
    .eq('owner_id', ctx.clinicOwnerId)
    .single()
  if (aErr || !appt) return { ok: false, error: 'Randevu bulunamadı.' }
  if (appt.status === 'completed') return { ok: false, error: 'Randevu zaten tamamlanmış.' }

  const treatmentName = nameOverride || appt.treatment_type || 'İşlem'
  const treatmentDate = new Date(appt.start_at).toISOString().slice(0, 10)

  const { error: tErr } = await ctx.supabase.from('internal_treatment').insert({
    owner_id: ctx.clinicOwnerId,
    patient_id: appt.patient_id,
    name: treatmentName,
    treatment_date: treatmentDate,
    amount,
    created_by: ctx.user.id,
  })
  if (tErr) return { ok: false, error: tErr.message }

  const { error: uErr } = await ctx.supabase
    .from('internal_appointment')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', ctx.clinicOwnerId)
  if (uErr) return { ok: false, error: uErr.message }

  revalidatePath('/klinik/panel/muhasebe')
  revalidatePath('/klinik/panel/muhasebe/randevu')
  revalidatePath(`/klinik/panel/muhasebe/${appt.patient_id}`)
  return { ok: true }
}

// ─── Status değiştir (no_show / cancelled / scheduled) ────────────────────
export async function setAppointmentStatus(id: string, status: 'scheduled' | 'no_show' | 'cancelled'): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }
  if (!['scheduled', 'no_show', 'cancelled'].includes(status)) return { ok: false, error: 'Geçersiz durum.' }

  const { error } = await ctx.supabase
    .from('internal_appointment')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', ctx.clinicOwnerId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/klinik/panel/muhasebe')
  revalidatePath('/klinik/panel/muhasebe/randevu')
  return { ok: true }
}

// ─── Sil ───────────────────────────────────────────────────────────────────
export async function deleteAppointment(id: string): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }
  const { error } = await ctx.supabase
    .from('internal_appointment')
    .delete()
    .eq('id', id)
    .eq('owner_id', ctx.clinicOwnerId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/klinik/panel/muhasebe')
  revalidatePath('/klinik/panel/muhasebe/randevu')
  return { ok: true }
}

// ─── Düzenle (tek randevu) ────────────────────────────────────────────────
export async function updateAppointment(formData: FormData): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const id = (formData.get('id') as string | null) ?? ''
  if (!id) return { ok: false, error: 'Randevu ID eksik.' }

  const dateStr = (formData.get('date') as string | null)?.trim() ?? ''
  const timeStr = (formData.get('time') as string | null)?.trim() ?? ''
  const durationMin = Number(formData.get('duration_minutes') ?? 30)
  const appointmentType = ((formData.get('appointment_type') as string | null)?.trim() || null)
  const treatmentType = ((formData.get('treatment_type') as string | null)?.trim() || null)
  const reason = ((formData.get('reason') as string | null)?.trim() || null)
  const detail = ((formData.get('detail') as string | null)?.trim() || null)

  if (!dateStr || !timeStr) return { ok: false, error: 'Tarih ve saat zorunlu.' }
  if (!Number.isFinite(durationMin) || durationMin < 5 || durationMin > 480) {
    return { ok: false, error: 'Geçersiz süre.' }
  }
  const startAt = new Date(`${dateStr}T${timeStr}:00`)
  if (Number.isNaN(startAt.getTime())) return { ok: false, error: 'Geçersiz tarih/saat.' }

  const { error } = await ctx.supabase
    .from('internal_appointment')
    .update({
      start_at: startAt.toISOString(),
      duration_minutes: durationMin,
      appointment_type: appointmentType,
      treatment_type: treatmentType,
      reason,
      detail,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_id', ctx.clinicOwnerId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/klinik/panel/muhasebe')
  revalidatePath('/klinik/panel/muhasebe/randevu')
  revalidatePath(`/klinik/panel/muhasebe/randevu/${id}/duzenle`)
  return { ok: true }
}

// ─── Müsaitlik (haftalık şablon) ──────────────────────────────────────────
// 7 günlük tam set olarak gelir, üzerine upsert eder. day_of_week 0-6 (Date.getDay).
export async function saveAvailability(formData: FormData): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const ALLOWED_DURATIONS = new Set([10, 15, 20, 30, 45, 60, 90])
  const rows: { owner_id: string; day_of_week: number; open_time: string; close_time: string; is_closed: boolean; slot_duration_minutes: number; updated_at: string }[] = []
  for (let dow = 0; dow < 7; dow++) {
    const isClosed = formData.get(`closed_${dow}`) === 'on' || formData.get(`closed_${dow}`) === 'true'
    const open = ((formData.get(`open_${dow}`) as string | null) ?? '09:00').trim()
    const close = ((formData.get(`close_${dow}`) as string | null) ?? '19:00').trim()
    const duration = Number((formData.get(`duration_${dow}`) as string | null) ?? '30')
    if (!/^\d{2}:\d{2}$/.test(open) || !/^\d{2}:\d{2}$/.test(close)) {
      return { ok: false, error: `Gün ${dow}: saat formatı geçersiz.` }
    }
    if (!ALLOWED_DURATIONS.has(duration)) {
      return { ok: false, error: `Gün ${dow}: slot süresi geçersiz.` }
    }
    if (!isClosed) {
      const [oh, om] = open.split(':').map(Number)
      const [ch, cm] = close.split(':').map(Number)
      if ((ch * 60 + cm) <= (oh * 60 + om)) {
        return { ok: false, error: `Gün ${dow}: kapanış açılıştan sonra olmalı.` }
      }
    }
    rows.push({
      owner_id: ctx.clinicOwnerId,
      day_of_week: dow,
      open_time: open,
      close_time: close,
      is_closed: isClosed,
      slot_duration_minutes: duration,
      updated_at: new Date().toISOString(),
    })
  }

  const { error } = await ctx.supabase
    .from('internal_availability')
    .upsert(rows, { onConflict: 'owner_id,day_of_week' })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/klinik/panel/muhasebe')
  revalidatePath('/klinik/panel/muhasebe/randevu')
  revalidatePath('/klinik/panel/muhasebe/randevu/yeni')
  revalidatePath('/klinik/panel/muhasebe/randevu/musaitlik')
  return { ok: true }
}

// ─── Randevu kabul modu: otomatik onay aç/kapa ───────────────────────────
export async function setAutoConfirmAppointments(value: boolean): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const { error } = await ctx.supabase
    .from('clinics')
    .update({ auto_confirm_appointments: value })
    .eq('user_id', ctx.clinicOwnerId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/klinik/panel')
  revalidatePath('/klinik/panel/muhasebe/randevu/musaitlik')
  return { ok: true }
}

// ─── Seri yönetimi: toplu iptal ───────────────────────────────────────────
// scope: 'all' = serinin tüm scheduled randevuları, 'future' = pivot tarihinden sonraki scheduled randevular
export async function cancelRecurrenceSeries(params: {
  groupId: string
  scope: 'all' | 'future'
  fromAppointmentId?: string  // future modunda referans alınır
}): Promise<{ ok: true; cancelled: number } | { ok: false; error: string }> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }
  const { groupId, scope, fromAppointmentId } = params
  if (!groupId) return { ok: false, error: 'Seri ID eksik.' }

  let pivot: string | null = null
  if (scope === 'future') {
    if (!fromAppointmentId) return { ok: false, error: 'Referans randevu eksik.' }
    const { data: ref } = await ctx.supabase
      .from('internal_appointment')
      .select('start_at')
      .eq('id', fromAppointmentId)
      .eq('owner_id', ctx.clinicOwnerId)
      .single()
    if (!ref) return { ok: false, error: 'Referans randevu bulunamadı.' }
    pivot = ref.start_at
  }

  let q = ctx.supabase
    .from('internal_appointment')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() }, { count: 'exact' })
    .eq('owner_id', ctx.clinicOwnerId)
    .eq('recurrence_group_id', groupId)
    .eq('status', 'scheduled')
  if (pivot) q = q.gte('start_at', pivot)

  const { error, count } = await q
  if (error) return { ok: false, error: error.message }

  revalidatePath('/klinik/panel/muhasebe')
  revalidatePath('/klinik/panel/muhasebe/randevu')
  return { ok: true, cancelled: count ?? 0 }
}

// ─── Hasta fotoğrafları ────────────────────────────────────────────────────
// Private bucket 'klinik-foto', yol: {clinicOwnerId}/{patientId}/{uuid}.{ext}
// Başlangıçta veya herhangi bir işleme bağlı olarak, sınırsız sayıda eklenebilir.
const PHOTO_MAX_BYTES = 10 * 1024 * 1024
const PHOTO_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic',
}

export async function addPatientPhoto(patientId: string, formData: FormData): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const file = formData.get('photo') as File | null
  if (!file || file.size === 0) return { ok: false, error: 'Fotoğraf seçilmedi.' }
  if (file.size > PHOTO_MAX_BYTES) return { ok: false, error: 'Fotoğraf 10 MB\'dan büyük olamaz.' }
  const ext = PHOTO_TYPES[file.type]
  if (!ext) return { ok: false, error: 'Sadece JPG / PNG / WebP / HEIC.' }

  const treatmentId = (formData.get('treatment_id') as string | null)?.trim() || null
  let note = (formData.get('note') as string | null)?.trim() || null

  // Etiket kullanıcı seçimiyle gelir: oncesi / sonrasi / kontrol.
  // Kontrol'e tarih damgası eklenir. Serbest not varsa etiketin arkasına eklenir.
  const stage = (formData.get('stage') as string | null)?.trim() || ''
  const STAGE_LABELS: Record<string, string> = {
    oncesi: 'İşlem öncesi',
    sonrasi: 'İşlem sonrası',
    kontrol: `Kontrol · ${new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Istanbul' })}`,
  }
  const stageLabel = STAGE_LABELS[stage] ?? null
  if (stageLabel) note = note ? `${stageLabel} — ${note}` : stageLabel

  // İşleme bağlanıyorsa bu hastanın işlemi olduğunu doğrula
  if (treatmentId) {
    const { data: t } = await ctx.supabase
      .from('internal_treatment')
      .select('id')
      .eq('id', treatmentId)
      .eq('owner_id', ctx.clinicOwnerId)
      .eq('patient_id', patientId)
      .maybeSingle()
    if (!t) return { ok: false, error: 'İşlem bulunamadı.' }
  }

  const path = `${ctx.clinicOwnerId}/${patientId}/${crypto.randomUUID()}.${ext}`
  const { error: upErr } = await ctx.supabase.storage
    .from('klinik-foto')
    .upload(path, file, { contentType: file.type })
  if (upErr) return { ok: false, error: `Yükleme hatası: ${upErr.message}` }

  const { error } = await ctx.supabase.from('internal_patient_photo').insert({
    owner_id: ctx.clinicOwnerId,
    patient_id: patientId,
    treatment_id: treatmentId,
    storage_path: path,
    note,
    created_by: ctx.user.id,
  })
  if (error) {
    await ctx.supabase.storage.from('klinik-foto').remove([path])
    return { ok: false, error: error.message }
  }
  revalidatePath('/klinik/panel/muhasebe')
  return { ok: true }
}

export async function deletePatientPhoto(id: string): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const { data: photo } = await ctx.supabase
    .from('internal_patient_photo')
    .select('id, storage_path')
    .eq('id', id)
    .eq('owner_id', ctx.clinicOwnerId)
    .maybeSingle()
  if (!photo) return { ok: false, error: 'Fotoğraf bulunamadı.' }

  await ctx.supabase.storage.from('klinik-foto').remove([photo.storage_path])
  const { error } = await ctx.supabase.from('internal_patient_photo').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/klinik/panel/muhasebe')
  return { ok: true }
}
