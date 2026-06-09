import Link from 'next/link'
import { Pencil, Calendar, ChevronRight } from 'lucide-react'

interface Props {
  clinic: {
    name: string
    title: string | null
    location: string | null
    bio: string | null
    specialties: string[] | null
    clinic_type: string | null
    created_at: string
  }
}

export default function ProfilAppView({ clinic }: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      {/* Düzenle CTA — üstte */}
      <div className="px-5 pt-4">
        <Link
          href="/klinik/panel/profil/duzenle"
          className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 active:bg-emerald-500/20 transition"
        >
          <span className="flex items-center gap-2 text-emerald-200 text-sm font-bold">
            <Pencil size={16} /> Profili Düzenle
          </span>
          <ChevronRight size={18} className="text-emerald-300" />
        </Link>
      </div>

      {/* Klinik kartı */}
      <section className="px-5 mt-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-black shrink-0">
              {clinic.name[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-bold text-base truncate">
                {clinic.title ? `${clinic.title} ` : ''}{clinic.name}
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {clinic.clinic_type ?? 'Klinik'} · {clinic.location ?? '—'}
              </p>
            </div>
          </div>

          <Field label="Hakkında">
            <p className="text-slate-300 text-sm leading-relaxed">
              {clinic.bio ?? 'Henüz açıklama eklenmemiş.'}
            </p>
          </Field>

          <Field label="Uzmanlık Alanları">
            {(clinic.specialties ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {(clinic.specialties ?? []).map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-sm">—</p>
            )}
          </Field>

          <Field label="Estelongy üyeliği">
            <p className="text-slate-300 text-sm">
              {new Date(clinic.created_at).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}{' '}
              tarihinden beri
            </p>
          </Field>
        </div>
      </section>

      {/* Hızlı linkler */}
      <section className="px-5 mt-4">
        <Link
          href="/klinik/panel/musaitlik"
          className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3.5 active:bg-slate-900 transition"
        >
          <Calendar size={18} className="text-slate-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold">Müsaitlik Saatleri</p>
            <p className="text-slate-500 text-xs">Hangi gün / saat randevu alıyorsun</p>
          </div>
          <ChevronRight size={18} className="text-slate-600 shrink-0" />
        </Link>
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      {children}
    </div>
  )
}
