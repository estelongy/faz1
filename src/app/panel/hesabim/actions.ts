'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { writeAuditLog } from '@/lib/audit'

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }

  const firstName = (formData.get('firstName') as string ?? '').trim()
  const lastName  = (formData.get('lastName') as string ?? '').trim()
  const birthYearRaw = formData.get('birthYear') as string
  const birthYear = birthYearRaw ? parseInt(birthYearRaw, 10) : null

  if (!firstName || !lastName) return { ok: false, error: 'Ad ve soyad zorunludur' }
  const currentYear = new Date().getFullYear()
  if (birthYear && (isNaN(birthYear) || birthYear < 1900 || birthYear > currentYear - 18)) {
    return { ok: false, error: 'Geçerli bir doğum yılı girin (18+)' }
  }

  const fullName = `${firstName} ${lastName}`
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, ...(birthYear ? { birth_year: birthYear } : {}) })
    .eq('id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/panel/hesabim')
  return { ok: true }
}

/**
 * KVKK / GDPR uyumlu hesap silme.
 *
 *   - Kişisel veriler hard delete (analiz, randevu, adres, sepet, skor, vs.)
 *   - Mali kayıtlar anonimize (sipariş, kurs satın alma, iade) — yasal saklama
 *   - Public içerik anonimize (yorum, paylaşım) — kullanıcı bağı kopar
 *   - Vendor / klinik kullanıcısı ise işletme askıya alınır, mali geçmiş kalır
 *   - auth.users kalıcı silinir
 *   - Aktif (henüz tamamlanmamış) sipariş varsa silme reddedilir
 *
 * Admin hesabı kendini silemez — başka admin'e devretmesi gerekir.
 */
export async function deleteAccountAction(): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  // Admin self-delete yok
  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin') {
    return { ok: false, error: 'Admin hesabı kendini silemez. Başka bir admin ile iletişime geçin.' }
  }

  const admin = createServiceClient()

  // Silinen kullanıcı snapshot — audit için
  const { data: snapshot } = await admin
    .from('profiles')
    .select('full_name, phone, birth_year')
    .eq('id', user.id)
    .maybeSingle()

  // 1) Public şema: cascade fonksiyonu (anonimize + hard delete)
  const { data: cascadeResult, error: cascadeErr } = await admin
    .rpc('app_delete_account_cascade', { p_user_id: user.id })

  if (cascadeErr) {
    return { ok: false, error: `Silme başarısız: ${cascadeErr.message}` }
  }

  const result = cascadeResult as { ok: boolean; error?: string; count?: number } | null
  if (!result?.ok) {
    if (result?.error === 'active_orders_exist') {
      return {
        ok: false,
        error: `${result.count ?? 'Birkaç'} aktif siparişiniz var. Önce iptal/teslimat tamamlanmalı.`,
      }
    }
    return { ok: false, error: result?.error ?? 'Silme başarısız' }
  }

  // 2) Auth tarafı: kalıcı silme
  const { error: authErr } = await admin.auth.admin.deleteUser(user.id)
  if (authErr) {
    // Public şema temizlendi ama auth user duruyor → manuel müdahale gerek
    console.error('[deleteAccount] auth.users silinemedi', authErr)
    return { ok: false, error: 'Auth tarafı silinemedi. Destek ekibiyle iletişime geçin.' }
  }

  // 3) Audit log — KVKK denetim için kritik
  await writeAuditLog({
    actorId: user.id,
    action: 'gdpr_kvkk_delete',
    tableName: 'auth.users',
    recordId: user.id,
    oldData: {
      email: user.email ?? null,
      role: role ?? null,
      full_name: snapshot?.full_name ?? null,
      phone: snapshot?.phone ?? null,
      birth_year: snapshot?.birth_year ?? null,
    },
    newData: { deleted_at: new Date().toISOString(), self_initiated: true },
  })

  // 4) Oturumu kapat
  await supabase.auth.signOut()
  redirect('/?deleted=1')
}
