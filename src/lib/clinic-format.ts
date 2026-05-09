/**
 * Klinik metinlerini display icin temizler — kullanici girdisi her zaman
 * dogru capitalize / noktalama ile gelmiyor. Display tarafinda normalize
 * ediyoruz.
 */

const TITLE_PREFIXES = new Set(['dr', 'doç', 'doc', 'op', 'prof', 'uzm', 'asst'])

/**
 * "dr kanuni Sultan Süleyman" -> "Dr. Kanuni Sultan Süleyman"
 * "uzm dr ahmet" -> "Uzm. Dr. Ahmet"
 * "ESTELONGY KLINIK" -> "Estelongy Klinik"
 */
export function formatClinicName(raw: string | null | undefined): string {
  if (!raw) return ''
  const words = raw.trim().split(/\s+/).filter(Boolean)
  return words
    .map((word, i) => {
      // Noktayi ayikla
      const stripped = word.replace(/\.+$/, '')
      const lower = stripped.toLocaleLowerCase('tr-TR')
      // Bilinen unvan prefix'lerini Title. formatina cevir
      if (i < 3 && TITLE_PREFIXES.has(lower)) {
        return capitalizeTr(stripped) + '.'
      }
      // Tum harfler buyukse veya tum harfler kucukse normalize et
      if (word === word.toLocaleUpperCase('tr-TR') || word === word.toLocaleLowerCase('tr-TR')) {
        return capitalizeTr(stripped)
      }
      return word
    })
    .join(' ')
}

function capitalizeTr(s: string): string {
  if (!s) return s
  return s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1).toLocaleLowerCase('tr-TR')
}

/**
 * "Medikal Estetik" -> "MEDİKAL ESTETİK"
 * Kart eyebrow text icin — clinic_type'i caps yapar.
 */
export function formatClinicTypeEyebrow(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw.toLocaleUpperCase('tr-TR')
}

/**
 * "İstanbul, Beylikdüzü" -> aynisi (zaten dogru)
 * Konum'u temizle: virgul aralarinda tek bosluk, yanlis caps duzelt.
 */
export function formatLocation(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw
    .split(',')
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => {
      // Tum harfler buyuk veya tum harfler kucukse normalize et
      if (p === p.toLocaleUpperCase('tr-TR') || p === p.toLocaleLowerCase('tr-TR')) {
        return p.split(' ').map(w => capitalizeTr(w)).join(' ')
      }
      return p
    })
    .join(', ')
}
