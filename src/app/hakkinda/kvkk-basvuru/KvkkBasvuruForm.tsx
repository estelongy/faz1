'use client'

import { useState } from 'react'

const REQUEST_TYPES = [
  { id: 'access',       label: 'Verilerime erişim / kopya talep ediyorum (taşınabilirlik)' },
  { id: 'rectify',      label: 'Eksik/yanlış verilerimin düzeltilmesini istiyorum' },
  { id: 'erasure',      label: 'Verilerimin silinmesini istiyorum (unutulma hakkı)' },
  { id: 'restrict',     label: 'İşlemenin sınırlandırılmasını talep ediyorum' },
  { id: 'object',       label: 'Otomatik karar/profil oluşturmaya itiraz ediyorum' },
  { id: 'withdraw',     label: 'Açık rızamı geri çekiyorum (selfie/pazarlama vb.)' },
  { id: 'info',         label: 'Kişisel verilerimin işlenip işlenmediği hakkında bilgi istiyorum' },
] as const

export default function KvkkBasvuruForm() {
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function buildMailto(formData: FormData): string {
    const name = String(formData.get('name') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    const tckn = String(formData.get('tckn') ?? '').trim()
    const phone = String(formData.get('phone') ?? '').trim()
    const types = formData.getAll('type') as string[]
    const detail = String(formData.get('detail') ?? '').trim()
    const channel = String(formData.get('channel') ?? '').trim()

    const subject = `KVKK Madde 11 Başvurusu — ${name || 'İsimsiz'}`
    const typeLabels = types
      .map(t => REQUEST_TYPES.find(rt => rt.id === t)?.label ?? t)
      .map(l => `  • ${l}`)
      .join('\n')

    const body = [
      'KVKK m.11 kapsamında aşağıdaki haklarımı kullanmak üzere başvuruda bulunuyorum:',
      '',
      typeLabels || '  (talep türü seçilmedi)',
      '',
      '--- BAŞVURU SAHİBİ ---',
      `Ad Soyad: ${name}`,
      `E-posta:  ${email}`,
      `Telefon:  ${phone || '—'}`,
      `TCKN:     ${tckn || '—'}`,
      `Yanıt kanalı tercihi: ${channel || 'e-posta'}`,
      '',
      '--- TALEP DETAYI ---',
      detail || '(detay belirtilmedi)',
      '',
      '--- BEYAN ---',
      'Yukarıda verdiğim bilgilerin doğru olduğunu, kimliğimi doğrulamak için gereken evrakı talep edilmesi',
      'halinde sunacağımı, taleplerimin değerlendirilmesi için kişisel verilerimin bu başvuru sürecinde',
      'işlenmesine onay verdiğimi beyan ederim.',
    ].join('\n')

    const params = new URLSearchParams({
      subject,
      body,
    })
    return `mailto:kvkk@estelongy.com?${params.toString()}`
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const types = formData.getAll('type')
    if (types.length === 0) {
      setError('Lütfen en az bir talep türü seçin.')
      setSubmitting(false)
      return
    }
    if (!formData.get('name') || !formData.get('email')) {
      setError('Ad soyad ve e-posta zorunludur.')
      setSubmitting(false)
      return
    }

    const url = buildMailto(formData)
    // Yeni sekme — kullanıcının mail istemcisi açılır, gönder butonu kendisinin
    window.location.href = url
    setSent(true)
    setSubmitting(false)
  }

  if (sent) {
    return (
      <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm">
        <p className="font-semibold mb-1">E-posta istemcisi açıldı</p>
        <p className="text-emerald-300/80">
          Mail uygulamanız açıldı; başvuru içeriği doldurulmuş olarak hazır. Lütfen{' '}
          <strong>Gönder</strong> butonuna basarak başvurunuzu tamamlayın. Başvurunuz alındığında 30 gün içinde
          dönüş yapılır.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 text-emerald-300 hover:text-emerald-200 underline text-sm"
        >
          Yeni başvuru yap
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-slate-300 text-sm font-semibold mb-2">Talep türü (birden fazla seçilebilir)</label>
        <div className="space-y-2">
          {REQUEST_TYPES.map(rt => (
            <label key={rt.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors">
              <input
                type="checkbox"
                name="type"
                value={rt.id}
                className="mt-0.5 w-4 h-4 rounded accent-violet-600 shrink-0"
              />
              <span className="text-sm text-slate-300">{rt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field name="name"  label="Ad Soyad *" placeholder="Adınız Soyadınız" required />
        <Field name="email" label="E-posta *"  type="email" placeholder="ornek@mail.com" required />
        <Field name="phone" label="Telefon"    placeholder="+90 5xx xxx xx xx" />
        <Field name="tckn"  label="TCKN"       placeholder="11 haneli (kimlik doğrulama)" maxLength={11} />
      </div>

      <div>
        <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor="channel">Tercih ettiğiniz yanıt kanalı</label>
        <select
          id="channel"
          name="channel"
          defaultValue="email"
          className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
        >
          <option value="email">E-posta</option>
          <option value="phone">Telefon</option>
          <option value="post">Yazılı posta (KVKK m.13)</option>
        </select>
      </div>

      <div>
        <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor="detail">Talep detayı</label>
        <textarea
          id="detail"
          name="detail"
          rows={5}
          placeholder="Talebinizi serbest metin olarak açıklayın. Örnek: 'Hesabımdaki tüm selfie fotoğraflarımın silinmesini talep ediyorum.'"
          className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-y"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm" role="alert">{error}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold transition-colors"
        >
          {submitting ? 'Hazırlanıyor…' : 'E-posta istemcisinde aç'}
        </button>
      </div>

      <p className="text-sm text-slate-500">
        * Bu form, başvuru içeriğini hazırlayıp mail uygulamanızda açar. Gönder butonuna sizin basmanız gerekir —
        bu sayede yasal başvurunuz sizden çıkmış sayılır.
      </p>
    </form>
  )
}

function Field({
  name, label, type = 'text', placeholder, required, maxLength,
}: {
  name: string
  label: string
  type?: string
  placeholder?: string
  required?: boolean
  maxLength?: number
}) {
  return (
    <div>
      <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
      />
    </div>
  )
}
