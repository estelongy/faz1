# EsteStorePRO app — CLAUDE.md

## Persona
Satıcı / vendor. Ürün satan profesyonel (KOBİ, marka, klinik-vendor).

## Çekirdek iş (başrol)
Sipariş işle, kargo bas, iade onayla, ürün düzenle, soruya cevap, kazanç takip. Satış operasyonunu cebe taşımak.

## Ev
`/satici/panel` — bekleyen sipariş + açık iade + bekleyen soru, performans özet.

## Tab bar
Panel · Ürünler · Siparişler · İadeler · Menü(drawer)

## Drawer menüsü (ikincil aksiyonlar)
Kargo, Kazanç, KYC, Mağaza, Ödeme Hesabı, Performans, Sorular, Yorumlar, Hesabım, Çıkış

## Vitrin (başrol)
- `/satici/panel` ana panel
- `/satici/panel/urunler`, `/satici/panel/urunler/[id]/duzenle`, `/satici/panel/urunler/toplu`
- `/satici/panel/siparisler`, `/satici/panel/siparisler/etiket/[orderItemId]`, `/satici/panel/siparisler/etiket/toplu`
- `/satici/panel/iadeler`
- `/satici/panel/kargo`
- `/satici/panel/sorular` (ürün sorularına cevap)
- `/satici/panel/yorumlar` (yoruma yanıt)
- `/satici/panel/kazanc`, `/satici/panel/performans`
- `/satici/panel/magaza` (vitrin ayarları)
- `/satici/panel/kyc`, `/satici/panel/odeme-hesabi`, `/satici/panel/hesabim`

## Yok (vendor dışı)
- `/biyoage` consumer ev, skor, analiz
- `/esteklinik` consumer arama, `/klinik/panel/*` klinik dünyası
- `/estestore` consumer vitrin/sepet — vendor B2C alıcı modu değil
- `/panel/*` kullanıcı paneli
- `/akademi`, `/panel/kurslarim` — Estelongy Topluluk (vendor topluluğu ayrı, henüz yok)
- `/rehber/*` consumer açıklayıcılar
- `/formlestelongy` (iç doküman)

## Marka rengi & ton
Slate gradient (mevcut satıcı panel: from-slate-900 to-slate-800) + ileride vendor-spesifik vurgu rengi (henüz seçilmedi). Yönetim arayüzü tonu — fonksiyonel, sipariş ve performans odaklı.

## Capacitor flavor (planlanan)
- applicationId: `com.estelongy.estestorepro`
- appendUserAgent: `EstelongyApp/estestorepro`
- server.url: vercel deploy URL

## Çalışma kuralı
Bu app'in çekirdek aksiyonları satış operasyonu — consumer alım akışı ile karışmamalı. Genel değişiklik yapıldığında bu app'in vendor bağlamına uygunluğu teyit edilir.
