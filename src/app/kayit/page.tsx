'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import PhoneOtpStep from '@/components/PhoneOtpStep'
import { GALAXY_THEMES, resolveGalaxy, type Galaxy } from '@/lib/galaxy-themes'

type Step = 'form' | 'otp' | 'verify'

function KayitInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const galaxy: Galaxy = resolveGalaxy(searchParams.get('g'))
  const t = GALAXY_THEMES[galaxy]

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [email, setEmail]         = useState('')
  const [phone, setPhone]         = useState('')
  const [password, setPassword]   = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [agreed, setAgreed]       = useState(false)
  const [refCode, setRefCode]     = useState('')

  // URL ?ref=XXX veya cookie 'estelongy_ref' otomatik doldur
  useEffect(() => {
    const fromUrl = searchParams.get('ref')
    if (fromUrl) {
      setRefCode(fromUrl.toUpperCase())
      return
    }
    const m = document.cookie.match(/(?:^|;\s*)estelongy_ref=([^;]+)/)
    if (m) setRefCode(decodeURIComponent(m[1]).toUpperCase())
  }, [searchParams])

  const [step, setStep]       = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // OTP state — sadece doğrulanacak telefon
  const [otpPhone, setOtpPhone] = useState('')

  function formatPhone(raw: string) {
    const d = raw.replace(/\D/g, '')
    if (d.startsWith('90')) return `+${d}`
    if (d.startsWith('0')) return `+90${d.slice(1)}`
    return `+90${d}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!firstName.trim() || !lastName.trim()) {
      setError('Ad ve soyad zorunludur.')
      return
    }
    if (!email.trim()) {
      setError('E-posta adresi zorunludur.')
      return
    }
    const birthYearNum = parseInt(birthYear)
    const currentYear = new Date().getFullYear()
    if (!birthYear || isNaN(birthYearNum) || birthYearNum < 1900 || birthYearNum > currentYear - 18) {
      setError('Geçerli bir doğum yılı girin (18 yaş ve üzeri).')
      return
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Geçerli bir telefon numarası girin.')
      return
    }
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.')
      return
    }
    if (!agreed) {
      setError('Devam etmek için sözleşmeyi onaylamanız gerekiyor.')
      return
    }

    // Phone OTP adımına geç — PhoneOtpStep component autoSend ile SMS atar
    setOtpPhone(formatPhone(phone))
    setStep('otp')
  }

  // OTP doğrulandıktan SONRA hesap oluştur, giriş yap, panele at
  async function handleOtpVerified() {
    setError(null)
    setLoading(true)
    const birthYearNum = parseInt(birthYear)
    const e164 = formatPhone(phone)

    const res = await fetch('/api/kayit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        phone: e164,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_year: birthYearNum,
        phone_verified: true,
        referral_code: refCode.trim() || undefined,
        signup_source: galaxy,
      }),
    })
    const result = await res.json()
    if (!res.ok) {
      setError(result.error || 'Hesap oluşturulamadı.')
      setLoading(false)
      setStep('form')
      return
    }
    const supabase = createClient()
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (signInErr) { setStep('verify'); return }
    // Galaksi context'i varsa kullanıcı o galaksiye dönsün (kayıt olduğu evren)
    router.push(galaxy !== 'default' ? `/${galaxy}` : '/panel')
    router.refresh()
  }

  async function handleResendEmail() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) setError('E-posta tekrar gönderilemedi.')
    setLoading(false)
  }

  // ─── Ortak class şablonları ──────────────────────────────────────────
  const inputCls = `w-full px-4 py-3 ${t.inputBg} border ${t.inputBorder} rounded-xl ${t.inputText} ${t.inputPlaceholder} focus:outline-none ${t.inputFocus} transition-colors`
  const labelCls = `block text-sm ${t.labelText} mb-2`
  const errorBoxCls = `p-3 ${t.errorBg} border ${t.errorBorder} rounded-xl ${t.errorText} text-sm`
  const homeHref = galaxy === 'default' ? '/' : `/${galaxy}`
  const homeLabel = galaxy === 'default' ? 'Anasayfa' : t.name

  // ─── SMS OTP Doğrulama Ekranı ─────────────────────────────────────────
  if (step === 'otp') return (
    <main className={`min-h-screen bg-gradient-to-b ${t.bgFrom} ${t.bgVia} ${t.bgTo} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        <div className={`${t.cardBg} backdrop-blur-sm rounded-2xl p-8 border ${t.cardBorder} shadow-xl`}>
          <PhoneOtpStep
            phone={otpPhone}
            onVerified={handleOtpVerified}
            onBack={() => { setStep('form'); setError(null) }}
          />
          {error && (
            <p className={`${t.errorText} text-sm text-center mt-4`}>{error}</p>
          )}
          {loading && (
            <p className={`${t.mutedText} text-sm text-center mt-4`}>Hesap oluşturuluyor…</p>
          )}
        </div>
      </div>
    </main>
  )

  // ─── E-posta Doğrulama Ekranı ──────────────────────────────────────────
  if (step === 'verify') return (
    <main className={`min-h-screen bg-gradient-to-b ${t.bgFrom} ${t.bgVia} ${t.bgTo} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        <div className={`${t.cardBg} backdrop-blur-sm rounded-2xl p-8 border ${t.cardBorder} shadow-xl text-center`}>
          <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${t.iconGradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
            <svg className={`w-8 h-8 ${t.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold ${t.headingText} mb-2`}>E-postanızı doğrulayın</h2>
          <p className={`${t.mutedText} mb-1`}>
            <span className={`${t.accent} font-medium`}>{email}</span> adresine doğrulama bağlantısı gönderdik.
          </p>
          <p className={`${t.mutedText} text-sm mb-6 opacity-80`}>Spam kutunuzu da kontrol edin.</p>
          {error && <div className={`${errorBoxCls} mb-4`}>{error}</div>}
          <button onClick={handleResendEmail} disabled={loading}
            className={`w-full py-3 ${t.inputBg} border ${t.inputBorder} hover:opacity-80 disabled:opacity-50 ${t.headingText} font-medium rounded-xl text-sm transition-colors mb-3`}>
            {loading ? 'Gönderiliyor...' : 'Tekrar gönder'}
          </button>
          <Link href={`/giris${galaxy !== 'default' ? `?g=${galaxy}` : ''}`}
            className={`inline-flex items-center justify-center w-full py-3 bg-gradient-to-r ${t.buttonGradient} ${t.buttonHover} ${t.buttonText} font-semibold rounded-xl shadow-lg`}>
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </main>
  )

  // ─── Kayıt Formu ───────────────────────────────────────────────────────
  return (
    <main className={`min-h-screen bg-gradient-to-b ${t.bgFrom} ${t.bgVia} ${t.bgTo} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        <Link href={homeHref}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 mb-8 rounded-lg border ${t.cardBorder} ${t.backLinkHover} ${t.backLinkText} text-sm font-medium transition-colors`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {homeLabel}
        </Link>

        <div className={`${t.cardBg} ${t.mode === 'dark' ? 'backdrop-blur-sm' : ''} rounded-2xl p-6 sm:p-8 border ${t.cardBorder} shadow-xl`}>
          <div className="text-center mb-6 sm:mb-8">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br ${t.iconGradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
              {/* DNA helix ikonu — yıldız metaforu yasak */}
              <svg className={`w-7 h-7 sm:w-8 sm:h-8 ${t.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" d="M6 3c4 4 8 6 12 9-4 3-8 5-12 9" />
                <path strokeLinecap="round" d="M18 3c-4 4-8 6-12 9 4 3 8 5 12 9" />
                <path strokeLinecap="round" d="M8 7h8M7 12h10M8 17h8" />
              </svg>
            </div>
            <h1 className={`text-2xl font-bold ${t.headingText}`}>Hesap Oluştur</h1>
            <p className={`${t.mutedText} text-sm mt-1`}>{t.subline}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Ad / Soyad */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Ad <span className="text-red-500">*</span></label>
                <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="Adınız" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Soyad <span className="text-red-500">*</span></label>
                <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="Soyadınız" className={inputCls} />
              </div>
            </div>

            {/* Doğum Yılı */}
            <div>
              <label className={labelCls}>Doğum Yılı <span className="text-red-500">*</span></label>
              <input type="number" required min={1900} max={new Date().getFullYear() - 18}
                value={birthYear} onChange={e => setBirthYear(e.target.value)}
                placeholder={String(new Date().getFullYear() - 30)} className={inputCls} />
            </div>

            {/* Telefon */}
            <div>
              <label className={labelCls}>Telefon <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <div className={`flex items-center gap-1.5 px-3 ${t.inputBg} border ${t.inputBorder} rounded-xl ${t.inputText} text-sm shrink-0 select-none`}>
                  🇹🇷 <span>+90</span>
                </div>
                <input type="tel" required value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="5xx xxx xx xx" className={`flex-1 ${inputCls}`} />
              </div>
            </div>

            {/* E-posta */}
            <div>
              <label className={labelCls}>E-posta <span className="text-red-500">*</span></label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ornek@email.com" className={inputCls} />
            </div>

            {/* Şifre */}
            <div>
              <label className={labelCls}>Şifre <span className="text-red-500">*</span></label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="En az 8 karakter" className={inputCls} />
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${
                        password.length >= i * 3
                          ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-amber-500' : i <= 3 ? 'bg-emerald-500' : 'bg-[#00d4ff]'
                          : t.mode === 'light' ? 'bg-slate-200' : 'bg-slate-700'
                      }`} />
                    ))}
                  </div>
                  <p className={`${t.strengthText} text-xs`}>
                    {password.length < 6 ? 'Çok zayıf' : password.length < 8 ? 'Zayıf' : password.length < 12 ? 'Orta' : password.length < 16 ? 'Güçlü' : 'Çok güçlü'}
                  </p>
                </div>
              )}
            </div>

            {/* Referans kodu (opsiyonel) */}
            <div>
              <label className={labelCls}>
                Referans Kodu <span className={`${t.strengthText} text-xs`}>(opsiyonel)</span>
              </label>
              <input type="text" value={refCode}
                onChange={e => setRefCode(e.target.value.toUpperCase().replace(/\s/g, '').slice(0, 12))}
                placeholder="Bir arkadaşın kodu varsa girin"
                className={`${inputCls} uppercase tracking-wider`} />
              {refCode && (
                <p className={`${t.accent} text-xs mt-1.5 opacity-90`}>✨ Referans kodun arkadaşına +10 puan kazandıracak</p>
              )}
            </div>

            {/* Sözleşme */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 shrink-0">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="sr-only" />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    agreed ? t.checkboxBg : t.checkboxIdleBorder
                  }`}>
                    {agreed && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className={`${t.mutedText} text-sm leading-relaxed`}>
                  <Link href="/hakkinda/sozlesme" target="_blank" className={`${t.accent} ${t.accentHover} underline`}>Üyelik Sözleşmesi</Link>&apos;ni ve{' '}
                  <Link href="/hakkinda/aydinlatma" target="_blank" className={`${t.accent} ${t.accentHover} underline`}>Hasta Aydınlatma Metni</Link>&apos;ni okudum, kabul ediyorum.
                </span>
              </label>
            </div>

            {error && <div className={errorBoxCls}>{error}</div>}

            <button type="submit" disabled={loading || !agreed}
              className={`w-full py-3.5 bg-gradient-to-r ${t.buttonGradient} ${t.buttonHover} disabled:opacity-40 disabled:cursor-not-allowed ${t.buttonText} font-semibold rounded-xl transition-all mt-2 shadow-lg`}>
              {loading ? 'SMS Gönderiliyor...' : 'Kayıt Ol'}
            </button>
          </form>

          <p className={`mt-6 text-center ${t.mutedText} text-sm`}>
            Zaten hesabınız var mı?{' '}
            <Link href={`/giris${galaxy !== 'default' ? `?g=${galaxy}` : ''}`} className={`${t.accent} ${t.accentHover} font-medium`}>Giriş yapın</Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function KayitPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-900" />}>
      <KayitInner />
    </Suspense>
  )
}
