import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import SaticiSidebar from '@/components/SaticiSidebar'
import AppTopSpacer from '@/components/native/AppTopSpacer'
import { getVendorPerformance } from '@/lib/vendor-performance'

export default async function SaticiPanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin' || role === 'clinic') redirect(pathForRole(role))

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name, approval_status, kyc_status')
    .eq('user_id', user.id)
    .maybeSingle()

  // Vendor yok veya henüz onaylı değil → sidebar gösterme, sayfa kendi başvuru/KYC ekranını render etsin
  const showSidebar = !!(vendor && vendor.approval_status === 'approved')

  if (!showSidebar) {
    return (
      <>
        <AppTopSpacer />
        {children}
      </>
    )
  }

  // Badge sayıları — paralel
  const [pendingOrdersRes, returnsRes, questionsRes, productsRes] = await Promise.all([
    supabase
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendor!.id)
      .eq('fulfillment_status', 'pending'),
    supabase
      .from('returns')
      .select('id, order_items!inner(vendor_id)', { count: 'exact', head: true })
      .eq('order_items.vendor_id', vendor!.id)
      .eq('status', 'pending'),
    supabase
      .from('product_questions')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendor!.id)
      .is('answer', null)
      .eq('is_hidden', false),
    supabase
      .from('products')
      .select('id')
      .eq('vendor_id', vendor!.id),
  ])

  const productIds = (productsRes.data ?? []).map(p => p.id as string)
  let openReviews = 0
  if (productIds.length > 0) {
    const { count } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .in('product_id', productIds)
      .is('vendor_response', null)
    openReviews = count ?? 0
  }

  const perf = await getVendorPerformance(vendor!.id)

  const counts = {
    pendingOrders:  pendingOrdersRes.count ?? 0,
    returnRequests: returnsRes.count ?? 0,
    openQuestions:  questionsRes.count ?? 0,
    openReviews,
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <SaticiSidebar
        companyName={vendor!.company_name ?? 'İş Ortağı'}
        approvalStatus={vendor!.approval_status ?? 'pending'}
        performanceLetter={perf.letter}
        performanceScore={perf.totalScore}
        counts={counts}
      />
      <div className="lg:pl-[72px]">
        <AppTopSpacer />
        <main className="satici-panel-main p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
