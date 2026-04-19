export default function JetonLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5 h-16" />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <div className="h-8 w-48 bg-slate-800 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-slate-800/60 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-slate-900 animate-pulse" />
      </div>
    </main>
  )
}
