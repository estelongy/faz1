'use client'

import { useEffect, useRef, useState } from 'react'

interface TreatmentRow {
  date: string
  patient: string
  name: string
  notes: string
  products: string[]
  billed: string
  collected: string
  methods: string[]
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
  ownerBrandLine: string
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
  ownerBrandLine,
  rangeLabel, generatedAt,
  totalBilled, totalCollected, totalRemaining, remainingIsPositive,
  treatmentRows, unmatchedRows,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<null | 'pdf' | 'share'>(null)

  useEffect(() => {
    document.body.style.background = 'white'
    document.body.style.color = '#0f172a'
    window.print()
  }, [])

  async function buildPdfBlob(): Promise<Blob> {
    const node = contentRef.current
    if (!node) throw new Error('İçerik henüz hazır değil.')
    const [{ default: html2canvas }, jsPdfMod] = await Promise.all([
      import('html2canvas-pro'),
      import('jspdf'),
    ])
    const jsPDF = jsPdfMod.default || jsPdfMod.jsPDF
    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    })
    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 8
    const imgW = pageW - margin * 2
    const imgH = (canvas.height * imgW) / canvas.width
    if (imgH <= pageH - margin * 2) {
      pdf.addImage(imgData, 'JPEG', margin, margin, imgW, imgH)
    } else {
      const pageContentH = pageH - margin * 2
      const pageContentPxH = (pageContentH * canvas.width) / imgW
      let drawnPx = 0
      while (drawnPx < canvas.height) {
        const sliceH = Math.min(pageContentPxH, canvas.height - drawnPx)
        const slice = document.createElement('canvas')
        slice.width = canvas.width
        slice.height = sliceH
        const ctx = slice.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, slice.width, slice.height)
        ctx.drawImage(canvas, 0, drawnPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH)
        if (drawnPx > 0) pdf.addPage('a4', 'landscape')
        const drawnH = (sliceH * imgW) / canvas.width
        pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', margin, margin, imgW, drawnH)
        drawnPx += sliceH
      }
    }
    return pdf.output('blob')
  }

  function buildPdfFilename(): string {
    const safe = rangeLabel.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
    return `muhasebe-ozet-${safe || 'donem'}.pdf`
  }

  function buildSummaryText(includeUrl: boolean): string {
    const lines = [
      `*${ownerBrandLine}*`,
      `Aylık Özet: ${rangeLabel}`,
      ``,
      `• Toplam Fatura: ${totalBilled}`,
      `• Tahsil Edilen: ${totalCollected}`,
      `• Kalan Borç: ${totalRemaining}`,
      `• İşlem Sayısı: ${treatmentRows.length}`,
      ...(unmatchedRows.length > 0 ? [`• Bağımsız Tahsilat: ${unmatchedRows.length} kayıt`] : []),
      ``,
      `Oluşturulma: ${generatedAt}`,
      includeUrl && typeof window !== 'undefined' ? window.location.href : '',
    ].filter(Boolean) as string[]
    return lines.join('\n')
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function handleShareWhatsapp(e: React.MouseEvent<HTMLButtonElement>) {
    if (busy) return
    setBusy('share')
    try {
      const blob = await buildPdfBlob()
      const filename = buildPdfFilename()
      const file = new File([blob], filename, { type: 'application/pdf' })
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
      const summary = buildSummaryText(true)
      if (typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          title: `${ownerBrandLine} — ${rangeLabel}`,
          text: summary,
        })
        return
      }
      // Fallback: PDF'i indir + WhatsApp'ı metinle aç (kullanıcı indireni manuel ekler)
      downloadBlob(blob, filename)
      const STORAGE_KEY = 'muhasebe_ozet_wa_number'
      let saved = ''
      try { saved = localStorage.getItem(STORAGE_KEY) || '' } catch {}
      const forceAsk = e.shiftKey || !saved
      let phone = saved
      if (forceAsk) {
        const input = window.prompt(
          'PDF indirildi. WhatsApp sohbetine eklemek için numara (ülke kodlu, sadece rakam — örn. 905551234567).\nBoş bırakırsan kişi seçim ekranı açılır.',
          saved,
        )
        if (input === null) return
        phone = input.replace(/[^\d]/g, '')
        try { localStorage.setItem(STORAGE_KEY, phone) } catch {}
      }
      const text = encodeURIComponent(summary + '\n\n(PDF indirildi, sohbetten ataç ile ekleyin.)')
      const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      alert('PDF üretilemedi: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setBusy(null)
    }
  }

  async function handleDownloadPdf() {
    if (busy) return
    setBusy('pdf')
    try {
      const blob = await buildPdfBlob()
      downloadBlob(blob, buildPdfFilename())
    } catch (err) {
      alert('PDF üretilemedi: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div id="no-print" style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 9999 }}>
        <button
          onClick={() => window.print()}
          disabled={!!busy}
          style={{ padding: '8px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}
        >
          🖨️ Tekrar Yazdır
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={!!busy}
          style={{ padding: '8px 16px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}
        >
          {busy === 'pdf' ? 'Hazırlanıyor…' : '⬇️ PDF İndir'}
        </button>
        <button
          onClick={handleShareWhatsapp}
          disabled={!!busy}
          title="PDF üretip WhatsApp'a paylaşır (mobilde direkt ek; masaüstünde PDF iner + WhatsApp metni açılır). Shift+Tık: numarayı değiştir."
          style={{ padding: '8px 16px', background: '#25D366', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}
        >
          {busy === 'share' ? 'Hazırlanıyor…' : '📱 WhatsApp\'a PDF Gönder'}
        </button>
        <button
          onClick={() => window.close()}
          style={{ padding: '8px 16px', background: '#475569', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          Kapat
        </button>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: white !important; color: #0f172a !important; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; }
        @media print {
          #no-print { display: none !important; }
          html, body { background: white !important; }
        }
        @page { margin: 14mm 12mm; size: A4 landscape; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #1e1b4b; color: white; border: 1px solid #312e81; padding: 9px 11px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; text-align: left; }
        td { border: 1px solid #e2e8f0; padding: 9px 11px; font-size: 13px; vertical-align: top; }
        tbody tr:nth-child(even) td { background: #dde4ed; }
        tbody tr:nth-child(odd) td { background: white; }
        tfoot td { background: #1e1b4b !important; color: white !important; font-weight: 900; font-size: 13px; border-color: #312e81; }
        .tag { display: inline-block; background: #e2e8f0; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 8px; font-size: 12px; margin: 2px 3px 2px 0; color: #334155; }
      `}</style>

      <div ref={contentRef} style={{ maxWidth: 1060, margin: '0 auto', padding: '28px 20px', background: 'white' }}>

        {/* Başlık */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '3px solid #1e1b4b', paddingBottom: 12, marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', fontWeight: 700, marginBottom: 4 }}>
              {ownerBrandLine}
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>Aylık Özet</h1>
            <p style={{ fontSize: 14, color: '#475569', marginTop: 4 }}>{rangeLabel}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Oluşturulma</p>
            <p style={{ fontSize: 12, color: '#64748b' }}>{generatedAt}</p>
          </div>
        </div>

        {/* Özet kutuları */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          <SummaryBox label="Toplam Fatura" value={totalBilled} borderColor="#475569" valueColor="#0f172a" />
          <SummaryBox label="Tahsil Edilen" value={totalCollected} borderColor="#059669" valueColor="#059669" />
          <SummaryBox label="Kalan Borç" value={totalRemaining} borderColor={remainingIsPositive ? '#d97706' : '#059669'} valueColor={remainingIsPositive ? '#d97706' : '#059669'} />
        </div>

        {/* Ana tablo */}
        {treatmentRows.length > 0 ? (
          <section style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700, marginBottom: 8 }}>
              İşlem Dökümü
            </p>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>Tarih</th>
                  <th style={{ width: '11%' }}>Hasta</th>
                  <th style={{ width: '15%' }}>İşlem Bilgisi</th>
                  <th style={{ width: '18%' }}>Kullanılan Ürünler</th>
                  <th style={{ width: '9%', textAlign: 'right' }}>Fatura</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Tahsil Edilen</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Kalan Borç</th>
                  <th>Not</th>
                </tr>
              </thead>
              <tbody>
                {treatmentRows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>{r.date}</td>
                    <td style={{ fontWeight: 700, color: '#4c1d95' }}>{r.patient}</td>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td>
                      {r.products.length === 0
                        ? <span style={{ color: '#94a3b8' }}>—</span>
                        : r.products.map((p, j) => <span key={j} className="tag">{p}</span>)
                      }
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.billed}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ color: '#059669', fontWeight: 700 }}>{r.collected}</span>
                      {r.methods.length > 0 && (
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          {r.methods.filter((m, i, a) => a.indexOf(m) === i).join(', ')}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: r.hasDebt ? '#d97706' : '#059669' }}>
                      {r.hasDebt ? r.remaining : '✓ Tam'}
                    </td>
                    <td style={{ color: '#64748b', fontStyle: 'italic' }}>{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>TOPLAM</td>
                  <td style={{ textAlign: 'right' }}>{totalBilled}</td>
                  <td style={{ textAlign: 'right', color: '#6ee7b7' }}>{totalCollected}</td>
                  <td style={{ textAlign: 'right', color: remainingIsPositive ? '#fcd34d' : '#6ee7b7' }}>{totalRemaining}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </section>
        ) : (
          <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Bu dönemde işlem kaydı yok.</p>
        )}

        {/* Eşleşmeyen tahsilatlar */}
        {unmatchedRows.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700, marginBottom: 8 }}>
              Bağımsız Tahsilatlar
            </p>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '14%' }}>Tarih</th>
                  <th style={{ width: '22%' }}>Hasta</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>Tutar</th>
                  <th style={{ width: '16%' }}>Yöntem</th>
                  <th>Not</th>
                </tr>
              </thead>
              <tbody>
                {unmatchedRows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: '#64748b' }}>{r.date}</td>
                    <td style={{ fontWeight: 700, color: '#4c1d95' }}>{r.patient}</td>
                    <td style={{ textAlign: 'right', color: '#059669', fontWeight: 700 }}>{r.amount}</td>
                    <td>{r.method}</td>
                    <td style={{ color: '#64748b', fontStyle: 'italic' }}>{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <div style={{ marginTop: 28, paddingTop: 12, borderTop: '1px solid #e2e8f0', fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
          Bu belge {generatedAt} tarihinde Estelongy Klinik Paneli üzerinden otomatik oluşturulmuştur.
        </div>
      </div>
    </>
  )
}

function SummaryBox({ label, value, borderColor, valueColor }: { label: string; value: string; borderColor: string; valueColor: string }) {
  return (
    <div style={{ border: `2px solid ${borderColor}`, borderRadius: 10, padding: '10px 14px', background: '#f8fafc' }}>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 900, color: valueColor }}>{value}</p>
    </div>
  )
}
