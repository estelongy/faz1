# CLAUDE.md — Estelongy Sistem Özeti

> Operasyonel referans. Detaylı tarihsel devir dosyası: `CLAUDEeski2.md`.

**Güncelleme:** 2026-05-16 · **Aktif branch:** `claude/priceless-ellis` (production) · **Faz:** Soft Launch — SMS/OTP canlı, 3-galaksi mimari devrede, EGP motoru PAUSE, Stripe Live KYC açık.

---

## 0. Kimlik

**Estelongy** — longevity (uzun ömür) odaklı 5 katmanlı dikey platform: Standart (Gençlik Skoru 0-100) · Ekosistem (klinik + sağlık-pro + vendor + hasta) · Yolculuk (randevu→analiz→tetkik→onay) · EsteStore marketplace (3-tier pricing) · Akademi SaaS (%70/%30).

Pozisyonlama: "Genç görünmek değil **sağlıklı görünmek**". Asıl moat: **ELS** (Estelongy Longevity Standartları — Faz 3 akreditasyon kuruluşu).

Kurucu: Dr. İzzet Gök · estelongy@gmail.com

---

## 1. Servis Envanteri

| Servis | Hesap / Ref | Not |
|---|---|---|
| **Vercel** | team `team_6KIGU5JvMoWBV5To6nncBNnc` / proje `prj_qQ0N5SSfH8kqaY61qyiAFIOy9pVS` (faz-1) | Prod: `estelongy-clean.vercel.app`. Hobby plan (cron 09:00 UTC). `estelongy.com` alındı, projeye henüz bağlanmadı (5 dk iş). `drizzetgok-site` ayrı bağımsız proje. |
| **Supabase** | `dcmnxmqzimrgmholktid` · `https://dcmnxmqzimrgmholktid.supabase.co` | Postgres 17 + Auth + Storage. Free plan; prod trafiğinde Pro. Edge: `send-appointment-email`. |
| **Stripe** | Vestoriq OÜ (Estonya KYC sürüyor) | TEST modda; min €0.50. Webhook: `/api/stripe/webhook`. Vendor için Connect Express. |
| **Resend** (primary) | DKIM/SPF Verified · region eu-west-1 | `noreply@estelongy.com`. UUID messageId. |
| **Postmark** (fallback) | Server 19148696, stream `outbound`, pending approval | Approval yokken yalnız `@estelongy.com`'a fallback. |
| **Netgsm** | Header `ESTELONGY` | OTP + admin OTP + randevu hatırlatma. |
| **Upstash Redis** | Free | OTP storage + rate limit + login lockout + admin step-up. |
| **OpenAI** | gpt-4o-mini Vision | `/api/analiz` (5 cilt bileşeni → C250). Rate limit 5/h/IP. |
| **Cloudflare Stream** | $5/ay — **subscribe edilmedi** | Akademi videoları. |
| **Sentry** | org+project `estelongy` | DSN env'e girildiyse aktif. |
| **Cloudflare DNS** | NS Vercel'de (`ns1.vercel-dns.com`) | Email Routing kurulmadı — `admin@`, `kvkk@`, `guvenlik@`, `destek@` henüz mailbox değil. |

---

## 2. Stack

Next.js 14.2 App Router (RSC + server actions) · TS 5 · Tailwind 3 (slate/violet) · Supabase Postgres 17 + RLS + `@supabase/ssr` · Stripe (Checkout + Connect + Webhook) · Resend→Postmark fallback · Netgsm · Upstash Redis · OpenAI gpt-4o-mini · Cloudflare Stream · Sentry · Vercel (`vercel --prod --yes`).

---

## 3. Repo Yapısı (özet)

```
src/app/
  (public) /, /rehber, /hakkinda, /guvenlik
  giris, kayit, kurumsal/giris, kurumsal/saglik-profesyoneli/kayit, auth/update-password
  analiz, skor, randevu
  estestore/[category]/[slug]   ← yeni marketplace (/magaza legacy)
  akademi/[slug]                 ← KOL eğitim
  panel/                         ← Hasta paneli (hesabim, analizlerim, randevularim, siparislerim, adreslerim, iadelerim, kurslarim, referral, leaderboard)
  klinik/{basvur, panel/...}     ← Klinik dashboard V2 (takvim, hastalarim, randevu/[id], akademi/{basvur,paketler}, muhasebe)
  satici/{basvur, panel/...}     ← KYC, urunler, siparisler, iadeler, kazanc, odeme-hesabi
  admin/                         ← kullanicilar, klinikler, saticilar, urunler, kuponlar, iadeler, icerik, audit, hesap
  api/                           ← Bölüm 9

src/lib/
  supabase/{server,client,service}.ts    ← @supabase/ssr + service_role
  auth-redirect.ts (pathForRole)
  admin-otp.ts (ensureAdminOtpFresh)
  audit.ts (writeAuditLog) + login-ratelimit.ts + redis.ts + ratelimit.ts
  notifications.ts (Resend primary + Postmark fallback)
  email-templates.ts + welcome-email.ts
  signup-policy.ts + netgsm.ts
  estestore.ts (3-tier RBAC) + journeys.ts + credit.ts
  egs.ts (skor) + anket-sorular.ts + tetkik-params.ts (algoritma yarım)
  muhasebe-owner.ts (Dr. İzzet özel CRM/ERP)

src/components/  ← SafeLink, GalaxyLink, GalaxyTransition, BackButton, AuthStatusProvider, ...
src/middleware.ts (admin OTP gate) + instrumentation.ts (Sentry)
next.config.mjs (CSP + security headers)
```

---

## 4. Env (kritik)

**Zorunlu:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (RLS bypass — GİZLİ).
**Ödeme:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
**Mail:** `RESEND_API_KEY` (primary), `POSTMARK_API_TOKEN` (fallback), `FROM_EMAIL=noreply@estelongy.com`.
**SMS:** `NETGSM_USERCODE`, `NETGSM_PASSWORD`, `NETGSM_MSGHEADER=ESTELONGY`.
**Upstash:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
**Diğer:** `OPENAI_API_KEY`, `CRON_SECRET`, Sentry (`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`), Cloudflare Stream (`NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_STREAM_TOKEN`), `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.

Eksiklik etkileri: Mail yok → sessiz fail. SMS yok → kayıt kırılır. Upstash yok → OTP/lockout/step-up bozulur. OpenAI yok → rastgele fallback skor.

---

## 5. DB Şeması (özet)

**Ana tablolar (ilişki):**
```
auth.users ←→ profiles (1:1)
profiles → vendors / clinics / (health_pro = profiles.role)
vendors → products → product_images
            ↓
        tier_pricing
profiles → orders → order_items
profiles → appointments → analyses → scores ← longevity_surveys
                                       ↑
                              journeys (aktif yolculuk)
clinics → course_packages → course_videos
            ↓
        course_purchases → course_progress / course_reviews
notification_queue · audit_logs · point_transactions · credit_transactions
```

**Roller (`profiles.role` enum):** `user` · `health_professional` · `clinic` · `vendor` · `admin`. **Tek kaynak:** `auth.users.app_metadata.role`; `profiles.role` türetilir. RPC `set_user_role(uid, role)` ikisini senkron tutar.

**Skor formülü:**
```
ara_toplam = ham_C250 × yas_faktor + hasta_anket + klinik_anket + tetkik
final      = ara_toplam × 0.85 + hekim_skoru × 0.15
```
- C250 ağırlıkları: hydration .25 · tone .25 · wrinkles .25 (ters) · pigmentation .15 (ters) · under_eye .10
- Yaş faktörü: ≤25→1.02 · ≤35→1.00 · ≤45→0.97 · ≤55→0.93 · 56+→0.88
- Anket: hasta max +3.6, klinik max +3.6 (toplam +7.2)
- **Tetkik puanı:** algoritma YARIM (bilimsel araştırma sürüyor)

**EGP formülü (ürün/işlem/klinik 0-10):** `doctor×0.4 + user×0.35 + manufacturer×0.15 + scientific×0.10`

**Vendor KYC alanları:** `kyc_status` (`not_submitted`|`pending`|`approved`|`rejected`), `tax_certificate_url`, `its_certificate_url` (tıbbi ürün için zorunlu), `contract_signed_url` (opsiyonel), `iban`+`iban_holder_name`+`bank_name`, `tax_number`, `mersis_no`, `trade_registry_no`, `kep_address`, `sells_medical_products`. **Trigger:** `enforce_vendor_kyc_before_approval` — `approval_status='approved'` için `kyc_status='approved'` şart.

**Klinik kredi:** `free_appointments_remaining` (default 20 hediye), `credit_balance`, `appointment_credit_price`, `paid_appointments_this_month`. RPC `consume_credit` önce free'den sonra balance'tan düşer; view `clinics_with_credit_status`.

**Akreditasyon (on-the-fly):** Yeni → Doğrulanmış Hekim (≥5 onaylı) → Estelongy Hekimi (≥20 + ≥5 klinik onay) → Estelongy Uzmanı (≥100 + ≥30).

**Kritik RPC'ler:** `set_user_role`, `consume_credit`, `add_credit`, `adjust_points`, `decrement_product_stock`, `generate_referral_code`, `app_delete_account_cascade` (KVKK).

**Storage bucket'ları:**
| Bucket | Public | Limit | MIME |
|---|---|---|---|
| `analyses` | ❌ | 8 MB | image/* + heic/heif |
| `product-images` | ✅ | 5 MB | jpeg/png/webp |
| `vendor-kyc` | ❌ | 10 MB | image/* + pdf |

vendor-kyc path: `<vendor_id>/<slot>-<timestamp>.<ext>`. Admin 1h signed URL.

---

## 6. Auth

**4 kayıt akışı:** `/kayit` (user) · `/kurumsal/saglik-profesyoneli/kayit` (HP, ünvan+uzmanlık) · `/kurumsal/giris?mode=kayit` (clinic/vendor → role 'user' kayıt, sonra başvuru) · admin (sadece DB).

**Ortak (`signup-policy.ts`):** e-posta + disposable blocklist (10minutemail vb.) · IP başına 3 kayıt/saat (Upstash) · şifre min 8 + yaygın blocklist · SMS OTP zorunlu (3dk pencere, 5 deneme/saat).

**Login:** `/api/auth/login` — IP brute-force (10 yanlış/dk → 15dk lockout) + Supabase signIn + hesap counter (3+ yanlış/24h → uyarı maili, 24h cooldown). `pathForRole`: admin→/admin, clinic→/klinik/panel, vendor→/satici/panel, hp+user→/panel.

**Admin Step-up OTP:** şifre sonrası `/api/admin-otp/send` (telefon DB'den) → 6 hane → Upstash `admin_otp:verified:<uid>` 30dk TTL. Middleware `/admin/*` için zorunlu. Kritik aksiyonlarda `ensureAdminOtpFresh(uid, returnTo, maxAgeSec=300)` — son 5dk taze kontrol. Kapsam: `set_user_role`, `toggleActive`, `updateVendor`, `decideKyc`, `updateClinic`, `toggleEducator`, `decideEducatorApplication`, `addCredit`, `urunOnayAction`.

---

## 7. Güvenlik

**Headers (`next.config.mjs`):** CSP (default-src 'self'; script: self+unsafe-inline+stripe+sentry; frame: stripe; frame-ancestors none) · HSTS 2yıl preload · X-Frame DENY · nosniff · Referrer strict-origin-when-cross-origin · Permissions-Policy (camera self, ödeme self) · COOP same-origin. API route'larda `Cache-Control: no-store`.

**Brute force:** IP 10/dk → 15dk lockout · hesap 3+/24h → uyarı (24h cooldown).

**RLS özeti:** Kullanıcı sadece kendi profilini/analizini/randevusunu; vendor kendi ürünleri; audit_logs sadece service_role+admin SELECT.

**Audit (8 aksiyon):** role_change · user_active_toggle · vendor_approval · clinic_approval · clinic_educator_toggle · clinic_educator_decision · clinic_credit_grant · product_approval · gdpr_kvkk_delete. Viewer: `/admin/audit`.

**Sorumlu açıklama:** `/.well-known/security.txt` + `/guvenlik` · `guvenlik@estelongy.com` (DNS yok, fallback estelongy@gmail.com).

---

## 8. KVKK / Hesap silme

`/panel/hesabim` → `deleteAccountAction` → DB function `app_delete_account_cascade(uuid)` → `auth.admin.deleteUser()`.

| Hard delete | Anonimize (mali, VUK 5yıl) | Anonimize (public) | İşletme askıya |
|---|---|---|---|
| addresses, analyses, appointments, carts, journeys, longevity_surveys, user_activity_streaks, user_badges, referral_codes, profiles (CASCADE: scores, point_transactions, notification_queue, course_progress, clinic_patient_notes) | orders, course_purchases, returns, transactions (FK SET NULL) | clinic_reviews, course_reviews, reviews, shared_cases, editorial_posts.created_by, coupons.created_by | vendors / clinics → is_active=false, phone null |

Kontrol: aktif sipariş varsa reddedilir. Admin kendini silemez. **Eksik:** resmi KVKK politika sayfası (yasal metin yazılmadı).

---

## 9. API & Server Actions

```
POST /api/auth/login                 ← brute-force korumalı
POST /api/kayit                       ← hasta
POST /api/kurumsal/kayit              ← klinik/satıcı
POST /api/saglik-profesyoneli/kayit
POST /api/otp/{send,verify}
POST /api/admin-otp/{send,verify}
POST /api/admin/test-email
POST /api/analiz                      ← Vision, 5/h/IP
POST /api/akademi/checkout            ← Stripe TRY
POST /api/stripe/webhook              ← idempotent
GET  /api/stripe/connect/{account-link,account-status}
POST /api/randevu                     ← consume_credit
POST /api/iade
GET  /api/cron/{notifications,clinic-egp,akademi-quality-score}
GET  /sitemap.xml · /robots.txt
```

**Step-up gerektiren server actions:** `admin/kullanicilar` (changeRole, toggleActive) · `admin/saticilar` (updateVendor, decideKyc) · `admin/klinikler` (updateClinic, toggleEducator, decideEducatorApplication, addCredit) · `admin/urunler` (urunOnayAction).

---

## 10. Ödeme

| Akış | Endpoint | Para |
|---|---|---|
| Klinik kredi | `/api/stripe/kredi-checkout` | EUR (~€5/kredi) |
| Akademi paket | `/api/akademi/checkout` | TRY |
| Mağaza | `/api/checkout` | TRY |
| Vendor onboarding | `/api/stripe/connect/account-link` | — |

**Webhook idempotent:** `checkout.session.completed` (kind=`akademi_purchase`|`credit_purchase`|`order`) · `account.updated` (vendor Connect). Signature: `STRIPE_WEBHOOK_SECRET`.

**Komisyon:** vendor default %12 · akademi %70/%30. Stripe Connect TR yok → **manuel IBAN transfer** (ay sonu rapor).

**Puan (1 puan ≈ 1 TL):** signup +20 · ilk randevu davet eden +50 · ilk sipariş davet eden %5. Ledger: `point_transactions`. RPC: `adjust_points` (atomik).

---

## 11. Modül Notları (kısa)

**Hasta paneli (`/panel`):** Skor Durumu (bar+rozet) · Sıradaki Adım (durum-bazlı tek CTA) · 8-ikon yönetim grid. HP modu emerald tema. Hesabım: profil/e-posta/telefon/şifre + KVKK sil.

**Analiz (`/analiz`):** kamera → base64 → gpt-4o-mini (C250) → yaş faktörü → analyses+scores → `/skor?analysisId=...&open=anket`.

**Skor (`/skor`):** anket modal · randevu CTA · ürün önerileri · paylaş kartı. Bölgeler: <55 kırmızı · 56-65 turuncu · 66-79 amber · 80-89 yeşil · ≥90 cyan. Durumlar: `tahmini` · `guncelleniyor` · `klinik_onayli`.

**Klinik panel:** Gmail-tarzı sidebar (72→264px hover-expand, pin). 3 katman dashboard: ŞIMDI · BU AY · SENİN SEÇTİKLERİN. **Randevu wizard 6 adım:** Kabul → Hasta Anketi → Klinik Anketi → Tetkik → İleri Analiz → Hekim Onayı. Eğitmen başvuru: ≥50 char mesaj → admin → `/klinik/panel/akademi/paketler` (paket+video CRUD, `requireEducatorClinic()` guard).

**Klinik muhasebe (owner whitelist):** `internal_appointment` + `internal_availability` + `internal_treatment` + `internal_payment` + `internal_product` + `internal_patient` + `internal_treatment_catalog` — owner-only mini-CRM/ERP. Erişim `MUHASEBE_OWNER_PROFILES` map'i (src/lib/muhasebe-owner.ts) — anahtar user_id, değer `{displayName, brandLine}`. Yeni sahip = haritaya satır ekle. Aktif: Dr. İzzet GÖK + Işık Anka Kliniği. Marketplace appointments'tan tamamen ayrı (kredi düşmez, hasta paneline yansımaz, SMS atmaz). Müsaitlik UI: toggle + Aktif Gün/Haftalık Slot özeti + "Pzt→Sal-Cum uygula" + slot süresi (10/15/20/30/45/60/90 dk). Tekrar: weekly/biweekly/triweekly/monthly × 1-6 ay (`recurrence_group_id`). **Slot mantığı:** her gün açılış→kapanış arasında `slot_duration_minutes` adımıyla tek tip slot (G-R-R kırmızı/yeşil pattern kaldırıldı). `slotInDay` hem aralık hem grid hizalama (`(t - open) % step === 0`) kontrol eder. **Aylık özet PDF:** `/klinik/muhasebe-ozet` print-friendly sayfa; WhatsApp paylaşımı için `jspdf` + `html2canvas-pro` (Tailwind v4 oklch desteği) lazy-imported, Web Share API ile native paylaşım (mobil) veya indir+wa.me metni (masaüstü fallback). Numara `localStorage`'da `muhasebe_ozet_wa_number` anahtarında.

**Satıcı:** başvuru → KYC → admin onay. KYC formu 3 bölüm: kurumsal kimlik (vergi/T.C., MERSIS, KEP) · banka (IBAN TR) · belgeler (vergi levhası ZORUNLU, ITS tıbbi için zorunlu). Sözleşme 10 madde inline (Vestoriq OÜ, %12 komisyon, 7 iş günü ödeme, Tallinn yetkili). Ürün tier pricing: bareem 1 (1-5, profesyonel min %10 indirim) · 2 (6-15) · 3 (16+).

**Akademi:** `/akademi` (kategori/seviye/sıralama) → detay → Stripe Checkout (TRY, %70/%30 metadata) → webhook `course_purchases.paid` → `/panel/kurslarim/[slug]` (Cloudflare Stream iframe). Kalite skoru cron: `avg_rating×12 + min(purchases,200)/200×20 + completion×0.15 − refund×0.5 + Bayesian shrinkage (<5 yorum)`.

**EsteStore (`/estestore`):** 3 katman marketplace (eski `/magaza` legacy). Roller: anonim/user tek perakende · HP/clinic 3 baremli + çizili fiyat · vendor kendi · admin tümü. RBAC matris: `src/lib/estestore.ts`. Çift taksonomi: Hasta 18 kategori, Klinik 24 kategori (doktor view toggle). `[slug]/page.tsx` çift fallback (3 section + 42 kategori).

**Admin (`/admin`):** kullanıcılar (rol/aktif) · klinikler (onay + eğitmen + kredi) · saticilar (KYC kararı, Stripe Connect, şüphe bayrakları: sahte e-posta/vergi/firma adı/anında giriş-kayıp/Stripe başlatılmamış) · ürünler · kuponlar · iadeler · içerik (CMS) · audit · hesap (test mail butonu).

---

## 12. Bildirim & Cron

**E-posta (`notifications.ts`):** `sendEmail` & `sendEmailDetailed` — Resend dener → fail/yoksa Postmark → ikisi de yoksa `console.warn`. Provider tespiti: messageId UUID = Resend. Şablonlar: `tmplAppointmentConfirmed`, `tmplAppointmentReminder`, `tmplScoreUpdate`, `tmplFailedLoginAlert`; 4 rol welcome.

**SMS (`netgsm.ts`):** OTP + admin OTP + randevu hatırlatma. Türkçe karaktersiz, max 155 char.

**Cron (Hobby plan günlük):**
| Path | Saat | İş |
|---|---|---|
| `/api/cron/notifications` | 09:00 UTC | notification_queue işle |
| `/api/cron/clinic-egp` | 03:00 UTC | clinic_egp Bayesian smoothing |
| `/api/cron/akademi-quality-score` | 03:00 UTC | course_packages.quality_score |

Header: `Authorization: Bearer ${CRON_SECRET}`. Saatlik istenirse Pro plan.

---

## 13. 3-Galaksi Mimarisi (canlıda)

Estelongy görünmez çatı, 3 galaksi öne çıkar:
- **BiyoAGE** (biyoage.com, mor `#1B1330/#241942`, DNA/biyoaging zemini)
- **EsteKlinik** (esteklinik.com, klinik otorite)
- **EsteStore** (estelongy.store, krem-altın + emerald)

**Routing:** `/biyoage/*`, `/esteklinik/*`, `/estestore/*` + `?g=<galaxy>` + DB `signup_source`. Tek üyelik / 3 galaksi (Supabase SSO). Vendor BiyoAGE'e giremez. Web tek site / mobile 3 ayrı app planlı (reverse proxy: biyoage.com → /biyoage prefix).

**SafeLink (`src/components/SafeLink.tsx`):** galaksi-aware Link wrapper — yeni `<Link>` doğrudan kullanılmaz. `AUTH_GATED_ROUTES` map: `/skor`→biyoage, `/odeme`→estestore, `/panel/siparislerim|iadelerim`→estestore, `/panel/kurslarim`→esteklinik, `/panel`→null. Auth yoksa `/giris?g=<galaxy>&next=<href>`.

**Geçiş dili KURALI:** yıldız/uzay metaforu YASAK. DNA / biyoaging / hücresel pulse zemin. `GalaxyTransition` overlay 3.8s (DURATION_MS=3800, NAV_AT_MS=3200).

---

## 14. OTP State Machine

`idle → sending → entering → verifying → verified → error`. `AdminOtpForm.tsx` (60s cooldown, amber) ve `PhoneOtpStep.tsx` (180s cooldown, violet).

**Stale closure tuzağı (öğrenilmiş):** 6 hanede auto-submit'te `verify()` eski `code` state'ini okur. Fix:
```ts
async function verify(e?: React.FormEvent, submittedCode?: string) {
  const c = submittedCode ?? code
  // ... c ile doğrula
}
// onChange: if (next.length === 6) verify(undefined, next)
```

---

## 15. Geliştirme Tuzakları

- `'use client'` bileşeninde `export const dynamic = 'force-dynamic'` **KULLANMA** (sadece server page).
- Server action'larda `redirect()` **try/catch dışında** olmalı (throw eder).
- Server action'larda **`Promise.all` ile birden fazla supabase write yapma** — sequential await + `.select('id')` rows-affected check, 0 satır = `throw`.
- Status değiştiren action'larda ilgili tüm path'lere `revalidatePath` çağır + sonrası `router.refresh()`.
- `await cookies()` ve `await createClient()` (Next 15+ async).
- JSX escape: `'` → `&apos;` · `"` → `&quot;` (ESLint).
- Auth callback `next` query: sadece `/` ile başlıyorsa kabul (open redirect koruması).
- `gpt-4o-mini` down → `generateFallback()` rastgele skor (sessiz fail yok, kullanıcıya gösterilir).
- Supabase update count: `.update(values, { count: 'exact' })` — `.select('id', { count, head: true })` chain'le **KARIŞTIRMA** (imza hatası).
- Yeni UI iş öncesi mevcut helper'ları tara: `SafeLink`, `GalaxyLink`, `GalaxyTransition`, `BackButton`, `AuthStatusProvider`, `MuhasebeShellClient`, `slot-utils`, `TimeSlotPicker`, `RandevuTakvim`, `RandevuListClient`.

---

## 16. Deploy & Operasyon

```bash
git checkout claude/priceless-ellis     # ASLA main'e push etme
git add -A && git commit -m "..."
npm run build                            # ZORUNLU
vercel --prod --yes
```

**DB migration:** Supabase MCP `apply_migration` · project_id `dcmnxmqzimrgmholktid` · SQL inline.

**Env ekleme:** `vercel env add VAR production` → rebuild.

**Rollback:** `vercel alias set <eski-deployment-url> estelongy-clean.vercel.app`.

**Loglar:** `vercel logs <url>` · Sentry dashboard.

---

## 17. Sorun Giderme

| Belirti | Çözüm |
|---|---|
| Mail gitmedi | RESEND_API_KEY var mı (`vercel env ls`) → Resend Dashboard Logs (UUID messageId Resend) → Postmark Activity (fallback) → DKIM/SPF Verified mi → console.warn |
| SMS gitmedi | NETGSM_* env · telefon E.164 · Netgsm bakiye · Upstash 3dk rate limit |
| Login lockout | Upstash `login_lockout:<ip>` sil veya 15dk bekle |
| Admin OTP istemiyor | `admin_otp:verified:<uid>` süresi geçti, yeniden giriş |
| Vendor approve olmuyor | DB trigger `kyc_status='approved'` şart |
| RLS hatası | `await createClient()` cookie'li client · servis için `createServiceClient()` (server-only) |
| Hesap silinmiyor | Aktif sipariş var (`status NOT IN completed/cancelled/refunded`) |
| Build `react/no-unescaped-entities` | `'`→`&apos;`, `"`→`&quot;` |

---

## 18. Mimari Kararlar (Neden böyle?)

- **Resend primary + Postmark fallback:** Postmark approval uzayınca lansmanı kilitlememek için. ENV-tabanlı geçiş, zero downtime, ayrı DNS namespace (`resend._domainkey` vs `pm._domainkey`), messageId formatı ile gözlemlenebilirlik.
- **Vercel + Supabase:** Next.js 14 server actions için en iyi platform + Postgres+Auth+Storage tek pakette + TR düşük latency.
- **Vestoriq Estonya:** TR'de Stripe yok; e-residency ile uzaktan kurulum + AB üyesi.
- **3-tier pricing:** Vendor tek üründen hem perakende hem toptan satabilsin; profesyoneller doğal olarak büyük adetli alır → indirim. Kozmetikte ilk barem min %10.
- **Akademi ayrı tablo (course_*):** Entry point ayrı, Stripe TRY + Cloudflare Stream player; EsteStore ile karıştırmamak için.
- **DB function ile cascade silme:** Atomik (yarım silme yok); tek transaction, hata→rollback; SECURITY DEFINER RLS bypass.
- **Upstash Redis:** Vercel serverless edge → her request farklı pod → in-memory rate limit çalışmaz. REST tabanlı edge uyumlu.
- **CSP unsafe-inline:** Next inline + Tailwind JIT nonce'suz çalışmaz. frame-ancestors none + script-src whitelist ile yüzeyi daralt.
- **Galaksi sızıntısı → SafeLink merkezi helper:** 212 noktada manuel düzeltmek yerine tek wrapper + bulk migration. Bundan sonra yeni `<Link>` doğrudan kullanılmamalı.

---

## 19. Lansman Pusulası

**🔴 Bloker:** Stripe Live (Vestoriq KYC) · Tetkik puanı algoritması · `estelongy.com` → Vercel projesi bağla (5dk).
**🟡 Önemli:** Cloudflare Email Routing (mailbox'lar) · resmi KVKK politika (avukat) · Cloudflare Stream $5/ay · Sentry DSN doğrula · Search Console+sitemap submit.
**🟢 Hazır:** Auth (4 rol+OTP+brute force) · step-up · security headers · KVKK cascade · audit log · şifre policy · failed login uyarı · e-posta değiştirme · Vendor KYC · security.txt · Resend+Postmark.
**🔵 Sonrası:** Rebrand (mor → koyu yeşil `#059669` + gold `#d97706` + navy klinik) · TOTP · RLS pen test · bug bounty · Klinik yorum sistemi · Mobil app · FCM push · EN/KR dil · **ELS akreditasyon kuruluşu** (asıl moat).

---

## 20. Roadmap Fork (açık karar)

3 eksen — baş mimar seçecek:

1. **EGP biyolojik yaş motoru** — EXPLICIT PAUSE. Başlangıç katalog: HA Dolgu 9.2 · Skin Booster 8.5 · GK 8.5 · Botoks 7.0 · Altın İğne 6.5.
2. **Commercial-readiness** — Stripe critical-path test (browse→cart→checkout) · `force-dynamic` audit (30+ route → sadece auth/OTP/ödeme) · test user güvenlik denetimi · Vercel iki-proje karışıklığı.
3. **Marka olgunluğu** — rehber içerik · klinik+vendor onboarding · katalog 14→ticari ölçek · arama/öneri/cart-abandonment/email-recovery · galaksi-spesifik içerik hiyerarşisi.

Küçük askıda: /panel ve /admin accent (galaksi nötr mü, krem-altın mı?) · Vestoriq min €0.50 etrafında fiyatlama disiplini.

---

## 21. Terminoloji

| Terim | Tanım |
|---|---|
| **Skor** | Estelongy Gençlik Skoru® (hastaya ait, 0-100) |
| **EGP** | Estelongy Gençlik Puanı (nesneye ait, 0-10) |
| **C250** | gpt-4o-mini Vision'dan türetilen ham EGS |
| **EGS** | Skorun eski adı (kodda yer yer kalmış: `src/lib/egs.ts`) |
| **Estelog** | Skor bazlı, protokol odaklı estetik hekim (yeni meslek tanımı) |
| **ELS** | Estelongy Longevity Standartları (akreditasyon kuruluşu, Faz 3) |
| **KOL** | Key Opinion Leader (eğitmen klinik/hekim) |
| **Kredi** | Klinik randevu hakkı (eski "jeton" rebrand) |
| **Step-up auth** | Kritik aksiyonda son 5dk taze SMS |
| **Sprint A/B/C/D** | Güvenlik backlog: A=kritik, B=Vendor KYC, C=hardening, D=lansman sonrası |

---

## 22. İletişim

- Kurucu: İzzet Gök · estelongy@gmail.com
- Admin: estelongy@gmail.com, dr.izzetgok@gmail.com (her ikisi +90 5****5003)
- DPO/KVKK: kvkk@estelongy.com (mailbox kurulacak) · Güvenlik: guvenlik@estelongy.com · Destek: destek@estelongy.com

---

**Bu doküman canlıdır.** Yeni özellik / env / akış güncellemesi → buraya yansıt. Detaylı tarihsel devir: `CLAUDEeski2.md`.
