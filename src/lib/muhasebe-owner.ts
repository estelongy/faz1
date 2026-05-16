/**
 * Muhasebe modülü — el ile tanımlanan klinik sahiplerine açık.
 * Bu kontrol hem layout'ta (sidebar linkini gizler) hem sayfa server'larında
 * (redirect ile koruma) kullanılır. RLS de zaten owner_id=auth.uid() ile
 * bağımsız ek katman — her sahip yalnızca kendi internal_* verisini görür.
 */
export const MUHASEBE_OWNER_USER_IDS: readonly string[] = [
  'b6affcaa-b4a3-4560-9dc7-44cc0d6f9850', // Dr. İzzet GÖK
  '1740826b-3cab-42c4-ad89-ae141da18bb3', // Işık Anka kliniği (ayseyksl1997@gmail.com)
]

/** @deprecated Geriye dönük uyumluluk — yeni kod MUHASEBE_OWNER_USER_IDS kullanmalı. */
export const MUHASEBE_OWNER_USER_ID = MUHASEBE_OWNER_USER_IDS[0]

export function isMuhasebeOwner(userId: string | null | undefined): boolean {
  return !!userId && MUHASEBE_OWNER_USER_IDS.includes(userId)
}
