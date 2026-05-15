'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  NPS_LABELS,
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

  // NOT: Operasyonel boyutlar (4 yıldız) geçici olarak kaldırıldı.
  // Yerine ileride akreditasyon temelli bir boyut gelecek.
  // DB constraint'ini kırmamak için nötr varsayılan (3/5) gönderilir.
  const stars = {
    hijyen: existingReview?.hijyen ?? 3,
    personel: existingReview?.personel ?? 3,
    randevuUyumu: existingReview?.randevu_uyumu ?? 3,
    iletisim: existingReview?.iletisim ?? 3,
  }
  const [nps, setNps] = useState<number>(existingReview?.nps ?? -1)
  const [gereksizIslem, setGereksizIslem] = useState(existingReview?.gereksiz_islem ?? false)
  const [tekrarGelir, setTekrarGelir] = useState<TekrarGelir | ''>(existingReview?.tekrar_gelir ?? '')
  const [pozitif, setPozitif] = useState(existingReview?.pozitif_metin ?? '')
  const [iyilestirme, setIyilestirme] = useState(existingReview?.iyilestirme_metni ?? '')
  // Default: anonim AÇIK (kullanıcı çekinmesin diye, isim görünmesin)
  const [isAnonymous, setIsAnonymous] = useState(existingReview?.is_anonymous ?? true)

  const isEdit = !!existingReview
  const npsSet = nps >= 0 && nps <= 3
  const tekrarSet = tekrarGelir !== ''
  const canSubmit = npsSet && tekrarSet && !pending && !editLocked

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
          <p className="text-amber-400 text-sm mt-2">
            Yorumunu düzenliyorsun. 7 gün boyunca güncelleyebilirsin.
          </p>
        )}
        {editLocked && (
          <p className="text-slate-500 text-sm mt-2">
            Düzenleme süresi (7 gün) doldu. Yorumun kalıcı kaydedildi.
          </p>
        )}
      </header>

      {/* Başlık metni */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <p className="text-sm font-bold text-white uppercase tracking-wider">
          Estelongy Deneyim Merkezi
        </p>
      </div>

      {/* NPS */}
      <section>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          Bu kliniği bir tanıdığına önerir misin?
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {NPS_LABELS.map((label, i) => (
            <button
              key={i}
              type="button"
              disabled={editLocked}
              onClick={() => setNps(i)}
              className={`px-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                nps === i
                  ? 'bg-emerald-500/20 border-emerald-500 text-white'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
              } ${editLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-base mb-1">{['🙁', '😐', '🙂', '🤩'][i]}</div>
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Tacir filtresi */}
      <section className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-4">
        <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Güven Endeksi</h2>

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
            <span className="block text-sm text-slate-500 mt-0.5">
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
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
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

      {/* PUBLIC YORUM — klinik sayfasında görünür */}
      <section className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
            Deneyimini Kullanıcılar ile Paylaş
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Bu yorum klinik sayfasında <strong className="text-emerald-300">herkese açık</strong> görünür.
          </p>
        </div>

        <textarea
          value={pozitif}
          disabled={editLocked}
          onChange={e => setPozitif(e.target.value.slice(0, 1000))}
          rows={4}
          placeholder="Diğer kullanıcılara faydalı olacak deneyimini kısaca yaz…"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 resize-y disabled:opacity-50"
        />
        <p className="text-sm text-slate-600 -mt-1 text-right">{pozitif.length}/1000</p>

        <label className={`flex items-start gap-3 cursor-pointer ${editLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="checkbox"
            checked={isAnonymous}
            disabled={editLocked}
            onChange={e => setIsAnonymous(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-sm text-slate-300 leading-relaxed">
            <strong className="text-white">Anonim</strong> yayınla
            <span className="block text-sm text-slate-500 mt-0.5">
              İsmin yerine &quot;Estelongy Kullanıcısı&quot; yazar.
            </span>
          </span>
        </label>
      </section>

      {/* PRIVATE MESAJ — sadece klinik görür */}
      <section className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-violet-300 uppercase tracking-wider">
            Dilek, İstek, Şikayet, Teşekkür Kutusu
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Bu mesaj <strong className="text-violet-300">sadece klinik</strong> tarafından görülür. Estelongy ekibi okumaz.
          </p>
        </div>

        <textarea
          value={iyilestirme}
          disabled={editLocked}
          onChange={e => setIyilestirme(e.target.value.slice(0, 1000))}
          rows={4}
          placeholder="Kliniğe iletmek istediğin dilek, istek, şikayet ya da teşekkür…"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 resize-y disabled:opacity-50"
        />
        <p className="text-sm text-slate-600 -mt-1 text-right">{iyilestirme.length}/1000</p>

        <p className="text-sm text-slate-500 italic">
          Klinik mesajını okur ve dilerse yanıtlar. Yanıt gelirse panelinde görünür.
        </p>
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

