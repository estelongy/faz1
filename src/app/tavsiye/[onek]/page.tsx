export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ReferansorPanel, { type PanelVerisi } from './ReferansorPanel'
import GirisFormu from '../GirisFormu'
import { oturumCerez } from '../giris-sabit'

/**
 * Manifest öneğin altından sunulur, çünkü her referansörün kısayolu KENDİ
 * panelini açmalı. Eski tek statik dosyada start_url "." göreliydi ve
 * manifestin konumuna (kök) göre çözümlendiği için anasayfayı açıyordu.
 */
export function generateMetadata({ params }: { params: { onek: string } }): Metadata {
  return {
    title: 'Tavsiye Panelim',
    robots: { index: false, follow: false },
    manifest: `/tavsiye/${params.onek}/manifest.webmanifest`,
    // iOS manifesti OKUMAZ: Safari "Ana Ekrana Ekle" derken o anki URL'yi
    // kaydeder ve tam ekran icin bu meta etiketlerini arar. Bunlar olmadan
    // kisayol normal Safari sekmesi gibi aciliyordu.
    // iOS manifest ikonlarini da okumaz; apple-touch-icon yoksa ana ekrana
    // sayfanin ekran goruntusunu koyar.
    icons: { apple: '/apple-touch-icon.png' },
    appleWebApp: {
      capable: true,
      title: 'Tavsiye',
      statusBarStyle: 'black-translucent',
    },
  }
}

/**
 * Referansörün kendi paneli — ŞİFRESİZ.
 * Kodu (IG5GOK) bilen açar; veri `referral_panel` RPC'sinden gelir.
 * RPC SECURITY DEFINER olduğu için anonim istemci yalnızca kendi
 * önekinin verisini görebilir, tabloların tamamına erişemez.
 */
export default async function ReferansorSayfasi({
  params,
}: { params: { onek: string } }) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('referral_panel', { p_onek: params.onek })

  if (error || !data) notFound()
  const veri = data as PanelVerisi
  if (!veri.aktif) notFound()

  // Panel artık açık değil: önek bilinse bile SMS doğrulaması gerekiyor.
  // Doğrulama sonrası çerez 90 gün durur; başka cihazda yeniden sorulur.
  const jar = await cookies()
  if (!jar.get(oturumCerez(params.onek))) {
    return (
      <main className="min-h-dvh bg-slate-950 px-4 py-10">
        <div className="mx-auto w-full max-w-sm">
          <GirisFormu onek={params.onek} />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-6">
      <div className="mx-auto w-full max-w-md">
        <ReferansorPanel veri={veri} />
      </div>
    </main>
  )
}
