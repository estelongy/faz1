import type { Metadata } from 'next'
import MotorClient from './MotorClient'

/**
 * JESTOPIA — kesitsel randomizasyon motoru (gizli test paneli)
 *
 * Sadece iki girdi: evren büyüklüğü ve değer verilecek öğe sayısı.
 * Kesit boyutu bu ikisinden türetilir; mekanizma takvim, kimlik, tutar
 * veya sıra bilgisi kullanmaz — yalnızca öğe sayar.
 *
 * Arama motorlarına kapalı. Patent başvurusu öncesi yayım sayılmaması için
 * dışa bağlantı verilmez.
 */
export const metadata: Metadata = {
  title: 'Jestopia Motor',
  description: 'Kesitsel randomizasyon — iç test.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function Page() {
  return <MotorClient />
}
