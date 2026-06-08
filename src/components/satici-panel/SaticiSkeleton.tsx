/**
 * EsteStorePRO alt-route ortak loading skeleton.
 * Capacitor WebView'da sayfa geçişi sırasında "duraksıyor" hissi yerine
 * anında iskelet görünür — mimar pratiği #1 (akış uçtan uca yürüsün).
 */
export default function SaticiSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <div className="px-5 pt-5">
        <div className="h-3 w-24 bg-slate-800 rounded animate-pulse mb-3" />
        <div className="h-6 w-48 bg-slate-800 rounded-lg animate-pulse" />
      </div>
      <div className="px-5 mt-5 space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
