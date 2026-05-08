'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { egpBadgeColor, egpLabel, egpDisplayPublic, MIN_REVIEWS_THRESHOLD, type ClinicReviewRow } from '@/lib/clinic-review'
import MeasuringBadge from '@/components/MeasuringBadge'

/** "Ayşe Yüksel" → "A**** Y*****" — public yorum gösteriminde anonimizasyon */
function maskName(full: string): string {
  return full
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => {
      const first = part.charAt(0).toLocaleUpperCase('tr-TR')
      const rest = '*'.repeat(Math.max(part.length - 1, 1))
      return first + rest
    })
    .join(' ')
}

export interface ClinicPreview {
  id: string
  name: string
  location: string | null
  bio: string | null
  specialties: string[] | null
  clinic_type: string | null
  clinic_egp?: number | null
  review_count?: number | null
  avg_nps?: number | null
}

interface Props {
  clinic: ClinicPreview | null
  onClose: () => void
  /** Modal'ı kapat + Adım 2'ye geç */
  onSelect: () => void
}

const CLINIC_TYPE_LABEL: Record<string, string> = {
  estetik: 'Estetik',
  dermatoloji: 'Dermatoloji',
  sac_ekimi: 'Saç Ekimi',
  lazer: 'Lazer',
  longevity: 'Longevity',
  diger: 'Diğer',
}

export default function ClinicPreviewModal({ clinic, onClose, onSelect }: Props) {
  const [reviews, setReviews] = useState<ClinicReviewRow[]>([])
  const [profileNames, setProfileNames] = useState<Map<string, string>>(new Map())
  const [loadingReviews, setLoadingReviews] = useState(false)

  // ESC tuşu ile kapat
  useEffect(() => {
    if (!clinic) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [clinic, onClose])

  // Son yorumlar (lazy fetch)
  useEffect(() => {
    if (!clinic) {
      setReviews([])
      setProfileNames(new Map())
      return
    }
    setLoadingReviews(true)
    const supabase = createClient()
    ;(async () => {
      const { data } = await supabase
        .from('clinic_reviews')
        .select('*')
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false })
        .limit(3)
      const list = (data ?? []) as ClinicReviewRow[]
      setReviews(list)

      const userIds = Array.from(new Set(list.filter(r => !r.is_anonymous).map(r => r.user_id)))
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)
        const map = new Map<string, string>()
        ;(profs ?? []).forEach(p => {
          const fn = (p as { full_name?: string | null }).full_name ?? ''
          if (fn) map.set(p.id as string, fn)
        })
        setProfileNames(map)
      } else {
        setProfileNames(new Map())
      }
      setLoadingReviews(false)
    })()
  }, [clinic])

  if (!clinic) return null

  const egp = clinic.clinic_egp != null ? Number(clinic.clinic_egp) : null
  const reviewCount = clinic.review_count ?? 0
  const showMeasuring = reviewCount < MIN_REVIEWS_THRESHOLD
  const egpPublic = egpDisplayPublic(egp, reviewCount)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-slate-900 sm:rounded-3xl rounded-t-3xl border border-slate-800 shadow-2xl shadow-teal-500/10 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero kapak — şimdilik gradient mesh placeholder */}
        <div className="relative h-48 sm:h-56 overflow-hidden sm:rounded-t-3xl rounded-t-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-emerald-600 to-slate-900" />
          <div className="absolute inset-0 opacity-40" style={{
            backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(45,212,191,0.6), transparent 50%), radial-gradient(circle at 70% 70%, rgba(16,185,129,0.5), transparent 50%)'
          }} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          {/* Kapat butonu */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-700 text-white hover:bg-slate-800 transition-colors"
            aria-label="Kapat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* EGP rozet sağ üst (kapat butonunun altı) */}
          {showMeasuring ? (
            <div className="absolute top-16 right-3 px-3 py-2 rounded-2xl border backdrop-blur-md bg-slate-900/70 border-slate-700 shadow-lg flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-400" />
              </span>
              <div>
                <div className="text-[9px] uppercase tracking-widest text-slate-400 leading-none">Ölçülüyor</div>
                <div className="text-xs font-bold text-slate-200 leading-tight">{reviewCount}/{MIN_REVIEWS_THRESHOLD}</div>
              </div>
            </div>
          ) : egpPublic && (
            <div className={`absolute top-16 right-3 px-3 py-2 rounded-2xl border backdrop-blur-md ${egpBadgeColor(egp)} shadow-lg`}>
              <div className="text-[9px] uppercase tracking-widest opacity-80 leading-none">EGP</div>
              <div className="text-2xl font-black leading-tight">{egpPublic}</div>
            </div>
          )}

          {/* Sol alt — klinik bilgisi */}
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg">{clinic.name}</h2>
              <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-label="Onaylı">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {clinic.location && (
              <p className="text-slate-200 text-sm drop-shadow flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {clinic.location}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Chip'ler */}
          {(clinic.clinic_type || (clinic.specialties && clinic.specialties.length > 0)) && (
            <div className="flex flex-wrap gap-1.5">
              {clinic.clinic_type && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  {CLINIC_TYPE_LABEL[clinic.clinic_type] ?? clinic.clinic_type}
                </span>
              )}
              {(clinic.specialties ?? []).slice(0, 6).map((s, i) => (
                <span key={i} className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Bio */}
          {clinic.bio && (
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Hakkında</h3>
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{clinic.bio}</p>
            </div>
          )}

          {/* Stats şeridi */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wider">Deneyim</div>
              <div className="text-white font-bold text-lg">{reviewCount}</div>
              <div className="text-[9px] text-slate-600">son 12 ay</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wider">Yöntem</div>
              <div className="text-slate-300 font-bold text-xs leading-tight mt-1">NHS FFT<br/>+Bayesian</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wider">Onay</div>
              <div className="text-emerald-400 font-bold text-lg">KYC ✓</div>
            </div>
          </div>

          {/* EGP detay alt kart */}
          {showMeasuring ? (
            <MeasuringBadge reviewCount={reviewCount} variant="badge" />
          ) : egpPublic && (
            <div className={`p-3 rounded-xl border ${egpBadgeColor(egp)} flex items-center gap-3`}>
              <div className="text-2xl font-black">{egpPublic}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-widest opacity-80">Estelongy Güven Puanı</div>
                <div className="text-xs font-bold uppercase tracking-wider">{egpLabel(egp)}</div>
              </div>
            </div>
          )}

          {/* Son deneyimler */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Son Deneyimler</h3>
            {loadingReviews ? (
              <div className="space-y-2">
                {[1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-slate-800/40 animate-pulse" />)}
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-slate-500 text-xs italic">Henüz yorum yok — ilk deneyim senin olsun.</p>
            ) : (
              <div className="space-y-2">
                {reviews.map(r => {
                  const fullName = profileNames.get(r.user_id)
                  let displayName: string
                  if (r.is_anonymous) {
                    displayName = fullName ? maskName(fullName) : 'Estelongy Kullanıcısı'
                  } else {
                    displayName = fullName ?? 'Estelongy Kullanıcısı'
                  }
                  return (
                    <div key={r.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white font-semibold">
                          {displayName}
                          {r.is_anonymous && <span className="ml-1.5 text-[9px] text-slate-600 uppercase tracking-wider font-normal">Anonim</span>}
                        </span>
                        <span className="text-[10px] text-slate-600 shrink-0">
                          {new Date(r.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      {r.pozitif_metin && (
                        <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">{r.pozitif_metin}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sticky CTA — alt */}
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
          <button
            onClick={onSelect}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            Bu Klinikten Randevu Al
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
