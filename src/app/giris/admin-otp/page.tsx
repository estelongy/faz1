import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminOtpVerified } from '@/lib/admin-otp'
import AdminOtpForm from './AdminOtpForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin Doğrulama — Estelongy',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ next?: string }>
}

export default async function AdminOtpPage({ searchParams }: Props) {
  const { next } = await searchParams
  const safeNext = next && next.startsWith('/admin') ? next : '/admin'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris?next=' + encodeURIComponent(safeNext))

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role !== 'admin') redirect('/panel')

  // Zaten OTP doğrulanmışsa direkt admin'e gönder
  if (await isAdminOtpVerified(user.id)) {
    redirect(safeNext)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-amber-500/30">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <p className="inline-block px-2.5 py-0.5 mb-3 text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full">
              Ek Güvenlik
            </p>
            <h1 className="text-2xl font-bold text-white">Admin Doğrulama</h1>
            <p className="text-slate-400 text-sm mt-2">
              Yönetici paneline girmek için kayıtlı telefonunuza gönderilen kodu girin.
            </p>
          </div>

          <AdminOtpForm next={safeNext} />

          <div className="mt-6 pt-4 border-t border-slate-700 text-center">
            <p className="text-slate-500 text-xs">
              Bu adım her admin oturumu için bir kez gereklidir. Doğrulama 30 dakika geçerlidir.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
