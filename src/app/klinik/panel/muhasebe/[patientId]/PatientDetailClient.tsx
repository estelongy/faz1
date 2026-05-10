'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  addTreatment, deleteTreatment,
  addProduct, deleteProduct,
  addPayment, deletePayment,
} from '../actions'

interface Product {
  id: string
  name: string
  quantity: number
  unit: string | null
  notes: string | null
}
interface Treatment {
  id: string
  name: string
  treatment_date: string
  amount: number
  notes: string | null
  products: Product[]
}
interface Payment {
  id: string
  amount: number
  paid_at: string
  method: string | null
  notes: string | null
  treatment_id: string | null
}

interface Props {
  patientId: string
  treatments: Treatment[]
  payments: Payment[]
}

function formatTRY(n: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)
}
function formatDate(s: string): string {
  return new Date(s).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function PatientDetailClient({ patientId, treatments, payments }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'islem' | 'tahsilat'>('islem')

  // Form açma state'leri
  const [showTreatmentForm, setShowTreatmentForm] = useState(false)
  const [productFormFor, setProductFormFor] = useState<string | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [expandedTreatment, setExpandedTreatment] = useState<string | null>(null)

  function refresh() { router.refresh() }

  async function handleAddTreatment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const form = e.currentTarget
    startTransition(async () => {
      const res = await addTreatment(patientId, fd)
      if (res.ok) { form.reset(); setShowTreatmentForm(false); refresh() }
      else setError(res.error)
    })
  }

  function handleDeleteTreatment(id: string, name: string) {
    if (!confirm(`"${name}" işlemini silmek istediğinden emin misin? Bağlı ürünler de silinecek.`)) return
    startTransition(async () => {
      const res = await deleteTreatment(id, patientId)
      if (res.ok) refresh(); else setError(res.error)
    })
  }

  async function handleAddProduct(e: React.FormEvent<HTMLFormElement>, treatmentId: string) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const form = e.currentTarget
    startTransition(async () => {
      const res = await addProduct(treatmentId, patientId, fd)
      if (res.ok) { form.reset(); setProductFormFor(null); refresh() }
      else setError(res.error)
    })
  }

  function handleDeleteProduct(id: string) {
    if (!confirm('Bu ürün kaydını silmek istediğinden emin misin?')) return
    startTransition(async () => {
      const res = await deleteProduct(id, patientId)
      if (res.ok) refresh(); else setError(res.error)
    })
  }

  async function handleAddPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const form = e.currentTarget
    startTransition(async () => {
      const res = await addPayment(patientId, fd)
      if (res.ok) { form.reset(); setShowPaymentForm(false); refresh() }
      else setError(res.error)
    })
  }

  function handleDeletePayment(id: string) {
    if (!confirm('Bu tahsilat kaydını silmek istediğinden emin misin?')) return
    startTransition(async () => {
      const res = await deletePayment(id, patientId)
      if (res.ok) refresh(); else setError(res.error)
    })
  }

  return (
    <div>
      {/* Tab switch */}
      <div className="flex gap-1 mb-4 border-b border-slate-800">
        <button
          type="button"
          onClick={() => setTab('islem')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'islem' ? 'text-white border-violet-500' : 'text-slate-500 hover:text-slate-300 border-transparent'
          }`}
        >
          İşlemler & Ürünler ({treatments.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('tahsilat')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'tahsilat' ? 'text-white border-violet-500' : 'text-slate-500 hover:text-slate-300 border-transparent'
          }`}
        >
          Tahsilatlar ({payments.length})
        </button>
      </div>

      {error && (
        <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {error}
        </div>
      )}

      {tab === 'islem' && (
        <div>
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={() => setShowTreatmentForm(s => !s)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              {showTreatmentForm ? 'Vazgeç' : 'Yeni İşlem'}
            </button>
          </div>

          {showTreatmentForm && (
            <form onSubmit={handleAddTreatment} className="mb-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">İşlem Adı *</label>
                  <input name="name" required minLength={2} maxLength={120} autoFocus
                    placeholder="Örn. Botoks 30 ünite"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Tarih</label>
                  <input name="treatment_date" type="date" defaultValue={new Date().toISOString().slice(0,10)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Ücret (TRY)</label>
                  <input name="amount" type="number" step="0.01" min="0" defaultValue="0"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Not</label>
                  <input name="notes" maxLength={300}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowTreatmentForm(false)} className="px-3 py-1.5 text-slate-400 hover:text-white text-sm transition-colors">Vazgeç</button>
                <button type="submit" disabled={pending} className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                  {pending ? 'Ekleniyor…' : 'Ekle'}
                </button>
              </div>
            </form>
          )}

          {treatments.length === 0 ? (
            <div className="p-8 rounded-xl border border-slate-700/50 border-dashed text-center text-slate-500 text-sm">
              Henüz işlem eklenmemiş.
            </div>
          ) : (
            <div className="space-y-2">
              {treatments.map(t => {
                const expanded = expandedTreatment === t.id
                return (
                  <div key={t.id} className="rounded-xl bg-slate-800/40 border border-slate-700/60 overflow-hidden">
                    <div className="flex items-center gap-3 p-3">
                      <button
                        type="button"
                        onClick={() => setExpandedTreatment(expanded ? null : t.id)}
                        className="flex-1 flex items-center gap-3 text-left min-w-0"
                      >
                        <svg className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{t.name}</p>
                          <p className="text-slate-500 text-xs">
                            {formatDate(t.treatment_date)}
                            {t.products.length > 0 && <span className="ml-2">· {t.products.length} ürün</span>}
                          </p>
                        </div>
                        <p className="text-emerald-300 font-black text-sm shrink-0">{formatTRY(t.amount)}</p>
                      </button>
                      <button type="button" onClick={() => handleDeleteTreatment(t.id, t.name)} disabled={pending}
                        className="p-1.5 text-slate-600 hover:text-red-400 transition-colors" title="İşlemi sil">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {expanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-700/40 bg-slate-900/40">
                        {t.notes && (
                          <p className="text-slate-400 text-xs italic mb-3">{t.notes}</p>
                        )}

                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] uppercase tracking-widest text-slate-500">Kullanılan Ürünler</p>
                          <button type="button" onClick={() => setProductFormFor(productFormFor === t.id ? null : t.id)}
                            className="text-xs text-violet-400 hover:text-violet-300 font-medium">
                            {productFormFor === t.id ? 'Vazgeç' : '+ Ürün Ekle'}
                          </button>
                        </div>

                        {productFormFor === t.id && (
                          <form onSubmit={e => handleAddProduct(e, t.id)} className="mb-3 p-3 rounded-lg bg-slate-900/60 border border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <input name="name" required minLength={2} maxLength={120} placeholder="Ürün adı *" autoFocus
                              className="col-span-2 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 text-xs focus:outline-none focus:border-violet-500" />
                            <input name="quantity" type="number" step="0.001" min="0" defaultValue="1" placeholder="Miktar"
                              className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 text-xs focus:outline-none focus:border-violet-500" />
                            <input name="unit" maxLength={20} placeholder="Birim (ml, ad)"
                              className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 text-xs focus:outline-none focus:border-violet-500" />
                            <input name="notes" maxLength={200} placeholder="Not (ops.)"
                              className="col-span-3 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 text-xs focus:outline-none focus:border-violet-500" />
                            <button type="submit" disabled={pending} className="px-2 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors">
                              Ekle
                            </button>
                          </form>
                        )}

                        {t.products.length === 0 ? (
                          <p className="text-slate-600 text-xs italic">Bu işlemde ürün kaydı yok.</p>
                        ) : (
                          <div className="space-y-1">
                            {t.products.map(p => (
                              <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-slate-800/40 text-xs">
                                <span className="text-white font-medium">{p.name}</span>
                                <span className="text-slate-500">— {p.quantity}{p.unit ? ` ${p.unit}` : ''}</span>
                                {p.notes && <span className="text-slate-600 italic truncate">· {p.notes}</span>}
                                <button type="button" onClick={() => handleDeleteProduct(p.id)} disabled={pending}
                                  className="ml-auto text-slate-600 hover:text-red-400 transition-colors shrink-0" title="Sil">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'tahsilat' && (
        <div>
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={() => setShowPaymentForm(s => !s)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              {showPaymentForm ? 'Vazgeç' : 'Yeni Tahsilat'}
            </button>
          </div>

          {showPaymentForm && (
            <form onSubmit={handleAddPayment} className="mb-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Tutar (TRY) *</label>
                  <input name="amount" type="number" step="0.01" min="0.01" required autoFocus
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Tarih</label>
                  <input name="paid_at" type="date" defaultValue={new Date().toISOString().slice(0,10)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Yöntem</label>
                  <select name="method" className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500">
                    <option value="">—</option>
                    <option value="Nakit">Nakit</option>
                    <option value="Kredi Kartı">Kredi Kartı</option>
                    <option value="Havale/EFT">Havale/EFT</option>
                    <option value="IBAN">IBAN</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">İşleme Bağla (ops.)</label>
                  <select name="treatment_id" className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500">
                    <option value="">—</option>
                    {treatments.map(t => (
                      <option key={t.id} value={t.id}>{t.name} — {formatDate(t.treatment_date)} ({formatTRY(t.amount)})</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Not</label>
                  <input name="notes" maxLength={300}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowPaymentForm(false)} className="px-3 py-1.5 text-slate-400 hover:text-white text-sm transition-colors">Vazgeç</button>
                <button type="submit" disabled={pending} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                  {pending ? 'Ekleniyor…' : 'Tahsilat Ekle'}
                </button>
              </div>
            </form>
          )}

          {payments.length === 0 ? (
            <div className="p-8 rounded-xl border border-slate-700/50 border-dashed text-center text-slate-500 text-sm">
              Henüz tahsilat kaydı yok.
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map(p => {
                const linkedT = p.treatment_id ? treatments.find(t => t.id === p.treatment_id) : null
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">{formatTRY(p.amount)}</p>
                      <p className="text-slate-500 text-xs">
                        {formatDate(p.paid_at)}
                        {p.method && <span className="ml-2">· {p.method}</span>}
                        {linkedT && <span className="ml-2 text-violet-400">· {linkedT.name}</span>}
                      </p>
                      {p.notes && <p className="text-slate-600 text-xs italic mt-0.5">{p.notes}</p>}
                    </div>
                    <button type="button" onClick={() => handleDeletePayment(p.id)} disabled={pending}
                      className="p-1.5 text-slate-600 hover:text-red-400 transition-colors" title="Sil">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
