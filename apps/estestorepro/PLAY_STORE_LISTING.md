# EsteStorePRO — Play Store Listing

**App ID:** com.estelongy.estestorepro
**Hedef kategori:** İş (Business)
**İçerik derecelendirmesi:** Tüm yaşlar (B2B aracı)

---

## Başlık (max 30 kar)
`EsteStorePRO — İş Ortağı`

## Kısa açıklama (max 80 kar)
`Estelongy marketplace için ürün, sipariş, iade ve kargo yönetim paneli.`

## Tam açıklama (max 4000 kar)

```
EsteStorePRO — Estelongy marketplace'ın iş ortağı (satıcı/vendor) yönetim app'i.

Estelongy küratörlü longevity & estetik marketplace'idir. "Genç görünmek değil sağlıklı görünmek" felsefesiyle her ürün EP (Estelongy Güzellik Puanı) eşiğinden geçer — bilim, üretici, hekim ve longevity katkısı 4 ekseninde skorlu.

EsteStorePRO ile mağazanı parmağının ucuyla yönet:

✓ ÜRÜN YÖNETİMİ
• Tek tıkla yeni ürün ekle (ÜTS kayıt no kontrolü)
• 18 hasta + 24 klinik kategorisinde listeleme
• Toplu CSV ile 500 ürüne kadar yükleme
• Görsel, fiyat, içerik, toplu alım barem fiyatları

✓ SİPARİŞ AKIŞI
• Yeni sipariş anında bildirim (mail + SMS + push)
• Tek tık kargo etiketi (Estelongy kodu otomatik)
• Toplu etiket — 50 siparişe kadar yazdır
• Yurtiçi, Aras, MNG, PTT, Sürat, HepsiJet, Trendyol Express

✓ İADE YÖNETİMİ
• 14 gün iade penceresi otomatik takip
• Tek ekrandan onayla/reddet (Stripe refund + komisyon iadesi tek tıkla)
• Müşteriye otomatik karar bildirimi

✓ MÜŞTERİ İLETİŞİMİ
• Ürün soruları — vendor performans skoruna yansır
• Yorum yanıtlama
• Mesajlaşma

✓ PERFORMANS SKORU
• 5 metrik üzerinden A-F karne: kargolama hızı, iade oranı, müşteri puanı, soru ve yorum yanıt oranı
• Trendyol/Hepsiburada satıcı paneli muadili

✓ KAZANÇ TAKİBİ
• Aylık ciro + net kazanç (komisyon sonrası)
• En çok satan ürün analizi
• Stripe Connect entegrasyonu (KYC sonrası)

✓ ESTESTORE MAĞAZA VİTRİNİ
• Marka kimliği — logo, banner, hikaye
• Sosyal medya linkleri

Estelongy'nin ahlakı: skor değil, gerekçeli yönlendirme. Ürünün küratörlü vitrinde yer alabilmesi için ÜTS kayıtlı olmalı + admin onayından geçmeli.

İş ortağı başvurusu: estelongy.com/satici/basvur
Destek: destek@estelongy.com
```

---

## Ekran görüntüleri (telefon — min 320px, max 3840px, 16:9 veya 9:16)

Yakalanacak 5 ekran:
1. **AppHome** — "Yeni Ürün ekle" çekirdek aksiyon + Kazanç 30g + Şimdi (bugün/bekleyen/akışta)
2. **Ürünler** — UrunlerAppView (onaylı/incelemede badge'leri görünür)
3. **Siparişler** — SiparislerAppView etiket-üretim akışıyla
4. **Performans** — PerformansAppView 5 metrik karne (A-F)
5. **Menü** — Menü sayfası (operasyon/iş hesabı/yardım grupları)

Yakalama yöntemi:
```bash
cd mobile/android
./gradlew installEstestoreproDebug
# Emülatörde aç → Settings → Developer → Take bug report
# veya: adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png
```

## Feature graphic (1024x500)

Slate-950 zemin, amber "ES Pro" + slogan: "Marketplace'ını parmağınla yönet."
Kaynak: `mobile/assets/estestorepro-feature.svg` (hazırlanacak)

## App ikon (512x512 hi-res)

Kaynak: `mobile/assets/estestorepro-icon.svg`
Convert: `inkscape estestorepro-icon.svg --export-type=png --export-filename=icon-512.png -w 512 -h 512`

## Gizlilik politikası URL

`https://estelongy.com/gizlilik` (var olan KVKK + GDPR sayfası)

## İçerik derecesi anketi

- Şiddet: yok
- Cinsellik: yok
- Argo: yok
- Kontrollü madde: yok
- Veri toplama: e-posta, ad-soyad, telefon, IBAN, vergi no (KYC için zorunlu)
- Veri paylaşımı: ödeme için Stripe; SMS için Netgsm
- Bağımsız hesap silme: ✓ (Hesabım → Hesabı Kapat)

## Yayın kanalı

İlk: **iç-test grubu** (5-10 vendor) — 1 hafta
Sonra: **kapalı beta** (50 vendor)
Sonra: **production**

## Versiyonlama

İlk yayın: 0.1.0 (versionCode 1)
mobile/android/app/build.gradle içinde estestorepro flavor için ayrıca versionNameSuffix tanımlanabilir.
