import { Megaphone } from 'lucide-react'

export default function PazarlamaAppView() {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <section className="px-5 pt-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-3">
            <Megaphone size={26} className="text-emerald-300" />
          </div>
          <p className="text-white font-bold">Pazarlama Merkezi</p>
          <p className="text-xs text-emerald-400/80 mt-1 uppercase tracking-wider">Yakında</p>
          <p className="text-sm text-slate-400 leading-relaxed mt-3">
            Sosyal medya gönderileri, WhatsApp şablonları, klinik onaylı skor kartları —
            tek noktadan yönet.
          </p>
        </div>
      </section>

      <section className="px-5 mt-4 space-y-2.5">
        {[
          { icon: '🔗', title: 'Klinik linkim', desc: 'estelongy.com/esteklinik/randevu/...' },
          { icon: '💬', title: 'WhatsApp şablonları', desc: 'Hatırlatma, sonuç, tekrar.' },
          { icon: '📸', title: 'Skor paylaşım kartı', desc: 'Instagram/Twitter boyutları.' },
          { icon: '✍️', title: 'AI gönderi yazarı', desc: 'Hashtag öner, görselle eşle.' },
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
