import Link from 'next/link'
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

const CLINIC_TYPE_LABEL: Record<string, string> = {
  estetik: 'Estetik',
  dermatoloji: 'Dermatoloji',
  sac_ekimi: 'Saç Ekimi',
  lazer: 'Lazer',
  longevity: 'Longevity',
  diger: 'Diğer',
}

export default function ClinicCard({ clinic }: { clinic: ClinicRow }) {
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
      className="group rounded-2xl bg-white border border-slate-200 hover:border-[#10876B]/60 hover:shadow-2xl hover:shadow-[#064E3B]/15 hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col shadow-sm"
    >
      {/* Kapak banner — yeşil/teal kalır */}
      <div className="relative aspect-[3/1] overflow-hidden bg-gradient-to-br from-[#10876B] via-[#0A6347] to-[#064E3B]">
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
      </div>

      {/* Detay — BEYAZ zemin, koyu metinler */}
      <div className="p-5 space-y-3 flex-1 flex flex-col">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {clinic.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={clinic.logo_url}
                alt={clinic.name}
                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10876B] to-[#064E3B] flex items-center justify-center text-white font-black text-base shrink-0">
                {clinic.name.charAt(0).toLocaleUpperCase('tr-TR')}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-slate-900 font-bold text-base group-hover:text-[#10876B] transition-colors line-clamp-1">
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

        {/* Etiketler */}
        {(clinic.clinic_type || (clinic.specialties && clinic.specialties.length > 0)) && (
          <div className="flex flex-wrap gap-1.5">
            {clinic.clinic_type && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#10876B]/12 text-[#0E7559] border border-[#10876B]/30">
                {CLINIC_TYPE_LABEL[clinic.clinic_type] ?? clinic.clinic_type}
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
          <p className="text-slate-700 text-sm leading-relaxed line-clamp-3">{bioPreview}</p>
        )}

        {/* Footer */}
        <footer className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
          <p className="text-[11px] text-slate-500">
            💬 <strong className="text-slate-700">{reviewCount}</strong> deneyim · son 12 ay
          </p>
          <span className="text-[#10876B] group-hover:text-[#064E3B] text-xs font-bold inline-flex items-center gap-1 transition-colors">
            Detay & Randevu →
          </span>
        </footer>

        {!showMeasuring && egp != null && (
          <p className="text-[10px] text-slate-400">{egpLabel(egp)}</p>
        )}
      </div>
    </Link>
  )
}
