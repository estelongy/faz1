/**
 * Satıcı panel — global skeleton. Capacitor WebView'da sayfa geçişi
 * Vercel SSR'a giderken kullanıcı "duraksıyor" hissi yerine anında skeleton
 * görür. Hem web hem app için aynı görünüm.
 */
export default function SaticiPanelLoading() {
  return (
    <div className="-m-4 lg:-m-8 min-h-screen bg-slate-950">
      <div className="px-5 pt-5">
        <div className="h-3 w-24 bg-slate-800 rounded animate-pulse mb-3" />
        <div className="h-6 w-48 bg-slate-800 rounded-lg animate-pulse" />
      </div>
      <div className="px-5 mt-6 grid grid-cols-2 gap-3">
        <div className="h-14 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
        <div className="h-14 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
      </div>
      <div className="px-5 mt-6 space-y-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
