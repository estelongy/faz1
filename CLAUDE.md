# CLAUDE.md — Estelongy Proje Rehberi

## Proje Özeti

**Estelongy** — Estetik sağlık alanında AI destekli klinik yönetim, hasta takip ve KOL eğitim platformu.
**Stack:** Next.js 14 (App Router) · Tailwind · Supabase PostgreSQL (RLS) · OpenAI gpt-5.4-mini · Stripe · Resend · Sentry · Cloudflare Stream · Vercel

### Git & Deploy Akışı (KRİTİK)

```
Production branch:  claude/priceless-ellis  →  estelongy-clean.vercel.app
```

- Push → Vercel **preview** build (target: null)
- Production'a geçirmek için: `vercel promote <deployment_id> --yes`
- **ASLA `main`'e push etme** — main production değil
- Vercel proje: `prj_qQ0N5SSfH8kqaY61qyiAFIOy9pVS` · team: `team_6KIGU5JvMoWBV5To6nncBNnc`
- Supabase proje: `dcmnxmqzimrgmholktid`

---

## Kullanıcı Rolleri

| Rol | Yetkiler | Panel |
|-----|----------|-------|
| `user` | Analiz, Anket, Randevu, Sipariş, Skor takibi | `/panel` (violet tema) |
| `health_professional` | Akademi (kurs satın al/izle), Mağaza, Topluluk | `/panel` (emerald tema) |
| `clinic` | Hasta listesi, Takvim, Analiz onay, Jeton, Akademi eğitmenliği | `/klinik/panel` |
| `vendor` | Ürün, Stok, Sipariş, İade, Komisyon | `/satici/panel` |
| `admin` | Tüm kaynaklar | `/admin` |

> Klinik/Vendor başvurusu beklerken `user` rolüyle çalışır.
> Sağlık profesyoneli kayıt: beyan bazlı (diploma istenmez), ünvan + uzmanlık + SMS OTP zorunlu.

---

## Sayfa Haritası

```
/                        → Landing (3 kapı: Analiz / Randevu / Mağaza) + nav: Rehber/Akademi/Klinik
/giris  /kayit           → Auth (Hasta — SMS OTP zorunlu)
/kurumsal/giris          → Klinik & Satıcı & Sağlık Pro hesap tipi seçimi
/kurumsal/saglik-profesyoneli/kayit → SP dedicated kayıt (ünvan/uzmanlık/SMS OTP/beyan/KVKK)

/panel                   → Hasta paneli (3 bölge: Skor / Sıradaki Adım / Yönetim Grid)
                            └ health_professional ise emerald tema, Akademi/Mağaza odaklı
/panel/hesabim/analizlerim/randevularim/siparislerim/iadelerim/adreslerim/referral/leaderboard
/panel/kurslarim         → Sağlık pro: satın alınan kurslar (ilerleme barı)
/panel/kurslarim/[slug]  → Video player + sidebar (CF Stream iframe)

/analiz · /skor · /randevu · /magaza · /sepet · /siparis/[no]

/akademi                 → Public discovery (filtre: kategori/seviye/sıralama)
/akademi/[slug]          → Paket detay + içerik listesi + Satın Al

/klinik/basvur · /klinik/panel
/klinik/panel/akademi/basvur     → Eğitmen başvurusu
/klinik/panel/akademi/paketler   → Eğitmen paneli (paket + video CRUD)

/satici/basvur · /satici/panel
/admin · /admin/icerik (editöryel CMS) · /admin/klinikler (klinik + eğitmen onay)
/rehber · /hakkinda/*
```

---

## Supabase

- **ID:** `dcmnxmqzimrgmholktid` · **URL:** `https://dcmnxmqzimrgmholktid.supabase.co`
- **Edge Function:** `send-appointment-email`

**Tablolar (özet):** `profiles · clinics · vendors · appointments · analyses · scores · longevity_surveys · products · orders · order_items · addresses · carts · cart_items · returns · transactions · jeton_transactions · reviews · notification_queue · audit_logs · clinic_availability · user_badges · user_activity_streaks · referral_codes · referral_uses · coupons · clinic_patient_notes · point_transactions · editorial_posts · shared_cases · journeys`

**Akademi tabloları:** `course_packages · course_videos · course_purchases · course_progress · course_reviews`

**Profile rol alanları:**
```
profiles.role             → 'user' | 'health_professional' | 'clinic' | 'vendor' | 'admin'
profiles.hp_title         → Dr./Uz.Dr./Op.Dr./Prof./Doç./Diş.Hek./Hemşire/Eczacı/Tıp.Öğr./Diğer
profiles.hp_specialty     → uzmanlık alanı (serbest metin)
profiles.hp_institution   → çalıştığı kurum (opsiyonel)
profiles.hp_declared_at   → beyan onay tarihi
profiles.points_balance   → kullanıcı puan bakiyesi (1 puan ≈ 1 TL)
profiles.phone_verified   → SMS OTP doğrulanmış mı
```

**Klinik akademi alanları:**
```
clinics.is_educator                   → eğitmen yetkisi
clinics.educator_application_status   → 'none'|'pending'|'approved'|'rejected'
clinics.educator_application_message  → başvuru mesajı
clinics.educator_decided_at, educator_decision_note
clinics.educator_bio                  → public eğitmen bio
```

**Kritik kısıtlamalar:**
```
scores.score_type          → CHECK IN ('web','device','doctor_approved','final')
notification_queue.type    → CHECK IN ('email','sms','push')
appointments.status        → ENUM (pending,confirmed,in_progress,completed,cancelled)
analyses.web_ai_raw        → JSONB
analyses.web_scores        → JSONB
analyses.appointment_id    → uuid (ziyarete bağlı analiz; null ise bağımsız)
analyses.doctor_approved_scores → JSONB { tetkik, ileri_analiz_c250, hekim_skoru }
course_purchases.status    → CHECK IN ('pending','paid','failed','refunded')
course_videos.stream_status → CHECK IN ('pending','processing','ready','error')
```

**RPC:** `consume_jeton · generate_referral_code · decrement_product_stock · adjust_points · add_jeton`

**Klinik Kredi Sistemi:** `clinics.free_appointments_remaining` (default 20 hediye), `appointment_credit_price`, `paid_appointments_this_month`, `paid_mode_accepted_at`. `consume_jeton` RPC önce ücretsiz haktan, sonra `jeton_balance`'tan düşer. View: `clinics_with_credit_status`. `/randevu` listesi `total_credit_balance > 0` filtreli — krediler tükenmiş klinikler hasta yönlendirme dışı.

**Puan Sistemi:** `points_balance` + `point_transactions` ledger. Otomatik tetikleyiciler: yeni profil → +20 hoşgeldin, randevu completed → davet eden'e +50, sipariş paid → davet eden'e %5. Referral attribution `profiles.referred_by`.

---

## Env Variables

```
NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY · SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
STRIPE_SECRET_KEY · STRIPE_WEBHOOK_SECRET · NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY · FROM_EMAIL
CRON_SECRET
NEXT_PUBLIC_SENTRY_DSN · SENTRY_ORG · SENTRY_PROJECT
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
NETGSM_USER · NETGSM_PASSWORD · NETGSM_MSGHEADER
UPSTASH_REDIS_REST_URL · UPSTASH_REDIS_REST_TOKEN
NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE · CLOUDFLARE_ACCOUNT_ID · CLOUDFLARE_STREAM_TOKEN
```

> Stripe canlı durumu: test mode aktif. Live KYC Vestoriq Estonya belgelerine bağlı.
> Stripe min TRY satış: ~16 TL (€0.50 eşdeğeri).

---

## AI — gpt-5.4-mini Vision + Estelongy Algoritması

`POST /api/analiz` (rate limit: IP başına 5/saat) → Base64 → gpt-5.4-mini → 5 bileşen → EA → skor

| Bileşen | Ağırlık | Yön |
|---------|---------|-----|
| hydration | 0.25 | yüksek = iyi |
| tone_uniformity | 0.25 | yüksek = iyi |
| wrinkles | 0.25 | ters (100−değer) |
| pigmentation | 0.15 | ters (100−değer) |
| under_eye | 0.10 | yüksek = iyi |

**Yaş faktörü:** ≤25→1.02 · ≤35→1.00 · ≤45→0.97 · ≤55→0.93 · 56+→0.88

---

## Longevity Anketi (Tek Kaynak)

**Yer:** `/skor?analysisId=xxx&open=anket` · **DB:** `longevity_surveys` + `scores.hasta_anket_puani`
**Soru kaynağı:** `src/lib/anket-sorular.ts`

**Hasta Anketi (5 soru — beslenme/cilt/uyku/stres/aktivite, 0-100 slider):**
- Ağırlıklı katkı (max **+3.6 puan**): beslenme 0.9 · cilt 1.0 · uyku 0.7 · stres 0.5 · aktivite 0.5
- `katki = (cevap/100) × maxKatki`

**Klinik Ek Anketi (5 soru — sigara/alkol/aile/kronik/güneş):**
- Ağırlıklar (max +3.6 — geçici, finalize edilecek): 1.1/0.5/0.4/0.6/1.0
- **Toplam klinik anketi (10 soru) max katkı: +7.2**

**Skor mantığı:** Hasta anketi dolmuşsa klinik anketi tekrar cevaplandığında hasta puanı düşülür, klinik toplamı eklenir. Hasta anketi boşsa direkt eklenir.

---

## Hasta Paneli (3 Bölge)

`/panel` sade ve net:
```
[1] SKOR DURUMU       Skor barı + faz rozeti + "Skor Detayı →"
[2] SIRADAKİ ADIM     Faza göre tek dinamik CTA (gradient kart)
[3] YÖNETİM GRID      8 ikonik kart
```

**CTA mantığı (`src/app/panel/page.tsx`):**
1. Hiç analiz yok → "İlk analizinizi yapın" → `/analiz`
2. Klinik onaylı → "Skorun hazır, paylaş veya yeniden ölç"
3. Aktif randevu var → "Randevunuz var: [tarih]" → `/panel/randevularim`
4. Anket dolu, randevu yok → "Klinik randevusu alın" → `/randevu`
5. Ön analiz var, anket yok → "Anketinizi doldurun, +10 puan" → `/skor?...&open=anket`

> **Health Professional modu:** aynı sayfa emerald tema. Sidebar farklı: Akademi/Kurslarım/Mağaza/Topluluk görünür, Yeni Analiz/Randevu/Geçmişim gizli. Çıkış butonu sidebar altında kırmızı.

---

## Klinik Akış (6 Adım)

`/klinik/panel/randevu/[appointmentId]` → `KlinikAkisWizard`

Akış: Kabul → Hasta Anketi → Klinik Anketi → Tetkik → İleri Analiz → Hekim Onayı
**Final = (toplam × 0.85) + (hekim_puanı × 0.15)**

`finalOnay` sağlamlığı: Promise.all yok, sequential await + rows-affected check. `kabulEt` ve `finalOnay` sonunda `revalidatePath('/klinik/panel/takvim')` + `revalidatePath('/klinik/panel')`.

**Takvim (`/klinik/panel/takvim`):** 7 tıklanabilir filter pill (Bugün/Bekleyen/Görüşmede/Onaylı/Tamamlanan/İptal/Gelmedi). İptal+gelmedi iş listelerinde gizli. Inline aksiyonlar: Onayla / Reddet / Hasta Geldi / Akışı Sürdür / Gelmedi.

---

## Klinik Panel V2 (Mimari Özet)

**Sidebar:** Gmail tarzı hover-expand (72px → 264px), pin (localStorage), logo = `/klinik/panel`.

**3 Katman dashboard:**
- **ŞIMDI** — Bugünün Akışı kartı (full-width)
- **BU AY** — 3 sabit kart: Üretimin / Akreditasyon Yolu / Sonuç Vitrini
- **SENIN SEÇTİKLERIN** — 8 kart kütüphane / max 4 tercihli

**Akreditasyon (4 faz, on-the-fly hesap, cache'siz):**
| Faz | Etiket | Kriter |
|-----|--------|--------|
| 0 | Yeni Klinik | — |
| 1 | Doğrulanmış Hekim | Profil tam, müsaitlik tanımlı, ≥5 onaylı randevu |
| 2 | Estelongy Hekimi | ≥20 onaylı, ≥5 klinik onayı |
| 3 | Estelongy Uzmanı | ≥100 onaylı, ≥30 klinik onayı |

**Onboarding (4 adım banner):** Profil → Müsaitlik → İlk randevu → İlk klinik onayı. Ödüller: rozet/kredi/içerik unlock.

**Editöryel CMS (`/admin/icerik`):** kategori bazlı post (akademi/duyuru/topluluk/bilim/resmi/sosyal). Hekim panelindeki 6 tercihli kart bu kategorilerden beslenir.

**Sonuç Vitrini (KVKK rıza akışı):** `shared_cases` tablosu. hekim → "izin iste" → hasta `/panel`'de banner → anonimlik seç (initials/firstname/full_anon) → onay/red. Onaylı vakalar dashboard'da en yüksek Δ ile gösterilir.

---

## Akademi MVP (Mimari Özet)

**Felsefe:** KOL marketplace — eğitmen klinikler video paketleri yükler, sağlık profesyonelleri satın alıp izler. **%70 eğitmen / %30 Estelongy**. Algoritma kalite eler.

**Eğitmen tarafı (klinik):**
- `/klinik/panel/akademi/basvur` → başvuru formu (≥50 char mesaj)
- Admin `/admin/klinikler` → onay/red + bilgilendirme notu
- Onaylananlar: `/klinik/panel/akademi/paketler` → paket + video CRUD, publish/unpublish
- Server action guard: `requireEducatorClinic()` (sequential await + rows-affected check)

**Alıcı tarafı (sağlık pro / hasta da satın alabilir):**
- `/akademi` public discovery (kategori/seviye filtre, 4 sıralama: kalite/satış/puan/yeni)
- `/akademi/[slug]` paket detay + içerik listesi + Satın Al
- `/api/akademi/checkout` → Stripe Checkout Session (TRY, %70/%30 split metadata)
- Stripe webhook (`kind=akademi_purchase`) → status=paid, total_purchases++, idempotent

**İzleme:**
- `/panel/kurslarim` → sahip olunan paketler + ilerleme barı
- `/panel/kurslarim/[slug]` → Cloudflare Stream iframe player + sağda video listesi
- `course_progress` upsert (user_id, video_id unique) + manuel "tamamlandı" toggle
- Stream env yoksa "video hazırlanıyor" placeholder

**Kalite skoru cron (`/api/cron/akademi-quality-score`, günlük 03:00):**
```
quality_score = avg_rating × 12 + min(purchases,200)/200 × 20 + completion × 0.15 − refund × 0.5
+ Bayesian shrinkage (<5 yorum → global ortalamaya çek)
```

**Komisyon:** `splitCommission(amount)` → `{educator_share, platform_share}`. Stripe Connect TR yok → ay sonu manuel IBAN transfer.

---

## Kayıt Güvenlik Politikası (Cross-cutting)

`src/lib/signup-policy.ts` — tüm kayıt endpoint'lerinde merkezi:
- Disposable email blocklist (50+ domain: 10minutemail, mailinator, vb.)
- IP başına saatte 3 kayıt rate-limit (Upstash)
- E-posta sözdizimi + format validasyonu
- Şifre min 6 karakter (UX tercihi)
- SMS OTP zorunlu: hasta + sağlık profesyoneli + klinik + satıcı (Netgsm + Upstash)

**Endpoint'ler:**
- `/api/kayit` — hasta
- `/api/kurumsal/kayit` — klinik & satıcı (yetkili telefon SMS OTP)
- `/api/saglik-profesyoneli/kayit` — sağlık profesyoneli (ünvan/uzmanlık/beyan/KVKK)

---

## Admin Güvenliği (Canlı)

- **Admin login → SMS OTP zorunlu** (canlı). Şifre doğru → telefon kayıtlıysa /giris/admin-otp'ye yönlendir → SMS kod → 30dk Upstash session.
- `src/lib/admin-otp.ts` — markVerified/isVerified/isFresh helper'ları
- `/api/admin-otp/{send,verify}` — telefon DB'den okunur (kullanıcı veremez)
- Middleware: `/admin/*` için `admin_otp:verified:<userId>` Upstash key zorunlu
- `/admin/hesap` — şifre değiştir + telefon görüntüle (maskeli)
- 2 admin: estelongy@gmail.com (+9054*****003) ve dr.izzetgok@gmail.com (+9054*****003) — ikisinin de telefonu doğrulanmış

---

## Güvenlik Yapılacaklar (Backlog — öncelik sırası)

### A. Yarım gün — yüksek etki
- **A1. Step-up auth** — kritik admin aksiyonlarında son 5 dk taze SMS şartı. `set_user_role`, vendor onay, `app_settings`, toplu silme. `isAdminOtpFresh()` helper hazır, sadece wrapper. ~2 saat
- **A2. Login rate limit** — `/giris` IP başına dakikada 10 yanlış deneme → 15 dk kilit. Upstash Ratelimit. ~1 saat
- **A3. Security headers** — `next.config.js` üzerinden CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff. ~2 saat

### B. Sprint B — Vendor KYC (1-2 gün)
Vendor başvuru formu ve `vendors` tablosu derinleştirme:
- Vergi levhası, imza sirküleri, IBAN + banka onayı, KEP adresi
- Marka tescil (kozmetik), ITS belgesi (sarf), üretim/ithal izni
- Sözleşme onayı (KVKK + satıcı kontratı)
- Vendor için SMS OTP
- DB: `documents` JSONB + Supabase Storage bucket
- Admin onay kartında belge önizleme (tıkla aç)
- Kategori bazlı zorunlu belge listesi

### C. Hafta içi — orta efor
- **Audit log yazımı** — rol değişimi, vendor onay, ürün/hesap silme, app_settings → `audit_logs` tablosuna kim/ne/IP/ne zaman. ~3 saat
- **Hesap silme cascade** (KVKK gereği) — gerçek silme tüm bağımlı tablolar + auth.users. ~4 saat
- **E-posta değiştirme akışı** — eski + yeni adresten çift onay. ~4 saat
- **Storage bucket validasyonu** — magic byte check, max boyut, MIME whitelist. ~1 saat
- **Failed login → e-posta uyarısı** — admin'e ve hesap sahibine. ~2 saat
- **Şifre min 8 + breached password check** — haveibeenpwned API (k-anonymity). ~2 saat

### D. Sonraki sprint — daha derin
- **TOTP** (Google Authenticator) — SMS bağımlılığını kaldır. otplib + QR + recovery code listesi. ~6 saat
- **RLS otomatik pen test** — her tablo için "kullanıcı sadece kendi datasına erişebiliyor mu" otomatik test seti (CI). ~1 gün
- **`security.txt` + bug bounty politikası**. ~1 saat
- **Stripe Live mode + 3DS zorunlu** — Vestoriq Estonya KYC bekliyor. ~4 saat
- **KVKK politika sayfası + veri saklama süreleri** (yazılı). ~4 saat
- **Supabase Site URL whitelist düzelt** — reset linklerinin eski preview URL'lerine gitmesi sorunu (manuel: Dashboard → Auth → URL Configuration)

---

## Ziyaret Zaman Çizelgesi

Hem klinik (`/klinik/panel/hasta/[userId]`) hem hasta (`/panel/analizlerim`) tarafında ziyaret bazlı birleşik kart akışı.

- **Ortak bileşen:** `src/components/ZiyaretKarti.tsx`
- **Birleştirme:** `analyses.appointment_id` ile eşleşenler ziyaret kartı içine, eşleşmeyenler "Bağımsız Ön Analiz"
- **Journeys:** `journeys` tablosu — randevu completed → journey otomatik kapanır. Yeni selfie aktif journey'e bağlanır.

---

## Terminoloji (Sabit)

| Terim | Kime | Aralık | Not |
|-------|------|--------|-----|
| **Skor** | hasta | 0–100 | "Estelongy Gençlik Skoru ®" |
| **EGP** | nesne (ürün/işlem/klinik) | 0–10 | Estelongy Gençlik Puanı |

**Skor bölgeleri:** <55 Çok Düşük (kırmızı) · 56–65 Düşük (turuncu) · 66–79 Normal (amber) · 80–89 İyi (yeşil) · >90 Harika (cyan)

**Skor durumları:** `tahmini` (amber) · `guncelleniyor` (violet/pulse) · `klinik_onayli` (emerald)

**Estelog** = Skor bazlı, protokol odaklı estetik hekim (yeni meslek tanımı)

**EGP formülü:** `doctor×0.4 + user×0.35 + manufacturer×0.15 + scientific×0.10`
**Başlangıç katalog:** HA Dolgu 9.2 · Skin Booster 8.5 · Botoks 7.0 · Altın İğne 6.5 · Güneş Koruyucu 8.5

---

## Geliştirme Kuralları

- `'use client'` bileşenlerinde `export const dynamic = 'force-dynamic'` **KULLANMA**
- `router.refresh()` → insert/update sonrası cache temizleme
- Auth callback `next` param: sadece `/` ile başlıyorsa geçerli (open redirect koruması)
- AI down → fallback skor göster, sessiz başarısızlık yok
- Server action'larda `redirect()` try/catch **dışında** olmalı
- **Server action'larda `Promise.all` ile birden fazla supabase write yapma** — sequential `await` + `.select('id')` rows-affected kontrolü zorunlu, 0 satır = `throw`
- Status değiştiren server action'larda ilgili tüm path'lere `revalidatePath` çağır
- **JSX text içinde apostrof escape:** `'` yerine `&apos;` kullan (ESLint `react/no-unescaped-entities`)
- **JSDoc comment içinde `*/` kombinasyonu yasak** (yorum bloğunu erken kapatır — `/api/*/...` yazma, alternatif kullan)

---

# 📋 Bekleyen Görevler — Sıralı Öncelik

## 👤 0. SENİN YAPACAKLARIN — Manuel Lansman Checklist

> Kod yok, sadece dış servis kayıt + Vercel env + canlı test. Lansmandan önce hepsi bitmeli.

### A. Vercel Env Vars (Production)
- [ ] `RESEND_API_KEY` + `FROM_EMAIL` — yoksa welcome/bildirim email sessiz fail
- [ ] `OPENAI_API_KEY` — analiz için (varsa doğrula)
- [ ] `CRON_SECRET` — rastgele 32-char string, hem env hem cron header'da
- [ ] `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_ORG` + `SENTRY_PROJECT` — sentry.io'da estelongy projesi yarat
- [ ] `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` — Search Console verification
- [ ] `NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE` + `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_STREAM_TOKEN` — Stream subscription sonrası

### B. Cloudflare Stream
- [ ] Subscribe ($5/ay, 1000 dk hosting + sınırsız izleme)
- [ ] API token (Stream:Edit izinli) + customer code'u Vercel env'e
- [ ] Production redeploy → akademi video oynatma aktifleşir

### C. Stripe Live Mode (Vestoriq KYC sonrası)
- [ ] Vestoriq Estonya vergi belgeleri tamamlandığında Stripe → Activate Live → KYC
- [ ] Live key'leri Vercel env'e (test mode üzerine)
- [ ] Webhook endpoint: `https://estelongy.com/api/stripe/webhook` → Stripe'a kaydet, signing secret al
- [ ] Akademi otomatik live olur

### D. Search Console + SEO Manuel
- [ ] Google Search Console property + sitemap submit
- [ ] Bing Webmaster Tools site + sitemap
- [ ] `src/app/layout.tsx` `sameAs` URL'leri gerçek sosyal medya hesaplarıyla güncelle

### E. Supabase Auth
- [ ] Google OAuth provider etkinleştir
- [ ] Google Cloud Console OAuth Client → Supabase'e Client ID + Secret
- [ ] Redirect URI: `https://dcmnxmqzimrgmholktid.supabase.co/auth/v1/callback`

### F. Vercel Hijyen
- [ ] İki proje karışıklığı (`faz1` vs `faz-1`) — birini sil, domain tek projede
- [ ] Vercel Pro'ya geçince saatlik cron etkinleşir

### G. Lansman Öncesi Canlı Smoke Testleri
- [ ] Hasta kayıt — `/kayit` → SMS OTP → welcome email
- [ ] Klinik kayıt — `/kurumsal/giris` → Klinik → Kayıt Ol → SMS OTP → `/klinik/basvur`
- [ ] Satıcı kayıt — `/kurumsal/giris` → Satıcı → Kayıt Ol → SMS OTP → `/satici/basvur`
- [ ] Sağlık Pro kayıt — `/kurumsal/giris` → Sağlık Profesyoneli → dedicated form → `/panel` (emerald)
- [ ] Sidebar Çıkış — sağlık pro olarak giriş → kırmızı Çıkış butonu
- [ ] Akademi alıcı akışı (Stream env sonrası) — `/akademi` → Satın Al → Stripe test → `/panel/kurslarim` → video oynar
- [ ] Eğitmen başvuru — klinik panel → "Eğitmen Ol" → admin onay → "Eğitmen Paneli" linki çıkar

### H. Soft Launch (Opsiyonel)
- [ ] İlk 5-10 KOL hekime kişisel davet (anchor strategy)
- [ ] Instagram + LinkedIn kurumsal hesap
- [ ] Basın bülteni / blog yazısı taslakları

---

## 🥇 1. Tetkik Puanı Algoritması (Aktif İş, Lansman Blokeri)

Skor algoritmasının kalan parçası. Anket bitti, şimdi tetkik. Kullanıcı tarafının %90'ı hazır, algoritma bekleniyor.

- [ ] `src/lib/tetkik-params.ts` parametre listesi gözden geçirilecek
- [ ] Her parametre için skor katkısı kuralı (referans aralığı içi/dışı, yakınlık etkisi)
- [ ] Tetkik max toplam katkısı belirlenecek (anket gibi 3.6 mı, daha fazla mı?)
- [ ] `scores.tetkik_puani` kolonuna otomatik yazılacak
- [ ] Hekim onayı %15 ağırlık formülü netleştirilecek (mevcut: `final = ara_toplam × 0.85 + hekim × 0.15`)
- [ ] Klinik ek anketi 5 ağırlık (1.1/0.5/0.4/0.6/1.0) bilimsel araştırma ile finalize

---

## 2. Bildirim Sistemi (Aktif, Çoğu Hazır)

Cron `0 9 * * *` (Hobby plan) çalışıyor. SMS+email enqueue: `appointment_confirmed`, 24h hatırlatma, score_update.

**Kalan:**
- [ ] `RESEND_API_KEY` Vercel'e (Madde 0/A) — yoksa email sessiz fail
- [ ] 1h hatırlatma (Vercel Pro saatlik cron olunca)
- [ ] Hekim önerileri değişince ayrı bildirim (procedure_notes/recommendations diff trigger)

---

## 3. Akademi Tamamlama (MVP canlıda, kalan parçalar)

- [ ] Cloudflare Stream env'leri (Madde 0/B) — videolar oynar hale gelsin
- [ ] Eğitmen video upload UI'ı — TUS direct upload (şu an manuel `stream_uid` girme)
- [ ] Kurs içi puan verme (`course_reviews`, 1-5 ★ + opsiyonel yorum)
- [ ] İade akışı — 14 gün içinde, izlenme %30'dan az → otomatik refund
- [ ] Eğitmen kazanç dashboard (satış, gelir, paket performansı)
- [ ] Aylık IBAN transfer toplu raporu (admin)

---

## 4. Klinik Deneyim / Yorum Sistemi (Faz 1)

**Felsefe:** Yorum platformu değil, **ölçüm platformu**. Hekim sanatı puanlanmaz, sonucu sistem ölçer (skor Δ). 4 objektif boyut + NPS + tacir filtresi.

**Yorum formu (randevu completed sonrası):**
- 4 ★ boyutu: hijyen, personel, randevu uyumu, iletişim
- Puanlanmayan: NPS (0-4), "ihtiyacın olmayan iş önerildi mi" (yes/no), "tekrar gelir miydin" (yes/maybe/no)
- Serbest metin: pozitif / iyileştirme / anonim toggle

**Klinik EGP formülü:**
```
EGP = Sonuç Etkinliği × 0.35   ← skor Δ (objektif)
    + NPS × 0.25
    + Operasyonel (4 ★ ort) × 0.20
    + Estelongy Onayı × 0.15
    + Profesyonellik × 0.05
× confidence_factor (Bayesian smoothing <5 yorum)
× son 6 ay zaman ağırlığı
```

**Akreditasyon yolu:** Faz 1 (Ölçüm 6-12 ay, sertifika yok, otomatik veri rozetleri) → Faz 2 (Algoritmik rozet, başvuru yok) → Faz 3 (**ELS — Estelongy Longevity Standartları**, kurumsal sertifika kuruluşu, 4 seviye Bronze→Platinum). ELS = asıl moat.

**Faz 1 İş Listesi:**
- [ ] `clinic_reviews` tablosu + RLS + indexler
- [ ] `/panel/randevularim/[id]/degerlendir` yorum formu
- [ ] Yorum kaydetme server action (7 gün düzenleme penceresi)
- [ ] `clinics` agregate kolonları + günlük EGP cron
- [ ] Klinik public sayfası `/klinik/[slug]` (yorum + EGP rozet)
- [ ] Randevu listesinde EGP gösterimi
- [ ] Klinik panelinde yorum listesi + tek-seferlik cevap
- [ ] Otomatik veri rozeti (📈/💚/🛡️)
- [ ] Bildirim: completed + 6 saat sonra "deneyimini paylaş"

> **Sıra:** Tetkik → Bildirim Resend → Klinik Deneyim Sistemi.

---

## 5. Hesabım Tamamlama

- [ ] Hesabı sil — şu an `is_active=false` (soft). Gerçek silme için service-role admin endpoint
- [ ] E-posta değişikliği — şu an "destek ile iletişim" placeholder. `auth.updateUser({email})` flow

---

## 6. Ziyaret Akışı İyileştirmeleri

- [ ] Klinik akışı tamamlanınca `analyses.appointment_id` otomatik dolsun (manuel backfill gerekti)
- [ ] "İşlem sonrası takip" — 10 gün sonra yeni ön analiz → otomatik ilişkilendir
- [ ] Kart içinde "öncekine göre" mini-sparkline (nem, kırışıklık trend)

---

## 7. Kozmetik Temizlik

- [ ] `src/lib/egs.ts` → `src/lib/skor.ts` rename + import güncelleme
- [ ] 8 yerde kalan EGS yorum/string temizliği
- [ ] `<img>` → `next/image` mağaza sayfalarında (LCP)
- [ ] `/rehber/*` makaleleri için özel `opengraph-image.tsx`

---

## 8. Klinik Portal Faz B (Lansman Sonrası 2-4 Hafta)

**📰 Akademi (klinik panelinde):**
- Editöryel CMS ✅ canlı, hekim panel besleme ✅ canlı
- [ ] Kongre takvimi (manuel CRUD)
- [ ] Protokol kütüphanesi (skor bandına göre)
- [ ] PubMed E-utilities entegrasyonu

**📱 Pazarlama:**
- [ ] WhatsApp şablon kütüphanesi
- [ ] Skor paylaşım kartı görsel jeneratörü (IG/Twitter/WA boyutları)
- [ ] AI gönderi yazarı (klinik için, ayrı OpenAI bütçesi)
- [ ] Performans raporu

**💬 Topluluk:**
- Topluluk Pulse + anonim vaka paylaşımı ✅ canlı
- [ ] Branş kanalları (dermatoloji/plastik/longevity)
- [ ] Klinik rehberi (şehir + EGP filtreli)
- [ ] Aylık webinar kayıt + arşiv

**🛟 Destek:**
- E-posta + WhatsApp + SSS ✅ canlı
- [ ] Canlı destek (Crisp/Intercom)

---

## 9. Akademi Faz 2 (Lansman Sonrası)

- [ ] Webinar (canlı yayın) altyapısı
- [ ] Firma kapısı — sponsored content, ürün tanıtım, analytics (Allergan/Galderma/Sinclair)
- [ ] Kore/global eğitmen erişimi (lokalizasyon, alt yazı/çeviri)
- [ ] Diploma doğrulama (beyan'dan belge yüklemeye geçiş)
- [ ] Mentörlük (saatlik 1-1) ve vaka takibi

---

## 10. Faz 3 (Vizyoner)

- [ ] Mobil App (React Native / Expo)
- [ ] Push notification (FCM)
- [ ] AI fine-tuning
- [ ] API Platformu · Çoklu dil (EN)
- [ ] Misafir checkout (geçici şifreyle hesap)
- [ ] **ELS — Estelongy Longevity Standartları** (akreditasyon kuruluşu, asıl moat)

---

# ✅ Tamamlanan & Kararlı Çalışan (Referans Özet)

> Bu modüller production'da, denenmiş ve sorunsuz. Detayları yukarıdaki mimari bölümlerinde.

**Auth & Kayıt:**
- 4 rol kayıt akışı: Hasta / Klinik / Satıcı / Sağlık Profesyoneli — hepsi SMS OTP zorunlu
- Merkezi güvenlik politikası (`signup-policy.ts`): disposable email blok + IP rate-limit
- Supabase Auth + service-role admin user creation
- SMS OTP (Netgsm + Upstash) production, OTP rate-limit (3dk/saat)
- Çıkış butonu sidebar altında (her sayfada erişilebilir)

**Hasta Tarafı:**
- 3 bölgeli panel (Skor/CTA/Grid)
- Yeni Analiz (gpt-5.4-mini Vision + EA)
- Longevity Anketi (10 soru, 2 aşamalı: hasta 5 + klinik 5)
- Skor merkezi `/skor` (Anket/Randevu/Ürün modal kartları)
- Geçmişim — journey sistemi + ZiyaretKarti birleşik akış
- Hesabım (profil + telefon SMS + şifre + hesap pasifleştir)
- Sipariş/İade/Adres yönetimi
- Referral + leaderboard
- 18+ doğum yılı kontrolü, KVKK/sözleşme onayı

**Sağlık Profesyoneli:**
- Beyan bazlı kayıt (ünvan + uzmanlık + kurum)
- Emerald tema panel (analiz/randevu gizli, akademi/mağaza odaklı)
- Akademi kurs satın alma + izleme

**Klinik Tarafı:**
- Klinik Panel V2 — 3 katmanlı dashboard (ŞIMDI/BU AY/SENIN SEÇTIKLERIN)
- Sidebar Gmail tarzı hover-expand + pin
- Akreditasyon (4 faz) + Onboarding (4 adım banner)
- Editöryel CMS + 6 tercihli kart sistemi
- Sonuç Vitrini KVKK rıza akışı (`shared_cases`)
- Takvim 7 filter pill + inline aksiyonlar
- 6 adımlı KlinikAkisWizard (Promise.all yok, race-safe)
- Hasta detay + ZiyaretKarti birleşik akış
- Jeton (kredi) sistemi + Stripe Checkout (EUR)
- Eğitmen başvuru + paket/video CRUD + publish

**Satıcı Tarafı:**
- Ürün/stok/sipariş/kazanç/iade/ödeme hesabı
- Stripe Connect (test mode aktif, live KYC bekliyor)
- Çoklu satıcı transfer (destination charge OR manual transfer)

**Akademi MVP:**
- Public discovery + paket detay + Stripe checkout + webhook
- `/panel/kurslarim` listesi + Cloudflare Stream player + ilerleme
- Kalite skoru cron (Bayesian shrinkage)
- Eğitmen başvuru + onay + paket/video yönetim
- %70/%30 split, manuel IBAN transfer

**Mağaza:**
- Ürün listesi + detay + sepet + checkout + sipariş takibi
- İade sistemi + kupon + referral komisyon

**Admin:**
- Klinik/Satıcı onay + Eğitmen başvuru onay
- Editöryel CMS (`/admin/icerik`)
- Kullanıcı/ürün/kupon/iade yönetim

**Bildirim:**
- Cron `0 9 * * *` (Hobby) — appointment_confirmed + 24h hatırlatma + score_update
- Email (Resend) + SMS (Netgsm)
- Welcome email 4 rol için

**Altyapı:**
- Production branch `claude/priceless-ellis` → `estelongy-clean.vercel.app`
- Stripe webhook (jeton + marketplace + akademi)
- Supabase RLS politikaları
- Sentry config dosyaları (DSN bekliyor)
- SEO altyapısı (JSON-LD, sitemap, manifest, robots, breadcrumbs) — dış kayıt bekliyor
