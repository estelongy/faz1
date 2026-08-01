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

export default function TekEkranKlinik({ role, patients, appointments, txs, catalog }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [day, setDay] = useState(todayIso())
  const [search, setSearch] = useState('')

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

  const patientAppts = useMemo(() => {
    if (!selectedId) return []
    const now = new Date().toISOString()
    return appointments
      .filter(a => a.patient_id === selectedId && a.status === 'scheduled' && a.start_at >= now)
      .sort((a, b) => a.start_at.localeCompare(b.start_at))
      .slice(0, 3)
  }, [appointments, selectedId])

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
  type FormKind = 'islem' | 'tahsilat' | 'randevu' | 'yeniHasta' | null
  const [openForm, setOpenForm] = useState<FormKind>(null)
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
  return (
    <div className="flex flex-col gap-4">
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

        {/* SOL — GÜN AKIŞI */}
        <div className={`space-y-2 ${mobilePanelOpen ? 'hidden lg:block' : ''}`}>
          {dayAppts.length === 0 && (
            <div className="text-center py-10 bg-slate-800/30 border border-dashed border-slate-700 rounded-xl">
              <p className="text-slate-400 text-sm">Bu gün için randevu yok.</p>
              <p className="text-slate-500 text-xs mt-1">Hasta ara → karnesinden randevu ver.</p>
            </div>
          )}
          {dayAppts.map(a => {
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
                  <span className="text-xs text-slate-400 truncate">{a.treatment_type ?? a.appointment_type ?? ''}</span>
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
                {(['islem', 'tahsilat', 'randevu'] as const).map(k => (
                  <button key={k}
                    onClick={() => { setOpenForm(openForm === k ? null : k); setFromApptId(null) }}
                    className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-colors ${openForm === k ? 'bg-violet-600 text-white' : 'bg-slate-700/60 text-slate-200 hover:bg-slate-600'}`}>
                    + {k === 'islem' ? 'İşlem' : k === 'tahsilat' ? 'Tahsilat' : 'Randevu'}
                  </button>
                ))}
                <Link href={`/klinik/panel/muhasebe/${selected.id}`} className="ml-auto px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white">
                  Tam geçmiş →
                </Link>
              </div>

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
                  <div className="grid sm:grid-cols-[120px,140px,1fr] gap-2">
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
                  <button type="submit" disabled={pending} className={btnPrimary}>{pending ? 'Kaydediliyor…' : 'Randevuyu Kaydet'}</button>
                </form>
              )}

              {/* Yaklaşan randevuları */}
              {patientAppts.length > 0 && (
                <div className="text-xs text-slate-400 space-y-1">
                  <p className="font-bold text-slate-300">Yaklaşan randevuları</p>
                  {patientAppts.map(a => (
                    <p key={a.id}>
                      {new Date(a.start_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                      {' '}{new Date(a.start_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}
                      {a.treatment_type ? ` — ${a.treatment_type}` : ''}
                    </p>
                  ))}
                </div>
              )}

              {/* Zaman çizgisi: işlem + tahsilat birleşik */}
              <div>
                <p className="text-sm font-bold text-slate-300 mb-2">Geçmiş</p>
                {patientTimeline.length === 0 && <p className="text-sm text-slate-500">Henüz kayıt yok.</p>}
                <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                  {patientTimeline.map(t => (
                    <div key={`${t.kind}-${t.id}`} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-900/40">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.kind === 'islem' ? 'bg-violet-400' : 'bg-emerald-400'}`} />
                        <span className="text-xs text-slate-500 tabular-nums shrink-0">
                          {new Date(t.date + 'T12:00:00').toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </span>
                        <span className="text-sm text-slate-200 truncate">{t.kind === 'tahsilat' ? `Tahsilat${t.label ? ` (${t.label})` : ''}` : t.label}</span>
                      </div>
                      <span className={`text-sm font-bold tabular-nums shrink-0 ${t.kind === 'islem' ? 'text-slate-200' : 'text-emerald-300'}`}>
                        {t.kind === 'tahsilat' ? '+' : ''}{TRY(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ALT ŞERİT — günün + ayın muhasebesi */}
      <div className="sticky bottom-0 -mx-1 px-1 pb-1">
        <div className="bg-slate-900/95 backdrop-blur border border-slate-700/60 rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span className="text-slate-400">{dayLabel(day)}:</span>
          <span className="text-white font-bold">{dayStats.islem.length} işlem</span>
          <span className="text-slate-200 font-bold">{TRY(dayStats.billed)} yazıldı</span>
          <span className="text-emerald-300 font-bold">{TRY(dayStats.collected)} tahsil</span>
          <span className="ml-auto text-slate-500 text-xs">
            {monthStats.label}: {TRY(monthStats.billed)} / <span className="text-emerald-400">{TRY(monthStats.collected)}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
