'use client'

import { useRef, useState } from 'react'
import { Calendar } from 'lucide-react'
import { egpBadgeColor, egpLabel, egpDisplayPublic, MIN_REVIEWS_THRESHOLD } from '@/lib/clinic-review'
import MeasuringBadge from '@/components/MeasuringBadge'
import ClinicPreviewModal, { type ClinicPreview } from '@/components/ClinicPreviewModal'
import KlinikSlotPopover from './KlinikSlotPopover'

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
  const [previewOpen, setPreviewOpen] = useState(false)
  const [slotOpen, setSlotOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const egp = clinic.clinic_egp != null ? Number(clinic.clinic_egp) : null
  const reviewCount = clinic.review_count ?? 0
  const showMeasuring = reviewCount < MIN_REVIEWS_THRESHOLD
  const egpPublic = egpDisplayPublic(egp, reviewCount)
  const bioPreview = clinic.bio
    ? clinic.bio.length > 140 ? clinic.bio.slice(0, 140).trim() + '…' : clinic.bio
    : null

  const previewClinic: ClinicPreview = {
    id: clinic.id,
    name: clinic.name,
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

  function handleRandevuEnter() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    if (anchorRef.current) setAnchorRect(anchorRef.current.getBoundingClientRect())
    setSlotOpen(true)
  }
  function handleRandevuLeave() {
    closeTimer.current = setTimeout(() => setSlotOpen(false), 200)
  }

  return (
    <>
      <div
        onClick={() => setPreviewOpen(true)}
        className="group relative rounded-2xl bg-white border border-slate-200 hover:border-[#10876B]/60 hover:shadow-2xl hover:shadow-[#064E3B]/15 hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col shadow-sm cursor-pointer"
      >
        {/* Kapak banner — yeşil/teal kalır */}
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#10876B] via-[#0A6347] to-[#064E3B]">
          {clinic.cover_image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={clinic.cover_image_url}
              alt={clinic.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/40 text-7xl font-black">
              {clinic.name.charAt(0).toLocaleUpperCase('tr-TR')}
            </div>
          )}
          {/* Sol-üst marka bandı */}
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#064E3B]/80 backdrop-blur-sm border border-emerald-300/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-50">EsteKlinik</span>
          </div>
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

          {/* Footer: deneyim sayısı + Randevu Al butonu (hover ile popover) */}
          <footer className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto gap-3">
            <p className="text-[11px] text-slate-500">
              💬 <strong className="text-slate-700">{reviewCount}</strong> deneyim · son 12 ay
            </p>

            <div
              ref={anchorRef}
              className="relative"
              onMouseEnter={handleRandevuEnter}
              onMouseLeave={handleRandevuLeave}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#10876B] hover:bg-[#0E7559] text-white text-sm font-bold transition-colors shadow-md shadow-[#10876B]/30"
                aria-label={`${clinic.name} için randevu al`}
              >
                <Calendar size={13} />
                Randevu Al
              </button>

              {slotOpen && (
                <KlinikSlotPopover
                  clinicId={clinic.id}
                  onClose={() => setSlotOpen(false)}
                  anchorRect={anchorRect}
                />
              )}
            </div>
          </footer>

          {!showMeasuring && egp != null && (
            <p className="text-[10px] text-slate-400">{egpLabel(egp)}</p>
          )}
        </div>
      </div>

      {previewOpen && (
        <ClinicPreviewModal
          clinic={previewClinic}
          onClose={() => setPreviewOpen(false)}
          onSelect={() => {
            setPreviewOpen(false)
            window.location.href = `/randevu?k=${clinic.id}`
          }}
        />
      )}
    </>
  )
}
