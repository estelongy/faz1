export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 border-b border-white/5 h-16" />

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16 animate-pulse">
        <div className="h-8 w-48 bg-slate-700 rounded-lg mb-1" />
        <div className="h-4 w-36 bg-slate-800 rounded-lg mb-8" />

        {/* Wizard steps skeleton */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-1 h-2 rounded-full bg-slate-800" />
          ))}
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <div className="h-6 w-40 bg-slate-700 rounded-lg mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 rounded-xl bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
