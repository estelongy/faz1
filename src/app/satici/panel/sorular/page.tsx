export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import SoruKartlari from './SoruKartlari'

export const metadata: Metadata = { title: 'Müşteri Soruları — İş Ortağı' }

export default async function SaticiSorularPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>
}) {
  const { durum } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin' || role === 'clinic') redirect(pathForRole(role))

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name, approval_status')
    .eq('user_id', user.id)
    .single()
  if (!vendor || vendor.approval_status !== 'approved') notFound()

  let query = supabase
    .from('product_questions')
    .select(`
      id, question, answer, answered_at, created_at, is_hidden, asker_user_id,
      product_id, products(id, name, slug)
    `)
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  if (durum === 'bekleyen') query = query.is('answer', null)
  else if (durum === 'yanitli') query = query.not('answer', 'is', null)

  const { data: rawQuestions } = await query.limit(100)

  // Asker profiles
  const askerIds = Array.from(new Set((rawQuestions ?? []).map(q => q.asker_user_id)))
  const { data: askerProfiles } = askerIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', askerIds)
    : { data: [] }
  const askerMap = new Map((askerProfiles ?? []).map(p => [p.id, p.full_name as string | null]))

  const questions = (rawQuestions ?? []).map(q => ({
    id: q.id,
    question: q.question,
    answer: q.answer,
    answered_at: q.answered_at,
    created_at: q.created_at,
    is_hidden: q.is_hidden,
    asker_full_name: askerMap.get(q.asker_user_id) ?? 'Kullanıcı',
    product_id: q.product_id,
    product_name: (q.products as { name?: string } | null)?.name ?? '—',
    product_slug: (q.products as { slug?: string | null } | null)?.slug ?? null,
  }))

  // Sayım
  const { data: allCounts } = await supabase
    .from('product_questions')
    .select('id, answer')
    .eq('vendor_id', vendor.id)
  const pendingCount = (allCounts ?? []).filter(q => !q.answer).length
  const answeredCount = (allCounts ?? []).filter(q => q.answer).length

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-5xl mx-auto px-4 pt-16 lg:pt-10 pb-16 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Müşteri Soruları</h1>
          <p className="text-slate-400 text-base mt-2">
            Yanıtın ürün sayfasında diğer müşterilere de görünür — sosyal kanıt birikir.
          </p>
        </div>

        {/* Durum filtreleri */}
        <div className="flex flex-wrap gap-2">
          <Link href="/satici/panel/sorular"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!durum ? 'bg-[#C9A961] text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            Tümü ({(pendingCount + answeredCount)})
          </Link>
          <Link href="/satici/panel/sorular?durum=bekleyen"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${durum === 'bekleyen' ? 'bg-[#C9A961] text-slate-900' : 'bg-slate-800 text-amber-400 hover:text-white border border-slate-700'}`}>
            ⏳ Bekleyen ({pendingCount})
          </Link>
          <Link href="/satici/panel/sorular?durum=yanitli"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${durum === 'yanitli' ? 'bg-[#C9A961] text-slate-900' : 'bg-slate-800 text-emerald-400 hover:text-white border border-slate-700'}`}>
            ✓ Yanıtlı ({answeredCount})
          </Link>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-slate-400">
              {durum === 'bekleyen' ? 'Bekleyen soru yok 🎉' : 'Henüz soru gelmedi.'}
            </p>
          </div>
        ) : (
          <SoruKartlari questions={questions} />
        )}
      </div>
    </main>
  )
}
