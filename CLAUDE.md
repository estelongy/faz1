# CLAUDE.md — Estelongy Proje Rehberi

## Proje Özeti

**Estelongy** — Estetik sağlık alanında AI destekli klinik yönetim ve hasta takip platformu.  
**Branch:** `claude/priceless-ellis` → deploy: `estelongy-clean.vercel.app`  
**Stack:** Next.js 14 (App Router) · Tailwind · Supabase PostgreSQL (RLS) · OpenAI GPT-4o · Stripe · Resend · Sentry · Vercel

---

## Kullanıcı Rolleri

| Rol | Yetkiler |
|-----|----------|
| `user` | Analiz, Anket, Randevu, Sipariş, Yorum, Skor takibi |
| `clinic` | Hasta listesi, Takvim, Analiz onay, Jeton harcama |
| `vendor` | Ürün, Stok, Sipariş, İade, Komisyon takibi |
| `admin` | Tüm kaynaklar, Klinik/Kullanıcı/Kupon yönetimi |

> Klinik ve Vendor başvuruları `pending` durumunda `user` yetkisiyle çalışır.

---

## Sayfa Haritası

```
/                        → Landing page
/giris  /kayit           → Auth
/panel                   → Hasta paneli (rozetler, analizler, siparişler)
/panel/referral          → Referral + komisyon
/panel/leaderboard       → Anonim skor sıralaması
/analiz                  → GPT-4 Vision + C250 analiz
/anket                   → Longevity anketi
/randevu                 → Klinik seç + müsaitlik + randevu
/magaza  /magaza/[slug]  → Ürün listesi + detay
/sepet  /siparis/[no]    → Sepet + sipariş detay/iade
/klinik/basvur           → Klinik başvuru
/klinik/panel            → Klinik yönetim (randevular, takvim, müsaitlik, rapor)
/admin                   → Admin dashboard (kullanıcılar, klinikler, satıcılar, ürünler, kuponlar, iadeler)
/rehber                  → SEO hub + alt sayfalar
/hakkinda/*              → SSS, İletişim, Sözleşme, Aydınlatma, Çerez
```

---

## Supabase

- **ID:** `dcmnxmqzimrgmholktid` · **URL:** `https://dcmnxmqzimrgmholktid.supabase.co`
- **Edge Function:** `send-appointment-email`

**Tablolar:** `profiles` · `clinics` · `vendors` · `appointments` · `analyses` · `scores` · `longevity_surveys` · `products` · `orders` · `order_items` · `addresses` · `carts` · `cart_items` · `returns` · `transactions` · `jeton_transactions` · `reviews` · `notification_queue` · `audit_logs` · `clinic_availability` · `user_badges` · `user_activity_streaks` · `referral_codes` · `referral_uses` · `coupons`

**Kritik kısıtlamalar:**
```
scores.score_type          → CHECK IN ('web','device','doctor_approved','final')
notification_queue.type    → CHECK IN ('email','sms','push')
appointments.status        → ENUM (pending,confirmed,in_progress,completed,cancelled)
analyses.web_ai_raw        → JSONB  |  analyses.web_scores → JSONB
```

**RPC:** `consume_jeton(p_clinic_id, p_appointment_id)` · `generate_referral_code(p_user_id)` · `decrement_product_stock`

---

## Env Variables

```
NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY · SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY · STRIPE_SECRET_KEY · STRIPE_WEBHOOK_SECRET · NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY · CRON_SECRET · NEXT_PUBLIC_SENTRY_DSN · SENTRY_ORG · SENTRY_PROJECT
```

---

## AI — GPT-4 Vision + C250

`POST /api/analiz` (rate limit: IP başına 5/saat) → Base64 → GPT-4o → 5 bileşen → C250 → skor

**C250 Ağırlıkları:**

| Bileşen | Ağırlık | Yön |
|---------|---------|-----|
| hydration | 0.25 | yüksek = iyi |
| tone_uniformity | 0.25 | yüksek = iyi |
| wrinkles | 0.25 | ters (100−değer) |
| pigmentation | 0.15 | ters (100−değer) |
| under_eye | 0.10 | yüksek = iyi |

**Yaş faktörü:** ≤25→1.02 · ≤35→1.00 · ≤45→0.97 · ≤55→0.93 · 56+→0.88

---

## Klinik Akış (6 Adım)

`/klinik/panel/randevu/[appointmentId]` → `KlinikAkisWizard`

- `src/components/KlinikAkisWizard.tsx`
- `src/lib/anket-sorular.ts` · `src/lib/tetkik-params.ts` · `src/lib/egs.ts`
- `src/app/klinik/panel/randevu/[appointmentId]/page.tsx` (server actions)

Akış: Kabul → Hasta Anketi → Klinik Anketi → Tetkik → İleri Analiz → Hekim Onayı  
Final = (toplam × 0.85) + (hekim_puanı × 0.15)

---

## Terminoloji (Sabit — Tutarlı Kullan)

| Terim | Kime/neye | Aralık | Not |
|-------|-----------|--------|-----|
| **Skor** | kişi (hasta) | 0–100 | "Estelongy Gençlik Skoru ®" — "EGS" ❌ |
| **EGP** | nesne (ürün, işlem, klinik) | 0–10 | Estelongy Gençlik Puanı |

**Skor bölgeleri (YENİ — eski barem kullanma):**

| Aralık | Etiket | Renk |
|--------|--------|------|
| < 55 | Çok Düşük | kırmızı |
| 56–65 | Düşük | turuncu |
| 66–79 | Normal | amber |
| 80–89 | İyi | yeşil |
| > 90 | Harika | cyan |

**Skor durumları:** `tahmini` (amber) · `guncelleniyor` (violet/pulse) · `klinik_onayli` (emerald)

**Estelog** = Skor bazlı çalışan, protokol odaklı estetik hekim (yeni meslek tanımı)

**EGP formülü:** `doctor×0.4 + user×0.35 + manufacturer×0.15 + scientific×0.10`  
`products` tablosunda `doctor_score`, `user_score`, `manufacturer_score`, `scientific_score` mevcut.

---

## Geliştirme Kuralları

- `'use client'` bileşenlerinde `export const dynamic = 'force-dynamic'` **KULLANMA**
- `router.refresh()` → insert/update sonrası cache temizleme
- Auth callback `next` param: sadece `/` ile başlıyorsa geçerli (open redirect koruması)
- AI down → fallback skor göster, sessiz başarısızlık yok
- Server action'larda `redirect()` try/catch **dışında** olmalı

---

## Bekleyen Görevler

### Rename (Yapılacak)
- [ ] Tüm "EGS" → "Skor" / "Estelongy Gençlik Skoru ®"
- [ ] `EGSScoreBar` → `ScoreBar` · `EGSScoreChart` → `ScoreChart` · `EGSFixedBadge` → `ScoreFixedBadge`
- [ ] `EGSPhase` type → `ScorePhase`
- [ ] `ZONE_DEFS` / `getZone()` / `colorZone()` / `zoneLabel()` → 5 yeni bölge
- [ ] SEO meta, OG image, PaylasModal, landing page metinleri

### Manuel (Kod Gerektirmeyen)
- [ ] Supabase → Auth → Google OAuth etkinleştir
- [ ] Vercel Env: `OPENAI_API_KEY` · `CRON_SECRET` · `RESEND_API_KEY`
- [ ] Sentry proje → DSN'leri Vercel'e ekle
- [ ] Stripe live mode → KYC tamamla

### Faz 3
- [ ] Mobil App (React Native / Expo)
- [ ] Redis (Upstash) — rate limiting prod
- [ ] Push/SMS provider (FCM / Netgsm)
- [ ] AI fine-tuning
- [ ] API Platformu · Çoklu dil (EN)
- [ ] EGP UI: mağaza rozeti + sıralama + "nasıl hesaplandı" şeffaflık
