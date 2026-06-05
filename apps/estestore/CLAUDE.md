# EsteStore app — CLAUDE.md

## Persona
Saf kullanıcı — longevity/biyohacking/cilt ürünü arayan tüketici. Skor umurunda değil ama isterse ekler.

## Çekirdek iş (başrol)
Ürün ara + satın al. C çoğunluk + biraz A (skor opsiyonel) + çok az B (skor sonucu klinik önerisi).

## Ev
`/estestore` — vitrin (kategori, küratörlü raflar, "senin için", "tekrar sipariş"). Skor opsiyonel "kişiselleştir" CTA'sı sakin köşede.

## Tab bar
Ana Sayfa(mağaza) · Ara · Skorum · Randevu · Hesap

## Vitrin (başrol)
- `/estestore` ev (vitrin + raflar)
- `/estestore/ara` arama
- `/estestore/kategori/[slug]` kategori
- `/estestore/[slug]` ürün detay
- `/estestore/satici/[vendorId]` satıcı sayfası
- `/sepet`, `/odeme`, `/siparis/[orderNumber]` — alım akışı
- `/panel/siparislerim`, `/panel/iadelerim`, `/panel/favorilerim`, `/panel/adreslerim`, `/panel/urun-degerlendir/[orderId]`

## Gövde (paylaşılan)
- `/analiz` + `/skor` + `/paylas/[id]` — skor erişilebilir ama vitrin değil
- `/esteklinik/[slug]` + `/esteklinik/randevu/[slug]` — skor önerisinden gelen klinik + randevu akışı tam
- `/panel/*` kullanıcı paneli tam
- `/rehber/longevity-nedir`, `/rehber/genclik-skoru-nasil-hesaplanir`

## Yok
- `/esteklinik` vitrin ev (klinik arama vitrini) — gösterilmez (randevu için EsteKlinik app'i indir veya WebView)
- `/rehber/cihaz-tedavileri`, `/rehber/estetik-cerrahi`, `/rehber/estetik-uygulamalar`
- `/akademi`, `/panel/kurslarim` → Estelongy Topluluk
- `/klinik/panel/*` → EsteKlinikPRO
- `/satici/panel/*`, `/satici/basvur` → EsteStorePRO
- `/esteklinik/basvur` → web
- `/formlestelongy` (iç doküman)

## Marka rengi & ton
Amber/altın (mevcut: #8B7339, #C9A961) + cinematic dark zemin (#160F28). Premium curated vitrin tonu — "skoruna göre kürate edilmiş raf" mesajı.

## Capacitor flavor
- applicationId: `com.estelongy.estestore`
- appendUserAgent: `EstelongyApp/estestore`
- server.url: vercel deploy URL

## Çalışma kuralı
Bu app'e özgü değişiklikler bu dosyaya işlenir. Genel değişiklik olduysa paylaşılan kuralın bu app'te nasıl renklendiği yazılır.
