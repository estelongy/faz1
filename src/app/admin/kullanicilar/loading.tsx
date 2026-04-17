export default function AdminKullanicilarLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-36 bg-slate-800 rounded-lg mb-2" />
        <div className="h-4 w-52 bg-slate-800/60 rounded" />
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-slate-800">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 bg-slate-800 rounded w-20" />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-slate-800" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-slate-800 rounded mb-1" />
              <div className="h-3 w-44 bg-slate-800/60 rounded" />
            </div>
            <div className="h-5 w-14 bg-slate-800 rounded-full" />
            <div className="h-4 w-20 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
