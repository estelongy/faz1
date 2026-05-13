export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const metadata: Metadata = { title: 'Audit Log' }

interface LogRow {
  id: string
  user_id: string | null
  action: string
  table_name: string | null
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

const ACTION_LABEL: Record<string, string> = {
  role_change: 'Rol değişimi',
  user_active_toggle: 'Hesap aktif/pasif',
  vendor_approval: 'Satıcı onay',
  vendor_update: 'Satıcı güncelleme',
  clinic_approval: 'Klinik onay',
  clinic_update: 'Klinik güncelleme',
  clinic_credit_grant: 'Kredi yükleme',
  clinic_educator_toggle: 'Eğitmen toggle',
  clinic_educator_decision: 'Eğitmen başvuru kararı',
  product_approval: 'Ürün onay',
  app_settings_update: 'Sistem ayarı',
  gdpr_kvkk_delete: 'KVKK/GDPR silme',
  admin_login_otp: 'Admin OTP doğrulama',
  coupon_create: 'Kupon oluşturma',
  coupon_delete: 'Kupon silme',
}

const ACTION_COLOR: Record<string, string> = {
  gdpr_kvkk_delete:    'bg-red-500/20 text-red-300',
  role_change:         'bg-purple-500/20 text-purple-300',
  vendor_approval:     'bg-emerald-500/20 text-emerald-300',
  clinic_approval:     'bg-emerald-500/20 text-emerald-300',
  product_approval:    'bg-emerald-500/20 text-emerald-300',
  user_active_toggle:  'bg-amber-500/20 text-amber-300',
  clinic_credit_grant:  'bg-blue-500/20 text-blue-300',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('tr-TR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; user?: string; limit?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if ((user.app_metadata as Record<string, string>)?.role !== 'admin') redirect('/panel')

  const sp = await searchParams
  const filterAction = sp.action ?? ''
  const filterUser = sp.user ?? ''
  const limit = Math.min(500, Math.max(20, parseInt(sp.limit ?? '100', 10) || 100))

  // service client — RLS bypass (admin görüntüleme)
  const admin = createServiceClient()
  let q = admin
    .from('audit_logs')
    .select('id, user_id, action, table_name, record_id, old_data, new_data, ip_address, user_agent, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filterAction) q = q.eq('action', filterAction)
  if (filterUser)   q = q.eq('user_id', filterUser)

  const { data: rows } = await q
  const logs = (rows ?? []) as LogRow[]

  // Aktör isimleri için profile lookup
  const actorIds = Array.from(new Set(logs.map(l => l.user_id).filter((x): x is string => !!x)))
  const { data: actorProfiles } = actorIds.length
    ? await admin.from('profiles').select('id, full_name').in('id', actorIds)
    : { data: [] }
  const actorMap = new Map((actorProfiles ?? []).map(p => [p.id, p.full_name ?? '—']))

  const totalCount = logs.length
  const actionTypes = Array.from(new Set(logs.map(l => l.action)))

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-slate-400 text-sm mt-1">
          Kritik admin aksiyonları — son {totalCount} kayıt
        </p>
      </div>

      {/* Filtreler */}
      <form className="flex flex-wrap gap-2 mb-5" method="get">
        <select name="action" defaultValue={filterAction}
          className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500">
          <option value="">Tüm aksiyonlar</option>
          {Object.keys(ACTION_LABEL).map(a => (
            <option key={a} value={a}>{ACTION_LABEL[a]}</option>
          ))}
        </select>
        <input
          name="user"
          defaultValue={filterUser}
          placeholder="Aktör user_id (UUID)"
          className="flex-1 min-w-[220px] bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500 font-mono"
        />
        <select name="limit" defaultValue={String(limit)}
          className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500">
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="200">200</option>
          <option value="500">500</option>
        </select>
        <button type="submit"
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors">
          Filtrele
        </button>
      </form>

      {/* Aksiyon dağılım çipleri */}
      {actionTypes.length > 0 && !filterAction && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {actionTypes.map(a => (
            <span key={a} className={`text-[10px] px-2 py-0.5 rounded-full ${ACTION_COLOR[a] ?? 'bg-slate-700 text-slate-300'}`}>
              {ACTION_LABEL[a] ?? a}
            </span>
          ))}
        </div>
      )}

      {/* Liste */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            Filtreyle eşleşen kayıt yok.
          </div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {logs.map(log => {
              const actorName = log.user_id ? actorMap.get(log.user_id) ?? log.user_id.slice(0, 8) + '…' : '—'
              const actionLabel = ACTION_LABEL[log.action] ?? log.action
              const actionColor = ACTION_COLOR[log.action] ?? 'bg-slate-700 text-slate-300'
              return (
                <li key={log.id} className="p-4 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionColor}`}>
                          {actionLabel}
                        </span>
                        {log.table_name && (
                          <span className="text-xs text-slate-500 font-mono">
                            {log.table_name}{log.record_id ? `#${log.record_id.slice(0, 8)}` : ''}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-300">
                        <span className="text-slate-500">Aktör:</span>{' '}
                        <span className="font-medium">{actorName}</span>
                        {log.user_id && <span className="text-slate-600 font-mono text-xs ml-2">{log.user_id.slice(0, 8)}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0 font-mono">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  {(log.old_data || log.new_data) && (
                    <details className="mt-2">
                      <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300">
                        Değişiklik detayı
                      </summary>
                      <pre className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-400 overflow-x-auto whitespace-pre-wrap">
{JSON.stringify({ old: log.old_data, new: log.new_data }, null, 2)}
                      </pre>
                    </details>
                  )}
                  {log.ip_address && (
                    <div className="text-[10px] text-slate-600 mt-1.5 font-mono">
                      IP: {log.ip_address}
                      {log.user_agent && <span className="ml-3">UA: {log.user_agent.slice(0, 80)}</span>}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Audit kayıtları KVKK denetim için 12 ay saklanır. Daha eskiye erişim için DB üzerinden sorgulayın.
      </p>
    </div>
  )
}
