/** Referans sistemi — paylaşılan tipler. Kural motoru Postgres'te (bkz. migration). */

export interface ReferansAyar {
  isletme_kodu: string
  aktif: boolean
  kod_omru_gun: number
  aylik_limit: number
}

export interface ReferansTeklif {
  id: string
  baslik: string
  ayricalik: string
  aktif: boolean
  kontenjan: number | null
  gecerli_bitis: string | null
}

export interface ReferansorRow {
  id: string
  patient_id: string
  /** GA3 — baş harfler + ayırıcı rakam */
  onek: string
  aktif: boolean
}

export interface ReferansKod {
  id: string
  /** GA3GOK-K7MP */
  kod: string
  durum: string
  son_kullanma: string
  created_at: string
  referrer_id: string
  offer_id: string
  musteri_ad: string | null
  musteri_tel: string | null
  /** null = beklemede */
  geldi: boolean | null
}

/** Müşterinin söylediği kısım — kodun tire sonrası. */
export const kisaKod = (kod: string) => kod.split('-')[1] ?? kod
