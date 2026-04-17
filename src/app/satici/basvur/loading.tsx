export default function SaticiBasvurLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 animate-pulse">
      <div className="h-16 bg-slate-900/80 border-b border-white/5" />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16 space-y-6">
        <div className="h-12 w-12 rounded-xl bg-slate-800" />
        <div className="h-7 w-48 bg-slate-800 rounded-lg" />
        <div className="h-4 w-56 bg-slate-800/60 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-center">
              <div className="h-8 w-8 mx-auto bg-slate-700 rounded mb-2" />
              <div className="h-4 w-20 mx-auto bg-slate-700 rounded mb-1" />
              <div className="h-3 w-24 mx-auto bg-slate-700/60 rounded" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-14 bg-slate-800 rounded-xl" />
          <div className="h-14 bg-slate-800 rounded-xl" />
        </div>
        <div className="h-14 bg-slate-800 rounded-2xl" />
      </div>
    </main>
  )
}
