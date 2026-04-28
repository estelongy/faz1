export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import HesabimClient from './HesabimClient'

export const metadata: Metadata = {
  title: 'Hesabım — Estelongy',
}

export default async function HesabimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role && role !== 'user') redirect(pathForRole(role))

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, birth_year, phone')
    .eq('id', user.id)
    .single()

  const [firstName, ...rest] = (profile?.full_name ?? '').split(' ')
  const lastName = rest.join(' ')

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/panel" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Panel
          </Link>
          <span className="text-white font-bold text-sm">Hesabım</span>
          <span className="w-12" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <HesabimClient
          email={user.email ?? ''}
          firstName={firstName ?? ''}
          lastName={lastName ?? ''}
          birthYear={profile?.birth_year ?? null}
          phone={profile?.phone ?? user.phone ?? null}
        />
      </div>
    </main>
  )
}
