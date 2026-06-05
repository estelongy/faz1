# apps/ — App-özel çalışma rehberi

Estelongy kitabı tek; 5 app onun farklı kapakları + farklı kürasyonları.

## Apps
- **[biyoage/](./biyoage/CLAUDE.md)** — saf kullanıcı, longevity yolcusu
- **[esteklinik/](./esteklinik/CLAUDE.md)** — saf kullanıcı, klinik arayan
- **[estestore/](./estestore/CLAUDE.md)** — saf kullanıcı, alıcı
- **[esteklinikpro/](./esteklinikpro/CLAUDE.md)** — hekim/klinik sahibi
- **[estestorepro/](./estestorepro/CLAUDE.md)** — satıcı (vendor)

## Mimari prensipler (5'i de bağlar)
1. **Vitrin başrol, gövde paylaşılır, aksiyon kapı.** Vitrin sadece çekirdek galaksinin; gövde (klinik detay, ürün detay, sepet, randevu) paylaşılır; aksiyon her zaman app içinde tamamlanır (kullanıcı diğer app'e itilmez, satış/randevu kaçmaz).
2. **Rus arkadaş kuralı.** Her app aldığı sayfaları kendi mizanpajına çevirir. Web sayfası WebView'a koyup üstüne chrome yapıştırmak DEĞİL — sayfa app diliyle yazılmış olmalı.
3. **Her seviye app-native.** A, A.1, A.1.1, A.1.1.1 — tüm derinlikler app diliyle. Sadece kapak değil.
4. **Tek persona.** Her app tek kullanıcı tipi için — rol karışımı yok. PRO app'ler ayrı persona.
5. **Skor = tek çapraz köprü.** B ve C birbiriyle doğrudan konuşmaz; çapraz öneri sadece skor üzerinden meşru.

## Çalışma kuralı (özel ↔ genel)
- **Özelde çalışma** (örn. "EsteKlinik ev ekranı") → ilgili app'in CLAUDE.md'sine işlenir, diğer app'lerle ilgisi varsa kısa not + uyarlama yazılır.
- **Genelde çalışma** (örn. "ortak sepet/ödeme refactor") → kök CLAUDE.md veya ilgili gövde dosyasına işlenir, sonra 5 app'in CLAUDE.md'sine "bu app'e nasıl yansıdı" satırı eklenir.
- **Renk farkı:** Aynı aksiyon her app'te farklı tonda görünür — başrol farkı. Genel değişikliğin "özel rengi" o app'in CLAUDE.md'sinde tarif edilir.

## Dosya yapısı şu an
- `apps/{name}/CLAUDE.md` — app spec (bu klasörler altında ileride app-spesifik kod/asset olabilir; şu an sadece spec)
- Capacitor flavor configleri: `mobile/android/app/src/{biyoage,esteklinik,estestore}/assets/capacitor.config.json`
- PRO app flavor'ları henüz yok — planlandı, build edilmedi
