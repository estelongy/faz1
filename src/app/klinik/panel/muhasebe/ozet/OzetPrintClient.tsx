'use client'

import { useEffect } from 'react'

interface DayRow {
  date: string
  billed: string
  collected: string
  net: string
  netPositive: boolean
  treatments: { name: string; patientName: string; amount: string }[]
  payments: { patientName: string; amount: string; method: string | null }[]
}

interface PatientRow {
  name: string
  billed: string
  collected: string
  remaining: string
  hasDebt: boolean
}

interface Props {
  rangeLabel: string
  generatedAt: string
  totalBilled: string
  totalCollected: string
  totalRemaining: string
  remainingIsPositive: boolean
  days: DayRow[]
  patientRows: PatientRow[]
}

export default function OzetPrintClient({
  rangeLabel, generatedAt,
  totalBilled, totalCollected, totalRemaining, remainingIsPositive,
  days, patientRows,
}: Props) {
  useEffect(() => {
    window.print()
  }, [])

  return (
    <>
      {/* Print trigger button — ekranda görünür, baskıda gizlenir */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-lg shadow-lg transition-colors"
        >
          🖨️ Tekrar Yazdır / PDF
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg shadow-lg transition-colors"
        >
          Kapat
        </button>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @page { margin: 16mm 14mm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; }
      `}</style>

      <div className="max-w-3xl mx-auto px-6 py-8 text-slate-900">
        {/* Başlık */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Dr. İzzet GÖK — Klinik Muhasebe</p>
              <h1 className="text-2xl font-black mt-1">Aylık Özet</h1>
              <p className="text-slate-600 text-sm mt-0.5">{rangeLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400">Oluşturulma</p>
              <p className="text-xs text-slate-600">{generatedAt}</p>
            </div>
          </div>
        </div>

        {/* Özet kartlar */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <SummaryCard label="Faturalanan" value={totalBilled} color="slate" />
          <SummaryCard label="Tahsil Edilen" value={totalCollected} color="emerald" />
          <SummaryCard label="Kalan" value={totalRemaining} color={remainingIsPositive ? 'amber' : 'emerald'} />
        </div>

        {/* Günlük döküm */}
        {days.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-3">Günlük Hareket</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="text-left py-1.5 pr-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Tarih</th>
                  <th className="text-left py-1.5 pr-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Hareket</th>
                  <th className="text-right py-1.5 pr-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Faturalanan</th>
                  <th className="text-right py-1.5 pr-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Tahsil</th>
                  <th className="text-right py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Net</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d, i) => (
                  <>
                    <tr key={d.date + '-header'} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                      <td className="py-1.5 pr-4 font-semibold text-xs capitalize">{d.date}</td>
                      <td className="py-1.5 pr-4 text-xs text-slate-500">
                        {d.treatments.length > 0 && `${d.treatments.length} işlem`}
                        {d.treatments.length > 0 && d.payments.length > 0 && ', '}
                        {d.payments.length > 0 && `${d.payments.length} tahsilat`}
                      </td>
                      <td className="py-1.5 pr-4 text-right text-xs">{d.billed}</td>
                      <td className="py-1.5 pr-4 text-right text-xs font-bold" style={{ color: '#059669' }}>{d.collected}</td>
                      <td className={`py-1.5 text-right text-xs font-bold ${d.netPositive ? 'text-emerald-700' : 'text-amber-600'}`}>
                        {d.netPositive ? '+' : '−'}{d.net}
                      </td>
                    </tr>
                    {/* Alt detay satırları */}
                    {d.treatments.map((t, j) => (
                      <tr key={`t-${i}-${j}`} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                        <td className="pl-4 py-0.5 text-[11px] text-slate-400" colSpan={1} />
                        <td className="py-0.5 pr-4 text-[11px] text-slate-500 pl-3" colSpan={1}>
                          <span className="text-violet-700 font-medium">{t.patientName}</span>
                          {' — '}{t.name}
                        </td>
                        <td className="py-0.5 pr-4 text-right text-[11px] text-slate-600">{t.amount}</td>
                        <td colSpan={2} />
                      </tr>
                    ))}
                    {d.payments.map((p, j) => (
                      <tr key={`p-${i}-${j}`} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                        <td className="pl-4 py-0.5 text-[11px] text-slate-400" colSpan={1} />
                        <td className="py-0.5 pr-4 text-[11px] pl-3" colSpan={1}>
                          <span className="font-medium" style={{ color: '#059669' }}>{p.patientName}</span>
                          {p.method ? ` — ${p.method}` : ''}
                        </td>
                        <td colSpan={1} />
                        <td className="py-0.5 pr-4 text-right text-[11px] font-semibold" style={{ color: '#059669' }}>{p.amount}</td>
                        <td colSpan={1} />
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Hasta bazlı özet */}
        {patientRows.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-3">Hasta Bazlı Özet</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="text-left py-1.5 pr-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Hasta</th>
                  <th className="text-right py-1.5 pr-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Faturalanan</th>
                  <th className="text-right py-1.5 pr-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Tahsil</th>
                  <th className="text-right py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Kalan</th>
                </tr>
              </thead>
              <tbody>
                {patientRows.map((r, i) => (
                  <tr key={r.name + i} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                    <td className="py-1.5 pr-4 font-medium text-xs">{r.name}</td>
                    <td className="py-1.5 pr-4 text-right text-xs">{r.billed}</td>
                    <td className="py-1.5 pr-4 text-right text-xs font-bold" style={{ color: '#059669' }}>{r.collected}</td>
                    <td className={`py-1.5 text-right text-xs font-bold ${r.hasDebt ? 'text-amber-600' : 'text-slate-400'}`}>{r.remaining}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <div className="mt-10 pt-4 border-t border-slate-200 text-[10px] text-slate-400 text-center">
          Bu belge {generatedAt} tarihinde Estelongy Klinik Paneli üzerinden otomatik oluşturulmuştur.
        </div>
      </div>
    </>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: 'slate' | 'emerald' | 'amber' }) {
  const border = color === 'emerald' ? '2px solid #059669' : color === 'amber' ? '2px solid #d97706' : '2px solid #475569'
  const textColor = color === 'emerald' ? '#059669' : color === 'amber' ? '#d97706' : '#0f172a'
  return (
    <div style={{ border, borderRadius: 10, padding: '10px 14px', background: '#f8fafc' }}>
      <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 900, marginTop: 2, color: textColor }}>{value}</p>
    </div>
  )
}
