/**
 * Minimal CSV parser — RFC 4180 alt-kümesi.
 * Çift tırnak içindeki virgül ve newline'ları korur.
 * Çift tırnak iç tırnak için "" şeklinde kaçar.
 *
 * Bağımlılık eklemekten kaçınmak için elle yazıldı.
 */

export function parseCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQuotes = false
  // BOM temizliği
  const t = text.replace(/^﻿/, '')
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (inQuotes) {
      if (c === '"') {
        if (t[i + 1] === '"') { cur += '"'; i++ }
        else { inQuotes = false }
      } else {
        cur += c
      }
    } else {
      if (c === '"') {
        inQuotes = true
      } else if (c === delimiter) {
        row.push(cur); cur = ''
      } else if (c === '\n' || c === '\r') {
        // CR+LF, CR, LF — tek satır sonu sayalım
        if (c === '\r' && t[i + 1] === '\n') i++
        row.push(cur); cur = ''
        rows.push(row); row = []
      } else {
        cur += c
      }
    }
  }
  // Son hücre/satır
  if (cur.length > 0 || row.length > 0) {
    row.push(cur)
    rows.push(row)
  }
  // Tamamen boş satırları at
  return rows.filter(r => r.some(c => c.trim().length > 0))
}

/** İlk satırı header kabul edip [{col: value}] döner. */
export function parseCsvAsObjects(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const all = parseCsv(text)
  if (all.length === 0) return { headers: [], rows: [] }
  const headers = all[0].map(h => h.trim())
  const rows = all.slice(1).map(r => {
    const obj: Record<string, string> = {}
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = (r[i] ?? '').trim()
    }
    return obj
  })
  return { headers, rows }
}
