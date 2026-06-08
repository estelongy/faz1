import type { Flavor } from '@/components/native/flavor-detect'

/**
 * Role-based redirect paths.
 * Tek kaynak: app_metadata.role
 */
export function pathForRole(role: string | null | undefined): string {
  switch (role) {
    case 'admin':                return '/admin'
    case 'clinic':               return '/klinik/panel'
    case 'vendor':               return '/satici/panel'
    case 'health_professional':  return '/panel'
    default:                     return '/panel'
  }
}

/** Flavor → galaksi adı (3 dünya). PRO flavor'lar tüketici galaksisine map'lenir. */
export function flavorToGalaxy(flavor: Flavor | null | undefined): 'biyoage' | 'esteklinik' | 'estestore' | null {
  if (!flavor) return null
  if (flavor === 'biyoage') return 'biyoage'
  if (flavor === 'esteklinik' || flavor === 'esteklinikpro') return 'esteklinik'
  if (flavor === 'estestore' || flavor === 'estestorepro') return 'estestore'
  return null
}

/**
 * App içinde /giris'e yönlendirme — galaksi koruma + next.
 * Misafir kullanıcı giriş yapınca aynı galaksiye + istediği sayfaya geri döner.
 * Galaxy-loss bug'ının (memory: safelink_galaxy_routing) sunucu-side karşılığı.
 */
export function loginRedirectPath(opts: { next?: string; flavor?: Flavor | null }): string {
  const params = new URLSearchParams()
  const galaxy = flavorToGalaxy(opts.flavor ?? null)
  if (galaxy) params.set('g', galaxy)
  if (opts.next) params.set('next', opts.next)
  const qs = params.toString()
  return qs ? `/giris?${qs}` : '/giris'
}
