import { GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { applyForEducator, withdrawApplication } from '@/app/klinik/panel/akademi/basvur/actions'

interface Props {
  justSubmitted: boolean
  clinic: {
    is_educator: boolean | null
    educator_application_status: string | null
    educator_application_message: string | null
    educator_applied_at: string | null
    educator_decided_at: string | null
    educator_decision_note: string | null
  }
}

export default function AkademiBasvurAppView({ justSubmitted, clinic }: Props) {
  if (clinic.is_educator) {
    return (
      <Shell>
        <div className="px-5 pt-6">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-3">
              <GraduationCap size={26} className="text-emerald-200" />
            </div>
            <p className="text-white font-bold">Eğitmen Yetkisi Aktif</p>
            <p className="text-sm text-slate-300 mt-2">
              Paket oluşturup videolarını yükleyebilirsin.
            </p>
            <Link
              href="/klinik/panel/akademi/paketler"
              className="inline-flex items-center mt-4 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold active:bg-emerald-400 transition"
            >
              Eğitmen Paneline Git →
            </Link>
          </div>
        </div>
      </Shell>
    )
  }

  const status = clinic.educator_application_status ?? 'none'

  return (
    <Shell>
      {justSubmitted && (
        <div className="px-5 pt-4">
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-emerald-200 text-sm">
            ✓ Başvurun alındı. Estelongy ekibi en kısa sürede dönüş yapacak.
          </div>
        </div>
      )}

      <section className="px-5 pt-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap size={20} className="text-emerald-300" />
            <p className="text-white font-bold">Akademi Eğitmenliği</p>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Tecrübeni video paketleriyle paylaş. Estelongy %30, eğitmen %70 gelir payı.
            Ödemeler ay sonu IBAN&apos;a transfer edilir.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Perk emoji="💰" title="%70 pay" />
            <Perk emoji="🎯" title="Özgürlük" />
            <Perk emoji="🌟" title="Rozet" />
          </div>
        </div>
      </section>

      {status === 'pending' && (
        <section className="px-5 mt-4">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
            <p className="text-white font-bold">⏳ Başvurun değerlendiriliyor</p>
            {clinic.educator_applied_at && (
              <p className="text-slate-400 text-xs mt-1">
                {new Date(clinic.educator_applied_at).toLocaleDateString('tr-TR')}
              </p>
            )}
            {clinic.educator_application_message && (
              <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Mesajın</p>
                <p className="text-slate-300 text-sm whitespace-pre-wrap">
                  {clinic.educator_application_message}
                </p>
              </div>
            )}
            <form action={withdrawApplication} className="mt-3">
              <button
                type="submit"
                className="text-sm px-3 py-2 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 font-semibold"
              >
                Başvuruyu Geri Çek
              </button>
            </form>
          </div>
        </section>
      )}

      {status === 'rejected' && (
        <section className="px-5 mt-4">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
            <p className="text-white font-bold">✕ Başvurun reddedildi</p>
            {clinic.educator_decided_at && (
              <p className="text-slate-500 text-xs mt-1">
                {new Date(clinic.educator_decided_at).toLocaleDateString('tr-TR')}
              </p>
            )}
            {clinic.educator_decision_note && (
              <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Not</p>
                <p className="text-slate-300 text-sm whitespace-pre-wrap">
                  {clinic.educator_decision_note}
                </p>
              </div>
            )}
            <p className="text-slate-400 text-sm mt-3">Eksiklikleri tamamlayıp tekrar başvurabilirsin.</p>
          </div>
        </section>
      )}

      {(status === 'none' || status === 'rejected') && (
        <section className="px-5 mt-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-white font-bold mb-2">
              {status === 'rejected' ? 'Tekrar Başvur' : 'Eğitmen Başvurusu'}
            </p>
            <p className="text-slate-400 text-sm mb-4">
              Neden eğitmen olmak istediğini, deneyimini ve hangi paketleri planladığını anlat.
            </p>

            <form action={applyForEducator} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Başvuru Mesajın <span className="text-rose-400">*</span>{' '}
                  <span className="text-slate-600">(en az 50 karakter)</span>
                </label>
                <textarea
                  name="message"
                  required
                  minLength={50}
                  maxLength={2000}
                  rows={8}
                  className="w-full px-3 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold active:bg-emerald-400 transition"
              >
                Başvuruyu Gönder
              </button>
            </form>
          </div>
        </section>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      {children}
    </div>
  )
}

function Perk({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-center">
      <div className="text-lg">{emoji}</div>
      <p className="text-white text-xs font-bold mt-0.5">{title}</p>
    </div>
  )
}
