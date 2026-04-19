export default function RandevuLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 animate-pulse">
      <div className="h-16 bg-slate-900/80 border-b border-white/5" />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <div className="h-8 w-48 bg-slate-800 rounded-lg mb-2" />
          <div className="h-4 w-72 bg-slate-800/60 rounded" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-800 border border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-700" />
                <div className="flex-1">
                  <div className="h-5 w-40 bg-slate-700 rounded mb-1.5" />
                  <div className="h-3.5 w-28 bg-slate-700/60 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
