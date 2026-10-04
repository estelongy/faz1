# Exclusive Member — Üyelik Sistemi

> Dr. İzzet GÖK Medikal Estetik Kliniği · Estelongy — Zamansız Güzellik Mimarlığı
> Karar tarihi: 4 Ekim 2026 · Durum: **motor yazıldı, klinik panelinde görünür**
>
> Kod: `src/lib/uyelik.ts` (saf fonksiyon) · `src/components/klinik-panel/UyelikRozet.tsx` (rozet)
> Bağlandığı yer: `muhasebe/page.tsx` → `PatientRow.uyelik`

---

## 1. Neyi çözüyor

Bugün her hastayla ayrı pazarlık yapılıyor. Botoks listesi ₺8.000, herkese ₺8.000
söyleniyor, zorlanınca ₺6.000'e iniliyor, tanıdığa ₺6.000 deniyor. Yani indirim
zaten veriliyor — ama **karşılığında hiçbir şey alınmıyor**: ne sadakat, ne
öngörülebilirlik, ne bağlılık.

Kart o indirimi sisteme bağlar. Aynı para veriliyor ama artık karşılığı var.

**En çok pazarlık eden en ucuza alıyor** — yani bugün en zor müşteri ödüllendiriliyor.
Kartla **en sadık olan** en ucuza alır. Ödül doğru yere gider.

### Satılan şey indirim değil
Optima'nın verdiği his: *"artık tanıdıksınız."* Hasta yalvarmadan, minnetsiz,
pazarlıksız kendi fiyatını biliyor. Estetikte insanın istediği ucuzluk değil,
**içeriden olmak**.

---

## 2. Felsefe — iyileşme / güzelleşme

| | Kademe | Hal |
|---|---|---|
| **İYİLEŞME** | Primula | Bilinçli, farkında. İlk işlem yapıldı. |
| | Elita | İhtiyacını gördü, yolda. |
| | **Optima** | **Doğal en iyi hal. Eksik kapandı.** |
| **GÜZELLEŞME** | Maxima | İstek sürüyor, koruyor. |
| | Suprema | Zamansız. |

**Optima'nın tanımı (kurucu cümlesi):** kırışıklığı olmayan, tıbbi bir problemi
olmayan, cilt sağlığı yerinde, patoloji/anormal bir sorunu olmayan kişi.

**Kırılma noktası:** Optima'ya kadar ölçü **para** (eksik kapanıyor).
Optima'dan sonra ölçü **zaman** (aynı yerde kalınıyor). Çünkü koruma parayla değil
ritimle ölçülür.

**Kart durduğun yeri değil gittiğin yeri gösterir.** Kimseye "sen Elita'sın"
denmez — herkese *"sen Suprema yolundasın"* denir.

---

## 3. Puan motoru

```
0. DAYANAK: TAHSİLAT (internal_payment.amount) — işlem tutarı değil.
   - İşleme bağlı ödeme  -> o işlemin treatment_date'ine yazılır
   - Serbest ödeme       -> kendi paid_at tarihine yazılır
1. Aynı gün toplanan tüm tahsilat TEK ZİYARET sayılır, tutarlar toplanır.
2. Ziyaretler tutara göre BÜYÜKTEN KÜÇÜĞE sıralanır.
3. Sıra çarpanı uygulanır:  ×1 · ×2 · ×3 · ×4 · ×5 · ×6   (6. ve sonrası sabit ×6)
4. Puan = Σ (ziyaret tutarı × sıra çarpanı)
```

### Neden tahsilat, neden işlem tarihi
Ödüllendirilen şey **eline geçen para**, yazılan borç değil.
Ama ödeme taksitliyse her taksit ayrı ziyaret sayılmamalı — bu yüzden işleme bağlı
ödemeler o işlemin gününe yazılır. 96 ödemenin 75'i bir işleme bağlı, 21'i serbest.

### Neden aynı gün tek ziyaret
Aksi halde bir günde 3 kalem işlem yaptıran, hiç sadakat göstermeden yüksek
çarpana ulaşır. (Gerçek vaka: zuhal cesur 3 Ekim'de tek pakette 3 satır →
yanlış kuralla 228.000 puan/Optima çıkıyordu.)

### Neden büyükten küçüğe
Küçükten büyüğe sıralanırsa **en büyük tutar en yüksek çarpanı** alır ve puan
gerçek paranın 7 katına fırlar (Gülçin: ₺55.500 → 401.500 puan).
Büyükten küçüğe sıralandığında çarpan sadece **tekrar gelmeyi** ödüllendirir.

### Neden ×6'da sabit
Çarpan ×12'ye kadar çıkarsa 5. ziyarette tutarın anlamı kalmaz — ₺1.600'lük bir
işlemle Optima olunur. Sistem gülünç olur.

---

## 4. Eşikler

| Kademe | 1 ziyaret | 2+ ziyaret | İndirim |
|---|---|---|---|
| **Primula** | kayıt | — | %5 |
| **Elita** | 50.000 | **35.000** | %10 |
| **Optima** | 150.000 | **100.000** | **%20 — TAVAN** |
| **Maxima** | Optima + 1 yıl düzenli takip | | %20 + hediye |
| **Suprema** | Optima + 3 yıl düzenli takip | | %20 + hediye + bakım |

**Çift eşik mantığı:** tek seferde gelen daha yüksek eşik öder, düzenli gelen daha
düşük. Sadakat indirimi eşiğin kendisinde.

**Düzenli takip:** 3 ayda bir bakım ve kontrol, aralarında 4 aydan uzun boşluk yok.
Kontrol de temas sayılır — işlem yapılması şart değil. (Optima'ya kadar sadece
**paralı** ziyaret sayılır; kontrol Optima'dan sonra devreye girer.)

---

## 5. Fiyatlandırma

İndirim **liste fiyatından** hesaplanır ve **başka hiçbir indirimle birleşmez**.

| Kademe | Botoks (liste ₺8.000) | Dudak dolgu (liste ₺10.000) |
|---|---|---|
| Kartsız | ₺8.000 | ₺10.000 |
| Primula %5 | ₺7.600 | ₺9.500 |
| Elita %10 | ₺7.200 | ₺9.000 |
| **Optima %20** | **₺6.400** | **₺8.000** |

Katalogdaki `internal_treatment_catalog.default_price` **gerçek liste fiyatı**
olarak tutulur; kademe fiyatları ondan hesaplanır. Ayrı fiyat alanı gerekmez.

### Kırmızı çizgi
**Optima fiyatı tabandır, pazarlığa kapalıdır.** Bir kez kırılırsa taban düşer ve
kart çöker. Söylenecek cümle:

> *"Optima fiyatı zaten tanıdık fiyatımız. Daha aşağısı yok."*

Bu cümleyi **sistem söyler, hekim söylemez.** Asıl kazanç: hekim artık fiyat
konuşmuyor. Hasta "hocam bana kaça" diye sorduğunda cevap:
*"Uygulamada sizin fiyatınız yazıyor."*

### Kârlılık
Botoks maliyeti ~₺2.500. Optima fiyatı ₺6.400 → kâr ₺3.900.
Bugün zorlanınca verilen ₺6.000'in **₺400 üstünde** — yani kayıp değil kazanç,
üstelik hasta yalvarmadan alıyor.

---

## 5b. Hastaya gösterim — anlatım dili

Hastaya **puan gösterilmez.** Ham puan (122.400 gibi) kimseye bir şey ifade etmez.
Basamak numarası da gösterilmez — ayrı bir sayı sistemi öğretmek anlatımı zorlaştırır.

Ekranda sadece iki satır:

```
ELİTA
Optima'ya ₺12.000
```

- **Birinci satır:** bulunduğu kademe adı
- **İkinci satır:** bir üst kademeye kalan, **TL cinsinden**

Kalan mesafe puan değil **gerçek para** olarak gösterilir. Hasta ₺12.000'i anlar,
22.000 puanı anlamaz. Çarpan hesabı arkada kalır.

**Elenen alternatifler:**
- 0-100 arası "Estelongy Puanı" — ara katman, yeni bilgi vermiyordu
- 1-10 basamak sistemi (5=Optima, 10=Suprema) — beş isim + on basamak + puan,
  hastaya öğretilecek üç şey oluyordu
- "Güzelleşme yolculuğu" ifadesi — dışa dönük dilde fazla iddialı.
  İyileşme/güzelleşme ayrımı **iç mantıkta kalır**, hastaya söylenmez.

---

## 6. Doğrulanmış test vakaları

| Senaryo | Gerçek para | Puan | Kademe |
|---|---|---|---|
| 3 × ₺6.000 | ₺18.000 | 36.000 | Elita ✓ |
| ₺5.000 + ₺25.000 | ₺30.000 | 35.000 | Elita ✓ |
| ₺5.000 + ₺10.000 | ₺15.000 | 20.000 | Primula |
| ₺8.000 + ₺10.000 | ₺18.000 | 34.000 | Primula |
| ₺5+6+10+20 bin | ₺41.000 | 78.000 | Elita |
| 6 × ₺10.000 | ₺60.000 | 210.000 | Optima |
| Tek ₺66.000 | ₺66.000 | 66.000 | Elita |
| Tek ₺38.000 | ₺38.000 | 38.000 | Primula |

**Gerçek hastalar (4 Ekim 2026, tahsilat bazlı):**

| Hasta | Ziyaret | Tahsilat | Puan | Kademe |
|---|---|---|---|---|
| GÜLÇİN ALTIN | 5 | ₺70.500 | 121.500 | **OPTİMA** |
| özlem saçar | 1 | ₺66.000 | 66.000 | Elita |
| safiye can | 2 | ₺40.000 | 60.000 | Elita |
| zuhal cesur | 1 | ₺38.000 | 38.000 | Primula |
| gülsüm kula | 1 | ₺34.000 | 34.000 | Primula |

89 hastanın 86'sı Primula. Optima'da tek kişi var — Gülçin, 5 ziyaretle.

Not: safiye can işlem bazlı hesapta ₺20.000 (Primula) görünüyordu; tahsilatı
₺40.000 olduğu için Elita'ya çıktı. Fazla ödemesi artık sayaca yansıyor.

---

## 7. Bilinen açıklar (kabul edildi)

Kurucu kararı: *"sorun değil bunlar, kimse bunları detaylı bilmeyecek."*

1. **₺500 hilesi** — ₺34.000 tek ziyaret Primula; üstüne ₺500'lük ikinci ziyaret
   eklenince eşik 50.000'den 35.000'e düştüğü için Elita olunuyor.
2. **Bölme avantajı** — ₺30.000 tek seferde 30.000 puan, 5 güne bölününce 90.000
   puan. Seans bölmeyi teşvik ediyor (ama hasta sık geliyor, kasıtlı kabul edildi).
3. **Çoklu ziyaret avantajı 2.5 kat** — ₺60.000'i 6 ziyarete yayan, tek seferde
   ₺150.000 ödeyenle aynı yere geliyor. Tasarımın amacı bu.

---

## 8. Açık kalanlar

- [ ] **Hediye botoks kimde?** Optima mı Maxima mı. Öneri: Optima tanıdık fiyatı
      yeterli ödül, hediye Maxima'ya saklansın.
- [ ] **Kontrol ziyareti kaydı yok** — Maxima/Suprema ölçülemiyor. Ücretsiz
      "kontrol" tipi ziyaret kaydı gerekiyor.
- [ ] **Mükerrer kayıtlar** — Serap Birdal 5 ayrı kayıtta duruyor (dokunulmadı).
      Sistem canlıya geçmeden temizlenmeli, yoksa aynı kişi 5 ayrı sayaçta kalır.
- [ ] **Liste fiyatları** katalogda güncel değil; kademe fiyatları ondan hesaplanacak.

## 9. Faz 2'ye ertelendi

- **Referans sistemi** — getirdiği hastanın ilk işleminin bir kısmı kendi sayacına
  yazılsın. (Kurucu: *"bu kısım faz iki olsun bu işin"*)
- **Doğal güzellik skoru** — kırışıklık / hacim / cilt sağlığı / patoloji
  4×25=100 puanlık klinik skor. Kademeyi paradan değil muayeneden okuma fikri.
  BiyoAGE analiz motoruna bağlanabilir.
