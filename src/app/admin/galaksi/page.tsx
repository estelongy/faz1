export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const metadata: Metadata = { title: 'Galaksi Sinyali' }

interface StatRow {
  galaxy: string
  visits: number
  unique_visitors: number
  returning_visitors: number
  logged_in_visitors: number
}

const GALAXY_META: Record<string, { name: string; accent: string; ring: string }> = {
  biyoage:    { name: 'BiyoAGE',    accent: 'text-[#B7A6E8]', ring: 'border-[#9F8CE0]/30' },
  esteklinik: { name: 'EsteKlinik', accent: 'text-emerald-300', ring: 'border-emerald-500/30' },
  estestore:  { name: 'EsteStore',  accent: 'text-[#C9A961]', ring: 'border-[#C9A961]/30' },
}

const RANGES = [
  { days: 7,  label: '7 gün' },
  { days: 30, label: '30 gün' },
  { days: 90, label: '90 gün' },
]

export default async function GalaksiSinyaliPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if ((user.app_metadata as Record<string, string>)?.role !== 'admin') redirect('/panel')

  const sp = await searchParams
  const days = [7, 30, 90].includes(Number(sp.days)) ? Number(sp.days) : 30

  const admin = createServiceClient()
  const { data, error } = await admin.rpc('galaxy_beachhead_stats', { days })
  const rows = (data ?? []) as StatRow[]

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-white">Galaksi Sinyali</h1>
        <p className="text-slate-400 text-sm mt-1">
          Beachhead ölçümü: her galaksinin <span className="text-slate-200">içsel çekimi</span> —
          &quot;diğerleri olmasa da geri dönen var mı?&quot;. Birinci-parti, KVKK-temiz (IP/UA tutulmaz).
        </p>
      </div>

      {/* Aralık seçimi */}
      <div className="flex gap-2 my-5">
        {RANGES.map(r => (
          <a
            key={r.days}
            href={`/admin/galaksi?days=${r.days}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              r.days === days
                ? 'bg-violet-600 text-white'
                : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {r.label}
          </a>
        ))}
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          Veri okunamadı: {error.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(row => {
          const meta = GALAXY_META[row.galaxy] ?? { name: row.galaxy, accent: 'text-slate-300', ring: 'border-slate-700' }
          const pullRate = row.unique_visitors > 0
            ? Math.round((row.returning_visitors / row.unique_visitors) * 100)
            : 0
          const loginRate = row.unique_visitors > 0
            ? Math.round((row.logged_in_visitors / row.unique_visitors) * 100)
            : 0
          return (
            <div key={row.galaxy} className={`rounded-2xl bg-slate-900 border ${meta.ring} p-5`}>
              <h2 className={`text-lg font-bold ${meta.accent}`}>{meta.name}</h2>

              {/* İçsel çekim — ana metrik */}
              <div className="mt-4 mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{pullRate}%</span>
                  <span className="text-sm text-slate-400">içsel çekim</span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {row.returning_visitors} / {row.unique_visitors} ziyaretçi 2+ ayrı gün döndü
                </p>
              </div>

              <dl className="space-y-2 text-sm border-t border-slate-800 pt-3">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Ziyaret</dt>
                  <dd className="text-slate-200 font-semibold">{row.visits}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Tekil ziyaretçi</dt>
                  <dd className="text-slate-200 font-semibold">{row.unique_visitors}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Geri dönen</dt>
                  <dd className="text-slate-200 font-semibold">{row.returning_visitors}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Üye ziyaretçi</dt>
                  <dd className="text-slate-200 font-semibold">{row.logged_in_visitors} ({loginRate}%)</dd>
                </div>
              </dl>
            </div>
          )
        })}
      </div>

      <p className="mt-6 text-sm text-slate-500 leading-relaxed max-w-2xl">
        İçsel çekim = aynı anonim ziyaretçinin (eg_vid çerezi) seçili aralıkta 2+ ayrı günde
        geri dönmesi. Strateji: 3 galaksiyi tek dar cepte besle, hangisinin içsel çekimi
        kendiliğinden büyüyorsa Estelongy başrolü ona versin.
      </p>
    </div>
  )
}
