# EsteKlinikPRO app — CLAUDE.md

## Persona
Klinik sahibi / yetkili hekim / klinik sekreteri. Klinik yönetimi yapan profesyonel.

## Çekirdek iş (başrol)
Randevu hızlı işle, müsaitlik güncelle, hasta dosyası, mesaj. Klinikten hareketsiz kalan operasyonu cebe taşımak.

## Ev
`/klinik/panel` — bugünün takvimi + bekleyen randevular (hızlı kabul/red), kredi/kazanç özet.

## Tab bar
Panel · Randevu · Hastalar · Mesaj · Menü(drawer)

## Drawer menüsü (ikincil aksiyonlar)
Kredi, Rapor, Takvim, Müsaitlik, Profil, Yorumlar, Topluluk, Akademi, Muhasebe, Destek, Anasayfa, Çıkış

## Vitrin (başrol)
- `/klinik/panel` ana panel
- `/klinik/panel/randevular`
- `/klinik/panel/hastalarim`, `/klinik/panel/hasta/[userId]`
- `/klinik/panel/mesajlar`
- `/klinik/panel/yorumlar` (yoruma yanıt)
- `/klinik/panel/takvim`, `/klinik/panel/musaitlik`
- `/klinik/panel/kredi`, `/klinik/panel/rapor`
- `/klinik/panel/profil`, `/klinik/panel/destek`
- `/klinik/panel/topluluk` — Estelongy Topluluk
- `/klinik/panel/akademi/*` — eğitmen olarak paket sat
- `/klinik/panel/muhasebe/*` — muhasebe yetkilisi (yetkilendirme arkasında)
- `/akademi/*`, `/panel/kurslarim` — eğitim alma (topluluk üyesi olarak)

## Gelecek (kapsama dahil ama henüz yok)
- **Tedarik** — B2B store, klinik fiyatlı vitrin, toplu sepet, fatura. Vendor ürünleri burada satılır (EsteStore consumer'dan ayrı).

## Yok (klinik dışı)
- `/biyoage` consumer ev, `/skor`, `/analiz`, `/paylas/*` — kullanıcı skor deneyimi
- `/esteklinik` consumer arama
- `/estestore` consumer vitrin/sepet
- `/panel/*` (kurslarim hariç) — kullanıcı paneli
- `/satici/*` — vendor dünyası
- `/rehber/*` consumer açıklayıcılar
- `/formlestelongy` (iç doküman)

## Marka rengi & ton
Slate-950 + emerald-500 (mevcut klinik panel teması). Yönetim arayüzü tonu — yoğun, fonksiyonel, gece moduna kapalı.

## Capacitor flavor (planlanan)
- applicationId: `com.estelongy.esteklinikpro`
- appendUserAgent: `EstelongyApp/esteklinikpro`
- server.url: vercel deploy URL

## Çalışma kuralı
Bu app'in çekirdek aksiyonları yönetimsel — consumer akış kodu ile karışmamalı. Genel değişiklik (örn. ortak sign-out, auth) yapıldığında bu app'in PRO bağlamına uygunluğu teyit edilir.
