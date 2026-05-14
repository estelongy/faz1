export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Footer from '@/components/Footer'
import EsteKlinikNav from './EsteKlinikNav'
import FilterBar from './FilterBar'
import ClinicCard, { type ClinicRow } from './ClinicCard'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://estelongy.com'

export const metadata: Metadata = {
  title: 'EsteKlinik — Onaylı Estetik Merkezleri',
  description:
    'EsteKlinik ekosisteminde KYC onayı tamamlanmış, hekim değerlendirmeli klinikleri keşfet. Şehir ve uzmanlık alanına göre filtrele, EGP puanı ve hasta deneyimleriyle karşılaştır.',
  alternates: { canonical: '/klinikler' },
  openGraph: {
    title: 'EsteKlinik — Onaylı Klinikler',
    description: 'Onaylı estetik kliniklerini keşfet. EGP puanı, hasta yorumları ve direkt randevu.',
    url: `${SITE_URL}/klinikler`,
    type: 'website',
  },
}

const CLINIC_TYPE_LABEL: Record<string, string> = {
  estetik: 'Estetik',
  dermatoloji: 'Dermatoloji',
  sac_ekimi: 'Saç Ekimi',
  lazer: 'Lazer',
  longevity: 'Longevity',
  diger: 'Diğer',
}

interface SearchParams {
  sehir?: string
  tip?: string
  sirala?: 'egp' | 'yeni' | 'yorum'
}

export default async function KliniklerPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const sehir = sp.sehir?.trim() ?? ''
  const tip = sp.tip?.trim() ?? ''
  const sirala = sp.sirala ?? 'egp'

  const supabase = await createClient()

  // ── Eski filtre motoru AYNEN korundu ─────────────────────────────
  let q = supabase
    .from('clinics')
    .select('id, slug, name, location, bio, specialties, clinic_type, clinic_egp, review_count, avg_nps, logo_url, cover_image_url')
    .eq('is_active', true)
    .eq('approval_status', 'approved')

  if (sehir) {
    q = q.ilike('location', `%${sehir}%`)
  }
  if (tip) {
    q = q.eq('clinic_type', tip)
  }

  if (sirala === 'yeni') {
    q = q.order('created_at', { ascending: false })
  } else if (sirala === 'yorum') {
    q = q.order('review_count', { ascending: false, nullsFirst: false })
  } else {
    q = q
      .order('clinic_egp', { ascending: false, nullsFirst: false })
      .order('review_count', { ascending: false, nullsFirst: false })
  }

  const { data: rows } = await q.limit(60)
  const clinics = (rows ?? []) as ClinicRow[]

  // Filter dropdown'ları için unique liste
  const { data: allClinicsForMeta } = await supabase
    .from('clinics')
    .select('location, clinic_type')
    .eq('is_active', true)
    .eq('approval_status', 'approved')

  const cityCounts = new Map<string, number>()
  const typeCounts = new Map<string, number>()
  for (const c of allClinicsForMeta ?? []) {
    const loc = (c as { location: string | null }).location
    const t = (c as { clinic_type: string | null }).clinic_type
    if (loc) {
      const city = loc.split(',')[0].trim()
      if (city) cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1)
    }
    if (t) typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1)
  }
  const cities = Array.from(cityCounts.entries()).sort((a, b) => b[1] - a[1])
  const types = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1])

  return (
    <>
      <EsteKlinikNav />

      <main className="min-h-screen bg-white">
        {/* ============================================================
            HERO — derin teal zemin, filtre motoru burada başrol
            ============================================================ */}
        <section className="relative bg-gradient-to-br from-[#064E3B] via-[#0A6347] to-[#053527] overflow-hidden">
          {/* Subtle radial glow */}
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

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-10 sm:pt-16 sm:pb-12">
            <nav className="flex items-center gap-2 text-xs text-emerald-200/70 mb-5">
              <Link href="/" className="hover:text-white transition-colors">Anasayfa</Link>
              <span>›</span>
              <span className="text-white">EsteKlinik</span>
            </nav>

            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300 mb-3">
                Estelongy Klinik Ekosistemi
              </p>
              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight mb-3">
                Doğru kliniği bul,
                <br />
                <span className="text-emerald-300">randevunu sen seç.</span>
              </h1>
              <p className="text-emerald-100/85 text-sm sm:text-base leading-relaxed max-w-2xl mb-7">
                KYC onayından geçmiş, hekim değerlendirmeli klinikler. Şehir, uzmanlık ve
                Estelongy Güven Puanı&apos;na (EGP) göre filtrele — doğrudan randevu al.
              </p>

              {/* Filtre motoru — hero içinde başrol */}
              <FilterBar
                sehir={sehir}
                tip={tip}
                sirala={sirala}
                cities={cities}
                types={types}
                typeLabel={CLINIC_TYPE_LABEL}
              />
            </div>
          </div>
        </section>

        {/* ============================================================
            LISTE — beyaz zemin, yatay klinik kartları (2 kolon)
            ============================================================ */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-baseline justify-between gap-3 mb-6">
            <h2 className="text-slate-900 font-bold text-lg sm:text-xl">
              {clinics.length} klinik
              {sehir && <span className="text-slate-400 font-normal text-sm ml-2">· {sehir}</span>}
              {tip && <span className="text-slate-400 font-normal text-sm ml-2">· {CLINIC_TYPE_LABEL[tip] ?? tip}</span>}
            </h2>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Tüm klinikler Estelongy KYC + akreditasyon kontrolünden geçer
            </p>
          </div>

          {clinics.length === 0 ? (
            <div className="text-center py-20 bg-[#FAFAF7] rounded-2xl border border-slate-200">
              <div className="text-5xl opacity-30 mb-3">🏥</div>
              <p className="text-slate-900 font-semibold">Bu kriterlere uygun klinik bulunamadı</p>
              <p className="text-slate-500 text-sm mt-1">Filtreleri değiştirip tekrar dene.</p>
              <Link
                href="/klinikler"
                className="inline-flex items-center mt-5 px-4 py-2 rounded-full bg-[#10876B] hover:bg-[#0E7559] text-white text-sm font-semibold transition-colors"
              >
                Filtreyi sıfırla
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {clinics.map(c => (
                <ClinicCard key={c.id} clinic={c} typeLabel={CLINIC_TYPE_LABEL} />
              ))}
            </div>
          )}
        </section>

        {/* ============================================================
            FELSEFE — EGP açıklama band
            ============================================================ */}
        <section className="bg-[#FAFAF7] border-t border-slate-200 py-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#10876B] mb-2">
              Estelongy Güven Puanı
            </p>
            <h3 className="text-slate-900 font-bold text-xl sm:text-2xl mb-2">
              Reklam değil, sonuç konuşur
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              EGP, hasta sonuç değişimi, tavsiye eğilimi ve klinik akreditasyonunun ağırlıklı
              bileşkesidir. Kliniklerin reklam bütçesi sıralamayı etkilemez.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
