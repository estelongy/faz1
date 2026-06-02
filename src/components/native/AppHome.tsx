'use client'

import { useEffect, useRef, useState } from 'react'
import SafeLink from '@/components/SafeLink'
import { Camera, BookOpen, LayoutDashboard, ShoppingBag, CalendarCheck, ChevronRight } from 'lucide-react'
import { useIsNativeApp } from './useIsNativeApp'
import { useAuthStatus } from '@/components/AuthStatusProvider'
import { useGalaxyTransition, type Galaxy } from '@/components/GalaxyTransition'
import Confetti from './Confetti'

/**
 * AppHome — yalnızca Capacitor app içinde görünen, skor-önce (score-first)
 * mobil ev ekranı. Web'de null render eder; oradaki pazarlama landing'i
 * (BiyoAGENav + hero + 4 kapı) `web-only` ile gizlenir, yerine bu gelir.
 *
 * Skor halkası: oturumlu kullanıcının gerçek Gençlik Skoru /api/me/score'dan
 * gelir. Skor VARSA halka dolar, sayı sayılır ve bir kez konfeti patlar.
 * Skor YOKSA (anonim ya da hiç ölçmemiş) "?" daveti gösterilir — sahte skor YOK.
 */

// Öncelik: Randevu (EsteKlinik) + Alışveriş (EsteStore) — ikisi de başka
// galaksiye ışınlanma (galaxy doluysa GalaxyTransition oynar). Glow rengi
// hedef galaksinin rengi: klinik yeşili / store altını.
type Tile = {
  href: string
  label: string
  desc: string
  Icon: typeof Camera
  glow: string
  galaxy?: Galaxy
}

const TILES: Tile[] = [
  { href: '/esteklinik', label: 'Randevu',   desc: 'Klinikte dönüştür', Icon: CalendarCheck,   glow: '#10876B', galaxy: 'esteklinik' },
  { href: '/estestore',  label: 'Alışveriş', desc: 'Ürün & süreklilik', Icon: ShoppingBag,     glow: '#C9A961', galaxy: 'estestore' },
  { href: '/rehber',     label: 'Longevity', desc: 'Bilimsel rehber',   Icon: BookOpen,        glow: '#7E6BC9' },
  { href: '/panel',      label: 'Panelim',   desc: 'Yolculuğun',        Icon: LayoutDashboard, glow: '#6553A8' },
]

const CIRC = 553 // 2πr, r=88
const PARTY_KEY = 'eg_score_party'

// score: undefined = yükleniyor, null = ölçüm yok, number = skor var
export default function AppHome() {
  const isApp = useIsNativeApp()
  const { isLoggedIn } = useAuthStatus()
  const { transitionTo } = useGalaxyTransition()

  const [score, setScore] = useState<number | null | undefined>(undefined)
  const [offset, setOffset] = useState<number>(CIRC) // boş halka
  const [display, setDisplay] = useState<number>(0) // sayım animasyonu
  const [confetti, setConfetti] = useState(false)
  const rafRef = useRef<number | null>(null)

  // Skoru çek
  useEffect(() => {
    let alive = true
    fetch('/api/me/score', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!alive) return
        const s = typeof d?.score === 'number' ? d.score : null
        setScore(s)
      })
      .catch(() => alive && setScore(null))
    return () => {
      alive = false
    }
  }, [])

  // Skor geldikten sonra: halkayı doldur + sayıyı say + (ilk kez) konfeti
  useEffect(() => {
    if (typeof score !== 'number') {
      setOffset(score === null ? 470 : CIRC) // ölçüm yoksa dekoratif kısmi yay
      return
    }

    // halka dolum (CSS transition ile)
    const t = setTimeout(() => setOffset(CIRC * (1 - score / 100)), 80)

    // sayı sayımı 0 → score (~1.1s)
    const start = performance.now()
    const dur = 1100
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(eased * score))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    // konfeti — oturum başına bir kez
    let partied = true
    try {
      partied = sessionStorage.getItem(PARTY_KEY) === '1'
    } catch {
      /* yoksay */
    }
    if (!partied) {
      setConfetti(true)
      try {
        sessionStorage.setItem(PARTY_KEY, '1')
      } catch {
        /* yoksay */
      }
      setTimeout(() => setConfetti(false), 1800)
    }

    return () => {
      clearTimeout(t)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [score])

  if (!isApp) return null

  const measured = typeof score === 'number'
  const ringHref = measured ? '/panel' : '/analiz'

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

        {/* Çıpa manifesto — kenarlara dayalı antitez: solda yaşlanma, sağda gençlik.
            İki blok ekranı kucaklar; merkez skor halkasına kalır. */}
        <div className="mt-6 flex items-start justify-between">
          <div className="text-left">
            <p className="text-[13px] sm:text-sm font-extrabold uppercase tracking-[0.24em] text-[#7BE495]">
              SAĞLIKLI
            </p>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight leading-none mt-1.5">
              YAŞ&nbsp;AL
            </p>
          </div>
          <div className="text-right">
            <p className="text-[13px] sm:text-sm font-extrabold uppercase tracking-[0.24em] text-[#7BE495]">
              HER ZAMAN
            </p>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight leading-none mt-1.5">
              GENÇ&nbsp;KAL
            </p>
          </div>
        </div>

        {/* Skor halkası — ölçüm varsa dolar + konfeti; yoksa "?" daveti */}
        <SafeLink href={ringHref} className="mt-7 block">
          <div className="relative mx-auto w-56 h-56">
            {/* pulse halka (yalnız ölçüm yokken canlandırır) */}
            {!measured && (
              <span className="absolute inset-0 rounded-full bg-[#9F8CE0]/10 app-pulse" aria-hidden />
            )}
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
              <circle cx="100" cy="100" r="88" fill="none" stroke="#3D2C66" strokeWidth="12" />
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke={measured ? '#7BE495' : '#9F8CE0'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.2,0.7,0.3,1), stroke 0.6s' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {measured ? (
                <span className="text-6xl font-black leading-none tabular-nums">{display}</span>
              ) : (
                <span className="text-6xl font-black leading-none">?</span>
              )}
              <span className="mt-2 text-sm font-semibold text-[#C9BBF5]">Gençlik Skoru</span>
              <span className="mt-1 text-xs text-violet-300/70">
                {score === undefined ? ' ' : measured ? 'bugünkü skorun' : 'henüz ölçülmedi'}
              </span>
            </div>

            {/* konfeti patlaması — skor dolunca bir kez */}
            {confetti && <Confetti />}
          </div>
        </SafeLink>

        {/* Birincil aksiyon */}
        <SafeLink
          href="/analiz"
          className="mt-7 flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl bg-[#9F8CE0] active:bg-[#8B76D4] text-[#1B1330] font-bold text-base shadow-lg shadow-[#9F8CE0]/30 transition-colors"
        >
          <Camera size={20} />
          {measured ? 'Skoru Yenile' : 'Selfie ile Ölç'}
        </SafeLink>
        <p className="mt-2 text-center text-xs text-violet-300/70">
          {measured ? 'yeni selfie ile skorunu güncelle' : 'Ücretsiz · kayıt gerekmez · saniyeler içinde'}
        </p>

        {/* Hızlı erişim — 2×2 büyük kartlar */}
        <p className="mt-8 mb-3 text-sm font-bold uppercase tracking-[0.22em] text-violet-300/80">Hızlı Erişim</p>
        <div className="grid grid-cols-2 gap-3">
          {TILES.map(({ href, label, desc, Icon, glow, galaxy }) => {
            const tileCls =
              'relative overflow-hidden rounded-2xl bg-white/[0.06] border border-white/10 active:bg-white/[0.12] p-4 transition-colors text-left'
            const inner = (
              <>
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
              </>
            )

            // Başka galaksiye → ışınlanma geçişi
            if (galaxy) {
              return (
                <button key={href} type="button" onClick={() => transitionTo(galaxy, href)} className={tileCls}>
                  {inner}
                </button>
              )
            }

            return (
              <SafeLink key={href} href={href} className={tileCls}>
                {inner}
              </SafeLink>
            )
          })}
        </div>
      </div>
    </div>
  )
}
