'use client'

/**
 * KVKK/GDPR çerez consent banner — minimal, 3 kategori.
 *
 * Zorunlu çerezler: oturum, güvenlik, dil tercihi — onay aranmaz (KVKK m.5/2-c).
 * Analitik: Vercel Analytics, beachhead instrumentation (`eg_vid`).
 * Pazarlama: ileride GA/Meta Pixel/Hotjar entegrasyonu için ön onay.
 *
 * Karar:
 *   - localStorage 'eg_consent_v1' → { necessary: true, analytics, marketing, ts, v }
 *   - Cookie 'eg_consent' (SameSite=Lax, 1 yıl) → "n" | "na" | "nm" | "nam"
 *     server-side tracking endpoint'leri okuyabilsin diye
 *   - Versiyon farkı (v) varsa banner tekrar gösterilir
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'eg_consent_v1'
const COOKIE_KEY = 'eg_consent'
const CURRENT_VERSION = 1
const COOKIE_MAX_AGE_DAYS = 365

interface ConsentState {
  necessary: true
  analytics: boolean
  marketing: boolean
  ts: number
  v: number
}

function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentState
    if (parsed.v !== CURRENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function writeConsent(analytics: boolean, marketing: boolean): ConsentState {
  const state: ConsentState = {
    necessary: true,
    analytics,
    marketing,
    ts: Date.now(),
    v: CURRENT_VERSION,
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage devre dışı — cookie tek kanal kalır
  }
  let token = 'n'
  if (analytics) token += 'a'
  if (marketing) token += 'm'
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60
  document.cookie = `${COOKIE_KEY}=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
  return state
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const existing = readConsent()
    if (!existing) {
      // Hafif gecikme: ilk render'da splash/critical UI yüklensin önce
      const t = window.setTimeout(() => setOpen(true), 600)
      return () => window.clearTimeout(t)
    }
  }, [])

  if (!open) return null

  function acceptAll() {
    writeConsent(true, true)
    setOpen(false)
  }

  function rejectAll() {
    writeConsent(false, false)
    setOpen(false)
  }

  function saveCustom() {
    writeConsent(analytics, marketing)
    setOpen(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Çerez tercihleri"
      aria-modal="false"
      className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 pointer-events-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
    >
      <div className="pointer-events-auto max-w-3xl mx-auto rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="text-2xl shrink-0">🍪</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-slate-900 font-bold text-sm sm:text-base">
                Çerezler ve gizliliğin
              </h2>
              <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                Sitenin çalışması için <strong>zorunlu</strong> çerezleri kullanırız.
                Analitik ve pazarlama çerezleri yalnızca onayınla aktifleşir.{' '}
                <Link href="/hakkinda/cerez" className="text-violet-700 hover:text-violet-800 underline">
                  Detaylı bilgi
                </Link>
                {' · '}
                <Link href="/hakkinda/aydinlatma" className="text-violet-700 hover:text-violet-800 underline">
                  Aydınlatma metni
                </Link>
              </p>
            </div>
          </div>

          {showDetails && (
            <div className="mt-3 space-y-2 mb-4">
              <CategoryRow
                title="Zorunlu"
                description="Oturum, güvenlik, çerez tercihi. Devre dışı bırakılamaz."
                checked
                disabled
                onChange={() => {}}
              />
              <CategoryRow
                title="Analitik"
                description="Hangi galaksinin daha çok ilgi gördüğünü anlamak için kimliksiz ziyaret kayıtları."
                checked={analytics}
                onChange={setAnalytics}
              />
              <CategoryRow
                title="Pazarlama"
                description="Hedefli reklam ve yeniden pazarlama çerezleri (henüz aktif değil — ileride kullanılabilir)."
                checked={marketing}
                onChange={setMarketing}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={acceptAll}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors min-w-[120px]"
            >
              Tümünü kabul et
            </button>
            {showDetails ? (
              <button
                type="button"
                onClick={saveCustom}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors min-w-[120px]"
              >
                Seçimi kaydet
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold transition-colors min-w-[120px]"
              >
                Tercihleri yönet
              </button>
            )}
            <button
              type="button"
              onClick={rejectAll}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold transition-colors min-w-[120px]"
            >
              Yalnızca zorunlular
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryRow({
  title, description, checked, disabled, onChange,
}: {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className={`flex items-start gap-3 p-3 rounded-xl border ${
      disabled ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
    }`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded accent-violet-600 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${disabled ? 'text-slate-500' : 'text-slate-900'}`}>
            {title}
          </span>
          {disabled && (
            <span className="text-sm px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">
              Her zaman açık
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600 mt-0.5 leading-snug">{description}</p>
      </div>
    </label>
  )
}

/**
 * Server-side veya başka componentlerin consent durumu okuması için yardımcı.
 * SSR'da `null` döner — sadece client'ta çağrılmalı.
 */
export function getStoredConsent(): ConsentState | null {
  return readConsent()
}
