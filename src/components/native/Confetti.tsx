'use client'

import { useMemo } from 'react'

const COLORS = ['#9F8CE0', '#7BE495', '#C9BBF5', '#FFFFFF', '#6553A8']

/**
 * Bağımsız (dependency'siz) konfeti patlaması — skor halkası dolduğunda
 * bir kez tetiklenir. Mount edildiği an patlar, ~1.6s sonra solar.
 * Merkeze hizalı parçalar dışa doğru savrulur (globals.css: confettiBurst).
 */
export default function Confetti({ count = 40 }: { count?: number }) {
  const pieces = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2
      const dist = 90 + Math.random() * 130
      const tx = Math.cos(angle) * dist
      const ty = Math.sin(angle) * dist - 30 // hafif yukarı yanlılık
      const r = Math.random() * 720 - 360
      const size = 6 + Math.random() * 7
      const style: Record<string, string | number> = {
        width: `${size}px`,
        height: `${size * 0.62}px`,
        background: COLORS[i % COLORS.length],
        animationDelay: `${Math.random() * 0.12}s`,
        '--tx': `${tx}px`,
        '--ty': `${ty}px`,
        '--r': `${r}deg`,
      }
      return { id: i, style }
    })
  }, [count])

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible"
    >
      {pieces.map(p => (
        <span
          key={p.id}
          className="confetti-piece absolute rounded-[2px]"
          style={p.style as React.CSSProperties}
        />
      ))}
    </div>
  )
}
