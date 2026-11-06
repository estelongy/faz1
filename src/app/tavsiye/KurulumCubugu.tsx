'use client'

import { useState, useEffect } from 'react'

/**
 * Panel açılışında kurulum çağrısı.
 *
 * Referansör SMS'teki linke basıp paneli açıyor, sonra tarayıcıda bırakıp
 * gidiyordu — her seferinde linki aramak zorunda. "Menü > Ana ekrana ekle"
 * demek yetmiyor, kimse menüyü karıştırmıyor.
 *
 * Chrome `beforeinstallprompt` veriyor: tek düğmeyle kurulur. iOS o olayı
 * vermiyor, orada paylaş menüsü tarif edilir.
 *
 * Uygulama zaten kuruluysa (standalone açıldıysa) hiç görünmez.
 */

type Prompt = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const GIZLE_ANAHTAR = 'tavsiye_kurulum_gizlendi'

export default function KurulumCubugu() {
  const [istem, setIstem] = useState<Prompt | null>(null)
  const [ios, setIos] = useState(false)
  const [gizli, setGizli] = useState(true)

  useEffect(() => {
    // Uygulama olarak açıldıysa kurulum çağrısının anlamı yok.
    const kurulu = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as { standalone?: boolean }).standalone === true
    if (kurulu) return

    // Kullanıcı kapattıysa bir daha rahatsız etme.
    if (localStorage.getItem(GIZLE_ANAHTAR)) return

    const ua = window.navigator.userAgent
    const iphone = /iPad|iPhone|iPod/.test(ua)
    if (iphone) { setIos(true); setGizli(false); return }

    function yakala(e: Event) {
      e.preventDefault()
      setIstem(e as Prompt)
      setGizli(false)
    }
    window.addEventListener('beforeinstallprompt', yakala)
    return () => window.removeEventListener('beforeinstallprompt', yakala)
  }, [])

  if (gizli) return null

  function kapat() {
    localStorage.setItem(GIZLE_ANAHTAR, '1')
    setGizli(true)
  }

  async function kur() {
    if (!istem) return
    await istem.prompt()
    const { outcome } = await istem.userChoice
    if (outcome === 'accepted') setGizli(true)
    setIstem(null)
  }

  return (
    <div className="mb-4 rounded-xl bg-violet-500/10 ring-1 ring-violet-500/40 p-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-violet-500/20 grid place-items-center text-xl">
          📲
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">Paneli telefonunuza kurun</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {ios
              ? 'Alttaki paylaş simgesine basın, listeden “Ana Ekrana Ekle” deyin.'
              : 'Tek dokunuşla ana ekranınıza eklenir, bir daha link aramazsınız.'}
          </p>

          {!ios && (
            <button type="button" onClick={kur}
              className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600
                         hover:bg-violet-500 text-white">
              Ana ekrana ekle
            </button>
          )}
        </div>
        <button type="button" onClick={kapat}
          className="shrink-0 text-slate-500 hover:text-slate-300 text-lg leading-none"
          aria-label="Kapat">
          ✕
        </button>
      </div>
    </div>
  )
}
