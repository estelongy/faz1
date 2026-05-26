export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const metadata: Metadata = { title: 'KVKK Silme Kayıtları' }

interface LogRow {
  id: string
  user_id: string | null
  action: string
  table_name: string | null
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function KvkkLogPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if ((user.app_metadata as Record<string, string>)?.role !== 'admin') redirect('/panel')

  const sp = await searchParams
  const fromDate = sp.from ?? ''
  const toDate = sp.to ?? ''

  const admin = createServiceClient()
  let q = admin
    .from('audit_logs')
    .select('id, user_id, action, table_name, record_id, old_data, new_data, ip_address, created_at')
    .eq('action', 'gdpr_kvkk_delete')
    .order('created_at', { ascending: false })
    .limit(500)

  if (fromDate) q = q.gte('created_at', `${fromDate}T00:00:00`)
  if (toDate)   q = q.lte('created_at', `${toDate}T23:59:59`)

  const { data: rows } = await q
  const logs = (rows ?? []) as LogRow[]

  // Bu ay kaç silme?
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const thisMonth = logs.filter(l => l.created_at >= monthStart).length

  // Toplam (son 12 ay)
  const total = logs.length

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">KVKK Silme Kayıtları</h1>
          <p className="text-slate-400 text-sm mt-1">
            6698 sayılı KVKK kapsamında veri sahibinin silme talepleri.
            <Link href="/admin/audit" className="ml-2 text-violet-400 hover:text-violet-300 underline">Tam audit log →</Link>
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-500">Bu ay:</span>{' '}
            <span className="text-white font-bold">{thisMonth}</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-500">Toplam:</span>{' '}
            <span className="text-white font-bold">{total}</span>
          </div>
        </div>
      </div>

      {/* Tarih filtresi */}
      <form className="flex flex-wrap gap-2 mb-5" method="get">
        <input type="date" name="from" defaultValue={fromDate}
          className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2" />
        <input type="date" name="to" defaultValue={toDate}
          className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2" />
        <button type="submit"
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-base font-semibold rounded-lg transition-colors">
          Filtrele
        </button>
        {(fromDate || toDate) && (
          <Link href="/admin/kvkk" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-base font-semibold rounded-lg">
            Sıfırla
          </Link>
        )}
      </form>

      {/* Liste */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            Bu aralıkta silme kaydı bulunamadı.
          </div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {logs.map(log => {
              const old = log.old_data as { email?: string; role?: string; full_name?: string; phone?: string } | null
              const newD = log.new_data as { self_initiated?: boolean } | null
              return (
                <li key={log.id} className="p-4 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm px-2 py-0.5 rounded-full font-medium bg-red-500/20 text-red-300">
                          KVKK Silme
                        </span>
                        {newD?.self_initiated ? (
                          <span className="text-sm text-slate-500">Kullanıcı talebi</span>
                        ) : (
                          <span className="text-sm text-amber-400">Admin tarafından</span>
                        )}
                        {old?.role && old.role !== 'user' && (
                          <span className="text-sm px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                            {old.role}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-300">
                        <span className="text-slate-500">E-posta:</span>{' '}
                        <span className="font-mono">{old?.email ?? '—'}</span>
                      </div>
                      {old?.full_name && (
                        <div className="text-sm text-slate-400 mt-0.5">
                          <span className="text-slate-500">Ad:</span> {old.full_name}
                        </div>
                      )}
                      {log.record_id && (
                        <div className="text-sm text-slate-600 font-mono mt-0.5">
                          user_id: {log.record_id}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-slate-500 shrink-0 font-mono">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  {log.ip_address && (
                    <div className="text-sm text-slate-600 font-mono">IP: {log.ip_address}</div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="mt-6 p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-slate-400 space-y-2">
        <p className="font-semibold text-slate-300">📜 KVKK Madde 7 — Unutulma Hakkı</p>
        <p>
          Veri sahibi her zaman kendi verilerinin silinmesini talep edebilir. Estelongy bu talebi
          en geç 30 gün içinde yerine getirir. Bu sayfa, silme kayıtlarının denetim izini sağlar.
        </p>
        <p>
          <strong className="text-slate-300">Mali kayıtlar:</strong> Vergi yasası gereği 5 yıl saklanır,
          ancak kişi bağı koparılarak anonimleştirilir.
        </p>
      </div>
    </div>
  )
}
