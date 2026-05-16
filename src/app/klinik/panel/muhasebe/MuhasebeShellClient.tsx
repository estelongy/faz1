'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import MuhasebeListClient from './MuhasebeListClient'
import { addQuickEntry } from './actions'

export interface PatientRow {
  id: string
  name: string
  phone: string | null
  notes: string | null
  total_amount: number
  paid_amount: number
  remaining: number
  treatment_count: number
  last_activity: string | null
}

interface DayTreatment {
  id: string
  patient_id: string
  patient_name: string
  name: string
  amount: number
}
interface DayPayment {
  id: string
  patient_id: string
  patient_name: string
  amount: number
  method: string | null
}
export interface DayGroup {
  date: string  // YYYY-MM-DD
  treatments: DayTreatment[]
  payments: DayPayment[]
  billed: number
  collected: number
}

export interface CatalogItem {
  id: string
  name: string
  category: string | null
  default_unit: string | null
  default_price: number | null
  egp_linked: boolean
  sort_order: number
}

export interface AppointmentPrefill {
  appointmentId: string
  patientId: string | null          // mevcut hasta varsa id, yoksa null (yeni isim/telefon ile gelir)
  patientName: string
  patientPhone: string | null
  treatmentName: string
  treatmentDate: string             // YYYY-MM-DD
}

interface Props {
  rows: PatientRow[]
  days: DayGroup[]
  catalog: CatalogItem[]
  monthLabel: string
  monthBilled: number
  monthCollected: number
  totalRemaining: number
  debtorCount: number
  patientCount: number
  prefill?: AppointmentPrefill | null
}

function formatTRY(n: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)
}

function formatDayLabel(dateStr: string): string {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
    .toISOString().slice(0, 10)
  if (dateStr === todayStr) return 'Bugün'
  if (dateStr === yesterday) return 'Dün'
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })
}

export default function MuhasebeShellClient({
  rows, days, catalog, monthLabel, monthBilled, monthCollected, totalRemaining, debtorCount, patientCount, prefill,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'gunluk' | 'hastalar'>('gunluk')
  const [showQuick, setShowQuick] = useState(!!prefill)
  const [completingAppointmentId, setCompletingAppointmentId] = useState<string | null>(prefill?.appointmentId ?? null)
  const [pending, startTransition] = useTransition()
  const [quickError, setQuickError] = useState<string | null>(null)
  const [quickSuccess, setQuickSuccess] = useState(false)

  // Hızlı kayıt — mevcut/yeni hasta seçimi
  const [patientMode, setPatientMode] = useState<'existing' | 'new'>(
    prefill?.patientId ? 'existing' : 'new'
  )
  const [selectedPatientId, setSelectedPatientId] = useState(prefill?.patientId ?? '')
  const [patientSearch, setPatientSearch] = useState(prefill?.patientId ? prefill.patientName : '')
  const prefillNewName = prefill && !prefill.patientId ? prefill.patientName : ''
  const prefillNewPhone = prefill && !prefill.patientId ? (prefill.patientPhone ?? '') : ''

  // Hızlı kayıt — işlem arama (katalog)
  const [treatmentMode, setTreatmentMode] = useState<'catalog' | 'custom'>(prefill ? 'custom' : 'catalog')
  const [selectedCatalogId, setSelectedCatalogId] = useState('')
  const [treatmentName, setTreatmentName] = useState(prefill?.treatmentName ?? '')
  const [treatmentSearch, setTreatmentSearch] = useState(prefill?.treatmentName ?? '')
  const [treatmentFocused, setTreatmentFocused] = useState(false)

  // Prefill geldiğinde (aynı sayfaya yeni ?from_appointment ile dönüş dahil)
  // state'leri reset et + form'a kaydır. useState initial value sadece ilk
  // mount'ta çalışır; sonradan gelen prop'u burada uygulamamız gerekir.
  useEffect(() => {
    if (!prefill) return
    setShowQuick(true)
    setCompletingAppointmentId(prefill.appointmentId)
    setPatientMode(prefill.patientId ? 'existing' : 'new')
    setSelectedPatientId(prefill.patientId ?? '')
    setPatientSearch(prefill.patientId ? prefill.patientName : '')
    setTreatmentMode('custom')
    setTreatmentName(prefill.treatmentName ?? '')
    setTreatmentSearch(prefill.treatmentName ?? '')
    setQuickError(null)
    setQuickSuccess(false)
    setTimeout(() => {
      const el = document.querySelector('#hizli-kayit-form')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [prefill])

  // Hızlı kayıt — ürün satırları
  const [productRows, setProductRows] = useState<{ name: string; qty: string; unit: string }[]>([])
  function addProductRow() { setProductRows(r => [...r, { name: '', qty: '1', unit: '' }]) }
  function removeProductRow(i: number) { setProductRows(r => r.filter((_, j) => j !== i)) }
  function updateProductRow(i: number, field: 'name' | 'qty' | 'unit', val: string) {
    setProductRows(r => r.map((row, j) => j === i ? { ...row, [field]: val } : row))
  }

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return rows.slice(0, 10)
    const q = patientSearch.toLowerCase()
    return rows.filter(r => r.name.toLowerCase().includes(q)).slice(0, 10)
  }, [rows, patientSearch])

  const filteredCatalog = useMemo(() => {
    if (!treatmentSearch.trim()) return catalog.slice(0, 12)
    const q = treatmentSearch.toLocaleLowerCase('tr-TR')
    return catalog.filter(c =>
      c.name.toLocaleLowerCase('tr-TR').includes(q) ||
      (c.category ?? '').toLocaleLowerCase('tr-TR').includes(q)
    ).slice(0, 12)
  }, [catalog, treatmentSearch])

  function pickCatalogItem(item: CatalogItem) {
    setSelectedCatalogId(item.id)
    setTreatmentName(item.name)
    setTreatmentSearch(item.name)
    setTreatmentFocused(false)
    // İlk ürün satırı yoksa ve default_unit varsa, sezgisel bir ürün satırı önerme yapmıyoruz — hekim manuel ekler.
  }

  function clearCatalogPick() {
    setSelectedCatalogId('')
    setTreatmentName('')
    setTreatmentSearch('')
  }

  function handleQuickSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setQuickError(null)
    setQuickSuccess(false)
    const fd = new FormData(e.currentTarget)
    const form = e.currentTarget
    startTransition(async () => {
      const res = await addQuickEntry(fd)
      if (res.ok) {
        form.reset()
        setQuickSuccess(true)
        setSelectedPatientId('')
        setPatientSearch('')
        setPatientMode('new')
        setProductRows([])
        setSelectedCatalogId('')
        setTreatmentName('')
        setTreatmentSearch('')
        setTreatmentMode('catalog')
        setTreatmentFocused(false)
        if (completingAppointmentId) {
          setCompletingAppointmentId(null)
          // URL'den ?from_appointment temizle (geri/yenile'de prefill tetiklenmesin)
          router.replace('/klinik/panel/muhasebe')
        }
        router.refresh()
        setTimeout(() => setQuickSuccess(false), 3000)
      } else {
        setQuickError(res.error)
      }
    })
  }

  const monthRemaining = monthBilled - monthCollected

  return (
    <>
      {/* Hızlı Kayıt + PDF Al butonları */}
      <div className="flex justify-end gap-2 mb-3">
        <button
          type="button"
          onClick={() => window.open('/klinik/muhasebe-ozet', '_blank')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold rounded-xl transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          PDF Al
        </button>
        <button
          type="button"
          onClick={() => { setShowQuick(s => !s); setQuickError(null); setQuickSuccess(false) }}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
            showQuick
              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white'
          }`}
        >
          {showQuick ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Kapat
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Hızlı Kayıt
            </>
          )}
        </button>
      </div>

      {/* Hızlı Kayıt formu */}
      {showQuick && (
        <form key={prefill?.appointmentId ?? 'no-prefill'} id="hizli-kayit-form" onSubmit={handleQuickSubmit} className="mb-5 p-4 sm:p-5 rounded-2xl bg-slate-800/60 border border-violet-500/30 space-y-4">
          <input type="hidden" name="complete_appointment_id" value={completingAppointmentId ?? ''} />

          {prefill && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-emerald-300 text-sm font-semibold">
              ✓ Randevu işleme alınıyor — bilgiler ön doldurudu, eksikleri tamamlayıp kaydet.
            </div>
          )}

          <p className="text-sm uppercase tracking-widest text-violet-300/80 font-bold">Hızlı Kayıt — Hasta + İşlem + Ürün + Tahsilat</p>

          {/* ── Hasta Seçimi ── */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button type="button" onClick={() => { setPatientMode('new'); setSelectedPatientId('') }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${patientMode === 'new' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
                Yeni Hasta
              </button>
              <button type="button" onClick={() => setPatientMode('existing')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${patientMode === 'existing' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
                Mevcut Hasta ({rows.length})
              </button>
            </div>

            {patientMode === 'new' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1">Ad Soyad *</label>
                  <input name="new_patient_name" autoFocus minLength={2} maxLength={120}
                    defaultValue={prefillNewName}
                    placeholder="Örn. Ayşe Y."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1">Telefon</label>
                  <input name="new_patient_phone" type="tel" maxLength={32}
                    defaultValue={prefillNewPhone}
                    placeholder="0555…"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500" />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1">Hasta Seç *</label>
                <input
                  type="text"
                  value={patientSearch}
                  onChange={e => { setPatientSearch(e.target.value); setSelectedPatientId('') }}
                  placeholder="Hasta adı yazarak ara…"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 mb-1"
                />
                <input type="hidden" name="existing_patient_id" value={selectedPatientId} />
                {selectedPatientId ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                    <span className="text-violet-300 text-sm font-medium">
                      {rows.find(r => r.id === selectedPatientId)?.name}
                    </span>
                    <button type="button" onClick={() => { setSelectedPatientId(''); setPatientSearch('') }}
                      className="ml-auto text-slate-500 hover:text-white text-sm">Değiştir</button>
                  </div>
                ) : (
                  <div className="max-h-32 overflow-y-auto space-y-0.5">
                    {filteredPatients.length === 0 ? (
                      <p className="text-slate-600 text-sm px-2 py-1">Hasta bulunamadı — &quot;Yeni Hasta&quot; seçin.</p>
                    ) : (
                      filteredPatients.map(r => (
                        <button key={r.id} type="button"
                          onClick={() => { setSelectedPatientId(r.id); setPatientSearch(r.name) }}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800/60 text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {r.name.charAt(0).toLocaleUpperCase('tr-TR')}
                          </span>
                          <span className="truncate">{r.name}</span>
                          {r.remaining > 0 && <span className="ml-auto text-amber-400 text-sm shrink-0">{formatTRY(r.remaining)}</span>}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-700/50" />

          {/* ── İşlem ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm uppercase tracking-widest text-slate-500 font-bold">İşlem Bilgisi</p>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => { setTreatmentMode('catalog') }}
                  className={`px-2.5 py-1 text-sm font-semibold rounded transition-colors ${treatmentMode === 'catalog' ? 'bg-violet-600 text-white' : 'bg-slate-700/60 text-slate-400 hover:text-white'}`}>
                  Katalogtan Seç
                </button>
                <button type="button" onClick={() => { setTreatmentMode('custom'); clearCatalogPick() }}
                  className={`px-2.5 py-1 text-sm font-semibold rounded transition-colors ${treatmentMode === 'custom' ? 'bg-violet-600 text-white' : 'bg-slate-700/60 text-slate-400 hover:text-white'}`}>
                  Özel Ad Gir
                </button>
              </div>
            </div>

            {/* Gerçek değerler — form submit'inde gider */}
            <input type="hidden" name="treatment_name" value={treatmentName} />
            <input type="hidden" name="treatment_catalog_id" value={selectedCatalogId} />

            {treatmentMode === 'catalog' ? (
              <div className="relative">
                <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1">İşlem Ara *</label>
                {selectedCatalogId ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                    <span className="text-violet-300 text-sm font-semibold">{treatmentName}</span>
                    {(() => {
                      const item = catalog.find(c => c.id === selectedCatalogId)
                      if (!item) return null
                      return (
                        <>
                          {item.category && <span className="text-sm text-slate-500">· {item.category}</span>}
                          {item.default_unit && <span className="text-sm text-slate-500">· {item.default_unit}</span>}
                          {item.egp_linked && <span className="text-sm text-amber-300 font-semibold">EGP</span>}
                        </>
                      )
                    })()}
                    <button type="button" onClick={clearCatalogPick}
                      className="ml-auto text-slate-500 hover:text-white text-base font-semibold">Değiştir</button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={treatmentSearch}
                      onChange={e => setTreatmentSearch(e.target.value)}
                      onFocus={() => setTreatmentFocused(true)}
                      onBlur={() => setTimeout(() => setTreatmentFocused(false), 150)}
                      placeholder="Botoks, dolgu, lazer… (katalogtan ara)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500"
                    />
                    {treatmentFocused && (
                      <div className="absolute z-20 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-xl">
                        {filteredCatalog.length === 0 ? (
                          <div className="px-3 py-3 text-sm text-slate-500">
                            Eşleşme yok.
                            <button type="button"
                              onMouseDown={(e) => { e.preventDefault(); setTreatmentMode('custom'); setTreatmentName(treatmentSearch); setSelectedCatalogId('') }}
                              className="ml-2 text-violet-400 hover:text-violet-300 font-medium">
                              &quot;{treatmentSearch}&quot; özel ad olarak kullan →
                            </button>
                          </div>
                        ) : (
                          filteredCatalog.map(c => (
                            <button key={c.id} type="button"
                              onMouseDown={(e) => { e.preventDefault(); pickCatalogItem(c) }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors flex items-center gap-2 border-b border-slate-800 last:border-b-0">
                              <span className="text-sm text-white font-semibold flex-1 truncate">{c.name}</span>
                              {c.category && <span className="text-sm text-slate-500">{c.category}</span>}
                              {c.default_unit && <span className="text-sm text-slate-600">{c.default_unit}</span>}
                              {c.egp_linked && <span className="text-sm text-amber-300 font-semibold">EGP</span>}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1">İşlem Adı * <span className="text-slate-600 normal-case">(özel)</span></label>
                <input
                  type="text"
                  value={treatmentName}
                  onChange={e => setTreatmentName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="Örn. Botoks 30 ünite — özel açıklama"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div>
                <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1">Ücret (₺)</label>
                <input name="treatment_amount" type="number" step="0.01" min="0" defaultValue="0"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1">İşlem Tarihi</label>
                <input name="treatment_date" type="date" defaultValue={prefill?.treatmentDate ?? new Date().toISOString().slice(0,10)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1">Not</label>
                <input name="treatment_notes" maxLength={300} placeholder="Opsiyonel…"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500" />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700/50" />

          {/* ── Kullanılan Ürünler (opsiyonel) ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm uppercase tracking-widest text-slate-500 font-bold">
                Kullanılan Ürünler <span className="text-slate-600">(opsiyonel)</span>
              </p>
              <button type="button" onClick={addProductRow}
                className="text-base text-violet-400 hover:text-violet-300 font-medium transition-colors">
                + Ürün Ekle
              </button>
            </div>
            <input type="hidden" name="product_count" value={productRows.length} />
            {productRows.length === 0 ? (
              <p className="text-sm text-slate-600 italic">Ürün eklenmedi — işlem için gerekli değil.</p>
            ) : (
              <div className="space-y-1.5">
                {productRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                    <input
                      name={`product_name_${i}`}
                      value={row.name}
                      onChange={e => updateProductRow(i, 'name', e.target.value)}
                      placeholder="Ürün adı *"
                      required
                      minLength={2}
                      maxLength={120}
                      className="col-span-5 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500"
                    />
                    <input
                      name={`product_qty_${i}`}
                      value={row.qty}
                      onChange={e => updateProductRow(i, 'qty', e.target.value)}
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="Miktar"
                      className="col-span-3 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500"
                    />
                    <input
                      name={`product_unit_${i}`}
                      value={row.unit}
                      onChange={e => updateProductRow(i, 'unit', e.target.value)}
                      placeholder="Birim (ml…)"
                      maxLength={20}
                      className="col-span-3 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500"
                    />
                    <button type="button" onClick={() => removeProductRow(i)}
                      className="col-span-1 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-700/50" />

          {/* ── Tahsilat (opsiyonel) ── */}
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-widest text-slate-500 font-bold">Tahsilat <span className="text-slate-600">(opsiyonel — boş bırakırsan sadece işlem eklenir)</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1">Tahsilat (₺)</label>
                <input name="payment_amount" type="number" step="0.01" min="0" defaultValue="0"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1">Ödeme Tarihi</label>
                <input name="payment_date" type="date" defaultValue={new Date().toISOString().slice(0,10)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-widest text-slate-500 mb-1">Yöntem</label>
                <select name="payment_method"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500">
                  <option value="">—</option>
                  <option value="Nakit">Nakit</option>
                  <option value="Kredi Kartı">Kredi Kartı</option>
                  <option value="Havale/EFT">Havale/EFT</option>
                  <option value="IBAN">IBAN</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
            </div>
          </div>

          {quickError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {quickError}
            </div>
          )}
          {quickSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
              ✓ Kayıt başarıyla eklendi!
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={() => { setShowQuick(false); setQuickError(null) }}
              className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors">
              Vazgeç
            </button>
            <button type="submit" disabled={pending}
              className="px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white text-base font-bold rounded-xl transition-all">
              {pending ? 'Kaydediliyor…' : '⚡ Kaydet'}
            </button>
          </div>
        </form>
      )}

      {/* Aylık yekün banner — her zaman görünür */}
      <div className="mb-5 rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border border-violet-500/30 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm uppercase tracking-widest text-violet-300/80 font-bold">Bu Ay</p>
            <p className="text-white font-black text-lg sm:text-xl capitalize">{monthLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-sm uppercase tracking-widest text-slate-400">Net</p>
            <p className={`font-black text-lg sm:text-xl ${monthRemaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {monthRemaining > 0 ? '−' : '+'}{formatTRY(Math.abs(monthRemaining))}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <MiniStat label="Faturalanan" value={formatTRY(monthBilled)} tone="neutral" />
          <MiniStat label="Tahsil Edilen" value={formatTRY(monthCollected)} tone="positive" />
          <MiniStat
            label="Bu Ay Bekleyen"
            value={formatTRY(Math.max(0, monthRemaining))}
            tone={monthRemaining > 0 ? 'warning' : 'positive'}
          />
        </div>
      </div>

      {/* Genel toplam mini özet */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5 text-sm">
        <SoftCard label="Toplam Hasta" value={patientCount.toString()} />
        <SoftCard
          label={debtorCount > 0 ? `Borçlu Hasta (${debtorCount})` : 'Borçlu Hasta'}
          value={debtorCount.toString()}
          highlight={debtorCount > 0 ? 'amber' : undefined}
        />
        <SoftCard
          label="Tüm Zaman Kalan"
          value={formatTRY(totalRemaining)}
          highlight={totalRemaining > 0 ? 'amber' : undefined}
        />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 border-b border-slate-800">
        <TabButton active={tab === 'gunluk'} onClick={() => setTab('gunluk')}>
          Günlük Hareket
        </TabButton>
        <TabButton active={tab === 'hastalar'} onClick={() => setTab('hastalar')}>
          Hastalar ({rows.length})
        </TabButton>
      </div>

      {tab === 'gunluk' && <DailyTimeline days={days} />}
      {tab === 'hastalar' && <MuhasebeListClient initialRows={rows} />}
    </>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
        active ? 'text-white border-violet-500' : 'text-slate-500 hover:text-slate-300 border-transparent'
      }`}
    >
      {children}
    </button>
  )
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: 'neutral' | 'positive' | 'warning' }) {
  const colors =
    tone === 'positive' ? 'text-emerald-300' :
    tone === 'warning' ? 'text-amber-300' :
    'text-slate-200'
  return (
    <div className="rounded-lg bg-slate-900/50 border border-slate-700/60 px-3 py-2">
      <p className="text-sm uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`text-base font-black mt-0.5 ${colors}`}>{value}</p>
    </div>
  )
}

function SoftCard({ label, value, highlight }: { label: string; value: string; highlight?: 'amber' | 'emerald' }) {
  const c =
    highlight === 'amber' ? 'border-amber-500/30 text-amber-300' :
    highlight === 'emerald' ? 'border-emerald-500/30 text-emerald-300' :
    'border-slate-700/60 text-slate-300'
  return (
    <div className={`rounded-lg border ${c} bg-slate-800/30 px-3 py-2`}>
      <p className="text-sm uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
    </div>
  )
}

function DailyTimeline({ days }: { days: DayGroup[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(days.length > 0 ? [days[0].date] : []))
  function toggle(d: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d); else next.add(d)
      return next
    })
  }

  if (days.length === 0) {
    return (
      <div className="p-12 rounded-xl border border-slate-700/50 border-dashed text-center text-slate-500 text-sm">
        Son 90 günde hareket yok. <span className="text-violet-400">Hastalar</span> sekmesinden hasta ekleyerek başla.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {days.map(d => {
        const isOpen = expanded.has(d.date)
        const totalCount = d.treatments.length + d.payments.length
        const net = d.collected - d.billed
        return (
          <div key={d.date} className="rounded-xl bg-slate-800/40 border border-slate-700/60 overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(d.date)}
              className="w-full flex items-center gap-3 p-3 sm:p-4 text-left hover:bg-slate-800/60 transition-colors"
            >
              <svg className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{formatDayLabel(d.date)}</p>
                <p className="text-slate-500 text-sm capitalize">
                  {totalCount} hareket
                  {d.treatments.length > 0 && <span> · {d.treatments.length} işlem</span>}
                  {d.payments.length > 0 && <span> · {d.payments.length} tahsilat</span>}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-2 text-sm">
                  {d.billed > 0 && <span className="text-slate-300">+{formatTRY(d.billed)}</span>}
                  {d.collected > 0 && <span className="text-emerald-400 font-bold">{formatTRY(d.collected)} ✓</span>}
                </div>
                {(d.billed > 0 || d.collected > 0) && (
                  <p className={`text-sm mt-0.5 ${net >= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    Net {net >= 0 ? '+' : '−'}{formatTRY(Math.abs(net))}
                  </p>
                )}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-slate-700/40 bg-slate-900/40 divide-y divide-slate-800/60">
                {d.treatments.length > 0 && (
                  <div className="p-3">
                    <p className="text-sm uppercase tracking-widest text-slate-500 mb-2">İşlemler</p>
                    <div className="space-y-1">
                      {d.treatments.map(t => (
                        <Link
                          key={t.id}
                          href={`/klinik/panel/muhasebe/${t.patient_id}`}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800/60 text-base transition-colors font-semibold"
                        >
                          <span className="text-violet-300 font-medium truncate">{t.patient_name}</span>
                          <span className="text-slate-500 truncate">— {t.name}</span>
                          <span className="ml-auto text-slate-200 font-bold shrink-0">{formatTRY(t.amount)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {d.payments.length > 0 && (
                  <div className="p-3">
                    <p className="text-sm uppercase tracking-widest text-slate-500 mb-2">Tahsilatlar</p>
                    <div className="space-y-1">
                      {d.payments.map(p => (
                        <Link
                          key={p.id}
                          href={`/klinik/panel/muhasebe/${p.patient_id}`}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800/60 text-base transition-colors font-semibold"
                        >
                          <span className="text-emerald-300 font-medium truncate">{p.patient_name}</span>
                          {p.method && <span className="text-slate-600 truncate">— {p.method}</span>}
                          <span className="ml-auto text-emerald-400 font-bold shrink-0">{formatTRY(p.amount)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
