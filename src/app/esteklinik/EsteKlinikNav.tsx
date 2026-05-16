'use client'

import Link from 'next/link'
import BrandMorphButton from '@/app/estestore/BrandMorphButton'
import { User, ShieldCheck, LayoutDashboard } from 'lucide-react'
import { useAuthStatus } from '@/components/AuthStatusProvider'

/**
 * EsteKlinik top nav — EsteStore'un AYNASI:
 * - EsteKlinik başrol YEŞİL pill SAĞDA (EsteStore sarı pill soldaydı)
 * - BrandMorphButton SOL-MERKEZ (EsteStore'da sağ-merkezdeydi)
 * - Aksiyon butonları SOLDA (EsteStore'da sağdaydı)
 *
 * Niyet: kullanıcı buranın AYRI bir dünya olduğunu hissetsin.
 */
export default function EsteKlinikNav() {
  const { isLoggedIn } = useAuthStatus()

  return (
    <header className="sticky top-0 z-50 bg-[#064E3B] border-b border-[#0A6347]/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* SOL: Aksiyon butonları — login'e göre Panel ya da Giriş/Kayıt */}
        <nav className="flex items-center gap-1 sm:gap-2 order-1">
          <Link
            href="/rehber"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-base font-medium text-emerald-100 hover:bg-white/10 transition-colors"
          >
            <ShieldCheck size={13} />
            Rehber
          </Link>
          {isLoggedIn ? (
            <Link
              href="/panel"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-base font-semibold bg-white text-[#064E3B] hover:bg-emerald-50 transition-colors"
            >
              <LayoutDashboard size={13} />
              Panel
            </Link>
          ) : (
            <>
              <Link
                href="/giris?g=esteklinik"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-base font-medium text-emerald-100 hover:bg-white/10 transition-colors"
              >
                <User size={13} />
                Giriş
              </Link>
              <Link
                href="/kayit?g=esteklinik"
                className="inline-flex items-center px-3 py-1.5 rounded-full text-base font-semibold bg-white text-[#064E3B] hover:bg-emerald-50 transition-colors"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </nav>

        {/* MERKEZ: BrandMorphButton (sol-merkez konumda — EsteStore'da sağdaydı) */}
        <div className="hidden md:flex order-2 flex-1 justify-center">
          <BrandMorphButton />
        </div>

        {/* SAĞ: EsteKlinik başrol yeşil pill */}
        <Link
          href="/esteklinik"
          aria-label="EsteKlinik anasayfa"
          className="order-3 group inline-flex items-center gap-2 px-4 sm:px-5 h-10 rounded-full bg-[#10876B] hover:bg-[#0E7559] text-white font-bold text-base tracking-tight transition-colors shadow-lg shadow-[#10876B]/30"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 shadow-[0_0_8px_rgba(187,247,208,0.8)]" />
          EsteKlinik
        </Link>
      </div>
    </header>
  )
}
