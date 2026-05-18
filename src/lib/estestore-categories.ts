/**
 * EsteStore kategori ağacı
 *
 * Kararlar `memory/estestore_kategoriler.md`'de kilitli.
 * Hasta: 18 kategori | Klinik: 24 ek kategori
 * Sıralama marka önceliği ve hekim kullanım sıklığına göre düzenlendi.
 */

import type { LucideIcon } from 'lucide-react'
import {
  Sparkles,
  Activity,
  Hourglass,
  Droplet,
  Sun,
  Eye,
  Brush,
  Heart,
  Cpu,
  Palette,
  Layers,
  Scissors,
  User,
  Pill,
  Smile,
  Bath,
  Gift,
  Syringe,
  Beaker,
  Zap,
  Waves,
  CircleDot,
  Wrench,
  Sparkle,
  Scan,
  Microwave,
  ShieldCheck,
  Pipette,
  Library,
  Sofa,
  Bandage,
} from 'lucide-react'

export interface StoreCategory {
  slug: string
  name: string
  shortName?: string // kompakt kart için
  description: string
  icon: LucideIcon
  epFocus?: boolean // Estelongy Puanı vurgu kategorisi (Longevity, Biyohacking)
  bridgeToKlinik?: boolean // İşlem Sonrası gibi köprü kategori
}

export interface KlinikCategoryGroup {
  groupName: string
  groupSlug: string
  categories: StoreCategory[]
}

/**
 * HASTA tarafı — 18 kategori (sıralı)
 * Marka kimliği üstte (Longevity + Biyohacking), commodity altta (Kişisel Kullanım)
 */
export const HASTA_CATEGORIES: StoreCategory[] = [
  {
    slug: 'longevity',
    name: 'Longevity / İçten Gençlik',
    shortName: 'Longevity',
    description: 'NAD+, NMN, resveratrol, spermidine. Bilim destekli içten zamansızlık.',
    icon: Hourglass,
    epFocus: true,
  },
  {
    slug: 'biyohacking-olcum',
    name: 'Biyohacking & Ölçüm',
    shortName: 'Biyohacking',
    description: 'DNA kit, mikrobiyom, CGM, wearable. Vücudunu ölç, kendini tanı.',
    icon: Activity,
    epFocus: true,
  },
  {
    slug: 'anti-aging',
    name: 'Anti-Aging',
    description: 'Retinol, peptid, kolajen booster, kırışıklık karşıtı.',
    icon: Sparkles,
  },
  {
    slug: 'cilt-bakimi',
    name: 'Cilt Bakımı',
    description: 'Temizleyici, tonik, serum, krem, peeling, maske.',
    icon: Droplet,
  },
  {
    slug: 'gunes-koruma',
    name: 'Güneş Koruma',
    description: 'SPF, after-sun, lekeli cilt SPF.',
    icon: Sun,
  },
  {
    slug: 'goz-cevresi',
    name: 'Göz Çevresi Bakımı',
    shortName: 'Göz Çevresi',
    description: 'Eye cream, serum, patch, dark circle, torba.',
    icon: Eye,
  },
  {
    slug: 'leke-aydinlatma',
    name: 'Leke & Aydınlatma',
    description: 'C vitamini, niasinamid, melazma, post-akne lekesi.',
    icon: Sparkle,
  },
  {
    slug: 'hassas-cilt',
    name: 'Hassas & Sorunlu Cilt',
    shortName: 'Hassas Cilt',
    description: 'Akne, rozasea, ekzema, alerjik cilt.',
    icon: ShieldCheck,
  },
  {
    slug: 'islem-sonrasi',
    name: 'İşlem Sonrası Bakım',
    shortName: 'İşlem Sonrası',
    description: 'Dolgu, botoks, lazer sonrası iyileşmeyi hızlandıran kitler.',
    icon: Bandage,
    bridgeToKlinik: true,
  },
  {
    slug: 'cihazlar',
    name: 'Kişisel Bakım Cihazları',
    shortName: 'Cihazlar',
    description: 'LED maske, dermaroller, gua sha, IPL ev tipi, mikro-akım.',
    icon: Cpu,
  },
  {
    slug: 'makyaj',
    name: 'Makyaj (Dermo-Cosmetic)',
    shortName: 'Makyaj',
    description: 'Mineral fondöten, SPF\'li BB, hassas cilt makyaj.',
    icon: Palette,
  },
  {
    slug: 'vucut-bakimi',
    name: 'Vücut Bakımı',
    description: 'Vücut losyonu, peeling, selülit, sıkılaştırıcı.',
    icon: Heart,
  },
  {
    slug: 'sac-sakal',
    name: 'Saç & Sakal Bakımı',
    shortName: 'Saç & Sakal',
    description: 'Saç dökülmesi, anti-kepek, sakal serumu.',
    icon: Scissors,
  },
  {
    slug: 'erkek-bakimi',
    name: 'Erkek Bakımı',
    description: 'Erkek SPF, post-shave, erkek anti-aging.',
    icon: User,
  },
  {
    slug: 'suplementler',
    name: 'Suplementler & Vitaminler',
    shortName: 'Suplementler',
    description: 'Biotin, omega, multivitamin, magnesium, melatonin.',
    icon: Pill,
  },
  {
    slug: 'dis-agiz',
    name: 'Diş & Ağız Bakımı',
    shortName: 'Diş & Ağız',
    description: 'Beyazlatma, oral irrigator, hassas diş.',
    icon: Smile,
  },
  {
    slug: 'kisisel-kullanim',
    name: 'Kişisel Kullanım',
    description: 'Deodorant, banyo, sabun, el-ayak, tıraş, intimate.',
    icon: Bath,
  },
  {
    slug: 'hediye-setleri',
    name: 'Hediye Setleri & Rutinler',
    shortName: 'Hediye Setleri',
    description: 'Başlangıç paketi, sezon set, abonelik kutu.',
    icon: Gift,
  },
]

/**
 * KLİNİK tarafı — 24 kategori, 6 grup
 * Hekim için "tek tıkla bul" mantığında gruplandı.
 */
export const KLINIK_CATEGORY_GROUPS: KlinikCategoryGroup[] = [
  {
    groupName: 'Enjektabl İşlemler',
    groupSlug: 'enjektabl',
    categories: [
      {
        slug: 'botoks',
        name: 'Botoks / Nörotoksin',
        shortName: 'Botoks',
        description: 'Botox, Dysport, Xeomin, Bocouture, Nuceiva',
        icon: Syringe,
      },
      {
        slug: 'dolgu',
        name: 'Dolgu (HA Filler)',
        shortName: 'Dolgu',
        description: 'Restylane, Juvederm, Belotero, Teosyal, Stylage',
        icon: Pipette,
      },
      {
        slug: 'mezoterapi',
        name: 'Mezoterapi',
        description: 'Yüz, saç, vücut karışımları (NCTF, Dermaheal)',
        icon: Beaker,
      },
      {
        slug: 'prp-prf',
        name: 'PRP & PRF',
        description: 'Tüpler, sentrifüj malzemeleri, aktivasyon kitleri',
        icon: CircleDot,
      },
      {
        slug: 'biyostimulator',
        name: 'Biyostimülatörler',
        description: 'Profhilo, Sunekos, Sculptra, Radiesse, Ellansé',
        icon: Layers,
      },
      {
        slug: 'ip-aski',
        name: 'İp Askı / İplik',
        shortName: 'İp Askı',
        description: 'PDO, PLLA, COG, mono, screw, spiral',
        icon: Brush,
      },
      {
        slug: 'polinukleotid',
        name: 'Polinükleotid',
        description: 'Plinest, Newest, salmon DNA',
        icon: Sparkle,
      },
    ],
  },
  {
    groupName: 'Cihaz İşlemleri',
    groupSlug: 'cihaz-islemleri',
    categories: [
      {
        slug: 'lazer-ipl',
        name: 'Lazer & IPL',
        description: 'Alexandrite, diode, Nd:YAG, fraksiyonel CO2, IPL',
        icon: Zap,
      },
      {
        slug: 'hifu-rf',
        name: 'HIFU & RF',
        description: 'Ulthera, Sofwave, RF microneedling',
        icon: Waves,
      },
      {
        slug: 'microneedling',
        name: 'Microneedling',
        description: 'Dermapen + kartuş',
        icon: Scan,
      },
      {
        slug: 'hidrafacial',
        name: 'Hidrafacial & Cilt Temizleme',
        shortName: 'Hidrafacial',
        description: 'Hydrafacial, AquaPure + serumlar',
        icon: Droplet,
      },
      {
        slug: 'kavitasyon',
        name: 'Kavitasyon & Vücut Şekillendirme',
        shortName: 'Kavitasyon',
        description: 'Kavitasyon, kriyoliz, EMSculpt benzeri',
        icon: Microwave,
      },
      {
        slug: 'cihaz-sarf',
        name: 'Cihaz Sarf & Yedek',
        shortName: 'Cihaz Sarf',
        description: 'Kartuş, prob, başlık, jel',
        icon: Wrench,
      },
    ],
  },
  {
    groupName: 'Cerrahi & Saç Ekimi',
    groupSlug: 'cerrahi',
    categories: [
      {
        slug: 'sac-ekimi',
        name: 'Saç Ekimi',
        description: 'Greft saklama, FUE iğneleri, implant pen, post-care',
        icon: Scissors,
      },
      {
        slug: 'cerrahi-sarf',
        name: 'Cerrahi Sarf',
        description: 'Sütur, blade, retraktör, drape, cerrahi eldiven',
        icon: Bandage,
      },
      {
        slug: 'cerrahi-cihaz',
        name: 'Cerrahi Cihazlar',
        description: 'Koter, lipo cihazı, mikromotor, aspiratör',
        icon: Wrench,
      },
    ],
  },
  {
    groupName: 'Klinik Longevity',
    groupSlug: 'klinik-longevity',
    categories: [
      {
        slug: 'klinik-longevity',
        name: 'Klinik Longevity',
        description: 'NAD+ IV, eksozom, kök hücre, ozon, hiperbarik, IV vitamin',
        icon: Hourglass,
        epFocus: true,
      },
    ],
  },
  {
    groupName: 'Sarf, İlaç & Günlük',
    groupSlug: 'sarf-ilac',
    categories: [
      {
        slug: 'igne-kanul',
        name: 'İğne & Kanül & Enjektör',
        shortName: 'İğne & Kanül',
        description: 'Mezo iğnesi, kanül (22/25/27/30G)',
        icon: Pipette,
      },
      {
        slug: 'topikal-anestezik',
        name: 'Topikal Anestezik',
        description: 'EMLA, lidokain karışımları',
        icon: Beaker,
      },
      {
        slug: 'klinik-ilac',
        name: 'Klinik İlaç',
        description: 'Antibiyotik, kortikoid, hyalüronidaz (acil)',
        icon: Pill,
      },
      {
        slug: 'antiseptik-hijyen',
        name: 'Antiseptik & Hijyen',
        shortName: 'Antiseptik',
        description: 'Klorheksidin, Betadin, eldiven, gazlı bez',
        icon: ShieldCheck,
      },
      {
        slug: 'peeling',
        name: 'Peeling Solüsyonları',
        shortName: 'Peeling',
        description: 'TCA, glikolik, jessner, Cosmelan, Dermamelan',
        icon: Droplet,
      },
    ],
  },
  {
    groupName: 'İşletme & Eğitim',
    groupSlug: 'isletme',
    categories: [
      {
        slug: 'egitim-sertifika',
        name: 'Eğitim & Sertifika',
        shortName: 'Eğitim',
        description: 'Dijital kurs, sertifikasyon programları',
        icon: Library,
      },
      {
        slug: 'klinik-mobilya',
        name: 'Klinik Mobilya & Ekipman',
        shortName: 'Klinik Mobilya',
        description: 'Yatak, tabure, vitrin, klinik aydınlatması',
        icon: Sofa,
      },
    ],
  },
]

/** Klinik kategorilerini düz liste olarak istemek için */
export const KLINIK_CATEGORIES_FLAT: StoreCategory[] =
  KLINIK_CATEGORY_GROUPS.flatMap((g) => g.categories)

/** Anasayfa için ön plana çıkan kategoriler (4x4 grid'de gösterilecek 15 + Tümü) */
export const FEATURED_HOMEPAGE_CATEGORIES: StoreCategory[] = HASTA_CATEGORIES.slice(0, 15)
