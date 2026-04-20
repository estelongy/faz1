'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Production'da Sentry/LogRocket'a gönderilebilir
    console.error('App error:', error)
  }, [error])

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

        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-3xl font-black text-white mb-3">Bir şeyler ters gitti</h1>
        <p className="text-slate-400 mb-4 leading-relaxed">
          Beklenmedik bir hatayla karşılaştık. Tekrar denemeyi deneyebilirsin — sorun devam ederse destek ekibimizle iletişime geç.
        </p>

        {error.digest && (
          <div className="mb-8 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 inline-block">
            <p className="text-[11px] text-slate-500 font-mono">
              Hata kodu: <span className="text-slate-400">{error.digest}</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          <button onClick={reset}
            className="py-3 px-5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/20">
            Tekrar Dene
          </button>
          <Link href="/"
            className="py-3 px-5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-xl transition-all">
            Anasayfa
          </Link>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <Link href="/hakkinda/iletisim"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            Sorun devam ediyor mu? <span className="text-violet-400">Bize yaz →</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
