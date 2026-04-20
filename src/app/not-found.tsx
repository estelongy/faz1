import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sayfa Bulunamadı',
}

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-10 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Estelongy</span>
        </Link>

        <div className="relative mb-6">
          <div className="text-[160px] font-black leading-none bg-gradient-to-b from-slate-700 to-slate-900 bg-clip-text text-transparent select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-2xl bg-slate-900/80 border border-slate-700 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-black text-white mb-3">Bu sayfa bulunamadı</h1>
        <p className="text-slate-400 mb-10 leading-relaxed">
          Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
          Gençlik Skorunuza dönmenin yolu aşağıda.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          <Link href="/"
            className="py-3 px-5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/20">
            Anasayfa
          </Link>
          <Link href="/panel"
            className="py-3 px-5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-xl transition-all">
            Panelim
          </Link>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-600">
          <Link href="/analiz" className="hover:text-slate-400 transition-colors">Ön Analiz</Link>
          <span className="text-slate-800">·</span>
          <Link href="/randevu" className="hover:text-slate-400 transition-colors">Klinik Randevu</Link>
          <span className="text-slate-800">·</span>
          <Link href="/magaza" className="hover:text-slate-400 transition-colors">Mağaza</Link>
          <span className="text-slate-800">·</span>
          <Link href="/hakkinda/iletisim" className="hover:text-slate-400 transition-colors">İletişim</Link>
        </div>
      </div>
    </main>
  )
}
