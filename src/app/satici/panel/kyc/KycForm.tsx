'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { submitKycAction } from './actions'

interface Props {
  vendorId: string
  initial: {
    taxNumber: string | null
    tradeRegistryNo: string | null
    mersisNo: string | null
    kepAddress: string | null
    companyAddress: string | null
    sellsMedicalProducts: boolean | null
    iban: string | null
    ibanHolderName: string | null
    bankName: string | null
    taxCertificatePath: string | null
    contractSignedPath: string | null
    itsCertificatePath: string | null
  }
}

interface UploadedDoc {
  path: string
  name: string
  size: number
}

const MAX_DOC_MB = 10
const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export default function KycForm({ vendorId, initial }: Props) {
  const router = useRouter()
  const supabase = createClient()

  // Form state
  const [taxNumber, setTaxNumber] = useState(initial.taxNumber ?? '')
  const [tradeRegistryNo, setTradeRegistryNo] = useState(initial.tradeRegistryNo ?? '')
  const [mersisNo, setMersisNo] = useState(initial.mersisNo ?? '')
  const [kepAddress, setKepAddress] = useState(initial.kepAddress ?? '')
  const [companyAddress, setCompanyAddress] = useState(initial.companyAddress ?? '')
  const [sellsMedicalProducts, setSellsMedicalProducts] = useState(initial.sellsMedicalProducts ?? false)
  const [iban, setIban] = useState(initial.iban ?? '')
  const [ibanHolderName, setIbanHolderName] = useState(initial.ibanHolderName ?? '')
  const [bankName, setBankName] = useState(initial.bankName ?? '')
  const [contractAccepted, setContractAccepted] = useState(false)

  // Upload state
  const [taxCert, setTaxCert] = useState<UploadedDoc | null>(
    initial.taxCertificatePath ? { path: initial.taxCertificatePath, name: 'Yüklenmiş belge', size: 0 } : null
  )
  const [contractDoc, setContractDoc] = useState<UploadedDoc | null>(
    initial.contractSignedPath ? { path: initial.contractSignedPath, name: 'Yüklenmiş belge', size: 0 } : null
  )
  const [itsCert, setItsCert] = useState<UploadedDoc | null>(
    initial.itsCertificatePath ? { path: initial.itsCertificatePath, name: 'Yüklenmiş belge', size: 0 } : null
  )

  const [uploading, setUploading] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function formatIban(raw: string): string {
    const clean = raw.replace(/\s+/g, '').toUpperCase()
    return clean.match(/.{1,4}/g)?.join(' ') ?? clean
  }

  async function uploadDoc(slot: 'tax' | 'contract' | 'its', file: File) {
    setError(null)
    if (!ALLOWED_DOC_TYPES.includes(file.type)) {
      setError('Sadece JPG, PNG, WEBP veya PDF kabul edilir.')
      return
    }
    if (file.size > MAX_DOC_MB * 1024 * 1024) {
      setError(`Dosya en fazla ${MAX_DOC_MB} MB olabilir.`)
      return
    }
    setUploading(slot)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
    const path = `${vendorId}/${slot}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('vendor-kyc')
      .upload(path, file, { cacheControl: '3600', upsert: true })
    setUploading(null)
    if (upErr) {
      setError(`Yükleme başarısız: ${upErr.message}`)
      return
    }
    const doc: UploadedDoc = { path, name: file.name, size: file.size }
    if (slot === 'tax') setTaxCert(doc)
    else if (slot === 'contract') setContractDoc(doc)
    else setItsCert(doc)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!taxCert) { setError('Vergi levhası yüklemelisiniz.'); return }
    if (sellsMedicalProducts && !itsCert) { setError('Tıbbi ürün için ITS belgesi zorunludur.'); return }
    if (!contractAccepted) { setError('Pazaryeri sözleşmesini kabul etmelisiniz.'); return }

    setSubmitting(true)
    const res = await submitKycAction({
      taxNumber: taxNumber.trim(),
      tradeRegistryNo: tradeRegistryNo.trim(),
      mersisNo: mersisNo.trim(),
      kepAddress: kepAddress.trim(),
      companyAddress: companyAddress.trim(),
      sellsMedicalProducts,
      iban: iban.replace(/\s+/g, '').toUpperCase(),
      ibanHolderName: ibanHolderName.trim(),
      bankName: bankName.trim(),
      taxCertificatePath: taxCert.path,
      contractSignedPath: contractDoc?.path ?? null,
      itsCertificatePath: itsCert?.path ?? null,
      contractAccepted,
    })
    setSubmitting(false)
    if (!res.ok) {
      setError(res.error ?? 'Gönderilemedi')
      return
    }
    router.push('/satici/panel/kyc?ok=1')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── 1. Kurumsal Kimlik ── */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 space-y-4">
        <div>
          <h2 className="text-white font-bold text-base">Kurumsal Kimlik</h2>
          <p className="text-slate-400 text-sm">Vergi mükellefi bilgileriniz</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Vergi/T.C. Numarası *</label>
            <input type="text" required value={taxNumber} onChange={e => setTaxNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="10 veya 11 haneli" maxLength={11}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Ticaret Sicil No</label>
            <input type="text" value={tradeRegistryNo} onChange={e => setTradeRegistryNo(e.target.value)}
              placeholder="Opsiyonel"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">MERSIS No</label>
            <input type="text" value={mersisNo} onChange={e => setMersisNo(e.target.value.replace(/\D/g, '').slice(0, 16))}
              placeholder="Opsiyonel — 16 hane"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">KEP Adresi *</label>
            <input type="email" required value={kepAddress} onChange={e => setKepAddress(e.target.value)}
              placeholder="ornek@kep.tr"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Şirket Adresi *</label>
          <textarea required value={companyAddress} onChange={e => setCompanyAddress(e.target.value)}
            rows={2} placeholder="Vergi levhasındaki adres"
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm resize-none" />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" checked={sellsMedicalProducts} onChange={e => setSellsMedicalProducts(e.target.checked)}
            className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-violet-600 focus:ring-violet-500" />
          <span>Tıbbi ürün/cihaz satıyorum (ITS belgesi zorunlu olur)</span>
        </label>
      </section>

      {/* ── 2. Banka ── */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 space-y-4">
        <div>
          <h2 className="text-white font-bold text-base">Banka Bilgisi</h2>
          <p className="text-slate-400 text-sm">Komisyonlu kazançlarınız bu IBAN&apos;a aktarılır</p>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">IBAN *</label>
          <input type="text" required value={formatIban(iban)} onChange={e => setIban(e.target.value)}
            placeholder="TR00 0000 0000 0000 0000 0000 00" maxLength={32}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 font-mono text-sm" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Hesap Sahibi *</label>
            <input type="text" required value={ibanHolderName} onChange={e => setIbanHolderName(e.target.value)}
              placeholder="Şirket veya kişi adı"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Banka *</label>
            <input type="text" required value={bankName} onChange={e => setBankName(e.target.value)}
              placeholder="Garanti BBVA, Akbank, ..."
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm" />
          </div>
        </div>
      </section>

      {/* ── 3. Belgeler ── */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 space-y-4">
        <div>
          <h2 className="text-white font-bold text-base">Belgeler</h2>
          <p className="text-slate-400 text-sm">PDF veya görsel — maks. {MAX_DOC_MB} MB</p>
        </div>

        <DocSlot
          label="Vergi Levhası *"
          hint="Güncel yıla ait vergi levhası fotoğrafı/PDF'i"
          uploaded={taxCert}
          uploading={uploading === 'tax'}
          onPick={file => uploadDoc('tax', file)}
        />

        {sellsMedicalProducts && (
          <DocSlot
            label="ITS Belgesi *"
            hint="İlaç Takip Sistemi — sağlık/tıbbi ürün satışı için zorunlu"
            uploaded={itsCert}
            uploading={uploading === 'its'}
            onPick={file => uploadDoc('its', file)}
          />
        )}

        <DocSlot
          label="İmzalı Sözleşme (opsiyonel)"
          hint="Aşağıdaki sözleşmeyi yazıcıdan imzalayıp PDF olarak yükleyebilirsiniz — daha hızlı onay"
          uploaded={contractDoc}
          uploading={uploading === 'contract'}
          onPick={file => uploadDoc('contract', file)}
        />
      </section>

      {/* ── 4. Sözleşme ── */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 space-y-4">
        <div>
          <h2 className="text-white font-bold text-base">Pazaryeri Sözleşmesi</h2>
          <p className="text-slate-400 text-sm">E-onay yeterli — ancak ıslak imzalı versiyon yüklerseniz onay süreci hızlanır</p>
        </div>
        <div className="max-h-72 overflow-y-auto p-4 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 text-sm leading-relaxed space-y-3">
          <p><strong className="text-white">1. Taraflar.</strong> İşbu sözleşme Estelongy platformunu işleten Vestoriq OÜ (Estonya) ile iş ortağı arasında akdedilir.</p>
          <p><strong className="text-white">2. Konu.</strong> İş Ortağı, Estelongy platformu üzerinden ürünlerini Türkiye&apos;deki tüketicilere satmayı, platform da satışın gerçekleşmesi için altyapı sağlamayı kabul eder.</p>
          <p><strong className="text-white">3. Komisyon.</strong> Platform, her satıştan KDV hariç tutar üzerinden varsayılan %12 komisyon alır. Komisyon oranı kategoriye göre ürün listelemesinde belirtilir.</p>
          <p><strong className="text-white">4. Ödeme.</strong> İş Ortağı kazançları, sipariş teslimat onayından sonra 7 iş günü içinde IBAN&apos;a yatırılır.</p>
          <p><strong className="text-white">5. Belge yükümlülüğü.</strong> İş Ortağı her satış için yasal fatura kesmek ve müşteriye ulaştırmakla yükümlüdür. Estelongy bu yükümlülükten doğan vergi sorumluluğunu üstlenmez.</p>
          <p><strong className="text-white">6. İade ve iptal.</strong> 6502 sayılı Tüketicinin Korunması Hakkında Kanun uyarınca, tüketici 14 gün içinde cayma hakkını kullanabilir. İade kargo bedeli platform politikasına göre paylaşılır.</p>
          <p><strong className="text-white">7. Yasaklı ürünler.</strong> Reçeteli ilaç, kozmetik mevzuatına aykırı ürün, sahte/taklit, lisanssız tıbbi cihaz satışı yasaktır. İhlal halinde hesap askıya alınır ve mevzuata uygun makamlara bildirilir.</p>
          <p><strong className="text-white">8. KVKK.</strong> İş Ortağı, müşteri verilerini yalnızca sipariş teslimatı için kullanır. Pazarlama veya 3. tarafla paylaşım yasaktır. KVKK ihlali halinde Estelongy hesabı sonlandırma hakkını saklı tutar.</p>
          <p><strong className="text-white">9. Fesih.</strong> Taraflar 30 gün önceden bildirimle sözleşmeyi feshedebilir. Açık siparişler tamamlanır, bekleyen kazançlar IBAN&apos;a aktarılır.</p>
          <p><strong className="text-white">10. Uyuşmazlık.</strong> İhtilaflarda Tallinn (Estonya) mahkemeleri yetkilidir. İş Ortağı Türkiye&apos;de mukim ise Tüketici Hakem Heyeti / Tüketici Mahkemeleri istinaen.</p>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" required checked={contractAccepted} onChange={e => setContractAccepted(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded bg-slate-900 border-slate-600 text-violet-600 focus:ring-violet-500" />
          <span>Yukarıdaki sözleşmenin tüm maddelerini okudum, anladım ve kabul ediyorum.</span>
        </label>
      </section>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <button type="submit" disabled={submitting}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl transition-all">
        {submitting ? 'Gönderiliyor…' : 'KYC Bilgilerini Onaya Gönder'}
      </button>

      <p className="text-center text-slate-500 text-sm">
        Gönderdikten sonra admin incelemesi 1-2 iş günü sürer. Onay sonrası ürün satışına başlayabilirsiniz.
      </p>
    </form>
  )
}

function DocSlot({
  label, hint, uploaded, uploading, onPick,
}: {
  label: string
  hint: string
  uploaded: UploadedDoc | null
  uploading: boolean
  onPick: (file: File) => void
}) {
  return (
    <div>
      <label className="block text-sm text-white font-medium mb-1">{label}</label>
      <p className="text-slate-500 text-sm mb-2">{hint}</p>
      {uploaded ? (
        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="min-w-0">
              <p className="text-sm text-emerald-300 truncate">{uploaded.name}</p>
              {uploaded.size > 0 && (
                <p className="text-sm text-emerald-400/70">{(uploaded.size / 1024 / 1024).toFixed(1)} MB</p>
              )}
            </div>
          </div>
          <label className="text-sm text-emerald-300 hover:text-emerald-100 cursor-pointer underline shrink-0">
            Değiştir
            <input type="file" accept={ALLOWED_DOC_TYPES.join(',')} className="hidden"
              onChange={e => e.target.files?.[0] && onPick(e.target.files[0])} />
          </label>
        </div>
      ) : (
        <label className={`block p-4 rounded-lg border-2 border-dashed text-center cursor-pointer transition-colors ${
          uploading ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-slate-600 hover:border-slate-500 text-slate-400 hover:text-slate-300'
        }`}>
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              Yükleniyor…
            </div>
          ) : (
            <span className="text-sm">+ Dosya Seç</span>
          )}
          <input type="file" accept={ALLOWED_DOC_TYPES.join(',')} className="hidden" disabled={uploading}
            onChange={e => e.target.files?.[0] && onPick(e.target.files[0])} />
        </label>
      )}
    </div>
  )
}
