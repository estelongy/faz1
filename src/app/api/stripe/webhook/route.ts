import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const clinicId  = session.metadata?.clinic_id
    const jetons    = parseInt(session.metadata?.jetons ?? '0', 10)
    const packageId = session.metadata?.package_id

    if (!clinicId || !jetons) {
      return NextResponse.json({ error: 'Metadata eksik' }, { status: 400 })
    }

    const supabase = await createClient()

    // Atomik jeton artışı — race condition yok
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

  return NextResponse.json({ received: true })
}
