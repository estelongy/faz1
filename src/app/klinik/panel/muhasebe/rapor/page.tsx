export const dynamic = 'force-dynamic'

// Aylık muhasebe raporu — yazdırılabilir (tarayıcıdan "PDF olarak kaydet").
// Beyaz zemin, print-uyumlu; ekranda da aynı görünür.

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isMuhasebeOwner, clinicOwnerIdFor } from '@/lib/muhasebe-owner'
import PrintButton from './PrintButton'

export const metadata: Metadata = {
  title: 'Aylık Rapor | Klinik Yönetim',
  robots: { index: false, follow: false },
}

const TRY = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)

export default async function RaporPage({
  searchParams,
}: { searchParams: { ay?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if (!isMuhasebeOwner(user.id)) redirect('/klinik/panel')
  const clinicOwner = clinicOwnerIdFor(user.id) ?? user.id

  // Ay parametresi: YYYY-MM (geçersizse bu ay)
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const ay = /^\d{4}-(0[1-9]|1[0-2])$/.test(searchParams.ay ?? '') ? searchParams.ay! : thisMonth
  const monthStart = `${ay}-01`
  const monthEndDate = new Date(Number(ay.slice(0, 4)), Number(ay.slice(5, 7)), 0).getDate()
  const monthEnd = `${ay}-${String(monthEndDate).padStart(2, '0')}`
  const monthLabel = new Date(`${ay}-15T12:00:00`).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })

  const [patientsRes, treatmentsRes, paymentsRes, promisesRes] = await Promise.all([
    supabase.from('internal_patient').select('id, name, phone'),
    supabase.from('internal_treatment')
      .select('id, patient_id, name, amount, treatment_date')
      .gte('treatment_date', monthStart).lte('treatment_date', monthEnd)
      .order('treatment_date', { ascending: true }),
    supabase.from('internal_payment')
      .select('id, patient_id, amount, paid_at, method')
      .gte('paid_at', monthStart).lte('paid_at', monthEnd)
      .order('paid_at', { ascending: true }),
    supabase.from('internal_payment_promise')
      .select('id, patient_id, due_date, amount, note')
      .eq('owner_id', clinicOwner)
      .eq('status', 'open')
      .order('due_date', { ascending: true }),
  ])

  const patients = patientsRes.data ?? []
  const treatments = treatmentsRes.data ?? []
  const payments = paymentsRes.data ?? []
  const promises = promisesRes.data ?? []
  const pName = (id: string) => patients.find(p => p.id === id)?.name ?? '—'

  // Alacak listesi için tüm zaman bakiyeleri (ay bağımsız)
  const [allTRes, allPRes] = await Promise.all([
    supabase.from('internal_treatment').select('patient_id, amount'),
    supabase.from('internal_payment').select('patient_id, amount'),
  ])
  const balances = new Map<string, number>()
  for (const t of allTRes.data ?? []) balances.set(t.patient_id, (balances.get(t.patient_id) ?? 0) + Number(t.amount ?? 0))
  for (const p of allPRes.data ?? []) balances.set(p.patient_id, (balances.get(p.patient_id) ?? 0) - Number(p.amount ?? 0))
  const debtors = Array.from(balances.entries())
    .filter(([, v]) => v > 0)
    .map(([id, v]) => ({
      id, name: pName(id), remaining: v,
      promise: promises.filter(pr => pr.patient_id === id).sort((a, b) => a.due_date.localeCompare(b.due_date))[0] ?? null,
    }))
    .sort((a, b) => b.remaining - a.remaining)

  // Gün gün döküm
  const dayKeys = Array.from(new Set([
    ...treatments.map(t => t.treatment_date),
    ...payments.map(p => p.paid_at),
  ])).sort()

  const totalBilled = treatments.reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const totalCollected = payments.reduce((s, p) => s + Number(p.amount ?? 0), 0)
  const totalReceivable = debtors.reduce((s, d) => s + d.remaining, 0)
  const todayStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  const fmtDay = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })
  const fmtShort = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' })

  // Ay gezgini linkleri
  const [y, m] = [Number(ay.slice(0, 4)), Number(ay.slice(5, 7))]
  const prevAy = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
  const nextAy = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-white text-slate-900 print:bg-white">
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Ekran araç çubuğu — yazdırmada gizli */}
        <div className="print:hidden flex items-center justify-between mb-6 gap-2 flex-wrap">
          <Link href="/klinik/panel/muhasebe"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-slate-900 hover:bg-slate-700 text-white transition-colors">
            🏠 Ana Sayfa
          </Link>
          <div className="flex items-center gap-2">
            <Link href={`/klinik/panel/muhasebe/rapor?ay=${prevAy}`} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold">‹ Önceki ay</Link>
            <Link href={`/klinik/panel/muhasebe/rapor?ay=${nextAy}`} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold">Sonraki ay ›</Link>
            <PrintButton />
          </div>
        </div>

        {/* Başlık */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <h1 className="text-2xl font-black">Aylık Muhasebe Raporu</h1>
          <p className="text-sm text-slate-600 mt-1">{monthLabel} · Rapor tarihi: {todayStr}</p>
        </div>

        {/* Özet kutuları */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-slate-300 rounded-lg p-4">
            <p className="text-xs text-slate-500 font-semibold">YAZILAN</p>
            <p className="text-xl font-black mt-1">{TRY(totalBilled)}</p>
            <p className="text-xs text-slate-500 mt-0.5">{treatments.length} işlem</p>
          </div>
          <div className="border border-slate-300 rounded-lg p-4">
            <p className="text-xs text-slate-500 font-semibold">TAHSİL EDİLEN</p>
            <p className="text-xl font-black mt-1">{TRY(totalCollected)}</p>
            <p className="text-xs text-slate-500 mt-0.5">{payments.length} tahsilat</p>
          </div>
          <div className="border border-slate-300 rounded-lg p-4">
            <p className="text-xs text-slate-500 font-semibold">TOPLAM AÇIK ALACAK</p>
            <p className="text-xl font-black mt-1">{TRY(totalReceivable)}</p>
            <p className="text-xs text-slate-500 mt-0.5">{debtors.length} hasta · tüm zaman</p>
          </div>
        </div>

        {/* Gün gün döküm */}
        <h2 className="text-lg font-black mb-3">Gün Gün Döküm</h2>
        {dayKeys.length === 0 && <p className="text-sm text-slate-500 mb-8">Bu ay kayıt yok.</p>}
        <div className="space-y-4 mb-10">
          {dayKeys.map(d => {
            const dts = treatments.filter(t => t.treatment_date === d)
            const dps = payments.filter(p => p.paid_at === d)
            const billed = dts.reduce((s, t) => s + Number(t.amount ?? 0), 0)
            const collected = dps.reduce((s, p) => s + Number(p.amount ?? 0), 0)
            return (
              <div key={d} className="break-inside-avoid">
                <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-1">
                  <span className="text-sm font-bold">{fmtDay(d)}</span>
                  <span className="text-xs text-slate-600">{TRY(billed)} yazıldı · {TRY(collected)} tahsil</span>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {dts.map(t => (
                      <tr key={`t-${t.id}`} className="border-b border-slate-100">
                        <td className="py-1 pr-2 w-24 text-slate-500">İşlem</td>
                        <td className="py-1 pr-2">{pName(t.patient_id)}</td>
                        <td className="py-1 pr-2 text-slate-600">{t.name}</td>
                        <td className="py-1 text-right font-semibold tabular-nums">{TRY(Number(t.amount ?? 0))}</td>
                      </tr>
                    ))}
                    {dps.map(p => (
                      <tr key={`p-${p.id}`} className="border-b border-slate-100">
                        <td className="py-1 pr-2 w-24 text-emerald-700">Tahsilat</td>
                        <td className="py-1 pr-2">{pName(p.patient_id)}</td>
                        <td className="py-1 pr-2 text-slate-600">{p.method ?? '—'}</td>
                        <td className="py-1 text-right font-semibold tabular-nums text-emerald-700">+{TRY(Number(p.amount ?? 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>

        {/* Alacak listesi */}
        <h2 className="text-lg font-black mb-3 break-before-auto">Açık Alacaklar</h2>
        {debtors.length === 0 && <p className="text-sm text-slate-500">Açık alacak yok.</p>}
        {debtors.length > 0 && (
          <table className="w-full text-sm border-t border-slate-300">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-300">
                <th className="py-2 pr-2">Hasta</th>
                <th className="py-2 pr-2 text-right">Kalan</th>
                <th className="py-2 pl-4">Ödeme sözü</th>
              </tr>
            </thead>
            <tbody>
              {debtors.map(d => (
                <tr key={d.id} className="border-b border-slate-100 break-inside-avoid">
                  <td className="py-1.5 pr-2 font-semibold">{d.name}</td>
                  <td className="py-1.5 pr-2 text-right font-bold tabular-nums">{TRY(d.remaining)}</td>
                  <td className="py-1.5 pl-4 text-slate-600">
                    {d.promise
                      ? `${fmtShort(d.promise.due_date)} · ${TRY(Number(d.promise.amount))}${d.promise.note ? ` (${d.promise.note})` : ''}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="text-xs text-slate-400 mt-10 pt-4 border-t border-slate-200">
          Bu rapor klinik iç kullanımı içindir. {monthLabel} dönemi · {todayStr} tarihinde oluşturuldu.
        </p>
      </div>
    </div>
  )
}
