# Estelongy Kitabı — Bölüm: EsteStorePRO

*İş Ortağı app'i. Vendor cebine ne taşır.*

---

## Tek cümle

EsteStorePRO, ÜTS kayıtlı ürün satan İş Ortağı'nın siparişten kazanca, etiketten yorum yanıtına kadar bütün operasyonunu cebinden yürüttüğü Capacitor flavor app'idir. Web tarafında `/satici/panel` olarak çalışan vendor paneli — mobilde aynı SSR'a bakan WebView.

---

## Roller — kim açar, ne yapar

**Onaylı vendor** — Sabah app'i açar, gece kapatır. Gün içinde 6 aksiyon vardır: yeni sipariş hazırla, etiket bas, müşteri sorusuna cevap yaz, iade kararı ver, yorum yanıtla, kazancı izle. Her aksiyon AppHome'dan 1 tık uzakta.

**Başvuru aşamasındaki vendor** — App'i ilk açar. Karşılama'da 3 slayt görür (EsteStore nedir / Estelongy felsefesi / Performans skoru ile büyü). "İş Ortağı başvurusu" CTA'sına basar, formu doldurur, admin onayını bekler. Onay gelince giriş yapabilir.

**Yanlış cebe gelen** — App'i indirdi ama vendor değil (hasta/hekim). Karşılama'nın altında "Estelongy ekosistemi" gridinden 3 consumer app'in (BiyoAGE / EsteKlinik / EsteStore) Play Store linkleri görünür. Doğru cebe yönlendirilir.

---

## Galaksi konumu

EsteStore galaksisinin **PRO katmanı**. 3 galaksi-3 consumer app + 2 PRO app = 5 Capacitor flavor mimarisinde 5. flavor. Marka rozetinde `EsteStore` nötr + `PRO` amber vurgu.

- `server.url` → `https://estelongy.com/satici/karsilama`
- Tema: slate-950 zemin + amber-400 vurgu (klinik PRO emerald'in karşılığı)
- Galaksi temasından kopuk değil — `/giris?g=estestore` ekranı da PRO varyantında render olur (kayıt/kurumsal-giriş öğeleri gizli)

---

## Mimari — 5 katman

### 1. Flavor (Capacitor)
- App ID: `com.estelongy.estestorepro`
- `capacitor.config.json` → `server.url=estelongy.com/satici/karsilama`
- Native değişiklik yok — sadece WebView. Tüm UI canlı SSR'dan çekilir; APK rebuild ancak Capacitor config / ikon / plugin değişirse gerekir.

### 2. Auth
- Middleware: `getUser()` (token validate) — `getSession()` değil
- Galaksi-aware redirect: korumalı route → `/giris?g=estestore&next=<path>`
- Karşılama: `getUser()` döner → varsa `/satici/panel`, yoksa karşılama göster (eski cookie mantığı kaldırıldı)

### 3. Layout (kök `app/layout.tsx`)
- `NativeTopBar` — başlık + geri butonu (sub-page'lerde)
- `SaticiBottomNav` — Panel / Ürün / Sipariş / İade / Menü (5 sekme, amber-400 aktif)
- `AppFlavorRoleGate` — `estestorepro` + non-vendor login → Play Store + çıkış kapısı
- `AppBackHandler` — Android geri tuşu (root path → çıkış onay modal, sub-page → `history.back()`)
- `AppTopSpacer` — status bar safe-area
- Native-only: web'de tüm bunlar no-op

### 4. Route ağacı (`/satici/panel` altı)
14 alt route + AppView komponentleri. Her route web tarafında klasik dashboard render eder; `getServerFlavor() === 'estestorepro'` ise mobile-first AppView'ı render eder. Server data fetch tek seferdir, sunum katmanı flavor-aware.

### 5. DB
9 tablo — bu app'in dokunduğu kayıt zinciri:
`vendors → products → orders → order_items → (returns | reviews | product_questions) + vendor_shipping_settings + device_push_tokens`

---

## Ana ekranlar — route → ne gösterir → DB

| Route | Ekran | DB |
|---|---|---|
| `/satici/karsilama` | Onboarding (3 slayt + 2 CTA) | — |
| `/satici/panel` | AppHome: kazanç 30g, "ŞİMDİ" 3-stat, **Yeni Ürün** CTA, hızlı erişim grid | orders + order_items + returns + product_questions count |
| `/satici/panel/urunler` | Ürün listesi (kart) | products |
| `/satici/panel/urunler/ekle` | Yeni ürün formu (mobile-first sayfa) | products INSERT |
| `/satici/panel/urunler/[id]/duzenle` | Düzenle + sil | products UPDATE/DELETE |
| `/satici/panel/siparisler` | Sipariş kartları + sticky filter pills (Tümü/Bekleyen/Hazırlık/Kargoda/Teslim) | order_items + orders + profiles |
| `/satici/panel/siparisler/etiket/[id]` | Yazdırılabilir etiket (HTML print) | order_items + vendor_shipping_settings |
| `/satici/panel/siparisler/etiket/toplu` | Toplu etiket print sayfası | aynı |
| `/satici/panel/iadeler` | İade talepleri (status filter) | returns + order_items |
| `/satici/panel/sorular` | Ürün soruları (yanıtsız önce) | product_questions |
| `/satici/panel/yorumlar` | Müşteri yorumları + vendor yanıt formu | reviews + profiles |
| `/satici/panel/kazanc` | 30g + 12 ay grafik + aylık özet + son işlemler tablo | order_items + vendor stats |
| `/satici/panel/performans` | 5 metrik A-F karne | vendor_performance lib |
| `/satici/panel/magaza` | Mağaza profili (banner, hakkımızda, görseller) | vendors + vendor_profile |
| `/satici/panel/kargo` | Gönderici bilgileri + carrier tercihleri | vendor_shipping_settings UPSERT |
| `/satici/panel/hesabim` | Profil + şifre değiştir | auth.users + profiles |
| `/satici/panel/odeme-hesabi` | Stripe Connect onboarding *(açık)* | vendors.stripe_* |
| `/satici/panel/kyc` | KYC dokümanlar | vendors.kyc_* |
| `/satici/panel/menu` | Drawer-replacement (Operasyon / İş Hesabı / Yardım + çıkış) | — |

---

## İş akışları (uçtan uca — gerçek zincirler)

### A. Vendor onboarding
1. APK aç → karşılama (3 slayt + 2 CTA)
2. "İş Ortağı başvurusu" → `/satici/basvur`
3. Form: şirket bilgileri + vergi no + IBAN + KYC dokümanlar → `vendor_applications`
4. Admin onayı → `vendors` INSERT + `vendors.approval_status='approved'`
5. Email onay bildirimi
6. APK aç → karşılama → "Giriş yap" → `/giris?g=estestore&next=/satici/panel` → AppHome

**Aksiyonlar:** `saticiBasvurAction`, admin `approveVendorAction`
**Yan eser:** vendor'a tanıtım email'i + ilk ürün ekleme rehberi (gelecek)

### B. Sipariş döngüsü (uçtan uca — bugünkü 4 commit'le tamamlandı)

```
Müşteri → sepet → Stripe Checkout
   ↓ (webhook)
orders.payment_status='paid'
   ↓
notifyVendorNewOrder → email + SMS + FCM push
   ↓
Vendor → /satici/panel/siparisler → "Bekleyen" tab
   ↓
"Hazırlamaya Başla" → fulfillment_status='preparing'
   ↓
Kargo dropdown (Aras / Sürat / MNG — preferred_carriers'tan)
   ↓
"Etiket Oluştur" → etiketOlusturAction(orderItemIds, carrier)
   - RPC generate_shipping_label_code → EST-YYYY-XXXXXX
   - tracking_number + tracking_carrier + shipped_at set
   - fulfillment_status='shipped'
   ↓
notifyOrderShipped → müşteri email + SMS (takip no + carrier site URL)
   ↓
Müşteri → /siparis/[orderNumber] → KargoTakipKart
   - Paket bazlı grup (her tracking_number = ayrı kart)
   - "Kargo şirketi sitesinde takip et" link
   - "Teslim Aldım" buton
   ↓
teslimAldimAction → mark_order_items_delivered_by_customer RPC
   (SECURITY DEFINER + owner check + fulfillment_status='shipped' guard)
   - fulfillment_status='delivered', delivered_at=now()
   ↓
notifyVendorDeliveryConfirmed → vendor email + SMS + FCM push (yeşil)
   ↓
14 günlük iade penceresi açılır
```

**Aksiyonlar:** `etiketOlusturAction`, `kargoGuncelleAction` (manuel), `fulfillmentGuncelleAction`, `teslimAldimAction`
**Felsefe:** üç tarafın da gördüğü tek hikaye — vendor "shipped" demese müşteri görmez, müşteri "aldım" demese vendor döngü kapanışını öğrenmez.

### C. İade akışı

```
Müşteri delivered'dan sonra 14 gün içinde → IadeTalepForm
   ↓
returns INSERT (status='pending')
   ↓
notifyVendorReturnRequested → email + SMS + push
   ↓
Vendor → /satici/panel/iadeler → karar (approved/rejected)
   ↓
notifyReturnDecision → müşteri email
   ↓
status='approved' → kargo geri akışı + para iadesi (Stripe refund — açık)
status='rejected' → resolver_note müşteriye gösterilir
```

**Aksiyonlar:** `iadeTalebiOlusturAction`, `iadeKararAction`
**SLA:** vendor 48 saat içinde karar vermeli; geç yanıt performans skorunu etkiler.

### D. Soru-cevap

```
Müşteri ürün sayfasında soru sor → askQuestionAction
   ↓
product_questions INSERT
   ↓
notifyVendorNewQuestion → email + SMS + push
   ↓
Vendor → /satici/panel/sorular → cevap yaz
   ↓
product_questions.answer set → ürün sayfasında herkese görünür
```

**Aksiyonlar:** `askQuestionAction`, `answerQuestionAction`
**SLA:** 48 saat (performans skoruna girer).

### E. Yorum + vendor yanıt

```
Müşteri delivered ürün için /panel/urun-degerlendir/[orderId]
   → yıldız + body → reviews INSERT
   ↓
Vendor → /satici/panel/yorumlar → respondToReviewAction
   (RLS reviews_vendor_response_update: vendor sadece kendi product_id'lerinde)
   ↓
vendor_response set → ürün sayfasında "Mağaza yanıtı" olarak görünür
```

**Aksiyonlar:** `respondToReviewAction`, `clearReviewResponseAction`
**Felsefe:** yanıtlı vendor güven verir → performans skoru → vitrin sıralaması.

### F. Kazanç akışı

```
Her order_item satırında:
  line_total          = quantity × unit_price
  commission_amount   = line_total × commission_rate (default %15)
  vendor_payout       = line_total − commission_amount
   ↓
fulfillment_status='delivered' → komisyon kesinleşir (önce "pending" havuzunda)
   ↓
/satici/panel/kazanc:
  - Toplam ciro / komisyon / teslim edilen / süreçteki
  - 12 ay grafiği (last12Months)
  - Aylık özet listesi
  - Son 30 işlem tablosu
   ↓
[AÇIK] Stripe Connect onboarding → /satici/panel/odeme-hesabi
       → vendor.stripe_account_id + stripe_payouts_enabled=true
   ↓
[AÇIK] Periyodik payout → vendor'un banka hesabına transfer
```

**Şu anki durum:** payout hesabı tutulur ama gerçek banka transferi YOK. Vendor "kazandım" görür, parayı görmez. Stripe Connect production-öncesi son büyük halka.

---

## Bildirim matrisi

| Olay | Email | SMS | FCM Push |
|---|---|---|---|
| Yeni sipariş (vendor'a) | ✓ | ✓ | ✓ |
| Müşteri "Teslim Aldım" (vendor'a) | ✓ | ✓ | ✓ |
| Yeni iade talebi (vendor'a) | ✓ | ✓ | ✓ |
| Yeni ürün sorusu (vendor'a) | ✓ | ✓ | ✓ |
| Sipariş "Kargoya verildi" (müşteriye) | ✓ | ✓ | — |
| Sipariş "Teslim edildi" (müşteriye — vendor manuel) | ✓ | ✓ | — |
| İade kararı (müşteriye) | ✓ | — | — |

**Altyapı:**
- Email: Resend (Estelongy domain) — `src/lib/notifications.ts`
- SMS: Netgsm (production'da) — `src/lib/netgsm.ts`
- Push: FCM v1 (saf node:crypto JWT + OAuth2 token swap, Firebase Admin SDK'sız) — `src/lib/push.ts`
- Hepsi fire-and-forget — bildirim hatası UI'yı bloklamaz, console.error'a yazılır

---

## Performans skoru — 5 metrik A-F karne

| Metrik | Hesap | Sahaya etki |
|---|---|---|
| Sipariş hazırlama hızı | `shipped_at − paid_at` ortalaması | <24 saat = A, 48-72h = C, >72h = F |
| İade oranı | delivered → returned % | <%3 = A, %5-10 = C, >%15 = F |
| Müşteri puanı | reviews.rating ortalaması | 4.7+ = A, 4.0-4.5 = C, <3.5 = F |
| Soru yanıt oranı | answered / total | %95+ = A |
| Yanıt hızı | `answer_at − created_at` ortalaması | <12h = A |

**Sahaya yansıma:** skor → vitrin sıralaması (vendor performansı yüksek olan ürünler liste başında — gelecek faz). EsteVerify hesabına da girecek.

---

## Felsefe bağı

**Küratörlü vitrin:** Görselsiz veya açıklamasız (< 30 karakter) ürün admin onayına BİLE giremez. Server kalite kapısı (`urunEkleAction`) client validation bypass edilse de keser. Estelongy "savruk yığınlı pazaryeri" değil — IMDb gibi nitelikli vitrin.

**ÜTS zorunlu:** Her ürün ÜTS (Ürün Takip Sistemi) kayıt numarasıyla listelenir. 5-64 karakter arası, kontrol server-side. Sahte/illegal kozmetik filtreleme katmanı.

**Kategori sınırı:** Hasta (kozmetik) vs Klinik (sarf_medikal). `klinik_only` flag'i ile sadece klinik/health_pro/admin rolündeki kullanıcı görür. `treatment_type='treatment'` veya `category='sarf_medikal'` ise trigger otomatik `klinik_only=true` set eder.

**EP eşiği (Estelongy Güzellik Puanı):** Bilim · üretici · hekim · longevity katkısı — gelecekteki vitrin sıralama metriği. Her ürün için EP hesaplanacak, eşik altı vitrinde görünmeyecek.

**Operasyonel zorlama:** "Kullanmadan ilerleyemezsin" prensibi — vendor `vendor_shipping_settings` sender_email + postal_code doldurmadan etiket BASAMAZ. UI'da yumuşak uyarı + server-side hata. DB NOT NULL ile değil, operasyonel kapıyla — geriye dönük kayıt bozulmaz.

---

## DB sözlüğü (bu app'in dokunduğu)

| Tablo | Ana alanlar |
|---|---|
| `vendors` | id, user_id, company_name, approval_status, commission_rate, stripe_account_id, stripe_payouts_enabled, phone, kyc_* |
| `products` | id, vendor_id, uts_no, slug, name, category, subcategory, treatment_type, klinik_only, approval_status, pricing_tiers (jsonb), images, ingredients, is_active |
| `orders` | id, order_number, user_id, payment_status (pending/paid/failed/refunded), status, total, subtotal, shipping_fee, address_snapshot, is_guest, guest_email, guest_phone, paid_at |
| `order_items` | id, order_id, vendor_id, product_id, product_snapshot (jsonb), quantity, unit_price, line_total, commission_rate, commission_amount, vendor_payout, fulfillment_status, tracking_number, tracking_carrier, shipping_label_code, shipped_at, delivered_at |
| `returns` | id, order_item_id, status (pending/approved/rejected/completed), reason, description, resolver_note |
| `reviews` | id, product_id, user_id, rating, title, body, is_verified, vendor_response, vendor_responded_at, vendor_responded_by |
| `product_questions` | id, product_id, vendor_id, user_id, question, answer, answered_at |
| `vendor_shipping_settings` | vendor_id (PK), sender_name, sender_phone, sender_email, sender_address_line, sender_district, sender_city, sender_postal_code, default_carrier, preferred_carriers (text[]), free_shipping_threshold, note |
| `device_push_tokens` | token, user_id, platform |

---

## RPC fonksiyonları

| Fonksiyon | Amaç | Güvenlik |
|---|---|---|
| `generate_shipping_label_code()` | Atomik EST-YYYY-XXXXXX kod üretir | volatile |
| `mark_order_items_delivered_by_customer(uuid[])` | Müşteri "Teslim Aldım" → shipped kalemleri delivered'a çeker | SECURITY DEFINER + owner check + status guard |
| `is_vendor_of_order(uuid)` | RLS recursion önlemek için vendor sahipliği kontrolü | SECURITY DEFINER |

## Server actions (kanonik liste)

**Ürün:** `urunEkleAction`, `urunGuncelleAction`, `urunSilAction`
**Sipariş:** `kargoGuncelleAction` (manuel takip no), `etiketOlusturAction` (Estelongy etiket), `fulfillmentGuncelleAction` (preparing/delivered/cancelled)
**İade:** `iadeTalebiOlusturAction` (müşteri), `iadeKararAction` (vendor)
**Soru:** `askQuestionAction` (müşteri), `answerQuestionAction` (vendor)
**Yorum:** `respondToReviewAction`, `clearReviewResponseAction`
**Ayarlar:** `saveShippingSettingsAction`, `savePaymentAccountAction`
**Müşteri tarafı:** `teslimAldimAction`

## RLS politikaları (özet)

- `order_items_vendor_read/update`: vendor sadece kendi `vendor_id`'sindeki satırları görür/değiştirir
- `order_items_customer_read`: kullanıcı sadece kendi siparişlerinin kalemlerini görür
- `products_vendor_*`: vendor sadece kendi ürünlerini günceller/siler
- `reviews_vendor_response_update`: vendor sadece kendi product_id'lerindeki review'lara response yazar
- `vendor_shipping_settings`: vendor başına 1 satır, vendor own
- `returns_vendor_*`: order_item'ın vendor_id'si üzerinden RLS

---

## Açık halkalar (production öncesi)

1. **Stripe Connect onboarding** — payout hesabı tutulur, gerçek banka transferi yok. Standing constraint: "EN SON YAPACAZ" — son büyük halka.
2. **48+ saat hatırlatma akışları** — yanıtsız soru/iade için vendor'a 2. SMS reminder yok (saha sinyali: 10 soru + 6 iade 48+ saat bekliyor).
3. **Saha behavior testi** — vendor login + etiket basma + müşteri "Teslim Aldım" zinciri canlıda hiç çalıştırılmadı; schema/build/RPC guard ✓ ama uçtan uca gerçek tıklama yok.

---

## Kitabın diğer bölümleriyle bağ

**"3 galaksi tek çatı"** — EsteStore galaksisinin PRO katmanı bu app. Galaksi temasını koruyarak vendor odaklı UX.

**"Başrol modeli"** — Vendor için başrol: *siparişi vaktinde gönder + müşteriyi mutlu et*. AppHome bunu hizalar: ŞİMDİ şeridi 3 sayı + Yeni Ürün CTA + kazanç özeti. "Çekirdek aksiyon en görünür yer" prensibi.

**"EsteVerify"** — Gelecekte vendor'un Satıcı Güven Skoru buradan beslenecek (performans skoru + iade oranı + sahtelik raporları). Bu app vendor için "skor inşa eden günlük operasyon platformu".

**"Performans skoru"** — Galaksi-ortak metrik. EsteKlinikPRO'da hekim için de geçerli (randevu uyum + müşteri puan + iletişim). Karne formatı (A-F) iki PRO app'te aynı dilde.

**"Estelongy felsefesi"** — Genç görünmek değil, sağlıklı görünmek. EsteStore vitrinde her ürünün bu felsefeye katkısı sorulur (longevity, klinik onay, EP eşiği). Vendor bu felsefeye uyduğu sürece app'in vitrini ona açıktır.

---

## Versiyon

Bu bölüm 9 Haziran 2026 itibarıyla yazıldı — son commit `c501f1c` (kargo ayar uyarısı granular).
Sipariş döngüsü (vendor shipped → müşteri Teslim Aldım → vendor bildirim) uçtan uca tamamlanmış durumda.
Stripe Connect ve saha behavior testi production-gate'tedir.
