'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

import SafeLink from '@/components/SafeLink'
export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [success, setSuccess]         = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase şifre sıfırlama akışı 3 farklı yoldan gelebilir:
  //  1) PKCE: ?code=... query param → exchangeCodeForSession ile session'a çevir
  //  2) Hash (legacy): #access_token=... → SDK otomatik handle eder, PASSWORD_RECOVERY event'i tetiklenir
  //  3) Callback'ten redirect: zaten session açık → getSession() yakalar
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        if (!cancelled) setSessionReady(true)
      }
    })

    ;(async () => {
      // 1) ?code= var mı? PKCE flow için manuel exchange gerek.
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && !cancelled) {
          setSessionReady(true)
          // URL'i temizle (code'u adres çubuğundan sil — paylaşım/back button güvenliği)
          window.history.replaceState({}, '', '/auth/update-password')
          return
        }
        if (error && !cancelled) {
          setError('Bağlantı geçersiz veya süresi dolmuş. Lütfen yeniden şifre sıfırlama talebi gönderin.')
          return
        }
      }
      // 2/3) Hash flow veya mevcut session
      const { data: { session } } = await supabase.auth.getSession()
      if (session && !cancelled) setSessionReady(true)
    })()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.')
      return
    }
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.')
      return
    }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSuccess(true)
    setTimeout(() => router.push('/panel'), 2500)
  }

  if (!sessionReady) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          {error ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-white font-semibold">Bağlantı geçersiz</p>
              <p className="text-slate-400 text-sm">{error}</p>
              <SafeLink href="/giris" className="inline-block mt-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-base font-semibold rounded-xl transition-all">
                Giriş sayfasına dön
              </SafeLink>
            </>
          ) : (
            <>
              <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-400 text-sm">Bağlantı doğrulanıyor…</p>
            </>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Yeni Şifre Belirle</h1>
            <p className="text-slate-400 text-sm mt-1">Hesabınız için güçlü bir şifre seçin</p>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold">Şifre güncellendi!</p>
              <p className="text-slate-400 text-sm">Panelinize yönlendiriliyorsunuz…</p>
              <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 animate-[grow_2.5s_linear_forwards]" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Yeni şifre</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="En az 8 karakter"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Şifreyi tekrar girin</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Şifreyi tekrarlayın"
                  className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-colors ${
                    confirm && confirm !== password
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-slate-700 focus:border-violet-500'
                  }`}
                />
                {confirm && confirm !== password && (
                  <p className="text-red-400 text-sm mt-1">Şifreler eşleşmiyor</p>
                )}
              </div>

              {/* Şifre güç göstergesi */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${
                        password.length >= i * 3
                          ? i <= 1 ? 'bg-red-500'
                            : i <= 2 ? 'bg-amber-500'
                            : i <= 3 ? 'bg-emerald-500'
                            : 'bg-[#00d4ff]'
                          : 'bg-slate-700'
                      }`} />
                    ))}
                  </div>
                  <p className="text-slate-500 text-sm">
                    {password.length < 6 ? 'Çok zayıf'
                      : password.length < 8 ? 'Zayıf'
                      : password.length < 12 ? 'Orta'
                      : password.length < 16 ? 'Güçlü'
                      : 'Çok güçlü'}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading || !password || password !== confirm}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all"
              >
                {loading ? 'Güncelleniyor…' : 'Şifreyi Güncelle'}
              </button>

              <SafeLink href="/giris" className="block text-center text-slate-400 hover:text-white text-base transition-colors font-semibold">
                ← Giriş sayfasına dön
              </SafeLink>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
