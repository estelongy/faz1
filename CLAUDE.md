# CLAUDE.md — Estelongy Proje Rehberi

Bu dosya her oturumda otomatik okunur. Kaynaklar: EGS_V2final.pdf (teknik), EGS_V3final.pdf (strateji).

---

## Proje Nedir?

**Estelongy** — Estetik sağlık alanında yapay zeka destekli klinik yönetim ve hasta takip platformu.

**EGS (Estelongy Gençlik Skoru):** Hastanın fotoğrafından yüz yaşlanma analizini yapan, C250 formülüne dayalı AI skorlama sistemi.

**Hedef kitle:** Estetik klinikler (B2B SaaS) + Bireysel hastalar (B2C)

**Mimari felsefe:** "Gelişime Açık Mimari" — her bileşen bağımsız, API kontratları sabit, implementasyon değişebilir. 100 → 1M kullanıcı, mimari değişmeden.

---

## Tam Kullanıcı Akışı

### AŞAMA 1 — Hasta Tarafı (Ücretsiz)

```
1. AI Ön Analiz
   → Fotoğraf yükle → GPT-4 Vision → C250 → EGS skoru oluşur
   → Skor bar göstergesinde canlı görünür (kırmızı/kahverengi/yeşil/mavi)

2. Randevu İsteği
   → Hasta klinik seçer, tarih gönderir
   → Klinik paneline direkt düşer, iletişim kurulur (ayrı onay adımı YOK)

3. Longevity Anketi
   → Hasta randevudan ÖNCE doldurur (uyku, stres, beslenme vs.)
   → Skor canlı güncellenir (+puan eklenir)
   → Bar göstergesinde anlık hareket görülür
```

### AŞAMA 2 — Klinik Tarafı (Jeton)

```
1. Hasta Kabulü
   → Klinik panelde "Hastayı Kabul Et" → JETON DÜŞER (bu noktada)
   → No-show = jeton yanmaz

2. Klinik Anketi (Yüz Yüze)
   → Aynı longevity soruları yüz yüze tekrar sorulur (iletişim başlangıcı)
   → Ek klinik soruları da eklenir
   → Hesaplama: önce hasta anketi puanı düşülür, sonra (hasta+klinik) toplam eklenir
   → Çift sayım önlenir, skor HİÇ DÜŞMEZ sadece güncellenir

3. İleri AI Analiz
   → Anket + geçmiş verilerle derin analiz
   → Skor güncellenir

4. Tetkik Girişleri
   → Kan, hormon vs. manuel giriş
   → Skor güncellenir (+0-2)

5. Hekim Değerlendirme
   → Skora ±X manuel düzeltme
   → Skor güncellenir

6. Hekim Süreç Onayı
   → Final formül: (Mevcut × 0.85) + (Hekim × 0.15)
   → KLİNİK ONAYLI EGS oluşur
```

### Skor Sistemi Özeti
- **AI Ön Analiz EGS:** Tahmini, anlık, "onaysız" — paylaşılabilir
- **Klinik Onaylı EGS:** Doğrulanmış, damgalı, güvenilir — paylaşım kartı üretilir
- Hasta anketi manipülasyonu riski: klinik yüz yüze tekrarlıyor + hekim onaylıyor → sistem kendi kendini doğruluyor

### Renk Bölgeleri

| Renk | Aralık | Anlam | Yönlendirme |
|------|--------|-------|-------------|
| Kırmızı | 0-49 | Yaşından yaşlı | Acil klinik |
| Kahverengi | 50-74 | Yaşında | Klinik önerisi |
| Yeşil | 75-89 | Yaşından genç | Koruma |
| Mavi | 90-100 | Çok iyi | Premium koruma |

---

## Kullanıcı Rolleri

| Rol | ID | Yetkiler | Özel |
|-----|----|----------|------|
| User | `role:user` | Analiz, Anket, Randevu, Sipariş, Yorum | Skor takibi, sosyal paylaşım |
| Clinic | `role:clinic` | Hasta listesi, Analiz onay, Rapor, Takvim | AI öneri düzeltme, jeton harcama |
| Vendor | `role:vendor` | Ürün, Stok, Sipariş, İade yönetimi | Komisyon takibi, mağaza ayarları |
| Admin | `role:admin` | Tüm kaynaklar, Onaylar, Ayarlar | Bildirim kanalı, global parametreler |

> Not: Klinik ve Vendor başvuruları `pending` durumunda User yetkisiyle çalışır, onaylanınca rol yükselir.

---

## 3 Fazlı Yol Haritası

### Faz 1 — MVP (Şu an burada)
- [x] Kullanıcı kayıt/giriş (Supabase Auth)
- [x] Klinik başvuru sistemi
- [x] Klinik paneli (randevu yönetimi)
- [x] Hasta paneli (randevu alma, iptal)
- [x] Mock AI analiz (fotoğraf yükleme → sahte EGS skoru)
- [x] E-posta bildirimleri (Supabase Edge Function + Resend)
- [x] Admin paneli (klinik/kullanıcı yönetimi)
- [ ] **Gerçek AI entegrasyonu** (OpenAI GPT-4 Vision + C250 formülü)
- [ ] **Jeton sistemi** (klinikler paket satın alır, randevu başına jeton)
- [ ] Stripe ödeme entegrasyonu
- [ ] EGS anket zinciri (hasta → klinik → testler → AI → doktor onayı)

### Faz 2 — Büyüme (Hedef %)
- Klinik paneli: %70 → %100 (takvim, ileri raporlama)
- Satıcı/Mağaza: %60 → %100
- Bildirim: %70 → %100 (Push/SMS → Smart)
- Mobil App: React Native (%0 → %100)
- Oyunlaştırma, affiliate sistemi

### Faz 3 — Ölçeklendirme
- AI eğitim altyapısı (fine-tuned kendi model)
- API Platformu (3. parti entegrasyonlar)
- Global/Çoklu dil (TR → EN → Çoklu)
- AWS/GCP'ye taşıma

---

## Teknik Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 14 (App Router) |
| Stil | Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes + Supabase |
| Database | Supabase PostgreSQL |
| Cache | Upstash Redis (Faz 2) |
| Storage | Supabase Storage → AWS S3 + Cloudflare R2 |
| AI | OpenAI GPT-4 Vision (MVP), self-hosted (sonra) |
| Edge Functions | Supabase (Deno runtime) |
| E-posta | Resend API |
| Ödeme | Stripe (henüz entegre değil) |
| Deploy | Vercel |
| Monitoring | Vercel Analytics, Sentry, LogRocket |

---

## Supabase Bilgileri

- **Proje ID:** `dcmnxmqzimrgmholktid`
- **URL:** `https://dcmnxmqzimrgmholktid.supabase.co`
- **Edge Function:** `send-appointment-email` (deploy edildi)
- **Webhook secret:** `whsec_estelongy_appt_2025`

### Env Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://dcmnxmqzimrgmholktid.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<mevcut key>
```

### Supabase'de yapılması gerekenler
- [ ] Google OAuth provider'ı etkinleştir (Dashboard → Auth → Providers)
- [ ] `RESEND_API_KEY` Edge Function secret olarak ekle
- [ ] `FROM_EMAIL` Edge Function secret olarak ekle (ör. `noreply@estelongy.com`)

---

## Veritabanı Şeması (Hedef / V2 Dokümanı)

Mevcut tablolar basit. Aşağıdaki şema tam hedef yapıdır.

### `scores` tablosu (henüz implemente değil)
```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  score_type TEXT CHECK (score_type IN ('on_analiz', 'klinik_onayli')),
  c250_base DECIMAL(5,2),
  hasta_anket_puani DECIMAL(5,2) DEFAULT 0,
  klinik_anket_puani DECIMAL(5,2) DEFAULT 0,
  tetkik_puani DECIMAL(5,2) DEFAULT 0,
  ileri_ai_puani DECIMAL(5,2) DEFAULT 0,
  hekim_degerlendirme DECIMAL(5,2) DEFAULT 0,
  hekim_onay_puani DECIMAL(5,2) DEFAULT 0,
  total_score DECIMAL(5,2) NOT NULL,
  color_zone TEXT GENERATED ALWAYS AS (
    CASE
      WHEN total_score < 50 THEN 'red'
      WHEN total_score < 75 THEN 'brown'
      WHEN total_score < 90 THEN 'green'
      ELSE 'blue'
    END
  ) STORED,
  clinic_id UUID REFERENCES clinics(id),
  analysis_id UUID REFERENCES analyses(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);
```

### `clinics` tablosuna eklenecek alanlar
```sql
slug TEXT UNIQUE,
address JSONB,
specialties TEXT[],
images TEXT[],
approval_documents TEXT[],
jeton_balance INTEGER DEFAULT 0,
jeton_settings JSONB DEFAULT '{}'
```

### `appointments` tablosuna eklenecek alanlar
```sql
duration_minutes INTEGER DEFAULT 30,
status ... 'no_show' da eklenecek,
initial_analysis_id UUID REFERENCES analyses(id),
final_score_id UUID REFERENCES scores(id),
clinic_notes TEXT,
clinic_data JSONB,
jeton_cost INTEGER
```

### Diğer tablolar (Faz 2+)
- `vendors` — satıcılar (commission_rate: 0.15 default)
- `products` — ürünler (score_contribution JSONB ile EGS katkısı)
- `orders` — siparişler
- `notification_queue` — push/sms/email kuyruğu (retry_count ile)
- `audit_logs` — tüm CRUD işlemleri loglanır
- `referral_codes` — affiliate sistemi (MVP'de pasif)

### RLS Politikaları
```sql
-- Skor: sahip veya ilgili klinik görebilir
CREATE POLICY score_access ON scores FOR ALL USING (
  auth.uid() = user_id
  OR auth.uid() IN (SELECT user_id FROM clinics WHERE id = scores.clinic_id)
);

-- Randevu: sahip veya ilgili klinik erişebilir
CREATE POLICY appointment_access ON appointments FOR ALL USING (
  auth.uid() = user_id
  OR auth.uid() IN (SELECT user_id FROM clinics WHERE id = appointments.clinic_id)
);
```

---

## AI Mimarisi

### Ön Analiz (OpenAI GPT-4 Vision)
```
Girdi: Selfie (JPEG/PNG, max 5MB)
  ↓
Ön İşleme: Yüz tespiti, kırpma, normalize (512x512)
  ↓
GPT-4 Vision Prompt:
"Analyze this facial image for skin aging indicators.
Score 0-100 for: wrinkles, pigmentation, hydration, tone_uniformity, under_eye.
Provide brief explanation for each.
Return JSON only."
  ↓
C250 Hesaplama: Ham skor → yaş faktörü → EGS
  ↓
Çıktı: EGS, renk bölgesi, bileşen skorları, açıklama
Fallback: AI down → retry queue
```

### API Response Yapısı
```json
{
  "result_score": 77.5,
  "color_zone": "brown",
  "c250_details": {
    "raw_score": 85,
    "age_factor": 0.96,
    "c250_result": 77.5,
    "explanation": "35 yaş için normal aralık"
  },
  "component_scores": {
    "wrinkles": 75,
    "pigmentation": 82,
    "hydration": 78,
    "tone_uniformity": 80,
    "under_eye": 72
  }
}
```

### İleri Analiz (Klinik aşaması)
- Girdi: Klinik anketi + Tetkik sonuçları (JSON)
- Model: OpenAI GPT-4 (MVP), sonra fine-tuned
- Çıktı: Hekim ekranında gösterilir, düzenleme imkanı var
- Hekim onayı: `(Mevcut × 0.85) + (Hekim × 0.15)`

---

## Jeton Sistemi (Henüz İmplemente Değil)

### İş Modeli
- **Platform aboneliği: ÜCRETSİZ** (klinikler için sıfır giriş engeli)
- **Ücretlendirme:** Sadece gerçekleşen hasta ziyaretinde jeton düşer
- **Jeton:** Klinik önceden satın alır (prepaid) → fatura karmaşıklığı yok
- **Değer önerisi:** "Sadece gelen müşteri için öde" — fake hesaplara %30-40 yerine çok ucuz

### İş Kuralları
| Aksiyon | Jeton Değişimi | Koşul |
|---------|----------------|-------|
| Paket satın alma | +X jeton | Stripe ödeme başarılı |
| Hasta kabulü | -1 jeton | Klinik "Kabul Et" tıkladığında |
| Randevu oluşturma | Jeton düşmez | Sadece kabul anında düşer |
| No-show | Jeton yanmaz | Hasta gelmedi = kabul yapılmadı |

### Stripe Akışı
`Checkout Session → Webhook → jeton_balance artır`

---

## Bildirim Altyapısı (Hedef)

```
Tetikleyici (Skor güncellendi, Randevu yaklaştı)
  ↓
Kural Motoru (Admin ayarlarına göre kanal seçimi)
  ↓
Kuyruk (Bull + Redis)
  ↓
Push: Firebase Cloud Messaging
SMS: Twilio / Netgsm
Email: Resend (şu an aktif)
  ↓
Gönderim + Loglama (retry: 3 kez)
```

### Admin Bildirim Kanalları
```json
{
  "score_update": "push",
  "appointment_reminder_24h": "sms",
  "appointment_reminder_1h": "push",
  "monthly_care": "push",
  "score_expiry_6m": "push"
}
```

---

## Sayfa Yapısı

```
/                    → Landing page
/giris               → Kullanıcı giriş
/kayit               → Kullanıcı kayıt
/panel               → Hasta paneli (randevular, analiz geçmişi)
/analiz              → EGS analiz sayfası (fotoğraf yükle)
/randevu             → Klinik seç + randevu al
/kurumsal/giris      → Klinik giriş
/klinik/basvur       → Klinik başvuru formu
/klinik/panel        → Klinik yönetim paneli
/admin               → Admin ana sayfa
/admin/klinikler     → Klinik yönetimi
/admin/kullanicilar  → Kullanıcı yönetimi
```

---

## Viral Paylaşım Kartı

- **Tetikleyici:** Klinik Onaylı EGS oluştuğunda paylaşım kartı üretilir
- **Format:** `@vercel/og` ile sunucu taraflı görsel üretimi
- **İçerik:** Büyük skor + renk bölgesi + "Klinik Onaylı" damgası + Estelongy CTA
- **Kanallar:** WhatsApp, Instagram, Facebook (Web Share API mobilde), masaüstünde ayrı butonlar
- **TikTok:** Direkt API yok, link paylaşımı
- **Viral döngü:** Paylaşım → arkadaş görür → kart sayfasında "Senin skorun ne? Ücretsiz öğren" → yeni kullanıcı
- **Önemli:** Paylaşım aktif olarak teşvik edilmeli (skor aldıktan sonra otomatik prompt)

---

## Bilinen Açık Sorunlar / Yapılacaklar

### Kritik (Faz 1 tamamlamak için)
- [ ] Gerçek AI: OpenAI GPT-4 Vision + C250 formülü (mock → gerçek)
- [ ] Jeton sistemi: `jeton_balance` klinik tablosuna + bakiye kontrolü + Stripe
- [ ] `RESEND_API_KEY` Supabase secrets'e ekle

### Orta Öncelik
- [ ] Google OAuth (Supabase Dashboard + Google Cloud Console)
- [ ] Klinik panelinde takvim görünümü + müsaitlik slotları
- [ ] `scores` tablosu tam şema ile yeniden migrate et
- [ ] Randevu `no_show` statüsü ekle

### Düşük Öncelik (Faz 2)
- [ ] Vendor/Mağaza sistemi
- [ ] Notification queue (Bull + Redis)
- [ ] Audit logs
- [ ] Referral/Affiliate sistemi
- [ ] Profil fotoğrafı, klinik logosu/galeri

---

## Geliştirme Kuralları

- `'use client'` bileşenlerinde `export const dynamic = 'force-dynamic'` KULLANILAMAZ
- Server action'larda her zaman `user.id` ile ownership kontrolü yap
- `router.refresh()` → Supabase insert/update sonrası Next.js cache temizler
- Auth callback'te open redirect koruması: `next` param sadece `/` ile başlıyorsa geçerli
- Admin kontrolü hem layout hem page/action katmanında olmalı (defense-in-depth)
- AI servis down → kullanıcıya hata göster + retry queue'ya ekle (silent fail yok)

---

## Commit Geçmişi (Önemli)

- `433ee57` — Unused variable fix (klinik/panel/page.tsx)
- E-posta Edge Function deploy edildi (Supabase dashboard'dan kontrol et)
- DB migration: `enable_pg_net_appointment_webhook` (pg_net + trigger)
