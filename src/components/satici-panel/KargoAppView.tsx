import { Truck } from 'lucide-react'
import KargoAyarForm from '@/app/satici/panel/kargo/KargoAyarForm'

type Settings = Parameters<typeof KargoAyarForm>[0]['existing']

interface Props {
  carriers: string[]
  companyName: string
  companyAddress: string
  settings: Settings
}

export default function KargoAppView({ carriers, companyName, companyAddress, settings }: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-3">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-400/80">Kargo Ayarları</p>
        <p className="mt-1 text-sm text-slate-400">
          Gönderici bilgilerin & tercih ettiğin kargo şirketleri.
        </p>
      </header>

      {!settings && (
        <div className="mx-5 mt-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex items-start gap-2">
          <Truck size={16} className="shrink-0 mt-0.5" />
          <p>Henüz kargo ayarın yok. Etiket üretebilmek için bu formu doldur.</p>
        </div>
      )}

      <section className="px-5 mt-4">
        <KargoAyarForm
          carriers={carriers}
          companyName={companyName}
          companyAddress={companyAddress}
          existing={settings ?? null}
        />
      </section>

      <section className="px-5 mt-5">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-sm text-slate-400 space-y-2">
          <p className="font-semibold text-slate-200">Nasıl çalışır?</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Sipariş gelince &quot;Hazırla&quot; → &quot;Etiket Oluştur&quot;</li>
            <li>Etiket sayfası açılır — yazdır & kargoya yapıştır</li>
            <li>Toplu etiket ile birden fazla sipariş tek sayfada</li>
            <li>Müşteri otomatik takip kodu alır</li>
          </ol>
        </div>
      </section>
    </div>
  )
}
