'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  vendorId: string
  initialUrl: string | null
  onChange: (url: string | null) => void
  kind: 'logo' | 'banner'
}

const MAX_SIZE_MB = 3
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function VendorAssetUploader({ vendorId, initialUrl, onChange, kind }: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleFile(file: File) {
    setError(null)
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Sadece JPG, PNG, WEBP'); return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Maks ${MAX_SIZE_MB}MB`); return
    }
    setBusy(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filename = `${kind}-${Date.now()}.${ext}`
      const path = `${vendorId}/${filename}`

      const { error: upErr } = await supabase.storage
        .from('vendor-assets')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (upErr) {
        setError(upErr.message)
        return
      }

      const { data: pub } = supabase.storage.from('vendor-assets').getPublicUrl(path)
      const publicUrl = pub.publicUrl + `?v=${Date.now()}`
      setUrl(publicUrl)
      onChange(publicUrl)
    } finally {
      setBusy(false)
    }
  }

  function remove() {
    setUrl(null)
    onChange(null)
  }

  const isBanner = kind === 'banner'
  const aspect = isBanner ? 'aspect-[4/1]' : 'aspect-square w-32'

  return (
    <div>
      {url ? (
        <div className="relative inline-block">
          <div className={`${aspect} bg-slate-900 border border-slate-700 rounded-xl overflow-hidden ${isBanner ? 'w-full' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={kind} className="w-full h-full object-cover" />
          </div>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg">
              Değiştir
            </button>
            <button type="button" onClick={remove}
              className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 text-sm font-semibold rounded-lg">
              Kaldır
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={`${aspect} ${isBanner ? 'w-full' : ''} flex flex-col items-center justify-center bg-slate-900 border-2 border-dashed border-slate-700 hover:border-[#C9A961] rounded-xl text-slate-500 hover:text-[#C9A961] transition-colors`}>
          <span className="text-3xl">{isBanner ? '🖼' : '🏷'}</span>
          <span className="text-sm font-semibold mt-1">{busy ? 'Yükleniyor…' : (isBanner ? 'Banner Yükle' : 'Logo Yükle')}</span>
          <span className="text-xs text-slate-600">{isBanner ? '1600×400px önerilen' : '500×500px'}</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }} />
      {error && <p className="mt-2 text-red-400 text-sm font-semibold">{error}</p>}
    </div>
  )
}
