import Link from 'next/link'
import { ArrowRight, Calendar, MapPin, Clock } from 'lucide-react'
import ClinicCard, { type ClinicRow } from './ClinicCard'
import AuthRefreshGate from '@/components/native/AuthRefreshGate'

/**
 * EsteKlinik app-özel EV ekranı (App Başrol Modeli — Stage 2 / 2).
 *
 * Sadece EsteKlinik FLAVOR app'inde /esteklinik'te render edilir (UA'dan
 * server tespiti). Web ve diğer flavor'lar mevcut "Randevu Ara" arama
 * hero'sunu görür.
 *
 * Başrol-değeri yüzeye çıkarma:
 *   - "Yaklaşan randevular" — web'de /panel altında gömülü; app'te ev'in tepesinde
 *   - "Sana uygun klinik" — EGP sıralı ilk 6, kart formunda
 *   - "Klinik misin? Başvur" sakin link (üst eyebrow yerine alt-bant)
 */

export interface AppointmentItem {
  id: string
  appointment_date: string
  status: string
  clinic_name: string | null
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: 'Onay bekliyor', color: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Onaylandı', color: 'bg-emerald-100 text-emerald-800' },
  in_progress: { label: 'Sürüyor', color: 'bg-sky-100 text-sky-800' },
  completed: { label: 'Tamamlandı', color: 'bg-slate-100 text-slate-700' },
  cancelled: { label: 'İptal', color: 'bg-rose-100 text-rose-800' },
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function KlinikAppHome({
  userName,
  serverAuthed,
  upcoming,
  recommended,
}: {
  userName: string | null
  serverAuthed: boolean
  upcoming: AppointmentItem[]
  recommended: ClinicRow[]
}) {
  return (
    <div className="bg-white pb-6">
      {/* Cold-start auth race: server guest gördüyse ama client girişliyse tazele */}
      <AuthRefreshGate serverAuthed={serverAuthed} />

      {/* Sakin "senin için" ev başlığı — derin teal yerine açık */}
      <section className="px-5 pt-4 pb-1">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#10876B]">EsteKlinik</p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-[-0.01em]">
          {userName ? `Merhaba, ${userName}` : 'Randevuların'}
        </h1>
        <p className="text-slate-600 text-sm mt-1">Onaylı klinikler · EGP ile sıralı</p>
      </section>

      {/* Yaklaşan randevular — web'de panel altında gömülü; app'te öne çıkar */}
      {upcoming.length > 0 && (
        <section className="px-5 py-3">
          <h2 className="text-lg font-bold text-slate-900 tracking-[-0.01em] mb-3">Yaklaşan randevuların</h2>
          <div className="flex flex-col gap-2">
            {upcoming.map((a) => {
              const st = STATUS_LABEL[a.status] ?? { label: a.status, color: 'bg-slate-100 text-slate-700' }
              return (
                <div
                  key={a.id}
                  className="rounded-xl border border-slate-200 bg-white p-3 active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-base font-semibold text-slate-900 leading-snug">{a.clinic_name ?? 'Klinik'}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Clock size={14} />
                    <span>{formatDate(a.appointment_date)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Hızlı eylemler */}
      <section className="px-5 py-3">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/esteklinik#ara"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 active:bg-emerald-100 transition-colors"
          >
            <Calendar size={20} className="text-[#10876B] mb-2" />
            <p className="text-sm font-bold text-slate-900">Randevu ara</p>
            <p className="text-xs text-slate-600 mt-0.5">Branş, konum, EGP</p>
          </Link>
          <Link
            href="/rehber"
            className="rounded-xl border border-slate-200 bg-white p-3 active:bg-slate-50 transition-colors"
          >
            <MapPin size={20} className="text-slate-700 mb-2" />
            <p className="text-sm font-bold text-slate-900">İşlem rehberi</p>
            <p className="text-xs text-slate-600 mt-0.5">Hangi işlem sana uygun?</p>
          </Link>
        </div>
      </section>

      {/* Önerilen klinikler — EGP sıralı (server'dan ilk 6) */}
      {recommended.length > 0 && (
        <section className="px-5 py-3">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-[-0.01em]">Sana uygun klinik</h2>
            <Link href="/esteklinik#ara" className="inline-flex items-center gap-1 text-sm font-semibold text-[#10876B]">
              Tümü <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {recommended.slice(0, 6).map((c) => (
              <ClinicCard key={c.id} clinic={c} />
            ))}
          </div>
        </section>
      )}

      {/* Klinik misin? sakin alt-bant */}
      <section className="px-5 py-4 mt-2">
        <Link
          href="/esteklinik/basvur"
          className="block rounded-xl border border-slate-200 bg-slate-50 p-3 active:bg-slate-100 transition-colors"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Klinik misin?</p>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">EsteKlinik&apos;e başvur →</p>
        </Link>
      </section>
    </div>
  )
}
