'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStatus } from '@/components/AuthStatusProvider'

/**
 * Cold-start auth race düzeltmesi.
 *
 * Capacitor app'i kapalı kalınca access_token'ı süresi dolabilir. Cold-start'ta
 * ilk server render'ı dolmuş token'la çalışır → `user=null` → kişiselleştirilmiş
 * içerik (reorder, "Merhaba X") render edilmez. Client tarafı ise mount'tan sonra
 * token'ı otomatik tazeler.
 *
 * Bu bileşen: server GUEST render ettiyse (serverAuthed=false) ama client'ta
 * oturum VARSA (isLoggedIn=true), tam bir kez `router.refresh()` çağırır → server
 * componentleri tazelenmiş cookie ile yeniden render edilir, kişisel içerik gelir.
 * Tek seferlik (done ref) → döngü yok. Gerçek guest'te isLoggedIn=false → no-op.
 */
export default function AuthRefreshGate({ serverAuthed }: { serverAuthed: boolean }) {
  const { isLoggedIn } = useAuthStatus()
  const router = useRouter()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    if (!serverAuthed && isLoggedIn === true) {
      done.current = true
      router.refresh()
    }
  }, [serverAuthed, isLoggedIn, router])

  return null
}
