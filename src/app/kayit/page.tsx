'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Step = 'form' | 'verify'

export default function KayitPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [password, setPassword] = useState('')

  const [step, setStep]       = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

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
    const supabase = createClient()

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.')
      setLoading(false)
      return
    }

    if (phone.replace(/\D/g, '').length < 10) {
      setError('Geçerli bir telefon numarası girin.')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone: formatPhone(phone) },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (signUpError) {
      setError(signUpError.message === 'User already registered' ? 'Bu e-posta zaten kayıtlı.' : signUpError.message)
      setLoading(false)
      return
    }
    if (data.user && !data.session) { setStep('verify'); setLoading(false); return }
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

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  // ─── E-posta Doğrulama Ekranı ───────────────────────────────────────────
  if (step === 'verify') return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">E-postanızı doğrulayın</h2>
          <p className="text-slate-400 mb-1">
            <span className="text-violet-400 font-medium">{email}</span> adresine doğrulama bağlantısı gönderdik.
          </p>
          <p className="text-slate-500 text-sm mb-6">Spam kutunuzu da kontrol edin.</p>
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-4">{error}</div>
          )}
          <button onClick={handleResendEmail} disabled={loading}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors mb-3">
            {loading ? 'Gönderiliyor...' : 'Tekrar gönder'}
          </button>
          <Link href="/giris" className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl">
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </main>
  )

  // ─── Kayıt Formu ────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Geri
        </Link>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Hesap Oluştur</h1>
            <p className="text-slate-400 text-sm mt-1">Cildinizi keşfetmeye başlayın</p>
          </div>

          <button onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl text-white text-sm font-medium transition-colors mb-6">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google ile devam et
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-slate-500 text-xs">veya e-posta ile</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Ad Soyad</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Adınız Soyadınız"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">E-posta</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Telefon Numarası</label>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 text-sm shrink-0 select-none">
                  🇹🇷 <span>+90</span>
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="5xx xxx xx xx"
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Şifre</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
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
                    {password.length < 3 ? 'Çok zayıf' : password.length < 6 ? 'Zayıf' : password.length < 9 ? 'Orta' : password.length < 12 ? 'Güçlü' : 'Çok güçlü'}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all">
              {loading ? 'Kayıt oluşturuluyor...' : 'Kayıt Ol'}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-400 text-sm">
            Zaten hesabınız var mı?{' '}
            <Link href="/giris" className="text-violet-400 hover:text-violet-300 font-medium">Giriş yapın</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
