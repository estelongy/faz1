'use client'

import { useState } from 'react'
import RandevuListClient, { type AppointmentRow } from './RandevuListClient'
import RandevuTakvim from './RandevuTakvim'
import type { AvailabilityWeek } from './slot-utils'

export default function RandevuTabsClient({ rows, week }: { rows: AppointmentRow[]; week: AvailabilityWeek }) {
  const [tab, setTab] = useState<'takvim' | 'liste'>('takvim')

  return (
    <div className="space-y-4">
      <div className="inline-flex bg-slate-900/60 border border-slate-800 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setTab('takvim')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            tab === 'takvim' ? 'bg-violet-600 text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          📅 Takvim
        </button>
        <button
          type="button"
          onClick={() => setTab('liste')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            tab === 'liste' ? 'bg-violet-600 text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          📋 Liste
        </button>
      </div>

      {tab === 'takvim' ? (
        <RandevuTakvim rows={rows} week={week} />
      ) : (
        <RandevuListClient rows={rows} variant="full" />
      )}
    </div>
  )
}
