'use client'

/**
 * Tek Ekran Klinik — sol gün akışı, sağ hasta karnesi, alt muhasebe şeridi.
 * Sayfa geçişi yok: randevu, işlem, tahsilat hepsi bu ekranda inline çözülür.
 * Rol odağı: doktor → sıradaki hastanın karnesi açık başlar; sekreter → gün akışı.
 */

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  addQuickEntry, addPayment, addPatient,
  createAppointmentForPatient, setAppointmentStatus,
  addPaymentPromise, settlePaymentPromise,
  addPatientPhoto, deletePatientPhoto,
  logPackageSession, updatePaymentPromise,
} from './actions'
import type { KlinikRole } from '@/lib/muhasebe-owner'
import type { CatalogItem, PatientRow } from './MuhasebeShellClient'

export interface ApptRow {
  id: string
  patient_id: string
  start_at: string
  duration_minutes: number
  treatment_type: string | null
  appointment_type: string | null
  status: string
  package_treatment_id: string | null
}
export interface PromiseRow {
  id: string
  patient_id: string
  due_date: string     // YYYY-MM-DD
  amount: number
  note: string | null
  status: string
}
export interface PhotoRow {
  id: string
  patient_id: string
  treatment_id: string | null
  note: string | null
  created_at: string
  url: string          // imzalı URL (1 saat)
}
export interface PackageRow {
  treatment_id: string
  patient_id: string
  name: string
  session_total: number
  done: number       // tamamlanan seans (completed randevu sayısı)
  planned: number    // planlı seans
  next_at: string | null
}
export interface TxRow {
  id: string
  patient_id: string
  kind: 'islem' | 'tahsilat'
  date: string          // YYYY-MM-DD
  label: string         // işlem adı / ödeme yöntemi
  amount: number
}

interface Props {
  role: KlinikRole
  displayName: string
  patients: PatientRow[]
  appointments: ApptRow[]   // -30 / +90 gün aralığı, tüm durumlar
  txs: TxRow[]              // işlem + tahsilat birleşik (tüm kayıtlar)
  catalog: CatalogItem[]
  packages: PackageRow[]    // seanslı işlemler (session_total > 1) + sayaçları
  promises: PromiseRow[]    // açık ödeme sözleri
  photos: PhotoRow[]        // hasta fotoğrafları (imzalı URL'lerle)
}

const TRY = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)

const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })

function dayLabel(iso: string): string {
  const t = todayIso()
  if (iso === t) return 'Bugün'
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'Planlı', cls: 'bg-violet-500/20 text-violet-300' },
  completed: { label: 'Tamamlandı', cls: 'bg-emerald-500/20 text-emerald-300' },
  cancelled: { label: 'İptal', cls: 'bg-slate-600/40 text-slate-400' },
  no_show: { label: 'Gelmedi', cls: 'bg-rose-500/20 text-rose-300' },
}

export default function TekEkranKlinik({ role, patients, appointments, txs, catalog, packages, promises, photos }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [day, setDay] = useState(todayIso())
  const [search, setSearch] = useState('')
  const [leftView, setLeftView] = useState<'gun' | 'alacak' | 'hastalar'>('gun')

  const dayAppts = useMemo(
    () => appointments
      .filter(a => new Date(a.start_at).toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }) === day)
      .sort((a, b) => a.start_at.localeCompare(b.start_at)),
    [appointments, day],
  )

  // Doktor açılışı: bugünün sıradaki (şu andan sonraki ilk planlı) hastası
  const initialPatient = useMemo(() => {
    if (role !== 'doktor') return null
    const now = Date.now()
    const next = dayAppts.find(a => a.status === 'scheduled' && new Date(a.start_at).getTime() >= now - 15 * 60_000)
      ?? dayAppts.find(a => a.status === 'scheduled')
    return next?.patient_id ?? null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [selectedId, setSelectedId] = useState<string | null>(initialPatient)
  const selected = patients.find(p => p.id === selectedId) ?? null

  // Mobil: hasta seçiliyken sağ panel tam ekran
  const [mobilePanelOpen, setMobilePanelOpen] = useState(!!initialPatient && role === 'doktor')

  const searchResults = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr')
    if (q.length < 2) return []
    return patients.filter(p =>
      p.name.toLocaleLowerCase('tr').includes(q) || (p.phone ?? '').includes(q)
    ).slice(0, 8)
  }, [search, patients])

  const patientTimeline = useMemo(() => {
    if (!selectedId) return []
    return txs.filter(t => t.patient_id === selectedId)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [txs, selectedId])

  // Seçili hastanın paketleri (aktifler önde: tamamlanmamış olanlar)
  const patientPackages = useMemo(() => {
    if (!selectedId) return []
    return packages
      .filter(p => p.patient_id === selectedId)
      .sort((a, b) => (a.done >= a.session_total ? 1 : 0) - (b.done >= b.session_total ? 1 : 0))
  }, [packages, selectedId])
  const activePackages = patientPackages.filter(p => p.done < p.session_total)

  const pkgById = useMemo(() => new Map(packages.map(p => [p.treatment_id, p])), [packages])

  const patientAppts = useMemo(() => {
    if (!selectedId) return []
    const now = new Date().toISOString()
    return appointments
      .filter(a => a.patient_id === selectedId && a.status === 'scheduled' && a.start_at >= now)
      .sort((a, b) => a.start_at.localeCompare(b.start_at))
      .slice(0, 12)
  }, [appointments, selectedId])

  // Yaklaşan randevular güne gruplanır: "(tarih saat) — A (1/3) + B (0/4)"
  const patientApptDays = useMemo(() => {
    const map = new Map<string, typeof patientAppts>()
    for (const a of patientAppts) {
      const k = new Date(a.start_at).toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
      map.set(k, [...(map.get(k) ?? []), a])
    }
    return Array.from(map.entries()).slice(0, 6)
  }, [patientAppts])

  // Alacak listesi: borçlu hastalar; söz tarihi geçenler önde, sonra en yakın söz, sonra borç büyüklüğü
  const today = todayIso()
  const debtors = useMemo(() => {
    return patients
      .filter(p => p.remaining > 0)
      .map(p => {
        const open = promises
          .filter(pr => pr.patient_id === p.id)
          .sort((a, b) => a.due_date.localeCompare(b.due_date))
        const first = open[0] ?? null
        const overdue = first ? first.due_date < today : false
        return { ...p, promise: first, overdue, promisedTotal: open.reduce((s, x) => s + Number(x.amount), 0) }
      })
      .sort((a, b) => {
        if (a.overdue !== b.overdue) return a.overdue ? -1 : 1
        if (a.promise && b.promise) return a.promise.due_date.localeCompare(b.promise.due_date)
        if (!!a.promise !== !!b.promise) return a.promise ? -1 : 1
        return b.remaining - a.remaining
      })
  }, [patients, promises, today])
  const overdueCount = debtors.filter(d => d.overdue).length
  const totalReceivable = debtors.reduce((s, d) => s + d.remaining, 0)

  // Hastalar görünümü: son hareket tarihine göre (yeniler önce), sonra ada göre
  const allPatients = useMemo(
    () => [...patients].sort((a, b) =>
      (b.last_activity ?? '').localeCompare(a.last_activity ?? '') || a.name.localeCompare(b.name, 'tr')),
    [patients],
  )

  const patientPhotos = useMemo(
    () => selectedId ? photos.filter(f => f.patient_id === selectedId) : [],
    [photos, selectedId],
  )
  // Foto formundaki "işleme bağla" seçici için hastanın işlemleri (yeniden eskiye, son 12)
  const patientTreatments = useMemo(
    () => selectedId
      ? txs.filter(t => t.patient_id === selectedId && t.kind === 'islem')
          .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12)
      : [],
    [txs, selectedId],
  )
  const treatmentLabel = (tid: string | null) => {
    if (!tid) return null
    const t = txs.find(x => x.kind === 'islem' && x.id === tid)
    return t ? t.label : null
  }

  const patientPromises = useMemo(
    () => selectedId ? promises.filter(pr => pr.patient_id === selectedId).sort((a, b) => a.due_date.localeCompare(b.due_date)) : [],
    [promises, selectedId],
  )

  // Günün muhasebe şeridi
  const dayStats = useMemo(() => {
    const dayTxs = txs.filter(t => t.date === day)
    return {
      islem: dayTxs.filter(t => t.kind === 'islem'),
      billed: dayTxs.filter(t => t.kind === 'islem').reduce((s, t) => s + t.amount, 0),
      collected: dayTxs.filter(t => t.kind === 'tahsilat').reduce((s, t) => s + t.amount, 0),
    }
  }, [txs, day])

  const monthStats = useMemo(() => {
    const mk = day.slice(0, 7)
    const mTxs = txs.filter(t => t.date.startsWith(mk))
    return {
      billed: mTxs.filter(t => t.kind === 'islem').reduce((s, t) => s + t.amount, 0),
      collected: mTxs.filter(t => t.kind === 'tahsilat').reduce((s, t) => s + t.amount, 0),
      label: new Date(day + 'T12:00:00').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
    }
  }, [txs, day])

  // ── Inline form durumu: aynı anda tek form açık ──
  type FormKind = 'islem' | 'tahsilat' | 'randevu' | 'yeniHasta' | 'soz' | 'foto' | null
  const [openForm, setOpenForm] = useState<FormKind>(null)
  const [photoProgress, setPhotoProgress] = useState<string | null>(null)
  const [photoTreatmentId, setPhotoTreatmentId] = useState('')
  const [photoNote, setPhotoNote] = useState('')

  // Seçilen dosyaları anında sıkıştırıp yükle — ayrıca "Yükle" tuşu yok.
  function uploadPhotos(files: File[]) {
    if (!selectedId || files.length === 0) return
    setError(null)
    startTransition(async () => {
      for (let i = 0; i < files.length; i++) {
        setPhotoProgress(`${i + 1}/${files.length} yükleniyor…`)
        const compressed = await compressImage(files[i])
        const fd = new FormData()
        fd.set('photo', compressed)
        fd.set('treatment_id', photoTreatmentId)
        fd.set('stage', photoStage)
        if (photoNote) fd.set('note', photoNote)
        const res = await addPatientPhoto(selectedId, fd)
        if (!res.ok) { setError(res.error ?? 'Yükleme hatası'); break }
      }
      setPhotoProgress(null)
      // Doğal akış: öncesi yüklendi → sıradaki küme büyük ihtimalle sonrası
      if (photoStage === 'oncesi') setPhotoStage('sonrasi')
      router.refresh()
    })
  }
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [photoStage, setPhotoStage] = useState<'oncesi' | 'sonrasi' | 'kontrol'>('oncesi')
  // Karşılaştırma modu: 2 foto seç → yan yana
  const [compareMode, setCompareMode] = useState(false)
  const [compareSel, setCompareSel] = useState<string[]>([])
  const [compareView, setCompareView] = useState<'yanyana' | 'kaydir'>('yanyana')
  const [randevuPkgId, setRandevuPkgId] = useState('')
  // Seans Yap mini detay formu (hangi paket için açık) + söz düzenle/tahsil onayı
  const [seansFormPkg, setSeansFormPkg] = useState<string | null>(null)
  const [editingPromiseId, setEditingPromiseId] = useState<string | null>(null)
  const [settlingPromiseId, setSettlingPromiseId] = useState<string | null>(null)
  const [sliderPos, setSliderPos] = useState(50)

  // İstemci tarafı sıkıştırma: uzun kenar 1600px, JPEG %80 → 4-8 MB'lık kamera
  // fotoğrafı ~200-500 KB'a iner, yükleme 10 kat hızlanır. Decode edilemeyen
  // formatlar (ör. bazı HEIC'ler) olduğu gibi yüklenir.
  async function compressImage(file: File): Promise<File> {
    try {
      const bmp = await createImageBitmap(file)
      const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
      const w = Math.round(bmp.width * scale)
      const h = Math.round(bmp.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const cx = canvas.getContext('2d')
      if (!cx) return file
      cx.drawImage(bmp, 0, 0, w, h)
      bmp.close()
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.8))
      if (!blob || blob.size >= file.size) return file
      return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
    } catch {
      return file
    }
  }
  const [fromApptId, setFromApptId] = useState<string | null>(null)

  function pickPatient(id: string, form: FormKind = null, apptId: string | null = null) {
    setSelectedId(id)
    setOpenForm(form)
    setFromApptId(apptId)
    setSearch('')
    setError(null)
    setMobilePanelOpen(true)
  }

  function shiftDay(delta: number) {
    const d = new Date(day + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    setDay(d.toLocaleDateString('en-CA'))
  }

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.ok) { setOpenForm(null); setFromApptId(null); router.refresh() }
      else setError(res.error ?? 'Hata')
    })
  }

  // ── Form gönderimleri ──
  function submitIslem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedId) return
    const fd = new FormData(e.currentTarget)
    fd.set('existing_patient_id', selectedId)
    if (fromApptId) fd.set('complete_appointment_id', fromApptId)
    run(() => addQuickEntry(fd))
  }
  function submitTahsilat(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedId) return
    run(() => addPayment(selectedId, new FormData(e.currentTarget)))
  }
  function submitRandevu(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedId) return
    const fd = new FormData(e.currentTarget)
    fd.set('patient_id', selectedId)
    run(() => createAppointmentForPatient(fd))
  }
  function submitYeniHasta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const res = await addPatient(fd)
      if (res.ok) { setOpenForm(null); router.refresh() }
      else setError(res.error)
    })
  }

  const inputCls = 'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500'
  const btnPrimary = 'px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors'
  const btnGhost = 'px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors'

  // ─────────────────────────────────────────────────────────────────────────
  // Ana sayfa: her şeyi bugünün gün akışına sıfırla
  function resetToHome() {
    setDay(todayIso())
    setLeftView('gun')
    setSelectedId(null)
    setOpenForm(null)
    setFromApptId(null)
    setSearch('')
    setError(null)
    setMobilePanelOpen(false)
    setCompareMode(false)
    setCompareSel([])
    setLightboxIdx(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Sabit başlık: ana sayfa butonu + modül adı */}
      <div className="sticky top-0 z-40 -mx-1 px-1 pt-1 bg-slate-950/95 backdrop-blur">
        <div className="flex items-center gap-3 py-2">
          <button onClick={resetToHome}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors">
            🏠 Ana Sayfa
          </button>
          <h1 className="text-xl font-black text-white">Klinik Yönetim</h1>
        </div>
      </div>

      {/* Üst çubuk: gün gezgini + arama + yeni hasta */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl px-1 py-1">
          <button onClick={() => shiftDay(-1)} className="px-2.5 py-1.5 text-slate-300 hover:text-white text-lg leading-none" aria-label="Önceki gün">‹</button>
          <button onClick={() => setDay(todayIso())} className={`px-3 py-1.5 text-sm font-bold rounded-lg ${day === todayIso() ? 'text-white' : 'text-violet-300 hover:text-white'}`}>
            {dayLabel(day)}
          </button>
          <button onClick={() => shiftDay(1)} className="px-2.5 py-1.5 text-slate-300 hover:text-white text-lg leading-none" aria-label="Sonraki gün">›</button>
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Hasta ara (ad / telefon)…"
            className={inputCls}
          />
          {searchResults.length > 0 && (
            <div className="absolute z-30 top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
              {searchResults.map(p => (
                <button key={p.id} onClick={() => pickPatient(p.id)}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-800 flex items-center justify-between gap-2">
                  <span className="text-sm text-white font-semibold">{p.name}</span>
                  <span className="text-xs text-slate-400">{p.phone ?? ''}{p.remaining > 0 ? ` · ${TRY(p.remaining)} borç` : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setLeftView(leftView === 'hastalar' ? 'gun' : 'hastalar')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${leftView === 'hastalar' ? 'bg-violet-500/20 text-violet-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>
          Hastalar ({patients.length})
        </button>
        <button
          onClick={() => setLeftView(leftView === 'alacak' ? 'gun' : 'alacak')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${leftView === 'alacak' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>
          Alacaklar{debtors.length > 0 ? ` (${debtors.length})` : ''}
          {overdueCount > 0 && <span className="ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-rose-500/25 text-rose-300">{overdueCount} gecikmiş</span>}
        </button>
        <button onClick={() => { setOpenForm(openForm === 'yeniHasta' ? null : 'yeniHasta'); setMobilePanelOpen(false) }} className={btnGhost}>
          + Yeni Hasta
        </button>
        <Link href="/klinik/panel/muhasebe/randevu/musaitlik" className={btnGhost}>Müsaitlik</Link>
        <Link href="/klinik/panel/muhasebe/randevu" className={btnGhost}>Takvim</Link>
      </div>

      {/* Yeni hasta inline formu (üst seviye — hasta seçimi gerektirmez) */}
      {openForm === 'yeniHasta' && (
        <form onSubmit={submitYeniHasta} className="flex flex-wrap items-end gap-2 bg-slate-800/40 border border-slate-700 rounded-xl p-3">
          <div className="flex-1 min-w-[160px]"><input name="name" placeholder="Ad Soyad *" required className={inputCls} /></div>
          <div className="w-40"><input name="phone" placeholder="Telefon" className={inputCls} /></div>
          <div className="flex-1 min-w-[160px]"><input name="notes" placeholder="Not" className={inputCls} /></div>
          <button type="submit" disabled={pending} className={btnPrimary}>Kaydet</button>
        </form>
      )}

      {error && <div className="px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-sm">{error}</div>}

      {/* Ana gövde: sol akış + sağ karne */}
      <div className="grid lg:grid-cols-[340px,1fr] gap-4 items-start">

        {/* SOL — GÜN AKIŞI veya ALACAKLAR */}
        <div className={`space-y-2 ${mobilePanelOpen ? 'hidden lg:block' : ''}`}>
          {leftView === 'alacak' && (
            <>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-amber-300">
                  Alacaklar — {TRY(totalReceivable)} · {debtors.length} hasta
                  {overdueCount > 0 && <span className="text-rose-300"> ({overdueCount} Geciken Ödeme)</span>}
                </span>
                <button onClick={() => setLeftView('gun')} className="text-xs text-slate-400 hover:text-white">‹ Gün akışı</button>
              </div>
              {debtors.length === 0 && (
                <div className="text-center py-10 bg-slate-800/30 border border-dashed border-slate-700 rounded-xl">
                  <p className="text-emerald-300 text-sm font-semibold">Açık alacak yok 🎉</p>
                </div>
              )}
              {debtors.map(d => (
                <div key={d.id}
                  className={`rounded-xl border p-3 cursor-pointer transition-colors ${d.id === selectedId ? 'bg-violet-500/10 border-violet-500/40' : d.overdue ? 'bg-rose-500/5 border-rose-500/30 hover:border-rose-400' : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-500'}`}
                  onClick={() => pickPatient(d.id)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white text-sm font-semibold truncate">{d.name}</span>
                    <span className="text-rose-300 text-sm font-black tabular-nums shrink-0">{TRY(d.remaining)}</span>
                  </div>
                  <div className="mt-1 text-xs">
                    {d.promise ? (
                      <span className={d.overdue ? 'text-rose-300 font-semibold' : 'text-slate-400'}>
                        {d.overdue ? '⚠ Sözü geçti: ' : 'Söz: '}
                        {new Date(d.promise.due_date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                        {' · '}{TRY(Number(d.promise.amount))}
                      </span>
                    ) : (
                      <span className="text-slate-500">Ödeme sözü yok — karneden söz al</span>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
          {leftView === 'hastalar' && (
            <>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-violet-300">Tüm hastalar ({allPatients.length})</span>
                <button onClick={() => setLeftView('gun')} className="text-xs text-slate-400 hover:text-white">‹ Gün akışı</button>
              </div>
              {allPatients.length === 0 && (
                <div className="text-center py-10 bg-slate-800/30 border border-dashed border-slate-700 rounded-xl">
                  <p className="text-slate-400 text-sm">Henüz hasta yok — üstten &quot;+ Yeni Hasta&quot;.</p>
                </div>
              )}
              <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
                {allPatients.map(p => (
                  <div key={p.id}
                    className={`rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${p.id === selectedId ? 'bg-violet-500/10 border-violet-500/40' : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-500'}`}
                    onClick={() => pickPatient(p.id)}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white text-sm font-semibold truncate">{p.name}</span>
                      {p.remaining > 0
                        ? <span className="text-rose-300 text-xs font-bold tabular-nums shrink-0">{TRY(p.remaining)}</span>
                        : <span className="text-emerald-400/70 text-xs shrink-0">✓</span>}
                    </div>
                    <div className="flex items-center justify-between mt-0.5 text-xs text-slate-500">
                      <span>{p.phone ?? '—'}</span>
                      <span>{p.last_activity ? new Date(p.last_activity + 'T12:00:00').toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'kayıt yok'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {leftView === 'gun' && dayAppts.length === 0 && (
            <div className="text-center py-10 bg-slate-800/30 border border-dashed border-slate-700 rounded-xl">
              <p className="text-slate-400 text-sm">Bu gün için randevu yok.</p>
              <p className="text-slate-500 text-xs mt-1">Hasta ara → karnesinden randevu ver.</p>
            </div>
          )}
          {leftView === 'gun' && dayAppts.map(a => {
            const p = patients.find(pp => pp.id === a.patient_id)
            const time = new Date(a.start_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
            const st = STATUS_META[a.status] ?? STATUS_META.scheduled
            const isSel = a.patient_id === selectedId
            return (
              <div key={a.id}
                className={`rounded-xl border p-3 cursor-pointer transition-colors ${isSel ? 'bg-violet-500/10 border-violet-500/40' : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-500'}`}
                onClick={() => pickPatient(a.patient_id)}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-white font-black text-sm tabular-nums shrink-0">{time}</span>
                    <span className="text-white text-sm font-semibold truncate">{p?.name ?? '—'}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${st.cls}`}>{st.label}</span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-slate-400 truncate">
                    {a.treatment_type ?? a.appointment_type ?? ''}
                    {(() => {
                      const pk = a.package_treatment_id ? pkgById.get(a.package_treatment_id) : null
                      if (!pk) return null
                      return <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300">📦 {pk.done}/{pk.session_total}</span>
                    })()}
                  </span>
                  {a.status === 'scheduled' && (
                    <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => pickPatient(a.patient_id, 'islem', a.id)}
                        className="text-[11px] font-bold px-2 py-1 rounded-md bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40">
                        İşleme Al
                      </button>
                      <button
                        onClick={() => run(() => setAppointmentStatus(a.id, 'no_show'))}
                        className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-700/60 text-slate-300 hover:bg-slate-600">
                        Gelmedi
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* SAĞ — HASTA KARNESİ */}
        <div className={`${mobilePanelOpen ? '' : 'hidden lg:block'}`}>
          {!selected ? (
            <div className="text-center py-16 bg-slate-800/20 border border-dashed border-slate-700 rounded-2xl">
              <p className="text-slate-400">Soldan hasta seç veya yukarıdan ara.</p>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-4">
              {/* Karne başlığı */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button onClick={() => setMobilePanelOpen(false)} className="lg:hidden text-xs text-violet-300 mb-1">‹ Gün akışına dön</button>
                  <h2 className="text-xl font-black text-white truncate">{selected.name}</h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {selected.phone ?? 'Telefon yok'}
                    {selected.notes ? ` · ${selected.notes}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {selected.remaining > 0
                    ? <p className="text-rose-300 font-black">{TRY(selected.remaining)} <span className="text-xs font-semibold">borç</span></p>
                    : <p className="text-emerald-300 font-bold text-sm">Bakiye kapalı</p>}
                  <p className="text-xs text-slate-500 mt-0.5">{selected.treatment_count} işlem · {TRY(selected.total_amount)}</p>
                </div>
              </div>

              {/* Aksiyon çubuğu */}
              <div className="flex flex-wrap gap-2">
                {(['islem', 'tahsilat', 'randevu', 'foto'] as const).map(k => (
                  <button key={k}
                    onClick={() => {
                      setOpenForm(openForm === k ? null : k)
                      setFromApptId(null)
                      if (k === 'randevu') setRandevuPkgId(activePackages.length === 1 ? activePackages[0].treatment_id : '')
                    }}
                    className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-colors ${openForm === k ? 'bg-violet-600 text-white' : 'bg-slate-700/60 text-slate-200 hover:bg-slate-600'}`}>
                    + {k === 'islem' ? 'İşlem' : k === 'tahsilat' ? 'Tahsilat' : k === 'randevu' ? 'Randevu' : 'Foto'}
                  </button>
                ))}
                <Link href={`/klinik/panel/muhasebe/${selected.id}`} className="ml-auto px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white">
                  Tam geçmiş →
                </Link>
              </div>

              {/* ── Paketler / seans sayacı ── */}
              {patientPackages.length > 0 && (
                <div className="space-y-2">
                  {patientPackages.map(pk => {
                    const full = pk.done >= pk.session_total
                    const pct = Math.min(100, Math.round((pk.done / pk.session_total) * 100))
                    return (
                      <div key={pk.treatment_id} className={`rounded-xl border p-3 ${full ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-violet-500/5 border-violet-500/25'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-white truncate">{pk.name}</span>
                          <span className={`text-sm font-black tabular-nums shrink-0 ${full ? 'text-emerald-300' : 'text-violet-300'}`}>
                            {pk.done}/{pk.session_total} seans
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                          <div className={`h-full rounded-full ${full ? 'bg-emerald-400' : 'bg-violet-400'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-slate-400">
                          <span className="min-w-0">
                            {full ? 'Paket tamamlandı 🎉' : pk.next_at
                              ? `Sonraki: ${new Date(pk.next_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} ${new Date(pk.next_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}`
                              : `Planlı seans yok — ${pk.session_total - pk.done} seans kaldı`}
                            {!full && pk.planned > 0 && ` · ${pk.planned} planlı`}
                          </span>
                          {!full && (
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                onClick={() => { setOpenForm('randevu'); setRandevuPkgId(pk.treatment_id); setFromApptId(null) }}
                                title="Bu paket için seans randevuları planla"
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-700/70 hover:bg-slate-600 text-slate-200 transition-colors">
                                📅 Planla
                              </button>
                              <button
                                onClick={() => setSeansFormPkg(seansFormPkg === pk.treatment_id ? null : pk.treatment_id)}
                                disabled={pending}
                                title="Para sorulmaz — detayları gir, seans sayaca işlensin"
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white transition-colors">
                                ✓ Seans Yap ({pk.done + 1}/{pk.session_total})
                              </button>
                            </div>
                          )}
                        </div>
                        {/* Seans detay mini formu: ürün / miktar / not — para sorulmaz */}
                        {seansFormPkg === pk.treatment_id && !full && (
                          <form
                            onSubmit={e => {
                              e.preventDefault()
                              const fd = new FormData(e.currentTarget as HTMLFormElement)
                              const parts = [fd.get('urun'), fd.get('miktar'), fd.get('not')]
                                .map(v => (v as string | null)?.trim())
                                .filter(Boolean)
                              setSeansFormPkg(null)
                              run(() => logPackageSession(pk.treatment_id, parts.join(' · ')))
                            }}
                            className="mt-2 grid sm:grid-cols-[1fr,110px,1fr,auto] gap-2 bg-slate-950/50 rounded-lg p-2">
                            <input name="urun" placeholder="Uygulama / ürün (Revoshine vs.)" className={inputCls} />
                            <input name="miktar" placeholder="Miktar (3ml)" className={inputCls} />
                            <input name="not" placeholder="Not (göz altı, sağ yanak…)" className={inputCls} />
                            <button type="submit" disabled={pending} className={btnPrimary}>
                              {pending ? '…' : 'Tamamla'}
                            </button>
                          </form>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── İşlem formu (opsiyonel tahsilatla) ── */}
              {openForm === 'islem' && (
                <form onSubmit={submitIslem} className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 space-y-2">
                  {fromApptId && <p className="text-xs text-emerald-300 font-semibold">Randevu işleme alınıyor — kaydedilince randevu tamamlanır.</p>}
                  <div className="grid sm:grid-cols-[1fr,120px,140px] gap-2">
                    <div>
                      <input name="treatment_name" list="katalog-listesi" placeholder="İşlem adı *" required className={inputCls} />
                      <datalist id="katalog-listesi">
                        {catalog.map(c => <option key={c.id} value={c.name} />)}
                      </datalist>
                    </div>
                    <input name="treatment_amount" placeholder="Ücret ₺ *" required inputMode="decimal" className={inputCls} />
                    <input name="treatment_date" type="date" defaultValue={day} className={inputCls} />
                  </div>
                  <div className="grid sm:grid-cols-[130px,120px,140px,1fr] gap-2">
                    <select name="session_total" defaultValue="" className={inputCls} title="Paketse toplam seans sayısı">
                      <option value="">Tek seans</option>
                      {[2, 3, 4, 5, 6, 8, 10, 12].map(n => <option key={n} value={n}>Paket · {n} seans</option>)}
                    </select>
                    <input name="payment_amount" placeholder="Alınan ₺" inputMode="decimal" className={inputCls} />
                    <select name="payment_method" className={inputCls}>
                      <option value="">Ödeme yok</option>
                      <option value="nakit">Nakit</option>
                      <option value="kart">Kart</option>
                      <option value="havale">Havale</option>
                    </select>
                    <input name="treatment_notes" placeholder="Not" className={inputCls} />
                  </div>
                  <input type="hidden" name="payment_date" value={day} />
                  <button type="submit" disabled={pending} className={btnPrimary}>{pending ? 'Kaydediliyor…' : 'İşlemi Kaydet'}</button>
                </form>
              )}

              {/* ── Tahsilat formu ── */}
              {openForm === 'tahsilat' && (
                <form onSubmit={submitTahsilat} className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 space-y-2">
                  <div className="grid sm:grid-cols-[140px,140px,140px,1fr] gap-2">
                    <input name="amount" placeholder="Tutar ₺ *" required inputMode="decimal" className={inputCls} />
                    <select name="method" className={inputCls}>
                      <option value="nakit">Nakit</option>
                      <option value="kart">Kart</option>
                      <option value="havale">Havale</option>
                    </select>
                    <input name="paid_at" type="date" defaultValue={day} className={inputCls} />
                    <input name="notes" placeholder="Not" className={inputCls} />
                  </div>
                  <div className="grid sm:grid-cols-[auto,140px,130px] gap-2 items-center pt-1 border-t border-slate-700/60">
                    <span className="text-xs text-amber-300/90 font-semibold">Kalan için söz (opsiyonel):</span>
                    <input name="promise_date" type="date" className={inputCls} />
                    <input name="promise_amount" placeholder="Söz ₺" inputMode="decimal" className={inputCls} />
                  </div>
                  <button type="submit" disabled={pending} className={btnPrimary}>{pending ? 'Kaydediliyor…' : 'Tahsilatı Kaydet'}</button>
                </form>
              )}

              {/* ── Randevu formu ── */}
              {openForm === 'randevu' && (
                <form onSubmit={submitRandevu} className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 space-y-2">
                  <div className="grid sm:grid-cols-[140px,110px,110px,1fr] gap-2">
                    <input name="date" type="date" required defaultValue={day} className={inputCls} />
                    <input name="time" type="time" required className={inputCls} />
                    <select name="duration_minutes" defaultValue="30" className={inputCls}>
                      {[15, 20, 30, 45, 60, 90].map(m => <option key={m} value={m}>{m} dk</option>)}
                    </select>
                    <input name="treatment_type" list="katalog-listesi" placeholder="İşlem / sebep" className={inputCls} />
                  </div>
                  {activePackages.length > 0 && (
                    <select name="package_treatment_id" value={randevuPkgId}
                      onChange={e => setRandevuPkgId(e.target.value)} className={inputCls}>
                      <option value="">Pakete bağlama (bağımsız randevu)</option>
                      {activePackages.map(pk => (
                        <option key={pk.treatment_id} value={pk.treatment_id}>
                          Pakete bağla: {pk.name} ({pk.done}/{pk.session_total})
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="grid sm:grid-cols-[1fr,1fr] gap-2 items-center">
                    <select name="recurrence_freq" defaultValue={randevuPkgId ? 'weekly' : ''} key={randevuPkgId ? 'pkg' : 'solo'} className={inputCls} title="Tekrarlama">
                      <option value="">{randevuPkgId ? 'Sadece bu seans' : 'Tek sefer (tekrarlamaz)'}</option>
                      <option value="weekly">Her hafta</option>
                      <option value="biweekly">2 haftada bir</option>
                      <option value="triweekly">3 haftada bir</option>
                      <option value="monthly">Her ay</option>
                    </select>
                    {randevuPkgId ? (
                      (() => {
                        const pk = activePackages.find(p => p.treatment_id === randevuPkgId)
                        const kalan = pk ? pk.session_total - pk.done - pk.planned : 0
                        return (
                          <span className="text-xs text-violet-300 font-semibold">
                            Sıklık seçersen kalan {kalan} seansın tümü otomatik planlanır.
                          </span>
                        )
                      })()
                    ) : (
                      <select name="recurrence_months" defaultValue="3" className={inputCls} title="Tekrarlama süresi">
                        {[1, 2, 3, 4, 5, 6].map(m => <option key={m} value={m}>{m} ay boyunca</option>)}
                      </select>
                    )}
                  </div>
                  <button type="submit" disabled={pending} className={btnPrimary}>{pending ? 'Kaydediliyor…' : 'Randevuyu Kaydet'}</button>
                </form>
              )}

              {/* ── Foto yükleme: seçer seçmez otomatik yüklenir ── */}
              {openForm === 'foto' && (
                <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 space-y-2">
                  <div className="flex gap-1.5">
                    {([
                      { v: 'oncesi' as const, label: 'Öncesi' },
                      { v: 'sonrasi' as const, label: 'Sonrası' },
                      { v: 'kontrol' as const, label: 'Kontrol' },
                    ]).map(s => (
                      <button key={s.v} type="button" onClick={() => setPhotoStage(s.v)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${photoStage === s.v ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid sm:grid-cols-[1fr,1fr] gap-2">
                    <select value={photoTreatmentId} onChange={e => setPhotoTreatmentId(e.target.value)} className={inputCls}>
                      <option value="">Genel (işleme bağlı değil)</option>
                      {patientTreatments.map(t => (
                        <option key={t.id} value={t.id}>
                          {new Date(t.date + 'T12:00:00').toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' })} — {t.label}
                        </option>
                      ))}
                    </select>
                    <input value={photoNote} onChange={e => setPhotoNote(e.target.value)}
                      placeholder="Ek not (opsiyonel — sağ profil vs.)" className={inputCls} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className={`px-3.5 py-2 rounded-lg text-sm font-bold cursor-pointer ${pending ? 'bg-slate-700 text-slate-400 pointer-events-none' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}>
                      📷 Kamera
                      <input type="file" accept="image/*" capture="environment" className="hidden" disabled={pending}
                        onChange={e => { uploadPhotos(Array.from(e.target.files ?? [])); e.target.value = '' }} />
                    </label>
                    <label className={`px-3.5 py-2 rounded-lg text-sm font-bold cursor-pointer ${pending ? 'bg-slate-800 text-slate-500 pointer-events-none' : 'bg-slate-700 hover:bg-slate-600 text-slate-100'}`}>
                      🖼 Galeriden Seç (çoklu)
                      <input type="file" accept="image/*" multiple className="hidden" disabled={pending}
                        onChange={e => { uploadPhotos(Array.from(e.target.files ?? [])); e.target.value = '' }} />
                    </label>
                    {photoProgress
                      ? <span className="text-xs text-violet-300 font-semibold">{photoProgress}</span>
                      : <span className="text-xs text-slate-500">Seçince direkt yüklenir.</span>}
                  </div>
                </div>
              )}

              {/* ── Fotoğraflar ── */}
              {patientPhotos.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-300">Fotoğraflar ({patientPhotos.length})</p>
                    {patientPhotos.length > 1 && (
                      <button type="button"
                        onClick={() => { setCompareMode(!compareMode); setCompareSel([]) }}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${compareMode ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                        ⇆ Karşılaştır{compareMode ? ` (${compareSel.length}/2 seçildi)` : ''}
                      </button>
                    )}
                  </div>
                  {compareMode && compareSel.length < 2 && (
                    <p className="text-xs text-violet-300 mb-2">Karşılaştırılacak {compareSel.length === 0 ? 'ilk' : 'ikinci'} fotoğrafı seç (önce öncesi, sonra sonrası).</p>
                  )}
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                    {patientPhotos.map((f, idx) => (
                      <div key={f.id} className={`relative rounded-lg overflow-hidden border bg-slate-900/40 ${compareSel.includes(f.id) ? 'border-violet-400 ring-2 ring-violet-500/50' : 'border-slate-700/60'}`}>
                        <button type="button"
                          onClick={() => {
                            if (!compareMode) { setLightboxIdx(idx); return }
                            setCompareSel(prev => prev.includes(f.id)
                              ? prev.filter(x => x !== f.id)
                              : prev.length >= 2 ? [prev[1], f.id] : [...prev, f.id])
                          }}
                          className="block w-full" aria-label={compareMode ? 'Karşılaştırmaya seç' : 'Fotoğrafı büyüt'}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={f.url} alt={f.note ?? 'Hasta fotoğrafı'} className="w-full h-24 object-cover" loading="lazy" />
                        </button>
                        <div className="px-1.5 py-1 text-[10px] text-slate-400 truncate">
                          {new Date(f.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          {treatmentLabel(f.treatment_id) ? ` · ${treatmentLabel(f.treatment_id)}` : ''}
                          {f.note ? ` · ${f.note}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yaklaşan randevuları — güne birleşik, paket sayaçlı */}
              {patientApptDays.length > 0 && (
                <div className="text-xs text-slate-400 space-y-1">
                  <p className="font-bold text-slate-300">Yaklaşan randevuları</p>
                  {patientApptDays.map(([dayKey, appts]) => {
                    const first = appts[0]
                    const label = appts.map(a => {
                      const pk = a.package_treatment_id ? pkgById.get(a.package_treatment_id) : null
                      const base = a.treatment_type ?? a.appointment_type ?? 'Randevu'
                      return pk ? `📦 ${pk.name} (${pk.done}/${pk.session_total})` : base
                    }).join(' + ')
                    return (
                      <p key={dayKey}>
                        <span className="text-slate-300 font-semibold">
                          {new Date(first.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                          {' '}{new Date(first.start_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}
                        </span>
                        {' — '}{label}
                        {appts.length > 1 && <span className="text-violet-300 font-semibold"> · aynı ziyaret</span>}
                      </p>
                    )
                  })}
                </div>
              )}

              {/* Geçmiş: iki sütun — işlemler (borç) | tahsilatlar (ödeme) */}
              <div>
                <p className="text-sm font-bold text-slate-300 mb-2">Geçmiş</p>
                {patientTimeline.length === 0 && <p className="text-sm text-slate-500">Henüz kayıt yok.</p>}
                {patientTimeline.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {([
                      { kind: 'islem' as const, title: 'İşlemler', dot: 'bg-violet-400', total: 'text-slate-200' },
                      { kind: 'tahsilat' as const, title: 'Tahsilatlar', dot: 'bg-emerald-400', total: 'text-emerald-300' },
                    ]).map(col => {
                      const items = patientTimeline.filter(t => t.kind === col.kind)
                      const sum = items.reduce((s, t) => s + t.amount, 0)
                      return (
                        <div key={col.kind} className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-2.5">
                          <div className="flex items-center justify-between px-1 mb-1.5">
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />{col.title}
                            </span>
                            <span className={`text-xs font-black tabular-nums ${col.total}`}>{TRY(sum)}</span>
                          </div>
                          {items.length === 0 && <p className="text-xs text-slate-600 px-1 py-2">Kayıt yok.</p>}
                          <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
                            {items.map(t => (
                              <div key={`${t.kind}-${t.id}`} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-slate-900/50">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs text-slate-500 tabular-nums shrink-0">
                                    {new Date(t.date + 'T12:00:00').toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                  </span>
                                  <span className="text-sm text-slate-200 truncate">
                                    {t.kind === 'tahsilat' ? (t.label || 'Tahsilat') : t.label}
                                  </span>
                                </div>
                                <span className={`text-sm font-bold tabular-nums shrink-0 ${col.total}`}>
                                  {t.kind === 'tahsilat' ? '+' : ''}{TRY(t.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── Ödeme sözleri (alacak planı) ── */}
              {(patientPromises.length > 0 || (selected.remaining > 0 && openForm === 'soz')) && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-amber-300">Ödeme planı</p>
                  {patientPromises.map(pr => {
                    const late = pr.due_date < today
                    return (
                      <div key={pr.id} className={`rounded-lg border ${late ? 'bg-rose-500/5 border-rose-500/30' : 'bg-slate-900/40 border-slate-700/60'}`}>
                        {editingPromiseId === pr.id ? (
                          /* Düzenleme formu */
                          <form onSubmit={e => {
                            e.preventDefault()
                            setEditingPromiseId(null)
                            run(() => updatePaymentPromise(pr.id, new FormData(e.currentTarget as HTMLFormElement)))
                          }} className="grid sm:grid-cols-[140px,120px,1fr,auto,auto] gap-2 p-2">
                            <input name="due_date" type="date" required defaultValue={pr.due_date} className={inputCls} />
                            <input name="amount" required inputMode="decimal" defaultValue={String(Number(pr.amount))} className={inputCls} />
                            <input name="note" defaultValue={pr.note ?? ''} placeholder="Not" className={inputCls} />
                            <button type="submit" disabled={pending} className={btnPrimary}>Kaydet</button>
                            <button type="button" onClick={() => setEditingPromiseId(null)} className={btnGhost}>Vazgeç</button>
                          </form>
                        ) : (
                          <div className="flex items-center justify-between gap-2 px-3 py-2">
                            <div className="min-w-0 text-sm">
                              <span className={late ? 'text-rose-300 font-semibold' : 'text-slate-200'}>
                                {new Date(pr.due_date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                {late ? ' ⚠' : ''}
                              </span>
                              <span className="text-white font-bold ml-2 tabular-nums">{TRY(Number(pr.amount))}</span>
                              {pr.note && <span className="text-xs text-slate-500 ml-2">{pr.note}</span>}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => { setSettlingPromiseId(settlingPromiseId === pr.id ? null : pr.id); setEditingPromiseId(null) }}
                                className="text-[11px] font-bold px-2 py-1 rounded-md bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40">
                                Tahsil Et
                              </button>
                              <button onClick={() => { setEditingPromiseId(pr.id); setSettlingPromiseId(null) }}
                                className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-700/60 text-slate-300 hover:bg-slate-600">
                                Düzenle
                              </button>
                              <button onClick={() => run(() => settlePaymentPromise(pr.id, 'cancelled'))}
                                className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-700/60 text-slate-400 hover:bg-slate-600">
                                İptal
                              </button>
                            </div>
                          </div>
                        )}
                        {/* Tahsil onayı: yöntem seç → onayla */}
                        {settlingPromiseId === pr.id && editingPromiseId !== pr.id && (
                          <div className="flex flex-wrap items-center gap-2 px-3 pb-2.5 pt-1 border-t border-slate-700/40">
                            <span className="text-xs text-emerald-300 font-semibold">{TRY(Number(pr.amount))} tahsil edilecek — yöntem:</span>
                            {(['nakit', 'kart', 'havale'] as const).map(m => (
                              <button key={m}
                                onClick={() => { setSettlingPromiseId(null); run(() => settlePaymentPromise(pr.id, 'paid', m)) }}
                                disabled={pending}
                                className="text-[11px] font-bold px-3 py-1.5 rounded-md bg-emerald-600/30 text-emerald-200 hover:bg-emerald-600/50 capitalize">
                                {m}
                              </button>
                            ))}
                            <button onClick={() => setSettlingPromiseId(null)} className="text-[11px] px-2 py-1.5 text-slate-400 hover:text-white">Vazgeç</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {selected.remaining > 0 && (() => {
                // Planlanmamış açık: borçtan mevcut açık sözlerin toplamı düşülür.
                const promisedTotal = patientPromises.reduce((s, pr) => s + Number(pr.amount), 0)
                const unplanned = selected.remaining - promisedTotal
                if (unplanned <= 0) {
                  return <p className="text-xs text-emerald-400/80">Ödeme planı borcun tamamını karşılıyor ✓</p>
                }
                return openForm === 'soz' ? (
                  <form onSubmit={e => {
                    e.preventDefault()
                    if (!selectedId) return
                    run(() => addPaymentPromise(selectedId, new FormData(e.currentTarget as HTMLFormElement)))
                  }} className="bg-slate-900/60 border border-amber-500/25 rounded-xl p-3 space-y-2">
                    <p className="text-xs text-amber-300 font-semibold">
                      Planlanmamış {TRY(unplanned)} için ödeme sözü
                      {promisedTotal > 0 && <span className="text-slate-500"> (borç {TRY(selected.remaining)}, planlı {TRY(promisedTotal)})</span>}
                    </p>
                    <div className="grid sm:grid-cols-[140px,130px,1fr,auto] gap-2">
                      <input name="due_date" type="date" required className={inputCls} />
                      <input name="amount" placeholder="Tutar ₺ *" required inputMode="decimal" defaultValue={String(unplanned)} className={inputCls} />
                      <input name="note" placeholder="Not (taksit 1/3 vs.)" className={inputCls} />
                      <button type="submit" disabled={pending} className={btnPrimary}>Kaydet</button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => setOpenForm('soz')} className="text-xs font-semibold text-amber-300/80 hover:text-amber-200 text-left">
                    + Ödeme sözü al ({TRY(unplanned)} planlanmamış)
                  </button>
                )
              })()}

            </div>
          )}
        </div>
      </div>

      {/* KARŞILAŞTIRMA — iki foto yan yana */}
      {compareMode && compareSel.length === 2 && (() => {
        const pair = compareSel
          .map(id => patientPhotos.find(f => f.id === id))
          .filter((f): f is PhotoRow => !!f)
        if (pair.length !== 2) return null
        const caption = (f: PhotoRow) =>
          `${new Date(f.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}${f.note ? ` · ${f.note}` : ''}`
        return (
          <div className="fixed inset-0 z-50 bg-black/95 flex flex-col"
            onClick={() => setCompareSel([])}
            onKeyDown={e => { if (e.key === 'Escape') setCompareSel([]) }}
            tabIndex={0}
            ref={el => el?.focus()}>
            <div className="flex items-center justify-between px-4 py-3 gap-2 flex-wrap">
              <span className="text-white font-bold text-sm">{selected?.name} — Karşılaştırma</span>
              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                <div className="flex rounded-lg overflow-hidden">
                  <button onClick={() => setCompareView('yanyana')}
                    className={`text-xs font-bold px-3 py-1.5 ${compareView === 'yanyana' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>Yan yana</button>
                  <button onClick={() => { setCompareView('kaydir'); setSliderPos(50) }}
                    className={`text-xs font-bold px-3 py-1.5 ${compareView === 'kaydir' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>Kaydır</button>
                </div>
                <button onClick={() => setCompareSel([compareSel[1], compareSel[0]])}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">⇆ Yer değiştir</button>
                <button onClick={() => setCompareSel([])} aria-label="Kapat"
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold">✕</button>
              </div>
            </div>
            {compareView === 'yanyana' ? (
              <div className="flex-1 grid grid-cols-2 gap-1 px-1 pb-1 min-h-0" onClick={e => e.stopPropagation()}>
                {pair.map((f, i) => (
                  <div key={f.id} className="flex flex-col min-h-0 bg-slate-950 rounded-lg overflow-hidden">
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt={f.note ?? 'Foto'} className="max-h-full max-w-full object-contain select-none" />
                    </div>
                    <div className={`px-3 py-2 text-xs font-semibold text-center ${i === 0 ? 'text-violet-300 bg-violet-500/10' : 'text-emerald-300 bg-emerald-500/10'}`}>
                      {caption(f)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 px-1 pb-1" onClick={e => e.stopPropagation()}>
                {/* Kaydırmalı: iki foto üst üste, dikey çizgi sürüklenir */}
                <div className="relative flex-1 min-h-0 bg-slate-950 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pair[1].url} alt="Sonrası" className="absolute inset-0 w-full h-full object-contain select-none" />
                  <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pair[0].url} alt="Öncesi" className="absolute inset-0 w-full h-full object-contain select-none" />
                  </div>
                  <div className="absolute top-0 bottom-0 w-0.5 bg-white/80 pointer-events-none" style={{ left: `${sliderPos}%` }}>
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-slate-900 flex items-center justify-center text-sm font-black shadow-lg">⇆</div>
                  </div>
                  <span className="absolute top-2 left-2 text-[11px] font-bold px-2 py-1 rounded bg-violet-600/80 text-white">ÖNCESİ</span>
                  <span className="absolute top-2 right-2 text-[11px] font-bold px-2 py-1 rounded bg-emerald-600/80 text-white">SONRASI</span>
                  <input
                    type="range" min={0} max={100} value={sliderPos}
                    onChange={e => setSliderPos(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                    aria-label="Öncesi-sonrası kaydırıcı" />
                </div>
                <div className="grid grid-cols-2 text-xs font-semibold text-center mt-1">
                  <span className="text-violet-300 py-1.5 bg-violet-500/10 rounded-l-lg">{caption(pair[0])}</span>
                  <span className="text-emerald-300 py-1.5 bg-emerald-500/10 rounded-r-lg">{caption(pair[1])}</span>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* LIGHTBOX — foto büyütme + ←→ geçiş + silme */}
      {lightboxIdx !== null && patientPhotos[lightboxIdx] && (() => {
        const f = patientPhotos[lightboxIdx]
        const prev = () => setLightboxIdx(i => (i === null ? null : (i - 1 + patientPhotos.length) % patientPhotos.length))
        const next = () => setLightboxIdx(i => (i === null ? null : (i + 1) % patientPhotos.length))
        return (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
            onClick={() => setLightboxIdx(null)}
            onKeyDown={e => {
              if (e.key === 'Escape') setLightboxIdx(null)
              if (e.key === 'ArrowLeft') prev()
              if (e.key === 'ArrowRight') next()
            }}
            tabIndex={0}
            ref={el => el?.focus()}>
            <div className="relative max-w-4xl w-full px-4 flex-1 flex items-center justify-center" onClick={e => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={f.note ?? 'Hasta fotoğrafı'} className="max-h-[78vh] max-w-full object-contain rounded-lg select-none" />
              {patientPhotos.length > 1 && (
                <>
                  <button onClick={prev} aria-label="Önceki foto"
                    className="absolute left-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white text-2xl font-bold">‹</button>
                  <button onClick={next} aria-label="Sonraki foto"
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white text-2xl font-bold">›</button>
                </>
              )}
              <button onClick={() => setLightboxIdx(null)} aria-label="Kapat"
                className="absolute top-2 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white text-lg font-bold">✕</button>
            </div>
            <div className="w-full max-w-4xl px-4 pb-5 flex items-center justify-between gap-3" onClick={e => e.stopPropagation()}>
              <div className="text-sm text-slate-200 min-w-0">
                <span className="font-bold">{lightboxIdx + 1}/{patientPhotos.length}</span>
                <span className="text-slate-400 ml-3">
                  {new Date(f.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {treatmentLabel(f.treatment_id) ? ` · ${treatmentLabel(f.treatment_id)}` : ' · Genel'}
                  {f.note ? ` · ${f.note}` : ''}
                </span>
              </div>
              <button
                onClick={() => {
                  const delId = f.id
                  setLightboxIdx(null)
                  run(() => deletePatientPhoto(delId))
                }}
                className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-600/30 text-rose-200 hover:bg-rose-600/50">
                Sil
              </button>
            </div>
          </div>
        )
      })()}

      {/* ALT ŞERİT — canlı butonlar: gün özeti / alacaklar / ay raporu */}
      <div className="sticky bottom-0 -mx-1 px-1 pb-1">
        <div className="bg-slate-900/95 backdrop-blur border border-slate-700/60 rounded-xl px-3 py-2 flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={() => { setLeftView('gun'); setMobilePanelOpen(false) }}
            title="Gün akışını aç"
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${leftView === 'gun' ? 'bg-slate-700/80 text-white' : 'bg-slate-800/60 hover:bg-slate-700 text-slate-200'}`}>
            {dayLabel(day)}: {dayStats.islem.length} işlem · {TRY(dayStats.billed)} yazıldı · <span className="text-emerald-300">{TRY(dayStats.collected)} tahsil</span>
          </button>
          <button
            onClick={() => { setLeftView('alacak'); setMobilePanelOpen(false) }}
            title="Tüm alacakları aç"
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${leftView === 'alacak' ? 'bg-amber-500/25 text-amber-200' : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300'}`}>
            Alacak: {TRY(totalReceivable)}
            {overdueCount > 0 && <span className="text-rose-300"> ({overdueCount} Geciken Ödeme)</span>}
          </button>
          <Link href={`/klinik/panel/muhasebe/rapor?ay=${day.slice(0, 7)}`}
            title="Ay raporunu aç"
            className="ml-auto px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors">
            🖨 {monthStats.label}: {TRY(monthStats.billed)} / <span className="text-emerald-400">{TRY(monthStats.collected)}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
