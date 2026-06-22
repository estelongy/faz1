'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useCart } from '@/lib/cart'
import AdresForm from '../panel/adreslerim/AdresForm'
import { isValidEmail, isValidTrMobile } from '@/lib/contact-validators'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Address {
  id: string
  title: string
  full_name: string
  phone: string
  city: string
  district: string
  neighborhood: string | null
  address_line: string
  postal_code: string | null
  is_default: boolean
}

type Step = 'address' | 'payment' | 'success'

export default function OdemeFlow({ initialAddresses, isGuest }: { initialAddresses: Address[]; isGuest: boolean }) {
  const router = useRouter()
  const { items, subtotal, clear, hydrated } = useCart()

  const [addresses] = useState<Address[]>(initialAddresses)
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(
    initialAddresses.find(a => a.is_default)?.id ?? initialAddresses[0]?.id ?? null
  )
  const [addingAddress, setAddingAddress] = useState(false)
  const [step, setStep] = useState<Step>('address')

  // Misafir akışı: ad/email/telefon + inline adres
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestCity, setGuestCity] = useState('')
  const [guestDistrict, setGuestDistrict] = useState('')
  const [guestAddressLine, setGuestAddressLine] = useState('')
  const [guestPostalCode, setGuestPostalCode] = useState('')

  const guestFormValid =
    guestName.trim().length >= 3 &&
    isValidEmail(guestEmail) &&
    isValidTrMobile(guestPhone) &&
    guestCity.trim().length >= 2 &&
    guestDistrict.trim().length >= 2 &&
    guestAddressLine.trim().length >= 10
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [guestToken, setGuestToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // KVKK + Mesafeli Satış onayı — yasal zorunluluk
  const [kvkkConsent, setKvkkConsent] = useState(false)
  const [mesafeliConsent, setMesafeliConsent] = useState(false)

  // Kupon state
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

  // Sepetten bekleyen kupon kodunu pre-fill et (varsa)
  useEffect(() => {
    try {
      const pending = window.localStorage.getItem('estelongy_pending_coupon')
      if (pending) {
        setCouponInput(pending)
        window.localStorage.removeItem('estelongy_pending_coupon')
      }
    } catch { /* noop */ }
  }, [])

  const empty = hydrated && items.length === 0

  // Kargo: ₺200 ve üstü ücretsiz, altı ₺29
  const FREE_SHIPPING_THRESHOLD = 200
  const SHIPPING_FEE = 29
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : (subtotal > 0 ? SHIPPING_FEE : 0)
  const remainingForFreeShip = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)

  const couponDiscount = appliedCoupon?.discount ?? 0
  const total = Math.max(0, subtotal + shippingFee - couponDiscount)

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setCouponLoading(true)
    setCouponError(null)
    try {
      const res = await fetch('/api/checkout/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      })
      const data = await res.json()
      if (!data.valid) {
        setCouponError(data.error ?? 'Geçersiz kupon')
        return
      }
      setAppliedCoupon({ code: data.code, discount: data.discount })
      setCouponInput('')
    } catch {
      setCouponError('Doğrulama hatası')
    } finally {
      setCouponLoading(false)
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null)
    setCouponError(null)
  }

  async function proceedToPayment() {
    if (isGuest) {
      if (!guestFormValid) {
        setError('Misafir bilgilerini eksiksiz ve doğru gir (ad, email, TR cep, şehir, ilçe, açık adres).')
        return
      }
    } else {
      if (!selectedAddrId) {
        setError('Lütfen bir adres seç')
        return
      }
    }
    if (!kvkkConsent || !mesafeliConsent) {
      setError('Devam edebilmek için KVKK ve Mesafeli Satış onaylarını işaretlemen gerekir.')
      return
    }
    if (items.length === 0) return
    setError(null)
    setLoading(true)

    const res = await fetch('/api/checkout/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        addressId: isGuest ? undefined : selectedAddrId,
        guest: isGuest ? {
          name:  guestName.trim(),
          email: guestEmail.trim().toLowerCase(),
          phone: guestPhone.trim(),
          address: {
            full_name:    guestName.trim(),
            phone:        guestPhone.trim(),
            city:         guestCity.trim(),
            district:     guestDistrict.trim(),
            address_line: guestAddressLine.trim(),
            postal_code:  guestPostalCode.trim() || null,
          },
        } : undefined,
        couponCode: appliedCoupon?.code,
        kvkkConsent,
        mesafeliConsent,
      }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Bir hata oluştu')
      return
    }

    setClientSecret(data.clientSecret)
    setOrderNumber(data.orderNumber)
    if (data.guestToken) setGuestToken(data.guestToken)
    setStep('payment')
  }

  if (!hydrated) return <div className="py-24 text-center text-base text-slate-500">Yükleniyor...</div>

  if (empty) {
    return (
      <div className="py-24 text-center">
        <div className="text-slate-300 text-5xl mb-4">🛒</div>
        <p className="text-base text-slate-600 mb-4">Sepetin boş, önce ürün eklemelisin</p>
        <Link href="/estestore" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C9A961] hover:bg-[#D4B872] text-[#0F172A] text-base font-semibold rounded-xl transition-colors">
          EsteStore’a Git →
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Adım 1: Adres */}
        <div className={`bg-white border rounded-2xl p-6 shadow-sm ${step === 'address' ? 'border-[#C9A961]/60' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-900 font-bold text-lg flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full text-sm flex items-center justify-center font-black ${step === 'address' ? 'bg-[#C9A961] text-[#0F172A]' : 'bg-[#10876B] text-white'}`}>
                {step === 'address' ? '1' : '✓'}
              </span>
              Teslimat Adresi
            </h2>
            {step !== 'address' && (selectedAddrId || isGuest) && (
              <button onClick={() => setStep('address')}
                className="text-base font-semibold text-[#8B7339] hover:text-[#6B5828] transition-colors">
                Değiştir
              </button>
            )}
          </div>

          {step === 'address' ? (
            <div className="space-y-3">
              {isGuest && (
                <div className="mb-2 p-3 bg-[#C9A961]/8 border border-[#C9A961]/25 rounded-xl flex items-center justify-between gap-3">
                  <p className="text-slate-700 text-sm">
                    Misafir alışveriş yapıyorsun. <span className="text-slate-500">Hesabın varsa giriş yap — adres ve sipariş geçmişini bul.</span>
                  </p>
                  <Link href="/giris?g=estestore&next=/odeme"
                    className="shrink-0 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors">
                    Giriş Yap
                  </Link>
                </div>
              )}

              {isGuest ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 text-sm font-semibold mb-1">Ad Soyad *</label>
                      <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)}
                        placeholder="Ad Soyad"
                        autoComplete="name"
                        className="w-full px-3 py-2 bg-[#FAFAF7] border border-slate-300 rounded-lg text-slate-900 text-base focus:outline-none focus:border-[#C9A961]" />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-sm font-semibold mb-1">Email *</label>
                      <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
                        placeholder="ornek@mail.com"
                        autoComplete="email" inputMode="email"
                        className="w-full px-3 py-2 bg-[#FAFAF7] border border-slate-300 rounded-lg text-slate-900 text-base focus:outline-none focus:border-[#C9A961]" />
                      <p className="text-slate-500 text-xs mt-1">Sipariş takip linki bu adrese gönderilir.</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 text-sm font-semibold mb-1">Cep Telefonu *</label>
                    <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      autoComplete="tel" inputMode="tel"
                      className="w-full px-3 py-2 bg-[#FAFAF7] border border-slate-300 rounded-lg text-slate-900 text-base focus:outline-none focus:border-[#C9A961]" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 text-sm font-semibold mb-1">Şehir *</label>
                      <input type="text" value={guestCity} onChange={e => setGuestCity(e.target.value)}
                        placeholder="İstanbul"
                        autoComplete="address-level1"
                        className="w-full px-3 py-2 bg-[#FAFAF7] border border-slate-300 rounded-lg text-slate-900 text-base focus:outline-none focus:border-[#C9A961]" />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-sm font-semibold mb-1">İlçe *</label>
                      <input type="text" value={guestDistrict} onChange={e => setGuestDistrict(e.target.value)}
                        placeholder="Kadıköy"
                        autoComplete="address-level2"
                        className="w-full px-3 py-2 bg-[#FAFAF7] border border-slate-300 rounded-lg text-slate-900 text-base focus:outline-none focus:border-[#C9A961]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 text-sm font-semibold mb-1">Açık Adres *</label>
                    <textarea value={guestAddressLine} onChange={e => setGuestAddressLine(e.target.value)}
                      placeholder="Mahalle, sokak, bina no, daire no"
                      rows={2}
                      autoComplete="street-address"
                      className="w-full px-3 py-2 bg-[#FAFAF7] border border-slate-300 rounded-lg text-slate-900 text-base focus:outline-none focus:border-[#C9A961] resize-none" />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-sm font-semibold mb-1">Posta Kodu (opsiyonel)</label>
                    <input type="text" value={guestPostalCode} onChange={e => setGuestPostalCode(e.target.value)}
                      placeholder="34000"
                      autoComplete="postal-code" inputMode="numeric"
                      className="w-full md:w-1/3 px-3 py-2 bg-[#FAFAF7] border border-slate-300 rounded-lg text-slate-900 text-base focus:outline-none focus:border-[#C9A961]" />
                  </div>
                </div>
              ) : addresses.map(a => (
                <label key={a.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedAddrId === a.id
                      ? 'bg-[#C9A961]/10 border-[#C9A961]/50'
                      : 'bg-[#FAFAF7] border-slate-200 hover:border-slate-300'
                  }`}>
                  <input type="radio" name="address" checked={selectedAddrId === a.id}
                    onChange={() => setSelectedAddrId(a.id)}
                    className="mt-1 accent-[#C9A961]" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 font-bold text-base">{a.title}</span>
                      {a.is_default && (
                        <span className="text-sm font-bold px-1.5 py-0.5 rounded bg-[#10876B]/15 text-[#10876B]">
                          VARSAYILAN
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 text-base mt-0.5">{a.full_name} · {a.phone}</p>
                    <p className="text-slate-600 text-base mt-1 leading-relaxed">
                      {a.address_line}, {a.district} / {a.city}
                    </p>
                  </div>
                </label>
              ))}

              {!isGuest && (addingAddress ? (
                <AdresForm
                  onClose={() => setAddingAddress(false)}
                  onSaved={(id) => {
                    setAddingAddress(false)
                    setSelectedAddrId(id)
                    router.refresh()
                  }}
                />
              ) : (
                <button onClick={() => setAddingAddress(true)}
                  className="w-full py-3 border border-dashed border-slate-300 hover:border-[#C9A961] rounded-xl text-base font-semibold text-slate-500 hover:text-[#8B7339] transition-all">
                  + Yeni Adres Ekle
                </button>
              ))}

              {/* KVKK + Mesafeli Satış onayları — yasal zorunluluk (KVK Kanunu 6698 / Tüketicinin Korunması 6502) */}
              <div className="space-y-1.5 pt-3 border-t border-slate-200">
                <label className="flex items-start gap-3 cursor-pointer p-2 -mx-2 rounded-lg active:bg-slate-50 transition-colors">
                  <input type="checkbox" checked={kvkkConsent}
                    onChange={e => setKvkkConsent(e.target.checked)}
                    className="mt-0.5 w-5 h-5 accent-[#C9A961] cursor-pointer shrink-0" />
                  <span className="text-slate-700 text-sm leading-relaxed">
                    <Link href="/hakkinda/aydinlatma" target="_blank" className="text-[#8B7339] font-semibold hover:underline">
                      KVKK Aydınlatma Metni
                    </Link>
                    ’ni okudum, kişisel verilerimin bu kapsamda işlenmesini kabul ediyorum.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer p-2 -mx-2 rounded-lg active:bg-slate-50 transition-colors">
                  <input type="checkbox" checked={mesafeliConsent}
                    onChange={e => setMesafeliConsent(e.target.checked)}
                    className="mt-0.5 w-5 h-5 accent-[#C9A961] cursor-pointer shrink-0" />
                  <span className="text-slate-700 text-sm leading-relaxed">
                    <Link href="/hakkinda/sozlesme" target="_blank" className="text-[#8B7339] font-semibold hover:underline">
                      Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu
                    </Link>
                    ’nu okudum, onaylıyorum.
                  </span>
                </label>
              </div>

              <button onClick={proceedToPayment}
                disabled={(isGuest ? !guestFormValid : !selectedAddrId) || !kvkkConsent || !mesafeliConsent || loading}
                className="w-full py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:from-[#D4B872] hover:to-[#C9A961] disabled:opacity-40 disabled:cursor-not-allowed text-[#0F172A] font-semibold rounded-xl transition-all text-base shadow-lg shadow-[#C9A961]/20">
                {loading ? 'Hazırlanıyor...' : 'Ödemeye Geç →'}
              </button>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-base font-semibold">{error}</div>
              )}
            </div>
          ) : isGuest ? (
            <div className="text-base">
              <p className="text-slate-900 font-bold">{guestName}</p>
              <p className="text-slate-600 mt-1">{guestEmail} · {guestPhone}</p>
              <p className="text-slate-600 mt-0.5">{guestAddressLine}, {guestDistrict} / {guestCity}</p>
            </div>
          ) : (
            selectedAddrId && (() => {
              const a = addresses.find(x => x.id === selectedAddrId)
              if (!a) return null
              return (
                <div className="text-base">
                  <p className="text-slate-900 font-bold">{a.full_name}</p>
                  <p className="text-slate-600 mt-1">{a.phone}</p>
                  <p className="text-slate-600 mt-0.5">{a.address_line}, {a.district} / {a.city}</p>
                </div>
              )
            })()
          )}
        </div>

        {/* Adım 2: Ödeme */}
        <div className={`bg-white border rounded-2xl p-6 shadow-sm ${step === 'payment' ? 'border-[#C9A961]/60' : 'border-slate-200'}`}>
          <h2 className="text-slate-900 font-bold text-lg flex items-center gap-2 mb-4">
            <span className={`w-6 h-6 rounded-full text-sm flex items-center justify-center font-black ${step === 'payment' ? 'bg-[#C9A961] text-[#0F172A]' : 'bg-slate-200 text-slate-500'}`}>
              2
            </span>
            Ödeme
          </h2>

          {step === 'payment' && clientSecret ? (
            <Elements stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'flat',
                  variables: { colorPrimary: '#C9A961' },
                },
              }}>
              <StripePaymentForm
                orderNumber={orderNumber!}
                guestEmail={isGuest ? guestEmail.trim().toLowerCase() : null}
                guestToken={guestToken}
                onSuccess={() => {
                  clear()
                  const q = new URLSearchParams({ success: '1' })
                  if (isGuest && guestToken) {
                    q.set('e', guestEmail.trim().toLowerCase())
                    q.set('t', guestToken)
                  }
                  router.push(`/siparis/${orderNumber}?${q.toString()}`)
                }} />
            </Elements>
          ) : (
            <p className="text-slate-500 text-sm font-bold">Önce teslimat adresini onayla</p>
          )}
        </div>
      </div>

      {/* Sağ — Özet */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-slate-900 font-bold text-lg">Özet</h2>

          {/* Ürün listesi */}
          <div className="space-y-2 text-base max-h-48 overflow-y-auto">
            {items.map(item => (
              <div key={item.productId} className="flex gap-2 items-center">
                <div className="w-10 h-10 rounded bg-[#FAFAF7] border border-slate-200 shrink-0 overflow-hidden">
                  {item.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <span className="text-slate-500 text-sm font-bold shrink-0">{item.quantity}×</span>
                <span className="flex-1 text-slate-700 text-base line-clamp-2">{item.name}</span>
                <span className="text-slate-900 text-base font-semibold shrink-0">
                  ₺{(item.price * item.quantity).toLocaleString('tr-TR')}
                </span>
              </div>
            ))}
          </div>

          {/* Kupon kodu */}
          <div className="pt-4 border-t border-slate-200">
            {appliedCoupon ? (
              <div className="p-3 bg-[#10876B]/10 border border-[#10876B]/30 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[#10876B] text-base font-bold">✓ {appliedCoupon.code}</p>
                  <p className="text-[#10876B]/80 text-sm font-bold mt-0.5">−₺{appliedCoupon.discount.toLocaleString('tr-TR')} indirim</p>
                </div>
                <button onClick={removeCoupon}
                  className="text-base font-semibold text-slate-500 hover:text-red-600 transition-colors">
                  Kaldır
                </button>
              </div>
            ) : (
              <div>
                <label className="text-base text-slate-700 font-semibold mb-1.5 block">Kupon kodu</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null) }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon() } }}
                    placeholder="ÖRNEK10"
                    className="flex-1 px-3 py-2 bg-[#FAFAF7] border border-slate-300 rounded-lg text-slate-900 text-base font-mono uppercase tracking-wider focus:outline-none focus:border-[#C9A961]" />
                  <button onClick={applyCoupon}
                    disabled={!couponInput.trim() || couponLoading}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-base font-bold rounded-lg transition-colors">
                    {couponLoading ? '...' : 'Uygula'}
                  </button>
                </div>
                {couponError && (
                  <p className="text-red-700 text-sm font-bold mt-1.5">✕ {couponError}</p>
                )}
              </div>
            )}
          </div>

          {/* Ücretsiz kargo barı */}
          {remainingForFreeShip > 0 && subtotal > 0 && (
            <div className="p-3 bg-[#C9A961]/10 border border-[#C9A961]/30 rounded-xl">
              <p className="text-[#8B7339] text-base font-semibold">
                <strong>₺{remainingForFreeShip.toLocaleString('tr-TR')}</strong> daha ekle, kargo ücretsiz!
              </p>
              <div className="mt-1.5 h-1 bg-[#C9A961]/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C9A961] transition-all"
                  style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Tutarlar */}
          <div className="space-y-2 pt-4 border-t border-slate-200 text-base">
            <div className="flex justify-between">
              <span className="text-slate-600">Ara Toplam</span>
              <span className="text-slate-900 font-semibold">₺{subtotal.toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Kargo</span>
              <span className={shippingFee === 0 ? 'text-[#10876B] font-semibold' : 'text-slate-900 font-semibold'}>
                {shippingFee === 0 ? 'Ücretsiz ✓' : `₺${shippingFee}`}
              </span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-[#10876B] font-semibold">
                <span>İndirim ({appliedCoupon?.code})</span>
                <span>−₺{couponDiscount.toLocaleString('tr-TR')}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 mt-2">
              <span className="text-slate-900 font-semibold">Toplam</span>
              <span className="text-slate-900 font-black text-xl">₺{total.toLocaleString('tr-TR')}</span>
            </div>
          </div>

          {/* Güvenli ödeme rozeti */}
          <div className="flex items-start gap-2 text-slate-600 text-sm font-bold pt-2 border-t border-slate-200">
            <svg className="w-4 h-4 text-[#10876B] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Stripe ile güvenli ödeme · 14 gün cayma hakkı</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StripePaymentForm({ orderNumber, guestEmail, guestToken, onSuccess }: {
  orderNumber: string
  guestEmail: string | null
  guestToken: string | null
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const returnUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const q = new URLSearchParams({ success: '1' })
    if (guestEmail && guestToken) {
      q.set('e', guestEmail)
      q.set('t', guestToken)
    }
    return `${window.location.origin}/siparis/${orderNumber}?${q.toString()}`
  }, [orderNumber, guestEmail, guestToken])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    if (!acceptTerms) {
      setError('Mesafeli satış sözleşmesini ve ön bilgilendirmeyi onaylamanız gerekiyor.')
      return
    }
    setLoading(true)
    setError(null)

    const { error: stripeErr } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    })

    if (stripeErr) {
      setError(stripeErr.message ?? 'Ödeme başarısız')
      setLoading(false)
      return
    }

    onSuccess()
  }

  useEffect(() => {
    // Stripe redirect'ten döndüğünde success (if_required bypass'ında onSuccess elle çağrılır)
  }, [])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={e => setAcceptTerms(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded accent-[#C9A961] shrink-0"
          required
        />
        <span className="text-sm text-slate-700 leading-snug">
          <Link href="/hakkinda/mesafeli-satis" target="_blank" className="text-[#8B7339] hover:text-[#6F5C2E] underline font-semibold">Mesafeli Satış Sözleşmesi</Link>
          {' '}ve{' '}
          <Link href="/hakkinda/iade" target="_blank" className="text-[#8B7339] hover:text-[#6F5C2E] underline font-semibold">Ön Bilgilendirme Formu</Link>
          &apos;nu okudum, onaylıyorum.
        </span>
      </label>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-base font-semibold">{error}</div>
      )}
      <button type="submit" disabled={!stripe || loading || !acceptTerms}
        className="w-full py-4 bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:from-[#D4B872] hover:to-[#C9A961] disabled:opacity-40 disabled:cursor-not-allowed text-[#0F172A] font-bold rounded-xl transition-all text-base shadow-lg shadow-[#C9A961]/20">
        {loading ? 'Ödeme işleniyor...' : 'Ödemeyi Tamamla'}
      </button>
      <p className="text-slate-500 text-sm font-bold text-center">
        🔒 Stripe · PCI DSS sertifikalı · kart bilgin bize ulaşmaz
      </p>
    </form>
  )
}
