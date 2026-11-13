export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'

/**
 * DIŞARIDAN BAŞVURU KAPATILDI (13 Kas 2026, kurucu kararı).
 *
 * Bu sayfa herkese açıktı: linki eline geçen herkes başvurabiliyordu,
 * referansör de linki kopyalayıp gruba atabiliyordu. Kim kimi davet etti
 * belli olmuyor, onay kuyruğu dolabiliyordu.
 *
 * Yeni yol: referansör kendi panelinden (/tavsiye → Davet) adayı TANITARAK
 * önerir, klinik okuyup karar verir. Kendi başına başvuru yok.
 *
 * Sayfa silinmedi, 404 veriyor: daha önce paylaşılmış linkler çalışmasın
 * ama dosya geçmişi ve yeniden açma yolu dursun. Açmak için notFound()
 * satırını kaldırmak yeterli — form bileşeni yerinde duruyor.
 */
export default function ReferansorBasvuruSayfasi() {
  notFound()
}
