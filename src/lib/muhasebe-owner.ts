/**
 * Muhasebe modülü — sadece tek klinik sahibine açık (Dr. İzzet GÖK).
 * Bu kontrol hem layout'ta (sidebar linkini gizler) hem sayfa server'larında
 * (redirect ile koruma) kullanılır. RLS de zaten owner_id=auth.uid() ile
 * bağımsız ek katman.
 */
export const MUHASEBE_OWNER_USER_ID = 'b6affcaa-b4a3-4560-9dc7-44cc0d6f9850'

export function isMuhasebeOwner(userId: string | null | undefined): boolean {
  return !!userId && userId === MUHASEBE_OWNER_USER_ID
}
