export default function AdminLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-36 bg-slate-800 rounded-lg mb-2" />
        <div className="h-4 w-56 bg-slate-800/60 rounded" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-slate-800 mb-3" />
            <div className="h-8 w-16 bg-slate-800 rounded mb-1" />
            <div className="h-4 w-24 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Recent users */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div className="h-5 w-40 bg-slate-800 rounded mb-5" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700" />
                <div>
                  <div className="h-4 w-32 bg-slate-700 rounded mb-1" />
                  <div className="h-3 w-20 bg-slate-700/60 rounded" />
                </div>
              </div>
              <div className="h-5 w-12 bg-slate-700 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
