'use client'

import { useEffect } from 'react'

interface TreatmentRow {
  date: string
  patient: string
  name: string
  notes: string
  products: string[]
  billed: string
  collected: string
  remaining: string
  hasDebt: boolean
}

interface UnmatchedRow {
  date: string
  patient: string
  amount: string
  method: string
  notes: string
}

interface Props {
  rangeLabel: string
  generatedAt: string
  totalBilled: string
  totalCollected: string
  totalRemaining: string
  remainingIsPositive: boolean
  treatmentRows: TreatmentRow[]
  unmatchedRows: UnmatchedRow[]
}

export default function OzetPrintClient({
  rangeLabel, generatedAt,
  totalBilled, totalCollected, totalRemaining, remainingIsPositive,
  treatmentRows, unmatchedRows,
}: Props) {
  useEffect(() => { window.print() }, [])

  return (
    <>
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={() => window.print()}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-lg shadow-lg transition-colors">
          🖨️ Tekrar Yazdır / PDF
        </button>
        <button onClick={() => window.close()}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg shadow-lg transition-colors">
          Kapat
        </button>
      </div>

      <style>{`
        @media print { .no-print { display: none !important; } }
        @page { margin: 14mm 12mm; size: A4 landscape; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: white; color: #0f172a; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #e2e8f0; padding: 5px 7px; font-size: 11px; vertical-align: top; }
        thead tr { background: #1e1b4b; color: white; }
        thead th { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; border-color: #312e81; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        .debt { color: #b45309; font-weight: 700; }
        .paid { color: #059669; font-weight: 700; }
        .muted { color: #94a3b8; }
        .tag { display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 1px 5px; font-size: 10px; margin: 1px 2px 1px 0; }
      `}</style>

      <div style={{ maxWidth: 1050, margin: '0 auto', padding: '24px 16px' }}>

        {/* Başlık */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #1e1b4b', paddingBottom: 10, marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', fontWeight: 700, marginBottom: 2 }}>
              Dr. İzzet GÖK — Klinik Muhasebe
            </p>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Aylık Özet</h1>
            <p style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{rangeLabel}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 9, color: '#94a3b8' }}>Oluşturulma</p>
            <p style={{ fontSize: 10, color: '#64748b' }}>{generatedAt}</p>
          </div>
        </div>

        {/* Özet kutuları */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          <SummaryBox label="Toplam Fatura" value={totalBilled} color="#1e293b" />
          <SummaryBox label="Tahsil Edilen" value={totalCollected} color="#059669" />
          <SummaryBox label="Kalan Borç" value={totalRemaining} color={remainingIsPositive ? '#b45309' : '#059669'} />
        </div>

        {/* Ana tablo */}
        {treatmentRows.length > 0 ? (
          <section style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700, marginBottom: 6 }}>
              İşlem Dökümü
            </p>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '9%' }}>Tarih</th>
                  <th style={{ width: '10%' }}>Hasta</th>
                  <th style={{ width: '14%' }}>İşlem Bilgisi</th>
                  <th style={{ width: '18%' }}>Kullanılan Ürünler</th>
                  <th style={{ width: '9%', textAlign: 'right' }}>Fatura</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Tahsil Edilen</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Kalan Borç</th>
                  <th style={{ width: '20%' }}>Not</th>
                </tr>
              </thead>
              <tbody>
                {treatmentRows.map((r, i) => (
                  <tr key={i}>
                    <td className="muted" style={{ whiteSpace: 'nowrap' }}>{r.date}</td>
                    <td style={{ fontWeight: 600, color: '#4c1d95' }}>{r.patient}</td>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td>
                      {r.products.length === 0
                        ? <span className="muted">—</span>
                        : r.products.map((p, j) => <span key={j} className="tag">{p}</span>)
                      }
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.billed}</td>
                    <td style={{ textAlign: 'right' }} className="paid">{r.collected}</td>
                    <td style={{ textAlign: 'right' }} className={r.hasDebt ? 'debt' : 'paid'}>
                      {r.hasDebt ? r.remaining : '✓ Tam'}
                    </td>
                    <td className="muted" style={{ fontSize: 10, fontStyle: 'italic' }}>{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#1e1b4b', color: 'white' }}>
                  <td colSpan={4} style={{ fontWeight: 700, fontSize: 10, color: 'white' }}>TOPLAM</td>
                  <td style={{ textAlign: 'right', fontWeight: 900, color: 'white' }}>{totalBilled}</td>
                  <td style={{ textAlign: 'right', fontWeight: 900, color: '#6ee7b7' }}>{totalCollected}</td>
                  <td style={{ textAlign: 'right', fontWeight: 900, color: remainingIsPositive ? '#fcd34d' : '#6ee7b7' }}>{totalRemaining}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </section>
        ) : (
          <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>Bu dönemde işlem kaydı yok.</p>
        )}

        {/* Eşleşmeyen tahsilatlar */}
        {unmatchedRows.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700, marginBottom: 6 }}>
              Bağımsız Tahsilatlar
            </p>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '14%' }}>Tarih</th>
                  <th style={{ width: '20%' }}>Hasta</th>
                  <th style={{ width: '13%', textAlign: 'right' }}>Tutar</th>
                  <th style={{ width: '15%' }}>Yöntem</th>
                  <th>Not</th>
                </tr>
              </thead>
              <tbody>
                {unmatchedRows.map((r, i) => (
                  <tr key={i}>
                    <td className="muted">{r.date}</td>
                    <td style={{ fontWeight: 600, color: '#4c1d95' }}>{r.patient}</td>
                    <td style={{ textAlign: 'right' }} className="paid">{r.amount}</td>
                    <td>{r.method}</td>
                    <td className="muted" style={{ fontSize: 10, fontStyle: 'italic' }}>{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <div style={{ marginTop: 24, paddingTop: 10, borderTop: '1px solid #e2e8f0', fontSize: 9, color: '#94a3b8', textAlign: 'center' }}>
          Bu belge {generatedAt} tarihinde Estelongy Klinik Paneli üzerinden otomatik oluşturulmuştur.
        </div>
      </div>
    </>
  )
}

function SummaryBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ border: `2px solid ${color}`, borderRadius: 8, padding: '8px 12px', background: '#f8fafc' }}>
      <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 900, color, margin: '3px 0 0' }}>{value}</p>
    </div>
  )
}
