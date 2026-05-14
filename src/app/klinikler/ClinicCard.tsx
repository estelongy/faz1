import Link from 'next/link'
import { MapPin, MessageCircle, ArrowRight } from 'lucide-react'
import { egpBadgeColor, egpLabel, egpDisplayPublic, MIN_REVIEWS_THRESHOLD } from '@/lib/clinic-review'
import MeasuringBadge from '@/components/MeasuringBadge'

export interface ClinicRow {
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

interface Props {
  clinic: ClinicRow
  typeLabel: Record<string, string>
}

/**
 * Yatay klinik kart — EsteStore ürün kartından AÇIKÇA farklı layout.
 * - Sol: kapak görseli (1:1 sabit kare)
 * - Sağ: detay (isim, lokasyon, etiketler, bio, footer)
 * - EGP rozet kapağın sol-üstünde (EsteStore'da fiyat sağ-altta)
 */
export default function ClinicCard({ clinic, typeLabel }: Props) {
  const egp = clinic.clinic_egp != null ? Number(clinic.clinic_egp) : null
  const reviewCount = clinic.review_count ?? 0
  const showMeasuring = reviewCount < MIN_REVIEWS_THRESHOLD
  const egpPublic = egpDisplayPublic(egp, reviewCount)
  const slug = clinic.slug ?? clinic.id
  const bioPreview = clinic.bio
    ? clinic.bio.length > 160 ? clinic.bio.slice(0, 160).trim() + '…' : clinic.bio
    : null

  return (
    <Link
      href={`/klinik/${slug}`}
      className="group flex flex-col sm:flex-row gap-0 bg-white border border-slate-200 hover:border-[#10876B]/40 rounded-2xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-[#064E3B]/15 hover:-translate-y-0.5"
    >
      {/* SOL: kapak (1:1 kare, mobilde geniş banner) */}
      <div className="relative w-full sm:w-44 sm:h-44 aspect-[4/3] sm:aspect-square overflow-hidden bg-gradient-to-br from-[#10876B] via-[#0E7559] to-[#064E3B] shrink-0">
        {clinic.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clinic.cover_image_url}
            alt={clinic.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/40 text-6xl font-black">
            {clinic.name.charAt(0).toLocaleUpperCase('tr-TR')}
          </div>
        )}

        {/* EGP rozet — sol-üst köşede (EsteStore ile mirror konum) */}
        <div className="absolute top-2.5 left-2.5">
          {showMeasuring ? (
            <MeasuringBadge reviewCount={reviewCount} variant="mini" />
          ) : (
            <div className={`px-2 py-1 rounded-lg border text-center min-w-[52px] backdrop-blur-md bg-white/90 ${egpBadgeColor(egp)}`}>
              <p className="text-base font-black leading-none">{egpPublic ?? '—'}</p>
              <p className="text-[8px] uppercase tracking-wider opacity-70 mt-0.5">EGP</p>
            </div>
          )}
        </div>
      </div>

      {/* SAĞ: detay */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col gap-2.5 min-w-0">
        <header className="flex items-start gap-2.5">
          {clinic.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clinic.logo_url}
              alt={clinic.name}
              className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-slate-900 font-bold text-base sm:text-lg group-hover:text-[#10876B] transition-colors line-clamp-1">
              {clinic.name}
            </h3>
            {clinic.location && (
              <p className="text-slate-500 text-xs mt-0.5 line-clamp-1 flex items-center gap-1">
                <MapPin size={11} className="text-slate-400" /> {clinic.location}
              </p>
            )}
          </div>
        </header>

        {/* Etiketler */}
        {(clinic.clinic_type || (clinic.specialties && clinic.specialties.length > 0)) && (
          <div className="flex flex-wrap gap-1.5">
            {clinic.clinic_type && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#10876B]/12 text-[#0E7559] border border-[#10876B]/30">
                {typeLabel[clinic.clinic_type] ?? clinic.clinic_type}
              </span>
            )}
            {(clinic.specialties ?? []).slice(0, 3).map((s, i) => (
              <span
                key={i}
                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
              >
                {s}
              </span>
            ))}
            {(clinic.specialties ?? []).length > 3 && (
              <span className="text-[10px] text-slate-400">+{(clinic.specialties ?? []).length - 3}</span>
            )}
          </div>
        )}

        {/* Bio */}
        {bioPreview && (
          <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 flex-1">{bioPreview}</p>
        )}

        {/* Footer: stats + CTA */}
        <footer className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <MessageCircle size={11} className="text-slate-400" />
            <strong className="text-slate-700">{reviewCount}</strong> deneyim · son 12 ay
          </p>
          <span className="text-[#10876B] group-hover:text-[#0E7559] text-xs font-bold inline-flex items-center gap-1 transition-colors">
            Randevu Al
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </footer>

        {!showMeasuring && egp != null && (
          <p className="text-[10px] text-slate-400">{egpLabel(egp)}</p>
        )}
      </div>
    </Link>
  )
}
