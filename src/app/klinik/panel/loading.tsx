export default function KlinikPanelLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5 h-16" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="mb-8">
          <div className="h-9 w-48 bg-slate-800 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-56 bg-slate-800/60 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 rounded-2xl bg-slate-800/50 animate-pulse" />
          <div className="lg:col-span-2 h-64 rounded-2xl bg-slate-800/50 animate-pulse" />
        </div>
      </div>
    </main>
  )
}
