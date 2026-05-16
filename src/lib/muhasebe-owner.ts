/**
 * Muhasebe modülü — el ile tanımlanan klinik sahiplerine açık.
 * Bu kontrol hem layout'ta (sidebar linkini gizler) hem sayfa server'larında
 * (redirect ile koruma) kullanılır. RLS de zaten owner_id=auth.uid() ile
 * bağımsız ek katman — her sahip yalnızca kendi internal_* verisini görür.
 */
export interface MuhasebeOwnerProfile {
  /** Print başlığı / form etiketinde geçecek tam ad (örn. "Dr. İzzet GÖK") */
  displayName: string
  /** Marka satırı: "{displayName} — Klinik Muhasebe" gibi başlıklarda kullanılır */
  brandLine?: string
}

export const MUHASEBE_OWNER_PROFILES: Record<string, MuhasebeOwnerProfile> = {
  'b6affcaa-b4a3-4560-9dc7-44cc0d6f9850': {
    displayName: 'Dr. İzzet GÖK',
    brandLine: 'Dr. İzzet GÖK — Klinik Muhasebe',
  },
  '1740826b-3cab-42c4-ad89-ae141da18bb3': {
    displayName: 'Işık Anka Kliniği',
    brandLine: 'Işık Anka Kliniği — Muhasebe',
  },
}

export const MUHASEBE_OWNER_USER_IDS: readonly string[] = Object.keys(MUHASEBE_OWNER_PROFILES)

/** @deprecated Geriye dönük uyumluluk — yeni kod MUHASEBE_OWNER_USER_IDS kullanmalı. */
export const MUHASEBE_OWNER_USER_ID = MUHASEBE_OWNER_USER_IDS[0]

export function isMuhasebeOwner(userId: string | null | undefined): boolean {
  return !!userId && userId in MUHASEBE_OWNER_PROFILES
}

export function getMuhasebeOwnerProfile(userId: string | null | undefined): MuhasebeOwnerProfile {
  if (userId && userId in MUHASEBE_OWNER_PROFILES) return MUHASEBE_OWNER_PROFILES[userId]
  return { displayName: 'Klinik Sahibi', brandLine: 'Klinik Muhasebe' }
}
