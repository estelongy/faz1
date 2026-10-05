import Link from 'next/link'

/** Referansın üç sayfası arasında geçiş. Test aşamasında üçü de panel altında. */
const SAYFALAR = [
  { k: 'isletme',    yol: '/klinik/panel/muhasebe/referans',           etiket: '🏢 İşletme' },
  { k: 'referansor', yol: '/klinik/panel/muhasebe/referans/referansor', etiket: '🤝 Referansör' },
  { k: 'para',       yol: '/klinik/panel/muhasebe/referans/para',       etiket: '₺ Para' },
] as const

export default function ReferansSayfaNav({ aktif }: { aktif: 'isletme' | 'referansor' | 'para' }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {SAYFALAR.map(s => (
        <Link key={s.k} href={s.yol}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            aktif === s.k
              ? 'bg-violet-500/25 text-violet-200'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}>
          {s.etiket}
        </Link>
      ))}
    </div>
  )
}
