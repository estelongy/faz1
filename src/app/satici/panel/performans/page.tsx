export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import { getVendorPerformance, type MetricScore } from '@/lib/vendor-performance'

export const metadata: Metadata = { title: 'Performans Skoru — İş Ortağı' }

function letterColor(letter: string): { bg: string; fg: string; ring: string } {
  switch (letter) {
    case 'A': return { bg: 'bg-emerald-500/20', fg: 'text-emerald-300', ring: 'ring-emerald-500/40' }
    case 'B': return { bg: 'bg-[#C9A961]/20',   fg: 'text-[#D4B872]',  ring: 'ring-[#C9A961]/40' }
    case 'C': return { bg: 'bg-amber-500/20',    fg: 'text-amber-300',  ring: 'ring-amber-500/40' }
    case 'D': return { bg: 'bg-orange-500/20',   fg: 'text-orange-300', ring: 'ring-orange-500/40' }
    default:  return { bg: 'bg-red-500/20',      fg: 'text-red-300',    ring: 'ring-red-500/40' }
  }
}

function bandStyle(band: MetricScore['band']) {
  switch (band) {
    case 'good': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: '✓', fg: 'text-emerald-400' }
    case 'ok':   return { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   icon: '○', fg: 'text-amber-400' }
    default:     return { bg: 'bg-red-500/10',     border: 'border-red-500/30',     icon: '!', fg: 'text-red-400' }
  }
}

export default async function PerformansSayfasi() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin' || role === 'clinic') redirect(pathForRole(role))

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name, approval_status')
    .eq('user_id', user.id)
    .single()
  if (!vendor || vendor.approval_status !== 'approved') notFound()

  const perf = await getVendorPerformance(vendor.id)
  const colors = letterColor(perf.letter)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-200">
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/satici/panel"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 hover:bg-slate-800/40 text-slate-300 hover:text-white text-base font-medium transition-colors">
            ← Panel
          </Link>
          <span className="text-white font-bold text-sm">Performans Skoru</span>
          <span className="w-16" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Performans Skoru</h1>
          <p className="text-slate-400 text-base mt-2">
            Son 90 günün özeti. Bu skor müşterilere doğrudan görünmüyor, ama vitrindeki sıralamayı etkiliyor.
          </p>
        </div>

        {/* Toplam skor + harf */}
        <div className={`p-6 sm:p-8 rounded-3xl ${colors.bg} border border-slate-700 ring-2 ${colors.ring}`}>
          <div className="flex items-center gap-6 flex-wrap">
            <div className={`shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl ${colors.bg} flex items-center justify-center text-6xl sm:text-7xl font-black ${colors.fg}`}>
              {perf.letter}
            </div>
            <div className="flex-1 min-w-[220px]">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Toplam Skor</p>
              <p className="text-5xl sm:text-6xl font-black text-white tracking-[-0.04em]">
                {perf.totalScore}<span className="text-slate-500 text-3xl">/100</span>
              </p>
              <p className="text-slate-300 text-base mt-2">
                Son 90 günde <strong className="text-white">{perf.totalOrders}</strong> sipariş işledin.
              </p>
              {!perf.hasEnoughData && (
                <p className="mt-3 px-3 py-2 rounded-lg bg-slate-900/60 text-slate-400 text-sm font-semibold">
                  ⏳ Yeterli veri yok. 5+ siparişten sonra skor daha doğru olacak.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Metrikler */}
        <div className="space-y-3">
          <h2 className="text-white font-bold text-lg">Detay Metrikler</h2>
          {perf.metrics.map(m => {
            const style = bandStyle(m.band)
            return (
              <div key={m.key} className={`p-5 rounded-2xl border ${style.border} ${style.bg}`}>
                <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black ${style.fg} bg-slate-900/40`}>
                      {style.icon}
                    </span>
                    <h3 className="text-white font-bold text-base">{m.label}</h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-black ${style.fg}`}>{m.value}</span>
                    <span className="text-slate-500 text-sm">{m.unit}</span>
                    <span className="ml-3 text-sm text-slate-400">
                      <strong className="text-white">{m.score}</strong>/20 puan
                    </span>
                  </div>
                </div>
                {/* Score bar */}
                <div className="w-full h-2 rounded-full bg-slate-900/50 overflow-hidden mb-3">
                  <div className={`h-full rounded-full ${
                    m.band === 'good' ? 'bg-emerald-400' :
                    m.band === 'ok'   ? 'bg-amber-400' : 'bg-red-400'
                  }`} style={{ width: `${(m.score / 20) * 100}%` }} />
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{m.description}</p>
              </div>
            )
          })}
        </div>

        {/* Açıklayıcı */}
        <div className="p-5 bg-slate-800/30 border border-slate-700 rounded-2xl text-sm text-slate-400 space-y-2">
          <p className="text-slate-200 font-bold mb-2">📊 Nasıl hesaplanıyor?</p>
          <p>5 metrik, her biri 0-20 puan, toplam 100. Yalnız son 90 gün verisiyle.</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400 mt-2">
            <li><strong>Kargolama Hızı:</strong> Sipariş alma ile kargo verme arası ortalama gün</li>
            <li><strong>İade Oranı:</strong> Toplam siparişe göre iade %&apos;si</li>
            <li><strong>Müşteri Puanı:</strong> vendor_reviews ortalaması (1-5 ★)</li>
            <li><strong>Soru Yanıt Oranı:</strong> Müşteri sorularının kaçını cevapladın</li>
            <li><strong>Yoruma Yanıt Oranı:</strong> Müşteri yorumlarının kaçına yanıt verdin</li>
          </ul>
          <p className="mt-3 text-slate-500">
            <strong className="text-slate-300">Not:</strong> 60 puan altına düşen satıcılar vitrinden geçici olarak kaldırılabilir.
            B (75+) ve üstü &quot;güvenli satıcı&quot; rozeti kazanır.
          </p>
        </div>
      </div>
    </main>
  )
}
