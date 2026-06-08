import { getServerFlavor } from '@/lib/server-flavor'
import { createClient } from '@/lib/supabase/server'
import { FLAVOR_HOME } from './flavor-detect'

/**
 * App flavor ↔ kullanıcı rolü uyumsuzluğunda full-screen kapı.
 *
 * Kurallar:
 * - flavor=esteklinikpro + kullanıcı klinik DEĞİL → "Bu app klinikler için" kapısı
 * - flavor=esteklinik (consumer) + kullanıcı klinik → "EsteKlinikPRO'ya geç" kapısı
 *   (PRO Play Store'da yoksa: "şimdilik panele git" linki açık)
 *
 * Diğer kombinasyonlar (saf kullanıcı + consumer app, biyoage, estestore vs)
 * için null döner — kapı yok.
 *
 * Server component — auth + flavor server tarafında okunur, flash yok.
 * Sadece auth user varken çalışır; misafir gözüne kapı çıkmaz.
 */
export default async function AppFlavorRoleGate() {
  const flavor = await getServerFlavor()

  // Hızlı çıkış: kapı potansiyeli olan flavor'lar dışındaysa hiç sorgu atma.
  if (flavor !== 'esteklinikpro' && flavor !== 'esteklinik') return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null // misafire kapı yok — giriş ekranı zaten yönlendirir

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  const isClinic = !!clinic

  // Eşleşme — kapı yok
  if (flavor === 'esteklinikpro' && isClinic) return null
  if (flavor === 'esteklinik' && !isClinic) return null

  // Mismatch — kapı göster
  if (flavor === 'esteklinikpro' && !isClinic) {
    return (
      <GateOverlay
        eyebrow="EsteKlinikPRO"
        title="Bu app klinikler için"
        body="EsteKlinikPRO klinik sahipleri, hekim ve sekreterler için tasarlandı. Tüketici deneyimi için Estelongy app'lerini indirebilirsin."
        primary={{ label: 'BiyoAGE app — Play Store', href: 'https://play.google.com/store/apps/details?id=com.estelongy.biyoage' }}
        secondary={{ label: 'EsteKlinik app — Play Store', href: 'https://play.google.com/store/apps/details?id=com.estelongy.esteklinik' }}
        tertiary={{ label: 'Çıkış yap', formAction: '/api/auth/sign-out' }}
      />
    )
  }

  if (flavor === 'esteklinik' && isClinic) {
    return (
      <GateOverlay
        eyebrow="Klinik hesabı"
        title="Klinik için EsteKlinikPRO var"
        body="Klinik hesabınla daha hızlı çalışmak için EsteKlinikPRO app'i tasarlandı. Yayınlanır yayınlanmaz Play Store linkinden indirebilirsin. Şimdilik klinik paneline burada devam edebilirsin."
        primary={{ label: 'Klinik panelime git', href: FLAVOR_HOME.esteklinikpro }}
        secondary={{ label: 'EsteKlinikPRO — Play Store', href: 'https://play.google.com/store/apps/details?id=com.estelongy.esteklinikpro' }}
        tertiary={{ label: 'Çıkış yap', formAction: '/api/auth/sign-out' }}
      />
    )
  }

  return null
}

type CTA = { label: string; href: string }
type FormCTA = { label: string; formAction: string }

function GateOverlay({
  eyebrow,
  title,
  body,
  primary,
  secondary,
  tertiary,
}: {
  eyebrow: string
  title: string
  body: string
  primary: CTA
  secondary?: CTA
  tertiary?: FormCTA
}) {
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-[#0B0A14]/95 backdrop-blur-sm p-6"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)',
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-[#1B1330] to-[#160F28] p-6 shadow-2xl">
        <div className="text-xs uppercase tracking-[0.18em] text-emerald-400">{eyebrow}</div>
        <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-white/70">{body}</p>

        <div className="mt-6 space-y-2">
          <a
            href={primary.href}
            className="block w-full rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            {primary.label}
          </a>
          {secondary && (
            <a
              href={secondary.href}
              className="block w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-medium text-white/85 transition hover:bg-white/10"
            >
              {secondary.label}
            </a>
          )}
          {tertiary && (
            <form action={tertiary.formAction} method="post" className="pt-2">
              <button
                type="submit"
                className="block w-full rounded-xl px-4 py-2 text-center text-xs text-rose-300/80 transition hover:text-rose-300"
              >
                {tertiary.label}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
