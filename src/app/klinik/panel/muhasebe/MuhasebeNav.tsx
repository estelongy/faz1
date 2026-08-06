import Link from 'next/link'

// Muhasebe modülü üst başlığı. Alt sayfalarda tek buton: Ana Sayfa (muhasebe).
export default function MuhasebeNav({ title, showHome = true }: { title: string; showHome?: boolean }) {
  return (
    <div className="mb-4">
      {showHome && (
        <Link href="/klinik/panel/muhasebe"
          className="inline-flex items-center gap-1.5 px-3 py-2 mb-2 rounded-lg text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors">
          🏠 Ana Sayfa
        </Link>
      )}
      <h1 className="text-2xl font-black text-white">{title}</h1>
    </div>
  )
}
