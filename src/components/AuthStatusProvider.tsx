'use client'

/**
 * Client-side auth status — global, tek fetch, tüm consumer'lara paylaşımlı.
 *
 * Niyet: Galaksi nav'ları (BiyoAGENav, EsteKlinikNav) ve gelecekteki diğer
 * client component'ler her açılışta ayrı ayrı supabase.auth.getUser() çağırıyordu.
 * Sayfa başına 1 round-trip yerine, root layout'ta tek provider — N component → 1 fetch.
 *
 * Kullanım: <AuthStatusProvider> root'a sarılır, içerden useAuthStatus() ile okunur.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

type AuthStatus = {
  isLoggedIn: boolean | null   // null = henüz bilinmiyor (initial mount)
}

const AuthStatusCtx = createContext<AuthStatus>({ isLoggedIn: null })

export function useAuthStatus(): AuthStatus {
  return useContext(AuthStatusCtx)
}

export default function AuthStatusProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!cancelled) setIsLoggedIn(!!user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!cancelled) setIsLoggedIn(!!session?.user)
    })

    return () => { cancelled = true; subscription.unsubscribe() }
  }, [])

  return (
    <AuthStatusCtx.Provider value={{ isLoggedIn }}>
      {children}
    </AuthStatusCtx.Provider>
  )
}
