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

## Mağaza erişimi (klinik için EsteStore)
**Karar:** Ayrı tedarik paneli/sepeti YOK. Klinik kullanıcı `/estestore`'a girdiğinde:
- Sayfa üstünde toggle: `[Klinik Ürünleri ✓] [Hasta Ürünleri]` — default klinik açık (24 kategori)
- Klinik fiyatı + barem (10/50/100 adet kırılımı) ürün kartında görünür
- `klinik_only=true` ürünler de görünür (consumer'a görünmez)
- Sepet, ödeme, sipariş akışı consumer ile aynı route — fiyat hesaplaması role'e göre değişir

Bu mağaza vitrini henüz inşa edilmedi (DB kolonları + UI). EsteKlinikPRO Faz 0 = sadece flavor + panel. Faz 1 = `/estestore` klinik view.

## Yok (klinik dışı)
- `/biyoage` consumer ev, `/skor`, `/analiz`, `/paylas/*` — kullanıcı skor deneyimi
- `/esteklinik` consumer arama
- `/panel/*` (kurslarim hariç) — kullanıcı paneli
- `/satici/*` — vendor dünyası
- `/rehber/*` consumer açıklayıcılar
- `/formlestelongy` (iç doküman)

## Rol koruması (AppFlavorRoleGate)
Klinik OLMAYAN kullanıcı bu app'te giriş yaparsa full-screen kapı çıkar:
- "Bu app klinikler için" mesajı
- BiyoAGE / EsteKlinik app indir Play Store linkleri
- Çıkış butonu

## Marka rengi & ton
Slate-950 + emerald-500 (mevcut klinik panel teması). Yönetim arayüzü tonu — yoğun, fonksiyonel, gece moduna kapalı.

## Capacitor flavor (kuruldu)
- applicationId: `com.estelongy.esteklinikpro`
- appendUserAgent: `EstelongyApp/esteklinikpro`
- server.url: `https://faz-1-git-master-estelongy-3655s-projects.vercel.app/klinik/panel`
- `mobile/android/app/src/esteklinikpro/assets/capacitor.config.json` (**gitignored**)
- `build.gradle` productFlavor: `esteklinikpro` (**gitignored**)
- `FLAVOR_HOME.esteklinikpro` = `/klinik/panel` (tracked)

**Önemli:** `mobile/android/` tamamı `.gitignore`'da. Flavor build dosyaları lokal-only. Yeni makinede build için `mobile/android/app/build.gradle`'a `esteklinikpro` productFlavor ve `mobile/android/app/src/esteklinikpro/assets/capacitor.config.json` elle eklenmeli (template: biyoage/esteklinik/estestore flavor'larından).

## Çalışma kuralı
Bu app'in çekirdek aksiyonları yönetimsel — consumer akış kodu ile karışmamalı. Genel değişiklik (örn. ortak sign-out, auth) yapıldığında bu app'in PRO bağlamına uygunluğu teyit edilir.
