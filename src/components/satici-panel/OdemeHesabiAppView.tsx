import OdemeHesabiPanel from '@/app/satici/panel/odeme-hesabi/OdemeHesabiPanel'

type InitData = Parameters<typeof OdemeHesabiPanel>[0]['initial']

interface Props {
  initial: InitData
  flashOk?: boolean
  flashRefresh?: boolean
}

export default function OdemeHesabiAppView({ initial, flashOk, flashRefresh }: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-3">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-400/80">Ödeme Hesabı</p>
        <p className="mt-1 text-sm text-slate-400">Stripe üzerinden banka hesabına transfer</p>
      </header>

      {flashOk && (
        <div className="mx-5 mt-2 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
          ✓ Bilgi girişi tamamlandı. Stripe hesabın birkaç dakikada aktif olur.
        </div>
      )}
      {flashRefresh && (
        <div className="mx-5 mt-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
          ⚠ Oturum yenilendi. Süreci tekrar başlat.
        </div>
      )}

      <section className="px-5 mt-3">
        <OdemeHesabiPanel initial={initial} />
      </section>
    </div>
  )
}
