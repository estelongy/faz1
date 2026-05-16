'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TETKIK_PARAMS } from '@/lib/tetkik-params'

import SafeLink from '@/components/SafeLink'
export interface YolculukAnalysis {
  id: string
  web_overall: number | null
  temp_overall: number | null
  final_overall: number | null
  web_scores: Record<string, number> | null
  doctor_notes: string | null
  doctor_approved_scores: {
    tetkik?: Record<string, number>
    ileri_analiz_c250?: {
      hydration?: number
      tone_uniformity?: number
      wrinkles?: number
      pigmentation?: number
      under_eye?: number
    }
    hekim_skoru?: number
  } | null
  created_at: string
}

export interface YolculukAppointment {
  id: string
  appointment_date: string | null
  status: string
  completed_at: string | null
  clinic_name: string | null
  notes: string | null
  clinic_notes: string | null
  procedure_notes: string | null
  recommendations: string | null
}

export interface YolculukView {
  id: string
  status: 'active' | 'clinic_done' | 'completed' | 'abandoned'
  startedAt: string
  completedAt: string | null
  /** Klinik öncesi en güncel ön analiz */
  preAnalysis: YolculukAnalysis | null
  /** Klinik randevusu */
  appointment: YolculukAppointment | null
  /** Klinik onaylı analiz (genelde appointment ile aynı analiz) */
  clinicAnalysis: YolculukAnalysis | null
  /** Klinik sonrası "son analiz" (varsa) */
  postAnalysis: YolculukAnalysis | null
  /** Yolculuk numarası (en eski 1, en yeni N) */
  index: number
  /** Toplam yolculuk sayısı (numaralandırma için) */
  total: number
  /** Klinik deneyim yorumu durumu */
  reviewState?: 'none' | 'editable' | 'locked'
}

const C250_LABELS: Array<[string, string]> = [
  ['hydration',       'Nem'],
  ['tone_uniformity', 'Ton'],
  ['wrinkles',        'Kırışıklık'],
  ['pigmentation',    'Pigment'],
  ['under_eye',       'Göz Altı'],
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function YolculukKarti({ y }: { y: YolculukView }) {
  const [open, setOpen] = useState(false)

  // ── Aşamalar ────────────────────────────────────────────
  const stage1Done = y.preAnalysis != null
  const stage2Done = y.clinicAnalysis?.final_overall != null
  const stage3Done = y.postAnalysis != null
  const stagesDone = [stage1Done, stage2Done, stage3Done].filter(Boolean).length

  const preScore   = y.preAnalysis?.web_overall ?? y.preAnalysis?.temp_overall ?? null
  const finalScore = y.clinicAnalysis?.final_overall ?? null
  const postScore  = y.postAnalysis?.web_overall ?? y.postAnalysis?.temp_overall ?? null

  const isCompleted = y.status === 'completed'
  const isClinicDone = y.status === 'clinic_done'
  const isActive    = y.status === 'active' || isClinicDone

  // En büyük delta (start → en son skor)
  const startScore = preScore
  const lastScore  = postScore ?? finalScore ?? preScore
  const totalDelta = startScore != null && lastScore != null && lastScore !== startScore
    ? Math.round((lastScore - startScore) * 10) / 10
    : null

  // ── Renk teması ─────────────────────────────────────────
  const accent = isActive
    ? 'border-violet-500/40 bg-gradient-to-br from-violet-950/30 to-slate-900'
    : isCompleted
      ? 'border-emerald-700/40 bg-slate-900'
      : 'border-slate-800 bg-slate-900'

  const statusBadge = (() => {
    if (y.status === 'completed') return { label: '✓ Tamamlandı', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
    if (y.status === 'clinic_done') return { label: 'Son analiz bekleniyor', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
    if (y.status === 'active') return { label: 'Devam ediyor', cls: 'bg-violet-500/15 text-violet-400 border-violet-500/30' }
    return { label: 'İptal', cls: 'bg-slate-700/40 text-slate-500 border-slate-700' }
  })()

  // ── Sıradaki adım CTA ──────────────────────────────────
  const nextStep = (() => {
    if (isCompleted || y.status === 'abandoned') return null
    if (!stage1Done) return { label: 'Ön analiz yap', href: '/analiz' }
    if (!y.appointment) return { label: 'Klinikten randevu al', href: '/esteklinik' }
    if (!stage2Done) return { label: 'Klinik onayı bekleniyor', href: null }
    if (isClinicDone && !stage3Done) return { label: 'Son selfie ile sonucu gör', href: '/analiz' }
    return null
  })()

  return (
    <div className={`rounded-2xl border ${accent} overflow-hidden transition-all`}>
      {/* Başlık çubuğu */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isCompleted ? 'bg-emerald-500/15 text-emerald-400'
            : isActive ? 'bg-violet-500/15 text-violet-400'
            : 'bg-slate-700/30 text-slate-500'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d={isCompleted
                  ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  : "M13 10V3L4 14h7v7l9-11h-7z"
                } />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold text-sm">
              {isCompleted ? `Yolculuk #${y.index}` : 'Aktif Yolculuğun'}
            </div>
            <div className="text-slate-500 text-sm">
              {formatDate(y.startedAt)}
              {y.completedAt && ` — ${formatDate(y.completedAt)}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {totalDelta != null && (
            <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
              totalDelta > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
            }`}>
              {totalDelta > 0 ? '↑+' : '↓'}{Math.abs(totalDelta).toFixed(1)}
            </span>
          )}
          <span className={`text-sm font-semibold px-2 py-0.5 rounded-full border ${statusBadge.cls}`}>
            {statusBadge.label}
          </span>
          <svg className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 3 aşamalı progress */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-3 gap-2">
          <StageDot label="Ön Analiz"    score={preScore}   done={stage1Done} active={!stage1Done && isActive} />
          <StageDot label="Klinik Onayı" score={finalScore} done={stage2Done} active={stage1Done && !stage2Done && isActive} />
          <StageDot label="Son Analiz"   score={postScore}  done={stage3Done} active={isClinicDone} optional />
        </div>
        <p className="text-slate-500 text-sm mt-2 text-center">
          {stagesDone}/3 aşama tamamlandı
        </p>
      </div>

      {/* Sıradaki adım CTA */}
      {nextStep && nextStep.href && (
        <div className="px-5 pb-4">
          <Link href={nextStep.href}
            className="block w-full text-center py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-base font-bold transition-colors">
            {nextStep.label} →
          </Link>
        </div>
      )}

      {/* Klinik deneyim değerlendirme CTA */}
      {y.appointment?.status === 'completed' && y.reviewState === 'none' && (
        <div className="px-5 pb-4">
          <SafeLink
            href={`/panel/degerlendir/${y.appointment.id}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 hover:border-amber-400/60 transition-colors"
          >
            <span className="text-xl shrink-0">⭐</span>
            <div className="flex-1 min-w-0">
              <p className="text-amber-200 text-sm font-bold leading-tight">Deneyimini paylaş</p>
              <p className="text-amber-300/70 text-sm mt-0.5">Klinik için 1 dakikalık değerlendirme</p>
            </div>
            <svg className="w-4 h-4 text-amber-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </SafeLink>
        </div>
      )}
      {y.appointment?.status === 'completed' && y.reviewState === 'editable' && (
        <div className="px-5 pb-4">
          <SafeLink
            href={`/panel/degerlendir/${y.appointment.id}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <span className="text-xl shrink-0">✏️</span>
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 text-sm font-medium leading-tight">Yorumunu düzenle</p>
              <p className="text-slate-500 text-sm mt-0.5">7 günlük düzenleme penceresi açık</p>
            </div>
            <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </SafeLink>
        </div>
      )}

      {/* Detay (expanded) */}
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-slate-800/60">
          <DetayBlok title="🎯 Ön Analiz" empty="Henüz yapılmadı" data={y.preAnalysis} kind="pre" />
          <DetayBlok title="🏥 Klinik Onayı" empty="Henüz tamamlanmadı"
            data={y.clinicAnalysis} kind="clinic" appointment={y.appointment} />
          <DetayBlok title="📊 Son Analiz" empty="Henüz yapılmadı (opsiyonel)"
            data={y.postAnalysis} kind="post" />
        </div>
      )}
    </div>
  )
}

function StageDot({ label, score, done, active, optional }: {
  label: string
  score: number | null
  done: boolean
  active?: boolean
  optional?: boolean
}) {
  return (
    <div className={`p-3 rounded-xl text-center ${
      done ? 'bg-emerald-500/10 border border-emerald-500/30'
      : active ? 'bg-violet-500/10 border border-violet-500/30'
      : 'bg-slate-800/40 border border-slate-800'
    }`}>
      <div className={`text-sm font-semibold uppercase tracking-wide mb-1 ${
        done ? 'text-emerald-400' : active ? 'text-violet-400' : 'text-slate-600'
      }`}>
        {label}{optional && !done ? ' (ops.)' : ''}
      </div>
      <div className={`text-lg font-black ${
        done ? 'text-white' : 'text-slate-700'
      }`}>
        {score != null ? Math.round(score) : '—'}
      </div>
    </div>
  )
}

function DetayBlok({ title, empty, data, kind, appointment }: {
  title: string
  empty: string
  data: YolculukAnalysis | null
  kind: 'pre' | 'clinic' | 'post'
  appointment?: YolculukAppointment | null
}) {
  if (!data && !appointment) {
    return (
      <div className="pt-3">
        <h4 className="text-slate-300 font-bold text-sm mb-1.5">{title}</h4>
        <p className="text-slate-600 text-sm italic">{empty}</p>
      </div>
    )
  }

  const ws = data?.web_scores ?? {}
  const das = data?.doctor_approved_scores ?? null
  const ileri = das?.ileri_analiz_c250 ?? null
  const tetkik = das?.tetkik
    ? TETKIK_PARAMS.map(p => ({ ...p, value: das.tetkik![p.key] })).filter(r => r.value != null)
    : []

  return (
    <div className="pt-3">
      <h4 className="text-slate-300 font-bold text-sm mb-2">{title}</h4>

      {/* Klinik blok: randevu detayı */}
      {kind === 'clinic' && appointment && (
        <div className="bg-slate-800/40 rounded-lg p-3 mb-2 text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-slate-400">{appointment.clinic_name ?? 'Klinik'}</span>
            <span className="text-slate-500">
              {appointment.appointment_date
                ? new Date(appointment.appointment_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
                : '—'}
            </span>
          </div>
          {appointment.procedure_notes && (
            <div className="mt-2">
              <div className="text-violet-400 text-sm uppercase tracking-wide mb-0.5">Yapılan İşlem</div>
              <p className="text-slate-300 whitespace-pre-wrap">{appointment.procedure_notes}</p>
            </div>
          )}
          {appointment.recommendations && (
            <div className="mt-2">
              <div className="text-amber-400 text-sm uppercase tracking-wide mb-0.5">Hekim Önerileri</div>
              <p className="text-slate-300 whitespace-pre-wrap">{appointment.recommendations}</p>
            </div>
          )}
        </div>
      )}

      {/* Selfie skorları (web_scores) */}
      {Object.keys(ws).length > 0 && (
        <div className="bg-slate-800/40 rounded-lg p-3 mb-2">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            {C250_LABELS.map(([k, label]) => ws[k] != null && (
              <div key={k} className="flex justify-between">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-300 font-medium">{ws[k]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tetkik */}
      {tetkik.length > 0 && (
        <div className="bg-slate-800/40 rounded-lg p-3 mb-2">
          <div className="text-emerald-400 text-sm uppercase tracking-wide mb-1.5">Tetkik</div>
          <div className="space-y-0.5 text-sm">
            {tetkik.map(r => {
              const inRange = r.value! >= r.min && r.value! <= r.max
              return (
                <div key={r.key} className="flex justify-between">
                  <span className="text-slate-500">{r.label}</span>
                  <span className={inRange ? 'text-emerald-400' : 'text-amber-400'}>
                    {r.value} {r.unit}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* İleri analiz */}
      {ileri && (
        <div className="bg-slate-800/40 rounded-lg p-3 mb-2">
          <div className="text-cyan-400 text-sm uppercase tracking-wide mb-1.5">İleri Analiz (Cihaz)</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            {C250_LABELS.map(([k, label]) => {
              const v = ileri[k as keyof typeof ileri]
              if (v == null) return null
              return (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-cyan-300 font-medium">{v}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Hekim notu */}
      {(das?.hekim_skoru != null || data?.doctor_notes) && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
          <div className="text-amber-400 text-sm uppercase tracking-wide mb-1">Hekim Değerlendirmesi</div>
          {das?.hekim_skoru != null && (
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-black text-amber-400">{das.hekim_skoru}</span>
              <span className="text-slate-500 text-sm">/ 100</span>
            </div>
          )}
          {data?.doctor_notes && (
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{data.doctor_notes}</p>
          )}
        </div>
      )}
    </div>
  )
}
