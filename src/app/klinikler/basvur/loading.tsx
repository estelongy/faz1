export default function KlinikBasvurLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 animate-pulse">
      <div className="h-16 bg-slate-900/80 border-b border-white/5" />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16 space-y-6">
        <div className="h-12 w-12 rounded-xl bg-slate-800" />
        <div className="h-7 w-48 bg-slate-800 rounded-lg" />
        <div className="h-4 w-64 bg-slate-800/60 rounded" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 bg-slate-800 rounded-lg" />
          ))}
        </div>
        <div className="h-14 bg-slate-800 rounded-2xl" />
      </div>
    </main>
  )
}
