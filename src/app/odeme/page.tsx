export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import OdemeFlow from './OdemeFlow'

export const metadata: Metadata = { title: 'Ödeme' }

export default async function OdemePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Login varsa kayıtlı adresleri çek; misafir ise inline adres formu kullanılır.
  const addresses = user
    ? (await supabase
        .from('addresses')
        .select('id, title, full_name, phone, city, district, neighborhood, address_line, postal_code, is_default')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })).data ?? []
    : []

  return (
    <main className="min-h-screen bg-[#FAFAF7]">
      <div className="app-only" aria-hidden style={{ height: 'calc(56px + env(safe-area-inset-top))' }} />
      <header className="web-only fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/sepet" className="text-base font-semibold text-slate-300 hover:text-white transition-colors">
            ← Sepete Dön
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-white text-base font-bold">Ödeme</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-6 lg:pt-24 pb-32 lg:pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-[-0.02em]">Ödemeyi Tamamla</h1>
          <p className="text-base text-slate-600 mt-1">
            Güvenli ödeme — Stripe ile korunuyor. Kart bilgin sunucumuza kaydedilmez.
          </p>
        </div>

        <OdemeFlow initialAddresses={addresses} isGuest={!user} />
      </div>
    </main>
  )
}
