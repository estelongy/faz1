'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ensureAdminOtpFresh } from '@/lib/admin-otp'
import { writeAuditLog } from '@/lib/audit'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  const role = (user.app_metadata as Record<string, string>)?.role
  if (role !== 'admin') redirect('/panel')
  await ensureAdminOtpFresh(user.id, '/admin/ep')
  return { supabase, user }
}

export async function addEpDocument(
  productId: string,
  documentType: string,
  seviye: number,
): Promise<{ ok: boolean; error?: string }> {
  if (!productId || !documentType) return { ok: false, error: 'Eksik alan' }
  if (seviye < 1 || seviye > 5) return { ok: false, error: 'Seviye 1-5 olmalı' }

  const { supabase, user } = await requireAdmin()

  const { error } = await supabase
    .from('ep_documents')
    .upsert({
      product_id: productId,
      document_type: documentType,
      seviye,
      verified_at: new Date().toISOString(),
    }, { onConflict: 'product_id,document_type' })

  if (error) return { ok: false, error: error.message }

  await supabase.rpc('compute_ep', { p_product_id: productId })

  await writeAuditLog({
    actorId: user.id,
    action: 'ep_document_add',
    tableName: 'ep_documents',
    recordId: productId,
    newData: { document_type: documentType, seviye },
  })

  revalidatePath('/admin/ep')
  revalidatePath(`/admin/ep/${productId}`)
  return { ok: true }
}

export async function removeEpDocument(
  productId: string,
  documentType: string,
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await requireAdmin()

  const { error } = await supabase
    .from('ep_documents')
    .delete()
    .eq('product_id', productId)
    .eq('document_type', documentType)

  if (error) return { ok: false, error: error.message }

  await supabase.rpc('compute_ep', { p_product_id: productId })

  await writeAuditLog({
    actorId: user.id,
    action: 'ep_document_remove',
    tableName: 'ep_documents',
    recordId: productId,
    newData: { document_type: documentType },
  })

  revalidatePath('/admin/ep')
  revalidatePath(`/admin/ep/${productId}`)
  return { ok: true }
}

export async function reportSahteTespit(
  productId: string,
): Promise<{ ok: boolean; error?: string; newCount?: number; isBanned?: boolean }> {
  const { supabase, user } = await requireAdmin()

  const { data: existing } = await supabase
    .from('ep_verify')
    .select('sahte_count')
    .eq('product_id', productId)
    .maybeSingle()

  const newCount = (existing?.sahte_count ?? 0) + 1
  let penalty = 0
  let isBanned = false
  if (newCount === 1) penalty = 2
  else if (newCount === 2) penalty = 5
  else if (newCount >= 3) { penalty = 10; isBanned = true }

  const { error } = await supabase
    .from('ep_verify')
    .upsert({
      product_id: productId,
      sahte_count: newCount,
      penalty,
      is_banned: isBanned,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'product_id' })

  if (error) return { ok: false, error: error.message }

  await supabase.rpc('compute_ep', { p_product_id: productId })

  await writeAuditLog({
    actorId: user.id,
    action: 'ep_sahte_tespit',
    tableName: 'ep_verify',
    recordId: productId,
    newData: { sahte_count: newCount, penalty, is_banned: isBanned },
  })

  revalidatePath('/admin/ep')
  revalidatePath(`/admin/ep/${productId}`)
  return { ok: true, newCount, isBanned }
}

export async function clearSahteTespit(
  productId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await requireAdmin()

  const { error } = await supabase
    .from('ep_verify')
    .update({ sahte_count: 0, penalty: 0, is_banned: false, updated_at: new Date().toISOString() })
    .eq('product_id', productId)

  if (error) return { ok: false, error: error.message }

  await supabase.rpc('compute_ep', { p_product_id: productId })

  await writeAuditLog({
    actorId: user.id,
    action: 'ep_sahte_clear',
    tableName: 'ep_verify',
    recordId: productId,
  })

  revalidatePath('/admin/ep')
  revalidatePath(`/admin/ep/${productId}`)
  return { ok: true }
}

export async function recomputeEp(productId: string): Promise<{ ok: boolean }> {
  const { supabase } = await requireAdmin()
  await supabase.rpc('compute_ep', { p_product_id: productId })
  revalidatePath('/admin/ep')
  revalidatePath(`/admin/ep/${productId}`)
  return { ok: true }
}
