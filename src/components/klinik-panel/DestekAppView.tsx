import Link from 'next/link'
import { Mail, MessageCircle, ChevronRight } from 'lucide-react'

export default function DestekAppView() {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-3">
        <p className="text-sm text-slate-400">
          Estelongy ekibiyle doğrudan iletişim. Teknik sorun, öneri veya partnerlik için yaz.
        </p>
      </header>

      {/* İletişim */}
      <section className="px-5 space-y-2.5">
        <a
          href="mailto:klinik@estelongy.com"
          className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 active:bg-slate-900 transition"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Mail size={20} className="text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">E-posta</p>
            <p className="text-xs text-emerald-300/90 font-mono mt-0.5 truncate">
              klinik@estelongy.com
            </p>
          </div>
          <ChevronRight size={18} className="text-slate-600" />
        </a>

        <a
          href="https://wa.me/905439455003"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 active:bg-slate-900 transition"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <MessageCircle size={20} className="text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">WhatsApp</p>
            <p className="text-xs text-emerald-300/90 font-mono mt-0.5">+90 543 945 50 03</p>
          </div>
          <ChevronRight size={18} className="text-slate-600" />
        </a>
      </section>

      {/* SSS */}
      <section className="px-5 mt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-2">
          Sık Sorulan
        </p>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800">
          {[
            { q: 'Krediler nasıl çalışır?', href: '/klinik/panel/kredi' },
            { q: 'Kredi paketi satın alma', href: '/klinik/panel/kredi' },
            { q: 'Müsaitlik takvimi ayarı', href: '/klinik/panel/musaitlik' },
            { q: 'Genel SSS', href: '/hakkinda/sss' },
          ].map((item) => (
            <Link
              key={item.href + item.q}
              href={item.href}
              className="flex items-center justify-between px-4 py-3.5 active:bg-slate-900 transition"
            >
              <span className="text-sm text-slate-200">{item.q}</span>
              <ChevronRight size={16} className="text-slate-600" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
