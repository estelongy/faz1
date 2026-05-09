# CLAUDE.md — Estelongy Sistem Devir Dokümanı

> Bu dosyayı okuyan kişi, **arsadan mutfaktaki tablonun yerine kadar** tüm süreci anlayabilmelidir. Hangi servis, hangi env var, hangi dosya, hangi RPC nerede, hangi cron ne yapar — hepsi burada.

**Son güncelleme:** 2026-05-08
**Aktif branch:** `claude/priceless-ellis` (production)

---

## 0. Proje Kimliği

**Estelongy** — estetik sağlık ve longevity (uzun ömür) odaklı 5 katmanlı dikey platform.

| Katman | Ne yapar |
|---|---|
| 1. **Standart** | "Estelongy Gençlik Skoru" — selfie + anket + (klinik tetkik) → 0-100 sağlık-cilt skoru |
| 2. **Ekosistem** | Klinik (estetik hekimi) + Sağlık Pro (KOL/eğitmen) + Vendor (kozmetik/sarf satıcısı) + Hasta birbirine bağlı |
| 3. **Yolculuk** | Her hasta için randevu → analiz → tetkik → hekim onayı zincirli ziyaret kartları |
| 4. **Marketplace** | EsteStore (kozmetik & sarf medikal) — vendor 3-baremli tier pricing, profesyonele indirimli |
| 5. **SaaS** | Akademi — eğitmen klinikler video paketleri satar (%70/%30 split) |

**Pozisyonlama:** "Genç görünmek değil **sağlıklı görünmek**". IMDb'nin sinema için yaptığını estetik için yapar (ölçer, sıralar, akredite eder).

**Ana moat:** ELS — Estelongy Longevity Standartları (akreditasyon kuruluşu, lansman sonrası faz 3).

**Kurucu:** Dr. İzzet Gök (estetik hekimi). İletişim: estelongy@gmail.com

---

## 1. Hesap & Servis Envanteri

> Kullanıcının kayıt olduğu ama isim hatırlamadığı tüm dış servisler. Her biri için: **giriş adresi, hesap mail'i, kritik veriler.**

### 1.1 Vercel (hosting, deploy, edge functions)
- **Hesap:** estelongy@gmail.com
- **Team ID:** `team_6KIGU5JvMoWBV5To6nncBNnc`
- **Slug:** `estelongy-3655s-projects`
- **Projeler:**
  - `faz-1` (prj_qQ0N5SSfH8kqaY61qyiAFIOy9pVS) — **AKTİF** (production)
  - `drizzetgok-site` — ayrı (kurucu kişisel sayfa, izzetgok.vercel.app)
- **Production URL:** `https://estelongy-clean.vercel.app` (faz-1 projesinin alias'ı)
- **Custom domain:** `estelongy.com` — domain alındı, henüz projeye bağlanmadı (5 dk iş)
- **Plan:** Hobby (saatlik cron yok — günlük 9:00 UTC çalışır)

### 1.2 Supabase (DB + Auth + Storage)
- **Hesap:** estelongy@gmail.com
- **Project ref:** `dcmnxmqzimrgmholktid`
- **URL:** `https://dcmnxmqzimrgmholktid.supabase.co`
- **Dashboard:** https://supabase.com/dashboard/project/dcmnxmqzimrgmholktid
- **Plan:** Free (production trafiğinde Pro'ya çıkılmalı)
- **Edge Function:** `send-appointment-email` (deployed)

### 1.3 Stripe (ödeme)
- **Hesap işleten şirket:** Vestoriq OÜ (Estonya — kurulum sürecinde)
- **Mod:** TEST (live key Vestoriq KYC sonrası)
- **Min satış:** €0.50 (~16 TL) — küçük tutarlı ürünlerde sorun olabilir
- **Hesap mail:** estelongy@gmail.com
- **Webhook URL (live):** `https://estelongy-clean.vercel.app/api/stripe/webhook`
- **Connect:** Vendor satışları için Connect Express hesapları

### 1.4 Postmark (transactional email)
- **Hesap:** estelongy@gmail.com
- **Server ID:** 19148696 ("My First Server")
- **Sender domain:** estelongy.com (DKIM + SPF + Return-Path doğrulandı)
- **From adres:** `noreply@estelongy.com` (mailbox değil, sender signature)
- **Stream:** `outbound` (Default Transactional)
- **Durum:** `pending approval` — Postmark hesap onayı bekleniyor (1 iş günü). Onay gelene kadar sadece `@estelongy.com` adresine mail uçar.

### 1.5 Netgsm (SMS sağlayıcı)
- **Hesap:** İzzet Gök
- **Header:** ESTELONGY
- **API:** Netgsm SMS API (https://api.netgsm.com.tr)
- **Kullanım:** OTP kayıt + admin OTP step-up + randevu hatırlatma

### 1.6 Upstash Redis (rate limit + OTP storage)
- **Hesap:** estelongy@gmail.com
- **Plan:** Free
- **Kullanım:** OTP kodu, OTP rate limit, login brute-force lockout, admin OTP fresh check, failed login uyarı counter

### 1.7 OpenAI (gpt-4o-mini Vision)
- **Hesap:** estelongy@gmail.com
- **Kullanım:** `/api/analiz` endpoint'inde selfie analizi (5 cilt bileşeni → C250 formülü)
- **Aylık limit:** prepaid $5-10 yeterli (rate limit 5 istek/saat/IP)

### 1.8 Cloudflare Stream (video hosting)
- **Hesap:** estelongy@gmail.com
- **Plan:** SUBSCRIBE EDİLMEDİ — akademi videoları için $5/ay gerekli
- **Kullanım:** Akademi paket videoları, iframe player

### 1.9 Sentry (hata izleme)
- **Hesap:** estelongy@gmail.com
- **Org:** estelongy
- **Project:** estelongy
- **Durum:** SDK kurulu, DSN env'e girildiyse aktif

### 1.10 Cloudflare (DNS + Email Routing)
- **Domain:** estelongy.com NS olarak Vercel DNS kullanıyor (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`)
- **Email Routing:** önerildi ama henüz kurulmadı. Şu an `admin@`, `info@`, `kvkk@`, `guvenlik@`, `destek@` gibi mail adresleri var **sayılır** (DNS'te tanımlı değil) — security.txt ve KVKK politikasında geçiyor ama gerçek mailbox yok. **Yapılacak:** Cloudflare Email Routing → estelongy@gmail.com'a forward.

### 1.11 GitHub (code hosting)
- **Repo:** Bilinmiyor — Vercel doğrudan branch deploy ediyor (Git tarafı dolaylı)
- **Aktif branch:** `claude/priceless-ellis`
- **Master:** kullanılmıyor

---

## 2. Stack & Teknoloji

```
Framework:        Next.js 14.2.35 (App Router, RSC, server actions)
Dil:              TypeScript 5.x
Stil:             Tailwind CSS 3 (slate/violet palet)
DB:               Supabase PostgreSQL 17 + RLS
Auth:             Supabase Auth (@supabase/ssr cookie tabanlı)
Storage:          Supabase Storage (S3 uyumlu, RLS'li)
AI:               OpenAI gpt-4o-mini (Vision)
Ödeme:            Stripe (Checkout + Connect Express + Webhook)
E-posta:          Postmark API (X-Postmark-Server-Token, MessageStream='outbound')
SMS:              Netgsm REST API
Cache/RL:         Upstash Redis REST + @upstash/ratelimit
Video:            Cloudflare Stream (iframe player)
Hata izleme:      Sentry (@sentry/nextjs)
Hosting:          Vercel (production: estelongy-clean.vercel.app)
Branş yönetimi:   Vercel native git deploy + manuel `vercel --prod --yes`
```

---

## 3. Repo Yapısı

```
estelongy-faz1/
├── public/
│   ├── .well-known/security.txt   ← RFC 9116 sorumlu açıklama
│   └── ... (manifest, robots, opengraph)
├── src/
│   ├── app/                        ← Next.js App Router
│   │   ├── (public)/               ← /, /rehber, /hakkinda, /guvenlik
│   │   ├── giris, kayit            ← Auth
│   │   ├── kurumsal/giris          ← Klinik/Satıcı/Sağlık Pro hesap tipi
│   │   ├── kurumsal/saglik-profesyoneli/kayit
│   │   ├── auth/update-password    ← Şifre sıfırlama landing
│   │   ├── analiz                  ← Selfie analiz akışı
│   │   ├── skor                    ← Skor merkezi (anket modal)
│   │   ├── randevu                 ← Klinik listesi + randevu
│   │   ├── magaza, sepet, siparis  ← E-ticaret (eski mağaza)
│   │   ├── estestore               ← YENİ marketplace (3 tier)
│   │   ├── akademi                 ← KOL eğitim marketplace
│   │   ├── panel/                  ← Hasta paneli
│   │   │   ├── hesabim             ← Profil + KYC + hesap silme
│   │   │   ├── analizlerim, randevularim, siparislerim, iadelerim
│   │   │   ├── adreslerim, kurslarim, referral, leaderboard
│   │   │   ├── degerlendir         ← Klinik yorum (placeholder)
│   │   │   └── ...
│   │   ├── klinik/
│   │   │   ├── basvur              ← Klinik başvuru
│   │   │   └── panel/              ← Klinik dashboard V2
│   │   │       ├── takvim, hastalarim, randevu/[id]
│   │   │       ├── akademi/basvur, akademi/paketler
│   │   │       └── ...
│   │   ├── satici/
│   │   │   ├── basvur
│   │   │   └── panel/
│   │   │       ├── kyc             ← YENİ: vergi levhası, IBAN, KEP, sözleşme
│   │   │       ├── urunler, urun-actions, siparisler, kazanc, iadeler
│   │   │       └── odeme-hesabi    ← Stripe Connect onboarding
│   │   ├── admin/
│   │   │   ├── kullanicilar, klinikler, saticilar, urunler
│   │   │   ├── kuponlar, iadeler, icerik
│   │   │   ├── audit               ← YENİ: audit log viewer
│   │   │   └── hesap               ← Admin şifre + Postmark test
│   │   └── api/                    ← Tüm endpoint'ler (bkz. Bölüm 13)
│   ├── components/                 ← Reusable UI
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts           ← @supabase/ssr server (cookie tabanlı)
│   │   │   ├── client.ts           ← Browser client
│   │   │   └── service.ts          ← service_role (RLS bypass, server-only)
│   │   ├── auth-redirect.ts        ← pathForRole(role) → /admin, /klinik/panel, vs.
│   │   ├── admin-otp.ts            ← Admin OTP fresh-check helper'ları
│   │   ├── audit.ts                ← writeAuditLog() helper
│   │   ├── login-ratelimit.ts      ← Brute-force lockout + failed login email helper
│   │   ├── ratelimit.ts            ← Eski memory rate limit (analiz, auth)
│   │   ├── redis.ts                ← Upstash Redis singleton + Ratelimit factory
│   │   ├── notifications.ts        ← sendEmail (Postmark) + tmpl* fonksiyonları
│   │   ├── email-templates.ts      ← tmplFailedLoginAlert
│   │   ├── welcome-email.ts        ← 4 rol için hoş geldin maili
│   │   ├── signup-policy.ts        ← Kayıt validasyonu (e-posta, şifre, IP RL)
│   │   ├── netgsm.ts               ← SMS gönderme
│   │   ├── estestore.ts            ← 3-tier pricing + RBAC matris
│   │   ├── journeys.ts             ← Ziyaret yolculuk yönetimi
│   │   ├── jeton.ts                ← Klinik kredi sistemi
│   │   ├── egs.ts                  ← Skor formülü (clamp, colorZone)
│   │   ├── anket-sorular.ts        ← Longevity anketi soruları
│   │   ├── tetkik-params.ts        ← Tetkik parametre listesi (algoritma yarım)
│   │   └── ...
│   ├── middleware.ts               ← Admin OTP gate
│   └── instrumentation.ts          ← Sentry init
├── next.config.mjs                 ← Security headers + CSP
├── package.json
└── CLAUDE.md                       ← bu dosya
```

---

## 4. Ortam Değişkenleri (Tam Liste)

> Hepsi Vercel Production environment'a girilmeli. Eksik olanların etkileri belirtildi.

### 4.1 Zorunlu (eksikse uygulama çöker)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://dcmnxmqzimrgmholktid.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...               # public, RLS'li
SUPABASE_SERVICE_ROLE_KEY=eyJ...                   # GİZLİ — RLS bypass
```

### 4.2 Ödeme
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...     # şu an test
STRIPE_SECRET_KEY=sk_test_...                       # GİZLİ
STRIPE_WEBHOOK_SECRET=whsec_...                     # webhook signature
```

### 4.3 E-posta (Postmark)
```bash
POSTMARK_API_TOKEN=<server token>                   # GİZLİ — Postmark My First Server
FROM_EMAIL=noreply@estelongy.com                    # sender signature (mailbox değil)
```
Eksikse: Mail sessiz fail (`console.warn` + return false). Welcome/OTP/randevu mailleri uçmaz.

### 4.4 SMS (Netgsm)
```bash
NETGSM_USERCODE=<usercode>
NETGSM_PASSWORD=<password>                          # GİZLİ
NETGSM_MSGHEADER=ESTELONGY
```
Eksikse: SMS OTP çalışmaz → kayıt akışı kırılır.

### 4.5 Rate limit / OTP cache
```bash
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=<token>                    # GİZLİ
```
Eksikse: OTP rate limit çalışmaz, login brute-force korumasız, admin step-up auth bozulur.

### 4.6 OpenAI
```bash
OPENAI_API_KEY=sk-proj-...                          # GİZLİ
```
Eksikse: `/api/analiz` fallback (rastgele) skor üretir.

### 4.7 Sentry
```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@o....ingest.sentry.io/...
SENTRY_ORG=estelongy
SENTRY_PROJECT=estelongy
```
Eksikse: Hata izleme yok ama uygulama çalışır.

### 4.8 Cron
```bash
CRON_SECRET=<32-char-rastgele>                       # cron header doğrulaması
```
Eksikse: Cron endpointleri reddedilir.

### 4.9 Cloudflare Stream (akademi video)
```bash
NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE=<customer_code>
CLOUDFLARE_ACCOUNT_ID=<account_id>
CLOUDFLARE_STREAM_TOKEN=<api_token>                  # GİZLİ
```
Eksikse: Akademi videosu "video hazırlanıyor" placeholder gösterir.

### 4.10 SEO
```bash
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<google_verify_code>
```
Eksikse: Search Console doğrulama yapılamaz.

---

## 5. Veritabanı Şeması

### 5.1 Şema haritası — ana tablolar

```
auth.users (Supabase Auth) ←→ public.profiles (1:1, FK profiles.id = auth.users.id)
                                      │
              ┌───────────────────────┼─────────────────────────┐
              │                       │                         │
         vendors                  clinics                  health_pro
         (vendor user_id)         (clinic user_id)         (rolü hp olan profiles)
              │                       │
        ┌─────┴─────┐           ┌────┴─────────┐
     products    orders    appointments     analyses
        │           │            │              │
   product_imgs  order_items  scores       longevity_surveys
        │                          │
   tier_pricing                journeys
```

### 5.2 Profiles (kullanıcı kimliği)
```sql
profiles (
  id              uuid PK = auth.users.id
  role            user_role ENUM
                  → 'user' | 'health_professional' | 'clinic' | 'vendor' | 'admin'
  full_name       text
  phone           text         -- E.164 (+905XX...)
  phone_verified  boolean      -- SMS OTP doğrulandı mı
  birth_year      smallint     -- 18+ kontrolü
  avatar_url      text
  is_active       boolean
  points_balance  integer      -- 1 puan ≈ 1 TL
  referred_by     uuid → profiles(id) ON DELETE SET NULL
  signup_bonus_applied         boolean  -- +20 puan
  first_appointment_bonus_applied boolean -- davet eden +50
  first_order_bonus_applied    boolean   -- davet eden %5
  hp_title        text  -- 'Dr.', 'Uz.Dr.', 'Op.Dr.', 'Prof.', 'Doç.', 'Diş.Hek.', 'Hemşire', 'Eczacı', 'Tıp.Öğr.'
  hp_specialty    text
  hp_institution  text
  hp_declared_at  timestamptz
)
```

**Rol senkronizasyonu:** `app_metadata.role` (auth.users) **tek kaynak**. `profiles.role` ondan türetilir. RPC: `set_user_role(target_user_id, new_role)` ikisini de günceller.

### 5.3 Vendors (satıcı + KYC)
```sql
vendors (
  id                       uuid PK
  user_id                  uuid → profiles(id) (NO ACTION)
  company_name             text NOT NULL
  approval_status          ENUM 'pending'|'approved'|'rejected'
  is_active                boolean
  balance                  numeric  -- birikmiş kazanç (anlık)
  commission_rate          numeric  -- default 0.12

  -- Stripe Connect
  stripe_account_id        text
  stripe_charges_enabled   boolean
  stripe_payouts_enabled   boolean
  stripe_details_submitted boolean

  -- KYC (Sprint B)
  kyc_status               text 'not_submitted'|'pending'|'approved'|'rejected' DEFAULT 'not_submitted'
  kyc_submitted_at         timestamptz
  kyc_reviewed_at          timestamptz
  kyc_reviewer_id          uuid → profiles(id)
  kyc_review_note          text

  -- Belgeler (vendor-kyc bucket içinde path)
  tax_certificate_url      text  -- vergi levhası
  contract_signed_url      text  -- ıslak imzalı sözleşme PDF (opsiyonel)
  its_certificate_url      text  -- ITS belgesi (tıbbi ürün için zorunlu)

  -- Banka
  iban                     text
  iban_holder_name         text
  bank_name                text

  -- Kurumsal kimlik
  tax_number               text  -- vergi/T.C. no (10-11 hane)
  trade_registry_no        text
  mersis_no                text  -- 16 hane
  kep_address              text
  company_address          text
  sells_medical_products   boolean DEFAULT false  -- ITS zorunluluk şartı
  phone                    text
)
```

**Trigger:** `enforce_vendor_kyc_before_approval()` — `kyc_status='approved'` olmadan `approval_status='approved'` yapılamaz.

### 5.4 Clinics (klinik + akreditasyon)
```sql
clinics (
  id                            uuid PK
  user_id                       uuid → profiles(id)
  name, slug, location, bio, specialties, phone, certificate_url
  approval_status               ENUM
  is_active                     boolean
  clinic_type                   text

  -- Akademi eğitmen
  is_educator                   boolean
  educator_application_status   text 'none'|'pending'|'approved'|'rejected'
  educator_application_message  text  -- ≥50 char
  educator_bio                  text  -- public eğitmen bio
  educator_marked_at, educator_decided_at, educator_decision_note

  -- Klinik kredi sistemi (jeton)
  jeton_balance                 integer
  jeton_settings                jsonb
  free_appointments_remaining   integer DEFAULT 20  -- yeni kliniğe hediye
  appointment_credit_price      numeric              -- ücretli mod fiyatı
  paid_appointments_this_month  integer
  paid_mode_accepted_at         timestamptz

  -- EGP (klinik puanı)
  review_count, avg_operational, avg_nps, clinic_egp, clinic_egp_updated_at
)
-- VIEW: clinics_with_credit_status (total_credit_balance hesaplanmış)
```

### 5.5 Skor zinciri
```sql
analyses (
  id, user_id (profiles), doctor_id, clinic_id, appointment_id
  web_ai_raw           jsonb  -- gpt-4o-mini ham çıktısı
  web_scores           jsonb  -- C250 hesap detayları
  doctor_approved_scores jsonb  -- { tetkik, ileri_analiz_c250, hekim_skoru }
  doctor_notes         text
  selfie_url           text   -- analyses bucket
)

scores (
  id, user_id, clinic_id, appointment_id, analysis_id
  score_type           CHECK IN ('web','device','doctor_approved','final')
  toplam_puan          numeric        -- 0-100
  ham_puan             numeric        -- C250 ham
  yas_faktor           numeric        -- 0.88-1.02
  hasta_anket_puani    numeric        -- max +3.6
  klinik_anket_puani   numeric        -- max +7.2 (10 soru)
  tetkik_puan          numeric        -- ALGORİTMA YARIM — bekleniyor
  ileri_analiz_c250    numeric
  hekim_skoru          numeric        -- klinik hekim subjektif (0-100)
  notes                text
)

longevity_surveys (
  id, user_id, analysis_id
  cevaplar             jsonb  -- 10 soru için cevap (0-100 slider)
  tipi                 'hasta' | 'klinik'  -- 5+5
)

journeys (
  id, user_id, baslangic_at, son_aktivite_at, status, ozet
  -- Yeni selfie aktif journey'e bağlanır
  -- Randevu completed → journey kapanır
)
```

**Final skor formülü:**
```
ara_toplam = ham_C250 × yas_faktor + hasta_anket + klinik_anket + tetkik
final      = ara_toplam × 0.85 + hekim_skoru × 0.15
```

### 5.6 E-ticaret + EsteStore
```sql
products (
  id, vendor_id, name, slug, description, ingredients (text[])
  category text  -- 'kozmetik' | 'sarf_medikal' (yeni) ya da 'botox|filler|mezo|laser|gold_needle|peeling|serum|supplement|device|other' (eski)
  treatment_type text 'product' | 'treatment'  -- treatment = klinik işlemi (cam reklam)
  price numeric, stock integer
  pricing_tiers jsonb
    -- [{min, max, price, label}, ...]  -- 3-baremli, ilk bareem profesyonel indirimi
  approval_status, is_active, images (text[])
  egp jsonb { doctor, user, manufacturer, scientific }
  final_score numeric  -- doctor*0.4 + user*0.35 + manufacturer*0.15 + scientific*0.10
)

product-images bucket  -- public, 5MB, image/* (jpeg/png/webp)
```

**EsteStore RBAC matrisi (`src/lib/estestore.ts`):**
- Anonim: `pricing_tiers` görünmez, sadece tek "perakende" fiyat
- `user`: aynı (perakende fiyat)
- `health_professional`, `clinic`: tüm baremler + çizili eski fiyat
- `vendor`: kendi ürünlerini düzenleyebilir
- `admin`: tüm ürünler, onay yetkisi

**Akademi paketleri (ayrı):**
```sql
course_packages (id, clinic_id, slug, title, description, price, level, category, ...)
course_videos (id, package_id, stream_uid, stream_status, order_index, title)
course_purchases (id, user_id (SET NULL), package_id, status, paid_at, ...)
course_progress (id, user_id, video_id UNIQUE, progress_pct, completed)
course_reviews (id, user_id (SET NULL), package_id, rating, comment)
```

### 5.7 Bildirim + audit
```sql
notification_queue (id, user_id, type ENUM('email','sms','push'), payload jsonb, status, scheduled_at, error_message)

audit_logs (
  id, user_id (profiles, SET NULL),
  action text  -- 'role_change' | 'vendor_approval' | 'clinic_approval' | ...
  table_name, record_id
  old_data, new_data jsonb
  ip_address, user_agent
  created_at timestamptz
)
```

### 5.8 RPC fonksiyonları (kritik)
```sql
set_user_role(target_user_id uuid, new_role user_role)
  -- app_metadata.role + profiles.role senkron günceller

consume_jeton(p_clinic_id uuid)
  -- Önce free_appointments_remaining'den düşer
  -- Sonra jeton_balance'tan düşer
  -- Hiçbiri yoksa exception fırlatır
  -- jeton_transactions kaydı oluşturur

generate_referral_code(p_user_id uuid)
decrement_product_stock(p_product_id uuid, p_quantity integer)
adjust_points(p_user_id uuid, p_delta integer, p_reason text)
add_jeton(p_clinic_id uuid, p_amount integer, p_description text)

app_delete_account_cascade(p_user_id uuid) RETURNS jsonb
  -- KVKK/GDPR cascade silme — Bölüm 11 detayında
```

### 5.9 Trigger'lar
- `enforce_vendor_kyc_before_approval` — vendor approve'a KYC zorunlu
- `set_updated_at` — generic timestamp güncelleyici (birden fazla tabloda)

---

## 6. Storage (Supabase)

| Bucket | Public? | Limit | MIME | Kullanım |
|---|---|---|---|---|
| `analyses` | ❌ private | 8 MB | image/* + heic/heif | Selfie analizi (şu an base64 üzerinden GPT'ye gidiyor, bucket pratik kullanılmıyor) |
| `product-images` | ✅ public | 5 MB | image/jpeg, png, webp | Ürün görselleri |
| `vendor-kyc` | ❌ private | 10 MB | image/* + application/pdf | Vergi levhası, ITS, sözleşme |

**RLS (vendor-kyc):**
- INSERT/SELECT/DELETE: vendor kendi `<vendor_id>/...` klasörüne erişebilir
- SELECT: admin tüm bucket'ı görebilir
- Path konvansiyonu: `vendor-kyc/<vendor_id>/<slot>-<timestamp>.<ext>`

Admin signed URL'leri 1 saat geçerli (`createSignedUrls` ile).

---

## 7. Auth Akışı

### 7.1 Kayıt akışları (4 farklı)

| Endpoint | Rol | Akış |
|---|---|---|
| `/kayit` | `user` (hasta) | E-posta + şifre + telefon → SMS OTP → `auth.signUp` → +20 puan + welcome mail |
| `/kurumsal/saglik-profesyoneli/kayit` | `health_professional` | E-posta + şifre + tel + ünvan + uzmanlık + KVKK onayı → SMS OTP → `auth.signUp` (rol app_metadata) |
| `/kurumsal/giris` (mode=kayit) | `clinic` veya `vendor` | E-posta + şifre + tel + isim → SMS OTP → `/api/kurumsal/kayit` → role 'user' (sonra başvuru) |
| **(Yok)** | `admin` | Sadece DB seviyesinde manuel: `set_user_role(uid, 'admin')` |

**Tüm kayıtlarda ortak (`src/lib/signup-policy.ts`):**
- E-posta sözdizimi + disposable blocklist (50+ domain: 10minutemail, mailinator, vb.)
- IP başına saatte 3 kayıt rate-limit (Upstash sliding window)
- Şifre min 8 karakter + yaygın parola listesi blok
- SMS OTP zorunlu (Netgsm + Upstash, 3 dk pencere, saatte 5 deneme)

### 7.2 Login akışı

`/giris` (hasta) ve `/kurumsal/giris` (kurumsal) — ikisi de `/api/auth/login` POST eder.

```
POST /api/auth/login { email, password }
  ├─ IP brute-force kontrolü (Upstash)
  │     └─ 10 yanlış/dk → 15 dk lockout
  ├─ Supabase signInWithPassword (server-side, cookie set eder)
  ├─ Başarılı → fail counter sıfırla, role döndür
  └─ Başarısız → IP counter++ + (kullanıcı varsa) hesap counter++
        └─ 3+ hatalı/24h → kullanıcıya uyarı maili (cooldown 24h)
```

**`pathForRole()` (`src/lib/auth-redirect.ts`):**
- `admin` → `/admin`
- `clinic` → `/klinik/panel`
- `vendor` → `/satici/panel`
- `health_professional` → `/panel`
- `user` (default) → `/panel`

### 7.3 Admin OTP (step-up auth)

**Admin login akışı:**
1. Şifre doğru → `/api/admin-otp/send` → telefon DB'den okunur → SMS gönderilir
2. `/giris/admin-otp` → 6 haneli kod → `/api/admin-otp/verify`
3. Başarılı → Upstash `admin_otp:verified:<userId>` 30 dk TTL
4. Middleware `/admin/*` için bu key'i zorunlu kılar

**Step-up (kritik aksiyonlar):**
`ensureAdminOtpFresh(userId, returnTo, maxAgeSec=300)` — son 5 dk içinde OTP doğrulanmamışsa `/giris/admin-otp?reason=step-up&next=<returnTo>` redirect.

Kapsadığı aksiyonlar:
- `set_user_role`, `toggleActive` (kullanıcılar)
- `updateVendor`, `decideKyc` (satıcılar)
- `updateClinic`, `toggleEducator`, `decideEducatorApplication`, `addJeton` (klinikler)
- `urunOnayAction` (ürünler)

---

## 8. Güvenlik Katmanı (canlıda)

### 8.1 HTTP başlıkları (`next.config.mjs`)
- **CSP:** `default-src 'self'`; script: self + unsafe-inline + js.stripe.com + sentry.io; connect: supabase.co + upstash.io + sentry + stripe; frame: stripe; `frame-ancestors 'none'`; `upgrade-insecure-requests`
- **HSTS:** `max-age=63072000; includeSubDomains; preload` (2 yıl)
- **X-Frame-Options:** `DENY`
- **X-Content-Type-Options:** `nosniff`
- **Referrer-Policy:** `strict-origin-when-cross-origin`
- **Permissions-Policy:** `camera=(self), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()`
- **Cross-Origin-Opener-Policy:** `same-origin`
- **API route'larında Cache-Control:** `no-store`

### 8.2 Brute-force koruması
- **IP başına:** 10 yanlış/dk → 15 dk lockout (`login_lockout:<ip>` Upstash)
- **Hesap başına:** 3+ yanlış/24h → uyarı maili (cooldown 24h)
- **Lockout TTL:** otomatik sona erer

### 8.3 RLS politikaları (özet)
- `profiles`: kullanıcı sadece kendi profilini günceller, admin tümü
- `analyses`, `scores`, `appointments`: kullanıcı sadece kendi kayıtları + (klinik için) atandığı klinik
- `vendors`, `products`: vendor sadece kendi kaydı
- `audit_logs`: kullanıcı asla göremez, service_role + admin sadece SELECT

### 8.4 Audit log (`src/lib/audit.ts`)
8 kritik admin aksiyonu wired:
- `role_change`, `user_active_toggle`
- `vendor_approval` (KYC + final approval)
- `clinic_approval`, `clinic_educator_toggle`, `clinic_educator_decision`, `clinic_jeton_grant`
- `product_approval`
- `gdpr_kvkk_delete` (DB cascade içinden)

Viewer: `/admin/audit` — filtreli (aksiyon, aktör, limit), JSON old/new diff.

### 8.5 Şifre politikası
- Min 8, max 128 karakter
- Kompozisyon kuralı yok (NIST 800-63B uyumlu)
- Yaygın parola blocklist: `12345678`, `password`, `qwerty12`, `11111111`, `password1`, vs.
- `validatePassword()` (`src/lib/signup-policy.ts`) tüm endpoint'lerde

### 8.6 Sorumlu açıklama
- `/.well-known/security.txt` — RFC 9116
- `/guvenlik` — politika sayfası, KVKK iletişim, scope, kapsam dışı kurallar
- İletişim: `guvenlik@estelongy.com` (DNS kurulmadı, fallback `estelongy@gmail.com`)

---

## 9. KVKK / GDPR Uyumluluk

### 9.1 Hesap silme cascade

`/panel/hesabim` → "Hesabımı Sil" → `deleteAccountAction` → DB function `app_delete_account_cascade(uuid)` → Supabase admin API `auth.admin.deleteUser()`.

**Veri kategorileri:**
| Hard delete | Anonimize (mali) | Anonimize (public) | İşletme askıya |
|---|---|---|---|
| addresses | orders | clinic_reviews | vendors (is_active=false, phone null) |
| analyses | course_purchases | course_reviews | clinics (is_active=false, phone null) |
| appointments | returns | reviews | |
| carts | transactions (FK SET NULL) | shared_cases | |
| journeys | | editorial_posts.created_by | |
| longevity_surveys | | coupons.created_by | |
| user_activity_streaks | | | |
| user_badges, referral_codes | | | |
| profiles (CASCADE: scores, point_transactions, notification_queue, course_progress, clinic_patient_notes) | | | |

**Kontroller:**
- Aktif sipariş varsa silme reddedilir (`status NOT IN completed/cancelled/refunded`)
- Admin kendini silemez
- VUK 5 yıl saklama: orders/transactions/course_purchases anonimize ama veri durur

### 9.2 Diğer KVKK altyapısı
- Hesap silme kullanıcı tarafından, destek müdahalesi gerektirmez
- `audit_logs` 12 ay tutulur (manuel temizlik)
- Sözleşme metni `/satici/panel/kyc` formunda inline (10 madde)
- **Eksik:** Resmi KVKK politika sayfası (yasal metin yazılmadı)

---

## 10. Modüller (Kullanıcı Tarafları)

### 10.1 Hasta Paneli (`/panel`)

**3 bölgeli landing:**
1. **Skor Durumu** — bar + faz rozeti + "Detay →"
2. **Sıradaki Adım** — duruma göre tek dinamik CTA:
   - Hiç analiz yok → "İlk analizini yap"
   - Klinik onaylı → "Skorun hazır, paylaş"
   - Aktif randevu → "Randevun: [tarih]"
   - Anket dolu, randevu yok → "Klinik randevusu al"
   - Ön analiz var, anket yok → "Anketi doldur, +10 puan"
3. **Yönetim Grid** — 8 ikon kart (Hesabım, Analizlerim, Randevularım, Siparişlerim, Adreslerim, İadelerim, Referrals, Lider Tablosu)

**Sağlık profesyoneli modu:** Aynı sayfa emerald tema. Sidebar farklı: Akademi/Kurslarım/Mağaza/Topluluk görünür, Yeni Analiz/Randevu gizli.

**Hesabım sayfası (`/panel/hesabim`):**
- Profil bilgisi (ad/soyad/doğum yılı)
- E-posta değiştirme akışı (Supabase çift onay)
- Telefon değiştirme (SMS OTP yeniden)
- Şifre değiştir (min 8)
- **Hesabımı Kalıcı Sil** (KVKK cascade)

### 10.2 Analiz Akışı (`/analiz`)

```
Selfie çek (kamera) → base64
  → POST /api/analiz (rate limit IP başına 5/saat)
    → gpt-4o-mini Vision call (5 cilt bileşeni)
    → C250 formülü → ham skor
    → yaş faktörü ile çarpım → final ham skor
  → analyses + scores tablolarına yaz
  → /skor?analysisId=xxx&open=anket → Longevity anketi açılır
```

**C250 ağırlıkları (`src/app/api/analiz/route.ts`):**
| Bileşen | Ağırlık | Yön |
|---|---|---|
| hydration | 0.25 | yüksek=iyi |
| tone_uniformity | 0.25 | yüksek=iyi |
| wrinkles | 0.25 | ters (100-değer) |
| pigmentation | 0.15 | ters |
| under_eye | 0.10 | yüksek=iyi |

**Yaş faktörü:** ≤25→1.02 · ≤35→1.00 · ≤45→0.97 · ≤55→0.93 · 56+→0.88

### 10.3 Skor Merkezi (`/skor`)
- Anket modal (5 hasta sorusu, 0-100 slider)
- Randevu CTA modal
- Ürün önerileri modal (skora göre)
- Skor paylaş kartı

**Skor bölgeleri:**
- <55 Çok Düşük (kırmızı)
- 56-65 Düşük (turuncu)
- 66-79 Normal (amber)
- 80-89 İyi (yeşil)
- ≥90 Harika (cyan)

**Skor durumları:** `tahmini` (amber) · `guncelleniyor` (violet) · `klinik_onayli` (emerald)

### 10.4 Klinik Paneli (`/klinik/panel`)

**Sidebar V2:** Gmail tarzı hover-expand (72px → 264px), pin (localStorage), logo = `/klinik/panel`.

**3 katmanlı dashboard:**
- **ŞIMDI** — Bugünün Akışı (full-width)
- **BU AY** — 3 sabit kart: Üretimin / Akreditasyon Yolu / Sonuç Vitrini
- **SENIN SEÇTİKLERIN** — 8 kart kütüphane / max 4 tercihli

**Akreditasyon (4 faz, on-the-fly hesap):**
| Faz | Etiket | Kriter |
|---|---|---|
| 0 | Yeni Klinik | — |
| 1 | Doğrulanmış Hekim | Profil tam, müsaitlik, ≥5 onaylı randevu |
| 2 | Estelongy Hekimi | ≥20 onaylı, ≥5 klinik onayı |
| 3 | Estelongy Uzmanı | ≥100 onaylı, ≥30 klinik onayı |

**Klinik akış wizard (`/klinik/panel/randevu/[id]`):**
6 adım: Kabul → Hasta Anketi → Klinik Anketi → Tetkik → İleri Analiz → Hekim Onayı

Final = ara_toplam × 0.85 + hekim_skoru × 0.15

**Önemli kural:** server action'larda **`Promise.all` ile birden fazla supabase write yapma**. Sequential `await` + `.select('id')` rows-affected check zorunlu, 0 satır = `throw`.

**Takvim (`/klinik/panel/takvim`):** 7 filter pill (Bugün/Bekleyen/Görüşmede/Onaylı/Tamamlanan/İptal/Gelmedi). Inline aksiyonlar.

**Klinik kredi sistemi:**
- `free_appointments_remaining` (default 20 hediye)
- `appointment_credit_price` (ücretli mod)
- `paid_appointments_this_month`, `paid_mode_accepted_at`
- `consume_jeton` RPC önce ücretsiz haktan, sonra `jeton_balance`'tan düşer
- View: `clinics_with_credit_status`
- `/randevu` listesi `total_credit_balance > 0` filtreli — tükenenler gizli

**Eğitmen başvuru:**
- `/klinik/panel/akademi/basvur` — ≥50 char mesaj
- Admin `/admin/klinikler` → onay/red + not
- Onaylananlar → `/klinik/panel/akademi/paketler` → paket + video CRUD
- Server action guard: `requireEducatorClinic()`

### 10.5 Satıcı Paneli (`/satici/panel`)

**Akış:** başvuru → KYC → admin onay → satışa başla

**KYC (`/satici/panel/kyc`):** 3 bölümlü form
1. **Kurumsal Kimlik:** vergi/T.C. no (10-11 hane), ticaret sicil, MERSIS (16 hane), KEP, adres, "tıbbi ürün satıcısı mıyım"
2. **Banka:** IBAN (TR + 24 hane), hesap sahibi, banka adı
3. **Belgeler:** vergi levhası (ZORUNLU), ITS belgesi (tıbbi ürün için zorunlu), imzalı sözleşme PDF (opsiyonel)

**Sözleşme:** 10 madde inline, e-onay yeterli (ıslak imzalı PDF hızlandırır):
1. Taraflar (Vestoriq OÜ — Estonya)
2. Konu — pazaryeri altyapısı
3. Komisyon — varsayılan %12
4. Ödeme — teslimat sonrası 7 iş günü içinde IBAN'a
5. Belge yükümlülüğü — satıcı fatura keser
6. İade — 6502 sayılı kanun, 14 gün
7. Yasaklı ürünler — reçeteli, sahte, lisanssız
8. KVKK — müşteri verisi sadece teslimat
9. Fesih — 30 gün önceden bildirim
10. Uyuşmazlık — Tallinn mahkemeleri

**Sayfalar:**
- `/satici/panel` — ana panel (KYC kontrolü + ürün listesi + sipariş özeti)
- `/satici/panel/urunler/[id]/duzenle` — ürün düzenle (tier pricing dahil)
- `/satici/panel/siparisler` — sipariş listesi
- `/satici/panel/iadeler` — iade yönetimi
- `/satici/panel/kazanc` — komisyon raporu
- `/satici/panel/odeme-hesabi` — Stripe Connect onboarding

**Ürün ekle/düzenle (`UrunEkleForm`, `UrunDuzenleForm`):**
- Kategori (kozmetik / sarf_medikal / treatment_type=treatment için klinik işlemi)
- Görsel galerisi (max 8, ProductImageUploader)
- Tier pricing (`TierBuilder`):
  - Bareem 1 (1-5 adet, profesyonel indirimli) — kozmetik için min %10 indirim
  - Bareem 2 (6-15 adet)
  - Bareem 3 (16+ adet)
- İçerik maddeleri, EGP bileşenleri (doctor/user/manufacturer/scientific)
- Onay durumu pending → admin onayı sonrası is_active=true

### 10.6 Akademi (KOL Marketplace)

**Felsefe:** Eğitmen klinikler video paketleri yükler, sağlık profesyonelleri satın alıp izler.

**%70 eğitmen / %30 platform** (Stripe Connect TR yok → manuel IBAN transfer)

**Discovery:** `/akademi` (kategori/seviye/sıralama: kalite/satış/puan/yeni)

**Detay:** `/akademi/[slug]` — paket içerik listesi + Satın Al

**Satın alma:**
1. `/akademi/[slug]` → Satın Al
2. `/api/akademi/checkout` → Stripe Checkout Session (TRY, %70/%30 metadata)
3. Stripe webhook (`kind=akademi_purchase`) → `course_purchases.status='paid'`, idempotent

**İzleme:**
- `/panel/kurslarim` — sahip olunan paketler + ilerleme barı
- `/panel/kurslarim/[slug]` — Cloudflare Stream iframe player + sağda video listesi
- `course_progress` upsert (user_id, video_id unique)

**Kalite skoru cron (`/api/cron/akademi-quality-score`, 03:00 UTC):**
```
quality = avg_rating × 12
        + min(purchases, 200)/200 × 20
        + completion × 0.15
        − refund × 0.5
        + Bayesian shrinkage (<5 yorum → global ortalama)
```

### 10.7 EsteStore (`/estestore`)

3 katmanlı marketplace — yeni mağaza yapısı (eski `/magaza` legacy):
- `/estestore` — kozmetik default + ProfessionalToggle
- `/estestore/[category]` — kozmetik / sarf_medikal / akademi (akademi /akademi'ye redirect)
- `/estestore/[category]/[slug]` — ürün detay

**ProductCard rol-aware:**
- Anonim/user: tek perakende fiyat
- health_professional/clinic: çizili eski fiyat + indirimli yeni fiyat + 3 baremli tablo

### 10.8 Admin Paneli (`/admin`)

| Sayfa | Kapsam |
|---|---|
| `/admin` | Dashboard — son aktivite, pending sayaç |
| `/admin/kullanicilar` | 100 kullanıcı listele, rol değiştir, aktif/pasif (step-up auth) |
| `/admin/klinikler` | Onay + eğitmen başvuru + jeton yükleme (step-up auth) |
| `/admin/saticilar` | Onay + KYC kararı + Stripe Connect durum + şüphe bayrakları (step-up auth) |
| `/admin/urunler` | Onay/red (step-up auth) |
| `/admin/kuponlar` | Kupon CRUD |
| `/admin/iadeler` | İade onay/red |
| `/admin/icerik` | Editöryel CMS (kategori bazlı post) |
| `/admin/audit` | Audit log viewer (filtreli) |
| `/admin/hesap` | Şifre değiştir + telefon (maskeli) + Postmark test butonu |

**Vendor onay kartı (`/admin/saticilar` pending tab):**
- E-posta, telefon, vergi no, Stripe Connect durumu, hesap kayıt zamanı, son giriş
- **Şüphe bayrakları:** Sahte e-posta handle, sahte vergi no deseni (1234567, 0000000), şüpheli firma adı (suck/test/asd), kayıt sonrası anında giriş ve kayıp, Stripe başlatılmamış
- **KYC bloğu:** IBAN, banka, KEP, MERSIS, ticaret sicil, adres, sells_medical badge
- **Belgeler:** signed URL ile aç (vergi levhası, ITS, imzalı sözleşme)
- **Aksiyon:** KYC Onayla / KYC Reddet (notla) → sonra Vendor Onayla (DB trigger zorunlu kılar)

---

## 11. API & Server Action Envanteri

### 11.1 Public API endpointleri (`src/app/api/...`)

```
POST /api/auth/login                     ← brute-force korumalı login
POST /api/kayit                          ← hasta kayıt
POST /api/kurumsal/kayit                 ← klinik/satıcı kayıt
POST /api/saglik-profesyoneli/kayit      ← sağlık prof kayıt

POST /api/otp/send                       ← SMS OTP gönder
POST /api/otp/verify                     ← OTP doğrula

POST /api/admin-otp/send                 ← admin SMS OTP gönder (telefon DB'den)
POST /api/admin-otp/verify               ← admin OTP doğrula → 30dk session

POST /api/admin/test-email               ← admin Postmark test (kendine mail)

POST /api/analiz                         ← gpt-4o-mini Vision (rate limit 5/h/IP)

POST /api/akademi/checkout               ← Stripe Checkout Session
POST /api/stripe/webhook                 ← Stripe events (jeton + marketplace + akademi)
GET  /api/stripe/connect/account-link    ← Vendor onboarding link
GET  /api/stripe/connect/account-status  ← Vendor Connect durumu

POST /api/randevu                        ← Randevu oluştur (jeton tüket)
POST /api/iade                           ← İade talebi

GET  /api/cron/notifications             ← 09:00 UTC günlük (Hobby plan)
GET  /api/cron/clinic-egp                ← Klinik EGP günlük hesap
GET  /api/cron/akademi-quality-score     ← 03:00 UTC akademi kalite

GET  /sitemap.xml                        ← dinamik sitemap
GET  /robots.txt                         ← static
```

### 11.2 Önemli server action'lar

| Dosya | Action | Step-up |
|---|---|---|
| `src/app/admin/kullanicilar/page.tsx` | `changeRole`, `toggleActive` | ✓ |
| `src/app/admin/saticilar/page.tsx` | `updateVendor`, `decideKyc` | ✓ |
| `src/app/admin/klinikler/page.tsx` | `updateClinic`, `toggleEducator`, `decideEducatorApplication`, `addJeton` | ✓ |
| `src/app/admin/urunler/page.tsx` | `urunOnayAction` | ✓ |
| `src/app/satici/panel/kyc/actions.ts` | `submitKycAction` | — |
| `src/app/panel/hesabim/actions.ts` | `updateProfileAction`, `deleteAccountAction` | — |
| `src/app/satici/panel/urun-actions.ts` | ürün CRUD | — |
| `src/app/klinik/panel/randevu/[id]/actions.ts` | `kabulEt`, `finalOnay` (6-adım wizard) | — |

---

## 12. Skor Sistemi (Tetkik Yarım)

### 12.1 Kaynak veriler
- `analyses.web_scores` (gpt-4o-mini C250 hesabı)
- `longevity_surveys.cevaplar` (10 soru, 5 hasta + 5 klinik)
- `scores.tetkik_puan` (eksik — bekleniyor)
- `scores.hekim_skoru` (klinik wizard subjektif)

### 12.2 Anket katkısı

**Hasta anketi (5 soru, 0-100 slider):**
- beslenme: max +0.9
- cilt: max +1.0
- uyku: max +0.7
- stres: max +0.5
- aktivite: max +0.5
- **Toplam max: +3.6**

`katki = (cevap/100) × maxKatki`

**Klinik ek anketi (5 soru, geçici ağırlıklar — bilimsel revizyon bekliyor):**
- sigara: 1.1
- alkol: 0.5
- aile öyküsü: 0.4
- kronik hastalık: 0.6
- güneş maruziyeti: 1.0
- **Toplam max: +3.6**

**Hasta + Klinik (10 soru) toplam max: +7.2**

### 12.3 Yarım kalan iş — Tetkik puanı
- `src/lib/tetkik-params.ts` — parametre listesi (kan tahlilleri, hormonlar) gözden geçirilecek
- Her parametre için skor katkısı kuralı (referans aralık içi/dışı, yakınlık etkisi)
- Tetkik max toplam katkısı belirlenecek (3.6 mı, daha fazla mı?)
- `scores.tetkik_puan` kolonuna otomatik yazılacak
- **Bilimsel araştırma bekleniyor** (kullanıcı tarafında)

### 12.4 Final formülü
```
ara_toplam = ham_C250 × yas_faktor + hasta_anket + klinik_anket + tetkik
final      = ara_toplam × 0.85 + hekim_skoru × 0.15
```

---

## 13. Ödeme Akışları

### 13.1 Stripe entegrasyonları

| Akış | Endpoint | Mod |
|---|---|---|
| Klinik jeton satın alma | `/api/stripe/jeton-checkout` | EUR (~€5/jeton) |
| Akademi paket satın alma | `/api/akademi/checkout` | TRY |
| Mağaza ürün satın alma | `/api/checkout` | TRY |
| Vendor Connect onboarding | `/api/stripe/connect/account-link` | — |

### 13.2 Webhook (`/api/stripe/webhook`)

İdempotent olay işleme:
- `checkout.session.completed` (kind=akademi_purchase) → `course_purchases.status='paid'`
- `checkout.session.completed` (kind=jeton_purchase) → `add_jeton` RPC
- `checkout.session.completed` (kind=order) → orders + order_items
- `account.updated` → vendor Stripe Connect durumu güncelle

**Signature verify:** `STRIPE_WEBHOOK_SECRET` ile.

### 13.3 Komisyon
- Vendor satışı: `commission_rate` (default 0.12) × tutar = platform payı
- Akademi: %70 eğitmen / %30 platform (`splitCommission`)
- Stripe Connect TR olmadığı için **manuel IBAN transfer** (ay sonu rapor + admin müdahale)

### 13.4 Puan Sistemi (1 puan ≈ 1 TL)
- Yeni profil → +20 hoşgeldin (signup_bonus_applied)
- İlk randevu completed → davet eden'e +50 (first_appointment_bonus_applied)
- İlk sipariş paid → davet eden'e %5 (first_order_bonus_applied)
- `point_transactions` ledger
- Referral attribution `profiles.referred_by`
- `adjust_points` RPC (atomik, ledger + bakiye)

---

## 14. Bildirim Sistemi

### 14.1 E-posta (Postmark)

**Helper:** `src/lib/notifications.ts`
- `sendEmail(to, subject, html)` → boolean
- `sendEmailDetailed(to, subject, html)` → `{ok, messageId, error}`
- Header: `X-Postmark-Server-Token`
- Body: `{From, To, Subject, HtmlBody, MessageStream: 'outbound'}`

**Şablonlar (`tmpl*` fonksiyonları):**
- `tmplAppointmentConfirmed` — randevu onaylandı
- `tmplAppointmentReminder` — randevu hatırlatma (24h, 1h)
- `tmplScoreUpdate` — skor güncellemesi
- `tmplFailedLoginAlert` (`src/lib/email-templates.ts`) — başarısız giriş uyarısı
- Welcome mailler (`src/lib/welcome-email.ts`) — 4 rol için ayrı şablon

### 14.2 SMS (Netgsm)

**Helper:** `src/lib/netgsm.ts`
- OTP gönderme (`/api/otp/send`)
- Admin OTP (`/api/admin-otp/send`)
- Türkçe karaktersiz, max 155 char

**Şablonlar:**
- `smsAppointmentConfirmed`
- `smsAppointmentReminder`
- `smsScoreUpdate`
- OTP kodu (sadece kod + brand)

### 14.3 Cron (`/api/cron/notifications`)

**Tetik:** Vercel Hobby plan günlük 09:00 UTC (saatlik için Pro gerekli).

**İş:** `notification_queue` tablosundan `scheduled_at <= now()` olan pending kayıtları işler:
- email → Postmark
- sms → Netgsm
- başarılı → status='sent', başarısız → status='failed' + error_message

**Header doğrulaması:** `Authorization: Bearer ${CRON_SECRET}`.

**Otomatik enqueue tetikleyicileri:**
- Randevu confirmed → email + sms
- Randevu 24h öncesi → hatırlatma email + sms
- Randevu 1h öncesi → hatırlatma (Pro plan saatlik gerekli)
- Skor güncellemesi → email + sms

---

## 15. Cron İşleri

| Path | Sıklık | Ne yapar |
|---|---|---|
| `/api/cron/notifications` | 09:00 UTC günlük | notification_queue işle |
| `/api/cron/clinic-egp` | 03:00 UTC günlük | clinic.clinic_egp güncelle (Bayesian smoothing) |
| `/api/cron/akademi-quality-score` | 03:00 UTC günlük | course_packages.quality_score güncelle |

**`vercel.json` cron tanımı:** mevcut.

---

## 16. Geliştirme Kuralları (Sık Tuzaklar)

### 16.1 Server-side
- `'use client'` bileşenlerinde `export const dynamic = 'force-dynamic'` **KULLANMA**
- Server action'larda `redirect()` try/catch **dışında** olmalı (Next throw eder)
- Server action'larda **`Promise.all` ile birden fazla supabase write yapma** — sequential await + `.select('id')` rows-affected check, 0 satır = `throw`
- Status değiştiren server action'larda ilgili tüm path'lere `revalidatePath` çağır
- `router.refresh()` → insert/update sonrası cache temizleme

### 16.2 RSC + Cookies
- `await cookies()` — Next 15+ ile artık async
- `createClient()` server-side ASYNC — `await createClient()`

### 16.3 JSX
- Apostrof escape: `'` yerine `&apos;` (ESLint `react/no-unescaped-entities`)
- Tırnak escape: `"` yerine `&quot;`

### 16.4 JSDoc
- Yorum içinde `*/` kombinasyonu yorum bloğunu erken kapatır
- `/api/*/...` yazma → `/api/<resource>/...`

### 16.5 Auth callback
- `next` query param: sadece `/` ile başlıyorsa kabul (open redirect koruması)
- Aksi halde `pathForRole(role)` fallback

### 16.6 AI fallback
- gpt-4o-mini down → `generateFallback()` rastgele skor üretir, sessiz başarısızlık YOK (kullanıcıya gösterilir)

### 16.7 Resend → Postmark migration
- `RESEND_API_KEY` artık kullanılmıyor (eski kod referans olabilir, hep `sendEmail()` çağrı kullan)
- Postmark "pending approval" döneminde sadece `@estelongy.com` adresine mail uçar — yabancı domain'e 422 [412] hata alır

---

## 17. Deploy & Operasyon

### 17.1 Production deploy

```bash
# 1. Branch'te çalış
git checkout claude/priceless-ellis

# 2. Değişiklikleri commit
git add -A
git commit -m "Açıklayıcı mesaj"

# 3. Build kontrol (ZORUNLU)
npm run build

# 4. Production deploy
vercel --prod --yes
```

**ASLA `main`'e push etme** — main production değil.

### 17.2 DB migration

```bash
# Supabase MCP üzerinden:
# Tool: mcp__...__apply_migration
# project_id: dcmnxmqzimrgmholktid
# query: <SQL>
```

Veya Dashboard → SQL Editor.

### 17.3 Env değişkeni ekleme

```bash
vercel env add VAR_NAME production
# Vercel CLI prompt → değer gir → Production seç
# Sonrası: vercel --prod --yes (rebuild)
```

### 17.4 Rollback

```bash
# Eski deployment'a alias çevir:
vercel alias set <eski-deployment-url> estelongy-clean.vercel.app
```

### 17.5 Logs

```bash
# Vercel runtime logs:
vercel logs <deployment-url>

# Sentry → estelongy.io dashboard
```

---

## 18. Lansman Checklist

### 🔴 BLOKER (lansman yapılamaz)

- [ ] **Postmark account approval** — form gönderildi, hesap inceleniyor (1 iş günü)
- [ ] **Stripe Live mode** — Vestoriq Estonya KYC tamamlanması gerek
- [ ] **Tetkik puanı algoritması** — bilimsel araştırma sürüyor (kullanıcı tarafı)
- [ ] **estelongy.com domain → Vercel projesine bağla** (Settings → Domains → Add, 5 dk)

### 🟡 ÇOK ÖNEMLİ (lansmanı geciktirmez ama yapılmalı)

- [ ] **Cloudflare Email Routing** kur — `admin@`, `info@`, `kvkk@`, `guvenlik@`, `destek@` mailbox'ları estelongy@gmail.com'a forward
- [ ] **Resmi KVKK politika sayfası** yaz (avukat onaylı metin) — şu an /guvenlik var ama formal politika değil
- [ ] **Cloudflare Stream subscription** ($5/ay) — akademi videoları için
- [ ] **Sentry DSN** Vercel env'e (eklendi mi kontrol et)
- [ ] **Google Search Console + sitemap submit**
- [ ] Vercel iki proje karışıklığı: drizzetgok-site bağımsız tut, faz-1 ana proje

### 🟢 KOD TARAFI (canlıda, kontrol edilebilir)

- [x] Auth (4 rol, SMS OTP, brute-force korumalı)
- [x] Step-up auth (5 dk taze SMS)
- [x] Login rate limit (10/dk → 15dk lockout)
- [x] Security headers (CSP, HSTS, X-Frame DENY)
- [x] KVKK hesap silme cascade
- [x] Audit log (8 kritik aksiyon)
- [x] Şifre min 8 + yaygın blocklist
- [x] Failed login uyarı maili
- [x] E-posta değiştirme akışı
- [x] Storage bucket validasyonu
- [x] Vendor KYC (sprint B tam)
- [x] security.txt + /guvenlik
- [x] Postmark entegrasyon (approval bekliyor)

### 🔵 LANSMAN SONRASI

- [ ] TOTP (Google Authenticator) — SMS bağımlılığını kaldır
- [ ] RLS otomatik pen test (CI suite)
- [ ] Bug bounty programı (security.txt yayında, formal program yok)
- [ ] Supabase Site URL whitelist düzelt
- [ ] Klinik yorum sistemi Faz 1 (`clinic_reviews`)
- [ ] Klinik EGP cron (`/api/cron/clinic-egp` aktivasyonu)
- [ ] Mobil app (React Native / Expo)
- [ ] Push notification (FCM)
- [ ] Çoklu dil (EN)
- [ ] **ELS — Estelongy Longevity Standartları** (akreditasyon kuruluşu, asıl moat)

---

## 19. Yol Haritası (Hedefler)

### Faz 1 — Soft Launch (Q2 2026)
- 5-10 KOL hekime özel davet (anchor strategy)
- Tetkik puanı algoritması bilimsel finalizasyon
- Postmark + Stripe Live aktivasyon
- Domain kurulumu
- İlk gerçek vendor KYC onayı

### Faz 2 — Public Launch (Q3 2026)
- Instagram + LinkedIn kurumsal hesap
- Basın bülteni + blog
- Akademi Cloudflare Stream + ilk eğitmen paketleri
- WhatsApp şablon kütüphanesi
- Klinik yorum sistemi

### Faz 3 — Vizyon (2027+)
- ELS akreditasyon kuruluşu (Bronze → Platinum 4 seviye)
- Mobile app
- Çoklu dil (EN, KR)
- Webinar + canlı yayın
- API platformu

---

## 20. Sorun Giderme — Sık Görülen

### "Mail gitmedi"
1. `POSTMARK_API_TOKEN` Vercel env'de var mı? `vercel env ls production`
2. Postmark Activity → Delivered/Bounced göster
3. Pending approval ise sadece `@estelongy.com`'a uçar
4. DKIM/SPF/Return-Path Postmark Dashboard → Sender Signatures'da yeşil mi?

### "SMS gitmedi"
1. `NETGSM_*` env tam mı?
2. Telefon E.164 formatında mı? (`+90...`)
3. Netgsm panel → bakiye var mı?
4. Upstash rate limit: 3 dk içinde aynı numaraya 1 SMS

### "Login lockout"
- Upstash Console → `login_lockout:<ip>` key'i sil
- Veya 15 dk bekle (otomatik TTL)

### "Admin OTP istemiyor"
- `admin_otp:verified:<userId>` key süresi geçti, yeniden giriş yap

### "Vendor approve edilmiyor"
- DB trigger zorlar: `kyc_status='approved'` olmalı önce
- Hata mesajı: `KYC onayı tamamlanmadan satıcı onaylanamaz`

### "RLS hatası"
- Auth context server-side var mı? `await createClient()` ile cookie'li client kullan
- Service role gerekiyorsa `createServiceClient()` (sadece server-side, gizli key)

### "Hesap silme reddedildi"
- Aktif sipariş var (`status NOT IN completed/cancelled/refunded`)
- Önce siparişler tamamlanmalı

### "Build error: react/no-unescaped-entities"
- JSX'te `'` veya `"` → `&apos;` / `&quot;` ile değiştir

---

## 21. İletişim & Destek

- **Kurucu / Karar Verici:** İzzet Gök — estelongy@gmail.com
- **Admin hesapları:**
  - estelongy@gmail.com (telefon +90 5*****5003)
  - dr.izzetgok@gmail.com (telefon +90 5*****5003)
- **DPO / KVKK:** kvkk@estelongy.com (mailbox kurulacak)
- **Güvenlik:** guvenlik@estelongy.com (security.txt)
- **Genel destek:** destek@estelongy.com

---

## 22. Terminoloji Sözlüğü

| Terim | Tanım | Aralık |
|---|---|---|
| **Skor** | Estelongy Gençlik Skoru® — hastaya ait | 0-100 |
| **EGP** | Estelongy Gençlik Puanı — nesneye (ürün/işlem/klinik) ait | 0-10 |
| **Estelog** | Skor bazlı, protokol odaklı estetik hekim (yeni meslek tanımı) | — |
| **C250** | gpt-4o-mini Vision'dan türetilen ham EGS (ağırlıklı 5 bileşen) | 0-100 |
| **EGS** | Estelongy Gençlik Skoru — eski isim, yer yer kodda kalmış (`src/lib/egs.ts`) | — |
| **Jeton** | Klinik kredi birimi (1 jeton = 1 randevu hakkı) | — |
| **EGP formülü** | `doctor×0.4 + user×0.35 + manufacturer×0.15 + scientific×0.10` | — |
| **ELS** | Estelongy Longevity Standartları (akreditasyon kuruluşu, faz 3) | — |
| **KOL** | Key Opinion Leader (eğitmen klinik / hekim) | — |
| **Step-up auth** | Kritik aksiyonda son 5 dk içinde taze SMS doğrulama | — |
| **C** sprintleri | Güvenlik backlog — A=Sprint A (kritik), B=Vendor KYC, C=hardening, D=lansman sonrası | — |

---

## 23. Mimari Kararlar (Neden Böyle?)

### 23.1 Neden Postmark?
Resend → Postmark geçişi: deliverability test sonuçları. Postmark transactional için endüstri standardı, daha sıkı abuse policy → daha temiz IP reputation.

### 23.2 Neden Vercel + Supabase?
- Next.js 14 server actions için en iyi platform Vercel
- Supabase = Postgres + Auth + Storage + Realtime tek pakette
- Türkiye'de düşük latency CDN

### 23.3 Neden Vestoriq Estonya?
Türkiye'de Stripe yok (yasal kısıt). Estonya AB üyesi, e-residency ile uzaktan kurulum, vergi avantajı, Stripe destekleniyor.

### 23.4 Neden 3-tier pricing?
Vendor tek ürünü hem perakende hem toptan satabilsin. Profesyoneller (klinik/sağlık prof) doğal olarak büyük adetli alır → indirim. Kozmetikte min %10 ilk barem zorunlu (admin politikası).

### 23.5 Neden ayrı Akademi tablosu (course_*)?
Akademi entry point ayrı (`/akademi`), satış akışı farklı (Stripe TRY, Cloudflare Stream player). EsteStore ile karıştırmamak için ayrı tablo.

### 23.6 Neden DB function ile cascade silme?
Atomic — yarım silme yok. Tek transaction içinde tüm tablolar. Hata olursa rollback. Ayrıca trigger gibi davranır — RLS bypass için SECURITY DEFINER.

### 23.7 Neden Upstash Redis (in-memory yerine)?
Vercel serverless edge → her request farklı pod → in-memory rate limit çalışmaz. Upstash REST tabanlı, edge'de çalışır, hızlı.

### 23.8 Neden CSP'de unsafe-inline?
Next.js inline script + Tailwind JIT → nonce'suz çalışmıyor. Production-pragmatic: unsafe-inline kalsın, frame-ancestors none + script-src whitelist ile saldırı yüzeyini daralt.

---

## 24. Bekleyen Görevler / TODO

### 24.1 Test verisi temizliği (lansman öncesi)
Geliştirme sırasında DB'ye eklenen test klinikleri prod'a çıkmadan silinmeli.

**Toplu silme (lansman öncesi çalıştır):**
```sql
DELETE FROM public.clinics WHERE name LIKE 'Test Klinik %';
-- Ayrıca manuel test hesapları:
DELETE FROM public.clinics WHERE name IN ('Claude Test Klinik', 'Debug Test Kliniği', 'otp');
DELETE FROM auth.users WHERE email IN ('deneme1@test.com','deneme2@test.com','deneme3@test.com','claude.test.kayit.2026@gmail.com');
```

Şu an DB'de **15 adet** `Test Klinik 01..15` (default fotoyla, approved+active) ve 3 manuel test kliniği bulunuyor.

---

**Bu doküman canlıdır.** Yeni özellik eklendiğinde, env vars değiştiğinde, akış güncellendiğinde **buraya yansıt.**

Son ekleme: KVKK cascade · Audit log · Şifre 8 · Storage validasyon · Failed login uyarı · E-posta değiştirme · security.txt · Vendor KYC sprint B (DB + form + admin paneli + trigger).
