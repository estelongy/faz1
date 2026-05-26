/**
 * Son 12 ay satış grafiği — bar chart SVG, bağımlılık yok.
 * Server component (kullanım kolaylığı için 'use client' YOK).
 */

import type { MonthlyBucket } from '@/lib/vendor-stats'

interface Props {
  data: MonthlyBucket[]
  /** 'gross' (varsayılan) veya 'net' veya 'count' */
  metric?: 'gross' | 'net' | 'count'
  height?: number
}

const TR_MONTH_SHORT = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']

function labelOf(ym: string): string {
  const [, m] = ym.split('-')
  return TR_MONTH_SHORT[parseInt(m, 10) - 1] ?? ym
}

export default function VendorSalesChart({ data, metric = 'gross', height = 160 }: Props) {
  const values = data.map(d => d[metric] as number)
  const max = Math.max(...values, 1) // sıfır bölünmesin

  const barW = 24
  const gap = 10
  const totalW = data.length * (barW + gap) - gap
  const paddingY = 24

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${totalW} ${height + paddingY * 2}`}
        width="100%"
        height={height + paddingY * 2}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Son 12 ay satış grafiği"
      >
        {data.map((d, i) => {
          const v = d[metric] as number
          const h = max > 0 ? (v / max) * height : 0
          const x = i * (barW + gap)
          const y = paddingY + (height - h)
          const isThisMonth = i === data.length - 1
          return (
            <g key={d.ym}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={4}
                ry={4}
                fill={isThisMonth ? '#C9A961' : v > 0 ? '#10876B' : '#334155'}
                opacity={v > 0 ? 1 : 0.4}
              />
              {/* Değer */}
              {v > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 6}
                  fill="#cbd5e1"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="system-ui, sans-serif"
                >
                  {metric === 'count'
                    ? v
                    : v >= 1000
                      ? `₺${Math.round(v / 1000)}k`
                      : `₺${Math.round(v)}`}
                </text>
              )}
              {/* Ay etiketi */}
              <text
                x={x + barW / 2}
                y={paddingY + height + 14}
                fill="#64748b"
                fontSize="10"
                textAnchor="middle"
                fontFamily="system-ui, sans-serif"
              >
                {labelOf(d.ym)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
