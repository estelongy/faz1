'use client'

/**
 * Selfie analizi öncesi açık rıza ekranı (KVKK m.6/2 — açık rıza).
 * Tek seferlik consent log (versiyon bazlı). Onay sonrası `onGranted` çağrılır.
 *
 * Gösterim:
 *  - mount'ta /api/consent?scope=selfie_ai_analiz çağrısı → granted ise hiç render etmez
 *  - granted değilse modal göster, kullanıcı onayla → POST /api/consent → onGranted
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Props {
  /** Onay alındığında veya zaten varsa çağrılır (idempotent). */
  onGranted: () => void
  /** Reddedilirse veya kapatılırsa çağrılır. Default: hiçbir şey. */
  onDeclined?: () => void
}

type Phase = 'loading' | 'gate' | 'submitting' | 'granted' | 'error'

export default function SelfieConsentGate({ onGranted, onDeclined }: Props) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [checked, setChecked] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/consent?scope=selfie_ai_analiz', { credentials: 'same-origin' })
      .then(r => r.json())
      .then((data: { granted?: boolean; error?: string }) => {
        if (data.granted) {
          setPhase('granted')
          onGranted()
        } else {
          setPhase('gate')
        }
      })
      .catch(() => setPhase('gate')) // fail-open UI; API tekrar denenecek
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (phase === 'loading' || phase === 'granted') return null

  async function submit(granted: boolean) {
    setPhase('submitting')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'selfie_ai_analiz', granted }),
        credentials: 'same-origin',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      if (granted) {
        setPhase('granted')
        onGranted()
      } else {
        setPhase('gate')
        onDeclined?.()
      }
    } catch (err) {
      setPhase('error')
      setErrorMsg(err instanceof Error ? err.message : 'Kayıt başarısız')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Selfie analizi için açık rıza"
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="text-3xl shrink-0">📸</div>
            <div className="min-w-0">
              <h2 className="text-slate-900 font-bold text-lg leading-tight">
                Selfie analizi için açık rıza
              </h2>
              <p className="text-slate-500 text-sm mt-0.5">
                KVKK madde 6/2 kapsamında — özel nitelikli kişisel veri
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-700 leading-relaxed mb-5">
            <p>
              Yüzünüzün fotoğrafı <strong>özel nitelikli kişisel veridir</strong>. Analiz için fotoğrafınız
              hizmet sağlayıcımız <strong>OpenAI (ABD)</strong> üzerinden işlenir. Bu işleme yalnızca açık
              rızanızla yapılır.
            </p>
            <ul className="list-disc list-outside pl-5 space-y-1 text-slate-600">
              <li>Fotoğraf analiz dışında bir amaçla kullanılmaz, üçüncü taraflara satılmaz.</li>
              <li>İşlenmiş bileşen skorları hesabınıza kayıtlı kalır; ham fotoğraf 12 ay sonra silinir.</li>
              <li>Açık rızanızı her zaman <Link href="/panel/hesabim" className="text-violet-700 hover:text-violet-800 underline">hesap ayarlarınızdan</Link> geri alabilirsiniz.</li>
              <li>
                Detaylı bilgi için{' '}
                <Link href="/hakkinda/aydinlatma" className="text-violet-700 hover:text-violet-800 underline">aydınlatma metni</Link>.
              </li>
            </ul>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-violet-600 shrink-0"
            />
            <span className="text-sm text-slate-700">
              Yukarıdaki bilgilendirmeyi okudum ve selfie fotoğrafımın yukarıda açıklanan kapsamda
              işlenmesine <strong>açık rıza</strong> veriyorum.
            </span>
          </label>

          {errorMsg && (
            <p className="text-red-700 text-sm mb-3" role="alert">
              {errorMsg}. Lütfen tekrar deneyin.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={!checked || phase === 'submitting'}
              className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {phase === 'submitting' ? 'Kaydediliyor…' : 'Onaylıyorum ve analize başla'}
            </button>
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={phase === 'submitting'}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold transition-colors"
            >
              Vazgeç
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
