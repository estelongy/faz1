import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { applyForEducator, withdrawApplication } from './actions'
import { getServerFlavor } from '@/lib/server-flavor'
import AkademiBasvurAppView from '@/components/klinik-panel/AkademiBasvurAppView'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function EgitmenBasvuruPage({ searchParams }: Props) {
  const sp = await searchParams
  const justSubmitted = sp.status === 'submitted'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, approval_status, is_educator, educator_application_status, educator_application_message, educator_applied_at, educator_decided_at, educator_decision_note')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!clinic) redirect('/esteklinik/basvur')
  if (clinic.approval_status !== 'approved') redirect('/klinik/panel')

  const flavor = await getServerFlavor()
  if (flavor === 'esteklinikpro') {
    return (
      <AkademiBasvurAppView
        justSubmitted={justSubmitted}
        clinic={{
          is_educator: clinic.is_educator,
          educator_application_status: clinic.educator_application_status,
          educator_application_message: clinic.educator_application_message,
          educator_applied_at: clinic.educator_applied_at,
          educator_decided_at: clinic.educator_decided_at,
          educator_decision_note: clinic.educator_decision_note,
        }}
      />
    )
  }

  // Zaten eğitmen
  if (clinic.is_educator) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-3xl">🎓</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Eğitmen Yetkisi Aktif</h1>
        <p className="text-slate-400 mb-6">
          Estelongy Akademi eğitmenisiniz. Paket oluşturup videolarınızı yükleyebilirsiniz.
        </p>
        <Link
          href="/klinik/panel/akademi/paketler"
          className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl"
        >
          Eğitmen Paneline Git →
        </Link>
      </div>
    )
  }

  const status = clinic.educator_application_status ?? 'none'

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/klinik/panel" className="inline-flex items-center text-slate-400 hover:text-white text-base mb-6 transition-colors font-semibold">
        ← Panele Dön
      </Link>

      {justSubmitted && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
          ✓ Başvurunuz alındı. Estelongy ekibi en kısa sürede değerlendirip dönüş yapacak.
        </div>
      )}

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🎓</span>
          <h1 className="text-2xl font-bold text-white">Estelongy Akademi Eğitmenliği</h1>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">
          Tecrübenizi platform üzerinden video paketleriyle paylaşın, diğer hekimlere satın. Estelongy %30 platform payı, eğitmen %70 gelir payı alır. Ödemeler ay sonu IBAN&apos;a transfer edilir.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-emerald-400 text-xl mb-1">💰</div>
            <div className="text-white font-semibold text-sm">%70 Gelir Payı</div>
            <div className="text-slate-500 text-sm mt-0.5">Her satıştan ana pay sizde</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-emerald-400 text-xl mb-1">🎯</div>
            <div className="text-white font-semibold text-sm">İçerik Özgürlüğü</div>
            <div className="text-slate-500 text-sm mt-0.5">Konu ve fiyatı siz belirlersiniz</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-emerald-400 text-xl mb-1">🌟</div>
            <div className="text-white font-semibold text-sm">Eğitmen Rozeti</div>
            <div className="text-slate-500 text-sm mt-0.5">Rehber profilinizde görünür</div>
          </div>
        </div>
      </div>

      {/* Bekleyen başvuru */}
      {status === 'pending' && (
        <div className="bg-slate-900 rounded-2xl border border-amber-500/30 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <span className="text-xl">⏳</span>
            </div>
            <div className="flex-1">
              <h2 className="text-white font-bold">Başvurunuz Değerlendiriliyor</h2>
              <p className="text-slate-400 text-sm mt-1">
                {clinic.educator_applied_at && (
                  <>Başvuru tarihi: {new Date(clinic.educator_applied_at).toLocaleDateString('tr-TR')} · </>
                )}
                Estelongy ekibi en kısa sürede dönüş yapacak.
              </p>
            </div>
          </div>

          {clinic.educator_application_message && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-sm text-slate-500 uppercase tracking-wider mb-2">Başvuru Mesajınız</div>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">{clinic.educator_application_message}</p>
            </div>
          )}

          <form action={withdrawApplication} className="mt-4">
            <button
              type="submit"
              className="text-base px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors font-semibold"
            >
              Başvuruyu Geri Çek
            </button>
          </form>
        </div>
      )}

      {/* Reddedilen başvuru */}
      {status === 'rejected' && (
        <div className="bg-slate-900 rounded-2xl border border-red-900/40 p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
              <span className="text-xl">✕</span>
            </div>
            <div className="flex-1">
              <h2 className="text-white font-bold">Başvurunuz Reddedildi</h2>
              {clinic.educator_decided_at && (
                <p className="text-slate-500 text-sm mt-1">
                  Karar tarihi: {new Date(clinic.educator_decided_at).toLocaleDateString('tr-TR')}
                </p>
              )}
            </div>
          </div>

          {clinic.educator_decision_note && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-4">
              <div className="text-sm text-slate-500 uppercase tracking-wider mb-2">Estelongy Notu</div>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">{clinic.educator_decision_note}</p>
            </div>
          )}

          <p className="text-slate-400 text-sm">
            İlgili eksiklikleri tamamlayıp tekrar başvurabilirsiniz.
          </p>
        </div>
      )}

      {/* Yeni başvuru formu — none veya rejected */}
      {(status === 'none' || status === 'rejected') && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <h2 className="text-white font-bold mb-2">{status === 'rejected' ? 'Tekrar Başvur' : 'Eğitmen Başvurusu'}</h2>
          <p className="text-slate-400 text-sm mb-6">
            Aşağıda neden eğitmen olmak istediğinizi, deneyiminizi ve hangi konularda paket çekmeyi planladığınızı kısaca anlatın. Bu mesaj Estelongy ekibinin onay kararında ana sinyal olur.
          </p>

          <form action={applyForEducator} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Başvuru Mesajınız <span className="text-red-400">*</span>
                <span className="text-slate-500 text-sm ml-2">(en az 50 karakter)</span>
              </label>
              <textarea
                name="message"
                required
                minLength={50}
                maxLength={2000}
                rows={8}
                placeholder={`Örnek:\n\nDermatoloji uzmanıyım, 12 yıllık serbest pratik. Filler ve biyostimülatör tekniklerinde 3000+ uygulama deneyimim var. Genç hekimlere öğretmek istediğim 3 ana konu: tam yüz analizi, periorbital bölge dolgu güvenliği, ip askı temelleri. İlk 2-3 paket için içerik plan taslağım hazır.`}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm resize-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-500">
              <strong className="text-slate-400">Not:</strong> Estelongy başvuruyu rehber skorunuz, deneyim sürenizi, mesajdaki içerik planını ve klinik aktivitenizi göz önünde bulundurarak değerlendirir. Onay süresi tipik olarak 3-7 gündür.
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-colors"
              >
                Başvuruyu Gönder
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
