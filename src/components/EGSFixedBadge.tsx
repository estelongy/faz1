'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ScoreData {
  score: number
  approved: boolean
}

export default function EGSFixedBadge() {
  const [data, setData] = useState<ScoreData | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function fetchLatest() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: analysis } = await supabase
        .from('analyses')
        .select('web_overall, temp_overall, final_overall')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!analysis) return

      const score = analysis.final_overall ?? analysis.temp_overall ?? analysis.web_overall
      if (score == null) return

      setData({ score, approved: analysis.final_overall != null })
    }

    fetchLatest()
  }, [])

  if (!data) return null

  const { score, approved } = data
  const isPremium = score >= 90
  const isGenc    = score >= 75
  const isNormal  = score >= 50

  const ring    = isPremium ? 'border-blue-500/40 bg-blue-500/10 shadow-blue-500/20'
    : isGenc    ? 'border-emerald-500/40 bg-emerald-500/10 shadow-emerald-500/20'
    : isNormal  ? 'border-amber-500/40 bg-amber-500/10 shadow-amber-500/20'
                : 'border-red-500/40 bg-red-500/10 shadow-red-500/20'

  const dot     = isPremium ? 'bg-blue-400' : isGenc ? 'bg-emerald-400' : isNormal ? 'bg-amber-400' : 'bg-red-400'
  const num     = isPremium ? 'text-blue-300' : isGenc ? 'text-emerald-300' : isNormal ? 'text-amber-300' : 'text-red-300'
  const badge   = isPremium ? 'bg-blue-500/20 text-blue-300' : isGenc ? 'bg-emerald-500/20 text-emerald-300' : isNormal ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
  const label   = isPremium ? 'Premium' : isGenc ? 'Genç' : isNormal ? 'Normal' : 'Kritik'

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-md shadow-2xl ${ring}`}>
        <div className={`w-2 h-2 rounded-full animate-pulse ${dot}`} />
        <span className="text-slate-300 text-sm font-medium">EGS</span>
        <span className={`text-2xl font-black ${num}`}>{score}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>{label}</span>
        {approved && <span className="text-emerald-400 text-xs font-medium">✦ Onaylı</span>}
      </div>
    </div>
  )
}
