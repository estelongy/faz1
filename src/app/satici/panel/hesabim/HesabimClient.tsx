'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PhoneOtpStep from '@/components/PhoneOtpStep'
import { deleteVendorAccountAction } from './actions'

interface Props {
  email: string
  phone: string | null
  companyName: string
}

export default function HesabimClient({ email, phone, companyName }: Props) {
  const router = useRouter()

  // Şifre
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Telefon
  const [phoneStep, setPhoneStep] = useState<'idle' | 'enter' | 'otp' | 'done'>('idle')
  const [newPhone, setNewPhone] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // E-posta
  const [emailStep, setEmailStep] = useState<'idle' | 'enter' | 'sent'>('idle')
  const [newEmail, setNewEmail] = useState('')
  const [emailErr, setEmailErr] = useState<string | null>(null)
  const [emailSaving, setEmailSaving] = useState(false)

  // Hesap silme
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setEmailErr('Geçerli bir e-posta girin'); return }
    if (trimmed === email.toLowerCase()) { setEmailErr('Yeni e-posta mevcut adresinizle aynı'); return }
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

  function submitNewPhone() {
    setPhoneError(null)
    const digits = newPhone.replace(/\D/g, '')
    if (digits.length < 10) { setPhoneError('Geçerli bir telefon numarası girin'); return }
    setPhoneStep('otp')
  }

  async function handleDelete() {
    if (deleteText !== 'SİL') return
    setDeleting(true)
    setDeleteError(null)
    const res = await deleteVendorAccountAction()
    if (res && !res.ok) {
      setDeleteError(res.error)
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Hesap kimliği — read-only özet */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-white font-bold text-lg mb-1">Hesap Bilgileri</h2>
        <p className="text-slate-400 text-sm mb-5">Firma adı KYC&apos;den değişir. Email/telefon/şifre bu sayfadan.</p>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Firma</p>
            <p className="text-white font-semibold">{companyName || '—'}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">E-posta</p>
            <p className="text-white font-mono text-sm truncate">{email || '—'}</p>
          </div>
        </div>
      </section>

      {/* E-POSTA */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-white font-bold text-lg mb-1">E-posta Adresi</h2>
        <p className="text-slate-400 text-sm mb-5">Bildirimler ve giriş için kullanılır</p>

        {emailStep === 'idle' && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-700 flex-wrap gap-3">
            <div className="min-w-0">
              <p className="text-slate-500 text-sm">Mevcut</p>
              <p className="text-white font-mono text-sm truncate">{email}</p>
            </div>
            <button onClick={() => { setEmailStep('enter'); setNewEmail(''); setEmailErr(null) }}
              className="px-4 py-2 rounded-lg bg-[#C9A961] hover:bg-[#B8964F] text-white text-base font-semibold transition-colors">
              Değiştir
            </button>
          </div>
        )}

        {emailStep === 'enter' && (
          <div className="space-y-3">
            <p className="text-slate-400 text-sm">
              Yeni e-posta adresinize bir onay bağlantısı gönderilir. Onaylanana kadar mevcut adresiniz aktif kalır.
            </p>
            <input type="email" value={newEmail} onChange={ev => setNewEmail(ev.target.value)}
              placeholder="yeni@email.com" autoFocus
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A961] transition-colors" />
            {emailErr && <p className="text-red-400 text-sm">{emailErr}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setEmailStep('idle'); setEmailErr(null) }}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors">
                Vazgeç
              </button>
              <button type="button" onClick={handleEmailChange} disabled={emailSaving}
                className="flex-1 py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-xl transition-all">
                {emailSaving ? 'Gönderiliyor…' : 'Onay maili gönder'}
              </button>
            </div>
          </div>
        )}

        {emailStep === 'sent' && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
            ✓ <strong>{newEmail}</strong> adresine onay bağlantısı gönderildi. Linke tıkladıktan sonra yeni e-posta aktif olur.
            <button type="button" onClick={() => { setEmailStep('idle'); setNewEmail('') }}
              className="mt-3 w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
              Tamam
            </button>
          </div>
        )}
      </section>

      {/* TELEFON */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-white font-bold text-lg mb-1">Telefon</h2>
        <p className="text-slate-400 text-sm mb-5">SMS bildirimleri ve hesap güvenliği için</p>

        {phoneStep === 'idle' && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-700">
            <div>
              <p className="text-slate-500 text-sm">Mevcut numara</p>
              <p className="text-white font-mono">{phone ?? '—'}</p>
            </div>
            <button onClick={() => { setPhoneStep('enter'); setNewPhone(''); setPhoneError(null) }}
              className="px-4 py-2 rounded-lg bg-[#C9A961] hover:bg-[#B8964F] text-white text-base font-semibold transition-colors">
              {phone ? 'Değiştir' : 'Ekle'}
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
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A961]" />
            </div>
            {phoneError && <p className="text-red-400 text-sm">{phoneError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setPhoneStep('idle')}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors">
                Vazgeç
              </button>
              <button onClick={submitNewPhone}
                className="flex-1 py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:opacity-90 text-white font-semibold rounded-xl transition-all">
                Kod Gönder →
              </button>
            </div>
          </div>
        )}

        {phoneStep === 'otp' && (
          <PhoneOtpStep
            phone={formatPhone(newPhone)}
            onVerified={() => { setPhoneStep('done'); router.refresh() }}
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

      {/* ŞİFRE */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-white font-bold text-lg mb-1">Şifre Değiştir</h2>
        <p className="text-slate-400 text-sm mb-5">En az 8 karakter olmalı</p>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <input type="password" placeholder="Yeni şifre" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} required
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A961] transition-colors" />
          <input type="password" placeholder="Yeni şifre (tekrar)" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} required
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A961] transition-colors" />
          {pwMsg && (
            <div className={`p-3 rounded-xl text-sm ${pwMsg.type === 'ok' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
              {pwMsg.text}
            </div>
          )}
          <button type="submit" disabled={pwSaving}
            className="w-full py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-xl transition-all">
            {pwSaving ? 'Güncelleniyor…' : 'Şifreyi Güncelle'}
          </button>
        </form>
      </section>

      {/* HESABI SİL — KVKK */}
      <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="text-red-300 font-bold text-lg mb-1">Hesabı Kalıcı Sil</h2>
        <p className="text-slate-400 text-sm mb-3">
          KVKK Madde 7 (Unutulma Hakkı) kapsamında satıcı hesabınızı kapatma:
        </p>
        <ul className="text-slate-400 text-sm space-y-1 mb-5 list-disc pl-5">
          <li><strong className="text-slate-300">Mağaza pasifleşir:</strong> Ürünleriniz vitrinden kalkar, yeni siparişler durur.</li>
          <li><strong className="text-slate-300">Anonim kalır:</strong> Tamamlanan siparişler ve faturalar (vergi 5 yıl saklama) — kişisel bağ kopar.</li>
          <li><strong className="text-slate-300">Aktif sipariş varsa:</strong> Önce teslimat veya iade tamamlanmalı.</li>
          <li><strong className="text-slate-300">Bakiyenizin ödenmesi:</strong> Stripe payout&apos;u tamamlanmalı.</li>
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
                {deleting ? 'Siliniyor…' : 'Kalıcı Olarak Sil'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
