import { Monitor } from 'lucide-react'
import TopluYukleClient from '@/app/satici/panel/urunler/toplu/TopluYukleClient'

export default function UrunTopluAppView() {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-3">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-400/80">Toplu Ürün Yükle</p>
        <p className="mt-1 text-sm text-slate-400">CSV ile 500 ürüne kadar tek seferde</p>
      </header>

      <div className="mx-5 mt-2 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
        <Monitor size={16} className="shrink-0 mt-0.5 text-slate-500" />
        <p>
          CSV hazırlamak için bilgisayar daha rahat — Excel/Numbers&apos;da düzenleyip buradan yükle.
          Mobilden tek tek ürün eklemek istersen <strong className="text-amber-300">Ürünler</strong> ekranındaki &quot;Yeni Ürün&quot; daha pratik.
        </p>
      </div>

      <section className="px-5 mt-4">
        <TopluYukleClient />
      </section>
    </div>
  )
}
