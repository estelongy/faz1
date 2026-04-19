export default function AdminKliniklerLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-28 bg-slate-800 rounded-lg mb-2" />
        <div className="h-4 w-52 bg-slate-800/60 rounded" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-slate-800 bg-slate-900">
            <div className="h-8 w-10 bg-slate-800 rounded mb-1" />
            <div className="h-4 w-20 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Pending clinics */}
      <div className="mb-8">
        <div className="h-5 w-44 bg-slate-800 rounded mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="h-5 w-40 bg-slate-800 rounded mb-1.5" />
              <div className="h-3.5 w-28 bg-slate-800/60 rounded mb-4" />
              <div className="flex gap-2">
                <div className="flex-1 h-9 bg-slate-800 rounded-xl" />
                <div className="flex-1 h-9 bg-slate-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-800/50 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
