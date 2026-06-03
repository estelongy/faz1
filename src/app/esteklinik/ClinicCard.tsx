'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, MapPin } from 'lucide-react'
import { egpBadgeColor, egpDisplayPublic, MIN_REVIEWS_THRESHOLD } from '@/lib/clinic-review'
import MeasuringBadge from '@/components/MeasuringBadge'
import ClinicPreviewModal, { type ClinicPreview } from '@/components/ClinicPreviewModal'

export interface ClinicRow {
  id: string
  slug: string | null
  title: string | null
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

export default function ClinicCard({ clinic }: { clinic: ClinicRow }) {
  const [previewOpen, setPreviewOpen] = useState(false)

  const egp = clinic.clinic_egp != null ? Number(clinic.clinic_egp) : null
  const reviewCount = clinic.review_count ?? 0
  const showMeasuring = reviewCount < MIN_REVIEWS_THRESHOLD
  const egpPublic = egpDisplayPublic(egp, reviewCount)

  // Ünvan + ad tek kimlik satırı: "Dr. İzzet Gök". Ünvan ayrı alan (clinics.title).
  const displayName = [clinic.title, clinic.name].filter(Boolean).join(' ')
  const services = clinic.specialties ?? []

  // Güven rozeti — kapağın üstüne (sağ-üst). Ad satırından yer çalmaz → uzun
  // gerçek adlar ("Kanuni Sultan Süleyman") kırpılmadan iki satıra sığar.
  const trustBadge = showMeasuring ? (
    <MeasuringBadge reviewCount={reviewCount} variant="mini" />
  ) : (
    <div className={`px-2 py-1 rounded-md border text-center min-w-[56px] shadow-sm ${egpBadgeColor(egp)}`}>
      <p className="text-lg font-black leading-none">{egpPublic ?? '—'}</p>
      <p className="text-[8px] uppercase tracking-wider opacity-70 mt-0.5">EGP</p>
    </div>
  )

  const previewClinic: ClinicPreview = {
    id: clinic.id,
    name: displayName,
    location: clinic.location,
    bio: clinic.bio,
    specialties: clinic.specialties,
    clinic_type: clinic.clinic_type,
    clinic_egp: clinic.clinic_egp,
    review_count: clinic.review_count,
    avg_nps: clinic.avg_nps,
    logo_url: clinic.logo_url,
    cover_image_url: clinic.cover_image_url,
  }

  return (
    <>
      <div
        onClick={() => setPreviewOpen(true)}
        className="group relative h-full rounded-2xl bg-white border border-slate-200 hover:border-[#10876B]/60 hover:shadow-2xl hover:shadow-[#064E3B]/15 hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col shadow-sm cursor-pointer"
      >
        {/* Kapak banner — yeşil/teal */}
        <div className="relative aspect-[3/1] overflow-hidden bg-gradient-to-br from-[#10876B] via-[#0A6347] to-[#064E3B]">
          {clinic.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clinic.cover_image_url}
              alt={displayName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/40 text-6xl font-black">
              {clinic.name.charAt(0).toLocaleUpperCase('tr-TR')}
            </div>
          )}
          {/* Güven rozeti kapakta — ad satırından yer çalmaz */}
          <div className="absolute top-2 right-2 z-10">{trustBadge}</div>
        </div>

        {/* Detay — BEYAZ zemin */}
        <div className="p-5 flex-1 flex flex-col">
          {/* KİMLİK: ünvan+ad (kalın) · branş (yeşil alt-başlık) · konum */}
          <header className="flex items-start gap-2.5">
            {clinic.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={clinic.logo_url}
                alt={displayName}
                className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#10876B] to-[#064E3B] flex items-center justify-center text-white font-black text-lg shrink-0">
                {clinic.name.charAt(0).toLocaleUpperCase('tr-TR')}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-slate-900 font-bold text-base group-hover:text-[#10876B] transition-colors line-clamp-2 leading-tight">
                {displayName}
              </h3>
              {clinic.clinic_type && (
                <p className="text-[#0E7559] text-sm font-semibold mt-0.5 line-clamp-1">{clinic.clinic_type}</p>
              )}
            </div>
          </header>

          {clinic.location && (
            <p className="flex items-center gap-1 text-slate-500 text-sm mt-2.5 line-clamp-1">
              <MapPin size={13} className="shrink-0 text-slate-400" />
              {clinic.location}
            </p>
          )}

          {/* HİZMETLER — branştan ayrı, gri chip'ler (ne sunuyor) */}
          {services.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {services.slice(0, 3).map((s, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200"
                >
                  {s}
                </span>
              ))}
              {services.length > 3 && (
                <span className="text-xs text-slate-400">+{services.length - 3} hizmet</span>
              )}
            </div>
          )}

          {/* Footer: deneyim + Randevu Al (Bio/CV "incele" → ClinicPreviewModal) */}
          <footer className="flex items-center justify-between gap-3 pt-3.5 border-t border-slate-100 mt-auto">
            <p className="text-sm text-slate-500">
              💬 <strong className="text-slate-700">{reviewCount}</strong> deneyim
            </p>

            <Link
              href={`/esteklinik/randevu/${clinic.slug ?? clinic.id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#10876B] hover:bg-[#0E7559] text-white text-sm font-bold transition-colors shadow-md shadow-[#10876B]/30"
              aria-label={`${displayName} için randevu al`}
            >
              <Calendar size={13} />
              Randevu Al
            </Link>
          </footer>
        </div>
      </div>

      {previewOpen && (
        <ClinicPreviewModal
          clinic={previewClinic}
          onClose={() => setPreviewOpen(false)}
          onSelect={() => {
            setPreviewOpen(false)
            window.location.href = `/esteklinik/randevu/${clinic.slug ?? clinic.id}`
          }}
        />
      )}
    </>
  )
}
