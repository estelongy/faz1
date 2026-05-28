'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { writeAuditLog } from '@/lib/audit'

/**
 * Satıcı hesabı kapatma — KVKK Madde 7 (Unutulma Hakkı).
 *
 *  - Aktif sipariş (pending/preparing/shipped) varsa silme reddedilir
 *  - Bekleyen iade veya ödenmemiş Stripe payout varsa reddedilir
 *  - Vendor pasifleşir, ürünler is_active=false yapılır (vitrinden düşer)
 *  - Tamamlanmış siparişler/faturalar anonimize kalır (vergi mevzuatı 5 yıl)
 *  - Public şema cascade (hasta paneli ile aynı RPC)
 *  - auth.users hard delete
 *  - Audit log
 */
export async function deleteVendorAccountAction(): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin') {
    return { ok: false, error: 'Admin hesabı kendini silemez.' }
  }

  const admin = createServiceClient()

  // Vendor kaydı
  const { data: vendor } = await admin
    .from('vendors')
    .select('id, company_name, phone, tax_number, stripe_account_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (vendor) {
    // 1) Aktif sipariş kontrol
    const { count: activeOrders } = await admin
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .in('fulfillment_status', ['pending', 'preparing', 'shipped'])

    if ((activeOrders ?? 0) > 0) {
      return {
        ok: false,
        error: `${activeOrders} aktif siparişiniz var. Önce teslimat veya iptal tamamlanmalı.`,
      }
    }

    // 2) Bekleyen iade kontrol
    const { count: pendingReturns } = await admin
      .from('returns')
      .select('id, order_items!inner(vendor_id)', { count: 'exact', head: true })
      .eq('order_items.vendor_id', vendor.id)
      .eq('status', 'pending')

    if ((pendingReturns ?? 0) > 0) {
      return {
        ok: false,
        error: `${pendingReturns} bekleyen iade talebi var. Önce yanıtlamanız gerekiyor.`,
      }
    }

    // 3) Vendor + ürünleri pasifleştir
    await admin.from('products').update({ is_active: false }).eq('vendor_id', vendor.id)
    await admin
      .from('vendors')
      .update({ is_active: false })
      .eq('id', vendor.id)
  }

  // 4) Public cascade (analiz/skor/sepet vs kişisel veri temizliği)
  const { data: cascadeResult, error: cascadeErr } = await admin
    .rpc('app_delete_account_cascade', { p_user_id: user.id })

  if (cascadeErr) {
    return { ok: false, error: `Silme başarısız: ${cascadeErr.message}` }
  }
  const result = cascadeResult as { ok: boolean; error?: string; count?: number } | null
  if (!result?.ok) {
    if (result?.error === 'active_orders_exist') {
      return { ok: false, error: 'Aktif siparişiniz var. Önce iptal/teslimat tamamlanmalı.' }
    }
    return { ok: false, error: result?.error ?? 'Silme başarısız' }
  }

  // 5) Auth user kalıcı sil
  const { error: authErr } = await admin.auth.admin.deleteUser(user.id)
  if (authErr) {
    console.error('[deleteVendorAccount] auth.users silinemedi', authErr)
    return { ok: false, error: 'Auth tarafı silinemedi. Destek ekibiyle iletişime geçin.' }
  }

  // 6) Audit log
  await writeAuditLog({
    actorId: user.id,
    action: 'gdpr_kvkk_delete',
    tableName: 'auth.users',
    recordId: user.id,
    oldData: {
      email: user.email ?? null,
      role: 'vendor',
      company_name: vendor?.company_name ?? null,
      tax_number: vendor?.tax_number ?? null,
      phone: vendor?.phone ?? null,
    },
    newData: { deleted_at: new Date().toISOString(), self_initiated: true, account_type: 'vendor' },
  })

  await supabase.auth.signOut()
  redirect('/?deleted=1')
}
