'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminHesapClient() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (newPassword.length < 6) {
      setMsg({ type: 'err', text: 'Şifre en az 6 karakter olmalı.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'err', text: 'Şifreler eşleşmiyor.' })
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    if (error) {
      setMsg({ type: 'err', text: error.message })
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    setMsg({ type: 'ok', text: 'Şifreniz güncellendi.' })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-slate-400 text-xs mb-1">Yeni şifre</label>
        <input
          type="password"
          required
          minLength={6}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
        />
      </div>
      <div>
        <label className="block text-slate-400 text-xs mb-1">Yeni şifre (tekrar)</label>
        <input
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
        />
      </div>

      {msg && (
        <div
          className={`p-3 rounded-xl text-sm border ${
            msg.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {msg.text}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-all"
      >
        {saving ? 'Güncelleniyor…' : 'Şifreyi Güncelle'}
      </button>
    </form>
  )
}
