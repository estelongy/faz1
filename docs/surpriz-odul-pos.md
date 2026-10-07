# Sürpriz Ödül Sistemi — POS'a gömülü dağıtım

> 7 Ekim 2026 · Durum: **fikir aşaması, kod yok, karar verilmedi**
> Bu dosya Estelongy'nin değil, **ayrı bir ürünün** notudur. Klinik yazılımına
> gömülmez; buraya yazılma sebebi fikrin kaybolmaması.

---

## 1. Fikir

İşletme bir dönemde n ödül dağıtacak (örn. 2 telefon). Hangi işlemlerin
kazanacağını bir algoritma belirler. **Kimse bilmez** — ne işletme, ne personel,
ne müşteri. Yalnızca o işlem gerçekleştiğinde ortaya çıkar.

POS'a gömülü halinde: müşteri kartı okutur, fiş çıkar, altında yazar —
*"Tebrikler, telefon kazandınız."*

### Neden POS

| | Kod/uygulama tabanlı | POS'a gömülü |
|---|---|---|
| Dağıtım | Her işletme sisteme kaydolmalı | POS zaten her yerde |
| Müşteri sürtünmesi | Kod söyle, numara gir, link aç | **Sıfır** — zaten ödeme yapıyor |
| Sayaç | Ayrıca kurulmalı | POS'ta hazır ("kaçıncı işlem") |
| Ölçek | Bir klinik | Binlerce işletme |

---

## 2. Mekanizma (kurucunun tarifi)

Gün/dönem başında sistem, beklenen işlem sayısı penceresi içinden n pozisyon
seçer. Örnek: günlük ~50 işlem, 2 ödül → 1-50 arasından 2 pozisyon (örn. 12 ve 37).

O gün 30 işlem olduysa:
- 12. pozisyon **tuttu** → kazanan çıktı
- 37. pozisyon **tutmadı** → **ertesi güne devreder**

### Devir — iki seçenek, karar verilmedi

**A) Ödül birikir.** Yarın 2 + devreden 1 = 3 ödül, yine 1-50 arasından 3 pozisyon.
→ Bazı günler yoğunlaşır, bütçe öngörülemez olur.

**B) Sayaç devam eder.** Bugün 30'da kesildi, yarın 31'den devam. 37. pozisyon
yarının 7. işleminde tutar.
→ Ödüller zamana yayılır, bütçe öngörülebilir. **Tercih edilen.**

### Pencere — işletme mi girer, sistem mi öğrenir?

İşletme "günde 50 müşterim var" der ama 80 gelirse son 30 kişinin şansı sıfır
olur; 20 gelirse ödül sürekli devreder.

Çözüm: **tahmin değil, gerçekleşen veriden öğrenmek.** Sistem son 30 günün
ortalamasını hesaplar, pencereyi otomatik ayarlar. İşletme hiçbir şey girmez.

---

## 3. Çözülmesi gereken teknik problemler

| Problem | Neden zor |
|---|---|
| **Sızdırmazlık** | Pozisyon veritabanında dururSA yönetici görebilir. Kalıcı bellekte tutulmamalı. |
| **Yarış durumu** | İki işlem aynı anda "ben 12'yim" diyebilir. Sayaç atomik artmalı. |
| **Değişken hacim** | Piyangoda bilet sayısı sabit; burada kaç işlem olacağı belirsiz. |
| **Çevrimdışı çalışma** | POS bağlantı kopunca pozisyon nasıl belirlenir? |
| **Cihazda güvenli saklama** | Tohum POS'un güvenli elemanında mı durur? |
| **Çoklu POS senkronu** | Aynı işletmede birkaç terminal — sayaç nasıl paylaşılır? |
| **Fiş doğrulaması** | Kazanç fişe nasıl basılır ki sahtelenemesin? |

**Son dördü POS'a özgü** ve piyango patentlerinde karşılığı yok (orada merkezi
kontrolör var, biletler önceden basılıyor). Dağıtık/çevrimdışı ödül seçimi
gerçekten çözülmemiş bir problem.

---

## 4. Prior art — ne zaten var

### Piyango / kazıma kart patentleri

- **US11049367B2** — Instant win scratch off ticket, sales maximization
- **US9443397B1** — Computer activated instant winner lottery ticket system
- **US20180012453A1** — Instant lottery scratch ticket on-demand printing
- **US11694505 / US11804099 / US12283154** — Secure predetermined game generation

| Mevcut teknik | Açıklama |
|---|---|
| Önceden belirlenmiş sonuç | Kazananlar üretimde belirlenir, kazıma tabakasıyla gizlenir |
| **Havuz bölme** | 24M bilet → 100 havuz × 240K. Her havuzda en az 1 büyük ödül; eksik havuzlar alt ödüllerle dengelenir, ödeme oranı tam %55 çıkar |
| Merkezi kontrolör | Güvenli sunucu havuzları yönetir, kiosklar bağlanır |
| Token tablosu | Her ödül seviyesine token numarası, bellekte tablo |

→ **"n kod içinde 2 ödül, dengeli dağıtım" fikrinin karşılığı var.**

### Provably fair (commit-reveal)

Kripto kumarda 2013'ten beri standart, yaygın kullanımda:

| Bileşen | Ne yapar |
|---|---|
| Server seed | Operatör gizli tohum üretir, **hash'ini önceden yayımlar** |
| Client seed | Oyuncu girer — operatör tohumu üretirken bilmiyor |
| Nonce | Tur sayacı |
| Sonuç | `hash(server_seed + client_seed + nonce)` |
| Doğrulama | Tur bitince tohum açıklanır, hash kontrol edilir |

→ **Hash ile doğrulanabilirlik de dolu.**

### Sonuç: hangi bileşen boşta

| Bileşen | Durum |
|---|---|
| Ödülün gizli tutulması | ❌ Bilinen (kazıma kartı) |
| Dengeli dağıtım | ❌ Bilinen (havuz bölme) |
| Hash ile doğrulanabilirlik | ❌ Bilinen (provably fair) |
| Atomik sayaç | ❌ Standart DB tekniği |
| Pozisyonun günlük pencereye bağlanması | ⚠️ Belki |
| **Gerçekleşen talebe göre pencerenin kendini ayarlaması** | ⚠️ Belki |
| **Devir mekanizması** | ⚠️ Belki |
| **Çevrimdışı + doğrulanabilir POS seçimi** | ⚠️ **En güçlü aday** |

---

## 5. Patent değerlendirmesi

### Patentlenemeyen
Saf matematik — iki çarkın hizalanma formülü, modüler aritmetik, hash seçimi.
SMK m.82/2-a matematiksel yöntemleri açıkça dışlıyor. Ne kadar zarif olursa olsun.

### Patentlenebilir hale gelmesi için
Aynı matematiğin **somut teknik problem çözen uygulaması.** İstem şöyle yazılırsa
reddedilir:

> "n ödülü m pozisyona eşleştiren yöntem, şu formülle..."

Şöyle yazılırsa değerlendirilir:

> "Bir ödeme terminali sisteminde, ödül pozisyonlarının kalıcı bellekte
> tutulmaksızın, gizli tohum ve işlem sayacından türetilerek belirlendiği;
> eşzamanlı işlemlerde sayacın atomik artırıldığı; bağlantı kesildiğinde
> terminalin güvenli elemanındaki tohumla çevrimdışı karar verebildiği; ve
> tohumun sonradan açıklanmasıyla geçmiş seçimlerin doğrulanabildiği sistem..."

### Dürüst sonuç
İlk dört bileşen üzerinden patent **alınamaz** — hepsi dolu. İstemler
**adaptif pencere + devir + çevrimdışı POS kararı** üzerine daraltılmalı.
Dar bir patentin ticari değeri sınırlıdır (rakip pencereyi farklı tanımlar).

**Tarama yapılmadan kimse "olur" diyemez.** Vekil ön araştırması: birkaç bin TL,
1-2 hafta. Bu sefer tarama **POS/ödeme terminali + ödül** ekseninde yapılmalı,
piyango ekseninde değil.

⚠️ **Zamanlama:** Patent başvurusu sistem açıklanmadan önce yapılmalı. Canlıya
alıp müşterilere anlatmak "açıklama" sayılır, yenilik kaybolur. TR'de 12 aylık
hoşgörü süresi var ama riskli.

---

## 6. Gerçek engeller

**1. POS yazılımına girmek zor.** Cihazlar sertifikalı (EMV, PCI-DSS). Uygulama
yüklemek için POS üreticisiyle (Ingenico, Verifone, PAX) ya da ödeme kuruluşuyla
anlaşma gerekir. TR-POS ekosistemi bankalara bağlı.

**2. Milli Piyango tekeli.** Türkiye'de şans oyunu düzenlemek tekelde. POS'ta
çekiliş doğrudan şans oyunu sayılabilir — ölçek büyük, görünürlük yüksek.
Kurgunun "çekiliş" değil "sürpriz ödül" olarak yapılması gerekir: kod satın
alınmıyor, bedava veriliyor. **Avukat sorusu.**

**3. Kim ödüyor?** Binlerce işletmede ödül havuzunu kim finanse edecek —
işletme mi, platform mu, sponsor marka mı? İş modeli burada kurulur.

**4. Ödeme hukuku.** Başkası adına para toplayıp dağıtmak 6493 sayılı Kanun
kapsamında; **ödeme kuruluşu** sayılma riski (BDDK lisansı, sermaye şartı).
Kaçınma: işletme doğrudan ödesin, ya da lisanslı altyapı (iyzico/PayTR) altında
çalışılsın, ya da para yerine kredi verilsin.

---

## 7. Koruma — patent yerine ne

| Koruma | Gücü |
|---|---|
| **Marka** | Ucuz, hızlı, 10 yıl. "Altın Kod" tek başına tanımlayıcı sayılıp reddedilebilir → birleşik/stilize marka ("Estelongy Altın Kod") daha güçlü |
| **Ağ etkisi** | Çok işletme + çok referansör = kopyalanamaz |
| **Veri** | Kim kimi getiriyor, hangi kampanya tutuyor |
| **Entegrasyon** | POS/ödeme/fatura bağlantıları geçiş maliyeti yaratır |
| Patent | Pahalı, yavaş, dar, dava gerektirir |

Dropbox'ın referans programı patentli değildi; kopyalandı ama kimse öne geçemedi
— asıl değer ağdaydı.

---

## 8. Açık kararlar

- [ ] Devir: (A) ödül birikir / **(B) sayaç devam eder** ← tercih
- [ ] Pencere: işletme girer / **sistem öğrenir** ← tercih
- [ ] Ödül havuzu: gün bazında mı, kampanya/dönem bazında mı
- [ ] Commit-reveal katmanı eklenecek mi (ispatlanabilirlik ↔ karmaşıklık)
- [ ] Patent: vekil ön araştırması yapılsın mı, ne zaman
- [ ] Marka: hangi isim tescil edilecek
- [ ] Hukuk: Milli Piyango + 6493 için avukat görüşü

---

## 9. Sıralama önerisi

1. Klinikte referans sistemini çalıştır, veri topla *(şu anki aşama)*
2. Marka tescili — ucuz, şimdi yapılabilir
3. İkinci işletme ekle — çok işletmeli yapı test edilsin
4. Para katmanı — hukuk görüşü sonrası
5. POS fikri: ancak 1-4 tuttuktan sonra, ve ayrı ürün olarak
6. Patent: ürün tutar ve ortada gerçekten çözülmüş yeni bir teknik problem varsa

---

## 10. Kaynaklar

- US11049367B2 · https://patents.google.com/patent/US11049367B2/en
- US9443397B1 · https://patents.google.com/patent/US9443397B1/en
- US20180012453A1 · https://patents.google.com/patent/US20180012453A1/en
- Secure predetermined game generation (USPTO 11694505) ·
  https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11694505
- Provably fair gambling explained — European Gaming ·
  https://europeangaming.eu/portal/provably-fair-gambling-explained/
- Provably Fair in iGaming — Coinspaid Media ·
  https://coinspaidmedia.com/business/provably-fair-what-it/
