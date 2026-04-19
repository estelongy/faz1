export default function UpdatePasswordLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 animate-spin" />
          <div className="absolute inset-3 rounded-full bg-violet-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <p className="text-slate-400 text-sm font-medium">Oturum doğrulanıyor...</p>
        <p className="text-slate-600 text-xs mt-1">Lütfen bekleyin</p>
      </div>
    </main>
  )
}
