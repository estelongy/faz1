# RECOVERY.md — Estelongy Felaket Kurtarma Runbook

> **Senaryo:** PC çalındı / yandı / bozuldu. Yeni bir bilgisayar var, sıfırdan sisteme nasıl ulaşırım?

**Garantilen:** Tüm veriler **bulutta yedekli**. Bu doküman, "yeni PC'de 30 dk içinde tam erişim" rehberidir.

---

## 0. Önce Sakin Ol — Hiçbir Şey Kaybolmadı

Estelongy sistemi 4 ayrı bulutta canlı:
- **Kod:** GitHub (`github.com/estelongy/faz1`)
- **DB:** Supabase Cloud (`dcmnxmqzimrgmholktid.supabase.co`)
- **Hosting:** Vercel (`estelongy-clean.vercel.app` — production canlı)
- **Diğer:** Stripe, Postmark, Netgsm, Upstash, OpenAI, Cloudflare hesaplarındaki tüm yapılandırma duruyor

**PC'nin kaybolması = sadece local kopyanın gitmesi.** Production hizmeti hiç etkilenmez.

---

## 1. Yeni PC'de Erişim — Hesap Listesi

Aşağıdaki hesapların **sadece** giriş bilgilerine ihtiyacın var. Hepsi e-posta ile şifre kurtarma destekler.

| Servis | Giriş URL | Hesap |
|---|---|---|
| GitHub | https://github.com/login | `estelongy` |
| Vercel | https://vercel.com/login | `estelongy@gmail.com` |
| Supabase | https://supabase.com/dashboard | `estelongy@gmail.com` |
| Stripe | https://dashboard.stripe.com | `estelongy@gmail.com` |
| Postmark | https://account.postmarkapp.com | `estelongy@gmail.com` |
| Netgsm | https://netgsm.com.tr | İzzet Gök hesabı |
| Upstash | https://console.upstash.com | `estelongy@gmail.com` |
| OpenAI | https://platform.openai.com | `estelongy@gmail.com` |
| Cloudflare | https://dash.cloudflare.com | `estelongy@gmail.com` |
| Sentry | https://sentry.io | `estelongy@gmail.com` |

> **Kritik:** Eğer `estelongy@gmail.com` Gmail hesabına da erişim kaybolduysa Google Hesap Kurtarma (recovery email/phone) → +90 5XX 2845003 cep doğrulaması.

---

## 2. Adım Adım Kurtarma (30 dk)

### Adım 1: Yeni PC'ye temel araçları kur (5 dk)

```bash
# 1) Node.js 20+
https://nodejs.org/  → LTS sürümü kur

# 2) Git
https://git-scm.com/

# 3) GitHub CLI (opsiyonel ama kolaylaştırır)
https://cli.github.com/

# 4) Vercel CLI
npm i -g vercel

# 5) Code editor (VS Code önerilir)
https://code.visualstudio.com/
```

### Adım 2: Kodu klonla (2 dk)

```bash
# Bir klasör seç
cd C:\Users\<kullanıcı>\
mkdir estelongy && cd estelongy

# Klonla
git clone https://github.com/estelongy/faz1.git estelongy-faz1
cd estelongy-faz1

# Production branch'e geç
git checkout claude/priceless-ellis

# Bağımlılıkları yükle
npm install
```

### Adım 3: Vercel'e bağlan, env vars'ları çek (5 dk)

```bash
# Vercel'e login
vercel login
# (browser açılır, e-posta ile onay)

# Bu projeyi mevcut Vercel projesine link'le
vercel link
# Soru: existing project? → YES
# Team: estelongy-3655s-projects
# Project: faz-1

# Production env vars'ları çek
vercel env pull .env.local --environment=production
```

> Bu komut tüm env değişkenlerini `.env.local` dosyasına yazar. **Hassas değerler şifreli verilir** — sadece kendi Vercel hesabın açabilir.
>
> Eğer Vercel hesabına erişim YOKSA, env vars'ları **password manager'dan** (1Password vault) manuel kopyala. Şablon: `.env.example`

### Adım 4: Lokal test (5 dk)

```bash
# Build kontrol
npm run build

# Dev server
npm run dev
# → http://localhost:3000 açılır
```

### Adım 5: Production deploy (gerekirse) (5 dk)

```bash
# Production'a deploy (canlıda kod zaten çalışıyor, gerekirse yeni deploy)
vercel --prod --yes
```

---

## 3. DB Şeması Geri Yükleme (Sadece Felaket Senaryosunda)

> **Genelde gerekmez** — Supabase Cloud kayıp olmaz, otomatik backup yapar.
> Bu adım, **yeni Supabase projesine taşıma** ya da **DB silinme** gibi extreme senaryolar için.

### 3.1 Supabase otomatik backup'ları

- **Free plan:** Günlük backup, 7 gün saklama
- **Pro plan:** PITR (Point-in-Time Recovery), 7-28 gün
- **Erişim:** Dashboard → Database → Backups

### 3.2 Manuel restore — yeni projeye taşıma

```bash
# 1) Yeni Supabase projesi oluştur
https://supabase.com/dashboard → New project

# 2) Supabase CLI kur
npm i -g supabase

# 3) Eski projeden şema dump al (login gerekir)
supabase login
supabase db dump --db-url "postgresql://postgres:<ESKI_DB_PASSWORD>@db.dcmnxmqzimrgmholktid.supabase.co:5432/postgres" > full_dump.sql

# 4) Yeni projeye uygula
supabase db push --db-url "postgresql://postgres:<YENI_DB_PASSWORD>@db.<YENI_REF>.supabase.co:5432/postgres"
```

### 3.3 Migration listesi yedek

`supabase/migrations.txt` — 56 migration kronolojik liste.
Tam DDL'leri Supabase Dashboard → Database → Migrations'ta görebilirsin.

### 3.4 Kritik fonksiyon yedeği

`supabase/critical_functions.sql` — şu fonksiyonlar dosyada:
- `set_user_role` — rol güncelleme
- `consume_jeton` — klinik kredi tüketimi
- `add_jeton` — jeton yükleme (Stripe webhook)
- `adjust_points` — kullanıcı puanı
- `decrement_product_stock` — atomik stok
- `generate_referral_code` — referral
- `enforce_vendor_kyc_before_approval` — KYC trigger
- `app_delete_account_cascade` — KVKK/GDPR silme

Yeni Supabase projesinde önce migration'ları, sonra bu dosyayı çalıştır.

---

## 4. Env Vars Yedekleme — ÖNEMLİ

> **Bu adımı bugün yap, sonra unutursan PC kaybında env vars'lar gider.**

### 4.1 Önerilen: 1Password (veya Bitwarden) vault

1. https://1password.com → Personal account ($3/ay)
2. Yeni Vault: "Estelongy Production"
3. Her env vars için ayrı item:
   - Title: `POSTMARK_API_TOKEN`
   - Type: Password
   - Notes: hangi servis, ne zaman alındı

**Avantaj:** Şifreli, master password'la korunur, telefondan erişilebilir, çoklu cihaz sync.

### 4.2 Alternatif: GPG ile şifreli dosya

```bash
# GPG kur (Windows: Gpg4win)
# Anahtar oluştur (sadece bir kez)
gpg --full-generate-key

# Env vars yedeği şifrele
gpg --output env-backup.gpg --symmetric --cipher-algo AES256 .env.local

# Geri açmak için:
gpg --output .env.local --decrypt env-backup.gpg
```

`env-backup.gpg` dosyasını Google Drive / Dropbox / iCloud'a koy. Şifreli olduğu için cloud'da güvenle durur.

### 4.3 Hangisini yapmalı?

- **1Password önerisi:** Otomatik sync, telefondan erişim, kolay paylaşım (ekibe). $3/ay.
- **GPG alternatif:** Ücretsiz, daha teknik, sadece sen erişirsin.

**Her halükarda, en kötü senaryoda env'leri Vercel Dashboard'dan da görebilirsin** (Vercel hesabına erişim varsa). Settings → Environment Variables → değer maskelenmiş gösterilir, "Edit" ile yeniden alınabilir.

---

## 5. Hesap Sıfırlama Senaryoları

### 5.1 Gmail hesabı kayboldu
1. https://accounts.google.com/signin/recovery
2. Recovery e-posta veya telefon (+90 5XX 2845003)
3. Geri kazanılırsa tüm bağlı hesaplar (Vercel, Supabase, Stripe, vs.) çalışır

### 5.2 GitHub hesabı kayboldu
1. https://github.com/password_reset
2. Recovery codes ev hesap kurtarma e-postası
3. SSH keys yeni PC'de yeniden oluştur

### 5.3 Vercel hesabı + GitHub bağlı
- Vercel = GitHub OAuth ile login. GitHub kurtarınca Vercel de gelir.

### 5.4 Stripe hesabı kayboldu
1. https://support.stripe.com/express → "Account access" ticket
2. KYC belgeleri gerekebilir (Vestoriq Estonya documents)

### 5.5 Domain (estelongy.com) kayboldu
- Domain registrar'ı kontrol et (Vercel'in yönettiği için Vercel hesabıyla bağlantılı)
- Vercel Dashboard → Domains → estelongy.com → Transfer / DNS

---

## 6. Periyodik Yedekleme Listesi

> Bu doğru çalıştığını kontrol et — ayda bir.

- [ ] **Git push** → her commit sonrası `git push origin claude/priceless-ellis`
- [ ] **CLAUDE.md** → güncel mi? Yeni özellik eklendiğinde yansıt.
- [ ] **RECOVERY.md** → yeni hesap eklendiğinde, yeni env vars çıktığında güncelle.
- [ ] **1Password vault** → yeni env değişikliği varsa kopyala.
- [ ] **Supabase backup** → Dashboard → Database → Backups → günlük backup'lar listede mi (Free plan: 7 gün)?
- [ ] **Stripe webhook secret** → değişti mi?
- [ ] **Domain expiration** → DNS Provider'dan otomatik yenileme açık mı?

---

## 7. Eğer Bu Doküman da Kayıp Olursa

Bu RECOVERY.md dosyasını **3 yerde sakla:**

1. **Repo içinde** → GitHub'da otomatik (zaten orada)
2. **Cloud sürücü** → Google Drive / Dropbox / iCloud → "Estelongy Backup" klasörü
3. **Yazıcıdan basılı kopya** → 1 sayfa özet, evde + ofiste birer kopya. (En azından hesap listesi + GitHub repo URL)

Telefonun da kaybolduğu nükleer senaryo için: Bir akrabaya/güvenilir kişiye URL'lerin ve recovery e-posta'nın printout'unu emanet et.

---

## 8. Hızlı Referans Kartı

```
Repo:        https://github.com/estelongy/faz1
Branch:      claude/priceless-ellis
Vercel:      https://estelongy-clean.vercel.app
Supabase:    https://dcmnxmqzimrgmholktid.supabase.co

Hesap:       estelongy@gmail.com
Telefon:     +90 5XX XXX 5003 (recovery için)

Kurucu:      İzzet Gök — dr.izzetgok@gmail.com
Yedek admin: estelongy@gmail.com
```

---

**Son güncelleme:** 2026-05-08
**Bu dosyayı hazırlayan:** Claude (asistant)
**Test edildi mi?:** Hayır — pratik yapmak için bir Pazar günü yeni bir VM'de test çalıştırılması önerilir.
