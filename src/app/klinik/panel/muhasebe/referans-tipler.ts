/** Referans sistemi — paylaşılan tipler. Kural motoru Postgres'te (bkz. migration). */

export interface ReferansAyar {
  isletme_kodu: string
  aktif: boolean
  kod_omru_gun: number
  aylik_limit: number
}

/**
 * Kampanya türü — referansörün taşıdığı haberin cinsi.
 * Referansör "ayaklı gazete"dir; tür, hangi haberi kime götüreceğini söyler.
 * Şimdilik ETİKET: davranış kuralı yok.
 */
export type KampanyaTur =
  | 'tanisma' | 'sakin_saat' | 'model' | 'organizasyon'
  | 'mevsim' | 'yeniden_cagri' | 'yeni_hizmet' | 'genel'

export const KAMPANYA_TURLERI: {
  k: KampanyaTur; ad: string; ikon: string; aciklama: string; ton: string
}[] = [
  { k: 'tanisma',       ad: 'Tanışma',       ikon: '🤝', aciklama: 'Hiç gelmemiş kişiye — "bir dene"',
    ton: 'bg-sky-500/15 text-sky-300 ring-sky-500/30' },
  { k: 'sakin_saat',    ad: 'Sakin saat',    ikon: '🕐', aciklama: 'Boş slotu doldurur — "salı sabahları uygun"',
    ton: 'bg-teal-500/15 text-teal-300 ring-teal-500/30' },
  { k: 'model',         ad: 'Model',         ikon: '📸', aciklama: 'Görsel kullanım izni karşılığı ekstra indirim',
    ton: 'bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-500/30' },
  { k: 'organizasyon',  ad: 'Organizasyon',  ikon: '👥', aciklama: 'Grup/toplu gelenler — düğün, şirket',
    ton: 'bg-indigo-500/15 text-indigo-300 ring-indigo-500/30' },
  { k: 'mevsim',        ad: 'Mevsim',        ikon: '🌿', aciklama: 'Zamana bağlı — "yaza girmeden"',
    ton: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' },
  { k: 'yeniden_cagri', ad: 'Yeniden çağrı', ikon: '🔄', aciklama: 'Uzun süredir gelmeyene — "dönüş zamanı"',
    ton: 'bg-amber-500/15 text-amber-300 ring-amber-500/30' },
  { k: 'yeni_hizmet',   ad: 'Yeni hizmet',   ikon: '✨', aciklama: 'Yeni cihaz/işlem — "ilk deneyenlere"',
    ton: 'bg-violet-500/15 text-violet-300 ring-violet-500/30' },
  { k: 'genel',         ad: 'Genel',         ikon: '📋', aciklama: 'Herkese açık, ayrım yok',
    ton: 'bg-slate-700/60 text-slate-300 ring-slate-600/50' },
]

export const turBilgi = (t: string) =>
  KAMPANYA_TURLERI.find(x => x.k === t) ?? KAMPANYA_TURLERI[KAMPANYA_TURLERI.length - 1]

export interface ReferansTeklif {
  id: string
  baslik: string
  ayricalik: string
  aktif: boolean
  kontenjan: number | null
  gecerli_bitis: string | null
  /** Gelen her kişi için referansöre yazılan tutar. */
  odul_tutar: number
  tur: KampanyaTur
  /** Sakin saat kampanyası: "Salı–Çarşamba 10:00-14:00" gibi. */
  gecerli_zaman: string | null
  /** Model kampanyası: müşteriden görsel kullanım izni istenir. */
  gorsel_izni: boolean
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
