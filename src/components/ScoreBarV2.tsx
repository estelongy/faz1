'use client'

import { useEffect, useState, useRef } from 'react'

export type ScorePhase =
  | 'ai_analiz' | 'longevity_anketi' | 'randevu' | 'klinik_kabul'
  | 'klinik_anketi' | 'ileri_ai' | 'tetkik' | 'hekim_degerlendirme' | 'klinik_onayli'

interface Props {
  score: number
  previousScore?: number
  phase?: ScorePhase
  age?: number
  isClinicView?: boolean
  animated?: boolean
}

// ── Gauge sabitler ──────────────────────────────────────────────
const CX = 150, CY = 148
const R  = 108
const SW = 18
const CIRC = 2 * Math.PI * R

const ARC_DEG  = 240
const ARC_LEN  = (ARC_DEG / 360) * CIRC
const GAP_LEN  = CIRC - ARC_LEN
const ROT = 135
const START_MATH = 225

// ── Non-lineer mapping: 80 puan tepe noktasında (12 hizası) ────
// Frac sınırları: 80 → 0.5625 (240° arkın yarısı + offset = 12 hizası)
// Sol yarı (0→80) = arc'ın %56.25'i: kırmızı %35, mor %25, sarı %40
// Sağ yarı (80→100) = arc'ın %43.75'i: yeşil %70, cyan %30
const SCORE_BOUNDS = [0,      56,        66,        80,      90,        100]
const FRAC_BOUNDS  = [0, 0.19688, 0.33750, 0.5625, 0.86875, 1.0]

function scoreToFrac(s: number) {
  s = Math.min(Math.max(s, 0), 100)
  for (let i = 1; i < SCORE_BOUNDS.length; i++) {
    if (s <= SCORE_BOUNDS[i]) {
      const t = (s - SCORE_BOUNDS[i-1]) / (SCORE_BOUNDS[i] - SCORE_BOUNDS[i-1])
      return FRAC_BOUNDS[i-1] + t * (FRAC_BOUNDS[i] - FRAC_BOUNDS[i-1])
    }
  }
  return 1
}

function scoreToMathAngle(score: number) {
  return START_MATH - scoreToFrac(score) * ARC_DEG
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) }
}

// ── Renk bölgeleri (yeni oranlar) ──────────────────────────────
const ZONE_DEFS = [
  { pct: 0.19688, color: '#ef4444', name: 'Çok Düşük', range: '0–55'   },
  { pct: 0.14063, color: '#a855f7', name: 'Düşük',     range: '56–65'  },
  { pct: 0.22500, color: '#eab308', name: 'Normal',    range: '66–79'  },
  { pct: 0.30625, color: '#22c55e', name: 'İyi',       range: '80–89'  },
  { pct: 0.13125, color: '#3b82f6', name: 'Çok İyi',   range: '90–100' },
]

let cumLen = 0
const ZONES = ZONE_DEFS.map(z => {
  const len   = z.pct * ARC_LEN
  const start = cumLen
  cumLen += len
  return {
    ...z,
    len,
    dasharray:  `${len} ${CIRC - len}`,
    dashoffset: CIRC - start,
  }
})

function getZone(score: number) {
  if (score >= 90) return ZONES[4]
  if (score >= 80) return ZONES[3]
  if (score >= 66) return ZONES[2]
  if (score >= 56) return ZONES[1]
  return ZONES[0]
}

const MAJOR_TICKS = [56, 66, 80, 90]
const MINOR_TICKS = [20, 40, 70, 95]

export default function ScoreBarV2({
  score, previousScore, phase = 'ai_analiz', age, isClinicView = false, animated = true,
}: Props) {
  const [disp, setDisp] = useState(animated ? 0 : score)
  const [ang,  setAng]  = useState(animated ? START_MATH : scoreToMathAngle(score))
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (!animated) { setDisp(score); setAng(scoreToMathAngle(score)); return }

    const dur = 1400, t0 = performance.now()
    const tick = (now: number) => {
      const prog = Math.min((now - t0) / dur, 1)
      const ease = 1 - Math.pow(1 - prog, 3)
      const s    = Math.round(ease * score)
      setDisp(s); setAng(scoreToMathAngle(s))
      if (prog < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [score, animated])

  const zone = getZone(disp)

  const tip  = polar(CX, CY, R - 12, ang)
  const lPt  = polar(CX, CY, 8,  ang + 90)
  const rPt  = polar(CX, CY, 8,  ang - 90)
  const tail = polar(CX, CY, 15, ang + 180)

  const glowFrac = scoreToFrac(disp)
  const glowLen  = glowFrac * ARC_LEN

  return (
    <div className="w-full select-none">
      <div className="text-center mb-1">
        <p className="text-[11px] font-black tracking-[0.3em] uppercase" style={{ color: zone.color }}>
          ESTELONGY
        </p>
        <p className="text-[9px] font-semibold tracking-[0.18em] uppercase mt-0.5 text-amber-400">
          ÖN ANALİZ — TAHMİNİ
        </p>
      </div>

      <div className="relative flex justify-center">
        <svg viewBox="0 0 300 250" className="w-full max-w-xs">
          <defs>
            <linearGradient id="ngv2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#475569" />
              <stop offset="60%"  stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>

          <circle cx={CX} cy={CY} r={R} fill="none"
            stroke="#1e293b" strokeWidth={SW + 8}
            strokeDasharray={`${ARC_LEN} ${GAP_LEN}`}
            strokeDashoffset={CIRC}
            strokeLinecap="butt"
            transform={`rotate(${ROT},${CX},${CY})`} />

          {ZONES.map((z, i) => (
            <circle key={i} cx={CX} cy={CY} r={R} fill="none"
              stroke={z.color} strokeWidth={SW}
              strokeDasharray={z.dasharray}
              strokeDashoffset={z.dashoffset}
              strokeLinecap="butt"
              transform={`rotate(${ROT},${CX},${CY})`}
              opacity={0.88} />
          ))}

          <circle cx={CX} cy={CY} r={R} fill="none"
            stroke="#ef4444" strokeWidth={SW}
            strokeDasharray={`1 ${CIRC - 1}`}
            strokeDashoffset={CIRC}
            strokeLinecap="round"
            transform={`rotate(${ROT},${CX},${CY})`} />

          <circle cx={CX} cy={CY} r={R} fill="none"
            stroke="#3b82f6" strokeWidth={SW}
            strokeDasharray={`1 ${CIRC - 1}`}
            strokeDashoffset={CIRC - ARC_LEN + 0.5}
            strokeLinecap="round"
            transform={`rotate(${ROT},${CX},${CY})`} />

          {disp > 0 && (
            <circle cx={CX} cy={CY} r={R} fill="none"
              stroke={zone.color} strokeWidth={2}
              strokeDasharray={`${glowLen} ${CIRC - glowLen}`}
              strokeDashoffset={CIRC}
              strokeLinecap="butt"
              transform={`rotate(${ROT},${CX},${CY})`}
              opacity={0.55} />
          )}

          {MAJOR_TICKS.map(ts => {
            const a   = scoreToMathAngle(ts)
            const inn = polar(CX, CY, R - SW / 2 - 12, a)
            const out = polar(CX, CY, R + SW / 2 + 5,  a)
            const lbl = polar(CX, CY, R + SW / 2 + 18, a)
            return (
              <g key={ts}>
                <line x1={inn.x} y1={inn.y} x2={out.x} y2={out.y}
                  stroke="#fff" strokeWidth={2.5} strokeLinecap="round" opacity={0.65} />
                <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="middle"
                  fill="#94a3b8" fontSize="10" fontWeight="700">{ts}</text>
              </g>
            )
          })}

          {MINOR_TICKS.map(ts => {
            const a   = scoreToMathAngle(ts)
            const inn = polar(CX, CY, R - SW / 2 - 4, a)
            const out = polar(CX, CY, R - SW / 2,     a)
            return (
              <line key={ts} x1={inn.x} y1={inn.y} x2={out.x} y2={out.y}
                stroke="#334155" strokeWidth={1.5} strokeLinecap="round" />
            )
          })}

          <polygon
            points={`${tip.x},${tip.y} ${lPt.x},${lPt.y} ${tail.x},${tail.y} ${rPt.x},${rPt.y}`}
            fill="#000" opacity={0.3} transform="translate(2,3)" />

          <polygon
            points={`${tip.x},${tip.y} ${lPt.x},${lPt.y} ${tail.x},${tail.y} ${rPt.x},${rPt.y}`}
            fill="url(#ngv2)" />

          <circle cx={CX} cy={CY} r={16} fill="#0f172a" stroke="#334155" strokeWidth={2} />
          <circle cx={CX} cy={CY} r={9}  fill={zone.color} opacity={0.85} />
          <circle cx={CX} cy={CY} r={4}  fill="#fff" opacity={0.5} />

          <text x={CX} y={CY + 65} textAnchor="middle"
            dominantBaseline="alphabetic" fontFamily="system-ui">
            <tspan fill={zone.color} fontSize="46" fontWeight="900">{disp}</tspan>
            <tspan fill="#64748b" fontSize="15" fontWeight="500">/100</tspan>
          </text>
          <text x={CX} y={CY + 82} textAnchor="middle" dominantBaseline="alphabetic"
            fill={zone.color} fontSize="11" fontWeight="700" letterSpacing="1" opacity={0.85}>
            {zone.name}
          </text>
        </svg>
      </div>

      {/* Suppress unused-prop warnings */}
      <span className="hidden">{previousScore}{phase}{age}{String(isClinicView)}</span>
    </div>
  )
}
