'use client'

/**
 * Tek Ekran Klinik — sol gün akışı, sağ hasta karnesi, alt muhasebe şeridi.
 * Sayfa geçişi yok: randevu, işlem, tahsilat hepsi bu ekranda inline çözülür.
 * Rol odağı: doktor → sıradaki hastanın karnesi açık başlar; sekreter → gün akışı.
 */

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  addQuickEntry, addPayment, addPatient,
  createAppointmentForPatient, setAppointmentStatus,
  addPaymentPromise, settlePaymentPromise,
  addPatientPhoto, deletePatientPhoto,
  logPackageSession, updatePaymentPromise,
  getPatientPhotos, signOutKlinik,
  deleteTreatmentCascade, undoPackageSession, deleteAppointment, deletePayment,
  addStockItem, adjustStock, deleteStockItem, addStockMap, deleteStockMap,
  updatePatient, deletePatient,
} from './actions'
import type { KlinikRole } from '@/lib/muhasebe-owner'
import SeriKamera from './SeriKamera'
import { generateSlotsForDay, availabilityForDate, type AvailabilityWeek } from './randevu/slot-utils'
import {
  findBridge, getBridgeHost, setBridgeHost,
  bridgeUpload, bridgeList, bridgeDelete, bridgeFileUrl,
} from '@/lib/foto-koprusu'
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
export interface StockItemRow {
  id: string
  name: string
  unit: string | null
  quantity: number
  min_threshold: number
}
export interface StockMapRow {
  id: string
  match_text: string
  item_id: string
  amount_per_use: number
}
export interface PackageRow {
  treatment_id: string
  patient_id: string
  name: string
  session_total: number
  done: number       // tamamlanan seans (completed randevu sayısı)
  planned: number    // planlı seans
  next_at: string | null
  sessions: { id: string; at: string; detail: string | null }[]  // yapılan seanslar (randevu id + tarih + detay)
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
  stockItems: StockItemRow[]
  stockMaps: StockMapRow[]
  availability: AvailabilityWeek   // haftalık müsaitlik → slot üretimi
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

export default function TekEkranKlinik({ role, patients, appointments, txs, catalog, packages, promises, stockItems, stockMaps, availability }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [day, setDay] = useState(todayIso())
  const [search, setSearch] = useState('')
  const [leftView, setLeftView] = useState<'gun' | 'alacak' | 'hastalar' | 'stok'>('gun')
  const [tableSearch, setTableSearch] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [hastaDuzenle, setHastaDuzenle] = useState(false)
  // Aynı ziyarette birden çok işlem: ek satırlar
  const [extraIslemler, setExtraIslemler] = useState<{ id: string }[]>([])

  // ══ OPTIMISTIC KATMAN ══════════════════════════════════════════════════
  // Kayıt tıklandığı AN ekrana işlenir; server action arkada çalışır.
  // Action başarıyla dönünce revalidate ile gelen taze props bu geçici
  // kayıtların gerçeğini içerir → overlay'ler sıfırlanır. Hata olursa da
  // sıfırlanır (geri alma) + hata mesajı gösterilir.
  const [optTxs, setOptTxs] = useState<TxRow[]>([])
  const [optAppts, setOptAppts] = useState<ApptRow[]>([])
  const [apptStatusOv, setApptStatusOv] = useState<Record<string, string>>({})
  const [optPromises, setOptPromises] = useState<PromiseRow[]>([])
  const [promiseOv, setPromiseOv] = useState<Record<string, { removed?: boolean; due_date?: string; amount?: number; note?: string | null }>>({})
  const [pkgDelta, setPkgDelta] = useState<Record<string, { done: number; planned: number; sessions: { id: string; at: string; detail: string | null }[]; removedSessionIds?: string[] }>>({})
  // Silme overlay'leri: anında kaybolsun
  const [removedTxIds, setRemovedTxIds] = useState<Set<string>>(new Set())
  const [removedApptIds, setRemovedApptIds] = useState<Set<string>>(new Set())
  const [removedPkgIds, setRemovedPkgIds] = useState<Set<string>>(new Set())
  const [stockDelta, setStockDelta] = useState<Record<string, number>>({})
  const [removedStockIds, setRemovedStockIds] = useState<Set<string>>(new Set())

  function resetOverlays() {
    setOptTxs([]); setOptAppts([]); setApptStatusOv({})
    setOptPromises([]); setPromiseOv({}); setPkgDelta({})
    setRemovedTxIds(new Set()); setRemovedApptIds(new Set()); setRemovedPkgIds(new Set())
    setStockDelta({}); setRemovedStockIds(new Set())
  }

  // Bilgilendirici silme onayı: ne silinecek + zincirleme sonuçları
  const [confirmBox, setConfirmBox] = useState<{
    title: string
    lines: string[]
    confirmLabel: string
    action: () => void
  } | null>(null)
  // Taze server verisi geldiğinde overlay'ler görevini tamamladı → temizle
  useEffect(() => { resetOverlays() }, [txs, appointments, promises, packages, stockItems]) // eslint-disable-line react-hooks/exhaustive-deps

  const oid = () => `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const txsAll = useMemo(() => {
    const base = removedTxIds.size ? txs.filter(t => !removedTxIds.has(t.id)) : txs
    return optTxs.length ? [...base, ...optTxs] : base
  }, [txs, optTxs, removedTxIds])
  const apptsAll = useMemo(() => {
    let base = removedApptIds.size ? appointments.filter(a => !removedApptIds.has(a.id)) : appointments
    if (removedPkgIds.size) base = base.filter(a => !(a.package_treatment_id && removedPkgIds.has(a.package_treatment_id) && a.status === 'scheduled'))
    if (Object.keys(apptStatusOv).length) base = base.map(a => apptStatusOv[a.id] ? { ...a, status: apptStatusOv[a.id] } : a)
    return optAppts.length ? [...base, ...optAppts] : base
  }, [appointments, apptStatusOv, optAppts, removedApptIds, removedPkgIds])
  const promisesAll = useMemo(() => {
    const base = promises
      .filter(p => !promiseOv[p.id]?.removed)
      .map(p => promiseOv[p.id] ? { ...p, ...promiseOv[p.id] } : p)
    return optPromises.length ? [...base, ...optPromises] : base
  }, [promises, promiseOv, optPromises])
  const packagesAll = useMemo(() => {
    let base = removedPkgIds.size ? packages.filter(p => !removedPkgIds.has(p.treatment_id)) : packages
    if (Object.keys(pkgDelta).length) {
      base = base.map(p => {
        const d = pkgDelta[p.treatment_id]
        if (!d) return p
        const removedS = new Set(d.removedSessionIds ?? [])
        return {
          ...p,
          done: p.done + d.done,
          planned: Math.max(0, p.planned + d.planned),
          sessions: [...p.sessions.filter(s => !removedS.has(s.id)), ...d.sessions],
        }
      })
    }
    return base
  }, [packages, pkgDelta, removedPkgIds])

  // Stok: overlay'li canlı liste + düşük stok sayısı
  const stockAll = useMemo(() => stockItems
    .filter(i => !removedStockIds.has(i.id))
    .map(i => stockDelta[i.id] ? { ...i, quantity: Math.max(0, i.quantity + stockDelta[i.id]) } : i),
    [stockItems, stockDelta, removedStockIds])
  const lowStockCount = useMemo(
    () => stockAll.filter(i => i.min_threshold > 0 && i.quantity <= i.min_threshold).length,
    [stockAll])

  // Bakiyeler canlı hesaplanır (optimistic kayıtlar dahil): işlem − tahsilat
  const balances = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of txsAll) {
      m.set(t.patient_id, (m.get(t.patient_id) ?? 0) + (t.kind === 'islem' ? t.amount : -t.amount))
    }
    return m
  }, [txsAll])
  const remainingOf = (pid: string) => balances.get(pid) ?? 0
  // ══════════════════════════════════════════════════════════════════════

  // Gün akışı = o günün BEKLEYEN randevuları. Tamamlananlar listeden düşer,
  // "Bu günün kayıtları" bölümünde işlem olarak görünür.
  const dayAppts = useMemo(
    () => apptsAll
      .filter(a => new Date(a.start_at).toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }) === day)
      .filter(a => a.status !== 'completed')
      .sort((a, b) => a.start_at.localeCompare(b.start_at)),
    [apptsAll, day],
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
  // Canlı bakiye (optimistic kayıtlar dahil) — selected.remaining yerine bunu kullan
  const selRemaining = selectedId ? (balances.get(selectedId) ?? 0) : 0

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
    return txsAll.filter(t => t.patient_id === selectedId)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [txsAll, selectedId])

  // Seçili hastanın paketleri (aktifler önde: tamamlanmamış olanlar)
  const patientPackages = useMemo(() => {
    if (!selectedId) return []
    return packagesAll
      .filter(p => p.patient_id === selectedId)
      .sort((a, b) => (a.done >= a.session_total ? 1 : 0) - (b.done >= b.session_total ? 1 : 0))
  }, [packagesAll, selectedId])
  const activePackages = patientPackages.filter(p => p.done < p.session_total)

  const pkgById = useMemo(() => new Map(packagesAll.map(p => [p.treatment_id, p])), [packagesAll])

  const patientAppts = useMemo(() => {
    if (!selectedId) return []
    const now = new Date().toISOString()
    return apptsAll
      .filter(a => a.patient_id === selectedId && a.status === 'scheduled' && a.start_at >= now)
      .sort((a, b) => a.start_at.localeCompare(b.start_at))
      .slice(0, 12)
  }, [apptsAll, selectedId])

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
      .map(p => ({ ...p, remaining: balances.get(p.id) ?? 0 }))
      .filter(p => p.remaining > 0)
      .map(p => {
        const open = promisesAll
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
  }, [patients, promisesAll, today, balances])
  const overdueCount = debtors.filter(d => d.overdue).length
  const totalReceivable = debtors.reduce((s, d) => s + d.remaining, 0)

  // Hastalar görünümü: son hareket tarihine göre (yeniler önce), sonra ada göre
  const allPatients = useMemo(
    () => [...patients].sort((a, b) =>
      (b.last_activity ?? '').localeCompare(a.last_activity ?? '') || a.name.localeCompare(b.name, 'tr')),
    [patients],
  )

  // ── Yerel foto köprüsü: klinik bilgisayarında çalışan program ──
  // Köprü bulunursa fotoğraflar buluta değil o bilgisayara kaydedilir.
  const [bridgeHost, setBridgeHostState] = useState<string | null>(null)
  const [bridgeChecked, setBridgeChecked] = useState(false)
  const [bridgeInput, setBridgeInput] = useState('')
  // Köprü sürekli izlenir: 15 saniyede bir + sekmeye dönüldüğünde.
  // Program sonradan açılırsa ekran kendiliğinden yakalar; kapanırsa fark eder.
  useEffect(() => {
    let alive = true
    const check = () => {
      findBridge().then(host => {
        if (!alive) return
        setBridgeHostState(prev => (prev === host ? prev : host))
        setBridgeChecked(true)
      })
    }
    setBridgeInput(getBridgeHost() ?? '')
    check()
    const timer = setInterval(check, 15_000)
    const onFocus = () => check()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      alive = false
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [])

  // Fotoğraflar tembel yüklenir: köprü varsa yerelden, yoksa buluttan
  const [patientPhotos, setPatientPhotos] = useState<PhotoRow[]>([])

  const loadPhotos = useCallback(async (pid: string, pname: string) => {
    if (bridgeHost) {
      const list = await bridgeList(bridgeHost, pname)
      return list.map(f => ({
        id: `local:${f.path}`,
        patient_id: pid,
        treatment_id: null,
        note: f.name.replace(/\.\w+$/, '').replace(/-/g, ' '),
        created_at: f.modified,
        url: bridgeFileUrl(bridgeHost, f.path),
      })) as PhotoRow[]
    }
    const res = await getPatientPhotos(pid)
    return res.ok ? res.photos : []
  }, [bridgeHost])

  useEffect(() => {
    let alive = true
    setPatientPhotos([])
    if (!selectedId || !bridgeChecked) return
    const pname = patients.find(p => p.id === selectedId)?.name ?? ''
    loadPhotos(selectedId, pname).then(list => { if (alive) setPatientPhotos(list) })
    return () => { alive = false }
  }, [selectedId, bridgeChecked, loadPhotos, patients])

  function reloadPhotos() {
    if (!selectedId) return
    const pname = patients.find(p => p.id === selectedId)?.name ?? ''
    loadPhotos(selectedId, pname).then(setPatientPhotos)
  }
  // Foto formundaki "işleme bağla" seçici için hastanın işlemleri (yeniden eskiye, son 12)
  const patientTreatments = useMemo(
    () => selectedId
      ? txsAll.filter(t => t.patient_id === selectedId && t.kind === 'islem')
          .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12)
      : [],
    [txsAll, selectedId],
  )
  const treatmentLabel = (tid: string | null) => {
    if (!tid) return null
    const t = txsAll.find(x => x.kind === 'islem' && x.id === tid)
    return t ? t.label : null
  }

  const patientPromises = useMemo(
    () => selectedId ? promisesAll.filter(pr => pr.patient_id === selectedId).sort((a, b) => a.due_date.localeCompare(b.due_date)) : [],
    [promisesAll, selectedId],
  )

  // Günün muhasebe şeridi
  const dayStats = useMemo(() => {
    const dayTxs = txsAll.filter(t => t.date === day)
    return {
      islem: dayTxs.filter(t => t.kind === 'islem'),
      billed: dayTxs.filter(t => t.kind === 'islem').reduce((s, t) => s + t.amount, 0),
      collected: dayTxs.filter(t => t.kind === 'tahsilat').reduce((s, t) => s + t.amount, 0),
    }
  }, [txsAll, day])

  const monthStats = useMemo(() => {
    const mk = day.slice(0, 7)
    const mTxs = txsAll.filter(t => t.date.startsWith(mk))
    return {
      billed: mTxs.filter(t => t.kind === 'islem').reduce((s, t) => s + t.amount, 0),
      collected: mTxs.filter(t => t.kind === 'tahsilat').reduce((s, t) => s + t.amount, 0),
      label: new Date(day + 'T12:00:00').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
    }
  }, [txsAll, day])

  // ── Inline form durumu: aynı anda tek form açık ──
  type FormKind = 'islem' | 'tahsilat' | 'randevu' | 'yeniHasta' | 'soz' | 'foto' | null
  const [openForm, setOpenForm] = useState<FormKind>(null)
  const [photoProgress, setPhotoProgress] = useState<string | null>(null)
  const [photoTreatmentId, setPhotoTreatmentId] = useState('')
  const [photoNote, setPhotoNote] = useState('')
  const seriCekim = true   // "Tek kare" yedek yolunda cihaz kamerasını tekrar aç
  const cameraRef = useRef<HTMLInputElement | null>(null)
  const [kameraAcik, setKameraAcik] = useState(false)



  // Seçilen dosyaları anında sıkıştırıp yükle — ayrıca "Yükle" tuşu yok.
  // Köprü varsa klinik bilgisayarına, yoksa buluta yazılır.
  // reopenCamera: seri çekimde yükleme biter bitmez kamerayı tekrar açar.
  function uploadPhotos(files: File[], opts?: { reopenCamera?: boolean }) {
    if (!selectedId || files.length === 0) return
    setError(null)
    const pname = patients.find(p => p.id === selectedId)?.name ?? ''
    startTransition(async () => {
      for (let i = 0; i < files.length; i++) {
        setPhotoProgress(`${i + 1}/${files.length} ${bridgeHost ? 'bilgisayara' : 'buluta'} kaydediliyor…`)
        const compressed = await compressImage(files[i])
        if (bridgeHost) {
          const res = await bridgeUpload(bridgeHost, compressed, pname, photoStage, photoNote)
          if (!res.ok) { setError(`Köprü hatası: ${res.error}`); break }
        } else {
          const fd = new FormData()
          fd.set('photo', compressed)
          fd.set('treatment_id', photoTreatmentId)
          fd.set('stage', photoStage)
          if (photoNote) fd.set('note', photoNote)
          const res = await addPatientPhoto(selectedId, fd)
          if (!res.ok) { setError(res.error ?? 'Yükleme hatası'); break }
        }
      }
      setPhotoProgress(null)
      reloadPhotos()
      // Seri çekim: kamerayı hemen tekrar aç (etiket sabit kalır)
      if (opts?.reopenCamera) {
        setTimeout(() => cameraRef.current?.click(), 250)
      } else if (photoStage === 'oncesi') {
        // Tek çekimde doğal akış: öncesi bitti → sıradaki küme sonrası
        setPhotoStage('sonrasi')
      }
    })
  }
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [photoStage, setPhotoStage] = useState<'oncesi' | 'sonrasi' | 'kontrol'>('oncesi')

  // Seri kameradan gelen tek kareyi yükle (köprü varsa yerele, yoksa buluta)
  const captureOne = useCallback(async (file: File) => {
    if (!selectedId) return
    const pname = patients.find(p => p.id === selectedId)?.name ?? ''
    if (bridgeHost) {
      const res = await bridgeUpload(bridgeHost, file, pname, photoStage, photoNote)
      if (!res.ok) setError(`Köprü hatası: ${res.error}`)
    } else {
      const fd = new FormData()
      fd.set('photo', file)
      fd.set('treatment_id', photoTreatmentId)
      fd.set('stage', photoStage)
      if (photoNote) fd.set('note', photoNote)
      const res = await addPatientPhoto(selectedId, fd)
      if (!res.ok) setError(res.error ?? 'Yükleme hatası')
    }
  }, [selectedId, patients, bridgeHost, photoStage, photoNote, photoTreatmentId])
  // Karşılaştırma modu: 2 foto seç → yan yana
  const [compareMode, setCompareMode] = useState(false)
  const [compareSel, setCompareSel] = useState<string[]>([])
  const [compareView, setCompareView] = useState<'yanyana' | 'kaydir'>('yanyana')
  const [randevuPkgId, setRandevuPkgId] = useState('')
  const [randevuTarih, setRandevuTarih] = useState(day)
  const [randevuSaat, setRandevuSaat] = useState('')
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
    setHastaDuzenle(false)
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

  // NOT: router.refresh() bilerek YOK — server action'lar revalidatePath ile
  // taze veriyi aynı yanıtta getiriyor; ekstra refresh sayfayı iki kez kurduruyordu.
  // Optimistic akış: overlay ANINDA uygulanır, action arkada koşar.
  // Başarı → revalidate gelince overlay'ler sıfırlanır (gerçek veri devralır).
  // Hata → overlay'ler geri alınır + mesaj gösterilir.
  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    setOpenForm(null)
    setFromApptId(null)
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) { resetOverlays(); setError(res.error ?? 'Hata') }
    })
  }

  // ── Form gönderimleri (optimistic push + action) ──
  function submitIslem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedId) return
    const fd = new FormData(e.currentTarget)
    fd.set('existing_patient_id', selectedId)
    if (fromApptId) fd.set('complete_appointment_id', fromApptId)

    // Anında ekrana işle
    const name = (fd.get('treatment_name') as string ?? '').trim()
    const amount = Number(((fd.get('treatment_amount') as string) ?? '0').replace(',', '.'))
    const tDate = (fd.get('treatment_date') as string) || day
    const payAmount = Number(((fd.get('payment_amount') as string) ?? '0').replace(',', '.'))
    const newTxs: TxRow[] = []
    if (name && Number.isFinite(amount)) {
      newTxs.push({ id: oid(), patient_id: selectedId, kind: 'islem', date: tDate, label: name, amount })
    }
    // Ek işlem satırları da anında ekrana
    for (let i = 0; i < extraIslemler.length; i++) {
      const eName = ((fd.get(`extra_name_${i}`) as string) ?? '').trim()
      if (eName.length < 2) continue
      const eAmt = Number(((fd.get(`extra_amount_${i}`) as string) ?? '0').replace(',', '.'))
      if (!Number.isFinite(eAmt) || eAmt < 0) continue
      newTxs.push({ id: oid(), patient_id: selectedId, kind: 'islem', date: tDate, label: eName, amount: eAmt })
    }
    if (Number.isFinite(payAmount) && payAmount > 0) {
      newTxs.push({ id: oid(), patient_id: selectedId, kind: 'tahsilat', date: day, label: (fd.get('payment_method') as string) || '', amount: payAmount })
    }
    if (newTxs.length) setOptTxs(prev => [...prev, ...newTxs])
    if (fromApptId) setApptStatusOv(prev => ({ ...prev, [fromApptId]: 'completed' }))
    setExtraIslemler([])

    run(() => addQuickEntry(fd))
  }
  function submitTahsilat(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedId) return
    const fd = new FormData(e.currentTarget)

    const amount = Number(((fd.get('amount') as string) ?? '').replace(',', '.'))
    if (Number.isFinite(amount) && amount > 0) {
      setOptTxs(prev => [...prev, {
        id: oid(), patient_id: selectedId, kind: 'tahsilat',
        date: (fd.get('paid_at') as string) || day,
        label: (fd.get('method') as string) || '', amount,
      }])
    }
    const pDate = (fd.get('promise_date') as string ?? '').trim()
    const pAmt = Number(((fd.get('promise_amount') as string) ?? '').replace(',', '.'))
    if (pDate && Number.isFinite(pAmt) && pAmt > 0) {
      setOptPromises(prev => [...prev, { id: oid(), patient_id: selectedId, due_date: pDate, amount: pAmt, note: null, status: 'open' }])
    }

    run(() => addPayment(selectedId, fd))
  }
  function submitRandevu(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedId) return
    const fd = new FormData(e.currentTarget)
    fd.set('patient_id', selectedId)

    // Tek randevu ise anında göster (tekrarlı seriyi/birleştirmeyi server üretir)
    const freq = (fd.get('recurrence_freq') as string ?? '').trim()
    if (!freq) {
      const dateStr = (fd.get('date') as string ?? '').trim()
      const timeStr = ((fd.get('time') as string) ?? '').trim() || '17:00'
      // TR saati olarak sabitle — sunucudaki trDate() ile aynı sonuç
      const start = new Date(`${dateStr}T${timeStr}:00+03:00`)
      if (dateStr && !Number.isNaN(start.getTime())) {
        const pkgId = (fd.get('package_treatment_id') as string ?? '').trim() || null
        setOptAppts(prev => [...prev, {
          id: oid(), patient_id: selectedId, start_at: start.toISOString(),
          duration_minutes: Number(fd.get('duration_minutes') ?? 30),
          treatment_type: (fd.get('treatment_type') as string) || null,
          appointment_type: null, status: 'scheduled', package_treatment_id: pkgId,
        }])
        if (pkgId) setPkgDelta(prev => ({
          ...prev,
          [pkgId]: {
            done: prev[pkgId]?.done ?? 0,
            planned: (prev[pkgId]?.planned ?? 0) + 1,
            sessions: prev[pkgId]?.sessions ?? [],
          },
        }))
      }
    }

    run(() => createAppointmentForPatient(fd))
  }
  function submitYeniHasta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const res = await addPatient(fd)
      if (res.ok) setOpenForm(null)
      else setError(res.error)
    })
  }

  const inputCls = 'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500'
  const btnPrimary = 'px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors'
  const btnGhost = 'px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors'

  // ─────────────────────────────────────────────────────────────────────────
  // ── Tema: koyu (varsayılan) / siyah / açık — localStorage'da hatırlanır ──
  // İlk render'da localStorage'dan oku (flash önlenir); SSR 'koyu' der,
  // hydration'da gerçek değer oturur — suppressHydrationWarning wrapper'da.
  const [tema, setTema] = useState<'koyu' | 'siyah' | 'acik'>(() => {
    if (typeof window === 'undefined') return 'koyu'
    const t = localStorage.getItem('klinik_tema')
    return t === 'siyah' || t === 'acik' ? t : 'koyu'
  })
  function cycleTema() {
    const next = tema === 'koyu' ? 'siyah' : tema === 'siyah' ? 'acik' : 'koyu'
    setTema(next)
    localStorage.setItem('klinik_tema', next)
  }
  const TEMA_LABEL = { koyu: '🌙 Koyu', siyah: '⚫ Siyah', acik: '☀️ Açık' } as const

  // Foto görüntüleme zemini: lightbox + karşılaştırma
  const [fotoZemin, setFotoZemin] = useState<'siyah' | 'gri' | 'beyaz'>('siyah')
  const ZEMIN_BG = { siyah: '#0a0a0a', gri: '#6b7280', beyaz: '#ffffff' } as const

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
    <div
      className="flex flex-col gap-4"
      suppressHydrationWarning
      style={{
        // Açık tema: invert hilesi — tüm koyu paleti tersine çevirir, görseller
        // aşağıdaki CSS ile geri çevrilir. Siyah: zemin düz siyaha kayar.
        ...(tema === 'acik' ? { filter: 'invert(0.92) hue-rotate(180deg)', background: '#0b0b0d', borderRadius: 12 } : {}),
        ...(tema === 'siyah' ? { background: '#000', borderRadius: 12 } : {}),
      }}>
      {tema === 'acik' && (
        <style>{`img, video { filter: invert(1.087) hue-rotate(180deg); }`}</style>
      )}
      {/* Sabit başlık — mobilde sade (Ana Sayfa + ⋯), masaüstünde tüm butonlar */}
      <div className="sticky top-0 z-40 pt-1 bg-slate-950/95 backdrop-blur">
        <div className="flex items-center gap-2 sm:gap-3 py-2">
          <button onClick={resetToHome}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors shrink-0">
            🏠<span className="hidden sm:inline"> Ana Sayfa</span>
          </button>
          <h1 className="text-base sm:text-xl font-black text-white truncate">Klinik Yönetim</h1>

          {/* Mobil: tek ⋯ menüsü */}
          <button onClick={() => setMobileMenu(v => !v)}
            className="sm:hidden ml-auto px-3 py-2 rounded-lg text-sm font-bold bg-slate-800 text-slate-300 shrink-0"
            aria-label="Menü">⋯</button>

          {/* Masaüstü butonları */}
          <button
            onClick={() => { setLeftView(leftView === 'stok' ? 'gun' : 'stok'); setMobilePanelOpen(false) }}
            className={`hidden sm:inline-flex ml-auto px-3 py-2 rounded-lg text-xs font-bold transition-colors ${leftView === 'stok' ? 'bg-teal-500/25 text-teal-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>
            📦 Stok{stockAll.length > 0 ? ` (${stockAll.length})` : ''}
            {lowStockCount > 0 && <span className="ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-rose-500/25 text-rose-300">{lowStockCount} azaldı</span>}
          </button>
          <button onClick={cycleTema}
            title="Tema değiştir (koyu → siyah → açık)"
            className="hidden sm:inline-flex px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
            {TEMA_LABEL[tema]}
          </button>
          <button
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen()
              else document.documentElement.requestFullscreen()
            }}
            title="Tam ekran (çıkmak için Esc)"
            className="hidden sm:inline-flex px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
            ⛶ Tam Ekran
          </button>
          <button
            onClick={() => {
              startTransition(async () => {
                await signOutKlinik()
                window.location.href = '/giris'
              })
            }}
            className="pwa-only hidden sm:inline-flex px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-200 transition-colors items-center">
            Çıkış
          </button>
        </div>

        {/* Mobil ⋯ açılır menü */}
        {mobileMenu && (
          <div className="sm:hidden flex flex-wrap gap-2 pb-2">
            <button onClick={() => { cycleTema() }} className={btnGhost}>{TEMA_LABEL[tema]}</button>
            <button onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen()
              else document.documentElement.requestFullscreen()
            }} className={btnGhost}>⛶ Tam Ekran</button>
            <Link href={`/klinik/panel/muhasebe/rapor?ay=${day.slice(0, 7)}`} className={btnGhost}>🖨 Rapor</Link>
            <button onClick={() => { setMobileMenu(false); startTransition(async () => { await signOutKlinik(); window.location.href = '/giris' }) }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-rose-600/30 text-slate-400 text-xs font-semibold rounded-lg">Çıkış</button>
          </div>
        )}
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
                  <span className="text-xs text-slate-400">{p.phone ?? ''}{remainingOf(p.id) > 0 ? ` · ${TRY(remainingOf(p.id))} borç` : ''}</span>
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

      {/* HASTALAR — tam genişlik tablo */}
      {leftView === 'hastalar' && (() => {
        const q = tableSearch.trim().toLocaleLowerCase('tr')
        const rows = allPatients
          .filter(p => !q || p.name.toLocaleLowerCase('tr').includes(q) || (p.phone ?? '').includes(q))
          .map(p => ({
            ...p,
            remaining: remainingOf(p.id),
            islemTotal: txsAll.filter(t => t.patient_id === p.id && t.kind === 'islem').reduce((s2, t) => s2 + t.amount, 0),
            activePkg: packagesAll.find(pk => pk.patient_id === p.id && pk.done < pk.session_total) ?? null,
          }))
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black text-white">👥 Hastalar — {rows.length} kayıt</h2>
              <div className="flex items-center gap-2">
                <input value={tableSearch} onChange={e => setTableSearch(e.target.value)}
                  placeholder="Tabloda ara (ad / telefon)…" className={`${inputCls} w-56`} />
                <button onClick={() => setLeftView('gun')} className={btnGhost}>‹ Gün akışına dön</button>
              </div>
            </div>
            {rows.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 border border-dashed border-slate-700 rounded-xl">
                <p className="text-slate-400">{q ? 'Eşleşen hasta yok.' : 'Henüz hasta yok — üstten "+ Yeni Hasta".'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-slate-800/30 border border-slate-700/60 rounded-xl">
                <table className="w-full text-sm klinik-tablo">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-700">
                      <th className="px-4 py-2.5 font-bold">Hasta</th>
                      <th className="px-3 py-2.5 font-bold">Telefon</th>
                      <th className="px-3 py-2.5 font-bold text-right">Toplam işlem</th>
                      <th className="px-3 py-2.5 font-bold text-right">Bakiye</th>
                      <th className="px-3 py-2.5 font-bold">Son hareket</th>
                      <th className="px-3 py-2.5 font-bold">Aktif paket</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(p => (
                      <tr key={p.id}
                        className="border-b border-slate-800/80 hover:bg-slate-800/40 cursor-pointer"
                        onClick={() => { pickPatient(p.id); setLeftView('gun') }}>
                        <td className="px-4 py-2.5 text-white font-semibold">{p.name}</td>
                        <td data-label="Telefon" className="px-3 py-2.5 text-slate-400">{p.phone ?? '—'}</td>
                        <td data-label="Toplam işlem" className="px-3 py-2.5 text-right tabular-nums text-slate-300">{TRY(p.islemTotal)}</td>
                        <td data-label="Bakiye" className={`px-3 py-2.5 text-right tabular-nums font-bold ${p.remaining > 0 ? 'text-rose-300' : 'text-emerald-400/80'}`}>
                          {p.remaining > 0 ? TRY(p.remaining) : '✓ kapalı'}
                        </td>
                        <td data-label="Son hareket" className="px-3 py-2.5 text-slate-400">
                          {p.last_activity ? new Date(p.last_activity + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '—'}
                        </td>
                        <td data-label="Aktif paket" className="px-3 py-2.5 text-violet-300">
                          {p.activePkg ? `📦 ${p.activePkg.name} ${p.activePkg.done}/${p.activePkg.session_total}` : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right text-violet-300 text-xs font-bold whitespace-nowrap">Karneyi aç ›</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })()}

      {/* ALACAKLAR — tam genişlik tablo */}
      {leftView === 'alacak' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-amber-300">
              💰 Alacaklar — {TRY(totalReceivable)} · {debtors.length} hasta
              {overdueCount > 0 && <span className="text-rose-300 text-sm font-bold ml-1">({overdueCount} Geciken Ödeme)</span>}
            </h2>
            <button onClick={() => setLeftView('gun')} className={btnGhost}>‹ Gün akışına dön</button>
          </div>
          {debtors.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/30 border border-dashed border-slate-700 rounded-xl">
              <p className="text-emerald-300 font-semibold">Açık alacak yok 🎉</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-slate-800/30 border border-slate-700/60 rounded-xl">
              <table className="w-full text-sm klinik-tablo">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-700">
                    <th className="px-4 py-2.5 font-bold">Hasta</th>
                    <th className="px-3 py-2.5 font-bold text-right">Kalan borç</th>
                    <th className="px-3 py-2.5 font-bold">Ödeme sözü</th>
                    <th className="px-3 py-2.5 font-bold">Durum</th>
                    <th className="px-3 py-2.5 font-bold text-right">Hızlı işlem</th>
                  </tr>
                </thead>
                <tbody>
                  {debtors.map(d => {
                    const overdueDays = d.promise && d.overdue
                      ? Math.max(1, Math.round((new Date(today).getTime() - new Date(d.promise.due_date).getTime()) / 86_400_000))
                      : 0
                    const planFull = d.promisedTotal >= d.remaining
                    return (
                      <>
                        <tr key={d.id}
                          className={`border-b border-slate-800/80 ${d.overdue ? 'bg-rose-500/5' : ''}`}>
                          <td className="px-4 py-2.5 text-white font-semibold cursor-pointer hover:text-violet-300"
                            onClick={() => { pickPatient(d.id); setLeftView('gun') }}>{d.name}</td>
                          <td data-label="Kalan borç" className="px-3 py-2.5 text-right tabular-nums font-bold text-rose-300">{TRY(d.remaining)}</td>
                          <td data-label="Ödeme sözü" className="px-3 py-2.5 text-slate-300">
                            {d.promise
                              ? `${new Date(d.promise.due_date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} · ${TRY(Number(d.promise.amount))}`
                              : <span className="text-slate-600">söz yok</span>}
                          </td>
                          <td data-label="Durum" className="px-3 py-2.5">
                            {overdueDays > 0
                              ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">⚠ {overdueDays} gün gecikti</span>
                              : d.promise && planFull
                                ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">Plan tam ✓</span>
                                : d.promise
                                  ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">Kısmi plan</span>
                                  : <button
                                      onClick={() => { pickPatient(d.id, 'soz'); setLeftView('gun') }}
                                      className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 hover:bg-amber-500/30">
                                      Söz al
                                    </button>}
                          </td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">
                            {d.promise && (
                              <button
                                onClick={() => setSettlingPromiseId(settlingPromiseId === d.promise!.id ? null : d.promise!.id)}
                                className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40 mr-2">
                                Tahsil Et
                              </button>
                            )}
                            <button onClick={() => { pickPatient(d.id); setLeftView('gun') }}
                              className="text-violet-300 text-xs font-bold">Karne ›</button>
                          </td>
                        </tr>
                        {d.promise && settlingPromiseId === d.promise.id && (
                          <tr key={`${d.id}-settle`} className="border-b border-slate-800/80 bg-slate-900/60">
                            <td colSpan={5} className="px-4 py-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-emerald-300 font-semibold">{TRY(Number(d.promise.amount))} tahsil edilecek — yöntem:</span>
                                {(['nakit', 'kart', 'havale'] as const).map(m => (
                                  <button key={m}
                                    onClick={() => {
                                      const pr = d.promise!
                                      setSettlingPromiseId(null)
                                      setPromiseOv(prev => ({ ...prev, [pr.id]: { removed: true } }))
                                      setOptTxs(prev => [...prev, {
                                        id: oid(), patient_id: pr.patient_id, kind: 'tahsilat',
                                        date: todayIso(), label: m, amount: Number(pr.amount),
                                      }])
                                      run(() => settlePaymentPromise(pr.id, 'paid', m))
                                    }}
                                    disabled={pending}
                                    className="text-[11px] font-bold px-3 py-1.5 rounded-md bg-emerald-600/30 text-emerald-200 hover:bg-emerald-600/50 capitalize">
                                    {m}
                                  </button>
                                ))}
                                <button onClick={() => setSettlingPromiseId(null)} className="text-[11px] px-2 py-1.5 text-slate-400 hover:text-white">Vazgeç</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* STOK — tam genişlik tablo görünümü */}
      {leftView === 'stok' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white">
              📦 Stok — {stockAll.length} kalem
              {lowStockCount > 0 && <span className="text-rose-300 text-sm font-bold ml-2">({lowStockCount} ürün azaldı)</span>}
            </h2>
            <button onClick={() => setLeftView('gun')} className={btnGhost}>‹ Gün akışına dön</button>
          </div>

          {/* Yeni ürün ekleme satırı */}
          <form onSubmit={e => {
            e.preventDefault()
            const formEl = e.currentTarget as HTMLFormElement
            run(() => addStockItem(new FormData(formEl)).then(r => { if (r.ok) formEl.reset(); return r }))
          }} className="bg-slate-800/40 border border-slate-700 rounded-xl p-3">
            <div className="grid sm:grid-cols-[2fr,1fr,1fr,1fr,auto] gap-2 items-end">
              <label className="text-xs text-slate-400 font-semibold">Ürün adı
                <input name="name" placeholder="Botoks Flakon 100U" required className={`${inputCls} mt-1`} />
              </label>
              <label className="text-xs text-slate-400 font-semibold">Miktar
                <input name="quantity" placeholder="3" inputMode="decimal" className={`${inputCls} mt-1`} />
              </label>
              <label className="text-xs text-slate-400 font-semibold">Birim
                <input name="unit" placeholder="adet / ml / kutu" className={`${inputCls} mt-1`} />
              </label>
              <label className="text-xs text-slate-400 font-semibold">Uyarı eşiği
                <input name="min_threshold" placeholder="1" inputMode="decimal" title="Bu sayıya inince kırmızı uyarı" className={`${inputCls} mt-1`} />
              </label>
              <button type="submit" disabled={pending} className={btnPrimary}>+ Ürün Ekle</button>
            </div>
          </form>

          {/* Stok tablosu */}
          {stockAll.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/30 border border-dashed border-slate-700 rounded-xl">
              <p className="text-slate-400">Henüz stok kalemi yok — yukarıdan ilk ürünü ekle.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-slate-800/30 border border-slate-700/60 rounded-xl">
              <table className="w-full text-sm klinik-tablo">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-700">
                    <th className="px-4 py-2.5 font-bold">Ürün</th>
                    <th className="px-3 py-2.5 font-bold text-right">Miktar</th>
                    <th className="px-3 py-2.5 font-bold">Birim</th>
                    <th className="px-3 py-2.5 font-bold text-right">Uyarı eşiği</th>
                    <th className="px-3 py-2.5 font-bold">Durum</th>
                    <th className="px-3 py-2.5 font-bold text-right">Hareket</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {stockAll.map(i => {
                    const low = i.min_threshold > 0 && i.quantity <= i.min_threshold
                    const out = i.quantity <= 0
                    return (
                      <tr key={i.id} className={`border-b border-slate-800/80 ${low ? 'bg-rose-500/5' : ''}`}>
                        <td className="px-4 py-2.5 text-white font-semibold">{i.name}</td>
                        <td data-label="Miktar" className={`px-3 py-2.5 text-right font-black tabular-nums ${out ? 'text-rose-400' : low ? 'text-rose-300' : 'text-teal-300'}`}>{i.quantity}</td>
                        <td data-label="Birim" className="px-3 py-2.5 text-slate-400">{i.unit ?? '—'}</td>
                        <td data-label="Uyarı eşiği" className="px-3 py-2.5 text-right text-slate-500 tabular-nums">{i.min_threshold > 0 ? i.min_threshold : '—'}</td>
                        <td data-label="Durum" className="px-3 py-2.5">
                          {out ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/25 text-rose-300">TÜKENDİ</span>
                            : low ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300">⚠ Azaldı</span>
                            : <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">✓ Yeterli</span>}
                        </td>
                        <td data-label="Hareket" className="px-3 py-2.5">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => { setStockDelta(prev => ({ ...prev, [i.id]: (prev[i.id] ?? 0) - 1 })); run(() => adjustStock(i.id, -1, 'çıkış')) }}
                              disabled={pending || i.quantity <= 0}
                              className="w-8 h-8 rounded-md bg-slate-700/60 hover:bg-slate-600 text-slate-200 font-black disabled:opacity-40">−</button>
                            <button onClick={() => { setStockDelta(prev => ({ ...prev, [i.id]: (prev[i.id] ?? 0) + 1 })); run(() => adjustStock(i.id, 1, 'giriş')) }}
                              disabled={pending}
                              className="w-8 h-8 rounded-md bg-slate-700/60 hover:bg-slate-600 text-slate-200 font-black">+</button>
                            <button onClick={() => {
                              const v = window.prompt(`"${i.name}" — kaç ${i.unit ?? 'adet'} alım girişi?`, '5')
                              const n = Number((v ?? '').replace(',', '.'))
                              if (!Number.isFinite(n) || n === 0) return
                              setStockDelta(prev => ({ ...prev, [i.id]: (prev[i.id] ?? 0) + n }))
                              run(() => adjustStock(i.id, n, 'alım'))
                            }}
                              className="px-2.5 h-8 rounded-md bg-teal-600/20 hover:bg-teal-600/40 text-teal-300 text-xs font-bold">Alım</button>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button onClick={() => {
                            setConfirmBox({
                              title: `"${i.name}" stok kalemi silinecek`,
                              lines: [
                                `Kalan ${i.quantity}${i.unit ? ` ${i.unit}` : ''} kayıttan düşer`,
                                'Hareket geçmişi ve eşleştirmeleri de silinir',
                                'Yapılmış seans/işlem kayıtlarına dokunulmaz',
                              ],
                              confirmLabel: 'Kalemi Sil',
                              action: () => {
                                setRemovedStockIds(prev => new Set(prev).add(i.id))
                                run(() => deleteStockItem(i.id))
                              },
                            })
                          }}
                            className="text-slate-600 hover:text-rose-300 font-bold" aria-label="Kalemi sil">✕</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Uygulama ↔ ürün eşleştirme tablosu */}
          {stockAll.length > 0 && (
            <div className="bg-slate-800/30 border border-slate-700/60 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-slate-200">Uygulama → Ürün eşleştirme</p>
              <p className="text-xs text-slate-500">İşlem/paket adında uygulama kelimesi geçince Seans Yap formunda ürün otomatik seçili gelir; tek seans işlemlerde stok kendiliğinden düşer.</p>
              {stockMaps.length > 0 && (
                <table className="w-full text-sm klinik-tablo">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-700">
                      <th className="py-2 font-bold">Uygulama</th>
                      <th className="py-2 font-bold">Ürün</th>
                      <th className="py-2 font-bold text-right">Seans başı</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {stockMaps.map(m => {
                      const item = stockAll.find(i => i.id === m.item_id)
                      return (
                        <tr key={m.id} className="border-b border-slate-800/80">
                          <td className="py-2 text-white">{m.match_text}</td>
                          <td className="py-2 text-slate-300">{item?.name ?? '—'}</td>
                          <td className="py-2 text-right tabular-nums text-slate-300">{m.amount_per_use}{item?.unit ? ` ${item.unit}` : ''}</td>
                          <td className="py-2 text-right">
                            <button onClick={() => run(() => deleteStockMap(m.id))}
                              className="text-slate-600 hover:text-rose-300 font-bold" aria-label="Eşleştirmeyi sil">✕</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
              <form onSubmit={e => {
                e.preventDefault()
                const formEl = e.currentTarget as HTMLFormElement
                run(() => addStockMap(new FormData(formEl)).then(r => { if (r.ok) formEl.reset(); return r }))
              }} className="grid sm:grid-cols-[1fr,1fr,120px,auto] gap-2 items-end">
                <label className="text-xs text-slate-400 font-semibold">Uygulama adı
                  <input name="match_text" placeholder="Botoks" required className={`${inputCls} mt-1`} />
                </label>
                <label className="text-xs text-slate-400 font-semibold">Depodaki ürün
                  <select name="item_id" required className={`${inputCls} mt-1`}>
                    <option value="">Seç…</option>
                    {stockAll.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </label>
                <label className="text-xs text-slate-400 font-semibold">Seans başı miktar
                  <input name="amount_per_use" placeholder="1" defaultValue="1" inputMode="decimal" className={`${inputCls} mt-1`} />
                </label>
                <button type="submit" disabled={pending} className={btnPrimary}>+ Eşleştir</button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Ana gövde: sol akış + sağ karne */}
      {leftView === 'gun' && (
      <div className="grid lg:grid-cols-[340px,1fr] gap-4 items-start">

        {/* SOL — GÜN AKIŞI veya ALACAKLAR */}
        <div className={`space-y-2 ${mobilePanelOpen ? 'hidden lg:block' : ''}`}>
          {leftView === 'gun' && dayAppts.length === 0 && (
            <div className="text-center py-6 bg-slate-800/30 border border-dashed border-slate-700 rounded-xl">
              <p className="text-slate-400 text-sm">Bekleyen randevu yok.</p>
              <p className="text-slate-500 text-xs mt-1">
                {txsAll.some(t => t.date === day)
                  ? 'Yapılan işlemler aşağıda.'
                  : 'Hasta ara → işlem gir veya randevu ver.'}
              </p>
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
                  <span className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    {!a.id.startsWith('opt-') && (
                      <button
                        onClick={() => {
                          const pk = a.package_treatment_id ? pkgById.get(a.package_treatment_id) : null
                          setConfirmBox({
                            title: 'Randevu silinecek',
                            lines: [
                              `${new Date(a.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} ${new Date(a.start_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })} — ${p?.name ?? ''}${a.treatment_type ? ` · ${a.treatment_type}` : ''}`,
                              ...(pk ? [
                                `Paket planından düşer: "${pk.name}" (${pk.done}/${pk.session_total})`,
                                a.status === 'completed' ? 'Tamamlanmış seans — silinirse sayaç geri düşer' : 'Seans daha sonra yeniden planlanabilir',
                              ] : ['Muhasebe kayıtlarına dokunulmaz (işlem/tahsilat ayrı)']),
                            ],
                            confirmLabel: 'Randevuyu Sil',
                            action: () => {
                              setRemovedApptIds(prev => new Set(prev).add(a.id))
                              run(() => deleteAppointment(a.id))
                            },
                          })
                        }}
                        title="Randevuyu sil"
                        className="text-slate-600 hover:text-rose-300 text-xs font-bold" aria-label="Randevuyu sil">
                        ✕
                      </button>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-sm text-slate-200 font-semibold truncate">
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
                        onClick={() => {
                          setApptStatusOv(prev => ({ ...prev, [a.id]: 'no_show' }))
                          run(() => setAppointmentStatus(a.id, 'no_show'))
                        }}
                        className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-700/60 text-slate-300 hover:bg-slate-600">
                        Gelmedi
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* O GÜNÜN KAYITLARI — randevusuz gelen de burada görünür */}
          {(() => {
            // Sadece işlemler — tahsilatlar burada listelenmez (hasta akışı para
            // listesi gibi görünmesin). Günün parası alt şeritte/raporda.
            const dayTxs = txsAll.filter(t => t.date === day && t.kind === 'islem')
            if (dayTxs.length === 0) return null
            const nameOf = (pid: string) => patients.find(p => p.id === pid)?.name ?? '—'
            return (
              <div className="pt-2 space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-300">
                    Yapılan işlemler · {dayTxs.length}
                    <span className="text-slate-500 font-normal"> · {new Set(dayTxs.map(t => t.patient_id)).size} hasta</span>
                  </span>
                </div>
                {/* Hasta bazında tek kart: o gün yapılan işlemler alt alta */}
                {Array.from(
                  dayTxs.reduce((m, t) => {
                    m.set(t.patient_id, [...(m.get(t.patient_id) ?? []), t])
                    return m
                  }, new Map<string, TxRow[]>()),
                ).map(([pid, list]) => {
                  const toplam = list.reduce((s, t) => s + t.amount, 0)
                  const kalan = remainingOf(pid)
                  const sozler = promisesAll.filter(pr => pr.patient_id === pid).reduce((s, pr) => s + Number(pr.amount), 0)
                  const odendi = kalan <= 0
                  const planTam = !odendi && sozler >= kalan
                  return (
                    <div key={pid}
                      onClick={() => pickPatient(pid)}
                      className={`rounded-xl border px-3 py-2 cursor-pointer transition-colors ${pid === selectedId ? 'bg-violet-500/10 border-violet-500/40' : 'bg-slate-900/40 border-slate-700/50 hover:border-slate-500'}`}>
                      {/* Hasta adı solda, işlemler sağda alt alta */}
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-white text-sm font-semibold truncate">{nameOf(pid)}</span>
                        <span className="text-right shrink-0 min-w-0">
                          {list.map(t => (
                            <span key={t.id} className="block text-sm text-slate-200 font-semibold truncate">{t.label}</span>
                          ))}
                        </span>
                      </div>
                      {/* Toplam + ödeme durumu */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-violet-400" />
                        <span className="text-xs text-slate-500 tabular-nums">{TRY(toplam)}</span>
                        {odendi && <span className="text-emerald-400 text-xs font-bold" title="Bakiye kapalı">✓</span>}
                        {planTam && <span className="text-emerald-400/70 text-xs font-bold" title="Ödeme planı tam">✓</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
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
                  {hastaDuzenle ? (
                    <form onSubmit={e => {
                      e.preventDefault()
                      const fd = new FormData(e.currentTarget as HTMLFormElement)
                      setHastaDuzenle(false)
                      run(() => updatePatient(selected.id, fd))
                    }} className="grid sm:grid-cols-[1fr,140px,1fr,auto,auto] gap-2 items-center">
                      <input name="name" defaultValue={selected.name} required placeholder="Ad Soyad *" className={inputCls} />
                      <input name="phone" defaultValue={selected.phone ?? ''} placeholder="Telefon" className={inputCls} />
                      <input name="notes" defaultValue={selected.notes ?? ''} placeholder="Not" className={inputCls} />
                      <button type="submit" disabled={pending} className={btnPrimary}>Kaydet</button>
                      <button type="button" onClick={() => setHastaDuzenle(false)} className={btnGhost}>Vazgeç</button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-white truncate">{selected.name}</h2>
                        <button onClick={() => setHastaDuzenle(true)}
                          title="Hasta bilgilerini düzenle"
                          className="text-slate-500 hover:text-violet-300 text-sm shrink-0" aria-label="Düzenle">✏️</button>
                        <button
                          onClick={() => {
                            const bos = patientTimeline.length === 0 && patientPhotos.length === 0 &&
                              apptsAll.filter(a => a.patient_id === selected.id).length === 0
                            setConfirmBox({
                              title: `"${selected.name}" hastası silinecek`,
                              lines: bos
                                ? ['Bu hastanın hiç kaydı yok — güvenle silinir', 'Geri alınamaz']
                                : ['Bu hastanın kayıtları var (işlem/tahsilat/randevu/foto)',
                                   'Kayıtlı hasta SİLİNEMEZ — muhasebe geçmişi korunur',
                                   'Silmek için önce kayıtlarını tek tek silin'],
                              confirmLabel: bos ? 'Hastayı Sil' : 'Yine de dene',
                              action: () => {
                                startTransition(async () => {
                                  const res = await deletePatient(selected.id)
                                  if (res.ok) { setSelectedId(null); setMobilePanelOpen(false) }
                                  else setError(res.error)
                                })
                              },
                            })
                          }}
                          title="Hastayı sil (sadece kaydı olmayan hastalar)"
                          className="text-slate-600 hover:text-rose-300 text-sm shrink-0" aria-label="Hastayı sil">🗑</button>
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {selected.phone ?? 'Telefon yok'}
                        {selected.notes ? ` · ${selected.notes}` : ''}
                      </p>
                    </>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {selRemaining > 0
                    ? <p className="text-rose-300 font-black">{TRY(selRemaining)} <span className="text-xs font-semibold">borç</span></p>
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
                      if (k === 'randevu') {
                        setRandevuPkgId(activePackages.length === 1 ? activePackages[0].treatment_id : '')
                        setRandevuTarih(day)
                        setRandevuSaat('')
                      }
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
                          <span className="flex items-center gap-2 shrink-0">
                            <span className={`text-sm font-black tabular-nums ${full ? 'text-emerald-300' : 'text-violet-300'}`}>
                              {pk.done}/{pk.session_total} seans
                            </span>
                            <button
                              onClick={() => {
                                const tx = txsAll.find(t => t.id === pk.treatment_id)
                                setConfirmBox({
                                  title: `"${pk.name}" paketi silinecek`,
                                  lines: [
                                    tx ? `İşlem kaydı (${TRY(tx.amount)}) silinir — hastanın borcu ${TRY(tx.amount)} azalır` : 'İşlem kaydı silinir',
                                    pk.planned > 0 ? `${pk.planned} planlı seans randevusu takvimden silinir` : 'Planlı seans randevusu yok',
                                    pk.done > 0 ? `${pk.done} tamamlanmış seans tarihçede kalır` : 'Henüz yapılmış seans yok',
                                    'Alınmış tahsilatlar SİLİNMEZ — bakiye buna göre yeniden hesaplanır',
                                  ],
                                  confirmLabel: 'Paketi Sil',
                                  action: () => {
                                    setRemovedPkgIds(prev => new Set(prev).add(pk.treatment_id))
                                    setRemovedTxIds(prev => new Set(prev).add(pk.treatment_id))
                                    run(() => deleteTreatmentCascade(pk.treatment_id))
                                  },
                                })
                              }}
                              title="Paketi sil (planlı seans randevularıyla birlikte)"
                              className="text-slate-500 hover:text-rose-300 text-sm" aria-label="Paketi sil">
                              🗑
                            </button>
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
                                onClick={() => { setOpenForm('randevu'); setRandevuPkgId(pk.treatment_id); setFromApptId(null); setRandevuTarih(day); setRandevuSaat('') }}
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
                        {/* Yapılan seanslar: tarih + girilen detay */}
                        {pk.sessions.length > 0 && (
                          <div className="mt-2 space-y-0.5 border-t border-slate-700/40 pt-1.5">
                            {pk.sessions.map((s, i) => (
                              <p key={s.id} className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                <span className="text-emerald-400 font-bold">✓ {i + 1}.</span>
                                {' '}{new Date(s.at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                {s.detail && <span className="text-slate-300"> — {s.detail}</span>}
                                {!s.id.startsWith('opt-') && (
                                  <button
                                    onClick={() => {
                                      setConfirmBox({
                                        title: `Seans ${i + 1} geri alınacak`,
                                        lines: [
                                          `${new Date(s.at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} tarihli seans kaydı silinir${s.detail ? ` (${s.detail})` : ''}`,
                                          `Sayaç ${pk.done}/${pk.session_total} → ${pk.done - 1}/${pk.session_total} olur`,
                                          'Ücrete dokunulmaz (paket bedeli işlemde)',
                                        ],
                                        confirmLabel: 'Geri Al',
                                        action: () => {
                                          setPkgDelta(prev => ({
                                            ...prev,
                                            [pk.treatment_id]: {
                                              done: (prev[pk.treatment_id]?.done ?? 0) - 1,
                                              planned: prev[pk.treatment_id]?.planned ?? 0,
                                              sessions: prev[pk.treatment_id]?.sessions ?? [],
                                              removedSessionIds: [...(prev[pk.treatment_id]?.removedSessionIds ?? []), s.id],
                                            },
                                          }))
                                          run(() => undoPackageSession(s.id))
                                        },
                                      })
                                    }}
                                    title="Seansı geri al (yanlış tıklama düzeltme — sayaç geri düşer)"
                                    className="text-slate-600 hover:text-rose-300 font-bold" aria-label="Seansı geri al">
                                    ×
                                  </button>
                                )}
                              </p>
                            ))}
                          </div>
                        )}
                        {/* Seans detay mini formu: ürün / miktar / not — para sorulmaz */}
                        {seansFormPkg === pk.treatment_id && !full && (
                          <form
                            onSubmit={e => {
                              e.preventDefault()
                              const fd = new FormData(e.currentTarget as HTMLFormElement)
                              // Depodan ürün: ad detaya yazılır + stok düşülür
                              const stockId = (fd.get('stock_item') as string ?? '').trim()
                              const stockItem = stockId ? stockAll.find(i => i.id === stockId) : null
                              const miktarStr = ((fd.get('miktar') as string) ?? '').trim()
                              const miktar = Number(miktarStr.replace(',', '.'))
                              const useStock = !!stockItem && Number.isFinite(miktar) && miktar > 0
                              const parts = [
                                stockItem ? stockItem.name : (fd.get('urun') as string | null)?.trim(),
                                miktarStr ? `${miktarStr}${stockItem?.unit ? ` ${stockItem.unit}` : ''}` : null,
                                (fd.get('not') as string | null)?.trim(),
                              ].filter(Boolean) as string[]
                              setSeansFormPkg(null)
                              if (useStock) setStockDelta(prev => ({ ...prev, [stockItem.id]: (prev[stockItem.id] ?? 0) - miktar }))

                              // Anında: sayaç +1; bugüne planlı bağlı randevu varsa onu tamamla
                              const nowIso = new Date().toISOString()
                              const todaysLinked = apptsAll.find(a =>
                                a.package_treatment_id === pk.treatment_id && a.status === 'scheduled' &&
                                new Date(a.start_at).toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }) === todayIso())
                              if (todaysLinked) setApptStatusOv(prev => ({ ...prev, [todaysLinked.id]: 'completed' }))
                              else setOptAppts(prev => [...prev, {
                                id: oid(), patient_id: pk.patient_id, start_at: nowIso, duration_minutes: 30,
                                treatment_type: `${pk.name} — Seans ${pk.done + 1}`, appointment_type: null,
                                status: 'completed', package_treatment_id: pk.treatment_id,
                              }])
                              setPkgDelta(prev => ({
                                ...prev,
                                [pk.treatment_id]: {
                                  done: (prev[pk.treatment_id]?.done ?? 0) + 1,
                                  planned: (prev[pk.treatment_id]?.planned ?? 0) + (todaysLinked ? -1 : 0),
                                  sessions: [...(prev[pk.treatment_id]?.sessions ?? []), { id: oid(), at: nowIso, detail: parts.join(' · ') || null }],
                                },
                              }))

                              run(() => logPackageSession(
                                pk.treatment_id, parts.join(' · '),
                                useStock ? stockItem.id : undefined,
                                useStock ? miktar : undefined,
                              ))
                            }}
                            className="mt-2 space-y-2 bg-slate-950/50 rounded-lg p-2">
                            <div className="grid sm:grid-cols-[1fr,110px] gap-2">
                              {/* Depodan ürün: uygulama adıyla eşleşenler önde */}
                              <select name="stock_item" className={inputCls}
                                defaultValue={(() => {
                                  const nm = pk.name.toLocaleLowerCase('tr')
                                  const mapped = stockMaps.find(m => nm.includes(m.match_text.toLocaleLowerCase('tr')))
                                  if (mapped && stockAll.some(i => i.id === mapped.item_id)) return mapped.item_id
                                  const byName = stockAll.find(i =>
                                    nm.includes(i.name.toLocaleLowerCase('tr')) || i.name.toLocaleLowerCase('tr').includes(nm.split(' ')[0]))
                                  return byName?.id ?? ''
                                })()}>
                                <option value="">Depodan düşme yok (serbest)</option>
                                {(() => {
                                  const nm = pk.name.toLocaleLowerCase('tr')
                                  const score = (i: StockItemRow) =>
                                    nm.includes(i.name.toLocaleLowerCase('tr')) || i.name.toLocaleLowerCase('tr').includes(nm.split(' ')[0]) ? 0 : 1
                                  return [...stockAll].sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name, 'tr'))
                                })().map(i => (
                                  <option key={i.id} value={i.id} disabled={i.quantity <= 0}>
                                    {i.name} — kalan {i.quantity}{i.unit ? ` ${i.unit}` : ''}{i.quantity <= 0 ? ' (TÜKENDİ)' : ''}
                                  </option>
                                ))}
                              </select>
                              <input name="miktar" placeholder="Miktar *" inputMode="decimal" className={inputCls} />
                            </div>
                            <div className="grid sm:grid-cols-[1fr,1fr,auto] gap-2">
                              <input name="urun" placeholder="Serbest ürün adı (depoda yoksa)" className={inputCls} />
                              <input name="not" placeholder="Not (göz altı, sağ yanak…)" className={inputCls} />
                              <button type="submit" disabled={pending} className={btnPrimary}>
                                {pending ? '…' : 'Tamamla'}
                              </button>
                            </div>
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
                  <div className="grid sm:grid-cols-[minmax(0,1fr),110px,130px,auto] gap-2">
                    <div className="min-w-0">
                      <input name="treatment_name" list="katalog-listesi" placeholder="İşlem adı *" required className={inputCls} />
                      <datalist id="katalog-listesi">
                        {catalog.map(c => <option key={c.id} value={c.name} />)}
                      </datalist>
                    </div>
                    <input name="treatment_amount" placeholder="Ücret ₺ *" required inputMode="decimal" className={inputCls} />
                    <input name="treatment_date" type="date" defaultValue={day} className={inputCls} />
                    <button type="button"
                      onClick={() => setExtraIslemler(prev => [...prev, { id: oid() }])}
                      title="Aynı ziyarette başka işlem ekle"
                      className="px-3 py-2 rounded-lg text-sm font-bold bg-slate-700 hover:bg-slate-600 text-slate-100 whitespace-nowrap">
                      + İşlem
                    </button>
                  </div>

                  {/* Ek işlem satırları — aynı ziyaret, ayrı borç kayıtları */}
                  {extraIslemler.map((row, i) => (
                    <div key={row.id} className="grid sm:grid-cols-[minmax(0,1fr),110px,130px,auto] gap-2">
                      <input name={`extra_name_${i}`} list="katalog-listesi" placeholder={`${i + 2}. işlem adı`} className={inputCls} />
                      <input name={`extra_amount_${i}`} placeholder="Ücret ₺" inputMode="decimal" className={inputCls} />
                      <select name={`extra_session_${i}`} defaultValue="" className={inputCls} title="Paketse seans sayısı">
                        <option value="">Tek seans</option>
                        {[2, 3, 4, 5, 6, 8, 10, 12].map(n => <option key={n} value={n}>Paket · {n}</option>)}
                      </select>
                      <button type="button"
                        onClick={() => setExtraIslemler(prev => prev.filter(r => r.id !== row.id))}
                        className="px-3 py-2 rounded-lg text-sm font-bold bg-slate-800 hover:bg-rose-600/30 text-slate-400"
                        aria-label="Satırı kaldır">✕</button>
                    </div>
                  ))}
                  <input type="hidden" name="extra_count" value={extraIslemler.length} />
                  <div className="grid sm:grid-cols-[130px,120px,140px,1fr] gap-2">
                    <select name="session_total" defaultValue="" className={inputCls} title="Paketse toplam seans sayısı">
                      <option value="">Tek seans</option>
                      {[2, 3, 4, 5, 6, 8, 10, 12].map(n => <option key={n} value={n}>Paket · {n} seans</option>)}
                    </select>
                    <input name="payment_amount" placeholder="Alınan ₺ (toplam)" inputMode="decimal" className={inputCls}
                      title="Tüm işlemler için alınan toplam tutar — hastanın hesabına yazılır" />
                    <select name="payment_method" className={inputCls}>
                      <option value="">Ödeme yok</option>
                      <option value="nakit">Nakit</option>
                      <option value="kart">Kart</option>
                      <option value="havale">Havale</option>
                    </select>
                    <input name="treatment_notes" placeholder="Not" className={inputCls} />
                  </div>
                  <input type="hidden" name="payment_date" value={day} />
                  <button type="submit" disabled={pending} className={btnPrimary}>
                    {pending ? 'Kaydediliyor…' : extraIslemler.length > 0 ? `${extraIslemler.length + 1} İşlemi Kaydet` : 'İşlemi Kaydet'}
                  </button>
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
                  <div className="grid sm:grid-cols-[140px,110px,1fr] gap-2">
                    <input name="date" type="date" required value={randevuTarih}
                      onChange={e => { setRandevuTarih(e.target.value); setRandevuSaat('') }}
                      className={inputCls} />
                    <select name="duration_minutes" defaultValue="30" className={inputCls}>
                      {[15, 20, 30, 45, 60, 90].map(m => <option key={m} value={m}>{m} dk</option>)}
                    </select>
                    <input name="treatment_type" list="katalog-listesi" placeholder="İşlem / sebep" className={inputCls} />
                  </div>

                  {/* Slot seçici — müsaitlik takviminden üretilir, dolu saatler kapalı */}
                  {(() => {
                    const d = new Date(randevuTarih + 'T12:00:00')
                    const dayAvail = availabilityForDate(availability, d)
                    const slots = generateSlotsForDay(dayAvail)
                    const dolu = new Set(
                      apptsAll
                        .filter(a => a.status === 'scheduled' &&
                          new Date(a.start_at).toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }) === randevuTarih)
                        .map(a => new Date(a.start_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })),
                    )
                    if (slots.length === 0) {
                      return (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-amber-300">Bu gün kapalı veya müsaitlik tanımlı değil.</span>
                          <Link href="/klinik/panel/muhasebe/randevu/musaitlik" className="text-violet-300 font-semibold">Müsaitlik ayarla →</Link>
                          <span className="text-slate-500">· saat girilmezse 17:00</span>
                        </div>
                      )
                    }
                    return (
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-slate-400">Saat seç {randevuSaat && <span className="text-violet-300">· {randevuSaat}</span>}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {slots.map(s => {
                            const full = dolu.has(s.time)
                            const sel = randevuSaat === s.time
                            return (
                              <button key={s.time} type="button" disabled={full}
                                onClick={() => setRandevuSaat(s.time)}
                                title={full ? 'Dolu' : `${s.time} – ${s.endTime}`}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold tabular-nums transition-colors ${
                                  full ? 'bg-slate-800/50 text-slate-600 line-through cursor-not-allowed'
                                    : sel ? 'bg-violet-600 text-white'
                                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>
                                {s.time}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}
                  <input type="hidden" name="time" value={randevuSaat} />
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
                    {/* Seri kamera: tarayıcı içi, onay ekranı yok, kamera açık kalır */}
                    <button type="button"
                      onClick={() => setKameraAcik(true)}
                      disabled={pending}
                      className={`px-3.5 py-2 rounded-lg text-sm font-bold ${pending ? 'bg-slate-700 text-slate-400' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}>
                      📷 Kamera (seri)
                    </button>
                    {/* Yedek: cihaz kamerası — tarayıcı içi çalışmazsa */}
                    <label className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${pending ? 'bg-slate-800 text-slate-500 pointer-events-none' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}
                      title="Telefonun kendi kamera uygulaması">
                      Tek kare
                      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" disabled={pending}
                        onChange={e => {
                          const files = Array.from(e.target.files ?? [])
                          e.target.value = ''
                          uploadPhotos(files, { reopenCamera: seriCekim })
                        }} />
                    </label>
                    <label className={`px-3.5 py-2 rounded-lg text-sm font-bold cursor-pointer ${pending ? 'bg-slate-800 text-slate-500 pointer-events-none' : 'bg-slate-700 hover:bg-slate-600 text-slate-100'}`}>
                      🖼 Galeriden Seç (çoklu)
                      <input type="file" accept="image/*" multiple className="hidden" disabled={pending}
                        onChange={e => { uploadPhotos(Array.from(e.target.files ?? [])); e.target.value = '' }} />
                    </label>
                    {photoProgress
                      ? <span className="text-xs text-violet-300 font-semibold">{photoProgress}</span>
                      : bridgeHost
                        ? <span className="text-xs text-emerald-400/90 font-semibold">💾 Klinik bilgisayarına kaydedilir</span>
                        : <span className="text-xs text-rose-300 font-semibold">⚠ Köprü kapalı — foto BULUTA gider</span>}
                  </div>
                  {bridgeChecked && !bridgeHost && (
                    <div className="text-[11px] text-rose-300/90 bg-rose-500/10 border border-rose-500/25 rounded-lg px-2.5 py-1.5">
                      Klinik bilgisayarındaki <b>KlinikFoto</b> programı açık değil (veya ağ değişti).
                      Programı açıp birkaç saniye bekleyin — bağlantı kendiliğinden kurulur.
                    </div>
                  )}
                  {/* Köprü bulunamadıysa adres girme */}
                  {bridgeChecked && !bridgeHost && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-700/60">
                      <span className="text-[11px] text-amber-300/90">Klinik bilgisayarına kaydetmek için köprü adresi:</span>
                      <input value={bridgeInput} onChange={e => setBridgeInput(e.target.value)}
                        placeholder="192.168.1.40" className={`${inputCls} w-36`} />
                      <button type="button"
                        onClick={() => {
                          setBridgeHost(bridgeInput || null)
                          findBridge().then(h => {
                            setBridgeHostState(h)
                            if (!h) setError('Köprüye ulaşılamadı — program açık mı, aynı Wi-Fi\'da mısın?')
                          })
                        }}
                        className={btnGhost}>Bağlan</button>
                    </div>
                  )}
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
                        {/* Sil — galeriden doğrudan, büyütmeye gerek yok */}
                        {!compareMode && (
                          <button
                            onClick={() => {
                              setConfirmBox({
                                title: 'Fotoğraf silinecek',
                                lines: [
                                  `${new Date(f.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}${f.note ? ` · ${f.note}` : ''}`,
                                  f.id.startsWith('local:') ? 'Klinik bilgisayarındaki dosya silinir' : 'Buluttaki dosya silinir',
                                  'Geri alınamaz',
                                ],
                                confirmLabel: 'Fotoğrafı Sil',
                                action: () => {
                                  const delId = f.id
                                  startTransition(async () => {
                                    if (delId.startsWith('local:') && bridgeHost) {
                                      const ok = await bridgeDelete(bridgeHost, delId.slice(6))
                                      if (ok) reloadPhotos(); else setError('Köprüden silinemedi')
                                      return
                                    }
                                    const res = await deletePatientPhoto(delId)
                                    if (res.ok) reloadPhotos(); else setError(res.error ?? 'Silme hatası')
                                  })
                                },
                              })
                            }}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 hover:bg-rose-600/80 text-white text-xs font-bold flex items-center justify-center"
                            aria-label="Fotoğrafı sil">
                            ✕
                          </button>
                        )}
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
                      if (!pk) return base
                      // Bu randevu paketin kaçıncı seansı olacak: tamamlanan + bu randevunun
                      // gelecekteki bağlı randevular arasındaki sırası
                      const ordinal = pk.done + 1 + patientAppts
                        .filter(x => x.package_treatment_id === a.package_treatment_id)
                        .findIndex(x => x.id === a.id)
                      return `📦 ${pk.name} — Seans ${ordinal}/${pk.session_total}`
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
                                <span className="flex items-center gap-1.5 shrink-0">
                                  <span className={`text-sm font-bold tabular-nums ${col.total}`}>
                                    {t.kind === 'tahsilat' ? '+' : ''}{TRY(t.amount)}
                                  </span>
                                  {!t.id.startsWith('opt-') && (
                                    <button
                                      onClick={() => {
                                        const dateStr = new Date(t.date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                                        if (t.kind === 'islem') {
                                          const pk = pkgById.get(t.id)
                                          setConfirmBox({
                                            title: `"${t.label}" işlemi silinecek`,
                                            lines: [
                                              `${dateStr} tarihli ${TRY(t.amount)} tutarlı işlem kaydı silinir`,
                                              `Hastanın borcu ${TRY(t.amount)} azalır`,
                                              ...(pk ? [
                                                pk.planned > 0 ? `PAKET: ${pk.planned} planlı seans randevusu da silinir` : 'PAKET: planlı seans randevusu yok',
                                                pk.done > 0 ? `${pk.done} tamamlanmış seans tarihçede kalır` : '',
                                              ].filter(Boolean) : []),
                                              'Alınmış tahsilatlar SİLİNMEZ',
                                            ],
                                            confirmLabel: 'İşlemi Sil',
                                            action: () => {
                                              setRemovedTxIds(prev => new Set(prev).add(t.id))
                                              setRemovedPkgIds(prev => new Set(prev).add(t.id))
                                              run(() => deleteTreatmentCascade(t.id))
                                            },
                                          })
                                        } else {
                                          setConfirmBox({
                                            title: 'Tahsilat kaydı silinecek',
                                            lines: [
                                              `${dateStr} · ${TRY(t.amount)}${t.label ? ` · ${t.label}` : ''} tahsilatı silinir`,
                                              `Hastanın borcu ${TRY(t.amount)} ARTAR`,
                                            ],
                                            confirmLabel: 'Tahsilatı Sil',
                                            action: () => {
                                              setRemovedTxIds(prev => new Set(prev).add(t.id))
                                              run(() => deletePayment(t.id, t.patient_id))
                                            },
                                          })
                                        }
                                      }}
                                      title="Kaydı sil"
                                      className="text-slate-600 hover:text-rose-300 text-xs font-bold" aria-label="Kaydı sil">
                                      ✕
                                    </button>
                                  )}
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
              {(patientPromises.length > 0 || (selRemaining > 0 && openForm === 'soz')) && (
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
                            const fd = new FormData(e.currentTarget as HTMLFormElement)
                            setPromiseOv(prev => ({
                              ...prev,
                              [pr.id]: {
                                due_date: (fd.get('due_date') as string) || pr.due_date,
                                amount: Number(((fd.get('amount') as string) ?? '').replace(',', '.')) || Number(pr.amount),
                                note: (fd.get('note') as string) || null,
                              },
                            }))
                            run(() => updatePaymentPromise(pr.id, fd))
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
                              <button onClick={() => {
                                setPromiseOv(prev => ({ ...prev, [pr.id]: { removed: true } }))
                                run(() => settlePaymentPromise(pr.id, 'cancelled'))
                              }}
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
                                onClick={() => {
                                  setSettlingPromiseId(null)
                                  // Anında: söz düşer, tahsilat işlenir, bakiye oynar
                                  setPromiseOv(prev => ({ ...prev, [pr.id]: { removed: true } }))
                                  setOptTxs(prev => [...prev, {
                                    id: oid(), patient_id: pr.patient_id, kind: 'tahsilat',
                                    date: todayIso(), label: m, amount: Number(pr.amount),
                                  }])
                                  run(() => settlePaymentPromise(pr.id, 'paid', m))
                                }}
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
              {selRemaining > 0 && (() => {
                // Planlanmamış açık: borçtan mevcut açık sözlerin toplamı düşülür.
                const promisedTotal = patientPromises.reduce((s, pr) => s + Number(pr.amount), 0)
                const unplanned = selRemaining - promisedTotal
                if (unplanned <= 0) {
                  return <p className="text-xs text-emerald-400/80">Ödeme planı borcun tamamını karşılıyor ✓</p>
                }
                return openForm === 'soz' ? (
                  <form onSubmit={e => {
                    e.preventDefault()
                    if (!selectedId) return
                    const fd = new FormData(e.currentTarget as HTMLFormElement)
                    const dd = (fd.get('due_date') as string ?? '').trim()
                    const amt = Number(((fd.get('amount') as string) ?? '').replace(',', '.'))
                    if (dd && Number.isFinite(amt) && amt > 0) {
                      setOptPromises(prev => [...prev, {
                        id: oid(), patient_id: selectedId, due_date: dd, amount: amt,
                        note: (fd.get('note') as string) || null, status: 'open',
                      }])
                    }
                    run(() => addPaymentPromise(selectedId, fd))
                  }} className="bg-slate-900/60 border border-amber-500/25 rounded-xl p-3 space-y-2">
                    <p className="text-xs text-amber-300 font-semibold">
                      Planlanmamış {TRY(unplanned)} için ödeme sözü
                      {promisedTotal > 0 && <span className="text-slate-500"> (borç {TRY(selRemaining)}, planlı {TRY(promisedTotal)})</span>}
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
      )}

      {/* KARŞILAŞTIRMA — iki foto yan yana */}
      {compareMode && compareSel.length === 2 && (() => {
        const pair = compareSel
          .map(id => patientPhotos.find(f => f.id === id))
          .filter((f): f is PhotoRow => !!f)
        if (pair.length !== 2) return null
        const caption = (f: PhotoRow) =>
          `${new Date(f.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}${f.note ? ` · ${f.note}` : ''}`
        return (
          <div className="fixed inset-0 z-50 flex flex-col"
            style={{ background: ZEMIN_BG[fotoZemin], filter: 'none' }}
            onClick={() => setCompareSel([])}
            onKeyDown={e => { if (e.key === 'Escape') setCompareSel([]) }}
            tabIndex={0}
            ref={el => el?.focus()}>
            <div className="flex items-center justify-between px-4 py-3 gap-2 flex-wrap">
              <span className="text-white font-bold text-sm bg-black/60 px-3 py-1.5 rounded-lg">{selected?.name} — Karşılaştırma</span>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <div className="flex gap-1.5 mr-1">
                  {(['siyah', 'gri', 'beyaz'] as const).map(z => (
                    <button key={z} onClick={() => setFotoZemin(z)} aria-label={`Zemin ${z}`}
                      className={`w-6 h-6 rounded-full border-2 ${fotoZemin === z ? 'border-violet-400' : 'border-white/30'}`}
                      style={{ background: ZEMIN_BG[z] }} />
                  ))}
                </div>
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
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: ZEMIN_BG[fotoZemin], filter: 'none' }}
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
              <div className="absolute top-2 left-3 flex gap-1.5">
                {(['siyah', 'gri', 'beyaz'] as const).map(z => (
                  <button key={z} onClick={() => setFotoZemin(z)} aria-label={`Zemin ${z}`}
                    className={`w-7 h-7 rounded-full border-2 ${fotoZemin === z ? 'border-violet-400' : 'border-white/30'}`}
                    style={{ background: ZEMIN_BG[z] }} />
                ))}
              </div>
            </div>
            <div className="w-full max-w-4xl px-4 pb-5 flex items-center justify-between gap-3 [&>div]:bg-black/60 [&>div]:rounded-lg [&>div]:px-3 [&>div]:py-1.5" onClick={e => e.stopPropagation()}>
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
                  startTransition(async () => {
                    if (delId.startsWith('local:') && bridgeHost) {
                      const ok = await bridgeDelete(bridgeHost, delId.slice(6))
                      if (ok) reloadPhotos()
                      else setError('Köprüden silinemedi')
                      return
                    }
                    const res = await deletePatientPhoto(delId)
                    if (res.ok) reloadPhotos()
                    else setError(res.error ?? 'Silme hatası')
                  })
                }}
                className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-600/30 text-rose-200 hover:bg-rose-600/50">
                Sil
              </button>
            </div>
          </div>
        )
      })()}

      {/* SERİ KAMERA — tarayıcı içi çekim */}
      {kameraAcik && selected && (
        <SeriKamera
          patientName={selected.name}
          stageLabel={photoStage === 'oncesi' ? 'İşlem öncesi' : photoStage === 'sonrasi' ? 'İşlem sonrası' : 'Kontrol'}
          onCapture={captureOne}
          onClose={() => { setKameraAcik(false); reloadPhotos() }}
        />
      )}

      {/* SİLME ONAYI — ne silinecek + zincirleme sonuçları */}
      {confirmBox && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
          style={{ filter: 'none' }}
          onClick={() => setConfirmBox(null)}
          onKeyDown={e => { if (e.key === 'Escape') setConfirmBox(null) }}
          tabIndex={0}
          ref={el => el?.focus()}>
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-2xl p-5 space-y-3"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-black">⚠ {confirmBox.title}</h3>
            <ul className="space-y-1.5">
              {confirmBox.lines.map((l, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2">
                  <span className="text-rose-400 shrink-0">•</span><span>{l}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { const a = confirmBox.action; setConfirmBox(null); a() }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-colors">
                {confirmBox.confirmLabel}
              </button>
              <button
                onClick={() => setConfirmBox(null)}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold transition-colors">
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALT ŞERİT — masaüstünde sabit; mobilde alt nav var, şerit akışın sonunda */}
      <div className="sm:sticky sm:bottom-0 pb-1 hidden sm:block">
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

      {/* MOBİL ALT NAV — başparmak menzilinde 4 sekme */}
      <div className="sm:hidden h-20" aria-hidden />
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/98 backdrop-blur border-t border-slate-700"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Gün özeti şeridi — nav'ın üstünde ince satır */}
        <div className="px-3 py-1 text-[11px] text-slate-400 border-b border-slate-800 flex items-center justify-between">
          <span>{dayLabel(day)}: <span className="text-white font-bold">{dayStats.islem.length}</span> işlem · <span className="text-emerald-300 font-bold">{TRY(dayStats.collected)}</span> tahsil</span>
          <Link href={`/klinik/panel/muhasebe/rapor?ay=${day.slice(0, 7)}`} className="text-slate-500">🖨</Link>
        </div>
        <div className="grid grid-cols-4">
          {([
            { v: 'gun' as const, icon: '📅', label: 'Gün', badge: dayAppts.filter(a => a.status === 'scheduled').length },
            { v: 'hastalar' as const, icon: '👥', label: 'Hastalar', badge: 0 },
            { v: 'alacak' as const, icon: '💰', label: 'Alacak', badge: overdueCount },
            { v: 'stok' as const, icon: '📦', label: 'Stok', badge: lowStockCount },
          ]).map(t => (
            <button key={t.v}
              onClick={() => {
                setLeftView(t.v)
                setMobilePanelOpen(false)
                setMobileMenu(false)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 transition-colors ${leftView === t.v && !mobilePanelOpen ? 'text-violet-300' : 'text-slate-400'}`}>
              <span className="text-lg leading-none">{t.icon}</span>
              <span className="text-[11px] font-bold">{t.label}</span>
              {t.badge > 0 && (
                <span className={`absolute top-1.5 right-1/2 translate-x-4 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center ${t.v === 'gun' ? 'bg-violet-500/40 text-violet-100' : 'bg-rose-500/40 text-rose-100'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
