'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import PhoneOtpStep from '@/components/PhoneOtpStep'

const TITLES = [
  'Dr.',
  'Uz. Dr.',
  'Op. Dr.',
  'Prof. Dr.',
  'Doç. Dr.',
  'Diş Hekimi',
  'Hemşire',
  'Eczacı',
  'Tıp Öğrencisi',
  'Diğer',
] as const

type Step = 'form' | 'otp'

export default function SaglikProfesyoneliKayitPage() {
  const router = useRouter()

  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')
  const [email, setEmail]           = useState('')
  const [phone, setPhone]           = useState('')
  const [password, setPassword]     = useState('')
  const [hpTitle, setHpTitle]       = useState<string>('')
  const [hpSpecialty, setHpSpecialty] = useState('')
  const [hpInstitution, setHpInstitution] = useState('')
  const [declaration, setDeclaration] = useState(false)
  const [kvkk, setKvkk]             = useState(false)

  const [step, setStep]       = useState<Step>('form')
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
    setError(null)

    if (!firstName.trim() || !lastName.trim()) { setError('Ad ve soyad zorunludur.'); return }
    if (!email.trim()) { setError('E-posta zorunludur.'); return }
    if (phone.replace(/\D/g, '').length < 10) { setError('Geçerli bir telefon girin.'); return }
    if (password.length < 8) { setError('Şifre en az 8 karakter olmalıdır.'); return }
    if (!hpTitle) { setError('Ünvan seçimi zorunludur.'); return }
    if (hpSpecialty.trim().length < 3) { setError('Uzmanlık/çalışma alanı zorunludur (en az 3 karakter).'); return }
    if (!declaration) { setError('Sağlık profesyoneli beyanını onaylamanız gerekli.'); return }
    if (!kvkk) { setError('KVKK aydınlatma metnini onaylamanız gerekli.'); return }

    setOtpPhone(formatPhone(phone))
    setStep('otp')
  }

  async function handleOtpVerified() {
    setError(null)
    setLoading(true)
    const e164 = formatPhone(phone)

    const res = await fetch('/api/saglik-profesyoneli/kayit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        phone: e164,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        hp_title: hpTitle,
        hp_specialty: hpSpecialty.trim(),
        hp_institution: hpInstitution.trim() || null,
        hp_declaration: true,
        kvkk_accepted: true,
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

    // Otomatik giriş + panele
    const supabase = createClient()
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (signInErr) {
      setError('Hesap oluşturuldu ancak otomatik giriş başarısız. Lütfen giriş sayfasından girin.')
      setTimeout(() => router.push('/kurumsal/giris'), 2000)
      return
    }
    router.push('/panel')
    router.refresh()
  }

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
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg">
        <Link
          href="/kurumsal/giris"
          className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors text-base font-semibold"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kurumsal girişe dön
        </Link>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-700">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🎓</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Sağlık Profesyoneli Kaydı</h1>
            <p className="text-slate-400 text-sm mt-1">
              Estelongy Akademi&apos;ye eğitim amaçlı erişim için hesap oluşturun
            </p>
          </div>

          {/* Bilgi kutusu */}
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-sm text-slate-300 leading-relaxed">
            <strong className="text-emerald-400">Kapsam:</strong> Hesap, Akademi (eğitim videoları satın alma & izleme),
            EsteStore ve Topluluk özelliklerine erişim sağlar. Hasta kabul / takvim modülleri açılmaz.
            <br /><br />
            <strong className="text-emerald-400">Beyan:</strong> Diploma yüklemesi istenmez; sağlık profesyoneli olduğunuzu
            beyan ederek kayıt oluyorsunuz. Yanlış beyan halinde hesap ve içerik erişimi iptal edilir.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ünvan */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Ünvan <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={hpTitle}
                onChange={e => setHpTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              >
                <option value="">— Seçin —</option>
                {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Ad / Soyad */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Ad <span className="text-red-400">*</span></label>
                <input
                  type="text" required value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Adınız"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Soyad <span className="text-red-400">*</span></label>
                <input
                  type="text" required value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Soyadınız"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Uzmanlık */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Uzmanlık / Çalışma Alanı <span className="text-red-400">*</span>
              </label>
              <input
                type="text" required value={hpSpecialty}
                onChange={e => setHpSpecialty(e.target.value)}
                placeholder="Örn: Dermatoloji, Plastik Cerrahi, Estetik Tıp, Aile Hekimliği..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              />
            </div>

            {/* Kurum (opsiyonel) */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Çalıştığınız Kurum <span className="text-slate-600 text-sm">(opsiyonel)</span>
              </label>
              <input
                type="text" value={hpInstitution}
                onChange={e => setHpInstitution(e.target.value)}
                placeholder="Klinik / hastane / üniversite adı"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              />
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Telefon <span className="text-red-400">*</span>
                <span className="text-slate-500 text-sm ml-2">(SMS doğrulama yapılacak)</span>
              </label>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 text-sm shrink-0 select-none">
                  🇹🇷 <span>+90</span>
                </div>
                <input
                  type="tel" required value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="5xx xxx xx xx"
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                />
              </div>
            </div>

            {/* E-posta */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">E-posta <span className="text-red-400">*</span></label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              />
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">Şifre <span className="text-red-400">*</span></label>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              />
            </div>

            {/* Beyan checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group pt-2">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox" checked={declaration}
                  onChange={e => setDeclaration(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  declaration ? 'bg-emerald-600 border-emerald-600' : 'border-slate-600 group-hover:border-slate-500'
                }`}>
                  {declaration && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-slate-300 text-sm leading-relaxed">
                <strong className="text-white">Sağlık profesyoneli beyanı:</strong> Yukarıda belirttiğim ünvan ve uzmanlık alanında
                aktif olarak çalıştığımı, içerikleri yalnızca eğitim ve mesleki gelişim amacıyla kullanacağımı, yanlış
                beyan halinde hesabımın iptal edileceğini kabul ediyorum.
              </span>
            </label>

            {/* KVKK */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox" checked={kvkk}
                  onChange={e => setKvkk(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  kvkk ? 'bg-emerald-600 border-emerald-600' : 'border-slate-600 group-hover:border-slate-500'
                }`}>
                  {kvkk && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-slate-300 text-sm leading-relaxed">
                <Link href="/hakkinda/sozlesme" target="_blank" className="text-emerald-400 hover:text-emerald-300 underline">
                  Üyelik Sözleşmesi
                </Link>
                &apos;ni ve{' '}
                <Link href="/hakkinda/aydinlatma" target="_blank" className="text-emerald-400 hover:text-emerald-300 underline">
                  KVKK Aydınlatma Metni
                </Link>
                &apos;ni okudum, kabul ediyorum.
              </span>
            </label>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !declaration || !kvkk}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all mt-2"
            >
              {loading ? 'SMS Gönderiliyor...' : 'SMS Doğrulamaya Geç'}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-400 text-sm">
            Zaten hesabın var mı?{' '}
            <Link href="/kurumsal/giris" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
