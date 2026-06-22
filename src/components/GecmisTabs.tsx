import Link from 'next/link'

interface Props {
  active: 'yolculuklar' | 'yorumlar'
  yorumCount?: number
  unrespondedReplyCount?: number
  light?: boolean
}

export default function GecmisTabs({ active, yorumCount, unrespondedReplyCount, light }: Props) {
  return (
    <nav className={`flex items-center gap-2 border-b mb-2 ${light ? 'border-slate-200' : 'border-slate-800'}`}>
      <Tab href="/panel/analizlerim" active={active === 'yolculuklar'} label="Yolculuklar" light={light} />
      <Tab
        href="/panel/yorumlarim"
        active={active === 'yorumlar'}
        label="Deneyim"
        count={yorumCount}
        badge={unrespondedReplyCount && unrespondedReplyCount > 0 ? unrespondedReplyCount : undefined}
        light={light}
      />
    </nav>
  )
}

function Tab({
  href, active, label, count, badge, light,
}: { href: string; active: boolean; label: string; count?: number; badge?: number; light?: boolean }) {
  const activeCls = light
    ? 'border-violet-600 text-slate-900'
    : 'border-violet-500 text-white'
  const inactiveCls = light
    ? 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
  return (
    <Link
      href={href}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
        active ? activeCls : inactiveCls
      }`}
    >
      <span>{label}</span>
      {count != null && (
        <span className="text-sm text-slate-500 font-normal">({count})</span>
      )}
      {badge != null && (
        <span className="text-sm px-1.5 py-0.5 rounded-full bg-violet-500 text-white font-bold">
          {badge}
        </span>
      )}
    </Link>
  )
}
