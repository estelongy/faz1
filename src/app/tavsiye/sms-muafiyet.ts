/**
 * Saatlik SMS sınırından muaf numaralar — tavsiye akışının TEK listesi.
 *
 * Sınır kötü niyetliye karşı: her SMS para, açık kutu bakiyeyi yakar.
 * Ama kurucu akışı canlıda test ederken üç denemede duvara çarpıyor ve
 * bir saat beklemek zorunda kalıyordu. Muafiyet YALNIZCA buradaki
 * numaralar için; herkese açık koruma aynen duruyor.
 *
 * Üç yerde birden geçerli: panel girişi, referansör daveti, aday önerisi.
 * Numaralar normalizePhone biçiminde (10 hane, başta 0 ve 90 yok).
 *
 * Env ile de eklenebilir (virgülle): REF_SMS_SINIR_MUAF=5551112233,5554445566
 */
const MUAF = new Set(
  [
    '5439455003',   // Dr. İzzet Gök
    '5524228485',   // klinik / WhatsApp hattı
  ]
    .concat((process.env.REF_SMS_SINIR_MUAF ?? '').split(','))
    .map(t => t.replace(/\D/g, ''))
    .filter(Boolean),
)

/** Bu numara saatlik SMS sınırına takılsın mı? */
export function smsSiniriAsildi(
  tel: string, gonderilen: number, sinir: number,
): boolean {
  if (MUAF.has(tel.replace(/\D/g, ''))) return false
  return gonderilen >= sinir
}
