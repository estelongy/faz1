import type { ReactNode } from 'react'

/**
 * EsteKlinikPRO mobil sayfa kabuğu.
 * - full-bleed (panel layout p-4/p-8 iptal)
 * - slate-950 zemin
 * - NativeTopBar/KlinikBottomNav için alt boşluk
 * - NativeTopBar başlık gösterir; burada h1 YOK, opsiyonel alt-başlık
 */
export default function AppShell({
  subtitle,
  children,
}: {
  subtitle?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      {subtitle && (
        <div className="px-5 pt-4 pb-2">
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
      )}
      <div className="px-5 pt-3 space-y-4">{children}</div>
    </div>
  )
}
