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
