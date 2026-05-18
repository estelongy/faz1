export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'EP Yönetimi — Admin' }

export default async function AdminEpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  const role = (user.app_metadata as Record<string, string>)?.role
  if (role !== 'admin') redirect('/panel')

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, category, ep_score, ep_baz, ep_belge_seviye, ep_review_count, is_active, approval_status')
    .eq('approval_status', 'approved')
    .order('ep_score', { ascending: false, nullsFirst: false })
    .limit(200)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">EP Yönetimi</h1>
        <p className="text-slate-400 text-sm mt-1">
          Estelongy Puanı — Onaylı {products?.length ?? 0} ürün · belge, sahte tespiti, yeniden hesaplama
        </p>
      </div>

      <div className="bg-slate-800/30 border border-slate-700 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3 font-bold">Ürün</th>
              <th className="text-center px-4 py-3 font-bold">EP</th>
              <th className="text-center px-4 py-3 font-bold">Baz</th>
              <th className="text-center px-4 py-3 font-bold">Belge</th>
              <th className="text-center px-4 py-3 font-bold">Oy</th>
              <th className="text-center px-4 py-3 font-bold">Durum</th>
              <th className="text-right px-4 py-3 font-bold">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {products?.map(p => (
              <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-white font-medium">{p.name}</div>
                  <div className="text-slate-500 text-xs">{p.category ?? '—'}</div>
                </td>
                <td className="text-center px-4 py-3">
                  <span className={`font-black text-base ${
                    (p.ep_score ?? 0) >= 9 ? 'text-emerald-400' :
                    (p.ep_score ?? 0) >= 7 ? 'text-amber-400' :
                    (p.ep_score ?? 0) >= 5 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {p.ep_score != null ? Number(p.ep_score).toFixed(2) : '—'}
                  </span>
                </td>
                <td className="text-center px-4 py-3 text-slate-300">
                  {p.ep_baz != null ? Number(p.ep_baz).toFixed(2) : '—'}
                </td>
                <td className="text-center px-4 py-3">
                  <span className="text-slate-300">{p.ep_belge_seviye ?? 0}/5</span>
                </td>
                <td className="text-center px-4 py-3 text-slate-400">
                  {p.ep_review_count ?? 0}
                </td>
                <td className="text-center px-4 py-3">
                  {p.is_active ? (
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Aktif</span>
                  ) : (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Pasif</span>
                  )}
                </td>
                <td className="text-right px-4 py-3">
                  <Link href={`/admin/ep/${p.id}`}
                    className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg font-bold transition-colors">
                    Yönet →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
