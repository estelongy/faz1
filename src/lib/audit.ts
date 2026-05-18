/**
 * Audit log helpers — admin & kritik aksiyonlar için.
 *
 * Hedef tablo: public.audit_logs (user_id, action, table_name, record_id,
 * old_data, new_data, ip_address, user_agent, created_at)
 *
 * Kullanım: kritik server action içinde işlem TAMAMLANDIKTAN sonra çağırılır,
 * başarısız olursa sadece console.warn — audit eksikliği iş akışını bozmasın.
 */

import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'

export type AuditAction =
  | 'role_change'
  | 'user_active_toggle'
  | 'vendor_approval'
  | 'vendor_update'
  | 'clinic_approval'
  | 'clinic_update'
  | 'clinic_credit_grant'
  | 'clinic_educator_toggle'
  | 'clinic_educator_decision'
  | 'product_approval'
  | 'app_settings_update'
  | 'gdpr_kvkk_delete'
  | 'admin_login_otp'
  | 'coupon_create'
  | 'coupon_delete'
  | 'ep_document_add'
  | 'ep_document_remove'
  | 'ep_sahte_tespit'
  | 'ep_sahte_clear'

export interface AuditEntry {
  /** Aksiyonu yapan admin/kullanıcı */
  actorId: string | null
  /** Eylem adı */
  action: AuditAction
  /** Hedef tablo (ör. 'profiles', 'vendors') */
  tableName?: string
  /** Hedef kayıt id'si */
  recordId?: string
  /** Eski değer snapshot (varsa) */
  oldData?: Record<string, unknown>
  /** Yeni değer snapshot */
  newData?: Record<string, unknown>
}

/**
 * Audit log kaydı yaz. Hata durumunda iş akışını bozmaz, sadece warn'lar.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const h = await headers()
    const ip =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      h.get('x-real-ip') ||
      null
    const userAgent = h.get('user-agent') ?? null

    const admin = createServiceClient()
    const { error } = await admin.from('audit_logs').insert({
      user_id: entry.actorId,
      action: entry.action,
      table_name: entry.tableName ?? null,
      record_id: entry.recordId ?? null,
      old_data: entry.oldData ?? null,
      new_data: entry.newData ?? null,
      ip_address: ip,
      user_agent: userAgent,
    })
    if (error) {
      console.warn('[audit] Kayıt başarısız:', error.message, entry)
    }
  } catch (e) {
    console.warn('[audit] Exception:', e instanceof Error ? e.message : String(e))
  }
}
