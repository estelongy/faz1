'use client'

import { useState, useTransition } from 'react'
import { saveShippingSettingsAction } from './actions'

interface ExistingSettings {
  sender_name: string
  sender_phone: string
  sender_email: string | null
  sender_address_line: string
  sender_district: string
  sender_city: string
  sender_postal_code: string | null
  default_carrier: string
  preferred_carriers: string[]
  free_shipping_threshold: number | string | null
  note: string | null
}

interface Props {
  carriers: string[]
  companyName: string
  companyAddress: string
  existing: ExistingSettings | null
}

export default function KargoAyarForm({ carriers, companyName, companyAddress, existing }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [senderName, setSenderName] = useState(existing?.sender_name ?? companyName)
  const [senderPhone, setSenderPhone] = useState(existing?.sender_phone ?? '')
  const [senderEmail, setSenderEmail] = useState(existing?.sender_email ?? '')
  const [addressLine, setAddressLine] = useState(existing?.sender_address_line ?? companyAddress)
  const [district, setDistrict] = useState(existing?.sender_district ?? '')
  const [city, setCity] = useState(existing?.sender_city ?? '')
  const [postal, setPostal] = useState(existing?.sender_postal_code ?? '')
  const [defaultCarrier, setDefaultCarrier] = useState(existing?.default_carrier ?? 'Yurtiçi Kargo')
  const [preferred, setPreferred] = useState<string[]>(
    existing?.preferred_carriers ?? ['Yurtiçi Kargo', 'Aras Kargo', 'MNG Kargo'],
  )
  const [freeShipping, setFreeShipping] = useState(
    existing?.free_shipping_threshold ? String(existing.free_shipping_threshold) : '',
  )
  const [note, setNote] = useState(existing?.note ?? '')

  function togglePref(c: string) {
    setPreferred(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])
  }

  function submit() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const threshold = freeShipping ? Number(freeShipping) : null
      const res = await saveShippingSettingsAction({
        sender_name: senderName,
        sender_phone: senderPhone,
        sender_email: senderEmail,
        sender_address_line: addressLine,
        sender_district: district,
        sender_city: city,
        sender_postal_code: postal,
        default_carrier: defaultCarrier,
        preferred_carriers: preferred,
        free_shipping_threshold: threshold !== null && Number.isFinite(threshold) ? threshold : null,
        note,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3500)
    })
  }

  const label = "block text-slate-300 text-sm font-semibold mb-1"
  const input = "w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-base focus:outline-none focus:border-[#C9A961] placeholder-slate-500"

  return (
    <div className="space-y-5">
      {/* Gönderici */}
      <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-2xl space-y-4">
        <h2 className="text-white font-bold text-base">📍 Gönderici Bilgileri</h2>
        <p className="text-slate-400 text-sm">Kargo etiketinde &quot;Gönderici&quot; alanında görünecek bilgiler.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={label}>Gönderici Adı / Şirket *</label>
            <input className={input} value={senderName} onChange={e => setSenderName(e.target.value)} />
          </div>
          <div>
            <label className={label}>Telefon *</label>
            <input className={input} value={senderPhone} onChange={e => setSenderPhone(e.target.value)} placeholder="+90 5XX XXX XXXX" />
          </div>
        </div>

        <div>
          <label className={label}>E-posta *</label>
          <input type="email" className={input} value={senderEmail} onChange={e => setSenderEmail(e.target.value)} placeholder="iletisim@..." />
          <p className="text-slate-500 text-sm mt-1">İade kargosu ve kargo şirketi etiket bildirimi için kullanılır.</p>
        </div>

        <div>
          <label className={label}>Adres *</label>
          <textarea className={input + ' resize-none'} rows={2} value={addressLine} onChange={e => setAddressLine(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={label}>İlçe *</label>
            <input className={input} value={district} onChange={e => setDistrict(e.target.value)} />
          </div>
          <div>
            <label className={label}>İl *</label>
            <input className={input} value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div>
            <label className={label}>Posta Kodu *</label>
            <input className={input} value={postal} onChange={e => setPostal(e.target.value)} placeholder="34000" inputMode="numeric" maxLength={5} />
          </div>
        </div>
      </div>

      {/* Kargo Tercihleri */}
      <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-2xl space-y-4">
        <h2 className="text-white font-bold text-base">🚚 Kargo Şirketi Tercihleri</h2>

        <div>
          <label className={label}>Varsayılan Kargo Şirketi</label>
          <select className={input} value={defaultCarrier} onChange={e => setDefaultCarrier(e.target.value)}>
            {carriers.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <p className="text-slate-500 text-sm mt-1">Yeni sipariş için ilk seçili olan kargo şirketi.</p>
        </div>

        <div>
          <label className={label}>Tercih Edilen Kargo Şirketleri</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {carriers.map(c => {
              const active = preferred.includes(c)
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => togglePref(c)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                    active
                      ? 'bg-[#C9A961] border-[#C9A961] text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-[#C9A961]/50'
                  }`}
                >
                  {active && '✓ '}{c}
                </button>
              )
            })}
          </div>
          <p className="text-slate-500 text-sm mt-2">Kargo girerken bu listeden seçim yapacaksın.</p>
        </div>
      </div>

      {/* Ekstralar */}
      <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-2xl space-y-4">
        <h2 className="text-white font-bold text-base">⚙️ Ekstra</h2>

        <div>
          <label className={label}>Ücretsiz Kargo Eşiği (₺)</label>
          <input type="number" className={input} value={freeShipping} onChange={e => setFreeShipping(e.target.value)} placeholder="0 — boş bırakırsan ücretsiz kargo yok" />
          <p className="text-slate-500 text-sm mt-1">Müşteri sepeti bu tutarı geçerse kargo ücretsiz görünür.</p>
        </div>

        <div>
          <label className={label}>Etikete Yazılacak Not</label>
          <textarea className={input + ' resize-none'} rows={2} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Kırılgan / Dik tut / Düşürmeyin gibi" />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-semibold">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold">
          ✓ Kargo ayarların kaydedildi. Artık tek tıkla etiket üretebilirsin.
        </div>
      )}

      <button
        onClick={submit}
        disabled={pending}
        className="w-full py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:from-[#D4B872] hover:to-[#C9A961] disabled:opacity-50 text-white font-bold rounded-xl text-base transition-all"
      >
        {pending ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
      </button>
    </div>
  )
}
