'use client'

import { useState } from 'react'
import type { AdminPost, PostCategory } from './page'

const CATEGORIES: { id: PostCategory; label: string; emoji: string; color: string }[] = [
  { id: 'duyuru',   label: 'Estelongy Duyurusu',  emoji: '📢', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { id: 'akademi',  label: 'Akademi (makale)',    emoji: '📰', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  { id: 'topluluk', label: 'Topluluk (etkinlik)', emoji: '💬', color: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30' },
  { id: 'bilim',    label: 'Bilimsel Haber',      emoji: '🔬', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  { id: 'resmi',    label: 'Resmi Duyuru',        emoji: '📋', color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  { id: 'sosyal',   label: 'Sosyal Medya',        emoji: '✨', color: 'bg-pink-500/15 text-pink-300 border-pink-500/30' },
]

interface Props {
  posts: AdminPost[]
  createAction: (formData: FormData) => Promise<void>
  toggleAction: (formData: FormData) => Promise<void>
  deleteAction: (formData: FormData) => Promise<void>
}

export default function IcerikYonetim({ posts, createAction, toggleAction, deleteAction }: Props) {
  const [filter, setFilter] = useState<PostCategory | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)

  const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.category === filter)
  const counts = CATEGORIES.reduce<Record<string, number>>((acc, c) => {
    acc[c.id] = posts.filter(p => p.category === c.id).length
    return acc
  }, {})

  return (
    <div className="p-4 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">İçerik Yönetimi</h1>
          <p className="text-slate-400 text-sm mt-1">Hekim panelindeki tercihli kartlarda görünen postları yönet</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-500/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Yeni Post
        </button>
      </div>

      {/* Kategori filtreleri */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
            filter === 'all'
              ? 'bg-white/10 text-white border-white/30'
              : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-600'
          }`}
        >
          Tümü <span className="opacity-60 ml-1">{posts.length}</span>
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilter(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              filter === cat.id ? cat.color : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-600'
            }`}
          >
            {cat.emoji} {cat.label} <span className="opacity-60 ml-1">{counts[cat.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Liste */}
      {filteredPosts.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-5xl mb-3 opacity-30">📭</div>
          <p className="text-slate-400 text-sm">Bu kategoride henüz post yok</p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-4 text-violet-400 hover:text-violet-300 text-sm font-semibold"
          >
            İlk postu ekle →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map(post => (
            <PostRow
              key={post.id}
              post={post}
              toggleAction={toggleAction}
              deleteAction={deleteAction}
            />
          ))}
        </div>
      )}

      {createOpen && <CreatePostModal createAction={createAction} onClose={() => setCreateOpen(false)} />}
    </div>
  )
}

function PostRow({ post, toggleAction, deleteAction }: {
  post: AdminPost
  toggleAction: (f: FormData) => Promise<void>
  deleteAction: (f: FormData) => Promise<void>
}) {
  const cat = CATEGORIES.find(c => c.id === post.category)
  const dateStr = new Date(post.published_at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`p-4 rounded-xl border ${post.is_published ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">{cat?.emoji ?? '•'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${cat?.color ?? ''}`}>
              {cat?.label ?? post.category}
            </span>
            {!post.is_published && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Yayında değil
              </span>
            )}
            <span className="text-slate-600 text-xs">{dateStr}</span>
          </div>
          <p className="text-white font-semibold text-sm leading-snug">{post.title}</p>
          {post.excerpt && (
            <p className="text-slate-400 text-xs mt-1 leading-relaxed line-clamp-2">{post.excerpt}</p>
          )}
          {post.external_url && (
            <a href={post.external_url} target="_blank" rel="noopener noreferrer"
              className="inline-block text-violet-400 hover:text-violet-300 text-[11px] mt-1.5 truncate max-w-full">
              ↗ {post.external_url}
            </a>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <form action={toggleAction}>
            <input type="hidden" name="id" value={post.id} />
            <input type="hidden" name="next" value={post.is_published ? '0' : '1'} />
            <button
              type="submit"
              className={`text-[10px] px-2 py-1 rounded font-bold transition-colors ${
                post.is_published
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
              }`}
            >
              {post.is_published ? 'Gizle' : 'Yayınla'}
            </button>
          </form>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={post.id} />
            <button
              type="submit"
              className="text-[10px] px-2 py-1 rounded font-bold bg-red-500/15 hover:bg-red-500/25 text-red-400 transition-colors"
            >
              Sil
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function CreatePostModal({ createAction, onClose }: {
  createAction: (f: FormData) => Promise<void>
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold">Yeni Post</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form action={createAction} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Kategori <span className="text-red-400">*</span></label>
            <select name="category" required className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors">
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Başlık <span className="text-red-400">*</span></label>
            <input type="text" name="title" required maxLength={200}
              placeholder="Postun başlığı"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Özet (kart önizlemede görünür)</label>
            <textarea name="excerpt" rows={2} maxLength={300}
              placeholder="Kısa özet, 1-2 cümle"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">İçerik (modal&apos;da tam metin)</label>
            <textarea name="body" rows={5} maxLength={3000}
              placeholder="Tam metin (opsiyonel) — uzun açıklama, modal'da görünür"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Dış link (opsiyonel)</label>
              <input type="url" name="external_url"
                placeholder="https://..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Görsel URL (opsiyonel)</label>
              <input type="url" name="image_url"
                placeholder="https://..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all">
              Yayınla
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-3 text-slate-400 hover:text-white transition-colors">
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
