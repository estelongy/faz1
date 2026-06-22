# KVKK / GDPR Veri İhlali Müdahale Runbook'u

**Versiyon:** 1.0
**Yürürlük:** 22 Haziran 2026
**Sahip:** Dr. İzzet Gök (Kurucu/CTO)
**KVKK iletişim:** kvkk@estelongy.com

---

## Yasal süre — 72 saat

KVKK m.12/5 ve GDPR Art.33 gereği, **kişisel veri ihlali tespitinden itibaren 72 saat içinde** Kurum'a bildirim yapılmalıdır.
Yüksek riskli durumlarda etkilenen veri sahiplerine de bildirim zorunludur (Art.34).

İhlali fark eden saatte zaman sayacı başlar.

---

## 1. Tespit — kim, nasıl

İhlal sinyalleri:

- **Sentry** alert → kritik hata seviyesi (PII'ye dokunan exception, RLS bypass, 500'lerin patlaması)
- **Supabase** dashboard → anormal SQL aktivitesi, kütle silme, beklenmedik service_role kullanımı
- **Stripe** → şüpheli işlem patterni, kart fraud raporu
- **Vercel** → DDoS/abnormal traffic patterni
- **Kullanıcı bildirimi** → "verilerim ifşa oldu" e-postası, sosyal medya
- **Üçüncü taraf bildirimi** → güvenlik araştırmacısı, basın

Her sinyal: önce 5 dk içinde **gerçek mi, false positive mi** ayrıştırılır.

## 2. Triage — 1. saat içinde

İhlal doğrulandıysa:

1. **Sistemi durdurma kararı.** Aktif sızıntı varsa endpoint kapatılır (Vercel deployment rollback veya feature flag kapatma). Veri akışını dondurmak ilk önceliktir.
2. **Kapsam belirleme.** Hangi tablolar/dosyalar etkilendi? Kaç kullanıcı? Hangi alanlar (e-posta? selfie? sağlık verisi? ödeme bilgisi?)?
3. **Audit log dump.** `audit_logs`, `consent_logs`, Supabase logs, Sentry — incident dosyasına kopyala. **Silme — bu kayıt zinciri delil.**
4. **Stripe etkilendiyse:** Stripe support'a "data incident" bildirimi (ayrıca Stripe'ın kendi süreci işler).

## 3. Bilgilendirme — saat 24-48 arası

Tespit sonrası saat 24-48 aralığında karara bağla:

### KVKK Kurumu'na bildirim (zorunlu — 72 saat)
- **Form:** [www.kvkk.gov.tr](https://www.kvkk.gov.tr) → "Veri İhlali Bildirimi"
- **İçerik:** İhlal tarihi, kapsamı, etkilenen veri kategorisi, sonuçları, alınan tedbirler, ilgili kişilerin sayısı, iletişim bilgisi.
- **Sorumlu:** Dr. İzzet Gök (veri sorumlusu — Vestoriq OÜ adına TR temsilcisi).
- **Dil:** Türkçe.

### GDPR — AB Veri Koruma Otoritesi'ne bildirim (gerekirse)
- AB'deki ana kuruluş yeri (Estonya — Andmekaitse Inspektsioon) ana muhatap.
- Tetik: AB'de yerleşik kullanıcı verisi etkilendiyse.

### Etkilenen kullanıcılara bildirim
- **Tetik:** Yüksek risk (parola, finansal veri, biyometrik, sağlık verisi)
- **Kanal:** E-posta (Postmark) + hesap girişinde banner
- **İçerik:** Neyin sızdığı, ne zaman, riskler, yapmaları gerekenler (parola değişimi vb.), kvkk@estelongy.com iletişim

## 4. Kapatma + iyileştirme — saat 48 sonrası

- **Root cause analysis** — neyden kaynaklandı (kod açığı, config hatası, fishing, içeriden, üçüncü taraf)?
- **Düzeltme PR'ı** — yamalandığını commit logu ile belgele.
- **Post-mortem** — `docs/incidents/INC-<tarih>.md` dosyası: timeline, etkilenenler, sebep, fix, gelecek önlemler.
- **Aydınlatma metni güncellenebilir** (yeni alt-işleyen, yeni süreç eklendiyse).

## 5. Karar verici kim?

- **Tek karar verici şu an:** Dr. İzzet Gök
- 10K+ kullanıcı eşiğinden sonra: DPO (Veri Koruma Görevlisi) atanması düşünülmeli.
- KVKK Kurumu'nun sorabileceği bilgilere hazırlık: Vestoriq OÜ'nün TR temsilcisi netliği (gerekirse hukuki temsilci atama).

## 6. Düzenli kontroller (proaktif)

- **Aylık:** Sentry error rate gözden geçirme, RLS test taraması, service_role kullanım denetimi.
- **3 aylık:** Bağımlılık güvenlik taraması (`npm audit`, Dependabot), Supabase database advisors.
- **Yıllık:** Penetrasyon testi (eşik aşıldığında — yıllık ciro 5M TL veya kullanıcı 100K+).
- **Yıllık:** Aydınlatma metni v-bump kontrolü; yeni alt-işleyen/yeni veri kategorisi eklendiyse zorunlu.

## 7. İletişim ağacı (kim kimi arar?)

```
İhlal tespit → İzzet (CTO)
                ├── Stripe support (ödeme etkilendiyse)
                ├── Supabase support (DB etkilendiyse)
                ├── Vercel support (altyapı etkilendiyse)
                ├── OpenAI support (selfie/biyometrik etkilendiyse)
                ├── KVKK Kurumu (72 saat)
                ├── Andmekaitse Inspektsioon — Estonya (gerekirse, 72 saat)
                └── Etkilenen kullanıcılar (yüksek risk)
```

## 8. Şablon — Kurum bildirim metni

```
Sayın Kişisel Verileri Koruma Kurumu,

Veri sorumlusu sıfatıyla aşağıdaki veri ihlalini bildirmekteyiz:

Veri sorumlusu:    Vestoriq OÜ (Estonya) — Estelongy platformu
Tespit tarihi:     [YYYY-AA-GG SS:DD UTC]
İhlal tarihi:      [YYYY-AA-GG] (tahmin/kesin)
Etkilenen veri:    [örn. e-posta, ad, telefon]
Etkilenen sayı:    [yaklaşık X kişi]
İhlal türü:        [yetkisiz erişim / ifşa / kayıp / değişiklik]
Sebep:             [kısa açıklama]
Alınan tedbirler:  [endpoint kapatıldı, parolalar reset edildi vb.]
Kullanıcılara bildirim: [yapıldı/yapılacak/yapılmayacak — gerekçe]
İletişim:          kvkk@estelongy.com — Dr. İzzet Gök

Saygılarımızla,
Dr. İzzet Gök
Kurucu / CTO
```

---

## Versiyon notları

- **v1.0 — 22 Haziran 2026** — İlk yayım. Kullanıcı sayısı 1000 altıyken DPO atanmadan İzzet tek karar verici.
