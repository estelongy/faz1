export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TETKIK_PARAMS } from '@/lib/tetkik-params'
import RaporPrintToolbar from './RaporPrintToolbar'

export const metadata: Metadata = {
  title: 'Analiz Raporu — Estelongy',
  robots: { index: false, follow: false },
}

interface AnalysisRow {
  id: string
  user_id: string
  web_overall: number | null
  temp_overall: number | null
  final_overall: number | null
  web_scores: Record<string, number> | null
  doctor_notes: string | null
  doctor_approved_scores: {
    tetkik?: Record<string, number>
    hekim_skoru?: number
    ileri_analiz_c250?: Record<string, number>
  } | null
  web_ai_raw: {
    actual_age?: number
    estimated_skin_age?: number
    confidence?: number
  } | null
  created_at: string
}

const COMPONENT_LABEL: Record<string, string> = {
  hydration:       'Nem',
  tone_uniformity: 'Ton',
  wrinkles:        'Kırışıklık (yüksek = daha fazla)',
  pigmentation:    'Pigmentasyon (yüksek = daha fazla)',
  under_eye:       'Göz Altı',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function scoreColor(s: number | null | undefined): string {
  if (s == null) return '#94a3b8'
  if (s >= 75) return '#059669'
  if (s >= 50) return '#d97706'
  return '#dc2626'
}

export default async function RaporPage({ params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/giris?next=/skor/rapor/${analysisId}`)

  const { data: analysis } = await supabase
    .from('analyses')
    .select('id, user_id, web_overall, temp_overall, final_overall, web_scores, doctor_notes, doctor_approved_scores, web_ai_raw, created_at')
    .eq('id', analysisId)
    .maybeSingle()

  if (!analysis) notFound()
  if (analysis.user_id !== user.id) notFound()

  const row = analysis as AnalysisRow
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, birth_year')
    .eq('id', user.id)
    .maybeSingle()

  const overall = row.final_overall ?? row.temp_overall ?? row.web_overall ?? null
  const isClinicApproved = row.final_overall != null
  const phase = isClinicApproved ? 'Klinik Onaylı' : 'Ön Analiz (AI)'
  const ws = row.web_scores ?? {}
  const das = row.doctor_approved_scores
  const tetkik = das?.tetkik
    ? TETKIK_PARAMS.map(p => ({ ...p, value: das.tetkik![p.key] })).filter(t => t.value != null)
    : []
  const actualAge = profile?.birth_year ? new Date().getFullYear() - profile.birth_year : (row.web_ai_raw?.actual_age ?? null)
  const apparentAge = row.web_ai_raw?.estimated_skin_age ?? null

  return (
    <main className="min-h-screen bg-white print:bg-white">
      <RaporPrintToolbar />

      <div className="rapor-doc max-w-4xl mx-auto px-6 py-10 sm:px-10 sm:py-14 text-slate-900">
        {/* Başlık */}
        <header className="mb-8 pb-6 border-b-2 border-slate-200">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm tracking-[0.3em] text-[#8B7339] mb-1">ESTELONGY</div>
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                Estelongy Gençlik Skoru Raporu
              </h1>
              <p className="text-slate-600 text-sm mt-1">{phase}</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-slate-500">Rapor No</p>
              <p className="font-mono text-slate-900 font-bold">{row.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-slate-500 mt-2">Tarih</p>
              <p className="text-slate-700">{formatDate(row.created_at)}</p>
            </div>
          </div>
        </header>

        {/* Kişi */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Hesap Bilgileri</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Ad Soyad</p>
              <p className="text-slate-900 font-semibold">{profile?.full_name ?? '—'}</p>
            </div>
            {actualAge != null && (
              <div>
                <p className="text-slate-500">Yaş</p>
                <p className="text-slate-900 font-semibold">{actualAge}</p>
              </div>
            )}
          </div>
        </section>

        {/* Skor */}
        <section className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 print:border-slate-300">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div>
              <p className="text-sm uppercase tracking-wider text-slate-500 mb-1">Toplam Skor</p>
              <p className="text-6xl font-black tabular-nums" style={{ color: scoreColor(overall) }}>
                {overall != null ? Math.round(overall) : '—'}
                <span className="text-2xl text-slate-400 font-normal ml-1">/100</span>
              </p>
            </div>
            {apparentAge != null && (
              <div className="text-right">
                <p className="text-sm uppercase tracking-wider text-slate-500 mb-1">Görünüm Yaşı (AI Tahmini)</p>
                <p className="text-4xl font-bold text-slate-900">{apparentAge}</p>
                {actualAge != null && (
                  <p className="text-sm text-slate-500 mt-1">
                    {actualAge - apparentAge > 0
                      ? `${actualAge - apparentAge} yıl daha genç görünüm`
                      : actualAge - apparentAge < 0
                        ? `${Math.abs(actualAge - apparentAge)} yıl daha yaşlı görünüm`
                        : 'Yaşla uyumlu'}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Bileşen skorları */}
        {Object.keys(ws).length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-slate-900 mb-3">Bileşen Skorları (AI)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(ws).map(([key, value]) => {
                if (value == null) return null
                const label = COMPONENT_LABEL[key] ?? key
                const invert = key === 'wrinkles' || key === 'pigmentation'
                const display = invert ? 100 - value : value
                return (
                  <div key={key} className="p-3 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-sm text-slate-600">{label}</span>
                      <span className="font-bold text-slate-900 tabular-nums">{value}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${display}%`, background: scoreColor(display) }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Tetkik (klinik onaylı varsa) */}
        {tetkik.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-slate-900 mb-3">Tetkik Sonuçları</h2>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left p-2 font-semibold">Parametre</th>
                    <th className="text-right p-2 font-semibold">Değer</th>
                    <th className="text-right p-2 font-semibold">Referans</th>
                    <th className="text-right p-2 font-semibold">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {tetkik.map(t => {
                    const inRange = t.value! >= t.min && t.value! <= t.max
                    return (
                      <tr key={t.key} className="border-t border-slate-100">
                        <td className="p-2 text-slate-700">{t.label}</td>
                        <td className="p-2 text-right font-mono">{t.value} {t.unit}</td>
                        <td className="p-2 text-right text-slate-500 font-mono">{t.min}–{t.max}</td>
                        <td className="p-2 text-right">
                          <span className={inRange ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                            {inRange ? '✓ Normal' : '⚠ Aralık dışı'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Hekim notları */}
        {(row.doctor_notes || das?.hekim_skoru != null) && (
          <section className="mb-8 p-5 rounded-xl bg-amber-50 border border-amber-200">
            <h2 className="text-base font-bold text-amber-800 mb-2">Hekim Değerlendirmesi</h2>
            {das?.hekim_skoru != null && (
              <p className="text-amber-900 mb-2">
                Hekim skoru: <strong>{das.hekim_skoru}/100</strong>
              </p>
            )}
            {row.doctor_notes && (
              <p className="text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">{row.doctor_notes}</p>
            )}
          </section>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t-2 border-slate-200 text-sm text-slate-500 space-y-2">
          <p>
            Bu rapor <strong className="text-slate-700">Estelongy</strong> platformu üzerinden oluşturulmuştur ve
            6698 sayılı KVKK madde 11 kapsamında <strong>veri taşınabilirlik hakkınızın</strong> kullanımıdır.
          </p>
          <p>
            Rapor tıbbi tanı koyma niteliği taşımaz; bilgilendirme amaçlıdır. Kesin değerlendirme için
            hekiminize başvurunuz.
          </p>
          <p className="pt-2 text-slate-400">
            Veri sorumlusu: Vestoriq OÜ — kvkk@estelongy.com · {formatDate(new Date().toISOString())}
          </p>
        </footer>
      </div>

      <style>{`
        @media print {
          .rapor-print-hide { display: none !important; }
          .rapor-doc { padding: 1.5rem 1rem !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </main>
  )
}
