export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import AdminHesapClient from './AdminHesapClient'

export const metadata: Metadata = { title: 'Hesap Ayarları' }

export default async function AdminHesapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if ((user.app_metadata as Record<string, string>)?.role !== 'admin') redirect('/panel')

  // auth.users'tan telefon + e-posta doğrulama bilgileri
  const admin = createServiceClient()
  const { data: authUser } = await admin.auth.admin.getUserById(user.id)
  const phone = authUser?.user?.phone ?? null
  const email = authUser?.user?.email ?? user.email ?? '—'
  const phoneVerified = !!authUser?.user?.phone_confirmed_at
  const emailVerified = !!authUser?.user?.email_confirmed_at
  const lastSignIn = authUser?.user?.last_sign_in_at ?? null

  const masked = phone ? phone.replace(/^(\d{4})\d+(\d{3})$/, '$1*****$2') : null

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Hesap Ayarları</h1>
        <p className="text-slate-400 text-sm mt-1">Admin hesap yönetimi</p>
      </div>

      <div className="space-y-6">
        {/* Hesap özet */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-white font-bold text-base">Hesap Bilgileri</h2>
          <div className="space-y-2 text-sm">
            <Row label="E-posta" value={email} verified={emailVerified} />
            <Row label="Telefon" value={masked ?? 'Tanımlı değil'} verified={phoneVerified} />
            <Row label="Son giriş" value={lastSignIn ? new Date(lastSignIn).toLocaleString('tr-TR') : '—'} />
            <Row label="Rol" value="Admin" />
          </div>
          {!phone && (
            <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              Hesabınızda telefon yok — admin SMS doğrulaması çalışmaz. Yöneticiyle iletişime geçin.
            </div>
          )}
        </section>

        {/* Şifre değiştir */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-base mb-1">Şifre Değiştir</h2>
          <p className="text-slate-500 text-xs mb-4">
            Yeni şifren en az 6 karakter olmalı. Kayıt sonrası SMS OTP zaten ek koruma sağlar — yine de uzun şifre kullanman önerilir.
          </p>
          <AdminHesapClient />
        </section>
      </div>
    </div>
  )
}

function Row({ label, value, verified }: { label: string; value: string; verified?: boolean }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-slate-500 w-28 shrink-0">{label}</span>
      <span className="text-white truncate flex-1">{value}</span>
      {verified !== undefined && value !== '—' && value !== 'Tanımlı değil' && (
        <span className={`text-[10px] shrink-0 ${verified ? 'text-emerald-400' : 'text-amber-400'}`}>
          {verified ? '✓ doğrulandı' : '⚠ doğrulanmamış'}
        </span>
      )}
    </div>
  )
}
