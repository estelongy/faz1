'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import PhoneOtpStep from '@/components/PhoneOtpStep'

type Step = 'form' | 'otp' | 'verify'
type Galaxy = 'biyoage' | 'esteklinik' | 'estestore' | 'default'

interface GalaxyTheme {
  name: string
  bgFrom: string
  bgVia: string
  bgTo: string
  cardBg: string
  cardBorder: string
  inputBg: string
  inputBorder: string
  inputFocus: string
  buttonGradient: string
  buttonHover: string
  iconGradient: string
  accent: string
  accentHover: string
  checkboxBg: string
  ringPulse: string
  subline: string
}

const THEMES: Record<Galaxy, GalaxyTheme> = {
  // Estelongy çatı — mor (mevcut)
  default: {
    name: 'Estelongy',
    bgFrom: 'from-slate-900',
    bgVia: 'via-slate-900',
    bgTo: 'to-slate-800',
    cardBg: 'bg-slate-800/50',
    cardBorder: 'border-slate-700',
    inputBg: 'bg-slate-900',
    inputBorder: 'border-slate-700',
    inputFocus: 'focus:border-violet-500',
    buttonGradient: 'from-violet-600 to-purple-600',
    buttonHover: 'hover:from-violet-500 hover:to-purple-500',
    iconGradient: 'from-violet-500 to-purple-600',
    accent: 'text-violet-400',
    accentHover: 'hover:text-violet-300',
    checkboxBg: 'bg-violet-600 border-violet-600',
    ringPulse: 'bg-violet-500',
    subline: 'Üç dünyaya tek anahtar.',
  },
  // BiyoAGE — derin mor (ölçüm/analiz)
  biyoage: {
    name: 'BiyoAGE',
    bgFrom: 'from-[#1B1330]',
    bgVia: 'via-[#241942]',
    bgTo: 'to-[#120B22]',
    cardBg: 'bg-[#241942]/60',
    cardBorder: 'border-[#3D2C66]',
    inputBg: 'bg-[#120B22]',
    inputBorder: 'border-[#3D2C66]',
    inputFocus: 'focus:border-[#9F8CE0]',
    buttonGradient: 'from-[#9F8CE0] to-[#8B76D4]',
    buttonHover: 'hover:from-[#8B76D4] hover:to-[#7A66C8]',
    iconGradient: 'from-[#9F8CE0] to-[#7E6BC9]',
    accent: 'text-[#C9BBF5]',
    accentHover: 'hover:text-[#E0D6FA]',
    checkboxBg: 'bg-[#9F8CE0] border-[#9F8CE0]',
    ringPulse: 'bg-[#9F8CE0]',
    subline: 'Biyolojik yaşını ölç, yavaşlat.',
  },
  // EsteKlinik — teal (klinik/aksiyon)
  esteklinik: {
    name: 'EsteKlinik',
    bgFrom: 'from-[#064E3B]',
    bgVia: 'via-[#0A6347]',
    bgTo: 'to-[#053527]',
    cardBg: 'bg-[#0A6347]/40',
    cardBorder: 'border-[#10876B]/40',
    inputBg: 'bg-[#053527]',
    inputBorder: 'border-[#10876B]/40',
    inputFocus: 'focus:border-[#10876B]',
    buttonGradient: 'from-[#10876B] to-[#0E7559]',
    buttonHover: 'hover:from-[#0E7559] hover:to-[#0A6347]',
    iconGradient: 'from-[#10876B] to-[#0A6347]',
    accent: 'text-emerald-300',
    accentHover: 'hover:text-emerald-200',
    checkboxBg: 'bg-[#10876B] border-[#10876B]',
    ringPulse: 'bg-[#10876B]',
    subline: 'Onaylı klinik ekosistemine katıl.',
  },
  // EsteStore — altın (ürün/süreklilik)
  estestore: {
    name: 'EsteStore',
    bgFrom: 'from-[#1A1612]',
    bgVia: 'via-[#28201A]',
    bgTo: 'to-[#0F0C0A]',
    cardBg: 'bg-[#28201A]/60',
    cardBorder: 'border-[#C9A961]/30',
    inputBg: 'bg-[#0F0C0A]',
    inputBorder: 'border-[#C9A961]/30',
    inputFocus: 'focus:border-[#C9A961]',
    buttonGradient: 'from-[#C9A961] to-[#A88840]',
    buttonHover: 'hover:from-[#D4B570] hover:to-[#B89548]',
    iconGradient: 'from-[#C9A961] to-[#A88840]',
    accent: 'text-[#E8D49E]',
    accentHover: 'hover:text-[#F2E2BA]',
    checkboxBg: 'bg-[#C9A961] border-[#C9A961]',
    ringPulse: 'bg-[#C9A961]',
    subline: 'Hekim puanlı ürünleri keşfet.',
  },
}

function KayitInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const galaxyParam = (searchParams.get('g') ?? 'default') as Galaxy
  const galaxy: Galaxy = THEMES[galaxyParam] ? galaxyParam : 'default'
  const t = THEMES[galaxy]

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
    router.push('/panel')
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

  // ─── SMS OTP Doğrulama Ekranı ─────────────────────────────────────────
  if (step === 'otp') return (
    <main className={`min-h-screen bg-gradient-to-b ${t.bgFrom} ${t.bgVia} ${t.bgTo} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        <div className={`${t.cardBg} backdrop-blur-sm rounded-2xl p-8 border ${t.cardBorder}`}>
          <PhoneOtpStep
            phone={otpPhone}
            onVerified={handleOtpVerified}
            onBack={() => { setStep('form'); setError(null) }}
          />
          {error && (
            <p className="text-red-400 text-sm text-center mt-4">{error}</p>
          )}
          {loading && (
            <p className="text-slate-400 text-sm text-center mt-4">Hesap oluşturuluyor…</p>
          )}
        </div>
      </div>
    </main>
  )

  // ─── E-posta Doğrulama Ekranı ──────────────────────────────────────────
  if (step === 'verify') return (
    <main className={`min-h-screen bg-gradient-to-b ${t.bgFrom} ${t.bgVia} ${t.bgTo} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        <div className={`${t.cardBg} backdrop-blur-sm rounded-2xl p-8 border ${t.cardBorder} text-center`}>
          <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${t.iconGradient} rounded-xl flex items-center justify-center mb-4`}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">E-postanızı doğrulayın</h2>
          <p className="text-slate-400 mb-1">
            <span className={`${t.accent} font-medium`}>{email}</span> adresine doğrulama bağlantısı gönderdik.
          </p>
          <p className="text-slate-500 text-sm mb-6">Spam kutunuzu da kontrol edin.</p>
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-4">{error}</div>
          )}
          <button onClick={handleResendEmail} disabled={loading}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors mb-3">
            {loading ? 'Gönderiliyor...' : 'Tekrar gönder'}
          </button>
          <Link href="/giris" className={`inline-flex items-center justify-center w-full py-3 bg-gradient-to-r ${t.buttonGradient} ${t.buttonHover} text-white font-semibold rounded-xl`}>
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </main>
  )

  // ─── Kayıt Formu ───────────────────────────────────────────────────────
  const homeHref = galaxy === 'default' ? '/' : `/${galaxy}`
  const homeLabel = galaxy === 'default' ? 'Anasayfa' : t.name
  const inputCls = `w-full px-4 py-3 ${t.inputBg} border ${t.inputBorder} rounded-xl text-white placeholder-slate-500 focus:outline-none ${t.inputFocus} transition-colors`

  return (
    <main className={`min-h-screen bg-gradient-to-b ${t.bgFrom} ${t.bgVia} ${t.bgTo} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        <Link href={homeHref} className={`inline-flex items-center gap-1.5 px-3 py-1.5 mb-8 rounded-lg border ${t.cardBorder} hover:bg-white/5 text-slate-300 hover:text-white text-sm font-medium transition-colors`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {homeLabel}
        </Link>

        <div className={`${t.cardBg} backdrop-blur-sm rounded-2xl p-6 sm:p-8 border ${t.cardBorder}`}>
          <div className="text-center mb-6 sm:mb-8">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br ${t.iconGradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
              {/* DNA helix ikonu — yıldız metaforu yasak */}
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" d="M6 3c4 4 8 6 12 9-4 3-8 5-12 9" />
                <path strokeLinecap="round" d="M18 3c-4 4-8 6-12 9 4 3 8 5 12 9" />
                <path strokeLinecap="round" d="M8 7h8M7 12h10M8 17h8" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Hesap Oluştur</h1>
            <p className="text-slate-400 text-sm mt-1">{t.subline}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Ad / Soyad */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Ad <span className="text-red-400">*</span></label>
                <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="Adınız"
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Soyad <span className="text-red-400">*</span></label>
                <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="Soyadınız"
                  className={inputCls} />
              </div>
            </div>

            {/* Doğum Yılı */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Doğum Yılı <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1900}
                max={new Date().getFullYear() - 18}
                value={birthYear}
                onChange={e => setBirthYear(e.target.value)}
                placeholder={String(new Date().getFullYear() - 30)}
                className={inputCls}
              />
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Telefon <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                <div className={`flex items-center gap-1.5 px-3 ${t.inputBg} border ${t.inputBorder} rounded-xl text-slate-300 text-sm shrink-0 select-none`}>
                  🇹🇷 <span>+90</span>
                </div>
                <input type="tel" required value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="5xx xxx xx xx"
                  className={`flex-1 px-4 py-3 ${t.inputBg} border ${t.inputBorder} rounded-xl text-white placeholder-slate-500 focus:outline-none ${t.inputFocus} transition-colors`} />
              </div>
            </div>

            {/* E-posta */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">E-posta <span className="text-red-400">*</span></label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className={inputCls} />
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Şifre <span className="text-red-400">*</span></label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className={inputCls} />
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${
                        password.length >= i * 3
                          ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-amber-500' : i <= 3 ? 'bg-emerald-500' : 'bg-[#00d4ff]'
                          : 'bg-slate-700'
                      }`} />
                    ))}
                  </div>
                  <p className="text-slate-500 text-xs">
                    {password.length < 6 ? 'Çok zayıf' : password.length < 8 ? 'Zayıf' : password.length < 12 ? 'Orta' : password.length < 16 ? 'Güçlü' : 'Çok güçlü'}
                  </p>
                </div>
              )}
            </div>

            {/* Referans kodu (opsiyonel) */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Referans Kodu <span className="text-slate-600 text-xs">(opsiyonel)</span>
              </label>
              <input type="text" value={refCode}
                onChange={e => setRefCode(e.target.value.toUpperCase().replace(/\s/g, '').slice(0, 12))}
                placeholder="Bir arkadaşın kodu varsa girin"
                className={`${inputCls} uppercase tracking-wider`} />
              {refCode && (
                <p className="text-emerald-400/80 text-xs mt-1.5">✨ Referans kodun arkadaşına +10 puan kazandıracak</p>
              )}
            </div>

            {/* Sözleşme */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 shrink-0">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    className="sr-only" />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    agreed ? t.checkboxBg : 'border-slate-600 group-hover:border-slate-500'
                  }`}>
                    {agreed && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-slate-400 text-sm leading-relaxed">
                  <Link href="/hakkinda/sozlesme" target="_blank" className={`${t.accent} ${t.accentHover} underline`}>Üyelik Sözleşmesi</Link>&apos;ni ve{' '}
                  <Link href="/hakkinda/aydinlatma" target="_blank" className={`${t.accent} ${t.accentHover} underline`}>Hasta Aydınlatma Metni</Link>&apos;ni okudum, kabul ediyorum.
                </span>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading || !agreed}
              className={`w-full py-3.5 bg-gradient-to-r ${t.buttonGradient} ${t.buttonHover} disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all mt-2`}>
              {loading ? 'SMS Gönderiliyor...' : 'Kayıt Ol'}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-400 text-sm">
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
