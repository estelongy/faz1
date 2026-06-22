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
  preAnalysis: YolculukAnalysis | null
  appointment: YolculukAppointment | null
  clinicAnalysis: YolculukAnalysis | null
  postAnalysis: YolculukAnalysis | null
  index: number
  total: number
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

// Tema haritaları — dark (klinik panel) ve light (hasta panel) için.
interface Theme {
  cardActive: string
  cardCompleted: string
  cardDefault: string
  surfaceHover: string
  innerBox: string
  innerBoxBorder: string
  titleText: string
  mutedText: string
  bodyText: string
  fadedText: string
  divider: string
  iconBoxDefault: string
  stageDoneBg: string
  stageActiveBg: string
  stageIdleBg: string
  stageIdleText: string
  stageScoreDoneText: string
  stageScoreIdleText: string
}

const DARK: Theme = {
  cardActive: 'border-violet-500/40 bg-gradient-to-br from-violet-950/30 to-slate-900',
  cardCompleted: 'border-emerald-700/40 bg-slate-900',
  cardDefault: 'border-slate-800 bg-slate-900',
  surfaceHover: 'hover:bg-white/[0.02]',
  innerBox: 'bg-slate-800/40',
  innerBoxBorder: 'border-slate-800/60',
  titleText: 'text-white',
  mutedText: 'text-slate-500',
  bodyText: 'text-slate-300',
  fadedText: 'text-slate-600',
  divider: 'border-slate-800/60',
  iconBoxDefault: 'bg-slate-700/30 text-slate-500',
  stageDoneBg: 'bg-emerald-500/10 border-emerald-500/30',
  stageActiveBg: 'bg-violet-500/10 border-violet-500/30',
  stageIdleBg: 'bg-slate-800/40 border-slate-800',
  stageIdleText: 'text-slate-600',
  stageScoreDoneText: 'text-white',
  stageScoreIdleText: 'text-slate-700',
}

const LIGHT: Theme = {
  cardActive: 'border-violet-200 bg-gradient-to-br from-violet-50 to-white',
  cardCompleted: 'border-emerald-200 bg-white',
  cardDefault: 'border-slate-200 bg-white',
  surfaceHover: 'hover:bg-slate-50',
  innerBox: 'bg-slate-50',
  innerBoxBorder: 'border-slate-200',
  titleText: 'text-slate-900',
  mutedText: 'text-slate-500',
  bodyText: 'text-slate-700',
  fadedText: 'text-slate-400',
  divider: 'border-slate-200',
  iconBoxDefault: 'bg-slate-100 text-slate-500',
  stageDoneBg: 'bg-emerald-50 border-emerald-200',
  stageActiveBg: 'bg-violet-50 border-violet-200',
  stageIdleBg: 'bg-slate-50 border-slate-200',
  stageIdleText: 'text-slate-400',
  stageScoreDoneText: 'text-slate-900',
  stageScoreIdleText: 'text-slate-300',
}

export default function YolculukKarti({ y, light }: { y: YolculukView; light?: boolean }) {
  const t = light ? LIGHT : DARK
  const [open, setOpen] = useState(false)

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

  const startScore = preScore
  const lastScore  = postScore ?? finalScore ?? preScore
  const totalDelta = startScore != null && lastScore != null && lastScore !== startScore
    ? Math.round((lastScore - startScore) * 10) / 10
    : null

  const accent = isActive
    ? t.cardActive
    : isCompleted
      ? t.cardCompleted
      : t.cardDefault

  const statusBadge = (() => {
    if (y.status === 'completed') return { label: '✓ Tamamlandı', cls: light ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
    if (y.status === 'clinic_done') return { label: 'Son analiz bekleniyor', cls: light ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
    if (y.status === 'active') return { label: 'Devam ediyor', cls: light ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-violet-500/15 text-violet-400 border-violet-500/30' }
    return { label: 'İptal', cls: light ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-700/40 text-slate-500 border-slate-700' }
  })()

  const nextStep = (() => {
    if (isCompleted || y.status === 'abandoned') return null
    if (!stage1Done) return { label: 'Ön analiz yap', href: '/analiz' }
    if (!y.appointment) return { label: 'Klinikten randevu al', href: '/esteklinik' }
    if (!stage2Done) return { label: 'Klinik onayı bekleniyor', href: null }
    if (isClinicDone && !stage3Done) return { label: 'Son selfie ile sonucu gör', href: '/analiz' }
    return null
  })()

  const iconBoxCls = isCompleted
    ? (light ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/15 text-emerald-400')
    : isActive
      ? (light ? 'bg-violet-50 text-violet-600' : 'bg-violet-500/15 text-violet-400')
      : t.iconBoxDefault

  const deltaPosCls = light ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-500/15 text-emerald-400'
  const deltaNegCls = light ? 'bg-red-50 text-red-700' : 'bg-red-500/15 text-red-400'

  return (
    <div className={`rounded-2xl border ${accent} overflow-hidden transition-all`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full px-5 py-4 flex items-center justify-between gap-3 text-left ${t.surfaceHover} transition-colors`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBoxCls}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d={isCompleted
                  ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  : "M13 10V3L4 14h7v7l9-11h-7z"
                } />
            </svg>
          </div>
          <div className="min-w-0">
            <div className={`${t.titleText} font-bold text-sm`}>
              {isCompleted ? `Yolculuk #${y.index}` : 'Aktif Yolculuğun'}
            </div>
            <div className={`${t.mutedText} text-sm`}>
              {formatDate(y.startedAt)}
              {y.completedAt && ` — ${formatDate(y.completedAt)}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {totalDelta != null && (
            <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
              totalDelta > 0 ? deltaPosCls : deltaNegCls
            }`}>
              {totalDelta > 0 ? '↑+' : '↓'}{Math.abs(totalDelta).toFixed(1)}
            </span>
          )}
          <span className={`text-sm font-semibold px-2 py-0.5 rounded-full border ${statusBadge.cls}`}>
            {statusBadge.label}
          </span>
          <svg className={`w-4 h-4 ${t.mutedText} transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <div className="px-5 pb-4">
        <div className="grid grid-cols-3 gap-2">
          <StageDot t={t} label="Ön Analiz"    score={preScore}   done={stage1Done} active={!stage1Done && isActive} />
          <StageDot t={t} label="Klinik Onayı" score={finalScore} done={stage2Done} active={stage1Done && !stage2Done && isActive} />
          <StageDot t={t} label="Son Analiz"   score={postScore}  done={stage3Done} active={isClinicDone} optional />
        </div>
        <p className={`${t.mutedText} text-sm mt-2 text-center`}>
          {stagesDone}/3 aşama tamamlandı
        </p>
      </div>

      {nextStep && nextStep.href && (
        <div className="px-5 pb-4">
          <Link href={nextStep.href}
            className={`block w-full text-center py-2.5 rounded-xl border font-bold text-base transition-colors ${
              light
                ? 'bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-700'
                : 'bg-violet-600/20 hover:bg-violet-600/30 border-violet-500/30 text-violet-300'
            }`}>
            {nextStep.label} →
          </Link>
        </div>
      )}

      {y.appointment?.status === 'completed' && y.reviewState === 'none' && (
        <div className="px-5 pb-4">
          <SafeLink
            href={`/panel/degerlendir/${y.appointment.id}`}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
              light
                ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 hover:border-amber-400/60'
            }`}
          >
            <span className="text-xl shrink-0">⭐</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold leading-tight ${light ? 'text-amber-800' : 'text-amber-200'}`}>Deneyimini paylaş</p>
              <p className={`text-sm mt-0.5 ${light ? 'text-amber-700' : 'text-amber-300/70'}`}>Klinik için 1 dakikalık değerlendirme</p>
            </div>
            <svg className={`w-4 h-4 shrink-0 ${light ? 'text-amber-700' : 'text-amber-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </SafeLink>
        </div>
      )}
      {y.appointment?.status === 'completed' && y.reviewState === 'editable' && (
        <div className="px-5 pb-4">
          <SafeLink
            href={`/panel/degerlendir/${y.appointment.id}`}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
              light ? 'bg-slate-50 border-slate-200 hover:border-slate-300' : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
            }`}
          >
            <span className="text-xl shrink-0">✏️</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-tight ${light ? 'text-slate-700' : 'text-slate-200'}`}>Yorumunu düzenle</p>
              <p className={`text-sm mt-0.5 ${t.mutedText}`}>7 günlük düzenleme penceresi açık</p>
            </div>
            <svg className={`w-4 h-4 shrink-0 ${t.mutedText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </SafeLink>
        </div>
      )}

      {open && (
        <div className={`px-5 pb-5 space-y-3 border-t ${t.divider}`}>
          <DetayBlok t={t} title="🎯 Ön Analiz" empty="Henüz yapılmadı" data={y.preAnalysis} kind="pre" />
          <DetayBlok t={t} title="🏥 Klinik Onayı" empty="Henüz tamamlanmadı"
            data={y.clinicAnalysis} kind="clinic" appointment={y.appointment} />
          <DetayBlok t={t} title="📊 Son Analiz" empty="Henüz yapılmadı (opsiyonel)"
            data={y.postAnalysis} kind="post" />
        </div>
      )}
    </div>
  )
}

function StageDot({ t, label, score, done, active, optional }: {
  t: Theme
  label: string
  score: number | null
  done: boolean
  active?: boolean
  optional?: boolean
}) {
  return (
    <div className={`p-3 rounded-xl text-center border ${
      done ? t.stageDoneBg : active ? t.stageActiveBg : t.stageIdleBg
    }`}>
      <div className={`text-sm font-semibold uppercase tracking-wide mb-1 ${
        done ? 'text-emerald-600' : active ? 'text-violet-600' : t.stageIdleText
      }`}>
        {label}{optional && !done ? ' (ops.)' : ''}
      </div>
      <div className={`text-lg font-black ${
        done ? t.stageScoreDoneText : t.stageScoreIdleText
      }`}>
        {score != null ? Math.round(score) : '—'}
      </div>
    </div>
  )
}

function DetayBlok({ t, title, empty, data, kind, appointment }: {
  t: Theme
  title: string
  empty: string
  data: YolculukAnalysis | null
  kind: 'pre' | 'clinic' | 'post'
  appointment?: YolculukAppointment | null
}) {
  if (!data && !appointment) {
    return (
      <div className="pt-3">
        <h4 className={`${t.bodyText} font-bold text-sm mb-1.5`}>{title}</h4>
        <p className={`${t.fadedText} text-sm italic`}>{empty}</p>
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
      <h4 className={`${t.bodyText} font-bold text-sm mb-2`}>{title}</h4>

      {kind === 'clinic' && appointment && (
        <div className={`${t.innerBox} rounded-lg p-3 mb-2 text-sm`}>
          <div className="flex justify-between mb-1">
            <span className={t.bodyText}>{appointment.clinic_name ?? 'Klinik'}</span>
            <span className={t.mutedText}>
              {appointment.appointment_date
                ? new Date(appointment.appointment_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
                : '—'}
            </span>
          </div>
          {appointment.procedure_notes && (
            <div className="mt-2">
              <div className="text-violet-600 text-sm uppercase tracking-wide mb-0.5">Yapılan İşlem</div>
              <p className={`${t.bodyText} whitespace-pre-wrap`}>{appointment.procedure_notes}</p>
            </div>
          )}
          {appointment.recommendations && (
            <div className="mt-2">
              <div className="text-amber-600 text-sm uppercase tracking-wide mb-0.5">Hekim Önerileri</div>
              <p className={`${t.bodyText} whitespace-pre-wrap`}>{appointment.recommendations}</p>
            </div>
          )}
        </div>
      )}

      {Object.keys(ws).length > 0 && (
        <div className={`${t.innerBox} rounded-lg p-3 mb-2`}>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            {C250_LABELS.map(([k, label]) => ws[k] != null && (
              <div key={k} className="flex justify-between">
                <span className={t.mutedText}>{label}</span>
                <span className={`${t.bodyText} font-medium`}>{ws[k]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tetkik.length > 0 && (
        <div className={`${t.innerBox} rounded-lg p-3 mb-2`}>
          <div className="text-emerald-600 text-sm uppercase tracking-wide mb-1.5">Tetkik</div>
          <div className="space-y-0.5 text-sm">
            {tetkik.map(r => {
              const inRange = r.value! >= r.min && r.value! <= r.max
              return (
                <div key={r.key} className="flex justify-between">
                  <span className={t.mutedText}>{r.label}</span>
                  <span className={inRange ? 'text-emerald-600' : 'text-amber-600'}>
                    {r.value} {r.unit}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {ileri && (
        <div className={`${t.innerBox} rounded-lg p-3 mb-2`}>
          <div className="text-cyan-600 text-sm uppercase tracking-wide mb-1.5">İleri Analiz (Cihaz)</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            {C250_LABELS.map(([k, label]) => {
              const v = ileri[k as keyof typeof ileri]
              if (v == null) return null
              return (
                <div key={k} className="flex justify-between">
                  <span className={t.mutedText}>{label}</span>
                  <span className="text-cyan-700 font-medium">{v}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {(das?.hekim_skoru != null || data?.doctor_notes) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="text-amber-700 text-sm uppercase tracking-wide mb-1">Hekim Değerlendirmesi</div>
          {das?.hekim_skoru != null && (
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-black text-amber-700">{das.hekim_skoru}</span>
              <span className={`${t.mutedText} text-sm`}>/ 100</span>
            </div>
          )}
          {data?.doctor_notes && (
            <p className={`${t.bodyText} text-sm whitespace-pre-wrap`}>{data.doctor_notes}</p>
          )}
        </div>
      )}
    </div>
  )
}
