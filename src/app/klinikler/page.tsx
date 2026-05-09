export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/components/SiteHeader'
import Footer from '@/components/Footer'
import { egpBadgeColor, egpLabel, egpDisplayPublic, MIN_REVIEWS_THRESHOLD } from '@/lib/clinic-review'
import MeasuringBadge from '@/components/MeasuringBadge'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://estelongy.com'

export const metadata: Metadata = {
  title: 'Klinikler — Estelongy Onaylı Estetik Merkezleri',
  description:
    'Estelongy ekosisteminde KYC onayı tamamlanmış, hekim değerlendirmeli klinikleri keşfet. Şehir ve uzmanlık alanına göre filtrele, klinik EGP puanı ve hasta deneyimleriyle karşılaştır.',
  alternates: { canonical: '/klinikler' },
  openGraph: {
    title: 'Klinikler — Estelongy',
    description: 'Onaylı estetik kliniklerini keşfet. EGP puanı, hasta yorumları ve direkt randevu.',
    url: `${SITE_URL}/klinikler`,
    type: 'website',
  },
}

interface ClinicRow {
  id: string
  slug: string | null
  name: string
  location: string | null
  bio: string | null
  specialties: string[] | null
  clinic_type: string | null
  clinic_egp: number | null
  review_count: number | null
  avg_nps: number | null
  logo_url: string | null
  cover_image_url: string | null
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

  // Tüm aktif + onaylı klinikleri çek
  let q = supabase
    .from('clinics')
    .select('id, slug, name, location, bio, specialties, clinic_type, clinic_egp, review_count, avg_nps, logo_url, cover_image_url')
    .eq('is_active', true)
    .eq('approval_status', 'approved')

  if (sehir) {
    // location alanı serbest yazıldığı için case-insensitive ilike
    q = q.ilike('location', `%${sehir}%`)
  }
  if (tip) {
    q = q.eq('clinic_type', tip)
  }

  // Sıralama
  if (sirala === 'yeni') {
    q = q.order('created_at', { ascending: false })
  } else if (sirala === 'yorum') {
    q = q.order('review_count', { ascending: false, nullsFirst: false })
  } else {
    q = q.order('clinic_egp', { ascending: false, nullsFirst: false }).order('review_count', { ascending: false, nullsFirst: false })
  }

  const { data: rows } = await q.limit(60)
  const clinics = (rows ?? []) as ClinicRow[]

  // Filtre dropdown'ları için unique şehir & tip listesi (DB'den)
  const { data: allClinicsForMeta } = await supabase
    .from('clinics')
    .select('location, clinic_type')
    .eq('is_active', true)
    .eq('approval_status', 'approved')

  const cityCounts = new Map<string, number>()
  const typeCounts = new Map<string, number>()
  for (const c of (allClinicsForMeta ?? [])) {
    const loc = (c as { location: string | null }).location
    const t = (c as { clinic_type: string | null }).clinic_type
    if (loc) {
      // Şehri kaba çıkar: virgülden öncesi
      const city = loc.split(',')[0].trim()
      if (city) cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1)
    }
    if (t) typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1)
  }
  const cities = Array.from(cityCounts.entries()).sort((a, b) => b[1] - a[1])
  const types = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1])

  return (
    <>
      <SiteHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-6">
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-3">
            <Link href="/" className="hover:text-white transition-colors">Anasayfa</Link>
            <span>›</span>
            <span className="text-slate-300">Klinikler</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Klinikler</h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Estelongy KYC onayından geçmiş, hekim değerlendirmeli klinikler. Klinik EGP puanı, hasta deneyimleri ve direkt randevu.
          </p>
        </header>

        {/* Filtre + sıralama */}
        <form className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Şehir</label>
            <select
              name="sehir"
              defaultValue={sehir}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
            >
              <option value="">Tümü</option>
              {cities.map(([city, n]) => (
                <option key={city} value={city}>{city} ({n})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Klinik Tipi</label>
            <select
              name="tip"
              defaultValue={tip}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
            >
              <option value="">Tümü</option>
              {types.map(([t, n]) => (
                <option key={t} value={t}>{CLINIC_TYPE_LABEL[t] ?? t} ({n})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Sırala</label>
            <select
              name="sirala"
              defaultValue={sirala}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
            >
              <option value="egp">EGP Puanı (yüksekten)</option>
              <option value="yorum">En Çok Yorum</option>
              <option value="yeni">En Yeni</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Filtrele
            </button>
            {(sehir || tip || sirala !== 'egp') && (
              <Link
                href="/klinikler"
                className="px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Sıfırla
              </Link>
            )}
          </div>
        </form>

        <p className="text-slate-500 text-xs mb-4">
          {clinics.length} klinik {sehir && <>· <span className="text-slate-300">{sehir}</span></>}
          {tip && <> · <span className="text-slate-300">{CLINIC_TYPE_LABEL[tip] ?? tip}</span></>}
        </p>

        {/* Liste */}
        {clinics.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
            <div className="text-5xl opacity-40 mb-3">🏥</div>
            <p className="text-white font-semibold">Bu kriterlere uygun klinik bulunamadı</p>
            <p className="text-slate-500 text-sm mt-1">Filtreleri değiştirip tekrar dene.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clinics.map(c => <ClinicCard key={c.id} clinic={c} />)}
          </div>
        )}

        {/* Felsefe notu altta */}
        <p className="mt-10 text-center text-xs text-slate-500">
          Tüm klinikler Estelongy KYC + akreditasyon kontrolünden geçer.
          EGP (Estelongy Güven Puanı): hasta sonuç değişimi, tavsiye eğilimi ve klinik akreditasyonunun ağırlıklı bileşkesi.
        </p>
      </main>
      <Footer />
    </>
  )
}

// ───────────────────────────────────────────────────────────────────

function ClinicCard({ clinic }: { clinic: ClinicRow }) {
  const egp = clinic.clinic_egp != null ? Number(clinic.clinic_egp) : null
  const reviewCount = clinic.review_count ?? 0
  const showMeasuring = reviewCount < MIN_REVIEWS_THRESHOLD
  const egpPublic = egpDisplayPublic(egp, reviewCount)
  const slug = clinic.slug ?? clinic.id
  const bioPreview = clinic.bio
    ? clinic.bio.length > 140 ? clinic.bio.slice(0, 140).trim() + '…' : clinic.bio
    : null

  return (
    <Link
      href={`/klinik/${slug}`}
      className="group rounded-2xl bg-slate-900 border border-slate-800 hover:border-violet-500/50 transition-all overflow-hidden flex flex-col"
    >
      {/* Kapak (varsa) */}
      <div className="relative aspect-[3/1] overflow-hidden bg-slate-800">
        {clinic.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clinic.cover_image_url}
            alt={clinic.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal-500/40 via-emerald-600/30 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
      </div>

      <div className="p-5 space-y-3 flex-1 flex flex-col">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {clinic.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={clinic.logo_url} alt={clinic.name} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-700" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-black text-base shrink-0">
              {clinic.name.charAt(0).toLocaleUpperCase('tr-TR')}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-bold text-base group-hover:text-violet-300 transition-colors line-clamp-1">
              {clinic.name}
            </h3>
            {clinic.location && (
              <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">📍 {clinic.location}</p>
            )}
          </div>
        </div>
        {showMeasuring ? (
          <MeasuringBadge reviewCount={reviewCount} variant="mini" />
        ) : (
          <div className={`shrink-0 px-2 py-1 rounded-md border text-center min-w-[60px] ${egpBadgeColor(egp)}`}>
            <p className="text-lg font-black leading-none">{egpPublic ?? '—'}</p>
            <p className="text-[8px] uppercase tracking-wider opacity-70 mt-0.5">EGP</p>
          </div>
        )}
      </header>

      {/* Etiketler: tip + uzmanlık */}
      {(clinic.clinic_type || (clinic.specialties && clinic.specialties.length > 0)) && (
        <div className="flex flex-wrap gap-1.5">
          {clinic.clinic_type && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
              {CLINIC_TYPE_LABEL[clinic.clinic_type] ?? clinic.clinic_type}
            </span>
          )}
          {(clinic.specialties ?? []).slice(0, 3).map((s, i) => (
            <span key={i} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {s}
            </span>
          ))}
          {(clinic.specialties ?? []).length > 3 && (
            <span className="text-[10px] text-slate-500">+{(clinic.specialties ?? []).length - 3}</span>
          )}
        </div>
      )}

      {/* Bio özet */}
      {bioPreview && (
        <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">{bioPreview}</p>
      )}

      {/* Footer: stats + CTA */}
      <footer className="flex items-center justify-between pt-3 border-t border-slate-800">
        <p className="text-[11px] text-slate-500">
          💬 <strong className="text-slate-300">{reviewCount}</strong> deneyim · son 12 ay
        </p>
        <span className="text-violet-400 group-hover:text-violet-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors">
          Detay & Randevu →
        </span>
      </footer>

      {!showMeasuring && egp != null && (
        <p className="text-[10px] text-slate-600">{egpLabel(egp)}</p>
      )}
      </div>
    </Link>
  )
}
