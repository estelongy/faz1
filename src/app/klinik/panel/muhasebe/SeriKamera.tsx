'use client'

/**
 * Seri Kamera — tarayıcı içi çekim.
 * Telefonun kamera uygulaması devreye girmez: canlı görüntü, tek dokunuşla
 * kare alınır, anında yüklenir, kamera açık kalır. "Yeniden dene / Tamam"
 * onay ekranı yok.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  patientName: string
  stageLabel: string
  onCapture: (file: File) => Promise<void>   // tek kareyi yükler
  onClose: () => void
}

export default function SeriKamera({ patientName, stageLabel, onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [shots, setShots] = useState<string[]>([])   // önizleme (dataURL)
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')

  const start = useCallback(async (mode: 'environment' | 'user') => {
    try {
      streamRef.current?.getTracks().forEach(t => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setError(null)
    } catch {
      setError('Kameraya erişilemedi. Tarayıcı izni verilmemiş olabilir.')
    }
  }, [])

  useEffect(() => {
    start(facing)
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [facing, start])

  async function shoot() {
    const video = videoRef.current
    if (!video || busy) return
    setBusy(true)
    try {
      const w = video.videoWidth || 1280
      const h = video.videoHeight || 720
      const scale = Math.min(1, 1600 / Math.max(w, h))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      const cx = canvas.getContext('2d')
      if (!cx) return
      cx.drawImage(video, 0, 0, canvas.width, canvas.height)

      setShots(prev => [canvas.toDataURL('image/jpeg', 0.6), ...prev].slice(0, 8))

      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.82))
      if (blob) {
        const file = new File([blob], `cekim-${Date.now()}.jpg`, { type: 'image/jpeg' })
        await onCapture(file)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col" style={{ filter: 'none' }}>
      {/* Üst bilgi */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{patientName}</p>
          <p className="text-xs text-violet-300">{stageLabel} · {shots.length} kare çekildi</p>
        </div>
        <button onClick={onClose}
          className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm font-bold">
          Bitir
        </button>
      </div>

      {/* Canlı görüntü */}
      <div className="relative flex-1 min-h-0 bg-black">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div>
              <p className="text-rose-300 font-semibold mb-3">{error}</p>
              <button onClick={() => start(facing)}
                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-bold">Tekrar dene</button>
            </div>
          </div>
        ) : (
          <video ref={videoRef} playsInline muted autoPlay
            className="absolute inset-0 w-full h-full object-contain" />
        )}
        {busy && (
          <div className="absolute inset-0 bg-white/80 animate-[pulse_0.3s_ease-out]" />
        )}
      </div>

      {/* Çekilenler şeridi */}
      {shots.length > 0 && (
        <div className="flex gap-1.5 px-3 py-2 overflow-x-auto bg-black">
          {shots.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="h-12 w-12 object-cover rounded-md border border-white/20 shrink-0" />
          ))}
        </div>
      )}

      {/* Kontroller */}
      <div className="flex items-center justify-between px-8 py-5 bg-black">
        <button onClick={() => setFacing(f => (f === 'environment' ? 'user' : 'environment'))}
          className="w-12 h-12 rounded-full bg-white/15 text-white text-xl" aria-label="Kamera çevir">⟳</button>

        <button onClick={shoot} disabled={busy || !!error}
          className="w-20 h-20 rounded-full bg-white disabled:opacity-40 ring-4 ring-white/30 active:scale-95 transition-transform"
          aria-label="Çek" />

        <div className="w-12 h-12" />
      </div>
    </div>
  )
}
