import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'

/**
 * Public site header — Akademi, EsteStore, Rehber gibi marketplace sayfalarında kullanılır.
 * Login state'e göre "Hesabım" ya da "Giriş Yap / Kayıt Ol" gösterir.
 * Server component — kullanıcı bilgisi server-side fetch edilir.
 */
export default async function SiteHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user ? (user.app_metadata as Record<string, string>)?.role : null
  const panelHref = role ? pathForRole(role) : '/panel'

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Estelongy
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/estestore" className="hidden sm:flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              🛒 EsteStore
            </Link>
            <Link href="/magaza" className="hidden sm:block text-slate-400 hover:text-white transition-colors">
              EsteStore
            </Link>
            <Link href="/rehber" className="hidden md:block text-slate-400 hover:text-white transition-colors">
              Rehber
            </Link>
            {user ? (
              <Link
                href={panelHref}
                className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all"
              >
                Hesabım
              </Link>
            ) : (
              <>
                <Link href="/giris" className="text-slate-400 hover:text-white transition-colors">
                  Giriş
                </Link>
                <Link
                  href="/kayit"
                  className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
