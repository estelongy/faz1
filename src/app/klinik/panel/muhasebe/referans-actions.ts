'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getKlinikStaff } from '@/lib/muhasebe-owner'
import type { SupabaseClient, User } from '@supabase/supabase-js'

type Result = { ok: true; data?: unknown } | { ok: false; error: string }

type OwnerCtx =
  | { ok: true; user: User; supabase: SupabaseClient; clinicOwnerId: string }
  | { ok: false; error: string }

// actions.ts'teki ile aynı kontrol — o dosyadaki 'use server' kısıtı yüzünden
// export edilemiyor, burada yerel kopyası duruyor.
async function requireOwner(): Promise<OwnerCtx> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const staff = getKlinikStaff(user?.id)
  if (!user || !staff) return { ok: false, error: 'Yetkisiz' }
  return { ok: true, user, supabase, clinicOwnerId: staff.clinicOwnerId }
}

/** Kural motoru Postgres'te — buradaki işlev yalnızca RPC'yi çağırmak. */
async function rpc(fn: string, args: Record<string, unknown>): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }
  const { data, error } = await ctx.supabase.rpc(fn, { p_owner: ctx.clinicOwnerId, ...args })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/klinik/panel/muhasebe')
  return { ok: true, data }
}

// ── Ayarlar ──────────────────────────────────────────────────────────
export async function saveReferansAyar(formData: FormData): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const isletme = ((formData.get('isletme_kodu') as string) ?? '').trim().toUpperCase()
  if (!/^[A-Z]{2,5}$/.test(isletme)) {
    return { ok: false, error: 'İşletme kodu 2-5 harf olmalı (örn. GOK).' }
  }
  const omur = Number(formData.get('kod_omru_gun') ?? 7)
  const limit = Number(formData.get('aylik_limit') ?? 10)

  const { error } = await ctx.supabase.from('referral_settings').upsert({
    owner_id: ctx.clinicOwnerId,
    isletme_kodu: isletme,
    aktif: formData.get('aktif') === 'on',
    kod_omru_gun: Number.isFinite(omur) ? omur : 7,
    aylik_limit: Number.isFinite(limit) ? limit : 10,
    updated_at: new Date().toISOString(),
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/klinik/panel/muhasebe')
  return { ok: true }
}

// ── Teklif ───────────────────────────────────────────────────────────
export async function addReferansTeklif(formData: FormData): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const baslik = ((formData.get('baslik') as string) ?? '').trim()
  const ayricalik = ((formData.get('ayricalik') as string) ?? '').trim()
  if (baslik.length < 3) return { ok: false, error: 'Teklif başlığı en az 3 karakter.' }
  if (ayricalik.length < 3) return { ok: false, error: 'Ayrıcalık metni boş olamaz.' }

  const kont = Number(formData.get('kontenjan') ?? 0)
  const bitis = ((formData.get('gecerli_bitis') as string) ?? '').trim() || null
  const odul = Number(String(formData.get('odul_tutar') ?? '0').replace(',', '.'))

  const tur = ((formData.get('tur') as string) ?? 'genel').trim()
  const zaman = ((formData.get('gecerli_zaman') as string) ?? '').trim() || null

  const { error } = await ctx.supabase.from('referral_offer').insert({
    owner_id: ctx.clinicOwnerId,
    baslik, ayricalik, tur,
    gecerli_zaman: tur === 'sakin_saat' ? zaman : null,
    gorsel_izni: tur === 'model' && formData.get('gorsel_izni') === 'on',
    kontenjan: Number.isFinite(kont) && kont > 0 ? kont : null,
    gecerli_bitis: bitis,
    odul_tutar: Number.isFinite(odul) && odul > 0 ? odul : 0,
    created_by: ctx.user.id,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/klinik/panel/muhasebe')
  return { ok: true }
}

export async function toggleReferansTeklif(id: string, aktif: boolean): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }
  const { error } = await ctx.supabase.from('referral_offer')
    .update({ aktif }).eq('id', id).eq('owner_id', ctx.clinicOwnerId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/klinik/panel/muhasebe')
  return { ok: true }
}

// ── Referansör ───────────────────────────────────────────────────────
/** Hastayı referansör yapar; kod önekini (GA3) döndürür. */
export async function addReferansor(patientId: string): Promise<Result> {
  return rpc('referral_referansor_ekle', { p_patient: patientId })
}

export async function toggleReferansor(id: string, aktif: boolean): Promise<Result> {
  const ctx = await requireOwner()
  if (!ctx.ok) return { ok: false, error: ctx.error }
  const { error } = await ctx.supabase.from('referral_referrer')
    .update({ aktif }).eq('id', id).eq('owner_id', ctx.clinicOwnerId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/klinik/panel/muhasebe')
  return { ok: true }
}

/** Boş davet linki üretir — kimseye bağlı değil, ilk doğrulayan kilitler. */
export async function uretReferansLink(referrerId: string, offerId: string): Promise<Result> {
  return rpc('referral_link_uret', { p_referrer: referrerId, p_offer: offerId })
}

// ── Geldi / Gelmedi ──────────────────────────────────────────────────
export async function isaretleReferansZiyaret(
  codeId: string, geldi: boolean,
  hesap?: number, indirim?: number, patientId?: string,
): Promise<Result> {
  return rpc('referral_isaretle', {
    p_code: codeId, p_geldi: geldi,
    p_patient: patientId ?? null, p_treatment: null,
    p_hesap: Number.isFinite(hesap) ? hesap : null,
    p_indirim: Number.isFinite(indirim) ? indirim : null,
  })
}
