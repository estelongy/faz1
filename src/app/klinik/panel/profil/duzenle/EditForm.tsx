'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CLINIC_TYPES, ALL_TREATMENTS, TREATMENTS_BY_BRANCH, TITLES } from '@/lib/randevu-filters'
import { updateClinicProfileAction } from './actions'

const MAX_SPECIALTIES = 100
const MAX_SPECIALTY_LEN = 80

function trNorm(s: string) {
  return s.replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i').toLowerCase()
}

interface Initial {
  name: string
  title: string | null
  location: string | null
  bio: string | null
  clinic_type: string | null
  specialties: string[] | null
  phone: string | null
  logo_url: string | null
  cover_image_url: string | null
}

// Klinik tipi listesi tek kaynaktan (CLINIC_TYPES — randevu-filters.ts).
// Klinik basvuru formuyla ayni; data tutarliligi icin onemli.

const MAX_SIZE_MB = 5
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

export default function EditForm({ initial }: { initial: Initial }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState(initial.name)
  const [title, setTitle] = useState(initial.title ?? '')
  const [location, setLocation] = useState(initial.location ?? '')
  const [clinicType, setClinicType] = useState(initial.clinic_type ?? '')
  const [bio, setBio] = useState(initial.bio ?? '')
  const [phone, setPhone] = useState(initial.phone ?? '')
  const [specialtyTags, setSpecialtyTags] = useState<string[]>(
    Array.from(new Set((initial.specialties ?? []).map(s => s.trim()).filter(Boolean))).slice(0, MAX_SPECIALTIES),
  )
  const [specialtyQuery, setSpecialtyQuery] = useState('')
  const [specialtyOpen, setSpecialtyOpen] = useState(false)
  const [extraSearchOpen, setExtraSearchOpen] = useState(false)
  const specialtyBoxRef = useRef<HTMLDivElement>(null)

  // Branş listesi (clinic_type seçiliyse)
  const branchTreatments = clinicType ? (TREATMENTS_BY_BRANCH[clinicType] ?? []) : []
  const branchSet = new Set(branchTreatments)
  const branchSelectedCount = specialtyTags.filter(t => branchSet.has(t)).length
  const allBranchSelected = branchTreatments.length > 0 && branchSelectedCount === branchTreatments.length
  const extraTags = specialtyTags.filter(t => !branchSet.has(t))

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (specialtyBoxRef.current && !specialtyBoxRef.current.contains(e.target as Node)) {
        setSpecialtyOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Autocomplete: clinic_type seçiliyse branş listesini gizle (ekstra modunda zaten branş dışı arıyor)
  const specialtyFiltered = (() => {
    const q = specialtyQuery.trim()
    if (q.length < 1) return [] as string[]
    const qn = trNorm(q)
    return ALL_TREATMENTS
      .filter(s => !specialtyTags.includes(s) && !branchSet.has(s) && trNorm(s).includes(qn))
      .slice(0, 10)
  })()

  function addSpecialty(raw: string) {
    const v = raw.trim().slice(0, MAX_SPECIALTY_LEN)
    if (!v) return
    if (specialtyTags.includes(v)) return
    if (specialtyTags.length >= MAX_SPECIALTIES) return
    setSpecialtyTags([...specialtyTags, v])
    setSpecialtyQuery('')
    setSpecialtyOpen(false)
  }
  function removeSpecialty(tag: string) {
    setSpecialtyTags(specialtyTags.filter(t => t !== tag))
  }
  function toggleBranchTreatment(t: string) {
    if (specialtyTags.includes(t)) {
      setSpecialtyTags(specialtyTags.filter(x => x !== t))
    } else {
      if (specialtyTags.length >= MAX_SPECIALTIES) return
      setSpecialtyTags([...specialtyTags, t])
    }
  }
  function toggleSelectAllBranch() {
    if (allBranchSelected) {
      // Tümünü kaldır (sadece branş itemları, ekstralar kalsın)
      setSpecialtyTags(specialtyTags.filter(t => !branchSet.has(t)))
    } else {
      // Tüm branş itemlarını ekle (ekstralarla beraber, cap'i aşma)
      const merged = Array.from(new Set([...specialtyTags, ...branchTreatments]))
      setSpecialtyTags(merged.slice(0, MAX_SPECIALTIES))
    }
  }

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
          <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1.5">Kapak Görseli</label>
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
                <p className="text-sm">Kapak görseli yok</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium rounded-lg cursor-pointer transition-colors">
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
                className="px-3 py-1.5 text-slate-500 hover:text-red-400 text-base font-medium transition-colors"
              >
                Kaldır
              </button>
            )}
            <p className="text-sm text-slate-600 ml-auto">JPG/PNG/WebP · Max 5 MB · 3:1 önerilir</p>
          </div>
        </div>

        {/* Logo */}
        <div>
          <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1.5">Logo / Avatar</label>
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
                <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium rounded-lg cursor-pointer transition-colors">
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
                    className="px-3 py-1.5 text-slate-500 hover:text-red-400 text-base font-medium transition-colors"
                  >
                    Kaldır
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-1.5">Kare format · Max 5 MB · Logo yoksa baş harfin gösterilir</p>
            </div>
          </div>
        </div>
      </div>

      {/* Unvan + Klinik adı */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
        <div>
          <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1.5">Unvan</label>
          <select
            name="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
          >
            <option value="">— Yok —</option>
            {TITLES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1.5">Klinik / Hekim Adı *</label>
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
      </div>
      <p className="-mt-3 text-sm text-slate-600">Unvan ad ile birlikte kartta gösterilir (ör. <span className="text-slate-400">Op. Dr. {name || 'İsim'}</span>).</p>

      {/* Konum */}
      <div>
        <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1.5">Konum</label>
        <input
          name="location"
          maxLength={200}
          value={location}
          onChange={e => setLocation(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          placeholder="Örn. İstanbul, Beşiktaş"
        />
        <p className="text-sm text-slate-600 mt-1">İlçe + il yazılırsa filtrelerde daha iyi eşleşir.</p>
      </div>

      {/* Klinik tipi (uzmanlık dalı) */}
      <div>
        <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1.5">Klinik Tipi / Uzmanlık Dalı</label>
        <select
          name="clinic_type"
          value={clinicType}
          onChange={e => setClinicType(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
        >
          <option value="">Seçiniz…</option>
          {CLINIC_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <p className="text-sm text-slate-600 mt-1">Hekim diploma branşınız — kart üzerinde isim altında görünür.</p>
      </div>

      {/* Telefon */}
      <div>
        <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1.5">Telefon</label>
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
        <label className="flex items-center justify-between text-sm uppercase tracking-widest text-slate-500 mb-1.5">
          <span>Hakkında</span>
          <span className={`text-sm normal-case tracking-normal ${bioCharsLeft < 100 ? 'text-amber-400' : 'text-slate-600'}`}>
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

      {/* Hizmetleriniz — branş bazlı checkbox grid + Tümünü Seç + Ayrıca Ekle */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm uppercase tracking-widest text-slate-500">
            Hizmetleriniz
            {clinicType && branchTreatments.length > 0 && (
              <span className="ml-2 normal-case tracking-normal text-slate-600">— {branchTreatments.length} seçenek</span>
            )}
            <span className="ml-2 normal-case tracking-normal text-slate-600">({specialtyTags.length}/{MAX_SPECIALTIES})</span>
          </label>
          {clinicType && branchTreatments.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAllBranch}
              className="text-base text-violet-400 hover:text-violet-300 transition-colors font-medium"
            >
              {allBranchSelected ? 'Tümünü Kaldır' : 'Tümünü Seç'}
            </button>
          )}
        </div>

        {/* Hidden input — server action virgülle ayrılmış string bekliyor */}
        <input type="hidden" name="specialties" value={specialtyTags.join(', ')} />

        {!clinicType ? (
          <div className="p-4 rounded-xl border border-slate-700/50 border-dashed text-center text-slate-500 text-sm">
            Önce Klinik Tipi seçin
          </div>
        ) : branchTreatments.length === 0 ? (
          <div className="p-4 rounded-xl border border-slate-700/50 border-dashed text-center text-slate-500 text-sm">
            Bu branş için liste tanımlı değil — &quot;Ayrıca Ekle&quot; ile manuel ekleyin
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {branchTreatments.map(t => {
              const checked = specialtyTags.includes(t)
              return (
                <label
                  key={t}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors group ${
                    checked
                      ? 'border-violet-500/50 bg-violet-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleBranchTreatment(t)}
                    disabled={!checked && specialtyTags.length >= MAX_SPECIALTIES}
                    className="accent-violet-500 w-4 h-4 shrink-0"
                  />
                  <span className={`text-sm leading-snug transition-colors ${checked ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                    {t}
                  </span>
                </label>
              )
            })}
          </div>
        )}

        {/* Ayrıca Ekle — diğer branşlardan veya serbest giriş */}
        <div className="mt-3">
          {!extraSearchOpen ? (
            <button
              type="button"
              onClick={() => setExtraSearchOpen(true)}
              disabled={specialtyTags.length >= MAX_SPECIALTIES}
              className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Ayrıca Ekle (diğer branşlardan)
            </button>
          ) : (
            <div ref={specialtyBoxRef} className="relative">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus-within:border-violet-500 transition-colors">
                <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <input
                  type="text"
                  value={specialtyQuery}
                  onChange={e => { setSpecialtyQuery(e.target.value); setSpecialtyOpen(true) }}
                  onFocus={() => { if (specialtyQuery.trim().length >= 1) setSpecialtyOpen(true) }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      if (specialtyFiltered[0]) addSpecialty(specialtyFiltered[0])
                      else if (specialtyQuery.trim()) addSpecialty(specialtyQuery)
                    } else if (e.key === 'Escape') {
                      setSpecialtyQuery(''); setSpecialtyOpen(false); setExtraSearchOpen(false)
                    }
                  }}
                  maxLength={MAX_SPECIALTY_LEN}
                  disabled={specialtyTags.length >= MAX_SPECIALTIES}
                  autoFocus
                  placeholder={specialtyTags.length >= MAX_SPECIALTIES ? 'Limit doldu' : 'Tedavi ara… (ör: Meme dikleştirme)'}
                  className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none min-w-0 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => { setSpecialtyQuery(''); setSpecialtyOpen(false); setExtraSearchOpen(false) }}
                  className="text-slate-500 hover:text-white transition-colors shrink-0"
                  aria-label="Kapat"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {specialtyOpen && specialtyFiltered.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto">
                  {specialtyFiltered.map(s => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={e => { e.preventDefault(); addSpecialty(s) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-b border-slate-700/50 last:border-0"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-sm text-slate-600 mt-1">
                Listeden seç veya yaz + Enter · Branş dışı tedaviler buraya
              </p>
            </div>
          )}
        </div>

        {/* Ekstra (branş dışı) tag'ler — ayrı bölüm */}
        {extraTags.length > 0 && (
          <div className="mt-3">
            <p className="text-sm uppercase tracking-widest text-slate-500 mb-1.5">Ekstra Tedaviler ({extraTags.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {extraTags.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 text-sm uppercase tracking-wider px-2 py-1 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/30"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSpecialty(s)}
                    className="text-violet-400 hover:text-white transition-colors"
                    aria-label={`${s} kaldır`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
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
          className="px-5 py-2.5 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-base font-medium rounded-xl transition-colors"
        >
          Vazgeç
        </Link>
      </div>
    </form>
  )
}
