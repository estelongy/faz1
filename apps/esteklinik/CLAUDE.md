# EsteKlinik app — CLAUDE.md

## Persona
Saf kullanıcı — klinik arayan tüketici. Skor umurunda değil ama isterse ekler.

## Çekirdek iş (başrol)
Klinik bul + randevu al. B çoğunluk + biraz A (skor opsiyonel) + çok az C (skor sonucu ürün önerisi).

## Ev
`/esteklinik` — klinik arama (filtre, EGP, harita, yorum), öneri sıralı sonuç. Skor opsiyonel "kişiselleştir" CTA'sı sakin köşede.

## Tab bar
Ana Sayfa(klinik) · Ara · Skorum · Mağaza · Hesap

## Vitrin (başrol)
- `/esteklinik` ev (arama + filtre + öneri)
- `/esteklinik/[slug]` klinik detay
- `/esteklinik/randevu/[slug]` randevu al
- `/panel/randevularim`, `/panel/yorumlarim`, `/panel/degerlendir/[appointmentId]`
- `/rehber/cihaz-tedavileri`, `/rehber/estetik-cerrahi`, `/rehber/estetik-uygulamalar` — klinik açıklayıcılar

## Gövde (paylaşılan)
- `/analiz` + `/skor` + `/paylas/[id]` — skor erişilebilir ama vitrin değil
- `/estestore/[slug]` + `/sepet` + `/odeme` + `/siparis/*` — skor önerisinden gelen ürün alım akışı tam
- `/panel/*` kullanıcı paneli tam
- `/rehber/longevity-nedir`, `/rehber/genclik-skoru-nasil-hesaplanir`

## Yok
- `/estestore` vitrin ev, `/estestore/ara`, `/estestore/kategori/[slug]` — kategori/arama vitrini gösterilmez (alıma niyetlenen StoreApp'i indirir veya WebView ile bitirir)
- `/akademi`, `/panel/kurslarim` → Estelongy Topluluk
- `/klinik/panel/*` → EsteKlinikPRO
- `/satici/panel/*`, `/satici/basvur` → EsteStorePRO
- `/esteklinik/basvur` (klinik başvurusu, hekime ait) → EsteKlinikPRO / web
- `/formlestelongy` (iç doküman)

## Marka rengi & ton
Teal/emerald (mevcut: deep teal #064E3B hero, emerald accents #10876B). Sakin profesyonel ton — "doğru kliniği bul" mesajı.

## Capacitor flavor
- applicationId: `com.estelongy.esteklinik`
- appendUserAgent: `EstelongyApp/esteklinik`
- server.url: vercel deploy URL

## Çalışma kuralı
Bu app'e özgü değişiklikler bu dosyaya işlenir. Genel değişiklik olduysa paylaşılan kuralın bu app'te nasıl renklendiği yazılır.
