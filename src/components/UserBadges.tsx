'use client'

import { BADGE_META, type BadgeKey } from '@/lib/badges'

interface Props {
  badgeKeys: BadgeKey[]
  streak?: { current: number; longest: number }
}

export default function UserBadges({ badgeKeys, streak }: Props) {
  if (badgeKeys.length === 0 && !streak?.current) return null

  return (
    <div>
      {/* Streak */}
      {streak && streak.current > 0 && (
        <div className="mb-4 flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-white font-bold">
              {streak.current} günlük seri!
            </p>
            <p className="text-amber-400/70 text-xs">
              En uzun: {streak.longest} gün
            </p>
          </div>
        </div>
      )}

      {/* Rozetler */}
      {badgeKeys.length > 0 && (
        <>
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <span>🏆</span> Rozetlerin
            <span className="text-slate-600 font-normal">({badgeKeys.length})</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {badgeKeys.map(key => {
              const meta = BADGE_META[key]
              if (!meta) return null
              return (
                <div
                  key={key}
                  title={meta.desc}
                  className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl border bg-gradient-to-br ${meta.color} cursor-default`}
                >
                  <span className="text-lg">{meta.emoji}</span>
                  <span className="text-white text-xs font-bold">{meta.label}</span>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 whitespace-nowrap shadow-xl">
                      {meta.desc}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Kilitli rozetler (henüz kazanılmamış, teşvik için) */}
      {badgeKeys.length > 0 && badgeKeys.length < Object.keys(BADGE_META).length && (
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(BADGE_META) as BadgeKey[])
            .filter(k => !badgeKeys.includes(k))
            .slice(0, 3)
            .map(key => {
              const meta = BADGE_META[key]
              return (
                <div
                  key={key}
                  title={`Kilidi kaldır: ${meta.desc}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700/50 bg-slate-800/30 opacity-40 cursor-default"
                >
                  <span className="text-lg grayscale">{meta.emoji}</span>
                  <span className="text-slate-600 text-xs font-medium">{meta.label}</span>
                </div>
              )
            })}
          {badgeKeys.length < Object.keys(BADGE_META).length - 3 && (
            <span className="text-slate-600 text-xs self-center">
              +{Object.keys(BADGE_META).length - badgeKeys.length - 3} daha...
            </span>
          )}
        </div>
      )}
    </div>
  )
}
