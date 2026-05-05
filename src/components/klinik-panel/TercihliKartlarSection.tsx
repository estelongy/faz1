'use client'

import { useEffect, useState } from 'react'

// ───────────────────────────────────────────────────────────────────
// Kart Kütüphanesi — tek kaynak
// ───────────────────────────────────────────────────────────────────

interface CardDef {
  id: string
  title: string
  subtitle: string
  icon: string
  iconBg: string  // tailwind gradient/border classes
  defaultOpen?: boolean
}

const CARD_LIBRARY: CardDef[] = [
  {
    id: 'akademi',
    title: 'Akademi Vitrini',
    subtitle: 'Bilimsel makaleler, kongre, derleme',
    icon: '📰',
    iconBg: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20',
    defaultOpen: true,
  },
  {
    id: 'duyurular',
    title: 'Estelongy Duyuruları',
    subtitle: 'Platform haberleri, yeni özellikler',
    icon: '📢',
    iconBg: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/20',
    defaultOpen: true,
  },
  {
    id: 'topluluk',
    title: 'Topluluk Pulse',
    subtitle: 'Tartışmalar, yaklaşan etkinlikler',
    icon: '💬',
    iconBg: 'from-fuchsia-500/20 to-violet-500/10 border-fuchsia-500/20',
    defaultOpen: true,
  },
  {
    id: 'hastalarim',
    title: 'Hastalarım Vitrini',
    subtitle: 'Son güncellenen 3 hasta',
    icon: '👥',
    iconBg: 'from-violet-500/20 to-purple-500/10 border-violet-500/20',
  },
  {
    id: 'avantajlar',
    title: 'Estelongy Avantajları',
    subtitle: 'Partner indirimleri (Shell, Rixos, THY)',
    icon: '🎁',
    iconBg: 'from-amber-500/20 to-orange-500/10 border-amber-500/20',
  },
  {
    id: 'bilim',
    title: 'Bilimsel Haber Akışı',
    subtitle: 'Editör onaylı medikal haber',
    icon: '🔬',
    iconBg: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/20',
  },
  {
    id: 'resmi',
    title: 'Resmi Duyurular',
    subtitle: 'TTB, branş dernekleri, bakanlık',
    icon: '📋',
    iconBg: 'from-slate-500/20 to-slate-400/10 border-slate-500/20',
  },
  {
    id: 'sosyal',
    title: 'Sosyal Medya Akışı',
    subtitle: 'Estelongy X & Instagram özet',
    icon: '✨',
    iconBg: 'from-pink-500/20 to-rose-500/10 border-pink-500/20',
  },
]

const STORAGE_KEY = 'estelongy_klinik_panel_cards'
const MAX_TERCIHLI = 4  // 4 sabit + max 4 tercihli = 8 toplam

// ───────────────────────────────────────────────────────────────────

export default function TercihliKartlarSection() {
  const [openIds, setOpenIds] = useState<string[]>(
    () => CARD_LIBRARY.filter(c => c.defaultOpen).map(c => c.id)
  )
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // localStorage'tan yükle
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as string[]
        if (Array.isArray(parsed)) setOpenIds(parsed.filter(id => CARD_LIBRARY.some(c => c.id === id)))
      }
    } catch {}
    setHydrated(true)
  }, [])

  // localStorage'a yaz
  useEffect(() => {
    if (!hydrated) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(openIds)) } catch {}
  }, [openIds, hydrated])

  const openCards = openIds
    .map(id => CARD_LIBRARY.find(c => c.id === id))
    .filter(Boolean) as CardDef[]
  const closedCards = CARD_LIBRARY.filter(c => !openIds.includes(c.id))
  const canAddMore = openIds.length < MAX_TERCIHLI

  function addCard(id: string) {
    if (openIds.length >= MAX_TERCIHLI) return
    setOpenIds(prev => [...prev, id])
    setPaletteOpen(false)
  }

  function removeCard(id: string) {
    setOpenIds(prev => prev.filter(i => i !== id))
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
          Senin Seçtiklerin
          <span className="ml-2 text-slate-700 font-normal normal-case">
            ({openIds.length}/{MAX_TERCIHLI})
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {openCards.map(card => (
          <PreferredCard key={card.id} card={card} onRemove={() => removeCard(card.id)} />
        ))}
        {canAddMore && (
          <KartEkleButton onClick={() => setPaletteOpen(true)} />
        )}
      </div>

      {/* Mini Palet — modal */}
      {paletteOpen && (
        <KartPaleti
          closedCards={closedCards}
          onSelect={addCard}
          onClose={() => setPaletteOpen(false)}
        />
      )}
    </section>
  )
}

// ───────────────────────────────────────────────────────────────────
// Tercihli Kart (placeholder içerik, X ile kaldırılabilir)
// ───────────────────────────────────────────────────────────────────

function PreferredCard({ card, onRemove }: { card: CardDef; onRemove: () => void }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${card.iconBg}`}>
      {/* X kaldır butonu — hover'da görünür */}
      <button
        type="button"
        onClick={onRemove}
        title="Bu kartı paneldan kaldır"
        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-red-500/80 border border-slate-700 hover:border-red-400 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-10"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-3 mb-4 pr-8">
        <div className="text-2xl">{card.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm">{card.title}</h3>
          <p className="text-slate-500 text-xs mt-0.5">{card.subtitle}</p>
        </div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 uppercase tracking-wider shrink-0">Yakında</span>
      </div>

      {/* Skeleton içerik — gerçek feed gelene kadar */}
      <div className="space-y-2">
        <div className="h-2 rounded bg-slate-800/60 w-3/4"></div>
        <div className="h-2 rounded bg-slate-800/60 w-1/2"></div>
        <div className="h-2 rounded bg-slate-800/60 w-2/3"></div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700/30 text-xs text-slate-600 italic">
        İçerik akışı yakında
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────
// Kart Ekle butonu — placeholder kart şeklinde
// ───────────────────────────────────────────────────────────────────

function KartEkleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-700 hover:border-violet-500/50 bg-slate-800/20 hover:bg-violet-500/5 p-5 min-h-[180px] transition-all"
    >
      <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-violet-500/20 flex items-center justify-center text-slate-500 group-hover:text-violet-300 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-slate-400 group-hover:text-white text-sm font-medium transition-colors">Kart Ekle</p>
        <p className="text-slate-600 text-xs mt-0.5">Kütüphaneden seç</p>
      </div>
    </button>
  )
}

// ───────────────────────────────────────────────────────────────────
// Mini Palet — kapalı kartların listesi modal'ı
// ───────────────────────────────────────────────────────────────────

function KartPaleti({
  closedCards, onSelect, onClose,
}: {
  closedCards: CardDef[]
  onSelect: (id: string) => void
  onClose: () => void
}) {
  // Escape ile kapat
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-white font-bold">Kart Kütüphanesi</h3>
            <p className="text-slate-500 text-xs mt-0.5">
              {closedCards.length > 0 ? `${closedCards.length} kart eklenebilir` : 'Tüm kartların açık'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Kapat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Kart listesi */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {closedCards.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-4xl mb-3 opacity-40">✨</div>
              <p className="text-slate-400 text-sm font-medium">Tüm kartların açık</p>
              <p className="text-slate-600 text-xs mt-1">Yeni kart önerin için destek bölümünü kullanabilirsin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {closedCards.map(card => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onSelect(card.id)}
                  className={`group flex items-start gap-3 p-4 rounded-xl border bg-gradient-to-br ${card.iconBg} hover:scale-[1.02] hover:shadow-lg hover:shadow-black/40 transition-all text-left`}
                >
                  <div className="text-2xl shrink-0">{card.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm">{card.title}</h4>
                    <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{card.subtitle}</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-900/60 group-hover:bg-violet-500/40 flex items-center justify-center text-slate-400 group-hover:text-white transition-all shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
