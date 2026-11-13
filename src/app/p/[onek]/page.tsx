import { redirect } from 'next/navigation'

/**
 * Kısa panel adresi — /p/AY4GOK → /tavsiye/AY4GOK
 *
 * SMS'te her karakter kredi demek: "/tavsiye/" 9 karakter, "/p/" 3.
 * Kazanılan 6 karakter, uzun adlı referansörlerde (Abdurrahman gibi)
 * mesajı tek SMS sınırında (155) tutan paydır.
 *
 * NEDEN /p: /t zaten müşteri davet linki (src/app/t/[token]), /r da
 * kod sayfası (src/app/r/[code]). p = panel.
 *
 * Yalnız yönlendirir; panel mantığı tek yerde (/tavsiye/[onek]) durur.
 */
export default function KisaPanelAdresi({
  params,
}: { params: { onek: string } }) {
  redirect(`/tavsiye/${params.onek}`)
}
