/**
 * Kargo şirketi takip URL'i — müşteri kargo şirketinin sitesine direkt
 * gidebilsin diye carrier + tracking_number → tıklanabilir URL.
 *
 * Estelongy'nin kendi shipping label kodu (EST-YY-XXXXXX) için harici takip
 * URL'i YOKTUR — null döner, UI yalnız kodu kopyalanabilir gösterir.
 *
 * NOT: Bu kart müşteriye "kargo şirketine git, takip et" diyor; ÜRÜN takibi
 * için zaten /siparis/<orderNumber> sayfasının kendisi var.
 */

export const CARRIERS = [
  'Yurtiçi Kargo', 'Aras Kargo', 'MNG Kargo', 'PTT Kargo',
  'Sürat Kargo', 'HepsiJet', 'Trendyol Express', 'Diğer',
] as const

export type CarrierName = (typeof CARRIERS)[number]

/**
 * Carrier + tracking number → kargo şirketinin sitesindeki takip URL.
 * Eğer carrier desteklenmiyorsa veya tracking number Estelongy internal
 * etiket kodu ise (EST- ile başlıyor) → null.
 */
export function carrierTrackingUrl(
  carrier: string | null | undefined,
  trackingNumber: string | null | undefined,
): string | null {
  if (!carrier || !trackingNumber) return null
  const code = trackingNumber.trim()
  if (!code) return null

  // Estelongy internal etiket — dış takip yok
  if (code.startsWith('EST-')) return null

  const enc = encodeURIComponent(code)
  switch (carrier) {
    case 'Yurtiçi Kargo':
      // Yurtiçi'nin public takip sayfası — kargotakip parametresiyle.
      return `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${enc}`
    case 'Aras Kargo':
      return `https://kargotakip.araskargo.com.tr/?code=${enc}`
    case 'MNG Kargo':
      return `https://kargotakip.mngkargo.com.tr/?takipno=${enc}`
    case 'PTT Kargo':
      return `https://gonderitakip.ptt.gov.tr/Track/summary?q=${enc}`
    case 'Sürat Kargo':
      return `https://www.suratkargo.com.tr/KargoTakip/?kod=${enc}`
    case 'HepsiJet':
      return `https://www.hepsijet.com/gonderi-takibi?trackingNumber=${enc}`
    case 'Trendyol Express':
      return `https://trendyol.com/siparislerim?orderNumber=${enc}`
    case 'Diğer':
      return null
    default:
      return null
  }
}

/**
 * UI'da gösterilecek dostça label — tracking kodu Estelongy internal mı,
 * yoksa kargo şirketinin kendi takip kodu mu?
 */
export function trackingLabel(
  carrier: string | null | undefined,
  trackingNumber: string | null | undefined,
): string {
  if (!trackingNumber) return ''
  if (trackingNumber.startsWith('EST-')) return 'Estelongy Etiket No'
  return `${carrier ?? 'Kargo'} Takip No`
}
