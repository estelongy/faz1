import Link from 'next/link'

interface Props {
  active: 'yolculuklar' | 'yorumlar'
  yorumCount?: number
  unrespondedReplyCount?: number
}

export default function GecmisTabs({ active, yorumCount, unrespondedReplyCount }: Props) {
  return (
    <nav className="flex items-center gap-2 border-b border-slate-800 mb-2">
      <Tab href="/panel/analizlerim" active={active === 'yolculuklar'} label="Yolculuklar" />
      <Tab
        href="/panel/yorumlarim"
        active={active === 'yorumlar'}
        label="Yorumlarım"
        count={yorumCount}
        badge={unrespondedReplyCount && unrespondedReplyCount > 0 ? unrespondedReplyCount : undefined}
      />
    </nav>
  )
}

function Tab({
  href, active, label, count, badge,
}: { href: string; active: boolean; label: string; count?: number; badge?: number }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
        active
          ? 'border-violet-500 text-white'
          : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
      }`}
    >
      <span>{label}</span>
      {count != null && (
        <span className="text-[10px] text-slate-500 font-normal">({count})</span>
      )}
      {badge != null && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500 text-white font-bold">
          {badge}
        </span>
      )}
    </Link>
  )
}
