/**
 * Klinik PMS personel beyaz listesi — el ile tanımlanan doktor/sekreter kayıtları.
 * Bu kontrol hem layout'ta (sidebar linkini gizler) hem sayfa server'larında
 * (redirect ile koruma) kullanılır.
 *
 * RLS katmanı: internal_* tabloları `owner_id = public.my_clinic_owner()` politikasıyla
 * korunur; my_clinic_owner() DB'deki `clinic_staff` tablosundan okur. Buraya yeni
 * personel eklerken clinic_staff'a da satır eklenmeli (migration veya SQL insert),
 * yoksa kod izin verir ama RLS veriyi göstermez.
 *
 * Roller (şimdilik ikisi de tam yetki):
 *  - doktor:   açılış odağı hasta karnesi
 *  - sekreter: açılış odağı gün akışı
 */
export type KlinikRole = 'doktor' | 'sekreter'

export interface KlinikStaffProfile {
  /** Print başlığı / form etiketinde geçecek tam ad (örn. "Dr. İzzet GÖK") */
  displayName: string
  /** Marka satırı: "{displayName} — Klinik Muhasebe" gibi başlıklarda kullanılır */
  brandLine?: string
  role: KlinikRole
  /** Verinin bağlı olduğu klinik havuzu (internal_* owner_id). Sahipse kendi id'si. */
  clinicOwnerId: string
}

export const KLINIK_STAFF: Record<string, KlinikStaffProfile> = {
  'b6affcaa-b4a3-4560-9dc7-44cc0d6f9850': {
    displayName: 'Dr. İzzet GÖK',
    brandLine: 'Dr. İzzet GÖK — Klinik Muhasebe',
    role: 'doktor',
    clinicOwnerId: 'b6affcaa-b4a3-4560-9dc7-44cc0d6f9850',
  },
  '1740826b-3cab-42c4-ad89-ae141da18bb3': {
    displayName: 'Işık Anka Kliniği',
    brandLine: 'Işık Anka Kliniği — Muhasebe',
    role: 'doktor',
    clinicOwnerId: '1740826b-3cab-42c4-ad89-ae141da18bb3',
  },
  // Sekreter eklerken: user_id → { displayName, role: 'sekreter', clinicOwnerId: <doktorun id'si> }
  // + Supabase clinic_staff tablosuna aynı satırı insert et.
}

export function getKlinikStaff(userId: string | null | undefined): KlinikStaffProfile | null {
  if (userId && userId in KLINIK_STAFF) return KLINIK_STAFF[userId]
  return null
}

/** Geriye dönük ad — artık "personel mi" anlamına gelir (doktor VEYA sekreter). */
export function isMuhasebeOwner(userId: string | null | undefined): boolean {
  return !!getKlinikStaff(userId)
}

/** Kullanıcının veri havuzu sahibi (internal_* owner_id filtresi için). */
export function clinicOwnerIdFor(userId: string | null | undefined): string | null {
  return getKlinikStaff(userId)?.clinicOwnerId ?? null
}

// ── Geriye dönük uyumluluk ────────────────────────────────────────────────
export type MuhasebeOwnerProfile = Pick<KlinikStaffProfile, 'displayName' | 'brandLine'>

export const MUHASEBE_OWNER_PROFILES: Record<string, MuhasebeOwnerProfile> = KLINIK_STAFF

export const MUHASEBE_OWNER_USER_IDS: readonly string[] = Object.keys(KLINIK_STAFF)

/** @deprecated Geriye dönük uyumluluk — yeni kod MUHASEBE_OWNER_USER_IDS kullanmalı. */
export const MUHASEBE_OWNER_USER_ID = MUHASEBE_OWNER_USER_IDS[0]

export function getMuhasebeOwnerProfile(userId: string | null | undefined): MuhasebeOwnerProfile {
  const staff = getKlinikStaff(userId)
  if (staff) return staff
  return { displayName: 'Klinik Sahibi', brandLine: 'Klinik Muhasebe' }
}
