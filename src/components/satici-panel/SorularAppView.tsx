import Link from 'next/link'
import SoruKartlari from '@/app/satici/panel/sorular/SoruKartlari'

type Question = Parameters<typeof SoruKartlari>[0]['questions'][number]

interface Props {
  questions: Question[]
  durum?: string
  pendingCount: number
  answeredCount: number
}

export default function SorularAppView({ questions, durum, pendingCount, answeredCount }: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-2">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-400/80">Müşteri Soruları</p>
        <p className="mt-1 text-sm text-slate-400">
          Yanıtın diğer müşterilere de görünür — sosyal kanıt birikir.
        </p>
      </header>

      <div className="sticky top-0 z-10 px-5 py-3 bg-slate-950/95 backdrop-blur border-b border-slate-900">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <Link
            href="/satici/panel/sorular"
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition ${
              !durum ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Tümü ({pendingCount + answeredCount})
          </Link>
          <Link
            href="/satici/panel/sorular?durum=bekleyen"
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition ${
              durum === 'bekleyen' ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-amber-300 border border-slate-800'
            }`}
          >
            ⏳ {pendingCount}
          </Link>
          <Link
            href="/satici/panel/sorular?durum=yanitli"
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition ${
              durum === 'yanitli' ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-emerald-300 border border-slate-800'
            }`}
          >
            ✓ {answeredCount}
          </Link>
        </div>
      </div>

      <section className="px-5 mt-3">
        {questions.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-500 text-sm">
            {durum === 'bekleyen' ? 'Bekleyen soru yok 🎉' : 'Henüz soru gelmedi.'}
          </div>
        ) : (
          <SoruKartlari questions={questions} />
        )}
      </section>
    </div>
  )
}
