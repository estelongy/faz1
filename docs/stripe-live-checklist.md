# Stripe Live Mode Aktivasyon Checklist'i

**Hesap sahibi:** Vestoriq OÜ (Estonya)
**Hedef:** Test mode'dan Live mode'a geçiş; gerçek kart kabul başlangıcı
**Sahip:** Dr. İzzet Gök (Kurucu/CTO)

---

## 1. Stripe hesabı aktivasyonu (Stripe Dashboard)

### 1.1 İşletme bilgileri
- [ ] Vestoriq OÜ tescil belgesi (Estonya Ticaret Sicili çıktısı)
- [ ] Vergi numarası (Estonya VAT ID)
- [ ] İşletme adresi (Tallinn)
- [ ] Web sitesi: `https://estelongy.com`
- [ ] İşletme açıklaması: "Online marketplace for skincare and longevity products + clinic booking platform"
- [ ] Sektör (MCC): 5912 (Drug Stores & Pharmacies) **veya** 7298 (Spas / Health & Beauty)

### 1.2 Beneficial owner / yönetici
- [ ] Dr. İzzet Gök pasaport/kimlik
- [ ] Adres kanıtı (son 3 ay içinde fatura/banka extresi)
- [ ] %25+ ortak yapısı beyanı

### 1.3 Banka hesabı
- [ ] EUR Estonya banka hesabı (settlement için)
- [ ] IBAN + BIC/SWIFT
- [ ] Hesap sahibi adı **Vestoriq OÜ** olmalı (kişisel hesap reddedilir)

### 1.4 Müşteri/destek
- [ ] Customer service email: `destek@estelongy.com`
- [ ] Müşteri-görünür isim: "Estelongy" (statement descriptor)
- [ ] Ödeme açıklaması (statement descriptor prefix): `ESTELONGY*`

---

## 2. Stripe Connect (vendor marketplace)

EsteStore satıcıları için Connect Express kullanılıyor (kodda zaten var).

- [ ] Stripe Connect terms onayı
- [ ] Marketplace açıklaması: "Curated skincare and aesthetic products marketplace"
- [ ] Connect onboarding flow URL: `https://estelongy.com/satici/panel/kyc`
- [ ] Vendor başvuru → KYC zinciri test edildi (test mode'da)
- [ ] Application fee oranı (komisyon) DB'de `order_items.commission_amount` üzerinden hesaplanıyor; varsayılan %10 (`/satici/basvur/KomisyonHesaplayici` ekranında gösterilir)

---

## 3. Webhook'lar

### 3.1 Endpoint
- **Live URL:** `https://estelongy.com/api/stripe/webhook`
- **API version:** `2026-03-25.dahlia` (kodda sabit)

### 3.2 Dinlenen event'ler
Kod hazır — şu event'leri Stripe Dashboard'da etkinleştir:
- [ ] `checkout.session.completed` (Akademi + Klinik kredi)
- [ ] `payment_intent.succeeded` (Marketplace sipariş)
- [ ] `payment_intent.payment_failed`
- [ ] `charge.refunded` (Dashboard'dan iade sync)
- [ ] `charge.dispute.created` (chargeback uyarı → admin maili)
- [ ] `charge.dispute.closed` (chargeback sonucu)
- [ ] `account.updated` (Connect vendor KYC durum)

### 3.3 Webhook signing secret
- [ ] **Test secret** → `.env.development` `STRIPE_WEBHOOK_SECRET`
- [ ] **Live secret** → Vercel environment vars `STRIPE_WEBHOOK_SECRET` (production scope)
- [ ] Eski test secret değerini Vercel'den **sil**

---

## 4. API anahtarları

| Anahtar | Test mode env var | Live mode env var | Yer |
|---|---|---|---|
| Secret key | `sk_test_...` | `sk_live_...` | Vercel: `STRIPE_SECRET_KEY` |
| Publishable | `pk_test_...` | `pk_live_...` | Vercel: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Webhook signing | `whsec_test_...` | `whsec_...` | Vercel: `STRIPE_WEBHOOK_SECRET` |

- [ ] Vercel production environment'a 3 live anahtar girildi
- [ ] Vercel preview/development environment test anahtarları ile kaldı
- [ ] Deploy tetiklendi → live anahtarlarla production yeniden başlatıldı

---

## 5. Idempotency + güvenlik kontrolleri (kod tarafı — yapıldı)

- [x] `stripe_webhook_events` tablo: `event.id` ile dedupe (yapıldı — `20260622_stripe_webhook_events.sql`)
- [x] Signature verification (`stripe.webhooks.constructEvent`)
- [x] Service role only (RLS)
- [x] Order ödeme idempotent (`payment_status === 'paid'` check)
- [x] Connect transfer tek seferlik (`source_transaction` ile)

---

## 6. Live mode öncesi son test (test mode'da çalıştırılır)

### 6.1 Tam ödeme akışı
- [ ] Misafir sipariş → kart `4242 4242 4242 4242` → ödeme başarılı
- [ ] Webhook'ta `payment_intent.succeeded` geldi (Stripe CLI: `stripe trigger payment_intent.succeeded`)
- [ ] DB'de `orders.payment_status = 'paid'`
- [ ] Müşteriye onay maili gitti (Resend yapılandırıldıysa)
- [ ] Stok düştü
- [ ] Vendor'a transfer kaydı oluştu (test mode'da $0 ama event'i görmek için)

### 6.2 Refund
- [ ] `/admin/iadeler` → İade onayla → Stripe refund tetiklendi
- [ ] `charge.refunded` webhook geldi
- [ ] DB'de `orders.payment_status = 'refunded'`
- [ ] Müşteriye iade kararı maili gitti

### 6.3 Dispute simülasyonu
- [ ] `stripe trigger charge.dispute.created`
- [ ] `orders.dispute_status` doldu
- [ ] Admin'e uyarı maili gitti (`ADMIN_ALERT_EMAIL` env var)

### 6.4 Connect onboarding
- [ ] Yeni vendor başvuru → Stripe Connect onboarding linki çalışıyor
- [ ] `account.updated` event geldi → `vendors.stripe_charges_enabled = true`

---

## 7. Production'a geçiş günü

1. [ ] Stripe Dashboard → **"Activate Account"** butonu (Stripe son onay verir, 1-3 iş günü)
2. [ ] Aktivasyon onaylanınca Vercel'e `sk_live_*`, `pk_live_*`, `whsec_*` (live) gir
3. [ ] Deploy tetikle, production'da küçük tutarla **gerçek kart testi** yap (€0.50 / ₺15)
4. [ ] Test sonrası anında refund et
5. [ ] Müşteriye duyuru: "EsteStore artık gerçek ödeme alıyor"

---

## 8. Sorun çıkarsa

- **Aktivasyon reddi** → Stripe support'tan red sebebi al, evrak eksiği gider. Marketplace MCC için ek belge isteyebilir.
- **Webhook gelmiyor** → Stripe Dashboard → Developers → Webhooks → "Recent deliveries" — 4xx/5xx logu
- **Connect transfer fail** → Stripe Dashboard → Connect → Hata: kapasite eksik / KYC tamamlanmamış vendor
- **Chargeback** → `docs/kvkk-ihlal-runbook.md` benzeri ayrı playbook gerekirse yazılır

---

## Versiyon

- **v1.0 — 22 Haziran 2026** — İlk yayım. Stripe Connect Express + tek-event-id dedupe stratejisi.
