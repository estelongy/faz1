import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import KarsilamaSlider from './KarsilamaSlider'

export const dynamic = 'force-dynamic'

/**
 * EsteStorePRO onboarding / karşılama.
 *
 * Capacitor server.url buraya bakar. Üç-slayt tanıtım + 3 CTA:
 *  - Giriş yap (mevcut iş ortakları)
 *  - İş Ortağı başvurusu (yeni başvuru)
 *  - Yanlış geldim (consumer app'lere yönlendir)
 *
 * eg_onboard_seen=1 cookie'si varsa bir daha gösterilmez — doğrudan
 * /satici/panel'e bounce (giriş varsa AppHome, yoksa middleware /giris'e atar).
 *
 * 4 app'e klonlanabilir pattern.
 */
export default async function KarsilamaPage() {
  const jar = await cookies()
  if (jar.get('eg_onboard_seen')?.value === '1') {
    redirect('/satici/panel')
  }
  return <KarsilamaSlider />
}
