// Sabit tetkik parametreleri ve referans aralıkları
// Normal aralıktaysa tam puan, dışındaysa 0

export interface TetkikParam {
  key: string
  label: string
  unit: string
  min: number
  max: number
  /** EGS toplam skora katkı puanı (normal aralıktaysa tam puan) */
  puan: number
}

export const TETKIK_PARAMS: TetkikParam[] = [
  { key: 'tsh',            label: 'TSH',             unit: 'mIU/L',   min: 0.4,  max: 4.0,  puan: 0.3 },
  { key: 'vitamin_d',      label: 'D Vitamini',      unit: 'ng/mL',   min: 30,   max: 100,  puan: 0.3 },
  { key: 'b12',            label: 'B12',              unit: 'pg/mL',   min: 200,  max: 900,  puan: 0.2 },
  { key: 'ferritin',       label: 'Ferritin',         unit: 'ng/mL',   min: 12,   max: 150,  puan: 0.2 },
  { key: 'kortizol',       label: 'Kortizol',         unit: 'μg/dL',   min: 6,    max: 23,   puan: 0.2 },
  { key: 'insulin',        label: 'İnsülin',          unit: 'μIU/mL',  min: 2,    max: 25,   puan: 0.2 },
  { key: 'hba1c',          label: 'HbA1c',            unit: '%',       min: 4,    max: 5.7,  puan: 0.3 },
  { key: 'total_kolesterol', label: 'Total Kolesterol', unit: 'mg/dL', min: 0,    max: 200,  puan: 0.2 },
]

/**
 * Girilen tetkik değerlerini referans aralıklarıyla karşılaştırır.
 * Normal aralıktaki her parametre tam puan kazandırır, dışındakiler 0.
 * Toplamı döner (max yaklaşık 1.9).
 */
export function scoreTetkikValues(values: Record<string, number>): number {
  let total = 0
  for (const param of TETKIK_PARAMS) {
    const val = values[param.key]
    if (val == null || Number.isNaN(val)) continue
    if (val >= param.min && val <= param.max) {
      total += param.puan
    }
  }
  return total
}
