'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  vendorId: string
  initialImages?: string[]
  maxImages?: number
  onChange: (imageUrls: string[]) => void
}

interface UploadingFile {
  id: string
  name: string
  progress: number
  error?: string
}

const MAX_SIZE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function ProductImageUploader({
  vendorId,
  initialImages = [],
  maxImages = 8,
  onChange,
}: Props) {
  const [images, setImages] = useState<string[]>(initialImages)
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const remaining = maxImages - images.length - uploading.length

  const update = useCallback((next: string[]) => {
    setImages(next)
    onChange(next)
  }, [onChange])

  async function uploadFile(file: File) {
    const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploading(p => [...p, { id: fileId, name: file.name, progress: 0, error: 'Sadece JPG, PNG, WEBP' }])
      setTimeout(() => setUploading(p => p.filter(u => u.id !== fileId)), 3000)
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploading(p => [...p, { id: fileId, name: file.name, progress: 0, error: `En fazla ${MAX_SIZE_MB}MB` }])
      setTimeout(() => setUploading(p => p.filter(u => u.id !== fileId)), 3000)
      return
    }

    setUploading(p => [...p, { id: fileId, name: file.name, progress: 10 }])

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `vendors/${vendorId}/${fileId}.${ext}`

    setUploading(p => p.map(u => u.id === fileId ? { ...u, progress: 40 } : u))

    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (error) {
      setUploading(p => p.map(u => u.id === fileId ? { ...u, progress: 0, error: error.message } : u))
      setTimeout(() => setUploading(p => p.filter(u => u.id !== fileId)), 4000)
      return
    }

    setUploading(p => p.map(u => u.id === fileId ? { ...u, progress: 80 } : u))

    const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path)
    const publicUrl = pub.publicUrl

    setUploading(p => p.filter(u => u.id !== fileId))
    update([...images, publicUrl])
  }

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files).slice(0, remaining)
    for (const f of arr) {
      await uploadFile(f)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
  }

  async function removeImage(url: string) {
    // Yol çıkar: product-images/ sonrası
    const marker = '/product-images/'
    const idx = url.indexOf(marker)
    if (idx >= 0) {
      const path = url.slice(idx + marker.length)
      await supabase.storage.from('product-images').remove([path])
    }
    update(images.filter(i => i !== url))
  }

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= images.length) return
    const next = [...images]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    update(next)
  }

  const canAddMore = remaining > 0

  return (
    <div className="space-y-3">
      {/* Mevcut görseller */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div key={url} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Ürün ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <div className="absolute top-1 left-1 bg-violet-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  KAPAK
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <div className="flex gap-1">
                  <button type="button" onClick={() => moveImage(i, i - 1)}
                    disabled={i === 0}
                    className="w-7 h-7 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => moveImage(i, i + 1)}
                    disabled={i === images.length - 1}
                    className="w-7 h-7 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <button type="button" onClick={() => removeImage(url)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg">
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-violet-500 bg-violet-500/10'
              : 'border-slate-600 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
          }`}
        >
          <svg className="w-8 h-8 text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-white text-sm font-medium">Görsel yükle veya sürükle</p>
          <p className="text-slate-500 text-xs mt-1">
            JPG, PNG, WEBP — maks. {MAX_SIZE_MB}MB · {remaining} hak kaldı
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            multiple
            className="hidden"
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Yükleniyor durumu */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map(u => (
            <div key={u.id} className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs truncate">{u.name}</p>
                {u.error ? (
                  <p className="text-red-400 text-[11px] mt-0.5">{u.error}</p>
                ) : (
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                      style={{ width: `${u.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <span className="text-[11px] text-slate-500 shrink-0">
                {u.error ? '!' : `${u.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-500 leading-relaxed">
        İlk görsel kapak olarak kullanılır. Ok tuşlarıyla sıralayabilir, fare üzerindeyken silebilirsin.
      </p>
    </div>
  )
}
