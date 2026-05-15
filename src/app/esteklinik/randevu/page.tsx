'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import RandevuFlow from '@/components/RandevuFlow'
import EsteKlinikNav from '../EsteKlinikNav'
import Footer from '@/components/Footer'

function RandevuInner() {
  const searchParams = useSearchParams()
  return (
    <RandevuFlow
      embedded
      preselectedClinicId={searchParams.get('k')}
      preselectedTip={searchParams.get('tip')}
      preselectedDate={searchParams.get('d')}
      preselectedTime={searchParams.get('t')}
    />
  )
}

export default function RandevuPage() {
  return (
    <>
      <EsteKlinikNav />
      <main className="min-h-screen bg-gradient-to-b from-[#064E3B] via-[#0A6347] to-[#053527]">
        {/* Hero şerit */}
        <section className="border-b border-emerald-300/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-6">
            <nav className="flex items-center gap-2 text-xs text-emerald-200/70 mb-3">
              <Link href="/esteklinik" className="hover:text-white transition-colors">EsteKlinik</Link>
              <span>·</span>
              <span className="text-white font-semibold">Randevu</span>
            </nav>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300 mb-1">
              EsteKlinik Randevu Akışı
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Randevu Oluştur</h1>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Suspense fallback={
            <div className="py-16 text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
              <p className="text-emerald-100/70 text-sm">Yükleniyor…</p>
            </div>
          }>
            <RandevuInner />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  )
}
