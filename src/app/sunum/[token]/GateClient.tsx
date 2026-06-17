'use client'

import { useState } from 'react'
import DeckClient from './DeckClient'

const PASSWORD = 'Estelongy2026'

const GOLD = '#C9A961'
const GOLD_DEEP = '#8B7339'
const BG = '#0A0F1A'
const CREAM = '#F5F1E8'

export default function GateClient() {
  const [unlocked, setUnlocked] = useState(false)
  const [mode, setMode] = useState<'choice' | 'password'>('choice')
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  if (unlocked) return <DeckClient />

  function tryUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (input === PASSWORD) {
      setUnlocked(true)
    } else {
      setError(true)
    }
  }

  return (
    <div
      style={{ background: BG, color: CREAM }}
      className="min-h-screen w-full flex items-center justify-center px-6 py-12"
    >
      <div className="w-full max-w-2xl text-center">
        <div className="mb-6 text-sm tracking-[0.5em] font-light" style={{ color: GOLD_DEEP }}>
          ZAMANSIZ GÜZELLİK MİMARLIĞI
        </div>

        <h1 className="font-light leading-none mb-6"
          style={{ fontSize: 'clamp(48px, 7vw, 96px)', color: CREAM, letterSpacing: '-0.04em' }}>
          Estelongy
        </h1>

        <div className="h-px w-24 mx-auto mb-8" style={{ background: GOLD }} />

        <p className="text-lg md:text-xl font-light mb-2" style={{ color: CREAM, opacity: 0.85 }}>
          Bilimi güzelliğe dönüştüren ölçüm, kanıt ve simülasyon altyapısı.
        </p>
        <p className="text-sm tracking-widest mt-6 mb-12" style={{ color: GOLD }}>
          ÖZEL ERİŞİM
        </p>

        {mode === 'choice' ? (
          <div className="space-y-4">
            <p className="text-base font-light mb-8" style={{ color: CREAM, opacity: 0.6 }}>
              Erişim için bir seçim yapınız.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setUnlocked(true)}
                className="group relative px-6 py-5 rounded-xl transition-all"
                style={{
                  background: `linear-gradient(160deg, ${GOLD}22, transparent)`,
                  border: `1px solid ${GOLD}`,
                  color: CREAM,
                }}
              >
                <div className="text-sm tracking-[0.3em] mb-1" style={{ color: GOLD }}>
                  YATIRIMCI GİRİŞİ
                </div>
                <div className="text-base font-light" style={{ color: CREAM, opacity: 0.85 }}>
                  Sunumu açmak için tıklayınız
                </div>
              </button>

              <a
                href="https://www.estelongy.com"
                className="group relative px-6 py-5 rounded-xl transition-all hover:bg-white/[0.03]"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(201,169,97,0.25)',
                  color: CREAM,
                }}
              >
                <div className="text-sm tracking-[0.3em] mb-1" style={{ color: GOLD_DEEP }}>
                  ESTELONGY EKOSİSTEMİ
                </div>
                <div className="text-base font-light" style={{ color: CREAM, opacity: 0.8 }}>
                  estelongy.com adresinde keşfedin →
                </div>
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={tryUnlock} className="space-y-4 max-w-md mx-auto">
            <p className="text-base font-light mb-6" style={{ color: CREAM, opacity: 0.7 }}>
              Yatırımcı erişim şifresini giriniz.
            </p>

            <input
              type="password"
              value={input}
              onChange={e => { setInput(e.target.value); setError(false) }}
              autoFocus
              placeholder="Şifre"
              className="w-full px-5 py-4 rounded-xl text-center text-base font-light tracking-wider outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: error ? '1px solid #EF4444' : `1px solid ${GOLD}55`,
                color: CREAM,
              }}
            />

            {error && (
              <p className="text-sm font-light" style={{ color: '#FCA5A5' }}>
                Şifre hatalı. Lütfen tekrar deneyiniz.
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setMode('choice'); setInput(''); setError(false) }}
                className="flex-1 px-5 py-3 rounded-xl text-sm tracking-widest font-light transition-all"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(201,169,97,0.2)',
                  color: CREAM,
                }}
              >
                GERİ
              </button>
              <button
                type="submit"
                className="flex-[2] px-5 py-3 rounded-xl text-sm tracking-widest font-medium transition-all"
                style={{
                  background: GOLD,
                  color: BG,
                }}
              >
                SUNUMU AÇ
              </button>
            </div>
          </form>
        )}

        <div className="mt-16 text-[11px] font-light tracking-wider"
          style={{ color: GOLD_DEEP, opacity: 0.6 }}>
          ÖZEL ERİŞİM · LÜTFEN PAYLAŞMAYINIZ
        </div>
      </div>
    </div>
  )
}
