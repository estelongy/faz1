import KlinikAkisWizard from '@/components/KlinikAkisWizard'

interface Props {
  clinicName: string
  patientName: string
  appointment: Parameters<typeof KlinikAkisWizard>[0]['appointment']
  analysis: Parameters<typeof KlinikAkisWizard>[0]['analysis']
  creditBalance: number
  freeBalance: number
  hastaAnketCevaplari: Record<string, number> | null
  onKabul: Parameters<typeof KlinikAkisWizard>[0]['onKabul']
  onSaveAnket: Parameters<typeof KlinikAkisWizard>[0]['onSaveAnket']
  onSaveTetkik: Parameters<typeof KlinikAkisWizard>[0]['onSaveTetkik']
  onSaveIleriAnaliz: Parameters<typeof KlinikAkisWizard>[0]['onSaveIleriAnaliz']
  onSaveHekim: Parameters<typeof KlinikAkisWizard>[0]['onSaveHekim']
  onFinalOnay: Parameters<typeof KlinikAkisWizard>[0]['onFinalOnay']
}

/**
 * EsteKlinikPRO mobil — klinik iş akışı (randevu detay sayfası).
 * NativeTopBar zaten "Klinik İş Akışı" gösterir → h1 yok.
 */
export default function RandevuDetayAppView({
  clinicName,
  patientName,
  appointment,
  analysis,
  creditBalance,
  freeBalance,
  hastaAnketCevaplari,
  onKabul,
  onSaveAnket,
  onSaveTetkik,
  onSaveIleriAnaliz,
  onSaveHekim,
  onFinalOnay,
}: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-3">
        <p className="text-white font-bold text-base">{patientName}</p>
        <p className="text-xs text-slate-500 mt-0.5">{clinicName}</p>
      </header>

      {!analysis && (
        <section className="px-5 mb-3">
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 px-3 py-3 text-amber-200 text-xs">
            ⚠ Bu hastanın henüz ön analizi yok. Hasta önce analiz yapmalı.
          </div>
        </section>
      )}

      <section className="px-5">
        <KlinikAkisWizard
          appointment={appointment}
          analysis={analysis}
          creditBalance={creditBalance}
          freeBalance={freeBalance}
          hastaAnketCevaplari={hastaAnketCevaplari}
          onKabul={onKabul}
          onSaveAnket={onSaveAnket}
          onSaveTetkik={onSaveTetkik}
          onSaveIleriAnaliz={onSaveIleriAnaliz}
          onSaveHekim={onSaveHekim}
          onFinalOnay={onFinalOnay}
        />
      </section>
    </div>
  )
}
