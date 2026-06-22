'use client'

import { useRouter } from 'next/navigation'

export default function RaporPrintToolbar() {
  const router = useRouter()

  function handlePrint() {
    window.print()
  }

  return (
    <div className="rapor-print-hide sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          ← Geri
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-sm text-slate-500">
            PDF olarak kaydetmek için: yazdır → hedef &ldquo;PDF olarak kaydet&rdquo;
          </span>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-colors"
          >
            🖨️ Yazdır / PDF
          </button>
        </div>
      </div>
    </div>
  )
}
