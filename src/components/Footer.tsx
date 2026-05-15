'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type World = 'estestore' | 'klinik' | 'root'

function detectWorld(path: string | null): World {
  if (!path) return 'root'
  if (path.startsWith('/estestore')) return 'estestore'
  if (
    path.startsWith('/klinikler') ||
    path.startsWith('/klinik/') ||
    path.startsWith('/klinikler/randevu')
  ) return 'klinik'
  return 'root'
}

export default function Footer() {
  const pathname = usePathname()
  const world = detectWorld(pathname)

  if (world === 'estestore') return <EsteStoreFooter />
  if (world === 'klinik') return <EsteKlinikFooter />
  return <RootFooter />
}

// ────────────────────────────────────────────────────────────────────
// ROOT (BiyoAGE) — orijinal global footer
// ────────────────────────────────────────────────────────────────────
function RootFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Estelongy</span>
            </Link>
            <p className="text-slate-500 text-xs leading-relaxed">
              Estelongy Gençlik Skoru platformu. Ön analiz, longevity anketi ve klinik onayıyla biyolojik gençliğinizi öğrenin.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/analiz" className="text-slate-400 hover:text-white transition-colors">Ön Analiz</Link></li>
              <li><Link href="/klinikler" className="text-slate-400 hover:text-white transition-colors">Klinikler</Link></li>
              <li><Link href="/klinikler/randevu" className="text-slate-400 hover:text-white transition-colors">Klinik Randevu</Link></li>
              <li><Link href="/estestore" className="text-slate-400 hover:text-white transition-colors">EsteStore</Link></li>
              <li><Link href="/panel" className="text-slate-400 hover:text-white transition-colors">Panelim</Link></li>
              <li><Link href="/rehber" className="text-slate-400 hover:text-white transition-colors">Estelongy Rehberi</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">İş Ortakları</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/klinikler/basvur" className="text-slate-400 hover:text-white transition-colors">Klinik Başvuru</Link></li>
              <li><Link href="/satici/basvur" className="text-slate-400 hover:text-white transition-colors">Satıcı Başvuru</Link></li>
              <li><Link href="/kurumsal/giris" className="text-slate-400 hover:text-white transition-colors">Kurumsal Giriş</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Hakkında</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/hakkinda/sss" className="text-slate-400 hover:text-white transition-colors">SSS</Link></li>
              <li><Link href="/hakkinda/iletisim" className="text-slate-400 hover:text-white transition-colors">İletişim</Link></li>
              <li><Link href="/hakkinda/sozlesme" className="text-slate-400 hover:text-white transition-colors">Sözleşme</Link></li>
              <li><Link href="/hakkinda/aydinlatma" className="text-slate-400 hover:text-white transition-colors">Aydınlatma</Link></li>
              <li><Link href="/hakkinda/cerez" className="text-slate-400 hover:text-white transition-colors">Çerez Politikası</Link></li>
            </ul>
          </div>
        </div>

        <FooterBottom />
      </div>
    </footer>
  )
}

// ────────────────────────────────────────────────────────────────────
// ESTESTORE dünyası — altın aksanlı, light theme, sadece store içi link'ler
// ────────────────────────────────────────────────────────────────────
function EsteStoreFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[#FAFAF7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/estestore" className="inline-flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A961] shadow-[0_0_8px_#C9A961]" />
              <span className="text-lg font-bold text-slate-900 tracking-tight">EsteStore</span>
            </Link>
            <p className="text-slate-600 text-xs leading-relaxed">
              Estelongy Gençlik Puanlı (EGP) ürünler. Hekim değerlendirmeli, klinik ↔ ev sürekliliği.
            </p>
          </div>

          <div>
            <h4 className="text-slate-900 font-bold text-xs uppercase tracking-wider mb-3">Mağaza</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/estestore" className="text-slate-600 hover:text-[#8B7339] transition-colors">Tüm Ürünler</Link></li>
              <li><Link href="/estestore/kategori/longevity" className="text-slate-600 hover:text-[#8B7339] transition-colors">Longevity</Link></li>
              <li><Link href="/estestore/kategori/biyohacking-olcum" className="text-slate-600 hover:text-[#8B7339] transition-colors">Biyohacking</Link></li>
              <li><Link href="/estestore/kategori/islem-sonrasi" className="text-slate-600 hover:text-[#8B7339] transition-colors">İşlem Sonrası</Link></li>
              <li><Link href="/estestore/kategori/sarf-medikal" className="text-slate-600 hover:text-[#8B7339] transition-colors">Sarf & Medikal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 font-bold text-xs uppercase tracking-wider mb-3">Hesabım</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/giris" className="text-slate-600 hover:text-[#8B7339] transition-colors">Giriş</Link></li>
              <li><Link href="/kayit" className="text-slate-600 hover:text-[#8B7339] transition-colors">Kayıt Ol</Link></li>
              <li><Link href="/sepet" className="text-slate-600 hover:text-[#8B7339] transition-colors">Sepetim</Link></li>
              <li><Link href="/panel/siparislerim" className="text-slate-600 hover:text-[#8B7339] transition-colors">Siparişlerim</Link></li>
              <li><Link href="/satici/basvur" className="text-slate-600 hover:text-[#8B7339] transition-colors">Satıcı Ol</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 font-bold text-xs uppercase tracking-wider mb-3">Hakkında</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/hakkinda/sss" className="text-slate-600 hover:text-[#8B7339] transition-colors">SSS</Link></li>
              <li><Link href="/hakkinda/iletisim" className="text-slate-600 hover:text-[#8B7339] transition-colors">İletişim</Link></li>
              <li><Link href="/hakkinda/sozlesme" className="text-slate-600 hover:text-[#8B7339] transition-colors">Sözleşme</Link></li>
              <li><Link href="/hakkinda/aydinlatma" className="text-slate-600 hover:text-[#8B7339] transition-colors">Aydınlatma</Link></li>
              <li><Link href="/hakkinda/cerez" className="text-slate-600 hover:text-[#8B7339] transition-colors">Çerez Politikası</Link></li>
            </ul>
          </div>
        </div>

        <FooterBottom light />
      </div>
    </footer>
  )
}

// ────────────────────────────────────────────────────────────────────
// ESTEKLINIK dünyası — yeşil aksanlı, derin teal, klinik içi link'ler
// ────────────────────────────────────────────────────────────────────
function EsteKlinikFooter() {
  return (
    <footer className="border-t border-[#0A6347]/40 bg-[#053527]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/klinikler" className="inline-flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)]" />
              <span className="text-lg font-bold text-white tracking-tight">EsteKlinik</span>
            </Link>
            <p className="text-emerald-200/70 text-xs leading-relaxed">
              KYC onaylı estetik klinikleri ekosistemi. EGP puanı, hasta deneyimi ve direkt randevu.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Klinik</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/klinikler" className="text-emerald-200/80 hover:text-white transition-colors">Tüm Klinikler</Link></li>
              <li><Link href="/klinikler/randevu" className="text-emerald-200/80 hover:text-white transition-colors">Randevu Al</Link></li>
              <li><Link href="/rehber" className="text-emerald-200/80 hover:text-white transition-colors">Rehber</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Hesabım</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/giris" className="text-emerald-200/80 hover:text-white transition-colors">Giriş</Link></li>
              <li><Link href="/kayit" className="text-emerald-200/80 hover:text-white transition-colors">Kayıt Ol</Link></li>
              <li><Link href="/panel" className="text-emerald-200/80 hover:text-white transition-colors">Panelim</Link></li>
              <li><Link href="/klinikler/basvur" className="text-emerald-200/80 hover:text-white transition-colors">Klinik Başvuru</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Hakkında</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/hakkinda/sss" className="text-emerald-200/80 hover:text-white transition-colors">SSS</Link></li>
              <li><Link href="/hakkinda/iletisim" className="text-emerald-200/80 hover:text-white transition-colors">İletişim</Link></li>
              <li><Link href="/hakkinda/sozlesme" className="text-emerald-200/80 hover:text-white transition-colors">Sözleşme</Link></li>
              <li><Link href="/hakkinda/aydinlatma" className="text-emerald-200/80 hover:text-white transition-colors">Aydınlatma</Link></li>
              <li><Link href="/hakkinda/cerez" className="text-emerald-200/80 hover:text-white transition-colors">Çerez Politikası</Link></li>
            </ul>
          </div>
        </div>

        <FooterBottom dark />
      </div>
    </footer>
  )
}

function FooterBottom({ light, dark }: { light?: boolean; dark?: boolean }) {
  const textClass = light
    ? 'text-slate-500'
    : dark
      ? 'text-emerald-200/60'
      : 'text-slate-600'
  const borderClass = light
    ? 'border-slate-200'
    : dark
      ? 'border-[#0A6347]/40'
      : 'border-slate-800'

  return (
    <div className={`pt-6 border-t ${borderClass} flex flex-col sm:flex-row items-center justify-between gap-3`}>
      <p className={`text-xs ${textClass}`}>
        © {new Date().getFullYear()} Vestoriq OÜ — Estelongy markası. Tüm hakları saklıdır.
      </p>
      <p className={`text-xs ${textClass}`}>
        Estelongy Gençlik Skoru, tıbbi teşhis aracı değildir.
      </p>
    </div>
  )
}
