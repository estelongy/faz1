export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header skeleton */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 border-b border-white/5 h-16" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 animate-pulse">
        {/* Başlık */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-8 w-48 bg-slate-700 rounded-lg" />
            <div className="h-4 w-32 bg-slate-800 rounded-lg" />
          </div>
        </div>

        {/* EGS + Graf */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="h-48 rounded-2xl bg-slate-800" />
          <div className="lg:col-span-2 h-48 rounded-2xl bg-slate-800" />
        </div>

        {/* Tablo */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <div className="h-5 w-32 bg-slate-700 rounded-lg" />
          </div>
          <div className="divide-y divide-slate-800">
            {[1, 2, 3].map(i => (
              <div key={i} className="px-4 py-3 flex gap-4">
                <div className="h-4 w-32 bg-slate-800 rounded" />
                <div className="h-4 w-20 bg-slate-800 rounded" />
                <div className="h-4 w-24 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
