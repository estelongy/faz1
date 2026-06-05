# BiyoAGE app — CLAUDE.md

## Persona
Saf kullanıcı — longevity yolcusu. Skoru ile yolculuğunu takip eder, skor sonucu olarak klinik ve ürün alır.

## Çekirdek iş (başrol)
Skor + analiz + yolculuk. Klinik/ürün **skor sonucu** olarak çıkar; vitrin olarak değil.

## Ev
`/biyoage` — skor, yolculuk adımı, geçmiş trend, paylaş, skoruna göre 1-2 klinik öneri kartı + 1-2 ürün öneri kartı.

## Tab bar
Ana Sayfa(skor) · Analiz · Randevu · Mağaza · Hesap

## Vitrin (başrol — bu app'in öne çıkardığı)
- `/biyoage` ev (skor + yolculuk)
- `/analiz` analiz çek
- `/skor` skor merkezi (bileşen detayı)
- `/paylas/[id]` skor paylaş
- `/panel/*` kullanıcı paneli (hesabım, geçmiş, sipariş, favori, adres, yorum, davet, sıralama, değerlendirme)
- `/rehber/longevity-nedir`, `/rehber/genclik-skoru-nasil-hesaplanir`

## Gövde (paylaşılan — aksiyon tamamlamak için açık)
- `/esteklinik/[slug]` + `/esteklinik/randevu/[slug]` — randevu akışı tam
- `/estestore/[slug]` + `/sepet` + `/odeme` + `/siparis/[orderNumber]` — alım akışı tam
- `/estestore/ara`, `/estestore/kategori/[slug]` — alım için arama erişilebilir (geniş cımbız)

## Yok (bu app'te erişilmez / yumuşak yönlendirme)
- `/akademi`, `/panel/kurslarim` → Estelongy Topluluk
- `/klinik/panel/*` → EsteKlinikPRO
- `/satici/panel/*`, `/satici/basvur` → EsteStorePRO
- `/esteklinik/basvur` (klinik başvuru) → web
- `/rehber/cihaz-tedavileri`, `/rehber/estetik-cerrahi`, `/rehber/estetik-uygulamalar` → EsteKlinik app
- `/formlestelongy` (iç doküman)

## Marka rengi & ton
Violet/purple (mevcut: gradient violet-500 → purple-600). Cinematic dark zemin, skor merkezli sakin ton. Ana mesaj: "senin longevity arkadaşın".

## Capacitor flavor
- applicationId: `com.estelongy.biyoage`
- appendUserAgent: `EstelongyApp/biyoage`
- server.url: vercel deploy URL

## Çalışma kuralı
Bu app'e özgü değişiklikler bu dosyaya işlenir. Genel (gövde) değişiklik olduysa kısa not + paylaşılan kuralın bu app'e nasıl yansıdığı yazılır.
