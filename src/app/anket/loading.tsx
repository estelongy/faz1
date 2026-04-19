export default function AnketLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 animate-pulse">
      <div className="h-16 bg-slate-900/80 border-b border-white/5" />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <div className="text-center mb-8">
          <div className="h-8 w-48 mx-auto bg-slate-800 rounded-lg mb-3" />
          <div className="h-4 w-80 mx-auto bg-slate-800/60 rounded mb-1" />
          <div className="h-4 w-64 mx-auto bg-slate-800/60 rounded" />
        </div>

        {/* Score preview */}
        <div className="mb-8 p-5 rounded-2xl border border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-20 bg-slate-700 rounded" />
            <div className="h-6 w-6 bg-slate-700 rounded" />
            <div className="h-12 w-20 bg-slate-700 rounded" />
            <div className="h-10 w-12 bg-slate-700 rounded" />
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Questions */}
        <div className="space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-700 bg-slate-800/50">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-7 w-7 bg-slate-700 rounded" />
                <div className="flex-1">
                  <div className="h-5 w-40 bg-slate-700 rounded mb-1.5" />
                  <div className="h-3.5 w-64 bg-slate-700/60 rounded" />
                </div>
                <div className="h-9 w-9 bg-slate-700 rounded" />
              </div>
              <div className="h-3 bg-slate-700 rounded-full" />
            </div>
          ))}
        </div>

        <div className="mt-6 h-14 bg-slate-800 rounded-2xl" />
      </div>
    </main>
  )
}
