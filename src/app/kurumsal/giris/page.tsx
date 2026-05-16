'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { pathForRole } from '@/lib/auth-redirect'
import PhoneOtpStep from '@/components/PhoneOtpStep'

import SafeLink from '@/components/SafeLink'
type AccountType = 'klinik' | 'satici' | 'saglik_profesyoneli' | null
type Step = 'form' | 'otp'

export default function KurumsalGirisPage() {
  const router = useRouter()
  const [accountType, setAccountType] = useState<AccountType>(null)
  const [mode, setMode] = useState<'giris' | 'kayit'>('giris')
  const [step, setStep] = useState<Step>('form')

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone]       = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [otpPhone, setOtpPhone] = useState('')

  function formatPhone(raw: string) {
    const d = raw.replace(/\D/g, '')
    if (d.startsWith('90')) return `+${d}`
    if (d.startsWith('0')) return `+90${d.slice(1)}`
    return `+90${d}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'giris') {
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

        if (role === 'admin' || role === 'clinic' || role === 'vendor' || role === 'health_professional') {
          router.push(pathForRole(role))
          router.refresh()
          return
        }

        // Rol yok (user) → seçilen hesap tipine göre başvuru akışı
        if (accountType === 'klinik') router.push('/esteklinik/basvur')
        else if (accountType === 'satici') router.push('/satici/basvur')
        else router.push('/panel')
        router.refresh()
        return
      } catch {
        setError('Ağ hatası. Lütfen tekrar deneyin.')
        setLoading(false)
        return
      }
    }

    // ─── Kayıt akışı ────────────────────────────────────────────────
    // Sağlık Profesyoneli: dedicated sayfa
    if (accountType === 'saglik_profesyoneli') {
      router.push('/kurumsal/saglik-profesyoneli/kayit')
      return
    }

    // Klinik / İş Ortağı — form validation, sonra SMS OTP'ye geç
    if (!fullName.trim()) { setError('Ad Soyad zorunludur.'); setLoading(false); return }
    if (phone.replace(/\D/g, '').length < 10) { setError('Geçerli bir telefon numarası girin.'); setLoading(false); return }
    if (password.length < 8) { setError('Şifre en az 8 karakter olmalıdır.'); setLoading(false); return }

    setOtpPhone(formatPhone(phone))
    setStep('otp')
    setLoading(false)
  }

  // OTP doğrulandıktan SONRA hesap oluştur
  async function handleOtpVerified() {
    setError(null)
    setLoading(true)
    const e164 = formatPhone(phone)

    const res = await fetch('/api/kurumsal/kayit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        phone: e164,
        full_name: fullName.trim(),
        account_type: accountType,
        phone_verified: true,
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
    if (signInErr) {
      setError('Hesap oluşturuldu ancak otomatik giriş başarısız. Lütfen giriş yapmayı deneyin.')
      setStep('form')
      setMode('giris')
      return
    }
    router.push(accountType === 'klinik' ? '/esteklinik/basvur' : '/satici/basvur')
    router.refresh()
  }

  // ─── SMS OTP ekranı ──────────────────────────────────────────────────
  if (step === 'otp') return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
          <PhoneOtpStep
            phone={otpPhone}
            onVerified={handleOtpVerified}
            onBack={() => { setStep('form'); setError(null) }}
          />
          {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
          {loading && <p className="text-slate-400 text-sm text-center mt-4">Hesap oluşturuluyor…</p>}
        </div>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SafeLink href="/giris" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors text-base font-semibold">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Normal girişe dön
        </SafeLink>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Kurumsal Giriş</h1>
          <p className="text-slate-400 text-sm mt-1">Klinik, iş ortağı veya sağlık profesyoneli hesabınızla devam edin</p>
        </div>

        {/* Hesap tipi seçimi */}
        {!accountType ? (
          <div className="space-y-4">
            <button onClick={() => setAccountType('klinik')}
              className="w-full p-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all text-left group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-lg">Klinik</div>
                  <div className="text-slate-400 text-sm">Dermatoloji, estetik veya sağlık kliniği</div>
                </div>
                <svg className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <button onClick={() => setAccountType('satici')}
              className="w-full p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all text-left group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-lg">İş Ortağı</div>
                  <div className="text-slate-400 text-sm">Cilt bakım ürünleri ve kozmetik markası</div>
                </div>
                <svg className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <button onClick={() => setAccountType('saglik_profesyoneli')}
              className="w-full p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all text-left group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-lg">Sağlık Profesyoneli</div>
                  <div className="text-slate-400 text-sm">Akademi eğitimlerine ve mağazaya erişim</div>
                </div>
                <svg className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            {/* Seçili hesap tipi göstergesi */}
            <div className={`flex items-center gap-3 p-3 rounded-xl mb-6 ${
              accountType === 'klinik'
                ? 'bg-blue-500/10 border border-blue-500/20'
                : accountType === 'satici'
                ? 'bg-amber-500/10 border border-amber-500/20'
                : 'bg-emerald-500/10 border border-emerald-500/20'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${
                accountType === 'klinik'
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-600'
                  : accountType === 'satici'
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600'
              }`}>
                {accountType === 'klinik' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                ) : accountType === 'satici' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                )}
              </div>
              <span className={`font-medium text-sm ${
                accountType === 'klinik' ? 'text-blue-300' : accountType === 'satici' ? 'text-amber-300' : 'text-emerald-300'
              }`}>
                {accountType === 'klinik' ? 'Klinik Hesabı' : accountType === 'satici' ? 'İş Ortağı Hesabı' : 'Sağlık Profesyoneli'}
              </span>
              <button onClick={() => { setAccountType(null); setError(null) }} className="ml-auto text-slate-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Sağlık Profesyoneli için kayıt sayfasına yönlendirme banneri */}
            {accountType === 'saglik_profesyoneli' && mode === 'kayit' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-sm text-slate-300 leading-relaxed">
                  Sağlık profesyoneli kaydı için ünvan, uzmanlık alanı ve beyan bilgileri istenir.
                  Ayrıntılı kayıt formuna geçin.
                </div>
                <Link
                  href="/kurumsal/saglik-profesyoneli/kayit"
                  className="block w-full text-center py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-base transition-all"
                >
                  Detaylı Kayıt Formuna Git →
                </Link>
                <button
                  onClick={() => setMode('giris')}
                  className="w-full text-center py-2 text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Hesabım var, giriş yap
                </button>
              </div>
            ) : (
              <>
                {/* Giriş / Kayıt toggle */}
                <div className="flex rounded-xl bg-slate-900 p-1 mb-6">
                  <button onClick={() => { setMode('giris'); setError(null) }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'giris' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    Giriş Yap
                  </button>
                  <button onClick={() => { setMode('kayit'); setError(null) }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'kayit' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    Kayıt Ol
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {mode === 'kayit' && (
                    <>
                      <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                        placeholder="Ad Soyad (yetkili)"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm" />

                      <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 text-sm shrink-0 select-none">
                          🇹🇷 <span>+90</span>
                        </div>
                        <input type="tel" required value={phone}
                          onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="5xx xxx xx xx"
                          className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm" />
                      </div>
                    </>
                  )}
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="E-posta"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'kayit' ? 'Şifre (en az 8 karakter)' : 'Şifre'}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm" />
                  {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
                  {mode === 'kayit' && (
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Devam ederek{' '}
                      <Link href="/hakkinda/sozlesme" target="_blank" className="text-violet-400 hover:text-violet-300 underline">Üyelik Sözleşmesi</Link>
                      &apos;ni ve{' '}
                      <Link href="/hakkinda/aydinlatma" target="_blank" className="text-violet-400 hover:text-violet-300 underline">KVKK Aydınlatma Metni</Link>
                      &apos;ni okuyup kabul etmiş olursunuz. Telefonunuza SMS ile doğrulama kodu gönderilecektir.
                    </p>
                  )}
                  <button type="submit" disabled={loading}
                    className={`w-full py-3 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm ${
                      accountType === 'klinik'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400'
                    }`}>
                    {loading ? 'Yükleniyor...' : mode === 'giris' ? 'Giriş Yap' : 'SMS Doğrulamaya Geç'}
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
