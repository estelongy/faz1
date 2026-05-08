'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateClinicProfileAction } from './actions'

interface Initial {
  name: string
  location: string | null
  bio: string | null
  clinic_type: string | null
  specialties: string[] | null
  phone: string | null
}

const TYPE_OPTIONS = [
  { value: '', label: 'Seçiniz…' },
  { value: 'estetik', label: 'Estetik' },
  { value: 'dermatoloji', label: 'Dermatoloji' },
  { value: 'sac_ekimi', label: 'Saç Ekimi' },
  { value: 'lazer', label: 'Lazer' },
  { value: 'longevity', label: 'Longevity' },
  { value: 'diger', label: 'Diğer' },
]

export default function EditForm({ initial }: { initial: Initial }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState(initial.name)
  const [location, setLocation] = useState(initial.location ?? '')
  const [clinicType, setClinicType] = useState(initial.clinic_type ?? '')
  const [bio, setBio] = useState(initial.bio ?? '')
  const [phone, setPhone] = useState(initial.phone ?? '')
  const [specialties, setSpecialties] = useState((initial.specialties ?? []).join(', '))

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateClinicProfileAction(fd)
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/klinik/panel/profil'), 800)
      } else {
        setError(res.error ?? 'Bir hata oluştu.')
      }
    })
  }

  const bioCharsLeft = 2000 - bio.length

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Klinik adı */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1.5">Klinik Adı *</label>
        <input
          name="name"
          required
          minLength={2}
          maxLength={120}
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          placeholder="Örn. Estelongy Beauty Clinic"
        />
      </div>

      {/* Konum */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1.5">Konum</label>
        <input
          name="location"
          maxLength={200}
          value={location}
          onChange={e => setLocation(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          placeholder="Örn. İstanbul, Beşiktaş"
        />
        <p className="text-[11px] text-slate-600 mt-1">İlçe + il yazılırsa filtrelerde daha iyi eşleşir.</p>
      </div>

      {/* Klinik tipi */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1.5">Klinik Tipi</label>
        <select
          name="clinic_type"
          value={clinicType}
          onChange={e => setClinicType(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
        >
          {TYPE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Telefon */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1.5">Telefon</label>
        <input
          name="phone"
          type="tel"
          maxLength={32}
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          placeholder="Örn. +90 212 000 0000"
        />
      </div>

      {/* Hakkında */}
      <div>
        <label className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-500 mb-1.5">
          <span>Hakkında</span>
          <span className={`text-[10px] normal-case tracking-normal ${bioCharsLeft < 100 ? 'text-amber-400' : 'text-slate-600'}`}>
            {bioCharsLeft} karakter
          </span>
        </label>
        <textarea
          name="bio"
          rows={6}
          maxLength={2000}
          value={bio}
          onChange={e => setBio(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
          placeholder="Kliniğinizin hekim kadrosu, kullanılan teknolojiler, akreditasyonlar ve yaklaşımınız hakkında kısa bilgi…"
        />
      </div>

      {/* Uzmanlık alanları */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1.5">Uzmanlık Alanları</label>
        <input
          name="specialties"
          value={specialties}
          onChange={e => setSpecialties(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          placeholder="Botoks, HA Dolgu, Skin Booster, Mezoterapi"
        />
        <p className="text-[11px] text-slate-600 mt-1">Virgülle ayır · Max 12 etiket · Her biri max 40 karakter</p>
        {/* Önizleme */}
        {specialties.trim() && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {specialties.split(',').map(s => s.trim()).filter(Boolean).slice(0, 12).map((s, i) => (
              <span key={i} className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/30">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
          ✓ Profil güncellendi. Yönlendiriliyorsun…
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
        >
          {pending ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <Link
          href="/klinik/panel/profil"
          className="px-5 py-2.5 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-sm font-medium rounded-xl transition-colors"
        >
          Vazgeç
        </Link>
      </div>
    </form>
  )
}
