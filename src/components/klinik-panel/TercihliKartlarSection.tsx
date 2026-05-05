'use client'

import { useEffect, useState } from 'react'
import type { EditorialPost, PostsByCategory, PostCategory } from '@/lib/editorial-posts'

// ───────────────────────────────────────────────────────────────────
// Kart Kütüphanesi — tek kaynak
// ───────────────────────────────────────────────────────────────────

interface CardDef {
  id: string
  title: string
  subtitle: string
  icon: string
  iconBg: string
  defaultOpen?: boolean
  /** Editöryel kategori — varsa kart bu kategoriden post çeker */
  category?: PostCategory
}

const CARD_LIBRARY: CardDef[] = [
  {
    id: 'akademi',
    title: 'Akademi Vitrini',
    subtitle: 'Bilimsel makaleler, kongre, derleme',
    icon: '📰',
    iconBg: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20',
    defaultOpen: true,
    category: 'akademi',
  },
  {
    id: 'duyurular',
    title: 'Estelongy Duyuruları',
    subtitle: 'Platform haberleri, yeni özellikler',
    icon: '📢',
    iconBg: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/20',
    defaultOpen: true,
    category: 'duyuru',
  },
  {
    id: 'topluluk',
    title: 'Topluluk Pulse',
    subtitle: 'Tartışmalar, yaklaşan etkinlikler',
    icon: '💬',
    iconBg: 'from-fuchsia-500/20 to-violet-500/10 border-fuchsia-500/20',
    defaultOpen: true,
    category: 'topluluk',
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
    category: 'bilim',
  },
  {
    id: 'resmi',
    title: 'Resmi Duyurular',
    subtitle: 'TTB, branş dernekleri, bakanlık',
    icon: '📋',
    iconBg: 'from-slate-500/20 to-slate-400/10 border-slate-500/20',
    category: 'resmi',
  },
  {
    id: 'sosyal',
    title: 'Sosyal Medya Akışı',
    subtitle: 'Estelongy X & Instagram özet',
    icon: '✨',
    iconBg: 'from-pink-500/20 to-rose-500/10 border-pink-500/20',
    category: 'sosyal',
  },
]

const STORAGE_KEY = 'estelongy_klinik_panel_cards'
const MAX_TERCIHLI = 4

interface Props {
  postsByCategory: PostsByCategory
}

// ───────────────────────────────────────────────────────────────────

export default function TercihliKartlarSection({ postsByCategory }: Props) {
  const [openIds, setOpenIds] = useState<string[]>(
    () => CARD_LIBRARY.filter(c => c.defaultOpen).map(c => c.id)
  )
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

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
          <PreferredCard
            key={card.id}
            card={card}
            posts={card.category ? (postsByCategory[card.category] ?? []) : []}
            onRemove={() => removeCard(card.id)}
          />
        ))}
        {canAddMore && (
          <KartEkleButton onClick={() => setPaletteOpen(true)} />
        )}
      </div>

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
// Tercihli Kart — gerçek içerik + kaldır butonu
// ───────────────────────────────────────────────────────────────────

function PreferredCard({
  card, posts, onRemove,
}: {
  card: CardDef
  posts: EditorialPost[]
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasContent = posts.length > 0
  const hasCategory = !!card.category

  return (
    <>
      <div className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${card.iconBg}`}>
        {/* X kaldır */}
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
          {!hasCategory && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 uppercase tracking-wider shrink-0">Yakında</span>
          )}
        </div>

        {/* İçerik — kategori varsa ve post varsa, yoksa boş state */}
        {hasCategory ? (
          hasContent ? (
            <div className="space-y-2.5">
              {posts.map(post => (
                <PostMiniRow key={post.id} post={post} />
              ))}
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="w-full text-left text-violet-300 hover:text-violet-200 text-xs font-semibold pt-1 transition-colors"
              >
                Hepsini gör →
              </button>
            </div>
          ) : (
            <div className="py-4 text-center text-slate-500 text-xs">
              Henüz içerik yok
            </div>
          )
        ) : (
          // Kategorisi olmayan kartlar (Hastalarım, Avantajlar) için skeleton
          <>
            <div className="space-y-2">
              <div className="h-2 rounded bg-slate-800/60 w-3/4"></div>
              <div className="h-2 rounded bg-slate-800/60 w-1/2"></div>
              <div className="h-2 rounded bg-slate-800/60 w-2/3"></div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/30 text-xs text-slate-600 italic">
              İçerik akışı yakında
            </div>
          </>
        )}
      </div>

      {/* Expand modal — tüm postlar */}
      {expanded && hasContent && (
        <PostListModal card={card} posts={posts} onClose={() => setExpanded(false)} />
      )}
    </>
  )
}

function PostMiniRow({ post }: { post: EditorialPost }) {
  const dateStr = formatRelativeDate(post.published_at)
  const Tag = post.external_url ? 'a' : 'div'
  return (
    <Tag
      {...(post.external_url ? { href: post.external_url, target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`block p-2.5 rounded-lg bg-slate-900/40 border border-slate-700/40 ${post.external_url ? 'hover:border-slate-600 hover:bg-slate-900/60 cursor-pointer' : ''} transition-all`}
    >
      <p className="text-white text-xs font-semibold leading-snug line-clamp-2">{post.title}</p>
      {post.excerpt && (
        <p className="text-slate-500 text-[11px] mt-1 leading-relaxed line-clamp-2">{post.excerpt}</p>
      )}
      <p className="text-slate-600 text-[10px] mt-1.5 flex items-center gap-1">
        {dateStr}
        {post.external_url && (
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
      </p>
    </Tag>
  )
}

function PostListModal({
  card, posts, onClose,
}: {
  card: CardDef
  posts: EditorialPost[]
  onClose: () => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{card.icon}</div>
            <div>
              <h2 className="text-white font-bold">{card.title}</h2>
              <p className="text-slate-500 text-xs">{card.subtitle}</p>
            </div>
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

        <div className="p-6 space-y-3">
          {posts.map(post => (
            <PostFullRow key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PostFullRow({ post }: { post: EditorialPost }) {
  const dateStr = formatRelativeDate(post.published_at)
  const Tag = post.external_url ? 'a' : 'div'
  return (
    <Tag
      {...(post.external_url ? { href: post.external_url, target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`block p-4 rounded-xl bg-slate-800/60 border border-slate-700 ${post.external_url ? 'hover:border-violet-500/40 cursor-pointer' : ''} transition-all`}
    >
      <p className="text-white text-sm font-bold leading-snug">{post.title}</p>
      {post.excerpt && (
        <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{post.excerpt}</p>
      )}
      {post.body && (
        <p className="text-slate-500 text-xs mt-2 leading-relaxed">{post.body}</p>
      )}
      <div className="flex items-center justify-between mt-3 text-[11px]">
        <span className="text-slate-600">{dateStr}</span>
        {post.external_url && (
          <span className="text-violet-300 font-semibold flex items-center gap-1">
            Aç
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </span>
        )}
      </div>
    </Tag>
  )
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHr = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffMin < 1) return 'şimdi'
  if (diffMin < 60) return `${diffMin} dk önce`
  if (diffHr < 24) return `${diffHr} sa önce`
  if (diffDay < 7) return `${diffDay} gün önce`
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}

// ───────────────────────────────────────────────────────────────────
// Kart Ekle butonu
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
// Mini Palet
// ───────────────────────────────────────────────────────────────────

function KartPaleti({
  closedCards, onSelect, onClose,
}: {
  closedCards: CardDef[]
  onSelect: (id: string) => void
  onClose: () => void
}) {
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
