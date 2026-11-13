export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import GirisFormu from './GirisFormu'
import KurulumCubugu from './KurulumCubugu'
import ReferansorPanel, { type PanelVerisi } from './[onek]/ReferansorPanel'
import { CEREZ_ONEKI } from './giris-sabit'

/**
 * Referansör giriş kapısı — önek bilinmeden.
 *
 * Panel adresi (/tavsiye/DH6GOK) unutulabilir; telefon unutulmaz.
 * Burada telefonla giriş yapılır.
 *
 * PWA kısayolunun start_url'ü /tavsiye, yani uygulama her açılışta
 * buraya düşüyor. Burası çerezi hiç okumadığı için 90 günlük oturum
 * dururken bile her seferinde yeniden SMS kodu isteniyordu.
 *
 * Çerez varsa panel BURADA gösterilir — /tavsiye/ONEK'e yönlendirme YOK.
 * Adres sabit kalır, uygulama tek adresten açılır.
 */
export const metadata: Metadata = {
  title: 'Tavsiye Panelim',
  robots: { index: false, follow: false },
  // K+ (klinik-manifest.json) ile ayni desen: id + scope + kare ikonlar.
  // Manifest olmazsa kok manifest devreye girip start_url "/" oluyor,
  // kurulan kisayol anasayfa aciyordu.
  manifest: '/tavsiye-manifest.json',
}

export default async function TavsiyeSayfasi() {
  // Oturum çerezi önek taşıyor (ref_oturum_SD8GOK). Hangi önek olduğunu
  // bilmediğimiz için ada göre arıyoruz; "bir telefon bir referansör"
  // kuralı tekliği zaten garantiliyor.
  const jar = await cookies()
  const oturum = jar.getAll().find(c => c.name.startsWith(CEREZ_ONEKI) && c.value)
  const onek = oturum ? oturum.name.slice(CEREZ_ONEKI.length) : null

  if (onek) {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('referral_panel', { p_onek: onek })
    const veri = data as PanelVerisi | null

    // Veri gelmiyorsa (kod kapatılmış, silinmiş) çerez işe yaramaz:
    // sessizce giriş formuna düş, "sayfa bulunamadı" gösterme.
    if (!error && veri?.aktif) {
      return (
        <main className="min-h-dvh bg-slate-950 px-4 py-6">
          <div className="mx-auto w-full max-w-md">
            <KurulumCubugu />
            <ReferansorPanel veri={veri} />
          </div>
        </main>
      )
    }
  }

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <GirisFormu />
      </div>
    </main>
  )
}
