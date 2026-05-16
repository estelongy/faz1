'use client'

import type { ReactNode } from 'react'
import { useGalaxyTransition, type Galaxy } from './GalaxyTransition'

/* ============================================================
   GalaxyLink — navbar 3'lüsü (BiyoAGE / EsteKlinik / EsteStore)
   için tıklamayı GalaxyTransition ritüeline yönlendirir.

   Server component sayfasında (page.tsx) <Link> yerine bunu kullan.
   Provider zaten src/app/layout.tsx'te bağlı.
   ============================================================ */

const TARGET: Record<Galaxy, string> = {
  biyoage: '/biyoage',
  esteklinik: '/esteklinik',
  estestore: '/estestore',
}

export default function GalaxyLink({
  galaxy,
  className,
  children,
}: {
  galaxy: Galaxy
  className?: string
  children: ReactNode
}) {
  const { transitionTo } = useGalaxyTransition()

  return (
    <button
      type="button"
      onClick={() => transitionTo(galaxy, TARGET[galaxy])}
      className={className}
    >
      {children}
    </button>
  )
}
