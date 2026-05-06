export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Satıcılar',
}

type ApprovalStatus = 'pending' | 'approved' | 'rejected'

interface Vendor {
  id: string
  user_id: string
  company_name: string
  tax_number: string | null
  phone: string | null
  approval_status: ApprovalStatus
  is_active: boolean
  balance: number
  stripe_account_id: string | null
  stripe_charges_enabled: boolean | null
  stripe_payouts_enabled: boolean | null
  stripe_details_submitted: boolean | null
  created_at: string
  profiles: { full_name: string | null } | null
}

interface AuthInfo {
  email: string | null
  email_confirmed_at: string | null
  phone_confirmed_at: string | null
  last_sign_in_at: string | null
  created_at: string | null
}

const STATUS_COLOR: Record<ApprovalStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-red-500/20 text-red-400',
}
const STATUS_LABEL: Record<ApprovalStatus, string> = {
  pending: 'Beklemede',
  approved: 'Onaylı',
  rejected: 'Reddedildi',
}

async function updateVendor(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || (user.app_metadata as Record<string, string>)?.role !== 'admin') redirect('/panel')
  const vendorId = formData.get('vendorId') as string
  const status = formData.get('status') as ApprovalStatus
  const isActive = status === 'approved'

  const { data: prev } = await supabase.from('vendors').select('user_id, approval_status').eq('id', vendorId).single()

  await supabase.from('vendors').update({ approval_status: status, is_active: isActive }).eq('id', vendorId)

  if (prev?.user_id) {
    const newRole = status === 'approved' ? 'vendor' : 'user'
    await supabase.rpc('set_user_role', { target_user_id: prev.user_id, new_role: newRole })
  }

  if (status === 'approved' && prev?.approval_status !== 'approved' && prev?.user_id) {
    try {
      const { sendWelcomeEmail } = await import('@/lib/welcome-email')
      const admin = createServiceClient()
      const { data: userRes } = await admin.auth.admin.getUserById(prev.user_id)
      const email = userRes?.user?.email
      const { data: profile } = await admin.from('profiles').select('full_name').eq('id', prev.user_id).single()
      const firstName = profile?.full_name?.split(' ')[0] ?? 'Değerli satıcımız'
      if (email) {
        await sendWelcomeEmail({ to: email, firstName, role: 'vendor' })
      }
    } catch (e) {
      console.error('[admin/saticilar] welcome email gönderilemedi:', e)
    }
  }

  redirect('/admin/saticilar')
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.floor(ms / 60_000)
  const hr = Math.floor(ms / 3_600_000)
  const day = Math.floor(ms / 86_400_000)
  if (min < 1) return 'şimdi'
  if (min < 60) return `${min} dk önce`
  if (hr < 24) return `${hr} sa önce`
  if (day < 30) return `${day} gün önce`
  return new Date(iso).toLocaleDateString('tr-TR')
}

function flagSuspicious(v: Vendor, auth: AuthInfo | undefined): string[] {
  const flags: string[] = []
  if (auth?.email) {
    const handle = auth.email.split('@')[0].toLowerCase()
    if (/(suck|fuck|test|asd|qwe|123|aaa|admin|root)/i.test(handle)) flags.push('Şüpheli e-posta handle')
    if (/^[a-z]{1,4}\d*$/.test(handle)) flags.push('Çok kısa e-posta handle')
  }
  if (v.phone && /^0?5{6,}/.test(v.phone.replace(/\D/g, ''))) flags.push('Sahte telefon (5555…)')
  if (v.tax_number && /^(\d)\1{6,}|1234567|0000000/.test(v.tax_number)) flags.push('Sahte vergi no deseni')
  if (v.tax_number && v.tax_number.length < 10) flags.push('Vergi no eksik basamak')
  const lower = v.company_name.toLowerCase()
  if (/(suck|fuck|sik|amk|orospu|piç|gerizekalı|test\s|asd|qwe)/i.test(lower)) flags.push('Şüpheli firma adı')
  if (auth?.last_sign_in_at && auth?.created_at) {
    const diffSec = (new Date(auth.last_sign_in_at).getTime() - new Date(auth.created_at).getTime()) / 1000
    if (diffSec < 30) flags.push('Kayıt sonrası anında girip kaybolmuş')
  }
  if (!v.stripe_account_id) flags.push('Stripe Connect başlatılmamış')
  return flags
}

export default async function SaticilarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: vendors } = await supabase
    .from('vendors')
    .select(`
      id, user_id, company_name, tax_number, phone, approval_status, is_active, balance,
      stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted,
      created_at,
      profiles(full_name)
    `)
    .order('created_at', { ascending: false })

  const all = (vendors ?? []) as unknown as Vendor[]

  // Auth bilgilerini service client ile çek
  const authMap = new Map<string, AuthInfo>()
  if (all.length > 0) {
    try {
      const admin = createServiceClient()
      await Promise.all(
        all.map(async v => {
          if (!v.user_id) return
          const { data } = await admin.auth.admin.getUserById(v.user_id)
          if (data?.user) {
            authMap.set(v.user_id, {
              email: data.user.email ?? null,
              email_confirmed_at: data.user.email_confirmed_at ?? null,
              phone_confirmed_at: data.user.phone_confirmed_at ?? null,
              last_sign_in_at: data.user.last_sign_in_at ?? null,
              created_at: data.user.created_at ?? null,
            })
          }
        })
      )
    } catch (e) {
      console.error('[admin/saticilar] auth bilgileri çekilemedi:', e)
    }
  }

  const pending = all.filter(v => v.approval_status === 'pending')
  const approved = all.filter(v => v.approval_status === 'approved')
  const rejected = all.filter(v => v.approval_status === 'rejected')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Satıcılar</h1>
        <p className="text-slate-400 text-sm mt-1">Satıcı başvurularını yönetin</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Bekleyen', count: pending.length, color: 'border-amber-500/30 bg-amber-500/10', textColor: 'text-amber-400' },
          { label: 'Onaylı', count: approved.length, color: 'border-emerald-500/30 bg-emerald-500/10', textColor: 'text-emerald-400' },
          { label: 'Reddedildi', count: rejected.length, color: 'border-red-500/30 bg-red-500/10', textColor: 'text-red-400' },
        ].map(({ label, count, color, textColor }) => (
          <div key={label} className={`p-5 rounded-2xl border ${color}`}>
            <div className={`text-3xl font-bold ${textColor}`}>{count}</div>
            <div className="text-slate-400 text-sm mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* ── BEKLEYEN BAŞVURULAR — DETAYLI ───────────────────────── */}
      {pending.length > 0 && (
        <div className="mb-10">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Onay Bekleyen ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map(v => {
              const auth = authMap.get(v.user_id)
              const flags = flagSuspicious(v, auth)
              return (
                <div key={v.id} className="rounded-2xl bg-slate-900 border border-amber-500/20 overflow-hidden">
                  {/* Üst şerit — şüphe bayrakları */}
                  {flags.length > 0 && (
                    <div className="px-5 py-2.5 bg-red-500/10 border-b border-red-500/20 flex items-start gap-2 text-xs">
                      <span className="text-red-400 font-bold shrink-0">⚠ ŞÜPHE:</span>
                      <span className="text-red-300">{flags.join(' · ')}</span>
                    </div>
                  )}

                  <div className="p-5 space-y-4">
                    {/* Başlık */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-bold text-lg">{v.company_name}</h3>
                        <p className="text-slate-400 text-sm">
                          {v.profiles?.full_name ?? 'İsim yok'}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                        {timeAgo(v.created_at)}
                      </span>
                    </div>

                    {/* Bilgi tablosu */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs bg-slate-800/40 border border-slate-700 rounded-xl p-4">
                      <Field label="E-posta" value={auth?.email ?? '—'} verified={!!auth?.email_confirmed_at} />
                      <Field label="Telefon" value={v.phone ?? '—'} verified={!!auth?.phone_confirmed_at} />
                      <Field label="Vergi No" value={v.tax_number ?? '—'} />
                      <Field
                        label="Stripe Connect"
                        value={
                          v.stripe_account_id
                            ? v.stripe_charges_enabled && v.stripe_payouts_enabled
                              ? 'Aktif'
                              : v.stripe_details_submitted
                              ? 'Detaylar gönderildi, onay bekliyor'
                              : 'Onboarding başlamış, eksik'
                            : 'Başlatılmamış'
                        }
                        valueColor={
                          v.stripe_account_id && v.stripe_charges_enabled
                            ? 'text-emerald-400'
                            : v.stripe_account_id
                            ? 'text-amber-400'
                            : 'text-slate-500'
                        }
                      />
                      <Field
                        label="Hesap kayıt"
                        value={auth?.created_at ? timeAgo(auth.created_at) : '—'}
                      />
                      <Field
                        label="Son giriş"
                        value={auth?.last_sign_in_at ? timeAgo(auth.last_sign_in_at) : 'Hiç'}
                      />
                      <Field label="Bakiye" value={`₺${Number(v.balance ?? 0).toLocaleString('tr-TR')}`} />
                      <Field label="Vendor ID" value={v.id.slice(0, 8) + '…'} mono />
                    </div>

                    {/* Aksiyon */}
                    <div className="flex gap-2 pt-2">
                      <form action={updateVendor} className="flex-1">
                        <input type="hidden" name="vendorId" value={v.id} />
                        <input type="hidden" name="status" value="approved" />
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          ✓ Onayla
                        </button>
                      </form>
                      <form action={updateVendor} className="flex-1">
                        <input type="hidden" name="vendorId" value={v.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button
                          type="submit"
                          className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                            flags.length >= 2
                              ? 'bg-red-600 hover:bg-red-500 text-white'
                              : 'bg-red-900/50 hover:bg-red-800/50 text-red-300 border border-red-800/50'
                          }`}
                        >
                          ✕ Reddet
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tablo — özet */}
      <div>
        <h2 className="text-white font-bold mb-4">Tüm Satıcılar ({all.length})</h2>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Şirket</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">E-posta</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Telefon</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Vergi No</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Stripe</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Kayıt</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Durum</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {all.map(v => {
                const auth = authMap.get(v.user_id)
                return (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{v.company_name}</div>
                      <div className="text-slate-500 text-xs">{v.profiles?.full_name ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{auth?.email ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{v.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{v.tax_number ?? '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      {v.stripe_account_id ? (
                        v.stripe_charges_enabled ? (
                          <span className="text-emerald-400">✓ Aktif</span>
                        ) : (
                          <span className="text-amber-400">Eksik</span>
                        )
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(v.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[v.approval_status]}`}>
                        {STATUS_LABEL[v.approval_status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <form action={updateVendor} className="flex gap-1">
                        <input type="hidden" name="vendorId" value={v.id} />
                        <select name="status" defaultValue={v.approval_status}
                          className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-violet-500">
                          <option value="pending">Beklemede</option>
                          <option value="approved">Onayla</option>
                          <option value="rejected">Reddet</option>
                        </select>
                        <button type="submit" className="px-2 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg transition-colors">
                          Kaydet
                        </button>
                      </form>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {all.length === 0 && <div className="text-center py-12 text-slate-500">Henüz satıcı başvurusu yok</div>}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  verified,
  valueColor,
  mono,
}: {
  label: string
  value: string
  verified?: boolean
  valueColor?: string
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-slate-500 shrink-0 w-28">{label}</span>
      <span className={`${valueColor ?? 'text-white'} ${mono ? 'font-mono' : ''} truncate flex-1`}>
        {value}
      </span>
      {verified !== undefined && value !== '—' && (
        <span className={`text-[10px] shrink-0 ${verified ? 'text-emerald-400' : 'text-amber-400'}`}>
          {verified ? '✓ doğrulu' : '⚠ doğrulanmamış'}
        </span>
      )}
    </div>
  )
}
