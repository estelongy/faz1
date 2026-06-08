'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { pathForRole } from '@/lib/auth-redirect'
import { GALAXY_THEMES, resolveGalaxy, type Galaxy } from '@/lib/galaxy-themes'
import { useFlavor } from '@/components/native/flavor'

function GirisInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const galaxy: Galaxy = resolveGalaxy(searchParams.get('g'))
  const t = GALAXY_THEMES[galaxy]
  // PRO app'lerde (vendor/klinik flavor) consumer-flow öğeleri gizlenir:
  // "geri linki" yok, "Kaydolun" → başvuru, "Kurumsal Giriş" gizli.
  const flavor = useFlavor()
  const isProApp = flavor === 'estestorepro' || flavor === 'esteklinikpro'
  const proApplyHref = flavor === 'esteklinikpro' ? '/klinik/basvur' : '/satici/basvur'
  const proSubline = flavor === 'esteklinikpro' ? 'Klinik panelinize giriş yapın' : 'İş ortağı panelinize giriş yapın'

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // "Şifremi Unuttum" modu
  const [resetMode, setResetMode]     = useState(false)
  const [resetEmail, setResetEmail]   = useState('')
  const [resetSent, setResetSent]     = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  // URL'den hata parametresi
  useEffect(() => {
    if (searchParams.get('error') === 'auth') {
      setError('Giriş yapılamadı. Lütfen tekrar deneyin.')
    }
  }, [searchParams])

  // Giriş sonrası rota: next > rol paneli > galaksi landing (regular user)
  function resolveDest(role: string | null | undefined): string {
    const next = searchParams.get('next')
    if (next && next.startsWith('/')) return next
    const proRoles = ['admin', 'clinic', 'vendor', 'health_professional']
    if (role && proRoles.includes(role)) return pathForRole(role)
    if (galaxy !== 'default') return `/${galaxy}`
    return pathForRole(role)
  }

  // NOT: Eskiden burada client-side checkAuth + router.replace vardı.
  // Bu, server cookie ≠ client localStorage senaryosunda middleware ile
  // ping-pong oluşturup TOO_MANY_REDIRECTS loop'una yol açıyordu.
  // Artık auth otoritesi tek: middleware. Login'liysen middleware
  // /giris'i görür görmez next'e (veya rol paneline) atar.

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error ?? 'Giriş yapılamadı.')
        setLoading(false)
        return
      }
      const role = json.role as string | null
      router.push(resolveDest(role))
      router.refresh()
    } catch {
      setError('Ağ hatası. Lütfen tekrar deneyin.')
      setLoading(false)
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault()
    setResetLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${location.origin}/auth/update-password`,
    })
    setResetSent(true)
    setResetLoading(false)
  }

  const homeHref = galaxy === 'default' ? '/' : `/${galaxy}`
  const homeLabel = galaxy === 'default' ? 'Anasayfa' : t.name
  const inputCls = `w-full px-4 py-3 ${t.inputBg} border ${t.inputBorder} rounded-xl ${t.inputText} ${t.inputPlaceholder} focus:outline-none ${t.inputFocus} transition-colors`
  const labelCls = `block text-sm ${t.labelText} mb-2`
  const errorBoxCls = `p-3 ${t.errorBg} border ${t.errorBorder} rounded-xl ${t.errorText} text-sm`
  const kayitHref = `/kayit${galaxy !== 'default' ? `?g=${galaxy}` : ''}`

  return (
    <main className={`min-h-screen bg-gradient-to-b ${t.bgFrom} ${t.bgVia} ${t.bgTo} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        {/* A: PRO app'te üst geri linki gizli — app içinden consumer landing'e
            atmak galaksi-loss + app-dışı navigasyon hissi yaratıyor. */}
        {!isProApp && (
          <Link href={homeHref}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 mb-8 rounded-lg border ${t.cardBorder} ${t.backLinkHover} ${t.backLinkText} text-sm font-medium transition-colors`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {homeLabel}
          </Link>
        )}

        <div className={`${t.cardBg} ${t.mode === 'dark' ? 'backdrop-blur-sm' : ''} rounded-2xl p-6 sm:p-8 border ${t.cardBorder} shadow-xl`}>
          <div className="text-center mb-6 sm:mb-8">
            <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${t.iconGradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
              {/* DNA helix ikonu */}
              <svg className={`w-8 h-8 ${t.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" d="M6 3c4 4 8 6 12 9-4 3-8 5-12 9" />
                <path strokeLinecap="round" d="M18 3c-4 4-8 6-12 9 4 3 8 5 12 9" />
                <path strokeLinecap="round" d="M8 7h8M7 12h10M8 17h8" />
              </svg>
            </div>
            <h1 className={`text-2xl font-bold ${t.headingText}`}>
              {resetMode ? 'Şifre Sıfırla' : 'Giriş Yap'}
            </h1>
            <p className={`${t.mutedText} text-sm mt-1`}>
              {resetMode ? 'E-postanıza sıfırlama bağlantısı göndereceğiz' : (isProApp ? proSubline : t.subline)}
            </p>
          </div>

          {resetMode ? (
            resetSent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className={`${t.headingText} font-semibold`}>E-posta gönderildi!</p>
                <p className={`${t.mutedText} text-sm`}>
                  <strong className={t.headingText}>{resetEmail}</strong> adresine şifre sıfırlama bağlantısı gönderdik. Spam kutunuzu da kontrol edin.
                </p>
                <button onClick={() => { setResetMode(false); setResetSent(false); setResetEmail('') }}
                  className={`w-full py-3 ${t.inputBg} border ${t.inputBorder} hover:opacity-80 ${t.headingText} rounded-xl text-sm transition-colors`}>
                  Giriş sayfasına dön
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className={labelCls}>E-posta adresiniz</label>
                  <input type="email" required value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                    placeholder="ornek@email.com" className={inputCls} />
                </div>
                <button type="submit" disabled={resetLoading}
                  className={`w-full py-3 bg-gradient-to-r ${t.buttonGradient} ${t.buttonHover} disabled:opacity-50 ${t.buttonText} font-semibold rounded-xl transition-all shadow-lg`}>
                  {resetLoading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                </button>
                <button type="button" onClick={() => setResetMode(false)}
                  className={`w-full py-3 ${t.mutedText} hover:${t.headingText} text-sm transition-colors`}>
                  ← Giriş sayfasına dön
                </button>
              </form>
            )
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>E-posta</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="ornek@email.com" className={inputCls} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`block text-sm ${t.labelText}`}>Şifre</label>
                    <button type="button" onClick={() => setResetMode(true)}
                      className={`text-sm ${t.accent} ${t.accentHover} transition-colors`}>
                      Şifremi unuttum
                    </button>
                  </div>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" className={inputCls} />
                </div>
                {error && <div className={errorBoxCls}>{error}</div>}
                <button type="submit" disabled={loading}
                  className={`w-full py-3 bg-gradient-to-r ${t.buttonGradient} ${t.buttonHover} disabled:opacity-50 ${t.buttonText} font-semibold rounded-xl transition-all shadow-lg`}>
                  {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </button>
              </form>

              {/* B: PRO app'te "Kaydolun" → consumer kayıt değil, başvuru.
                  PRO: 2 satırlı şık blok (soru üstte küçük, link altta vurgulu)
                  Consumer: tek satır inline (alışılmış pattern). */}
              {isProApp ? (
                <div className="mt-6 text-center">
                  <p className={`text-xs ${t.mutedText}`}>Henüz iş ortağı değil misiniz?</p>
                  <Link
                    href={proApplyHref}
                    className={`inline-block mt-1.5 text-sm font-semibold ${t.accent} ${t.accentHover}`}
                  >
                    Başvuru yapın →
                  </Link>
                </div>
              ) : (
                <p className={`mt-6 text-center ${t.mutedText} text-sm`}>
                  Hesabınız yok mu?{' '}
                  <Link href={kayitHref} className={`${t.accent} ${t.accentHover} font-medium`}>Kaydolun</Link>
                </p>
              )}

              {/* C: PRO app'te "Kurumsal Giriş" butonu gizli — zaten kurumsal app'teyiz. */}
              {!isProApp && (
                <div className={`mt-4 pt-4 border-t ${t.dividerBorder}`}>
                  <Link href="/kurumsal/giris"
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 ${t.inputBg} border ${t.inputBorder} hover:opacity-80 rounded-xl ${t.mutedText} text-sm font-medium transition-all`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Kurumsal Giriş
                    <span className={`text-sm ${t.strengthText}`}>(Klinik / İş Ortağı)</span>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default function GirisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800" />}>
      <GirisInner />
    </Suspense>
  )
}
