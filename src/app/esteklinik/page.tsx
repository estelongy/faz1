export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Building2, ArrowRight } from 'lucide-react'
import EsteKlinikNav from './EsteKlinikNav'
import { KlinikSearchProvider, KlinikSearchInputs, KlinikSearchResults } from './KlinikSearch'
import type { ClinicRow } from './ClinicCard'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://estelongy.com'

export const metadata: Metadata = {
  title: 'EsteKlinik — Onaylı Estetik Merkezleri',
  description:
    'EsteKlinik ekosisteminde KYC onayı tamamlanmış, hekim değerlendirmeli klinikleri keşfet. Uzman, branş, tedavi veya konuma göre ara — direkt randevu al.',
  alternates: { canonical: '/esteklinik' },
  openGraph: {
    title: 'EsteKlinik — Onaylı Klinikler',
    description: 'Uzman, branş, tedavi veya konuma göre onaylı klinik ara.',
    url: `${SITE_URL}/esteklinik`,
    type: 'website',
  },
}

export default async function KliniklerPage() {
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('clinics')
    .select('id, slug, name, location, bio, specialties, clinic_type, clinic_egp, review_count, avg_nps, logo_url, cover_image_url')
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .order('clinic_egp', { ascending: false, nullsFirst: false })
    .order('review_count', { ascending: false, nullsFirst: false })
    .limit(120)

  const clinics = (rows ?? []) as ClinicRow[]

  return (
    <>
      <EsteKlinikNav />

      <KlinikSearchProvider clinics={clinics}>
        <main className="min-h-screen bg-white">
          {/* ============================================================
              HERO — derin teal zemin + "Klinik Seçin" arama motoru
              ============================================================ */}
          <section className="relative bg-gradient-to-br from-[#064E3B] via-[#0A6347] to-[#053527] overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle, #10876B 0%, transparent 70%)' }}
            />
            <div
              aria-hidden
              className="absolute -bottom-40 -left-32 w-[460px] h-[460px] rounded-full opacity-20 blur-3xl"
              style={{ background: 'radial-gradient(circle, #6EE7B7 0%, transparent 70%)' }}
            />

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-10 sm:pt-12 sm:pb-12">
              <div className="flex items-start justify-between gap-3 mb-3">
                {/* Eyebrow — 14px bold */}
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-300">
                  EsteKlinik
                </p>
                {/* Pill link — 16px (tıklanabilir min) */}
                <Link
                  href="/esteklinik/basvur"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-base font-semibold bg-white/10 hover:bg-white/20 border border-emerald-300/40 text-white backdrop-blur-sm transition-colors shrink-0"
                >
                  <Building2 size={16} />
                  Klinik misin? Başvur
                  <ArrowRight size={16} />
                </Link>
              </div>
              {/* Hero H1 — 36/48 */}
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-[1.05]">Randevu Ara</h1>
              {/* Body lead — 16/18 */}
              <p className="text-emerald-100 text-base sm:text-lg mt-3 mb-7">
                Bilimi Güzelliğe Dönüştüren Klinikleri Keşfet
              </p>

              <KlinikSearchInputs />
            </div>
          </section>

          {/* ============================================================
              SONUÇ GRID — branş filtresi yukarıdaki search motorunda
              ============================================================ */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <KlinikSearchResults />
          </section>

          {/* ============================================================
              EGP açıklama
              ============================================================ */}
          <section className="bg-[#FAFAF7] border-t border-slate-200 py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
              {/* Eyebrow — 14px bold */}
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#10876B] mb-3">
                Estelongy Güven Puanı
              </p>
              {/* H1 section — 24/30 */}
              <h2 className="text-slate-900 font-bold text-2xl sm:text-3xl mb-3">
                Reklam değil, sonuç konuşur
              </h2>
              {/* Body — 16 */}
              <p className="text-slate-700 text-base leading-relaxed">
                EGP, hasta sonuç değişimi, tavsiye eğilimi ve klinik akreditasyonunun ağırlıklı
                bileşkesidir. Kliniklerin reklam bütçesi sıralamayı etkilemez.
              </p>
            </div>
          </section>
        </main>
      </KlinikSearchProvider>

      <Footer />
    </>
  )
}
