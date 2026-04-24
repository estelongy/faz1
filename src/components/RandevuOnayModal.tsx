'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface RandevuTaslak {
  clinicId: string
  clinicName: string
  dateTime: string   // ISO
  dayLabel: string   // kullanıcıya gösterilen
  timeLabel: string  // "10:30"
  notes: string
}

interface Props {
  taslak: RandevuTaslak
  onClose: () => void
  onSuccess: (appointmentId: string) => void
}

type Step = 'email' | 'signup' | 'otp' | 'creating'

export default function RandevuOnayModal({ taslak, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail]         = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [phone, setPhone]         = useState('')
  const [otpCode, setOtpCode]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [userExists, setUserExists] = useState<boolean | null>(null)

  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [onClose])

  // ── Email adımı ────────────────────────────────────────────
  async function submitEmail() {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Geçerli bir e-posta girin')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res  = await fetch('/api/randevu/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Kontrol başarısız')

      setUserExists(json.exists)
      if (json.exists) {
        await sendOtp(false)   // mevcut kullanıcı: direkt kod yolla
      } else {
        setStep('signup')      // yeni kullanıcı: önce ad-soyad-telefon
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata')
    } finally {
      setLoading(false)
    }
  }

  // ── Kayıt adımı sonrası OTP gönder ─────────────────────────
  async function submitSignup() {
    if (!firstName.trim()) { setError('Ad gerekli'); return }
    await sendOtp(true)
  }

  // ── OTP gönder (hem mevcut hem yeni) ───────────────────────
  async function sendOtp(isSignup: boolean) {
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: isSignup,
          data: isSignup ? {
            full_name: `${firstName}${lastName ? ' ' + lastName : ''}`,
            first_name: firstName,
            last_name:  lastName || '',
            phone:      phone || '',
          } : undefined,
        },
      })
      if (err) throw err
      setStep('otp')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kod gönderilemedi')
    } finally {
      setLoading(false)
    }
  }

  // ── OTP doğrula ve randevu oluştur ─────────────────────────
  async function verifyAndBook() {
    if (otpCode.length !== 6) return
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: verErr } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email',
      })
      if (verErr) throw new Error('Kod hatalı veya süresi dolmuş')

      setStep('creating')

      const res = await fetch('/api/randevu/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: taslak.clinicId,
          dateTime: taslak.dateTime,
          notes:    taslak.notes,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Randevu oluşturulamadı')

      onSuccess(json.appointmentId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata')
      setStep('otp')
    } finally {
      setLoading(false)
    }
  }

  async function resendOtp() {
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: userExists === false },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 p-6"
        onClick={e => e.stopPropagation()}>

        {/* Özet bant */}
        <div className="mb-5 p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-xs">
          <div className="text-slate-500 mb-1">Randevu</div>
          <div className="text-white font-semibold">{taslak.clinicName}</div>
          <div className="text-violet-400 mt-0.5">{taslak.dayLabel} · {taslak.timeLabel}</div>
        </div>

        {step === 'email' && (
          <>
            <h2 className="text-white text-xl font-bold mb-1">E-posta ile devam et</h2>
            <p className="text-slate-400 text-sm mb-5">
              Randevunuzu onaylamak için e-posta adresinizi girin. Hesabınız yoksa hemen oluştururuz.
            </p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors mb-3"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && submitEmail()}
            />
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <button
              onClick={submitEmail}
              disabled={loading || !email}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-50">
              {loading ? 'Kontrol ediliyor…' : 'Devam Et'}
            </button>
          </>
        )}

        {step === 'signup' && (
          <>
            <h2 className="text-white text-xl font-bold mb-1">Hesap Oluştur</h2>
            <p className="text-slate-400 text-sm mb-5">
              <span className="text-white">{email}</span> ile hesabınız yok. Birkaç bilgi verip hemen kaydolun.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                placeholder="Ad *"
                className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                autoFocus />
              <input
                type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                placeholder="Soyad"
                className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
            </div>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="Telefon (isteğe bağlı)"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 mb-3" />

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <button
              onClick={submitSignup}
              disabled={loading || !firstName.trim()}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-50 mb-2">
              {loading ? 'Kod gönderiliyor…' : 'Kaydol ve Randevunu Onayla'}
            </button>
            <button
              onClick={() => setStep('email')}
              className="w-full py-2 text-slate-400 hover:text-white text-sm">
              ← E-postayı değiştir
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <h2 className="text-white text-xl font-bold mb-1">Doğrulama Kodu</h2>
            <p className="text-slate-400 text-sm mb-5">
              <span className="text-white">{email}</span> adresine 6 haneli kod gönderdik. Lütfen kontrol edin.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="_ _ _ _ _ _"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-center text-2xl tracking-widest placeholder-slate-600 focus:outline-none focus:border-violet-500 mb-3"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && verifyAndBook()}
            />
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <button
              onClick={verifyAndBook}
              disabled={otpCode.length !== 6 || loading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-50 mb-3">
              {loading ? 'Doğrulanıyor…' : 'Doğrula ve Randevuyu Onayla'}
            </button>
            <div className="flex gap-2">
              <button onClick={resendOtp} disabled={loading}
                className="flex-1 py-2 text-slate-400 hover:text-white text-sm">
                Kodu tekrar gönder
              </button>
              <button onClick={() => setStep(userExists ? 'email' : 'signup')}
                className="flex-1 py-2 text-slate-400 hover:text-white text-sm">
                Geri
              </button>
            </div>
          </>
        )}

        {step === 'creating' && (
          <div className="py-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            <p className="text-slate-300">Randevunuz oluşturuluyor…</p>
          </div>
        )}

        {step !== 'creating' && (
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"
            style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
