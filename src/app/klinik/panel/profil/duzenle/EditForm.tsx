'use client'

import { useState, useTransition, useRef } from 'react'
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
  logo_url: string | null
  cover_image_url: string | null
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

const MAX_SIZE_MB = 5
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

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

  // Görsel state'leri — preview = data URL (yeni seçildi) || mevcut public URL
  const [logoPreview, setLogoPreview] = useState<string | null>(initial.logo_url)
  const [logoChanged, setLogoChanged] = useState(false) // yeni dosya seçildi mi
  const [logoRemoved, setLogoRemoved] = useState(false) // var olanı sil

  const [coverPreview, setCoverPreview] = useState<string | null>(initial.cover_image_url)
  const [coverChanged, setCoverChanged] = useState(false)
  const [coverRemoved, setCoverRemoved] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  function handleFilePick(
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (s: string | null) => void,
    setChanged: (b: boolean) => void,
    setRemoved: (b: boolean) => void,
  ) {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_MIME.includes(file.type)) {
      setError(`Sadece JPG/PNG/WebP yüklenebilir (${file.type} kabul edilmiyor).`)
      e.target.value = ''
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Dosya çok büyük (${(file.size / 1024 / 1024).toFixed(1)} MB) — en fazla ${MAX_SIZE_MB} MB.`)
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
    setChanged(true)
    setRemoved(false)
  }

  function clearLogo() {
    setLogoPreview(null)
    setLogoChanged(false)
    setLogoRemoved(true)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }
  function clearCover() {
    setCoverPreview(null)
    setCoverChanged(false)
    setCoverRemoved(true)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    if (logoRemoved && !logoChanged) fd.append('remove_logo', '1')
    if (coverRemoved && !coverChanged) fd.append('remove_cover', '1')
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
    <form onSubmit={onSubmit} encType="multipart/form-data" className="space-y-5">
      {/* === GÖRSELLER === */}
      <div className="space-y-4 pb-5 border-b border-slate-700/50">
        {/* Kapak */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1.5">Kapak Görseli</label>
          <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden bg-slate-900 border border-slate-700">
            {coverPreview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPreview} alt="Kapak önizleme" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none" />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs">Kapak görseli yok</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg cursor-pointer transition-colors">
              {coverPreview ? 'Değiştir' : 'Kapak Yükle'}
              <input
                ref={coverInputRef}
                type="file"
                name="cover_image"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => handleFilePick(e, setCoverPreview, setCoverChanged, setCoverRemoved)}
              />
            </label>
            {coverPreview && (
              <button
                type="button"
                onClick={clearCover}
                className="px-3 py-1.5 text-slate-500 hover:text-red-400 text-xs font-medium transition-colors"
              >
                Kaldır
              </button>
            )}
            <p className="text-[10px] text-slate-600 ml-auto">JPG/PNG/WebP · Max 5 MB · 3:1 önerilir</p>
          </div>
        </div>

        {/* Logo */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1.5">Logo / Avatar</label>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Logo önizleme" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg cursor-pointer transition-colors">
                  {logoPreview ? 'Değiştir' : 'Logo Yükle'}
                  <input
                    ref={logoInputRef}
                    type="file"
                    name="logo"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => handleFilePick(e, setLogoPreview, setLogoChanged, setLogoRemoved)}
                  />
                </label>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="px-3 py-1.5 text-slate-500 hover:text-red-400 text-xs font-medium transition-colors"
                  >
                    Kaldır
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5">Kare format · Max 5 MB · Logo yoksa baş harfin gösterilir</p>
            </div>
          </div>
        </div>
      </div>

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
