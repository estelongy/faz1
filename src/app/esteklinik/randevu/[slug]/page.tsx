import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EsteKlinikNav from '../../EsteKlinikNav'
import Footer from '@/components/Footer'
import RandevuFlow from '@/components/RandevuFlow'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clinics')
    .select('name')
    .eq('slug', params.slug)
    .maybeSingle()
  const name = data?.name ?? 'Klinik'
  return {
    title: `${name} — Randevu Al`,
    description: `${name} kliniğinden online randevu al.`,
    alternates: { canonical: `/esteklinik/randevu/${params.slug}` },
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function RandevuSlugPage({ params }: PageProps) {
  const supabase = await createClient()
  const isUuid = UUID_RE.test(params.slug)
  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, slug, name, location')
    .eq(isUuid ? 'id' : 'slug', params.slug)
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .maybeSingle()

  if (!clinic) notFound()

  return (
    <>
      <EsteKlinikNav />
      <main className="min-h-screen bg-white">
        {/* Hero: yeşil bant kontrast verir, landing ile aile bağı */}
        <section className="bg-gradient-to-br from-[#064E3B] via-[#0A6347] to-[#053527]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-6">
            <nav className="flex items-center gap-2 text-sm text-emerald-200/70 mb-3">
              <Link href="/esteklinik" className="hover:text-white transition-colors">EsteKlinik</Link>
              <span>·</span>
              <Link href={`/esteklinik/${clinic.slug}`} className="hover:text-white transition-colors">
                {clinic.name}
              </Link>
              <span>·</span>
              <span className="text-white font-semibold">Randevu</span>
            </nav>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-300 mb-1">
              Randevu Oluştur
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{clinic.name}</h1>
            {clinic.location && (
              <p className="text-emerald-100/80 text-sm mt-1">📍 {clinic.location}</p>
            )}
          </div>
        </section>

        {/* Content: beyaz sayfada koyu içerik kartı — RandevuFlow dark assume eder */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-2xl bg-slate-900 border border-slate-700 p-6 sm:p-8 shadow-xl">
            <RandevuFlow embedded preselectedClinicId={clinic.id} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
