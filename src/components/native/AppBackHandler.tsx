'use client'

import { useEffect, useState } from 'react'

interface AppPlugin {
  addListener: (event: 'backButton', cb: (data?: { canGoBack?: boolean }) => void) => Promise<{ remove?: () => void }> | { remove?: () => void }
  exitApp?: () => Promise<void>
}

/**
 * Capacitor app içinde Android geri tuşu davranışı.
 *
 * Mantık:
 *  - Sub-page (geri gelinebilecek geçmiş varsa) → history.back()
 *  - Root sayfada (panel/karşılama/giriş) → "Uygulamadan çık?" onay modal
 *  - Modal görünürken geri tuşu → modal'ı kapat
 *
 * Native değilse (web) listener kurulmaz, hiçbir şey yapmaz.
 * Tüm flavor'lar için tek nokta — KlinikPRO + EsteStorePRO + consumer
 * app'ler bu component'ten yararlanır. Sayfa bazlı handler GEREKMEZ.
 */

// Root path'ler — geri tuşu burada exit onay açar (sayfa stack'inin "üstü").
// Path'i 1-1 değil prefix ile karşılaştırırız ki query/hash'e takılmasın.
const ROOT_PATHS = [
  '/satici/karsilama',
  '/satici/panel',         // PRO vendor ev
  '/klinik/panel',         // PRO klinik ev
  '/biyoage',              // consumer ev (BiyoAGE)
  '/esteklinik',           // consumer ev (EsteKlinik)
  '/estestore',            // consumer ev (EsteStore)
  '/giris',
  '/kayit',
  '/',
]

function isRootPath(pathname: string): boolean {
  // ROOT_PATHS'ten birine TAM eşit ya da hemen altındaki "ev" varyantları
  // (örn. /satici/panel ile /satici/panel/ aynı kabul). Alt-route'lar
  // (örn. /satici/panel/siparisler) root sayılmaz — history.back ile geri.
  const clean = pathname.replace(/\/$/, '') || '/'
  return ROOT_PATHS.includes(clean)
}

export default function AppBackHandler() {
  const [showExit, setShowExit] = useState(false)

  useEffect(() => {
    const Cap = (window as unknown as { Capacitor?: { Plugins?: { App?: AppPlugin } } }).Capacitor
    const App = Cap?.Plugins?.App
    if (!App?.addListener) return // web, listener yok

    let handle: { remove?: () => void } | undefined
    Promise.resolve(
      App.addListener('backButton', () => {
        // Modal açıkken back → modal'ı kapat
        if (document.querySelector('[data-app-back-modal="1"]')) {
          setShowExit(false)
          return
        }
        const root = isRootPath(window.location.pathname)
        if (root) {
          setShowExit(true)
        } else if (window.history.length > 1) {
          window.history.back()
        } else {
          // Stack boş + root değil — emniyet, yine de onay göster
          setShowExit(true)
        }
      }),
    )
      .then(h => { handle = h })
      .catch(() => { /* ignore */ })

    return () => { handle?.remove?.() }
  }, [])

  async function confirmExit() {
    const Cap = (window as unknown as { Capacitor?: { Plugins?: { App?: AppPlugin } } }).Capacitor
    try { await Cap?.Plugins?.App?.exitApp?.() } catch { /* noop */ }
  }

  if (!showExit) return null

  return (
    <div
      data-app-back-modal="1"
      className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
    >
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-base font-bold text-white">Uygulamadan çıkılsın mı?</h3>
        <p className="mt-1 text-sm text-slate-400">Estelongy kapatılacak.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowExit(false)}
            className="py-3 rounded-xl border border-slate-700 text-slate-300 font-medium active:bg-slate-800 transition"
          >
            Vazgeç
          </button>
          <button
            onClick={confirmExit}
            className="py-3 rounded-xl bg-amber-400 text-slate-950 font-bold active:bg-amber-500 transition"
          >
            Çık
          </button>
        </div>
      </div>
    </div>
  )
}
