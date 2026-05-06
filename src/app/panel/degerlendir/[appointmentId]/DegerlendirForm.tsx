'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  NPS_LABELS,
  STAR_DIMENSIONS,
  TEKRAR_GELIR_LABELS,
  type ClinicReviewInput,
  type ClinicReviewRow,
  type TekrarGelir,
} from '@/lib/clinic-review'
import { submitReviewAction } from './actions'

interface Props {
  appointmentId: string
  clinicName: string
  appointmentDate: string | null
  existingReview: ClinicReviewRow | null
  editLocked: boolean
}

export default function DegerlendirForm({
  appointmentId,
  clinicName,
  appointmentDate,
  existingReview,
  editLocked,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [stars, setStars] = useState({
    hijyen: existingReview?.hijyen ?? 0,
    personel: existingReview?.personel ?? 0,
    randevuUyumu: existingReview?.randevu_uyumu ?? 0,
    iletisim: existingReview?.iletisim ?? 0,
  })
  const [nps, setNps] = useState<number>(existingReview?.nps ?? -1)
  const [gereksizIslem, setGereksizIslem] = useState(existingReview?.gereksiz_islem ?? false)
  const [tekrarGelir, setTekrarGelir] = useState<TekrarGelir | ''>(existingReview?.tekrar_gelir ?? '')
  const [pozitif, setPozitif] = useState(existingReview?.pozitif_metin ?? '')
  const [iyilestirme, setIyilestirme] = useState(existingReview?.iyilestirme_metni ?? '')
  const [isAnonymous, setIsAnonymous] = useState(existingReview?.is_anonymous ?? false)

  const isEdit = !!existingReview
  const allStarsSet = Object.values(stars).every(v => v >= 1 && v <= 5)
  const npsSet = nps >= 0 && nps <= 4
  const tekrarSet = tekrarGelir !== ''
  const canSubmit = allStarsSet && npsSet && tekrarSet && !pending && !editLocked

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) {
      setError('Lütfen tüm zorunlu alanları doldur')
      return
    }
    setError(null)
    const input: ClinicReviewInput = {
      appointmentId,
      hijyen: stars.hijyen,
      personel: stars.personel,
      randevuUyumu: stars.randevuUyumu,
      iletisim: stars.iletisim,
      nps,
      gereksizIslem,
      tekrarGelir: tekrarGelir as TekrarGelir,
      pozitifMetin: pozitif.trim() || null,
      iyilestirmeMetni: iyilestirme.trim() || null,
      isAnonymous,
    }
    startTransition(async () => {
      const res = await submitReviewAction(input)
      if (!res.ok) {
        setError(res.error ?? 'Bir şeyler ters gitti')
      } else {
        setSuccess(true)
        router.refresh()
        setTimeout(() => router.push('/panel/analizlerim'), 1200)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Başlık */}
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Deneyimini Paylaş</h1>
        <p className="text-slate-400 text-sm mt-1">
          <span className="text-emerald-400 font-medium">{clinicName}</span>
          {appointmentDate && (
            <> · {new Date(appointmentDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</>
          )}
        </p>
        {isEdit && !editLocked && (
          <p className="text-amber-400 text-xs mt-2">
            Yorumunu düzenliyorsun. 7 gün boyunca güncelleyebilirsin.
          </p>
        )}
        {editLocked && (
          <p className="text-slate-500 text-xs mt-2">
            Düzenleme süresi (7 gün) doldu. Yorumun kalıcı kaydedildi.
          </p>
        )}
      </header>

      {/* Felsefe açıklaması */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 leading-relaxed">
        Estelongy <strong className="text-white">ölçüm platformu</strong> — hekim sanatı puanlanmaz,
        sonucu sistem ölçer. 4 objektif boyut + tavsiye eğilimi + tacir filtresi.
      </div>

      {/* 4 ★ Boyut */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Operasyonel Boyutlar</h2>
        {STAR_DIMENSIONS.map(dim => (
          <StarRow
            key={dim.key}
            label={dim.label}
            icon={dim.icon}
            value={stars[dim.key]}
            onChange={v => setStars(s => ({ ...s, [dim.key]: v }))}
            disabled={editLocked}
          />
        ))}
      </section>

      {/* NPS */}
      <section>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          Bu kliniği bir tanıdığına önerir misin?
        </h2>
        <div className="grid grid-cols-5 gap-2">
          {NPS_LABELS.map((label, i) => (
            <button
              key={i}
              type="button"
              disabled={editLocked}
              onClick={() => setNps(i)}
              className={`px-2 py-3 rounded-xl border text-xs font-medium transition-all ${
                nps === i
                  ? 'bg-emerald-500/20 border-emerald-500 text-white'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
              } ${editLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-base mb-1">{['😞', '🙁', '😐', '🙂', '🤩'][i]}</div>
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Tacir filtresi */}
      <section className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-4">
        <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Tacir Filtresi</h2>

        <label className={`flex items-start gap-3 cursor-pointer ${editLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="checkbox"
            checked={gereksizIslem}
            disabled={editLocked}
            onChange={e => setGereksizIslem(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
          />
          <span className="text-sm text-slate-300 leading-relaxed">
            Sana ihtiyacın <strong className="text-white">olmayan bir işlem</strong> önerildi mi?
            <span className="block text-xs text-slate-500 mt-0.5">
              (Bilgi gizlidir, kliniğe gösterilmez. Estelongy iç filtresinde kullanılır.)
            </span>
          </span>
        </label>

        <div>
          <p className="text-sm text-slate-300 mb-2">Tekrar gelir miydin?</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TEKRAR_GELIR_LABELS) as TekrarGelir[]).map(key => (
              <button
                key={key}
                type="button"
                disabled={editLocked}
                onClick={() => setTekrarGelir(key)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  tekrarGelir === key
                    ? 'bg-emerald-500/20 border-emerald-500 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                } ${editLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {TEKRAR_GELIR_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Serbest metin */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Yorum (opsiyonel)</h2>

        <div>
          <label className="text-xs text-emerald-400 font-medium">Pozitif</label>
          <textarea
            value={pozitif}
            disabled={editLocked}
            onChange={e => setPozitif(e.target.value.slice(0, 1000))}
            rows={3}
            placeholder="Beğendiğin yanları kısaca yaz…"
            className="mt-1 w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 resize-y disabled:opacity-50"
          />
          <p className="text-[10px] text-slate-600 mt-0.5 text-right">{pozitif.length}/1000</p>
        </div>

        <div>
          <label className="text-xs text-amber-400 font-medium">İyileştirme önerisi</label>
          <textarea
            value={iyilestirme}
            disabled={editLocked}
            onChange={e => setIyilestirme(e.target.value.slice(0, 1000))}
            rows={3}
            placeholder="Klinik nasıl daha iyi olabilir?"
            className="mt-1 w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 resize-y disabled:opacity-50"
          />
          <p className="text-[10px] text-slate-600 mt-0.5 text-right">{iyilestirme.length}/1000</p>
        </div>

        <label className={`flex items-start gap-3 cursor-pointer ${editLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="checkbox"
            checked={isAnonymous}
            disabled={editLocked}
            onChange={e => setIsAnonymous(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-violet-500 focus:ring-violet-500"
          />
          <span className="text-sm text-slate-300 leading-relaxed">
            Yorumumu <strong className="text-white">anonim</strong> yayınla
            <span className="block text-xs text-slate-500 mt-0.5">
              (İsmin görünmez, sadece &quot;Estelongy Kullanıcısı&quot; yazar.)
            </span>
          </span>
        </label>
      </section>

      {/* Hata / Başarı */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
          ✓ Yorumun kaydedildi. Geçmişine yönlendiriliyorsun…
        </div>
      )}

      {/* Submit */}
      {!editLocked && (
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
        >
          {pending ? 'Kaydediliyor…' : isEdit ? 'Yorumu Güncelle' : 'Yorumu Kaydet'}
        </button>
      )}
    </form>
  )
}

// ───────────────────────────────────────────────────────────────────

function StarRow({
  label, icon, value, onChange, disabled,
}: {
  label: string
  icon: string
  value: number
  onChange: (v: number) => void
  disabled: boolean
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800">
      <div className="flex items-center gap-2.5">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-white font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className={`w-8 h-8 flex items-center justify-center text-xl transition-colors ${
              n <= value ? 'text-amber-400' : 'text-slate-700 hover:text-slate-500'
            } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            aria-label={`${n} yıldız`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}
