'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

  // Hesap silme onayı
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)

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
    if (newPassword.length < 6) { setPwMsg({ type: 'err', text: 'Şifre en az 6 karakter olmalı' }); return }
    if (newPassword !== confirmPassword) { setPwMsg({ type: 'err', text: 'Şifreler eşleşmiyor' }); return }
    setPwSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwSaving(false)
    if (error) { setPwMsg({ type: 'err', text: error.message }); return }
    setNewPassword(''); setConfirmPassword('')
    setPwMsg({ type: 'ok', text: 'Şifreniz güncellendi.' })
  }

  async function handleDelete() {
    if (deleteText !== 'SİL') return
    setDeleting(true)
    await deleteAccountAction()
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
            <input type="email" disabled value={email}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-500 cursor-not-allowed" />
            <p className="text-slate-600 text-xs mt-1">E-posta adresinizi değiştirmek için destek ekibiyle iletişime geçin</p>
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
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-700">
          <div>
            <p className="text-slate-500 text-xs">Mevcut numara</p>
            <p className="text-white font-mono">{phone ?? '—'}</p>
          </div>
          <button disabled className="px-4 py-2 rounded-lg bg-slate-700 text-slate-400 text-sm cursor-not-allowed">
            Değiştir (yakında)
          </button>
        </div>
        <p className="text-slate-600 text-xs mt-2">Telefon değişikliği SMS ile doğrulanacak — yakında eklenecek</p>
      </section>

      {/* ŞİFRE DEĞİŞTİR */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-white font-bold text-lg mb-1">Şifre Değiştir</h2>
        <p className="text-slate-400 text-sm mb-5">En az 6 karakter olmalı</p>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <input type="password" placeholder="Yeni şifre" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
          <input type="password" placeholder="Yeni şifre (tekrar)" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} required
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
        <h2 className="text-red-300 font-bold text-lg mb-1">Tehlikeli Bölge</h2>
        <p className="text-slate-400 text-sm mb-5">Hesabınızı silmek geri alınamaz. Tüm verileriniz pasif duruma alınır.</p>
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
            <div className="flex gap-2">
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteText('') }}
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
