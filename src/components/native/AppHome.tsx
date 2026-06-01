'use client'

import SafeLink from '@/components/SafeLink'
import { Camera, Activity, BookOpen, LayoutDashboard, ShoppingBag, ChevronRight } from 'lucide-react'
import { useIsNativeApp } from './useIsNativeApp'
import { useAuthStatus } from '@/components/AuthStatusProvider'

/**
 * AppHome — yalnızca Capacitor app içinde görünen, skor-önce (score-first)
 * mobil ev ekranı. Web'de null render eder; oradaki pazarlama landing'i
 * (BiyoAGENav + hero + 4 kapı) `web-only` ile gizlenir, yerine bu gelir.
 *
 * Tasarım niyeti: pazarlama değil, kişisel başlangıç. Tek büyük skor halkası,
 * tek net aksiyon (Selfie ile Ölç), birkaç büyük dokunma hedefi. Basit/eğlenceli.
 *
 * Not: Landing'de gerçek skor verisi yok (panel verisi auth-gated). Bu yüzden
 * halka "?" gösterir ve kullanıcıyı ölçüme davet eder — sahte skor YOK.
 */

const TILES = [
  { href: '/skor', label: 'Klinik Skor', desc: 'Hekim onaylı', Icon: Activity, glow: '#B7A6E8' },
  { href: '/rehber', label: 'Longevity', desc: 'Bilimsel rehber', Icon: BookOpen, glow: '#7E6BC9' },
  { href: '/panel', label: 'Panelim', desc: 'Yolculuğun', Icon: LayoutDashboard, glow: '#6553A8' },
  { href: '/estestore', label: 'Mağaza', desc: 'Süreklilik', Icon: ShoppingBag, glow: '#9F8CE0' },
]

export default function AppHome() {
  const isApp = useIsNativeApp()
  const { isLoggedIn } = useAuthStatus()

  if (!isApp) return null

  return (
    <div
      className="app-home fixed inset-0 z-[60] overflow-y-auto bg-gradient-to-b from-[#1B1330] via-[#241942] to-[#160F28] text-white"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(72px + env(safe-area-inset-bottom))',
      }}
    >
      {/* DNA blur dokusu — derinlik */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 w-[360px] h-[360px] rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, #9F8CE0 0%, transparent 70%)' }}
      />

      <div className="relative px-5 pt-5">
        {/* Üst satır — marka + selam (küçük, geri planda) */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#C9BBF5]">BiyoAGE</p>
          <span className="text-xs font-semibold text-violet-300/70">
            {isLoggedIn ? 'Tekrar hoş geldin 👋' : 'Hoş geldin 👋'}
          </span>
        </div>

        {/* Çıpa manifesto — antiteli ikili lockup: "Sağlıklı yaş al & her zaman genç kal" */}
        <div className="mt-6 flex items-start justify-center gap-3 sm:gap-6 text-center">
          <div>
            <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.28em] text-[#7BE495]">
              SAĞLIKLI
            </p>
            <p className="text-3xl sm:text-4xl font-black tracking-tight leading-none mt-1.5">
              YAŞ&nbsp;AL
            </p>
          </div>
          <span className="self-center text-2xl sm:text-3xl font-serif italic text-[#C9BBF5] leading-none -mt-1">
            &amp;
          </span>
          <div>
            <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.28em] text-[#7BE495]">
              HER ZAMAN
            </p>
            <p className="text-3xl sm:text-4xl font-black tracking-tight leading-none mt-1.5">
              GENÇ&nbsp;KAL
            </p>
          </div>
        </div>

        {/* Skor halkası — büyük, tıklanınca ölçüme götürür */}
        <SafeLink href="/analiz" className="mt-7 block">
          <div className="relative mx-auto w-56 h-56">
            {/* pulse halka */}
            <span className="absolute inset-0 rounded-full bg-[#9F8CE0]/10 app-pulse" aria-hidden />
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
              <circle cx="100" cy="100" r="88" fill="none" stroke="#3D2C66" strokeWidth="12" />
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="#9F8CE0"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="553"
                strokeDashoffset="470"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-black leading-none">?</span>
              <span className="mt-2 text-sm font-semibold text-[#C9BBF5]">Gençlik Skoru</span>
              <span className="mt-1 text-xs text-violet-300/70">henüz ölçülmedi</span>
            </div>
          </div>
        </SafeLink>

        {/* Birincil aksiyon */}
        <SafeLink
          href="/analiz"
          className="mt-7 flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl bg-[#9F8CE0] active:bg-[#8B76D4] text-[#1B1330] font-bold text-base shadow-lg shadow-[#9F8CE0]/30 transition-colors"
        >
          <Camera size={20} />
          Selfie ile Ölç
        </SafeLink>
        <p className="mt-2 text-center text-xs text-violet-300/70">Ücretsiz · kayıt gerekmez · saniyeler içinde</p>

        {/* Hızlı erişim — 2×2 büyük kartlar */}
        <p className="mt-8 mb-3 text-sm font-bold uppercase tracking-[0.22em] text-violet-300/80">Hızlı Erişim</p>
        <div className="grid grid-cols-2 gap-3">
          {TILES.map(({ href, label, desc, Icon, glow }) => (
            <SafeLink
              key={href}
              href={href}
              className="relative overflow-hidden rounded-2xl bg-white/[0.06] border border-white/10 active:bg-white/[0.12] p-4 transition-colors"
            >
              <div
                aria-hidden
                className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20"
                style={{ background: glow }}
              />
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                style={{ background: glow, boxShadow: `0 4px 14px ${glow}50` }}
              >
                <Icon size={20} className="text-[#1B1330]" />
              </div>
              <p className="font-bold text-[15px] leading-tight">{label}</p>
              <p className="text-xs text-violet-300/70 mt-0.5">{desc}</p>
              <ChevronRight size={16} className="absolute bottom-3 right-3 text-violet-300/50" />
            </SafeLink>
          ))}
        </div>
      </div>
    </div>
  )
}
