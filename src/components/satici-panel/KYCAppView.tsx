import KycForm from '@/app/satici/panel/kyc/KycForm'

type KycInitial = Parameters<typeof KycForm>[0]['initial']

interface Props {
  vendorId: string
  status: string
  initial: KycInitial
  reviewNote?: string | null
  submittedAt?: string | null
  reviewedAt?: string | null
  justSubmitted?: boolean
}

export default function KYCAppView({
  vendorId, status, initial, reviewNote, submittedAt, reviewedAt, justSubmitted,
}: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-3">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-400/80">KYC Bilgileri</p>
        <p className="mt-1 text-sm text-slate-400">Vergi, banka & sözleşme onayı</p>
      </header>

      {status === 'approved' && (
        <section className="px-5 mt-2">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <div className="text-4xl mb-3">✓</div>
            <p className="text-white font-bold text-lg mb-1">KYC Onaylı</p>
            <p className="text-emerald-300 text-sm">
              {reviewedAt ? new Date(reviewedAt).toLocaleDateString('tr-TR') + ' tarihinde onaylandı.' : ''}
            </p>
            <p className="text-slate-400 text-xs mt-3">
              Bilgileri güncellemek için destek@estelongy.com
            </p>
          </div>
        </section>
      )}

      {status === 'pending' && (
        <section className="px-5 mt-2">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-white font-bold text-lg mb-1">İncelemede</p>
            <p className="text-amber-300 text-sm">
              {submittedAt ? new Date(submittedAt).toLocaleDateString('tr-TR') + ' tarihinde gönderildi.' : ''}
            </p>
            <p className="text-slate-400 text-xs mt-3">İnceleme 1-2 iş günü.</p>
          </div>
        </section>
      )}

      {(status === 'not_submitted' || status === 'rejected') && (
        <>
          {justSubmitted && (
            <div className="mx-5 mt-2 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
              ✓ Bilgilerin incelemeye alındı.
            </div>
          )}

          {status === 'rejected' && reviewNote && (
            <div className="mx-5 mt-2 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              <p className="font-bold mb-1">⚠ Önceki başvurun reddedildi</p>
              <p className="whitespace-pre-wrap text-xs">{reviewNote}</p>
            </div>
          )}

          <div className="mx-5 mt-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            💡 Form uzun ve belge yüklemesi içeriyor. Mobilden zor geliyorsa bilgisayardan doldur,
            bu sayfayı daha kolay yönetebilirsin.
          </div>

          <section className="px-5 mt-4">
            <KycForm vendorId={vendorId} initial={initial} />
          </section>
        </>
      )}
    </div>
  )
}
