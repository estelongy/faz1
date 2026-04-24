/**
 * Skor zone bazlı işlem ve ürün önerileri.
 *
 * Mantık: kullanıcının C250 skoru 5 zone'dan birine düşer,
 * o zone'a tanımlı işlem ve ürün anahtarları döner.
 * Klinik eşleştirme sonra: clinic.specialties içinde önerilen işlem
 * anahtarlarını arayıp filtreleriz.
 *
 * Yaş şimdilik karışmıyor — Faz 2'de yaş × skor matrisi yapılacak.
 */

// ─── Zone Tipleri ────────────────────────────────────────────────────────────

export type SkorZone = 'cok_dusuk' | 'dusuk' | 'normal' | 'iyi' | 'cok_iyi'

export function skorZone(skor: number): SkorZone {
  if (skor < 56) return 'cok_dusuk'
  if (skor < 66) return 'dusuk'
  if (skor < 80) return 'normal'
  if (skor < 90) return 'iyi'
  return 'cok_iyi'
}

// ─── İşlem ve Ürün Anahtarları (kontrollü vocabulary) ───────────────────────

export type IslemKey =
  // Lazer
  | 'fraksiyonel_co2_lazer'
  | 'fraksiyonel_erbiyum_lazer'
  | 'pikosaniye_lazer'
  | 'q_switched_lazer'
  | 'ipl_yenileme'
  // Sıkılaştırma
  | 'hifu'
  | 'thermage'
  | 'rf_iglesi'
  | 'morpheus8'
  // Enjeksiyon
  | 'botox'
  | 'mikro_botox'
  | 'preventif_botox'
  | 'dolgu_dudak'
  | 'dolgu_yanak'
  | 'dolgu_burun'
  | 'profhilo'
  | 'mesoterapi'
  | 'mesolifting'
  | 'prp'
  | 'altın_iğne'
  // Peeling
  | 'tca_peeling'
  | 'kimyasal_peeling_orta'
  | 'kimyasal_peeling_hafif'
  | 'mikrodermabrazyon'
  // İp / Cerrahi
  | 'ip_askı'
  | 'yuz_germe_cerrahi'
  | 'boyun_germe_cerrahi'
  | 'kas_lifting'              // SMAS lifting (derin doku)
  | 'mini_facelift'
  | 'blefaroplasti'            // göz kapağı estetiği
  | 'kas_kaldırma'             // brow lift
  | 'rinoplasti'               // burun estetiği
  | 'lipoenjeksiyon'           // kendi yağı ile dolgu
  | 'lipoaspirasyon_yuz'       // çene/gıdı yağ alma
  | 'gidik_estetigi'           // çene kontur
  | 'kulak_estetigi'
  // Bakım
  | 'hidrafacial'
  | 'oksijen_terapisi'
  | 'karboksi_terapi'
  | 'led_terapi'

export type UrunKategori =
  // Aktif bileşenler
  | 'retinol_yuksek'
  | 'retinol_orta'
  | 'retinol_hafif'
  | 'c_vitamini_serum'
  | 'niasinamid_serum'
  | 'hyaluronik_serum'
  | 'peptit_kremi'
  | 'aha_bha_peeling'
  | 'azelaik_asit'
  | 'kojik_asit'
  // Koruyucu
  | 'spf50'
  | 'antioksidan_serum'
  | 'nemlendirici_yogun'
  | 'nemlendirici_hafif'
  | 'goz_alti_kremi'
  // Takviye
  | 'kollajen_takviye'
  | 'omega3_takviye'
  | 'biotin_takviye'
  | 'glutatyon_takviye'

// ─── Zone Konfigürasyonu ─────────────────────────────────────────────────────

export interface ZoneRecommendation {
  etiket: string
  renk: string
  yogunluk: 'agresif' | 'aktif' | 'orta' | 'koruyucu' | 'bakım'
  mesaj_baslik: string
  mesaj_alt: string
  islemler: IslemKey[]
  urun_kategorileri: UrunKategori[]
}

export const ZONE_RECOMMENDATIONS: Record<SkorZone, ZoneRecommendation> = {

  // ════════════════════════════════════════════════════════════
  cok_dusuk: {
    etiket: 'Çok Düşük',
    renk: '#ef4444',
    yogunluk: 'agresif',
    mesaj_baslik: 'Tam yenileme protokolü uygun',
    mesaj_alt: 'Cilt ileri yaşlanma veya ağır hasar belirtisi gösteriyor. Hem medikal estetik hem cerrahi seçenekler değerlendirilmeli — uzman konsültasyonu ile size uygun kombinasyon belirlenir.',
    islemler: [
      // Cerrahi
      'yuz_germe_cerrahi',
      'mini_facelift',
      'boyun_germe_cerrahi',
      'blefaroplasti',
      'kas_kaldırma',
      'lipoenjeksiyon',
      'lipoaspirasyon_yuz',
      'gidik_estetigi',
      // Lazer
      'fraksiyonel_co2_lazer',
      'fraksiyonel_erbiyum_lazer',
      'pikosaniye_lazer',
      'q_switched_lazer',
      // Sıkılaştırma
      'hifu',
      'thermage',
      'morpheus8',
      'rf_iglesi',
      'ip_askı',
      // Enjeksiyon
      'botox',
      'mikro_botox',
      'dolgu_yanak',
      'dolgu_dudak',
      'profhilo',
      'mesolifting',
      'mesoterapi',
      'prp',
      'altın_iğne',
      // Peeling
      'tca_peeling',
      'kimyasal_peeling_orta',
    ],
    urun_kategorileri: [
      'retinol_yuksek',
      'c_vitamini_serum',
      'aha_bha_peeling',
      'spf50',
      'hyaluronik_serum',
      'peptit_kremi',
      'antioksidan_serum',
      'goz_alti_kremi',
      'nemlendirici_yogun',
      'kollajen_takviye',
      'glutatyon_takviye',
      'omega3_takviye',
    ],
  },

  // ════════════════════════════════════════════════════════════
  dusuk: {
    etiket: 'Düşük',
    renk: '#a855f7',
    yogunluk: 'aktif',
    mesaj_baslik: 'Aktif iyileştirme zamanı',
    mesaj_alt: 'Orta yoğunlukta klinik işlem + düzenli aktif bileşen kullanımı ile 3-6 ay içinde belirgin fark.',
    islemler: [
      'mesoterapi',                // cilt besleme
      'fraksiyonel_erbiyum_lazer', // hafif yenileme
      'kimyasal_peeling_orta',     // ton + leke
      'rf_iglesi',                 // sıkılık
      'altın_iğne',                // tüm cilt yenileme
      'preventif_botox',           // önleyici
      'dolgu_yanak',               // hacim restorasyonu (varsa)
      'hidrafacial',               // periyodik bakım
      'prp',                       // yenilenme
    ],
    urun_kategorileri: [
      'retinol_orta',
      'niasinamid_serum',          // ton + gözenek
      'c_vitamini_serum',
      'hyaluronik_serum',
      'spf50',
      'antioksidan_serum',
      'goz_alti_kremi',
      'kollajen_takviye',
    ],
  },

  // ════════════════════════════════════════════════════════════
  // TODO: bu üçünü doldur
  normal: {
    etiket: 'Normal',
    renk: '#eab308',
    yogunluk: 'orta',
    mesaj_baslik: 'TODO',
    mesaj_alt: 'TODO',
    islemler: [],
    urun_kategorileri: [],
  },

  iyi: {
    etiket: 'İyi',
    renk: '#22c55e',
    yogunluk: 'koruyucu',
    mesaj_baslik: 'TODO',
    mesaj_alt: 'TODO',
    islemler: [],
    urun_kategorileri: [],
  },

  cok_iyi: {
    etiket: 'Çok İyi',
    renk: '#3b82f6',
    yogunluk: 'bakım',
    mesaj_baslik: 'TODO',
    mesaj_alt: 'TODO',
    islemler: [],
    urun_kategorileri: [],
  },
}

// ─── Yardımcı: Skordan Direkt Öneri ──────────────────────────────────────────

export function getRecommendation(skor: number): ZoneRecommendation {
  return ZONE_RECOMMENDATIONS[skorZone(skor)]
}

// ─── İnsan Okunur Etiketler (UI için) ────────────────────────────────────────

export const ISLEM_LABELS: Record<IslemKey, string> = {
  fraksiyonel_co2_lazer: 'Fraksiyonel CO2 Lazer',
  fraksiyonel_erbiyum_lazer: 'Fraksiyonel Erbiyum Lazer',
  pikosaniye_lazer: 'Pikosaniye Lazer',
  q_switched_lazer: 'Q-Switched Lazer',
  ipl_yenileme: 'IPL Cilt Yenileme',
  hifu: 'HIFU (Yüz Germe)',
  thermage: 'Thermage',
  rf_iglesi: 'RF İğnesi (Radyofrekans)',
  morpheus8: 'Morpheus8',
  botox: 'Botoks',
  mikro_botox: 'Mikro Botoks',
  preventif_botox: 'Preventif Botoks',
  dolgu_dudak: 'Dudak Dolgusu',
  dolgu_yanak: 'Yanak Dolgusu',
  dolgu_burun: 'Burun Dolgusu',
  profhilo: 'Profhilo',
  mesoterapi: 'Mezoterapi',
  mesolifting: 'Mezolifting',
  prp: 'PRP (Trombositten Zengin Plazma)',
  altın_iğne: 'Altın İğne',
  tca_peeling: 'TCA Peeling',
  kimyasal_peeling_orta: 'Kimyasal Peeling (Orta)',
  kimyasal_peeling_hafif: 'Kimyasal Peeling (Hafif)',
  mikrodermabrazyon: 'Mikrodermabrazyon',
  ip_askı: 'İp Askı (Yüz Germe)',
  yuz_germe_cerrahi: 'Yüz Germe Cerrahisi',
  boyun_germe_cerrahi: 'Boyun Germe Cerrahisi',
  kas_lifting: 'SMAS Lifting',
  mini_facelift: 'Mini Yüz Germe',
  blefaroplasti: 'Blefaroplasti (Göz Kapağı)',
  kas_kaldırma: 'Kaş Kaldırma',
  rinoplasti: 'Rinoplasti (Burun Estetiği)',
  lipoenjeksiyon: 'Lipoenjeksiyon (Yağ Dolgusu)',
  lipoaspirasyon_yuz: 'Yüz Yağ Alma',
  gidik_estetigi: 'Çene/Gıdı Estetiği',
  kulak_estetigi: 'Kulak Estetiği',
  hidrafacial: 'HydraFacial',
  oksijen_terapisi: 'Oksijen Terapisi',
  karboksi_terapi: 'Karboksiterapi',
  led_terapi: 'LED Terapisi',
}

export const URUN_LABELS: Record<UrunKategori, string> = {
  retinol_yuksek: 'Retinol (Yüksek Doz)',
  retinol_orta: 'Retinol (Orta Doz)',
  retinol_hafif: 'Retinol (Hafif)',
  c_vitamini_serum: 'C Vitamini Serum',
  niasinamid_serum: 'Niasinamid Serum',
  hyaluronik_serum: 'Hyaluronik Asit Serum',
  peptit_kremi: 'Peptit Kremi',
  aha_bha_peeling: 'AHA/BHA Peeling',
  azelaik_asit: 'Azelaik Asit',
  kojik_asit: 'Kojik Asit',
  spf50: 'SPF 50+ Güneş Koruyucu',
  antioksidan_serum: 'Antioksidan Serum',
  nemlendirici_yogun: 'Yoğun Nemlendirici',
  nemlendirici_hafif: 'Hafif Nemlendirici',
  goz_alti_kremi: 'Göz Altı Kremi',
  kollajen_takviye: 'Kollajen Takviyesi',
  omega3_takviye: 'Omega-3 Takviyesi',
  biotin_takviye: 'Biotin Takviyesi',
  glutatyon_takviye: 'Glutatyon Takviyesi',
}
