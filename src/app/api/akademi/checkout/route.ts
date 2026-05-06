import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { splitCommission } from '@/lib/akademi'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

/**
 * Akademi paket satın alma — Stripe Checkout Session başlatır.
 *
 * Akış:
 *   1. Auth user kontrolü
 *   2. Paket yayında mı + kullanıcı zaten aldı mı (idempotency)
 *   3. course_purchases satırı oluştur (status='pending')
 *   4. Stripe Checkout Session oluştur, session_id'yi purchases'a yaz
 *   5. Session.url döner; client redirect eder
 *
 * Webhook (checkout.session.completed) → status='paid', paid_at, total_purchases++
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })
    }

    const { package_id } = await req.json() as { package_id?: string }
    if (!package_id) {
      return NextResponse.json({ error: 'Paket ID eksik.' }, { status: 400 })
    }

    // Paketi getir
    const { data: pkg } = await supabase
      .from('course_packages')
      .select('id, slug, title, price, currency, is_published, clinic_id')
      .eq('id', package_id)
      .maybeSingle()

    if (!pkg || !pkg.is_published) {
      return NextResponse.json({ error: 'Paket bulunamadı veya yayında değil.' }, { status: 404 })
    }

    // Zaten satın aldı mı?
    const { data: existing } = await supabase
      .from('course_purchases')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('package_id', pkg.id)
      .in('status', ['paid', 'pending'])
      .maybeSingle()

    if (existing && existing.status === 'paid') {
      return NextResponse.json({ error: 'Bu paketi zaten satın aldınız.' }, { status: 400 })
    }

    const amount = Number(pkg.price)
    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Paket fiyatı geçersiz.' }, { status: 400 })
    }
    const { educator_share, platform_share } = splitCommission(amount)
    const currency = (pkg.currency || 'try').toLowerCase()

    // Pending purchase oluştur (varsa kullan)
    const admin = createServiceClient()
    let purchaseId = existing?.id ?? null

    if (!purchaseId) {
      const { data: created, error: createErr } = await admin
        .from('course_purchases')
        .insert({
          user_id: user.id,
          package_id: pkg.id,
          amount,
          currency: currency.toUpperCase(),
          educator_share,
          platform_share,
          status: 'pending',
        })
        .select('id')
        .single()
      if (createErr || !created) {
        console.error('[Akademi Checkout] purchase insert error:', createErr)
        return NextResponse.json({ error: 'Satın alma kaydı oluşturulamadı.' }, { status: 500 })
      }
      purchaseId = created.id
    }

    const origin = req.headers.get('origin') ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Estelongy Akademi: ${pkg.title}`,
              description: 'Tek seferlik ödeme · Ömür boyu erişim',
            },
            unit_amount: Math.round(amount * 100), // kuruş/cent
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind: 'akademi_purchase',
        purchase_id: purchaseId,
        user_id: user.id,
        package_id: pkg.id,
        clinic_id: pkg.clinic_id,
        educator_share: String(educator_share),
        platform_share: String(platform_share),
      },
      success_url: `${origin}/panel/kurslarim/${pkg.slug}?success=1`,
      cancel_url:  `${origin}/akademi/${pkg.slug}?cancelled=1`,
    })

    // Session ID'yi purchase satırına yaz
    await admin
      .from('course_purchases')
      .update({ stripe_session_id: session.id })
      .eq('id', purchaseId)

    return NextResponse.json({ url: session.url, purchase_id: purchaseId })
  } catch (err) {
    console.error('[Akademi Checkout] error:', err)
    return NextResponse.json({ error: 'Ödeme başlatılamadı.' }, { status: 500 })
  }
}
