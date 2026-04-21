import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

// ── Resend e-posta gönderici ──────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return // Henüz yapılandırılmamış
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL ?? 'noreply@estelongy.com',
      to,
      subject,
      html,
    }),
  })
}

// ── Düşük stok bildirimi ──────────────────────────────────────────────
const LOW_STOCK_THRESHOLD = 5

async function checkLowStock(admin: ReturnType<typeof createServiceClient>, productId: string) {
  const { data: product } = await admin
    .from('products')
    .select('id, name, stock, vendor_id, vendors(user_id, company_name)')
    .eq('id', productId)
    .single()

  if (!product) return
  const stock = product.stock ?? 0
  if (stock > LOW_STOCK_THRESHOLD) return

  // Satıcı e-postasını auth.users'dan al
  const vendorInfo = product.vendors as { user_id?: string; company_name?: string } | null
  if (!vendorInfo?.user_id) return

  const { data: userData } = await admin.auth.admin.getUserById(vendorInfo.user_id)
  const vendorEmail = userData?.user?.email
  if (!vendorEmail) return

  const subject = stock === 0
    ? `[Estelongy] Stok Bitti: ${product.name}`
    : `[Estelongy] Düşük Stok Uyarısı: ${product.name}`

  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2 style="color:#7c3aed">${subject}</h2>
      <p>Merhaba ${vendorInfo.company_name ?? 'Satıcı'},</p>
      <p>
        <strong>${product.name}</strong> ürününün stoğu
        <strong style="color:${stock === 0 ? '#ef4444' : '#f59e0b'}">${stock} adet</strong>
        kaldı.
      </p>
      ${stock === 0
        ? '<p>Ürün artık satışta görünmüyor. Lütfen stoku güncelleyin.</p>'
        : '<p>Müşteri kaybı yaşamamak için stoku güncellemenizi öneririz.</p>'}
      <a href="https://estelongy-clean.vercel.app/satici/panel"
         style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none">
        Satıcı Paneline Git
      </a>
    </div>
  `

  await sendEmail(vendorEmail, subject, html)
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret eksik' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ─── Jeton Ödemesi (Checkout Session) ────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const clinicId  = session.metadata?.clinic_id
    const jetons    = parseInt(session.metadata?.jetons ?? '0', 10)
    const packageId = session.metadata?.package_id

    if (clinicId && jetons) {
      const supabase = createServiceClient()
      const { error } = await supabase.rpc('add_jeton', {
        p_clinic_id:      clinicId,
        p_amount:         jetons,
        p_description:    `Stripe ödeme: ${packageId} (${session.id})`,
        p_stripe_session: session.id,
      })
      if (error) {
        console.error('add_jeton RPC error:', error)
        return NextResponse.json({ error: 'Jeton güncellenemedi' }, { status: 500 })
      }
    }
  }

  // ─── Marketplace Sipariş Ödemesi (Payment Intent) ────────────────
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    if (pi.metadata?.kind === 'marketplace_order') {
      const orderId = pi.metadata.order_id
      if (!orderId) {
        console.error('Order ID metadata eksik')
        return NextResponse.json({ error: 'Metadata eksik' }, { status: 400 })
      }

      const admin = createServiceClient()

      // İdempotent: zaten paid ise geç
      const { data: existing } = await admin
        .from('orders')
        .select('id, payment_status')
        .eq('id', orderId)
        .single()
      if (!existing) {
        console.error('Sipariş bulunamadı:', orderId)
        return NextResponse.json({ error: 'Sipariş yok' }, { status: 404 })
      }
      if (existing.payment_status === 'paid') {
        return NextResponse.json({ received: true, note: 'already paid' })
      }

      // Paid olarak işaretle
      await admin
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      // Stok düşüm + düşük stok bildirimi
      const { data: items } = await admin
        .from('order_items')
        .select('id, product_id, quantity, vendor_id, vendor_payout, vendors(stripe_account_id, stripe_charges_enabled)')
        .eq('order_id', orderId)

      if (items) {
        // Stok düşüm
        for (const it of items) {
          if (!it.product_id) continue
          await admin.rpc('decrement_product_stock', {
            p_product_id: it.product_id,
            p_amount: it.quantity,
          })
          // Düşük stok kontrolü (hata durumunda sessizce geç)
          try {
            await checkLowStock(admin, it.product_id)
          } catch (e) {
            console.error('Low stock check error:', e)
          }
        }

        // ── Çoklu satıcı transferleri ────────────────────────────
        // Destination charge kullanılmadıysa (çoklu satıcı / Connect aktif değil)
        // platform hesabından her satıcıya manual transfer.
        // Destination charge varsa (tek satıcı) Stripe bunu otomatik yapar.
        const hasDestinationCharge = !!pi.transfer_data?.destination

        if (!hasDestinationCharge) {
          // Vendor → payout toplamı
          const vendorPayouts: Record<string, { stripeAccountId: string; amount: number }> = {}
          for (const it of items) {
            const vendorInfo = it.vendors as {
              stripe_account_id?: string | null
              stripe_charges_enabled?: boolean | null
            } | null
            if (!vendorInfo?.stripe_account_id || !vendorInfo.stripe_charges_enabled) continue
            const stripeAccId = vendorInfo.stripe_account_id
            const payout = Math.round(Number(it.vendor_payout ?? 0) * 100) // kuruş

            if (!vendorPayouts[stripeAccId]) {
              vendorPayouts[stripeAccId] = { stripeAccountId: stripeAccId, amount: 0 }
            }
            vendorPayouts[stripeAccId].amount += payout
          }

          for (const [, v] of Object.entries(vendorPayouts)) {
            if (v.amount <= 0) continue
            try {
              await stripe.transfers.create({
                amount: v.amount,
                currency: 'try',
                destination: v.stripeAccountId,
                source_transaction: pi.latest_charge as string,
                metadata: {
                  order_id: orderId,
                  order_number: pi.metadata.order_number ?? '',
                },
              })
            } catch (transferErr) {
              console.error(`Transfer hatası (${v.stripeAccountId}):`, transferErr)
              // Transfer başarısız — loglama yeterli, ödeme tamamlandı sayılır
            }
          }
        }
      }

      // Kupon kullanım sayısı artır
      const { data: paidOrder } = await admin
        .from('orders')
        .select('coupon_code, referral_code, user_id, total')
        .eq('id', orderId)
        .single()

      if (paidOrder?.coupon_code) {
        const { data: coup } = await admin
          .from('coupons')
          .select('used_count')
          .eq('code', paidOrder.coupon_code)
          .single()
        if (coup) {
          await admin.from('coupons')
            .update({ used_count: (coup.used_count ?? 0) + 1 })
            .eq('code', paidOrder.coupon_code)
        }
      }

      // Referral komisyonu: first purchase için %5
      if (paidOrder?.referral_code && paidOrder?.user_id) {
        try {
          const { data: refCode } = await admin
            .from('referral_codes')
            .select('id, user_id, total_uses, total_earnings')
            .eq('code', paidOrder.referral_code)
            .single()
          if (refCode) {
            const commission = Math.round(Number(paidOrder.total) * 0.05 * 100) / 100
            // Yeni kullanım ekle (idempotent)
            await admin.from('referral_uses').upsert({
              referral_code_id: refCode.id,
              referred_user_id: paidOrder.user_id,
              order_id: orderId,
              commission_amount: commission,
              status: 'pending',
            }, { onConflict: 'referral_code_id,referred_user_id', ignoreDuplicates: true })
            // Toplam güncelle
            await admin.from('referral_codes').update({
              total_uses: (refCode.total_uses ?? 0) + 1,
              total_earnings: Number(refCode.total_earnings ?? 0) + commission,
            }).eq('id', refCode.id)
          }
        } catch (e) {
          console.error('Referral tracking error:', e)
        }
      }

      console.log(`Sipariş ödendi: ${orderId} (${pi.metadata.order_number})`)
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent
    if (pi.metadata?.kind === 'marketplace_order' && pi.metadata.order_id) {
      const admin = createServiceClient()
      await admin
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', pi.metadata.order_id)
    }
  }

  // ─── Connect Account Güncellendi ─────────────────────────────────
  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account
    const admin = createServiceClient()
    await admin
      .from('vendors')
      .update({
        stripe_charges_enabled:   !!account.charges_enabled,
        stripe_payouts_enabled:   !!account.payouts_enabled,
        stripe_details_submitted: !!account.details_submitted,
      })
      .eq('stripe_account_id', account.id)
  }

  return NextResponse.json({ received: true })
}
