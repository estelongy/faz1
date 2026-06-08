import Link from 'next/link'
import { Package, Truck, Star, ShoppingBag, Wallet, BarChart3, Store } from 'lucide-react'

interface Props {
  greeting: string
  vendorFirstName: string
  companyName: string
  pendingOrders: number
  openReturns: number
  openQuestions: number
  todayOrders: number
  totalEarnings30d: number
}

/**
 * EsteStorePRO app için /satici/panel ev ekranı — mobil-first.
 *
 * Web dashboard (panel/page.tsx default return) masaüstü 5xl ızgaralı.
 * Bu sürüm: dikey akış, büyük dokunma alanları, status bar / safe-area + bottom-nav
 * boşluğu hesaplı padding. Çıkış burada YOK (kullanıcı talimatı) — Menü sekmesinde.
 *
 * Render edilme yeri: src/app/satici/panel/page.tsx → flavor === 'estestorepro' ise.
 * Aksi halde mevcut web panel render edilir.
 */
export default function SaticiPROAppHome({
  greeting,
  vendorFirstName,
  companyName,
  pendingOrders,
  openReturns,
  openQuestions,
  todayOrders,
  totalEarnings30d,
}: Props) {
  return (
    <div
      // -m-4 lg:-m-8: panel layout'unun main p-4/p-8'ini iptal ederek full-bleed
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{
        // SaticiBottomNav için (60 + safe-area-bottom) + biraz nefes
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
      }}
    >
      {/* Karşılama */}
      <header className="px-5 pt-4 pb-3">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-400/80 truncate">{companyName}</p>
        <h1 className="mt-1 text-2xl font-bold leading-tight">
          {greeting},<br />
          <span className="text-amber-300">Hoş geldin, {vendorFirstName}</span>
        </h1>
      </header>

      {/* Üst hızlı durum şeridi — kazanç + performans */}
      <div className="px-5 grid grid-cols-2 gap-2.5">
        <Link
          href="/satici/panel/kazanc"
          className="flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 active:bg-amber-500/20 transition"
        >
          <Wallet size={18} className="text-amber-300 shrink-0" />
          <div className="min-w-0">
            <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">Kazanç 30g</p>
            <p className="text-white font-bold text-base leading-tight truncate">
              ₺{totalEarnings30d.toLocaleString('tr-TR')}
            </p>
          </div>
        </Link>
        <Link
          href="/satici/panel/performans"
          className="flex items-center gap-2 rounded-2xl border border-violet-500/25 bg-violet-500/10 px-4 py-3 active:bg-violet-500/20 transition"
        >
          <BarChart3 size={18} className="text-violet-300 shrink-0" />
          <div className="min-w-0">
            <p className="text-violet-400 text-[10px] font-bold uppercase tracking-wider">Skor</p>
            <p className="text-white font-bold text-base leading-tight truncate">Performans</p>
          </div>
        </Link>
      </div>

      {/* ŞİMDİ — bekleyen + akış rakamları büyük göster */}
      <section className="mt-5 px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2">Şimdi</p>
        <Link
          href="/satici/panel/siparisler"
          className="block rounded-2xl border border-slate-800 bg-slate-900/60 p-4 active:bg-slate-900 transition"
        >
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Bugün" value={todayOrders} accent="text-white" />
            <Stat label="Bekleyen" value={pendingOrders} accent={pendingOrders > 0 ? 'text-amber-300' : 'text-white'} />
            <Stat label="Akışta" value={openReturns + openQuestions} accent={(openReturns + openQuestions) > 0 ? 'text-emerald-300' : 'text-white'} />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {openReturns} iade · {openQuestions} soru · Siparişleri aç →
          </p>
        </Link>
      </section>

      {/* Hızlı eylemler */}
      <section className="mt-5 px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2">Hızlı Erişim</p>
        <div className="grid grid-cols-2 gap-2.5">
          <QuickAction href="/satici/panel/urunler" Icon={Package} label="Ürünler" />
          <QuickAction href="/satici/panel/siparisler" Icon={ShoppingBag} label="Siparişler" />
          <QuickAction href="/satici/panel/kargo" Icon={Truck} label="Kargo" />
          <QuickAction href="/satici/panel/yorumlar" Icon={Star} label="Yorumlar" />
        </div>
      </section>

      {/* Mağaza vurgusu */}
      <section className="mt-5 px-5">
        <Link
          href="/satici/panel/magaza"
          className="flex items-center gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/5 px-4 py-3.5 active:bg-violet-500/10 transition"
        >
          <Store size={18} className="text-violet-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">Mağaza Vitrini</p>
            <p className="text-xs text-slate-500 mt-0.5">Görünüm ve ayarlar</p>
          </div>
          <span className="text-slate-500">→</span>
        </Link>
      </section>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-black tabular-nums ${accent}`}>{value}</p>
    </div>
  )
}

function QuickAction({
  href,
  Icon,
  label,
}: {
  href: string
  Icon: typeof Package
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3.5 active:bg-slate-900 transition"
    >
      <Icon size={18} className="text-slate-300 shrink-0" />
      <span className="text-sm font-medium text-white">{label}</span>
    </Link>
  )
}
