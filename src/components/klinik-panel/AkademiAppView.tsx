import Link from 'next/link'
import { GraduationCap, ChevronRight } from 'lucide-react'

export default function AkademiAppView() {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <section className="px-5 pt-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-3">
            <GraduationCap size={26} className="text-emerald-300" />
          </div>
          <p className="text-white font-bold">Estelongy Akademi</p>
          <p className="text-sm text-slate-400 leading-relaxed mt-2">
            Bilim, kongre takvimi, klinik vakalar ve protokol kütüphanesi.
          </p>
        </div>
      </section>

      {/* Eğitmen başvurusu */}
      <section className="px-5 mt-4">
        <Link
          href="/klinik/panel/akademi/basvur"
          className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 active:bg-emerald-500/20 transition"
        >
          <div className="min-w-0">
            <p className="text-emerald-200 text-sm font-bold">Eğitmen Ol</p>
            <p className="text-xs text-emerald-300/80 mt-0.5">
              Video paketleri yükle, %70 gelir payı kazan
            </p>
          </div>
          <ChevronRight size={18} className="text-emerald-300 shrink-0" />
        </Link>
      </section>

      <section className="px-5 mt-4 space-y-2.5">
        {[
          { icon: '🧬', title: 'Bilim & yenilikler', desc: 'Haftalık özet.' },
          { icon: '🎤', title: 'Kongreler', desc: 'Aylık takvim.' },
          { icon: '🏥', title: 'Anonim vakalar', desc: 'Topluluk paylaşımı.' },
          { icon: '📐', title: 'Protokol kütüphanesi', desc: 'Skor bandına göre.' },
        ].map((c) => (
          <div
            key={c.title}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3.5 flex gap-3"
          >
            <span className="text-xl shrink-0">{c.icon}</span>
            <div className="min-w-0">
              <p className="text-white text-sm font-bold">{c.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{c.desc}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
