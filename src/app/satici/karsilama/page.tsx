import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
 * Mantık (auth-öncelikli, cookie değil):
 *  - Giriş yapmış vendor → /satici/panel (AppHome doğrudan)
 *  - Giriş yapmamış → karşılama göster (vendor henüz giriş yapana kadar
 *    her açılışta tanıtım görür; cookie zinciri giriş ekranına atmaz)
 *
 * 4 app'e klonlanabilir pattern.
 */
export default async function KarsilamaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    redirect('/satici/panel')
  }
  return <KarsilamaSlider />
}
