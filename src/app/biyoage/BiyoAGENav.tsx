'use client'

import Link from 'next/link'
import BrandMorphButton from '@/app/estestore/BrandMorphButton'
import { User, ShieldCheck, LayoutDashboard } from 'lucide-react'
import { useAuthStatus } from '@/components/AuthStatusProvider'

/**
 * BiyoAGE top nav — EsteKlinik/EsteStore aynası, mor (analiz/ölçüm) galaksi.
 * Niyet: kullanıcı buranın ayrı bir dünya olduğunu hissetsin.
 */
export default function BiyoAGENav() {
  const { isLoggedIn } = useAuthStatus()
  return (
    <header className="sticky top-0 z-50 bg-[#1B1330] border-b border-[#3D2C66]/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* SOL: Aksiyon — login'e göre Panel ya da Giriş/Kayıt */}
        <nav className="flex items-center gap-1 sm:gap-2 order-1">
          <Link
            href="/rehber"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-violet-100 hover:bg-white/10 transition-colors"
          >
            <ShieldCheck size={13} />
            Rehber
          </Link>
          {isLoggedIn ? (
            <Link
              href="/panel"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-white text-[#1B1330] hover:bg-violet-50 transition-colors"
            >
              <LayoutDashboard size={13} />
              Panel
            </Link>
          ) : (
            <>
              <Link
                href="/giris?g=biyoage"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-violet-100 hover:bg-white/10 transition-colors"
              >
                <User size={13} />
                Giriş
              </Link>
              <Link
                href="/kayit?g=biyoage"
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-white text-[#1B1330] hover:bg-violet-50 transition-colors"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </nav>

        {/* MERKEZ: BrandMorphButton */}
        <div className="hidden md:flex order-2 flex-1 justify-center">
          <BrandMorphButton />
        </div>

        {/* SAĞ: BiyoAGE başrol mor pill */}
        <Link
          href="/biyoage"
          aria-label="BiyoAGE anasayfa"
          className="order-3 group inline-flex items-center gap-2 px-4 sm:px-5 h-10 rounded-full bg-[#9F8CE0] hover:bg-[#8B76D4] text-[#1B1330] font-bold text-sm tracking-tight transition-colors shadow-lg shadow-[#9F8CE0]/30"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-100 shadow-[0_0_8px_rgba(237,233,254,0.8)]" />
          BiyoAGE
        </Link>
      </div>
    </header>
  )
}
