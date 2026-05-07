'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PhoneOtpStep from '@/components/PhoneOtpStep'
import { updateProfileAction, deleteAccountAction } from './actions'

interface Props {
  email: string
  firstName: string
  lastName: string
  birthYear: number | null
  phone: string | null
}

export default function HesabimClient({ email, firstName: initialFirst, lastName: initialLast, birthYear: initialBy, phone }: Props) {
  const router = useRouter()

  // Profil state
  const [firstName, setFirstName] = useState(initialFirst)
  const [lastName, setLastName]   = useState(initialLast)
  const [birthYear, setBirthYear] = useState<string>(initialBy?.toString() ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Şifre state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Telefon değiştir state
  const [phoneStep, setPhoneStep] = useState<'idle' | 'enter' | 'otp' | 'done'>('idle')
  const [newPhone, setNewPhone] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // E-posta değiştir state
  const [emailStep, setEmailStep] = useState<'idle' | 'enter' | 'sent'>('idle')
  const [newEmail, setNewEmail] = useState('')
  const [emailErr, setEmailErr] = useState<string | null>(null)
  const [emailSaving, setEmailSaving] = useState(false)

  // Hesap silme onayı
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function formatPhone(raw: string) {
    const d = raw.replace(/\D/g, '')
    if (d.startsWith('90')) return `+${d}`
    if (d.startsWith('0')) return `+90${d.slice(1)}`
    return `+90${d}`
  }

  function startPhoneChange() {
    setPhoneStep('enter')
    setNewPhone('')
    setPhoneError(null)
  }

  function submitNewPhone() {
    setPhoneError(null)
    const digits = newPhone.replace(/\D/g, '')
    if (digits.length < 10) { setPhoneError('Geçerli bir telefon numarası girin'); return }
    setPhoneStep('otp')
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg(null)
    const fd = new FormData()
    fd.set('firstName', firstName)
    fd.set('lastName', lastName)
    if (birthYear) fd.set('birthYear', birthYear)
    const res = await updateProfileAction(fd)
    setProfileSaving(false)
    if (res.ok) {
      setProfileMsg({ type: 'ok', text: 'Profil güncellendi.' })
      router.refresh()
    } else {
      setProfileMsg({ type: 'err', text: res.error ?? 'Hata oluştu' })
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    if (newPassword.length < 8) { setPwMsg({ type: 'err', text: 'Şifre en az 8 karakter olmalı' }); return }
    if (newPassword !== confirmPassword) { setPwMsg({ type: 'err', text: 'Şifreler eşleşmiyor' }); return }
    setPwSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwSaving(false)
    if (error) { setPwMsg({ type: 'err', text: error.message }); return }
    setNewPassword(''); setConfirmPassword('')
    setPwMsg({ type: 'ok', text: 'Şifreniz güncellendi.' })
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault()
    setEmailErr(null)
    const trimmed = newEmail.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailErr('Geçerli bir e-posta girin')
      return
    }
    if (trimmed === email.toLowerCase()) {
      setEmailErr('Yeni e-posta mevcut adresinizle aynı')
      return
    }
    setEmailSaving(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ email: trimmed })
    setEmailSaving(false)
    if (err) {
      setEmailErr(err.message === 'A user with this email address has already been registered'
        ? 'Bu e-posta zaten başka bir hesapta kayıtlı.'
        : err.message)
      return
    }
    setEmailStep('sent')
  }

  async function handleDelete() {
    if (deleteText !== 'SİL') return
    setDeleting(true)
    setDeleteError(null)
    const res = await deleteAccountAction()
    // Başarılıysa zaten redirect olur, buraya düşmez
    if (res && !res.ok) {
      setDeleteError(res.error)
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* PROFİL BİLGİLERİ */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-white font-bold text-lg mb-1">Profil Bilgileri</h2>
        <p className="text-slate-400 text-sm mb-5">Kişisel bilgilerinizi güncelleyin</p>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Ad</label>
              <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Soyad</label>
              <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Doğum Yılı</label>
            <input type="number" min={1900} max={new Date().getFullYear() - 18} value={birthYear} onChange={e => setBirthYear(e.target.value)}
              placeholder={String(new Date().getFullYear() - 30)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">E-posta</label>
            <div className="flex gap-2">
              <input type="email" disabled value={email}
                className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-500 cursor-not-allowed" />
              {emailStep === 'idle' && (
                <button type="button" onClick={() => { setEmailStep('enter'); setNewEmail(''); setEmailErr(null) }}
                  className="px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors">
                  Değiştir
                </button>
              )}
            </div>
            {emailStep === 'enter' && (
              <div className="mt-3 p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
                <p className="text-slate-400 text-xs">
                  Yeni e-posta adresinize bir onay bağlantısı gönderilir. Onaylanana kadar mevcut adresiniz aktif kalır.
                </p>
                <input type="email" value={newEmail} onChange={ev => setNewEmail(ev.target.value)}
                  placeholder="yeni@email.com" autoFocus
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
                {emailErr && <p className="text-red-400 text-sm">{emailErr}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setEmailStep('idle'); setEmailErr(null) }}
                    className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
                    Vazgeç
                  </button>
                  <button type="button" onClick={handleEmailChange} disabled={emailSaving}
                    className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all">
                    {emailSaving ? 'Gönderiliyor…' : 'Onay maili gönder'}
                  </button>
                </div>
              </div>
            )}
            {emailStep === 'sent' && (
              <div className="mt-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
                ✓ <strong>{newEmail}</strong> adresine onay bağlantısı gönderildi. Linke tıkladıktan sonra yeni e-posta aktif olur. Spam&apos;a düşmüş olabilir.
                <button type="button" onClick={() => { setEmailStep('idle'); setNewEmail('') }}
                  className="mt-3 w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors">
                  Tamam
                </button>
              </div>
            )}
          </div>
          {profileMsg && (
            <div className={`p-3 rounded-xl text-sm ${profileMsg.type === 'ok' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
              {profileMsg.text}
            </div>
          )}
          <button type="submit" disabled={profileSaving}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-xl transition-all">
            {profileSaving ? 'Kaydediliyor…' : 'Bilgileri Güncelle'}
          </button>
        </form>
      </section>

      {/* TELEFON */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-white font-bold text-lg mb-1">Telefon</h2>
        <p className="text-slate-400 text-sm mb-5">Bildirimler ve hesap güvenliği için</p>

        {phoneStep === 'idle' && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-700">
            <div>
              <p className="text-slate-500 text-xs">Mevcut numara</p>
              <p className="text-white font-mono">{phone ?? '—'}</p>
            </div>
            <button onClick={startPhoneChange}
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">
              Değiştir
            </button>
          </div>
        )}

        {phoneStep === 'enter' && (
          <div className="space-y-3">
            <p className="text-slate-400 text-sm">Yeni telefon numaranızı girin. SMS ile kod gönderilecek.</p>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 text-sm shrink-0 select-none">
                🇹🇷 <span>+90</span>
              </div>
              <input type="tel" value={newPhone}
                onChange={e => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="5xx xxx xx xx" autoFocus
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
            </div>
            {phoneError && <p className="text-red-400 text-sm">{phoneError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setPhoneStep('idle')}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors">
                Vazgeç
              </button>
              <button onClick={submitNewPhone}
                className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 text-white font-semibold rounded-xl transition-all">
                Kod Gönder →
              </button>
            </div>
          </div>
        )}

        {phoneStep === 'otp' && (
          <PhoneOtpStep
            phone={formatPhone(newPhone)}
            onVerified={() => {
              setPhoneStep('done')
              router.refresh()
            }}
            onBack={() => setPhoneStep('enter')}
          />
        )}

        {phoneStep === 'done' && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
            ✓ Telefon numaranız güncellendi: <span className="font-mono">{formatPhone(newPhone)}</span>
            <button onClick={() => setPhoneStep('idle')}
              className="mt-3 w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
              Tamam
            </button>
          </div>
        )}
      </section>

      {/* ŞİFRE DEĞİŞTİR */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-white font-bold text-lg mb-1">Şifre Değiştir</h2>
        <p className="text-slate-400 text-sm mb-5">En az 6 karakter olmalı</p>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <input type="password" placeholder="Yeni şifre" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} required
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
          <input type="password" placeholder="Yeni şifre (tekrar)" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} required
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
          {pwMsg && (
            <div className={`p-3 rounded-xl text-sm ${pwMsg.type === 'ok' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
              {pwMsg.text}
            </div>
          )}
          <button type="submit" disabled={pwSaving}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-xl transition-all">
            {pwSaving ? 'Güncelleniyor…' : 'Şifreyi Güncelle'}
          </button>
        </form>
      </section>

      {/* HESABI SİL */}
      <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="text-red-300 font-bold text-lg mb-1">Hesabı Kalıcı Sil</h2>
        <p className="text-slate-400 text-sm mb-3">
          KVKK ve GDPR kapsamındaki <strong className="text-slate-300">unutulma hakkınız</strong>:
        </p>
        <ul className="text-slate-400 text-xs space-y-1 mb-5 list-disc pl-5">
          <li><strong className="text-slate-300">Silinir:</strong> Profil, telefon, e-posta, analizler, randevular, skorlar, adresler, sepet, yorumlar (anonimleşir), bildirimler.</li>
          <li><strong className="text-slate-300">Anonim kalır:</strong> Tamamlanmış siparişler, faturalar (vergi mevzuatı 5 yıl saklama zorunlu) — kişisel bağ kopar.</li>
          <li><strong className="text-slate-300">Aktif sipariş varsa:</strong> Önce teslimat/iptal tamamlanmalı.</li>
        </ul>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-semibold rounded-xl transition-colors">
            Hesabımı Sil
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-slate-300 text-sm">Onay için aşağıya <strong className="text-red-400 font-mono">SİL</strong> yazın:</p>
            <input type="text" value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="SİL"
              className="w-full px-4 py-3 bg-slate-900 border border-red-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500" />
            {deleteError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {deleteError}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); setDeleteError(null) }}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors">
                Vazgeç
              </button>
              <button onClick={handleDelete} disabled={deleteText !== 'SİL' || deleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors">
                {deleting ? 'Siliniyor…' : 'Hesabımı Kalıcı Olarak Sil'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
