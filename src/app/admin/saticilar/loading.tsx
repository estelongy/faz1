export default function AdminSaticilarLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-28 bg-slate-800 rounded-lg mb-2" />
        <div className="h-4 w-52 bg-slate-800/60 rounded" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-slate-800 bg-slate-900">
            <div className="h-8 w-10 bg-slate-800 rounded mb-1" />
            <div className="h-4 w-20 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="h-5 w-36 bg-slate-800 rounded" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-800/50">
            <div className="flex-1">
              <div className="h-4 w-36 bg-slate-800 rounded mb-1" />
              <div className="h-3 w-24 bg-slate-800/60 rounded" />
            </div>
            <div className="h-4 w-20 bg-slate-800/60 rounded" />
            <div className="h-5 w-16 bg-slate-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
