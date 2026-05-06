import SiteHeader from '@/components/SiteHeader'
import Footer from '@/components/Footer'

export default function EsteStoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  )
}
