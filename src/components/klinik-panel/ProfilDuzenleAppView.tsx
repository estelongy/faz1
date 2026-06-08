import EditForm from '@/app/klinik/panel/profil/duzenle/EditForm'

interface Props {
  initial: Parameters<typeof EditForm>[0]['initial']
}

export default function ProfilDuzenleAppView({ initial }: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-3">
        <p className="text-sm text-slate-400">
          Hastaların gördüğü kliniğine ait bilgileri güncelle.
        </p>
      </header>
      <div className="px-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <EditForm initial={initial} />
        </div>
        <p className="mt-3 text-xs text-slate-600">
          Güncelleme sonrası değişiklikler klinik panelde ve hasta tarafında anında görünür.
        </p>
      </div>
    </div>
  )
}
