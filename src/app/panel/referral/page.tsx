export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ReferralClient from './ReferralClient'

export default async function ReferralPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  // Referral kodu al (yoksa üret)
  const { data: codeData } = await supabase.rpc('generate_referral_code', { p_user_id: user.id })
  const code = codeData as string

  // Kullanım istatistikleri
  const { data: refCode } = await supabase
    .from('referral_codes')
    .select('id, code, total_uses, total_earnings, created_at')
    .eq('user_id', user.id)
    .single()

  const { data: uses } = await supabase
    .from('referral_uses')
    .select('id, commission_amount, status, created_at')
    .eq('referral_code_id', refCode?.id ?? '')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/panel" className="text-slate-400 hover:text-white transition-colors text-sm">← Panelim</Link>
            <span className="text-slate-700">|</span>
            <span className="text-white font-bold text-sm">Davet & Kazanç</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Arkadaşını Davet Et</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Referans kodunu paylaş. Arkadaşın sipariş verince sen kazanırsın.
          </p>
        </div>

        <ReferralClient
          code={code ?? ''}
          totalUses={refCode?.total_uses ?? 0}
          totalEarnings={Number(refCode?.total_earnings ?? 0)}
          uses={(uses ?? []).map(u => ({
            id: u.id,
            commissionAmount: Number(u.commission_amount ?? 0),
            status: u.status,
            createdAt: u.created_at,
          }))}
        />
      </div>
    </main>
  )
}
