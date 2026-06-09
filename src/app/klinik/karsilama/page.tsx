import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import KarsilamaSlider from './KarsilamaSlider'

export const dynamic = 'force-dynamic'

/**
 * EsteKlinikPRO onboarding / karşılama.
 *
 * Capacitor server.url buraya bakar. Üç-slayt tanıtım + CTA:
 *  - Giriş yap (mevcut klinik / hekim)
 *  - Klinik başvurusu (yeni klinik)
 *  - Ekosistem linkleri (yanlış geldiyse 3 consumer galaksisi)
 *
 * Mantık (auth-öncelikli, cookie değil):
 *  - Giriş yapmış klinik kullanıcısı → /klinik/panel
 *  - Giriş yapmış ama klinik DEĞİL → AppFlavorRoleGate kapısı (layout'ta)
 *  - Giriş yapmamış → karşılama göster
 *
 * EsteStorePRO karşılama deseninin klinik klonu.
 */
export default async function KlinikKarsilamaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const role = (user.app_metadata as Record<string, string> | undefined)?.role
    if (role === 'clinic') redirect('/klinik/panel')
    // Klinik değilse karşılamada bırak — AppFlavorRoleGate kapıyı açar.
  }
  return <KarsilamaSlider />
}
