# JOYTOPIA — Anonim İndirim Motoru

> **Çalışma adı: Joytopia** (9 Ekim 2026). Joy + utopia — "sevinç ülkesi".
> Sistemin yarattığı şeyi anlatıyor: müşteri beklemediği anda indirim görüyor,
> seviniyor.
>
> Slogan fikri: *"İndirim bir ütopya değil — Joytopia'da her zaman indirim var."*
>
> **Neden bu isim:** uydurma birleşim olduğu için marka tescilinde ayırt edici.
> ("Altın/Sihirli" övgü sözcüğü, "indirim/discount" tanımlayıcı — ikisi de
> reddedilebilir.) Her dilde doğru okunuyor.
>
> **Elenen:** *Jestopya* — Türkçede güzel ama İngilizcede **jest = şaka**,
> dışarıda "şaka ülkesi" gibi okunur. *İndopya / Discountia* — tanımlayıcı,
> tescil riski yüksek, ikram çerçevesini kaybettiriyor.
>
> ⚠️ **Tescilden önce kontrol:** joytopia.com domain · TÜRKPATENT 35. ve 42.
> sınıf · EUIPO/WIPO çakışma. "Joy" yaygın kelime, benzer marka çıkabilir.
>
> Dışa dönük dil: **jest / ikram** · teknik dil: **indirim**.
> Müşteriye "kazandınız" denmez, "size bir jestimiz var" denir.
>
> 8-9 Ekim 2026 · Durum: **patent ERTELENDİ** (§10), mimari koruma kuralları
> belirlendi (§11), sistem henüz kodlanmadı
> Önceki aşama: [surpriz-odul-pos.md](surpriz-odul-pos.md) — telefon ödülü fikri
> Bu dosya onun **evrilmiş hali**: ödül telefon değil, indirim oranının kendisi.

---

## 1. Nereden buraya gelindi

| Aşama | Sonuç |
|---|---|
| "Altın kod patentlenebilir mi?" | ❌ İsim ve iş modeli patentlenemez (SMK m.82). Marka olur. |
| "n koddan 2'si telefon kazansın" | ⚠️ Dört bileşen dolu: kazıma kart, havuz bölme, provably fair, atomik sayaç. Dar alan. |
| "POS'a gömülü olsa" | ⚠️ Donanım patenti kolaylaştırır ama PCI-DSS + kurulum yükü + Milli Piyango. |
| **"Ödül aslında %10-50 indirim"** | ✅ Piyango riski **kalktı** — kaybeden yok, herkes indirim alıyor. |
| **"Müşteri tanıma yok, sepet tutarı tetikliyor"** | ✅ **DÖNÜM NOKTASI** — prior art'ın en yoğun alanından (sadakat/CRM) çıkıldı. |

---

## 2. Çekirdek

> **Müşteriyi tanımaksızın, işlem tutarından, indirim oranını hiçbir tarafça
> önceden belirlenemez biçimde üreten sistem.**

100 TL giriyor → 92 / 81 / 76 / 85 çıkıyor. Hangisi olacağını **kimse bilmiyor**,
sistem sahibi dahil.

### Algoritmanın özellikleri — bağımsız istem

1. **Girdi kimlik içermez** — müşteri tanınmaz, anonim tanımlayıcı bile tutulmaz
2. **Oran işlem anında üretilir** — önceden atanmış tabloda durmaz
3. **Hiçbir tarafça öngörülemez** — müşteri, kasiyer, işletme **ve sistem sahibi** dahil

### Sistemin özellikleri — bağımlı istemler

4. Doğrulanabilirlik (gizli tohum + sonradan açıklama)
5. Bütçe kontrolü (toplam/ortalama sınırı aşılmaz)
6. Ödeme akışının **önünde**, içinde değil (kart verisine dokunmaz → PCI-DSS dışı)
7. CRM'e **sonradan** yazılır, önceden okunmaz

> ⚠️ **7. madde patentin can damarı.** CRM girdi olsaydı prior art dolu alana
> düşerdi. CRM yalnızca kayıt tutuyor, oranı etkilemiyor.

---

## 3. Mimari

```
MÜŞTERİ          İŞLETME              SİSTEM              ÖDEME
                 Sepet: 100 TL
                        │
                        ├──── 100 TL ──→ [ALGORİTMA]
                        │                     │
                        │←──── 81 TL ─────────┘
   81 TL öder ←─────────┤
                        └──── 81 TL ──────────────────→ POS/tahsilat
                        CRM ←─── işlem kaydı ──────────────┘
```

| Katman | Yapar | Yapmaz |
|---|---|---|
| Sepet | Tutarı üretir | — |
| **Sistem** | **Oranı belirler, indirimli tutarı döner** | Müşteriyi tanımaz, kart görmez |
| POS | İndirimli tutarı tahsil eder | Akışta değişiklik yok |
| CRM | Sonucu kaydeder | Oranı belirlemez |

---

## 4. Prior art — ön tarama

> ⚠️ Bu **4 web araması**, vekil taraması değil. Patentlerin tam istemleri
> OKUNMADI, yalnızca özetleri görüldü. Gerçek tarama Espacenet/USPTO tam metin,
> G06Q 30/02 sınıfında, devam başvurularıyla (continuation) yapılır.

| Patent | Ne yapıyor | Senden farkı |
|---|---|---|
| US20010034651A1 | Anonim, anlık fayda; ödeme öncesi hesabı düşürür | **Reklam yanıtı** karşılığı, rastgele değil |
| US8055535 | Anonim takip, kayıt gerektirmez | Yine de **anonim kimlik tutuyor** |
| US2014/0149200A1 | Rastgele ödül (yüksek/orta/düşük) | **Program süresince**, işlem anında değil |
| US8249884B2 | Checkout'ta dinamik yüzde | Kimliğe/sadakate bağlı |
| US7665660 | Yetkilendirme anında ödül hesabı | Kart sahibine bağlı |
| US7406438 / US11769168 | Ziyaret ritmine bağlı kademe | Kurallı, rastgele değil; kimlik gerekli |
| US20130144700A1 | 1000 adet tek kullanımlık %30 kupon | Kontenjan var, rastgelelik yok |
| VRF / Pedersen commitment | Doğrulanabilir rastgelelik | Akademik, **prior art sayılır** |

**Arama motorunun kendi ifadesi:**
> *"I did not find a patent that explicitly claims a randomly determined
> discount amount at checkout."*

**Sonuç:** her bileşen ayrı ayrı var, **üçü bir arada bulunamadı.**

---

## 5. Bu patent nasıl ezilir — ve hangisi kapanır

### ✅ Kırma 1: Girdiye başka şey ekle
Rakip tutarın yanına **saat / gün / kasa no** koyar: *"kimlik kullanmıyoruz ama
14:32'yi de girdi alıyoruz."*

**Kapanır:** istem "yalnızca tutar" değil, **"kimlik kullanmaksızın"** diye yazılır.

### ❌ Kırma 2: Oranı önceden üret, gizle — KAPANMIYOR
Rakip gece 10.000 oran üretip tabloya yazar, her işlem sıradakini alır.
*"Bizde oran işlem anında üretilmiyor, önceden hazır."*

Müşteri açısından **tamamen aynı deneyim.** İhlal ispatı için rakibin koduna
bakmak gerekir.

**İKİLEM:** İstemi "işlem anında" yerine **"önceden belirlenemez"** diye yazmak
bunu kapatır — ama o zaman mekanizma değil *sonuç* korunmuş olur ve
**aşikârlık itirazı güçlenir.** Çözümü vekilin işi.

### ✅ Kırma 3: Birisi bilsin
*"İşletme sahibi görebiliyor, sadece müşteri ve kasiyer bilmiyor."*

**Kapanır:** "hiçbir tarafça" ifadesi isteme yazılır.

### ✅ Kırma 4: Oran değil tutar
Rakip yüzde atamaz, doğrudan indirimli tutarı üretir — arada "%19" diye bir
sayı hiç oluşmaz.

**Kapanır:** istem **"indirimli tutar veya oran"** diye yazılır.

### Diğer tehditler
- **Aşikârlık itirazı** — *"anonim indirim var, rastgele ödül var, birleştirmek aşikâr"*
- **Önceden yayımlama** — sistemi canlıya alıp anlatmak kendi yeniliğini öldürür
  (TR'de 12 ay hoşgörü, uluslararasında YOK)
- **Dava açamamak** — patent kendiliğinden korumaz

---

## 6. İstem yazım kuralı

**Bağımsız istem DAR olmalı.** İçine ne kadar çok şey koyarsan o kadar kolay
dolanılır — ve kimlikli taraf prior art dolu.

| İsteme GİRER (bağımsız) | İsteme GİRMEZ (bağımlı ya da hiç) |
|---|---|
| Kimlik kullanmama | CRM entegrasyonu |
| İşlem anında üretim | Ödeme altyapısına bağlanma |
| Öngörülemezlik | Referans/kod sistemi |
| | Ekran, mesaj, akış |

**"Kimlikli veya kimliksiz" yazmak patenti ZAYIFLATIR** — kimlikli taraf dolu,
ayırt edicilik kaybolur. Kimlikli kullanım **bağımlı istemle** kapsanır.

---

## 7. Cevapsız kalan sorular

Bunlar istem yazılmadan önce netleşmeli:

- [ ] **Bütçe sınırı var mı?** "%10-50 arası, ortalama %20'yi aşmaz" gibi.
      Yoksa şanssız ayda ortalama %40 çıkar, işletme zarar eder. Ayrıca
      **kontrollü öngörülemezlik**, saf rastgelelikten daha zor bir problem —
      patent gücünün bir kısmı orada. *(İki kez soruldu, cevaplanmadı.)*
- [ ] **"Kimse bilmiyor" nereye kadar?** İşletme sahibi veritabanını sorgulasa
      görebilir mi? Gerçekten hiçbir yerde durmuyorsa tasarım farklı olmalı.
- [ ] **Doğrulanabilirlik kime lazım?** İşletme mi, müşteri mi, sistem sahibi mi?
      Commit-reveal katmanı buna göre şekillenir.
- [ ] **Patent zamanlaması?** Başvuru **yayımlamadan önce** yapılmalı.

---

## 8. Sıradaki adımlar

| # | İş | Kim yapar |
|---|---|---|
| 1 | **Marka tescili** — ucuz, hızlı, hemen yapılabilir | Marka vekili |
| 2 | **Vekil ön araştırması** — birkaç bin TL, 1-2 hafta, G06Q 30/02 ekseninde | Patent vekili |
| 3 | Buluş bildirimi — iskelet hazırlanabilir, **algoritma kısmı boş** | Kurucu + vekil |
| 4 | Hukuki görüş — ölçek büyürse (Milli Piyango riski indirimle azaldı ama sıfırlanmadı) | Avukat |

> **Algoritmanın kendisi bu dosyada YOK ve olmayacak.** Kurucu dışında kimse
> bilmiyor; vekile doğrudan anlatılacak. İstem o mekanizmayı tarif etmeden
> yazılamaz — "öngörülemez bir algoritma" demek yeterli değildir, reddedilir.

---

## 9. Gerçek koruma patent değil

| Koruma | Gücü |
|---|---|
| **Ağ** | İşletme ağı kopyalanamaz |
| **Veri** | Hangi oranın ne kadar çalıştığı — senin verin |
| **Entegrasyonlar** | Geçiş maliyeti yaratır |
| **Marka** | Ucuz, hızlı, 10 yıl |
| Patent | Caydırıcılık + yatırımcı anlatımı. **Gerçek kalkan değil.** |

Dropbox'ın referans programı patentsizdi; kopyalandı, kimse öne geçemedi.

---

## 10. Patent kararı — ERTELENDİ

9 Ekim görüşmesinin sonucu: **patent öncelikli iş değil.**

### Neden

Kurucunun asıl kaygısı patent değil, **fikrin ticari olarak çalınması.**
Patent bu kaygı için yanlış araç:

| Patent ne yapar | Ne yapmaz |
|---|---|
| Dava hakkı verir | **Kopyalamayı durdurmaz** |
| Pazarlık gücü ("lisans al ya da dava") | **Yazılımda ihlali göstermez** — kapalı sistemde ispat edilemez |
| Yatırımcıya varlık olarak görünür | **Dava gücü vermez** — avukat, bilirkişi, yıllar |

### Ve ters etki riski

| | Patent al | Patent alma |
|---|---|---|
| Mekanizma | **18 ay sonra yayımlanır, herkes okur** | Gizli kalır |
| Koruma | Dava hakkı | Yok |
| Süre | 20 yıl | Sır kaldığı sürece |

Coca-Cola formülü 140 yıldır patentsiz — patentleseydi 1906'da kamuya geçerdi.

### Gerçekten koruyan şeyler

1. **Mekanizmanın sır kalması** — sunucuda, kimse göremiyor
2. **Hız** — ilk giren kazanır
3. **Veri** — hangi dağılımın ne kadar ciro getirdiği, kopyalanamaz
4. **Ağ** — işletmeler ve entegrasyonlar, geçiş maliyeti

### Donanım ("kibrit kutusu") da korumuyor

Fiziksel cihaz tersine mühendisliğe **yazılımdan daha açık** — rakip bir tane
alır, açar, içindekini çıkarır. Üstüne üretim + sertifikasyon + kurulum maliyeti.

**İroni:** mekanizmayı sunucuda tutmak, cihaza koymaktan daha güvenli.

### Çevrimdışı kararı

Kutu yalnızca sunucuya soru sorar, içinde mantık **yoktur.**
Bağlantı yoksa **jest verilmez**, normal fiyat geçer.

Denenen ve elenen alternatifler:
- *Basit yedek mantık* → bütçe kontrolünü ve doğrulanabilirliği deler
- *Yanıltıcı kod* → rakip çıktıları karşılaştırır, tutmadığını görür; dava
  durumunda aleyhe delil olur

Jest verilmemesi küçük bir kayıp; müşteri zaten o fiyatı ödeyecekti.

### Patent ne zaman gündeme gelir

- Ürün tuttuğunda
- Yatırım/ortaklık görüşmesinde varlık gerektiğinde
- **Yayımlamadan önce** — sistemi anlatmak yeniliği öldürür (TR'de 12 ay
  hoşgörü, uluslararasında yok)

---

## 11. Mimari koruma kuralları

Jest sistemi yazılırken uygulanacak. Hepsi tek amaca hizmet ediyor:
**mekanizma görülemesin.**

### 1. Mekanizma asla istemciye inmez
Oran üretimi **yalnızca sunucuda.** İstemciye inen her kod okunabilir —
JavaScript gizlenemez, mobil uygulama sökülebilir, kutu açılabilir.

### 2. API yalnızca sonuç döner
```
dogru:  { "indirimli_tutar": 820 }
yanlis: { "oran": 18, "kalan_butce": 4200, "sayac": 1847, "aralik": [0,50] }
```
Bütçe, sayaç, aralık, tohum — hiçbiri dışarı çıkmaz. Her ek alan ipucu.

### 3. Hız sınırı + örüntü tespiti
Rakip mekanizmayı **çıktılardan** öğrenmeye çalışır: aynı tutarı 10.000 kez
gönderip dağılımı çıkarır.
- İşletme başına saatlik/günlük istek sınırı
- Aynı tutarın tekrarı → işaretle
- **Sorgu-işlem bağı:** her sorgu gerçek bir satışa bağlanmalı, boşa
  sorgulama yapılamamalı

### 4. Mekanizma parametreleri ana veritabanında değil
Bütçe sınırı, aralık, dağılım kuralları kod içinde ya da ayrı gizli serviste.
Veritabanı yedeği sızarsa mekanizma da sızmasın.

### 5. Oran kaydı tutulmaz
Zaten Katman 2'nin gereği. Yalnızca işlem tutarı ve indirimli tutar kaydedilir.

### 6. Gürültü
Mekanizma deterministikse çıktılara küçük rastgelelik eklenir; yeterli örnekle
bile ters mühendislik zorlaşır.

### 7. Log disiplini
Hata kayıtlarında **asla** ara değer olmasın. Tek bir `console.error(oran, seed)`
satırı mekanizmayı Sentry'ye yazar.

### Bu projede dikkat edilecekler
- Server Action / Route Handler içinde kalmalı — client component'e düşmemeli
- **RLS yetmez** — RPC fonksiyonu sonucu dönmeli, parametreleri değil
- Vercel log'larına ara değer yazılmamalı

---

## 12. Yedi katman analizi (9 Ekim)

| # | Katman | Değer | İsteme |
|---|---|---|---|
| 1 | **Kimliksizlik** | **En yüksek** — prior art'ın %90'ı bu alanda | Karar sona bırakıldı |
| 2 | İşleme kalıcı atanmama, her bildirimde yeniden üretim | Orta-yüksek | Bağımsız |
| 3+4 | **Kontrollü öngörülemezlik** | **Yüksek** — gerçek teknik problem | Bağımsız |
| 5 | Doğrulanabilirlik (commit-reveal) | Orta — bilinen teknik, ticari indirime taşınmamış | Bağımlı |
| 6 | Ödeme akışının önünde durma | Düşük — mimari tercih, buluş değil | Bağımlı / tarifname |
| 7 | CRM'e sonradan yazma | Yüksek **dolaylı** — Katman 1'i korur | Bağımsız, olumsuz ifadeyle |

### Katman 2 — netleşen hali
Oran işleme **kalıcı olarak atanmaz.** Aynı tutar tekrar gelse yeniden üretilir;
aynı da çıkabilir farklı da. Aralık **0-50**, sıfır dahil.

Tarifnameye örnek: *"beş ardışık işlemde %12, %38, %0, %25, %7"*

### Katman 3+4 — birleşik, ayrılmaz
| Miktar tarafı | Dağılım tarafı |
|---|---|
| **İşletme belirler** — kaç kişi, hangi aralık, toplam bütçe | **Kimse bilmez** — hangi işleme hangi oran |

Piyangoda üretici **hem** miktarı **hem** dağılımı bilir (biletleri o basıyor).
Burada miktar kontrollü, dağılım değil. **Ayrım bu.**

Ve bu, "öngörülemezlik tek başına aşikâr" itirazını savuşturuyor: mesele
rastgelelik değil, **sınır altında rastgelelik.**

---

## 13. İstem yapısı — öğrenilenler

### Üç katman ayrımı
```
TICARI AMAC    musteri sayisini artirmak    <- patent konusu DEGIL
TEKNIK SONUC   ongorulemezlik               <- yeniligi kanitlar
MEKANIZMA      [nasil urettigin]            <- BULUS BU
```

### Somut isteme girmez
| İsteme (genel) | Tarifnameye (somut) |
|---|---|
| "Bir işlem bildirimi" | 1000 TL |
| "Bir indirim oranı" | %18 |
| "Bir seçim kuralı" | 3sol+5sağ+1sol+1sağ |

Anahtar metaforu: hamle dizisini isteme yazarsan rakip "3sağ+2sol" der, patent
çöp olur. **Kuralı yaz, diziyi değil.**

### Tüm unsurlar kuralı
İhlal için rakip istemdeki **bütün** unsurları karşılamalı. Biri eksikse ihlal yok.

| Rakip | İhlal mi |
|---|---|
| 4 unsurun hepsi | evet |
| 1+2+3 (sınır yok) | hayır |
| 4 unsur + ekstra 5 şey | evet (fazlası sorun değil) |

**Eksiltmek kurtarır, eklemek kurtarmaz.** Her unsur bir kaçış kapısı —
bu yüzden az unsur iyi, ama azaltınca da patent alınamıyor. İkilem bu.

### Bağımlı istem unsur EKSİLTEMEZ
```
Istem 2: "Istem 1'e gore... + E"        olur
Istem 3: "Istem 1'e gore... ama C yok"  OLMAZ (sekil hatasi)
```
Kombinasyonlar yalnızca **ayrı bağımsız istemle** korunur.

### "Hepsini yaz" neden olmaz
- **Buluş bütünlüğü** (SMK m.91) → ofis böler, her parça ayrı ücret
- **Az unsur = geniş istem = kolay ret** (A tek başına kesin reddedilir)
- **Zayıf istem güçlüyü zehirler** — reddedilen istemin prior art'ı dosyaya girer

### Gerçek strateji
```
1 ana basvuru
 - 2-3 bagimsiz istem (en guclu kombinasyonlar)
 - 10-15 bagimli istem
 - TARIFNAME: butun kombinasyonlar anlatiliyor
     -> baskasi alamaz (prior art oldu)
     -> gerekirse bolunmus basvuruyla sen alirsin
```

### Ortam adı isteme girmez
"POS", "CRM" yazarsan patenti oraya bağlarsın. **Yöntem istemi ortamdan
bağımsızdır** — POS'ta, CRM'de, bulutta çalışsın, yöntemi kullanan ihlal eder.

Bu aynı zamanda "ödeme öncesi mi sonrası mı" sorusunu da çözüyor: konum isteme
yazılmazsa, arkaya koyan da kapsamda kalır.

---

## 14. Piyango ayrımı — düzeltilmiş

Önceki not (§5b) "kaybeden yok" diyordu. Aralık **0-50** olunca bu zayıfladı
sanılmıştı — **yanlış.**

**Müşteri zaten ödeyecek.** Sepet 1000 TL, o parayı verecekti. %0 çıkan
kaybetmiyor, sadece ikram almıyor; fiyat zaten o.

| | Piyango | Joytopia |
|---|---|---|
| Ortaya konan | Bilet parası | **Hiçbir şey** |
| Kaybedince | Para gitti | **Hiçbir şey olmadı** |
| Kazanınca | Ödül | İkram |

Şans oyununda kişi bir şey ortaya koyar ve kaybedebilir. Burada koyduğu
hiçbir şey yok. **Üç ayrım da ayakta:** bedel yok, kaybeden yok, ortaya konan yok.

### Adlandırma
| Nerede | Hangi kelime |
|---|---|
| Patent istemi | **indirim** (ölçülebilir, teknik) |
| Muhasebe/fiş | **indirim** (vergisel karşılığı net) |
| Müşteriye | **jest / ikram** (beklenti yaratmaz, sıcak) |
| Hukuki savunma | **ikram / promosyon** |

4 şeker örneği: sistem 4. şekeri vermiyor, **4 şekerin fiyatını** düşürüyor.
Teknik olarak indirim, iletişimde jest.

---

## 15. İstem mimarisi — 11 Ekim oturumu

> Bu bölüm bir **karar tutanağı**, taslak değil. Önceki bölümlerle çelişen
> yerlerde **bu bölüm geçerli** (özellikle §14 adlandırma tablosu).

### 15.1 Adlandırma — elenenler ve gerekçeleri

Buluş adı aranırken şu sıra denendi, her biri ayrı sebeple elendi:

| Denenen | Neden elendi |
|---|---|
| **indirim** sistemi | Daraltıyor. Rakip "biz puan/tutar veriyoruz" der, kaçar |
| **ödül** sistemi | Prior art'ın göbeği (sadakat/ödül patentleri) |
| **piyango** sistemi | Havuz + kura anı ima eder; **bu buluşta havuz yok**, kendi sistemini kapsamaz |
| **çekiliş** sistemi | Aynı sorun + "üretici tarafından bilinmeyen çekiliş" kendi içinde çelişkili |
| **dağıtım** | Hazır havuzdan pay vermeyi ima eder |
| **eşleştirme** | İki hazır liste ima eder; burada ikisi de yok |
| **seçim** | Var olanlar arasından ayıklamak demek; burada üretim var |

**Karar: "Değer Üretme Yöntemi".**

- **değer** → indirim, puan, tutar, hediye, amorti, büyük ödül, kraker, kuzu
  çevirme, yüzme parkı — hepsi kapsamda. Kurucunun ifadesi: *"ödülün A veya B
  olması önemsiz, ikisi de ödül"* → bir üst basamağı: ikisi de **değer**
- **üretme** → havuz/dağıtım imasını kaldırır, "o anda oluşuyor" der
- **yöntem** → "sistem" cihaz/yazılım kokar, ortama bağlanır; yöntem istemi
  ortamdan bağımsızdır (POS, turnike, LED lamba, mobil)

> **§14'teki adlandırma tablosu GEÇERSİZ.** Orada "patent istemi → indirim"
> yazıyordu. İsteme **ne indirim ne ödül** girer; "değer" girer.
> §14'ün geri kalanı (piyango ayrımı: bedel yok / kaybeden yok / ortaya
> konan yok) geçerli.

### 15.2 Dokuz ödüllendirme yöntemi — ve boşluk

Otobüsteki 47 kişiye değer dağıtma yolları (kraker/elma/döner/kuzu çevirme —
eşit değil, hiyerarşik):

| # | Yöntem | Nasıl | Dağılımı kim bilir |
|---|---|---|---|
| 1 | Eşit | Herkese aynı | Herkes |
| 2 | Sıra | Koltuk 1 kraker, 2 elma... | Herkes, sayarak |
| 3 | Piyango | Kura, kuzu 1 kişiye | **Dağıtan** |
| 4 | Sadakat | Çok binen kuzu alır | Hesaplanabilir |
| 5 | Yarışma | Kazanan alır | Hakem |
| 6 | İlk gelen | Önde oturan | Kontenjan belli |
| 7 | İhtiyaç | Aç olana döner | Dağıtan |
| 8 | Jüri | Seçilene | İnsan kararı |
| 9 | Kademe | Eşik aşana | Önceden ilan |
| — | **BU BULUŞ** | Bağlam içinde sınırlı sayıda, belirsiz | **KİMSE** |

**Boşluk:** dokuzunun hepsinde dağılımı bilen bir **merci** var. Bu buluşta yok.

### 15.3 Mercisizlik — yeni damar

**Merci** = kimin ne alacağına karar veren / dağılımı bilen taraf.

Bu buluşta merci yok — sistem sahibi dahil. Kurucunun itirazı: *"sistem de bir
merci sayılmaz mı?"* → Cevap: merci karar veriyor ama **kararı önceden bilmiyor.**
Piyangoyu çeken adam hangi bileti çektiğini görür; burada önceden bilen bir yer yok.

> İstemde **"mercisiz" diye yazılmaz** — olumsuzluk unsur sayılmaz.
> İstemde yapısal haliyle durur: *"kimsenin belirleyemediği bir kaynaktan"*.

**Yanında bulunan dört damar:** kayıtsızlık, hafızasızlık, hesapsızlık,
geri döndürülemezlik. Hepsi "yokluk" üzerine kurulu — ailesi olmayan bir şeyi
tanımlamanın yolu neye benzediğini değil, **neye benzemediğini** söylemek.

### 15.4 Unsur listesi — 11 unsur

| # | Unsur | Açıklama | Tür |
|---|---|---|---|
| 1 | **Kimliksizlik** | Kim olduğu sonuca etki etmiyor; aynı kişi 40 kez gelse sistem bağ kurmuyor | **Ayırt edici** |
| 2 | **Mercisizlik** | Dağılımı belirleyen/bilen taraf yok, sistem sahibi dahil | **Ayırt edici** |
| 3 | Öngörülemezlik | Ne üretileceği önceden belirlenemiyor | 2'nin sonucu |
| 4 | **Bağlam** | Rastgelelik serbest değil, tanımlı çerçeve içinde (otobüs, konser, şehir, cuma, popülasyon kümesi) | **Ayırt edici** |
| 5 | **Sınır** | Çerçeve içinde kaç değer üretileceği belirli (47 inenden 2) | **Ayırt edici** |
| 6 | **Kayıtsızlık** | Hangi bildirime ne verildiği hiçbir yere yazılmıyor | **Ayırt edici** |
| 7 | Hafızasızlık | Kayıt olmadığı için tekrar eden kişi kayrılamıyor — yapısal adalet | 6'nın sonucu |
| 8 | Hesapsızlık | Kimse kendi payını hesaplayamıyor | 6'nın sonucu |
| 9 | Geri döndürülemezlik | Aynı girdi gelse aynı sonuç çıkmıyor | 6'nın sonucu |
| 10 | Ortam bağımsızlığı | POS, turnike, LED lamba, mobil | Yazım genişliği |
| 11 | Değer türü serbestliği | İndirim, puan, hediye, kuzu çevirme | Yazım genişliği |

**Not:** 3 ve 7-8-9 türev sayıldı ama **isteme girmeleri engellenmedi** —
1+9 ikilisi gerçek bir aday çıktı (bkz. §15.7). Kurucunun talimatı:
*"geniş tut"* → dip incelemede 11 unsurun tamamı değerlendirilecek.

**Zemin unsurlar** (her sistemde var, ayırt edici DEĞİL): bildirim alınması,
girdi varlığı, değer üretimi. Kurucunun ifadesi: *"girdinin olmadığı bir
sistem olur mu, saçma tabii ki."* Bunların kombinasyonu hiçbir kapı kapatmaz.

### 15.5 Katmanlı istem mimarisi — ONAYLI YAPI

**Karar: 3 katman.** En geniş (en az unsurlu) ile başla, giderek daralt.
Ofis yukarıdan okur, ilk geçeni verir.

```
KATMAN 1  ->  IKI unsurlu bagimsiz istemler   (BIRDEN FAZLA olabilir)
KATMAN 2  ->  UC unsurlu
KATMAN 3  ->  DORT unsurlu
TARIFNAME ->  diger butun kombinasyonlar
```

**Kritik:** Katman 1 **tek istem değil, bir küme.** Kaç istem olacağı dip
inceleme sonrası belirlenecek. Aynı katmanda birden fazla bağımsız istem
olması buluş bütünlüğünü bozmaz — aynı buluşun farklı tarifleri.

**Tek unsurlu katman yok** — her unsur tek başına prior art'a çarpıyor:

| Tek unsur | Neden olmaz |
|---|---|
| Mercisizlik | Saf rastgelelik = her çekiliş yazılımı |
| Kimliksizlik | Her anonim indirim (US20010034651A1, US8055535) |
| Bağlam | Her kampanya ("cuma günü indirim") |
| Sınır | Kontenjanlı kupon (US20130144700A1) |
| Kayıtsızlık | Olumsuz özellik, buluş değil |

> Dip inceleme sonunda tek unsurlu bir katman bulunursa açılabilir — kapı kapalı değil.

**Neden 10+ bağımsız istem yazılmıyor** (kurucunun 1+2, 1+4, 1+5, 1+2+4... önerisi):
- **Buluş bütünlüğü (SMK m.91)** → ofis böler, her parça ayrı ücret
- Çoğu kombinasyon **tutarsız** (örn. 1+4: mercisizlik yok → öngörülemezlik yok)
- **Zayıf istem güçlüyü zehirler** → reddedilen istemin prior art'ı dosyaya girer
- **Çözüm:** o kombinasyonlar **tarifnameye** yazılır → başkası alamaz
  (prior art olur), ileride istenirse bölünmüş başvuruyla alınır. Maliyet sıfır.

### 15.6 Katmanlı yapının etkisi — pozitif/negatif

| Pozitif | Negatif |
|---|---|
| Üç şans, tek ücret | Zayıf istem güçlüyü zehirler |
| Pazarlık alanı (uzman "daralt" derse hazır) | Bütünlük itirazı riski |
| Rakip her katmanı ayrı atlatmak zorunda | Süre uzar (3 yıl → 5 yıl) |
| Bölünmüş başvuru hakkı | |

**Sonuç: pozitif ağır basıyor** — bir şartla: Katman 1 "umutsuz geniş"
olmamalı. Kesin reddedilecek bir istem sadece prior art biriktirir.
Umutsuz çıkanlar isteme değil tarifnameye gider.

### 15.7 Katman 1 adayları — KARAR VERİLMEDİ

İkili taraması **sistematik yapılmadı** (8-10 ikiliye bakıldı, 55'in tamamına
değil). Eldeki en iyi iki aday:

| Aday | Avantaj | Dezavantaj |
|---|---|---|
| **1+2** kimliksizlik + mercisizlik | En ayırt edici, "anonim ama tahmin edilemez" tabloda yok | "Kimse bilmiyor" ispatı zor |
| **1+9** kimliksizlik + geri döndürülemezlik | **Test edilebilir** — aynı girdi iki kez, farklı sonuç | Rakip "saati de girdi alıyoruz" der (Kırma 1) |

**İkinci güçlü ikili: 2+5** (mercisizlik + sınır) — aşikârlık savunmasının
tamamı burada: *"miktar kontrollü, dağılım bilinmez."*

**Önemli ayrım:** kimliksizlik **prior art'tan** ayırıyor; mercisizlik+sınır
**aşikârlıktan** koruyor. İkisi farklı itiraza cevap veriyor.

### 15.8 Referans istem metni — çalışma taslağı

Katman 2 seviyesinde (4 unsur), oturumda varılan hali:

> **Bir bildirim üzerine, kimlik içermeyen bir girdiden, kimsenin
> belirleyemediği bir kaynaktan, tanımlı bir bağlam içinde sınırlı sayıda,
> önceden belirlenemez değer üreten yöntem.**

Kurucunun özeti: *"bir otobüste, bir konserde veya bir şehirde 2 rastgele
değer üretmek."*

**Kelime kelime gerekçe:**

| İfade | Neden böyle |
|---|---|
| "bir **işlem veya olay** bildirimi" | Tetikleyici ticari olmak zorunda değil: otobüsten inmek, odaya girmek, siteye giriş, turnikeden geçiş. "İşlem" tek başına ticari olmayanı dışlar |
| "**kimlik içermeyen** girdiden" | En değerli unsur; prior art'ın %90'ı kimlikli alanda. **"Kimlikli veya kimliksiz" yazmak patenti ZAYIFLATIR** |
| "**kimsenin belirleyemediği** bir kaynaktan" | Kaynak **adı yazılmaz**. Kurucunun tespiti: *"bunu bir şeye bağlarsan, başkası da başka bir şeye bağlar."* "Donanım" yazsan rakip blockchain'e, "blockchain" yazsan donanıma bağlar |
| "**tanımlı bir bağlam** içinde" | Aşikârlık itirazını kıran unsur. Salt rastgelelik yazılırsa ofis haklı olarak "biliniyor" der |
| "**sınırlı sayıda**" | Bağlam ve sınır **birlikte** anlam kazanır. Bağlam tek başına: "otobüste değer üret, kaça?" → sınırsızsa herkese verir, rastgelelik ölür |
| "**önceden belirlenemez**" | Taraf **sayılmaz**. Liste yazılırsa rakip listede olmayan rol uydurur ("bizde onaylayıcı var"). "Önceden belirlenemez" = bilinecek bir şey olmadığını söyler |
| "**değer**" | İndirim/ödül/puan/tutar/hediye hepsi |
| "**yöntem**" | Ortamdan bağımsız |

**İstemde GEÇMEYECEK olanlar:** sayı (10/11 hamle sorunu), hamle dizisi,
kaynak adı, tür adı (piyango/çekiliş/ödül), ortam adı (POS/CRM/lamba),
taraf listesi, bağlamın nasıl belirlendiği (→ tarifname).

### 15.9 Dolanma testi — kapanan kapılar

| Rakibin denemesi | Sonuç |
|---|---|
| "10 değil 11 hamle" tarzı sayı oyunu | **Kapalı** — sayı yazılmadı |
| Başka rastgelelik kaynağı | **Kapalı** — kaynak adı yazılmadı |
| "İndirim değil puan veriyoruz" | **Kapalı** — "değer" |
| "20 kişi değil %0.1" | Açık → "sınırlı sayıda" ikisini kapsamalı |
| Bağlamı parçalamak (4 kapı × 5 kişi) | Zayıf kaçış — yine bağlam var |
| Farklı ortam (LED lamba, mobil) | **Kapalı** — ortam yazılmadı |
| Taraf rolü uydurmak | **Kapalı** — taraf sayılmadı |
| Kimlik kullanmak | Kaçar, ama **farklı sistem olur** |

**LED lamba testi:** Yöntem lambaya yüklenirse — basış = bildirim, basan
bilinmiyor = kimliksiz, 100 basışta 2 yanma = bağlam + sınır. Dört unsur tam,
**kapsamda.** Patent yöntemi korur, cihazı değil.

### 15.10 Oturumda düzeltilen yanılgılar

| Yanılgı | Düzeltme |
|---|---|
| "Sayaç tutmak kayıtsızlığı ihlal eder" | **Kurucunun itirazı haklı:** sayaç ≠ kayıt. Sistem sayıyor ama **eşleştirmeyi** saklamıyor. Aynı kişi 40 kez gelse her biri ayrı bildirim |
| "Popülasyon (kadınlar, İstanbul) kimlik sayılır" | **Hayır — bağlam.** Kişiyi tanımıyor, küme tanımlıyor. Çelişki yok |
| "Kimlik içermeyen" → "kimliğin etki etmediği" | **Geri alındı.** Sulandırıyordu; en değerli unsurun ayırt ediciliğini azaltıyordu |
| İstemde "bir veya daha fazla bağlam", "adet veya oran" | **Atıldı** — senaryo yamalarıydı, istemi şişiriyordu. Tekil yazım çoğulu kapsar |
| "4 unsur kararı verildi" | Yanlış hatırlama; "4 unsur" tüm unsurlar kuralının **örnek tablosundan** geliyordu |
| "Patent ertelendi, mekanizma kurulmadı" | **Mekanizma kurucunun kafasında VAR.** Başvuru yazılabilir. §10'un "ertelendi" gerekçesi bu yönüyle geçersiz |
| "IP adresi kimliktir" | Kurucu IP'yi **bağlam** olarak kullandı (site/sunucu bir çerçeve), kimlik kaydı olarak değil |

### 15.11 Mekanizma — çerçeve bilgisi

> Mekanizmanın kendisi bu dosyada **YOK ve olmayacak.** Vekile doğrudan
> anlatılacak. Aşağıdaki yalnızca istem yazımı için gereken çerçeve.

- Algoritma **net olarak rastgelelik içeriyor**
- Yöntem **birkaç parçadan** oluşuyor
- **Bağlama göre farklı davranıyor** — otobüste bir türlü, konserde başka,
  cuma alışverişinde başka
- Rastgelelik **serbest değil, bağlam çerçevesinde**
- Alıcının geçmişi sonuca **etki etmiyor** (aynı kart 5 dk sonra tekrar
  okutulsa sonuç değişmez)
- Karar **bildirim anında doğuyor**, öncesinde yok

### 15.12 AÇIK RİSK — aşikârlık itirazı

Ofisin muhtemel itirazı: *"Rastgelelik + kimliksizlik + sınır, bilinenlerin
aşikâr birleşimi."*

**Savunma:** miktar kontrollü, dağılım bilinmez.

| | Miktar | Dağılım |
|---|---|---|
| Piyango | Üretici bilir | **Üretici bilir** |
| Saf rastgele | Kontrolsüz | Kimse bilmez |
| **BU BULUŞ** | **Belirli** | **Kimse bilmez** |

Bu kombinasyon §15.2 tablosunda yok. Argüman güçlü ama **garanti değil.**

### 15.13 SIRADAKİ İŞ — "Dip İnceleme"

**Görev tanımı (kurucu onaylı):**

1. **11 unsurun 55 ikilisinin TAMAMI** taranacak. Zemin kombinasyonları dahil;
   çöp olanlar "şu yüzden çöp" diye tek satırda işaretlenecek — **bakmadan
   atlanmayacak**
2. **Ayırt edici 8 unsurun 28 ikilisi** derinlemesine: tutarlı mı, prior art'a
   çarpıyor mu, **kaç kapı kapatıyor**, rakip nasıl atlatır
3. **Ölçüt:** teorik güzellik değil → **kapatılan kaçış yolu sayısı**
4. **Unsur listesi denetimi:** 11 unsur gerçekten hepsi mi, konuşulmayan bir
   ayırt edici unsur var mı — *"benim de gözümden kaçan bir şey olur mu,
   açığımı da kapat"*
5. **Çıktı:** kıymetli ikililerin listesi + elenme gerekçeleri

Sonra: Katman 2 (üçlüler), Katman 3 (dörtlüler).

**Prior art taraması EN SONA** — kurucunun kararı: *"neyi araştıracağın belli
değilken o katmana geçmek doğru değil, o son test aşaması."* Dosyadaki mevcut
tarama (§4) kendi deyimiyle "4 web araması, tam istemler okunmadı."

### 15.14 Yöntem notu — tartışma biçimi

Kurucunun talebi: *"ben anlatacağıma, sen anlamaya çalış."*
- Tek soru sor, cevabı bekle, uzun tablolar dökme
- Mekanizmanın detayını sorma; **çerçeve sınırında kal**
- Fikir tartışılırken yasal mevzuata sapma
- Karara bağlanmamış bir konuyu sorgulamaya acele etme
- "Bitti / rakibi yok / konu kapandı" deme — sistematik bakılmadıysa söyle

---

> **UYARI: Bu bolumun kapsam hukumleri HATALIDIR, §17 iptal etti.**
> Unsur eklemenin kacis yolu "kapattigi" varsayimi yanlis — unsur eklemek
> istemi DARALTIR. Gecerli siralama ve degerlendirme icin §17.6 ve §17.8.

## 16. DİP İNCELEME — ikili kombinasyon taraması

> 11 Ekim 2026. Görev: 11 unsurun 55 ikilisinin tamamını taramak, kıymetli
> olanları tespit etmek, elenenleri gerekçeleriyle işaretlemek.
> Ölçüt: **teorik güzellik değil → kapatılan kaçış yolu sayısı.**

### 16.0 Unsur listesi denetimi — ÖNCE BU

Taramaya başlamadan önce "11 unsur gerçekten hepsi mi" sorusu.
**Cevap: hayır.** Konuşulmayan **4 ayırt edici unsur** bulundu.

#### Bulunan yeni unsurlar

| # | Unsur | Açıklama | Neden gözden kaçtı |
|---|---|---|---|
| **12** | **Girdi yalınlığı** | Girdi yalnızca tetikleyicinin varlığıdır; kimlik DIŞINDA hiçbir yardımcı veri (saat, kasa no, sepet içeriği, konum) sonuca karışmaz | Kimliksizliğin içinde sanıldı — **ama ayrı unsur.** §5 Kırma 1'in tek gerçek panzehiri |
| **13** | **Eşzamanlılık** | Değer, bildirim anında üretilir; öncesinde hiçbir yerde mevcut değildir | "Öngörülemezlik"in içinde sanıldı — ama o sonuç, bu **zamanlama**. §5 Kırma 2'nin karşılığı |
| **14** | **Tekrarsızlık** | Aynı bağlam yeniden kurulsa dağılım yeniden üretilir; iki tur arasında örüntü yok | 9 (geri döndürülemezlik) tek bildirim düzeyinde; bu **tur düzeyinde** |
| **15** | **Kapsayıcılık** | Bağlam içindeki her bildirim eşit olasılıkla aday; hiçbiri baştan dışlanmaz veya ayrıcalıklı değil | Hiç konuşulmadı — **kurucunun açığı buydu** |

#### 12 — Girdi yalınlığı neden kritik

Dosyadaki **Kırma 1** şöyle diyordu: rakip *"kimlik kullanmıyoruz ama 14:32'yi
de girdi alıyoruz"* der. §5 bunun "kimlik kullanmaksızın" yazılarak kapandığını
söylüyor — **bu yanlış.** Kimliği yazmak saati kapatmıyor; rakip kimliksiz
kalıp saat/kasa no/sepet ekleyerek farklı bir sisteme dönüşebilir.

Kapatan şey girdi yalınlığıdır: *"tetikleyicinin varlığı dışında hiçbir veri
sonuca etki etmez."*

Ve bu kurucunun kendi tarifiyle birebir örtüşüyor: *"sistem onu 'o geçen'
olarak görüyor, artık o her kimse."* — "o geçen" bilgisi **tek** girdi.

> **§5 Kırma 1'in "kapanır" işareti düzeltilmelidir.** Kimliksizlik tek başına
> yetmiyor; girdi yalınlığı gerekiyor.

#### 15 — Kapsayıcılık neden kurucunun açığı

Hiç konuşulmadı ama en sinsi kaçış kapısını kapatıyor:

Rakip şöyle der: *"Biz de kimliksiz, mercisiz, bağlamlı, sınırlı çalışıyoruz —
ama sadece ilk 10 inen aday, gerisi hiç değerlendirilmiyor."* Dört unsuru
karşılıyor, ihlal etmiyor gibi görünüyor, oysa yöntemin ruhunu kullanıyor.

Kapsayıcılık bunu kapatır. Ayrıca **hafızasızlığın (7) olumlu ifadesi** —
"kayrılamıyor" demek yerine "hepsi eşit aday" demek. Patent dilinde olumlu
ifade her zaman daha güçlü.

#### Düzeltilmiş unsur envanteri — 15 unsur

| # | Unsur | Tür |
|---|---|---|
| 1 | Kimliksizlik | **Ayırt edici — çekirdek** |
| 2 | Mercisizlik | **Ayırt edici — çekirdek** |
| 3 | Öngörülemezlik | Türev (2'nin sonucu) |
| 4 | Bağlam | **Ayırt edici — çekirdek** |
| 5 | Sınır | **Ayırt edici — çekirdek** |
| 6 | Kayıtsızlık | **Ayırt edici** |
| 7 | Hafızasızlık | Türev (6'nın sonucu) |
| 8 | Hesapsızlık | Türev (6'nın sonucu) |
| 9 | Geri döndürülemezlik | Türev (6+2'nin sonucu) |
| 10 | Ortam bağımsızlığı | Yazım genişliği — isteme girmez |
| 11 | Değer türü serbestliği | Yazım genişliği — isteme girmez |
| **12** | **Girdi yalınlığı** | **Ayırt edici — YENİ** |
| **13** | **Eşzamanlılık** | **Ayırt edici — YENİ** |
| **14** | **Tekrarsızlık** | **Ayırt edici — YENİ** |
| **15** | **Kapsayıcılık** | **Ayırt edici — YENİ** |

**Ayırt edici: 9 unsur** (1, 2, 4, 5, 6, 12, 13, 14, 15)
**Türev: 4** (3, 7, 8, 9) — isteme girebilir, baştan elenmedi
**Yazım: 2** (10, 11) — isteme girmez

> Tarama 11 unsur (55 ikili) için planlanmıştı; 15 unsurla **105 ikili** oldu.
> Aşağıda hepsi var.

---

### 16.1 ZEMİN ELEMESİ — tek satırda kapananlar

**10 ve 11'in tüm ikilileri (27 kombinasyon): ÇÖP.**

Gerekçe: ortam bağımsızlığı ve değer türü serbestliği **unsur değil, yazım
tercihidir.** İsteme "her ortamda çalışır" yazılmaz; ortam adı *yazılmayarak*
sağlanır. Bir kapı kapatmazlar, çünkü rakibi dışarıda bırakmazlar.

| İkili grubu | Adet | Durum |
|---|---|---|
| 10 + (1..9, 11..15) | 14 | ÇÖP — yazım tercihi, kapı kapatmaz |
| 11 + (1..9, 12..15) | 13 | ÇÖP — aynı gerekçe |

**Kalan incelenecek: 78 ikili** (1-9 ve 12-15 arası, yani 13 unsurun ikilileri).

---

### 16.2 ÇEKİRDEK İKİLİLER — kıymetli çıkanlar

Ölçüt: **kaç kaçış kapısı kapatıyor.** Dört bilinen kırma yolu (§5) ve
tarama sırasında bulunan yenileri test ettim.

#### ★★★ 1+2 — Kimliksizlik + Mercisizlik

> *Kimlik içermeyen bir girdiden, kimsenin belirleyemediği bir kaynaktan
> değer üreten yöntem.*

| Kapattığı | Açık bıraktığı |
|---|---|
| Kimlikli sistemlerin tamamı (prior art'ın %90'ı) | **Kırma 1** — rakip saat/kasa no ekler |
| Kırma 3 (birisi bilsin) | **Kırma 2** — rakip önceden üretip saklar |
| | Bağlamsız/sınırsız → aşikârlık |

**Güç: 2 kapı.** En ayırt edici ikili — "anonim ama tahmin edilemez"
kombinasyonu §15.2 tablosunda yok.

**Zaafı:** mercisizlik ispatı. Ofis *"kimsenin bilmediğini nasıl
gösteriyorsun"* diye sorar, cevap mekanizmaya iner.

**Katman 1 adayı — EVET.**

#### ★★★ 1+12 — Kimliksizlik + Girdi yalınlığı

> *Tetikleyicinin varlığı dışında hiçbir veri sonuca etki etmeksizin değer
> üreten yöntem.*

| Kapattığı | Açık bıraktığı |
|---|---|
| Kimlikli sistemler | Mercisizlik yazılmadı → "biz tahmin edilebiliriz ama kimliksiz" |
| **Kırma 1 — tek kapatan ikili** | Kırma 2 |
| Kırma 4 (oran/tutar) dolaylı | |

**Güç: 2 kapı — ama biri başka hiçbir ikilinin kapatmadığı kapı.**

**Kritik bulgu:** Kırma 1'i kapatan tek ikili bu. 1+2 onu açık bırakıyor.

**Zaafı:** öngörülemezlik hiç geçmiyor → ofis *"kimliksiz ve yalın girdili
sistem, bu bir kampanya"* der. Tek başına aşikâr.

**Katman 1 adayı — EVET, 1+2'nin tamamlayıcısı olarak.**

#### ★★★ 2+13 — Mercisizlik + Eşzamanlılık

> *Kimsenin belirleyemediği bir kaynaktan, bildirim anında, öncesinde hiçbir
> yerde mevcut olmayan bir değer üreten yöntem.*

| Kapattığı | Açık bıraktığı |
|---|---|
| **Kırma 2 — tek doğrudan kapatan ikili** | Kimlik (rakip kimlikli çalışır) |
| Kırma 3 | Bağlam/sınır yok → aşikârlık |

**Güç: 2 kapı — ve §5'in "KAPANMIYOR" dediği kapı.**

**EN ÖNEMLİ BULGU.** §5 Kırma 2 için şöyle yazıyordu:

> *"İstemi 'işlem anında' yerine 'önceden belirlenemez' diye yazmak bunu
> kapatır — ama o zaman mekanizma değil sonuç korunmuş olur ve aşikârlık
> itirazı güçlenir. Çözümü vekilin işi."*

**İkilem yanlış kurulmuş.** "Ya zamanlama ya sonuç" diye bir seçim yok —
**ikisi birlikte yazılabilir:**

- *"önceden belirlenemez"* → sonuç (aşikârlık savunması)
- *"bildirim anında üretilir, öncesinde mevcut değildir"* → zamanlama (Kırma 2)

İkisi çelişmiyor, biri diğerini dışlamıyor. Eşzamanlılık ayrı unsur sayılmadığı
için ikilem sanılmış.

> **§5 Kırma 2'nin ❌ işareti KALDIRILMALI.** Unsur 13 ile kapanıyor.
> İhlal ispatı hâlâ zor (rakibin koduna bakmak gerekir) ama **istem kapsıyor** —
> bu ikisi farklı şey. Kapsamayan istem hiç dava edilemez; kapsayan istem
> en azından ispat edilebilirse dava edilir.

**Katman 1 adayı — EVET, yüksek öncelik.**

#### ★★★ 2+5 — Mercisizlik + Sınır

> *Kimsenin belirleyemediği bir kaynaktan, sınırlı sayıda değer üreten yöntem.*

| Kapattığı | Açık bıraktığı |
|---|---|
| **Aşikârlık itirazı** — "miktar kontrollü, dağılım bilinmez" | Kimlik |
| Saf rastgelelik prior art'ı | Kırma 1, Kırma 2 |
| Piyango ayrımı (§15.2) | |

**Güç: 1 kapı ama en değerli kapı.** Aşikârlık itirazına cevap veren tek ikili.

**Kritik ayrım (§15.7'de tespit edilmişti, tarama doğruladı):**
kimliksizlik **prior art'tan** ayırır, mercisizlik+sınır **aşikârlıktan** korur.
İkisi farklı itiraza cevap verir — biri diğerinin yerine geçmez.

**Katman 1 adayı — EVET.**

#### ★★ 1+9 — Kimliksizlik + Geri döndürülemezlik

> *Kimlik içermeyen bir girdiden, aynı girdi için aynı sonucu vermeyecek
> şekilde değer üreten yöntem.*

| Kapattığı | Açık bıraktığı |
|---|---|
| Kimlikli sistemler | **Kırma 1 — rakip "saati de alıyoruz, o yüzden farklı çıkıyor" der** |
| Deterministik kuralların tamamı | Kırma 2 |

**Güç: 2 kapı ama biri kolay atlatılır.**

**Avantajı (§15.7'de tespit edilmişti): test edilebilirlik.** Aynı girdi iki kez
verilir, farklı sonuç çıkar → kanıtlanır. Mercisizlik gibi ispatı zor bir
olumsuzluk değil.

**Tarama bulgusu:** Kırma 1 zaafı sanılandan ciddi. Rakip saati girdi alırsa
*doğal olarak* her seferinde farklı sonuç üretir ve bu istemi karşılamış
görünür. **12 (girdi yalınlığı) ile birlikte yazılmazsa zayıf.**

**Katman 1 adayı — ŞARTLI.** 1+9 yerine 1+12 veya 9+12 daha güçlü.

#### ★★ 9+12 — Geri döndürülemezlik + Girdi yalınlığı

> *Tetikleyicinin varlığı dışında hiçbir veri etki etmeksizin, aynı girdi için
> aynı sonucu vermeyen değer üreten yöntem.*

| Kapattığı | Açık bıraktığı |
|---|---|
| **Kırma 1** (girdi yalın) | Kimlik — ama girdi yalınsa kimlik de giremez, **dolaylı kapanıyor** |
| Deterministik kurallar | Kırma 2 |

**Güç: 2 kapı + dolaylı kimlik koruması.**

**Tarama bulgusu — yeni:** Bu ikili ilginç bir şey yapıyor. Girdi yalınlığı
kimliği de dışlıyor (kimlik bir veridir, yalın girdiye giremez). Yani
kimliksizlik yazılmadan kimliksizlik sağlanıyor.

Ve "aynı girdi ≠ aynı sonuç" + "girdi yalnızca tetikleyici" birleşince
**mantıksal zorunluluk** doğuyor: girdi hep aynı (bir tetikleyici) ama sonuç
farklı → demek ki kaynak girdinin dışında ve kontrolsüz. **Mercisizlik de
dolaylı olarak türüyor.**

İki unsurla üç unsurun işini yapıyor. İspatı da kolay (test edilebilir).

**Katman 1 adayı — EVET, güçlü aday.**

#### ★★ 1+13 — Kimliksizlik + Eşzamanlılık

| Kapattığı | Açık bıraktığı |
|---|---|
| Kimlikli sistemler | Kırma 1 |
| Kırma 2 | Aşikârlık (bağlam/sınır yok) |

**Güç: 2 kapı.** 1+2'nin alternatifi — mercisizlik yerine eşzamanlılık.
Avantajı: eşzamanlılık **yapısal** bir ifade, mercisizlik gibi olumsuzluk değil.

**Katman 1 adayı — EVET, 1+2 ile yarışır.**

#### ★★ 4+5 — Bağlam + Sınır

| Kapattığı | Açık bıraktığı |
|---|---|
| Sınırsız/bağlamsız dağıtımlar | Her şey — mercisizlik yok |

**Güç: 1 zayıf kapı.** Mercisizlik olmadan "cuma günü 10 kişiye indirim" =
sıradan kampanya. Prior art dolu.

**Ama:** ikisi birbirinden **ayrılamaz.** Bağlam tek başına "kaça?" sorusunu
doğurur; sınır tek başına nerede geçerli olduğunu söylemez. Katman 2'de
birlikte girmek zorundalar — §15.5'teki tespit doğru.

**Katman 1 adayı — HAYIR.** Katman 2 bileşeni.

#### ★ 6+14 — Kayıtsızlık + Tekrarsızlık

| Kapattığı | Açık bıraktığı |
|---|---|
| Geçmişe dönük her türlü erişim | Kimlik, bağlam, sınır |

Teorik olarak çok temiz: bilgi ne kayıttan bakılabilir ne yeniden üretilebilir.
Ama **ikisi de olumsuzluk** — ofis *"bu yöntem ne YAPIYOR"* diye sorar.
Yapı tarif etmiyor.

**Katman 1 adayı — HAYIR.** Katman 3 bileşeni.

#### ★ 15+5 — Kapsayıcılık + Sınır

| Kapattığı | Açık bıraktığı |
|---|---|
| **"Sadece ilk 10 aday" kaçışı** | Mercisizlik, kimlik |
| Ön filtreleme ile ayrıcalık | |

**Yeni kapı:** Tarama sırasında bulunan kaçış yolu. Rakip bağlamı daraltarak
("sadece ilk 10 inen aday") yöntemin ruhunu kullanıp istemden kaçabilir.
Kapsayıcılık + sınır bunu kapatır: *"bağlam içindeki her bildirim eşit
olasılıkla aday, sınır yalnızca üretilecek değer sayısını belirler."*

**Katman 1 adayı — HAYIR** (tek başına zayıf), **ama Katman 2-3'te şart.**

---

### 16.3 ELENEN İKİLİLER — gerekçeli tam liste

Aşağıdaki 60+ ikili tek tek bakıldı, hepsi elendi. Gerekçeler kısa ama
bakılmadan atlanan yok.

#### Tekrar / içerme sorunu olanlar (aynı şeyi iki kez söylüyor)

| İkili | Gerekçe |
|---|---|
| 2+3 | 3 zaten 2'nin sonucu — "kaynak belirsiz, o yüzden sonuç belirsiz" tekrar |
| 6+7 | 7 zaten 6'nın sonucu |
| 6+8 | 8 zaten 6'nın sonucu |
| 6+9 | 9 büyük ölçüde 6'dan türüyor |
| 7+8 | İkisi de 6'nın türevi, aralarında fark yok |
| 7+9 | Aynı |
| 8+9 | Aynı |
| 1+7 | Kimlik yoksa hafıza da yok — tekrar |
| 3+9 | Geri döndürülemezlik öngörülemezliğin özel hali |
| 3+13 | Eşzamanlılık öngörülemezliği içeriyor |
| 3+14 | Aynı aile |
| 9+14 | 14, 9'un tur düzeyindeki hali — çok yakın, ayrı istem olmaz |
| 7+15 | 15, 7'nin olumlu ifadesi — aynı şey |

#### Tutarsız olanlar (biri olmadan diğeri anlamsız)

| İkili | Gerekçe |
|---|---|
| 1+4 | Mercisizlik yok → öngörülemezlik yok → "cuma günü anonim indirim", kampanya |
| 1+5 | Aynı sorun + US20130144700A1'e yakın (kontenjanlı anonim kupon) |
| 1+6 | Kimlik yoksa kaydedilecek eşleşme de yok → kısmen tutarsız |
| 4+6 | Bağlamlı ama kayıtsız; öngörülemezlik yok, buluş kalmıyor |
| 4+7 | Aynı |
| 4+8 | Aynı |
| 5+6 | Sınırlı ve kayıtsız ama belirsizlik yok |
| 5+7, 5+8 | Aynı |
| 4+15 | Kapsayıcılık + bağlam: sınır yok → herkes alır, rastgelelik ölür |
| 12+15 | İkisi de "girdi/aday" tarafı; üretim tarafı hiç yok |
| 13+15 | Eşzamanlı ve kapsayıcı ama kaynak belirsizliği yok |
| 14+15 | Tur düzeyi + aday düzeyi, üretim yok |
| 12+13 | Yalın girdi + anlık üretim: belirsizlik kaynağı yok → deterministik olabilir |
| 12+14 | Aynı sorun |
| 6+12 | Kayıt yok + girdi yalın: üretim hakkında hiçbir şey söylemiyor |
| 6+13 | Kayıtsız + anlık: belirsizlik yok |
| 6+15 | Kayıtsız + kapsayıcı: üretim yok |
| 8+12, 8+13, 8+14, 8+15 | Hesapsızlık **sonuç**, mekanizma değil; ispatlanamaz iddia |
| 7+12, 7+13, 7+14 | Hafızasızlık türev; eşleştiği unsurlarla yapı kurmuyor |

#### Prior art'a çarpanlar

| İkili | Gerekçe |
|---|---|
| 2+4 | Çerçeveli rastgelelik, sınır yok → US2014/0149200A1 (program süresince rastgele ödül) |
| 2+6 | Rastgele + kayıtsız: her basit çekiliş yazılımı |
| 2+7, 2+8 | Aynı aile |
| 2+9 | Rastgele kaynak + farklı sonuç: rastgeleliğin tanımı, tekrar |
| 2+14 | Aynı |
| 2+15 | Rastgele + eşit aday: piyangonun tanımı |
| 2+12 | **SINIRDA** — yalın girdi + belirsiz kaynak güçlü, ama kimlik yazılmadığı için prior art'ta anonim-rastgele sistemlere çarpar. Katman 2'de 1 ile birlikte güçlü |
| 3+4, 3+5, 3+6, 3+7, 3+8 | 3 türev; eşleştiği unsurla yapı kurmuyor, "belirsiz ve sınırlı" = çekiliş |
| 3+12, 3+15 | Aynı |
| 1+3 | Anonim + öngörülemez: US20010034651A1 / US8055535 ailesi, en dolu alan |
| 1+8 | Hesapsızlık ispatlanamaz, kimliksizlik tek başına kalıyor |
| 1+14 | Kimliksiz + turlar arası örüntüsüz: kaynak belirsizliği yazılmadan zayıf |
| 1+15 | Kimliksiz + eşit aday: anonim çekiliş |
| 4+9, 4+12, 4+13, 4+14 | Bağlam + tek türev/yapı: mercisizlik yok, kampanya seviyesinde |
| 5+9, 5+12, 5+13, 5+14, 5+15 | Sınır + tek unsur: kontenjanlı kupon ailesi |
| 13+14 | Anlık üretim + turlar arası örüntüsüzlük: rastgelelik tanımı |
| 9+13 | Aynı aile, tekrar |
| 9+15 | Geri döndürülemez + eşit aday: kaynak yazılmadan zayıf |
| 12+9 | ★★ olarak yukarıda değerlendirildi (9+12) |

#### Zemin unsurların ikilileri

10 ve 11'in 27 ikilisi → §16.1'de elendi (yazım tercihi, kapı kapatmaz).

---

### 16.4 SONUÇ — Katman 1 adayları, güç sıralı

| Sıra | İkili | Kapattığı kapı | Benzersiz katkısı |
|---|---|---|---|
| **1** | **2+13** mercisizlik + eşzamanlılık | 2 | **Kırma 2'yi kapatan tek ikili** |
| **2** | **9+12** geri döndürülemezlik + girdi yalınlığı | 2 + dolaylı 2 | **İki unsurla üç unsurun işi**, test edilebilir |
| **3** | **1+12** kimliksizlik + girdi yalınlığı | 2 | **Kırma 1'i kapatan tek ikili** |
| **4** | **1+2** kimliksizlik + mercisizlik | 2 | En ayırt edici, prior art'tan en uzak |
| **5** | **1+13** kimliksizlik + eşzamanlılık | 2 | 1+2'nin yapısal (olumsuzluksuz) alternatifi |
| **6** | **2+5** mercisizlik + sınır | 1 | **Aşikârlık itirazına cevap veren tek ikili** |
| 7 | 1+9 kimliksizlik + geri döndürülemezlik | 2 | Test edilebilir, ama Kırma 1'e açık |

#### Kritik bulgu: hiçbir ikili tek başına yetmiyor

Dört kırma yolunu kapatan ikili yok. Her ikili en çok 2 kapı kapatıyor,
başka 2'sini açık bırakıyor:

| | Kırma 1 (yardımcı veri) | Kırma 2 (önceden üret) | Prior art (kimlik) | Aşikârlık |
|---|---|---|---|---|
| 1+2 | ✗ | ✗ | ✓ | ✗ |
| 1+12 | ✓ | ✗ | ✓ | ✗ |
| 2+13 | ✗ | ✓ | ✗ | ✗ |
| 9+12 | ✓ | ✗ | ~ | ✗ |
| 2+5 | ✗ | ✗ | ✗ | ✓ |

**Tam koruma için minimum dörtlü gerekiyor:** 1 + 12 + 13 + 5
(kimliksizlik + girdi yalınlığı + eşzamanlılık + sınır) — bu dördü tüm
bilinen kapıları kapatıyor. Mercisizlik (2) bu dörtlüden **türüyor**:
girdi yalınsa, üretim anlıksa ve sonuç öngörülemezse, belirleyen taraf
yapısal olarak yok.

Bu, Katman 3'ün (dörtlü) hangi unsurlardan kurulacağını gösteriyor —
§15.8'deki taslaktan **farklı**: orada 1+2+4+5 vardı, tarama 1+12+13+5
diyor. Bağlam (4) ve mercisizlik (2) Katman 2'ye kayıyor.

#### Katman 1 için öneri — 3 bağımsız istem

| İstem | İkili | Gerekçe |
|---|---|---|
| **1a** | 1+2 | En ayırt edici, prior art'tan en uzak. Geçerse en geniş koruma |
| **1b** | 2+13 | Kırma 2'yi kapatır; 1a reddedilirse ayakta kalır |
| **1c** | 9+12 | Test edilebilir, ispat kolay; ikisi de reddedilirse son hat |

Üçü aynı buluşun farklı tarifleri → buluş bütünlüğü bozulmaz.
1a olumsuzluk ağırlıklı (ispatı zor), 1c yapısal (ispatı kolay) — farklı
itirazlara karşı farklı savunma.

**2+5 Katman 1'e alınmadı:** kimliksizlik içermediği için prior art'a açık.
Ama **aşikârlık savunmasının tek taşıyıcısı** olduğu için Katman 2'de
mutlaka bulunmalı.

---

### 16.5 §5'te DÜZELTİLMESİ GEREKENLER

Tarama iki hatalı işaret buldu:

| § | Mevcut | Düzeltme |
|---|---|---|
| **Kırma 1** | ✅ "kimlik kullanmaksızın yazılarak kapanır" | **YANLIŞ.** Kimliksizlik saat/kasa no'yu kapatmıyor. Unsur **12 (girdi yalınlığı)** gerekiyor |
| **Kırma 2** | ❌ "KAPANMIYOR, çözümü vekilin işi" | **KAPANIYOR.** Unsur **13 (eşzamanlılık)** ile. "Ya zamanlama ya sonuç" ikilemi yanlış kurulmuş — ikisi birlikte yazılabilir, çelişmiyorlar |

Ve tarama **yeni bir kaçış yolu** buldu:

**Kırma 5: Aday havuzunu daralt.** Rakip *"biz de kimliksiz, mercisiz,
bağlamlı, sınırlı çalışıyoruz — ama sadece ilk 10 inen aday"* der. Dört unsuru
karşılar, yöntemin ruhunu kullanır, istemden kaçar.

**Kapanır:** unsur **15 (kapsayıcılık)** isteme yazılır — *"bağlam içindeki her
bildirim eşit olasılıkla aday."*

---

### 16.6 SIRADAKİ — Katman 2 ve 3

Dip inceleme ikili aşaması bitti. Sırada:

1. **Katman 2 (üçlüler)** — 13 ayırt edici/türev unsurun 286 üçlüsü.
   Odak: Katman 1 adaylarının üstüne hangi tek unsur en çok kapı kapatıyor.
   Ön tahmin: 1+2+5 (aşikârlık + prior art birlikte) ve 1+12+13.
2. **Katman 3 (dörtlüler)** — tarama şimdiden **1+12+13+5**'i işaret ediyor.
   Doğrulanacak.
3. **Kapsayıcılık (15) nereye girecek** — Kırma 5'i kapattığı için Katman 2
   veya 3'te şart, ama hangi katmanda olduğu test edilmeli.
4. **Prior art taraması** — EN SON (kurucu kararı).

> **Kurucunun açığı kapatıldı mı:** Evet — 4 yeni unsur bulundu (12, 13, 14, 15),
> §5'te 2 hatalı işaret düzeltildi, 1 yeni kaçış yolu (Kırma 5) tespit edildi.
> En kritik bulgu: **§5 Kırma 2'nin "kapanmıyor" hükmü yanlıştı.**

---

## 17. §16 DÜZELTMESİ — kapsam mantığı tersine kurulmuştu

> 11 Ekim 2026, aynı oturum. Kurucunun *"nasıl kapanıyor ki"* sorusu §16'nın
> temel mantık hatasını ortaya çıkardı. Bu bölüm §16'nın ilgili hükümlerini
> **iptal eder.**

### 17.1 Hata — "unsur eklemek kapı kapatır" varsayımı

§16 boyunca şu varsayımla çalışıldı: *bir kaçış yolunu kapatmak için isteme
o yolu yasaklayan unsur eklenir.* **Bu yanlış.**

**Doğru kural — tüm unsurlar kuralının sonucu:**

```
Istemde ne kadar COK unsur varsa, o kadar AZ sey kapsar.
Unsur eklemek = DARALTMAK = daha az rakibi yakalamak.
```

İhlal için rakip istemdeki **bütün** unsurları karşılamak zorunda. Bir unsur
eklediğinde, o unsuru karşılamayan herkes **ihlalden çıkıyor** — yani serbest
kalıyor, yakalanmıyor.

### 17.2 Somut: eşzamanlılık (unsur 13) ne yapıyor

**Senaryo — "zarf yöntemi" (dosyadaki Kırma 2):** Rakip gece oturup 1000 otobüs
için sayı listesi hazırlıyor, zarfa koyuyor. Otobüs gelince zarfı açıp
"bu otobüsün sayıları 12 ve 41" diyor. Kimse sonucu bilmiyor; müşteri açısından
deneyim **birebir aynı.**

| İstem | Zarf yöntemi | Sonuç |
|---|---|---|
| "...önceden belirlenemez değer üreten" | Zarftaki sayıyı kimse bilmiyor → **karşılıyor** | **İHLAL — kapsamda** |
| "...bildirim anında üretilen, öncesinde mevcut olmayan değer..." | Zarfta önceden mevcuttu → **karşılamıyor** | **İhlal yok — SERBEST** |

> **Eşzamanlılık eklemek zarf yöntemini kapsamdan ÇIKARIYOR.**
> §16.2'de "Kırma 2'yi kapatan tek ikili" denmişti — **tam tersi doğru.**

### 17.3 Aynı hata girdi yalınlığında (unsur 12)

**Senaryo — Kırma 1:** Rakip *"kimlik kullanmıyoruz ama saat 14:32'yi de girdi
alıyoruz"* diyor.

| İstem | Rakip | Sonuç |
|---|---|---|
| "kimlik içermeyen bir girdiden" | Kimlik yok, saat var → **karşılıyor** | **İHLAL — kapsamda** |
| "tetikleyicinin varlığı dışında hiçbir veri etki etmeksizin" | Saat etki ediyor → **karşılamıyor** | **İhlal yok — SERBEST** |

> **Girdi yalınlığı da daraltıyor.** §16.0'da *"Kırma 1'in tek gerçek panzehiri"*
> ve *"§5 Kırma 1'in ✅ işareti düzeltilmelidir"* denmişti — **yanlış.**
> §5'in orijinal hükmü doğruydu: "kimlik kullanmaksızın" yazmak yeterli,
> çünkü saat ekleyen rakip hâlâ kimliksizdir ve kapsamda kalır.

### 17.4 İPTAL EDİLEN HÜKÜMLER

| § | İptal edilen hüküm | Doğrusu |
|---|---|---|
| 16.0 | Unsur 12 "Kırma 1'in panzehiri" | 12 daraltıyor; Kırma 1 kimliksizlikle zaten kapsamda |
| 16.0 | "§5 Kırma 1'in ✅ işareti düzeltilmeli" | **§5 doğruydu**, işaret kalsın |
| 16.2 | "2+13 Kırma 2'yi kapatan tek ikili — EN ÖNEMLİ BULGU" | 13 zarf yöntemini kapsamdan çıkarıyor |
| 16.2 | "§5 Kırma 2'nin ❌ işareti kaldırılmalı" | **§5 doğruydu**, ikilem gerçek |
| 16.2 | "ikilem yanlış kurulmuş, ikisi birlikte yazılabilir" | Birlikte yazılabilir ama **kapsam daralır** — ikilem tam da bu |
| 16.4 | "2+13 → 1. sıra, 9+12 → 2. sıra, 1+12 → 3. sıra" | Sıralama geçersiz (§17.6) |
| 16.4 | "Tam koruma minimum dörtlü: 1+12+13+5" | Yanlış — o dörtlü **en dar** istem, en az rakibi yakalar |
| 16.5 | "Kırma 5'i unsur 15 kapatır" | 15 de daraltıyor; aynı hata |

### 17.5 Kaçış yolları gerçekte nasıl kapanır

Üç yol var, birincisi en önemlisi:

**1. Unsuru ÇIKARMAK (kapsamı genişletmek).** Rakip bir unsuru karşılamıyorsa
kaçıyor. Çözüm o unsuru istemden çıkarmak veya **daha soyut** yazmak.

- "bildirim anında üretilir" (dar) → "önceden belirlenemez" (geniş, zarfı da kapsar)
- "kimlik içermeyen girdi" (dar) → *kimlik kelimesini hiç yazmamak* (daha geniş)

**2. Soyut ifade — türlerin üstünde kalmak.** Kurucunun kendi tespiti:
*"bunu bir şeye bağlarsan, başkası da başka bir şeye bağlar."* Kaynak adı,
sayı, tür adı, ortam adı yazılmaz. Bu **daraltmadan** kapsıyor, çünkü işlev
yazılıyor, tür değil.

**3. Ayrı bağımsız istem.** Bir unsurun hem varlığını hem yokluğunu tek istemde
koruyamazsın. Zarf yöntemini de yakalamak istiyorsan ayrı istem gerekir —
ama o istem "önceden üretilmiş değer tablosundan dağıtım" olur ki **prior art
dolu** ve senin buluşun değil.

> **ASIL İKİLEM (dosyanın §5'te doğru tespit ettiği):**
> Dar istem = alınır ama kolay kaçılır. Geniş istem = kaçılmaz ama reddedilir.
> Unsur eklemek bu takası **kaçılmazlık aleyhine** çeviriyor.

### 17.6 DÜZELTİLMİŞ Katman 1 sıralaması

Ölçüt değişti: "kaç kapı kapatıyor" değil → **"ne kadar geniş kapsıyor + ret
riski ne"**. Bir ikili ne kadar az/soyut unsur içerirse o kadar çok rakibi
yakalar; ama çok genişse ofis reddeder.

| Sıra | İkili | Kapsam | Ret riski | Değerlendirme |
|---|---|---|---|---|
| **1** | **1+2** kimliksizlik + mercisizlik | **En geniş** — zarf yöntemi de, saat ekleyen de kapsamda | Orta | **En iyi aday.** İki unsur da soyut ifade; tür/zaman/kaynak adı yok |
| **2** | **2+5** mercisizlik + sınır | Geniş | Orta-yüksek (kimliksizlik yok → prior art) | Aşikârlık savunmasının tek taşıyıcısı. Katman 2'de şart |
| **3** | **1+9** kimliksizlik + geri döndürülemezlik | Orta | Orta | Test edilebilir (ispat kolay). Saat ekleyen rakip de kapsamda kalıyor — §16'da "zaaf" denen şey aslında **kapsam genişliği** |
| 4 | 1+13 kimliksizlik + eşzamanlılık | Dar | Düşük | Zarf yöntemi dışarıda. Yedek istem olarak değerli |
| 5 | 1+12 kimliksizlik + girdi yalınlığı | **En dar** | Düşük | Saat ekleyen dışarıda. Son savunma hattı |

**Mercisizlik (2) yeniden merkeze döndü.** §16 onu "türüyor, yazmaya gerek yok"
diye kenara koymuştu — yanlış. 2 en soyut ve en geniş unsur: kaynağın *ne*
olduğunu, *ne zaman* belirlendiğini söylemiyor, sadece *belirleyen yok* diyor.
Zarf da, donanım da, yoldan geçen adam da kapsamda.

**1+2 neden en iyi:** iki unsur da **olumsuz-soyut**. Kimlik yok, belirleyen yok.
Rakip ne eklerse eklesin (saat, kasa no, önceden üretilmiş tablo) bu iki
olumsuzluğu karşılıyorsa kapsamda. Kurucunun en baştaki sezgisi doğruydu.

### 17.7 Yeni unsurların gerçek yeri

12, 13, 14, 15 çöp değil — ama **Katman 1'de değil**, istem hiyerarşisinin
altında:

| Unsur | Yeri | Gerekçe |
|---|---|---|
| 12 Girdi yalınlığı | **Bağımlı istem** | Daraltıyor; ana istem reddedilirse sığınak |
| 13 Eşzamanlılık | **Bağımlı istem** | Aynı; ayrıca mekanizmayı tarif ettiği için destekleyici |
| 14 Tekrarsızlık | **Tarifname** | İstemde ölçülemez |
| 15 Kapsayıcılık | **Bağımlı istem** | "Her bildirim eşit aday" daraltıyor ama Kırma 5'e karşı yedek |

**Bağımlı istemin işlevi budur:** ana istem reddedilirse daraltılmış hali
ayakta kalır. Yani 12 ve 13 reddi karşılayan **yedek**, kaçışı kapatan silah
değil.

### 17.8 Ayakta kalan §16 bulguları

Hepsi iptal değil. Şunlar geçerli:

- **4 yeni unsur tespiti (12, 13, 14, 15)** — var oldukları doğru, yerleri yanlış konmuştu
- **Kırma 5 (aday havuzunu daraltmak)** — gerçek bir kaçış yolu. Rakip *"sadece
  ilk 10 inen aday"* derse yöntemin ruhunu kullanıp kaçar. Çözüm unsur eklemek
  değil → bağlamın isteme **soyut** yazılması ("tanımlı bir bağlam", nasıl
  tanımlandığı yazılmaz) ki rakibin daralttığı havuz da "tanımlı bağlam" sayılsın
- **Zemin elemesi (10, 11)** — doğru, yazım tercihi, isteme girmez
- **4+5 ayrılamazlığı** — doğru, bağlam ve sınır birlikte anlam kazanıyor
- **Tekrar/tutarsızlık elemeleri (§16.3)** — büyük kısmı geçerli, çünkü o
  elemeler kapsam mantığına değil mantıksal tutarlılığa dayanıyordu

### 17.9 Ders — bu hata neden oldu

"Dolanmayı engellemek" hedefi (kurucunun ısrarla doğru olan talebi) yanlış
araca bağlandı: **unsur ekleyerek** dolanma engellenmeye çalışıldı. Oysa unsur
eklemek dolanma yolunu *açıyor* — her unsur rakibe bir "bunu karşılamıyorum"
kapısı veriyor.

Dosyanın §13'te zaten yazılı olan kural buydu:

> *"Her unsur bir kaçış kapısı — bu yüzden az unsur iyi, ama azaltınca da
> patent alınamıyor. İkilem bu."*

§16 bu cümleyi okudu ama tersini uyguladı. **Kurucunun "unsurları çoğalttın
sanki" ve "nasıl kapanıyor ki" uyarıları iki kez doğru çıktı.**

---

## 18. Katman 1 — KARAR + tarifname yazım kuralı

### 18.1 KATMAN 1 — iki bağımsız istem (ikili aşaması KAPANDI)

**İstem 1a — mercisizlik hattı**

> Bir bildirim üzerine, kimlik içermeyen bir girdiden, kimsenin
> belirleyemediği bir kaynaktan değer üreten yöntem.

**İstem 1b — başa sarma hattı**

> Bir bildirim üzerine, kimlik içermeyen bir girdiden, önceki bildirimlerden
> bağımsız olarak her bildirimde yeniden üretilen bir değer üreten yöntem.

İkisi aynı buluşun iki tarifi: 1a **kaynağı** (kimse belirlemiyor), 1b
**süreci** (her bildirimde başa sarıyor) tarif ediyor. Biri reddedilirse
diğeri ayakta kalır.

**1b neden ayrı değerli:** 1a'daki mercisizlik bir **olumsuzluk** — ofis
*"kimsenin belirleyemediğini nasıl kanıtlıyorsun"* diye sorar, mahkemede de
rakibin koduna bakmak gerekir. 1b **yapısal** bir ifade, bu itiraza kapalı.

Kurucunun adlandırması: **"başa sarma"** — her bildirim sanki ilk bildirim,
öncekinden hiçbir iz taşınmıyor. Kurucunun kendi testiyle örtüşüyor:
*"adam 5 dk sonra aynı kartı okuttu, sonuca etki ediyor mu? Hayır."*

### 18.2 Elenen ikililer — gerekçeleriyle

| İkili | Eleme gerekçesi |
|---|---|
| **1+9** kimliksizlik + geri döndürülemezlik | *"Aynı girdi aynı sonucu vermez"* bir **kesinlik iddiası**. Rastgelelik gereği bir gün aynı sonuç çıkar (47'den 2 → 1.081 ihtimal) ve **tek karşı örnek istemi yanlışlar** → "istem kendi buluşunu kapsamıyor" = iptal gerekçesi. Kurucunun tespiti: *"aynı sonucun çıkma ihtimali de var."* **Doğru ifadesi 1b'dir** (süreç tarifi, yanlışlanamaz) |
| **1+5** kimliksizlik + sınır | Belirsizlik hiç geçmiyor. "47 kişiden 2'sine ver" diyor ama nasıl seçildiğini söylemiyor — ilk inen 2 kişi de karşılar. Kampanya mantığı, US20130144700A1 ailesi |
| **2+5** mercisizlik + sınır | Kimliksizlik yok → prior art dolu alana (sadakat/CRM/hedefli kupon) açık. **Ama aşikârlık savunmasının tek taşıyıcısı** → Katman 2'de şart |
| **2+13** mercisizlik + eşzamanlılık | Daraltıcı — zarf yöntemini kapsamdan **çıkarıyor** (bkz. §17). Bağımlı isteme |
| **1+12** kimliksizlik + girdi yalınlığı | Daraltıcı — saat/kasa no ekleyen rakibi serbest bırakıyor. Bağımlı isteme |
| **9+12** | İkisi de daraltıcı + 9 yanlışlanabilir. Düştü |
| **2+15** mercisizlik + kapsayıcılık | "Eşit olasılık" ağırlıklı dağıtım yapan rakibi serbest bırakıyor + kimliksizlik yok |
| **4+5** bağlam + sınır | Belirsizlik yok. İkisi birbirinden ayrılamaz (bağlam tek başına "kaça?" sorusu doğurur) → Katman 2 bileşeni |

### 18.3 Düzeltilen eleme gerekçesi — "ölçülemezlik" duvarı yanlıştı

§16-17'de 9 (geri döndürülemezlik) ve 14 (tekrarsızlık) *"ölçülemez, isteme
girmez"* diye elenmişti. **Kurucunun itirazı haklı:** istemin ölçülebilir
olması gerekmiyor, **belirli** olması gerekiyor.

| Kavram | İsteme girer mi |
|---|---|
| Ölçülemez ama belirli ("kimsenin belirleyemediği kaynak") | **Girer** |
| Yanlışlanabilir kesinlik iddiası ("aynı sonucu vermez") | **Girmez** |
| Süreç tarifi ("her bildirimde yeniden üretilir") | **Girer** |

Yani 9'un problemi ölçülemezlik değil, **yanlış ifade edilmesiydi.** Doğru
ifadesi 1b olarak Katman 1'e girdi. Aynı düzeltme 14 için de geçerli.

### 18.4 TARİFNAME YAZIM KURALI — olumlu varyasyon

Kurucunun sorusu: *"çürüttüğümüz kombinasyonları tarifnameye 'bunun aksine'
diyerek yazsak, kapıyı başkasına kapatmış olmaz mıyız?"*

**Amaç doğru, ifade biçimi kritik.** Tarifnameye yazılan şey senin yayınına
dönüşür → prior art olur → başkası o kombinasyonu patentleyemez. Bu istenen
sonuç. Ama **olumsuz yorum eklenirse kendi kapsamını daraltırsın.**

| Yazım | Başkasını engeller | Senin kapsamına etkisi |
|---|---|---|
| "Yöntem 1+5 biçiminde de uygulanabilir" | ✓ | **Kapsamda kalır** |
| "Bunun aksine 1+5 zayıftır, bizim yöntemimiz değildir" | ✓ | **KAPSAMDAN ÇIKAR** |

İkinci satır patent hukukunda **"istemden feragat"** sayılır. Rakip davada
kullanır: *"başvuru sahibi 1+5'i kendi buluşundan hariç tutmuş, biz onunla
çalışıyoruz, ihlal etmiyoruz."*

**KURAL:**
- Tarifnameye **bütün kombinasyonlar** yazılır → 1+5, 2+5, 2+13, 1+12, 4+5,
  2+15, üçlüler, dörtlüler
- **Olumlu varyasyon** olarak: *"bir uygulamada... biçiminde de uygulanabilir"*
- **Zayıflık/çürütme yorumu ASLA yazılmaz** — ne "aksine", ne "zayıftır",
  ne "bizim yöntemimiz değildir"
- Çürütme gerekçeleri **bu dosyada** kalır (§18.2), vekil görüşmesinde
  kullanılır, başvuru metnine girmez

Aynı engelleme, sıfır risk.

### 18.5 Sırada

- **Katman 2 (üçlüler)** — ön aday: **1+2+5** (kimliksizlik + mercisizlik +
  sınır). Üç farklı işi üç unsur yapıyor: kimliksizlik prior art'tan ayırır,
  mercisizlik belirsizliği kurar, sınır aşikârlık itirazına cevap verir.
  Bağlam (4) bu üçlüde yok — "sınırlı sayıda" zaten bir küme ima ediyor,
  kümenin ne olduğu tarifnameye yazılır.
- **Katman 3 (dörtlüler)**
- **Prior art taraması** — EN SON

---

## 19. KATMAN 1 ve 2 — ikililer ve üçlüler (nihai)

> §18'i kısmen iptal eder: orada mercisizlik "çürüdü" sayılıp Katman 1'den
> çıkarılmıştı. **Yanlıştı** — kurucunun *"Türkçe azizliği"* uyarısı bir
> **ifade uyarısıydı**, kavram çürütmesi değil. Mercisizlik yerinde, yalnızca
> ifadesi düzeltildi.

### 19.1 Unsur envanterine ek

| # | Unsur | İfade | Not |
|---|---|---|---|
| **16** | **Yokluk** | "bildirimden önce mevcut olmayan" | **YENİ.** Mevcut 15 unsurun hiçbiri bu değil |

**16 neden ayrı unsur:**

| Unsur | Ne reddediyor |
|---|---|
| 2 Mercisizlik | **Etkiyi** — kimse sonucu yönlendiremiyor |
| 13 Eşzamanlılık | **Zamanı** — anında üretiliyor |
| **16 Yokluk** | **Varlığı** — üretilecek şey hiç yoktu |

Birbirlerini kapsamıyorlar. Zarf testi: sahibi zarfı rastgele doldurmuşsa
mercisizliği **karşılıyor** (yönlendirme yok) ama yokluğu **karşılamıyor**
(değer zarfta mevcuttu). Tersi de mümkün: anında üretiyor ama sahibi istediği
sonucu seçebiliyorsa yokluk karşılanır, mercisizlik karşılanmaz.

### 19.2 İfade düzeltmeleri — Türkçe azizlikleri

| Eski | Sorun | Yeni |
|---|---|---|
| "kimsenin belirleyemediği bir kaynaktan" | **İki anlamlı:** (a) kaynağı seçmek (b) çıktıyı öngörmek. Rakip *"kaynağı ben belirledim"* der | **"hiçbir tarafın etkisi olmaksızın"** — kaynak seçmek etki değil, sonucu yönlendirmek etki |
| "hiçbir tarafça önceden belirlenemeyen değer" | Muğlak — "hesaplanamayan" mı "atanmamış" mı belirsiz | **"bildirimden önce mevcut olmayan değer"** — varlık reddi, tartışmaya kapalı |
| "oran değeri" | Rakip tutar/puan üretip kaçar | **"değer"** |
| "aynı girdi için aynı sonucu vermeyen" | **Yanlışlanabilir** — bir tekrar istemi çürütür | **"önceki bildirimlerden bağımsız"** (durumsuzluk) |

**"Dışsallık" = mercisizlik.** Oturumda aynı kavrama ikinci bir ad verildi,
gereksiz. Tek ad: mercisizlik, ifadesi "hiçbir tarafın etkisi olmaksızın".

### 19.3 KATMAN 1 — iki bağımsız istem

**İstem 1a — mercisizlik hattı** (kimliksizlik + mercisizlik)

> Bir bildirim üzerine, kimlik içermeyen bir girdiden, hiçbir tarafın etkisi
> olmaksızın bir değer üreten yöntem.

**İstem 1b — yokluk hattı** (kimliksizlik + yokluk)

> Bir bildirim üzerine, kimlik içermeyen bir girdiden, bildirimden önce
> mevcut olmayan bir değer üreten yöntem.

İkisi birbirini kapsamıyor (§19.1 zarf testi). İkisi de en geniş halde:
iki unsur, ikisi de soyut, tür/zaman/kaynak/ortam adı yok.

**Neden bu ikisi en geniş:** kimliksizlik ve mercisizlik/yokluk **olumsuz ve
soyut** unsurlar. Diğer bütün unsurlar ya daraltıcı (sınır, bağlam, girdi
yalınlığı, eşzamanlınlık, kapsayıcılık), ya türev (öngörülemezlik,
hafızasızlık, hesapsızlık), ya ölçüm sorunlu (geri döndürülemezlik,
tekrarsızlık), ya tek başına prior art (bağlam, sınır).

### 19.4 KATMAN 2 — yedi bağımsız üçlü

Kimliksizlik (1), mercisizlik (2), yokluk (16) çekirdek; üçlüler bunların
ikisi + bir X:

| # | Üçlü | İstem metni | Neyi koruyor |
|---|---|---|---|
| **2a** | 1+2+16 | ...kimlik içermeyen bir girdiden, hiçbir tarafın etkisi olmaksızın, bildirimden önce mevcut olmayan bir değer üreten yöntem | **İki belirsizlik hattı birleşik** — en kapalı üçlü. Hem etki yok hem önceden yok |
| **2b** | 1+16+sınır | ...kimlik içermeyen bir girdiden, belirlenen miktarda, bildirimden önce mevcut olmayan bir değer üreten yöntem | **Aşikârlık savunması** — miktar belli, dağılım belirsiz. Bütçeli her uygulama |
| **2c** | 1+16+durumsuzluk | ...kimlik içermeyen bir girdiden, önceki bildirimlerden bağımsız olarak, bildirimden önce mevcut olmayan bir değer üreten yöntem | Geçmişe bakmayan her uygulama. Kurucunun testi: *"aynı kartı 5 dk sonra okuttu, etki yok"* |
| **2d** | 1+16+bağlam | ...kimlik içermeyen bir girdiden, tanımlı bir bağlam içinde, bildirimden önce mevcut olmayan bir değer üreten yöntem | Çerçeveye bağlı her uygulama: "bu otobüs", "cuma günü", "İstanbul'daki kadınlar" |
| **2e** | 1+2+sınır | ...kimlik içermeyen bir girdiden, hiçbir tarafın etkisi olmaksızın, belirlenen miktarda bir değer üreten yöntem | Aşikârlık savunması + mercisizlik. Yokluk yazılmadığı için **2b'den geniş** (zarf da kapsamda) |
| **2f** | 1+2+durumsuzluk | ...kimlik içermeyen bir girdiden, hiçbir tarafın etkisi olmaksızın, önceki bildirimlerden bağımsız bir değer üreten yöntem | Mercisizlik hattında durumsuzluk |
| **2g** | 1+2+bağlam | ...kimlik içermeyen bir girdiden, tanımlı bir bağlam içinde, hiçbir tarafın etkisi olmaksızın bir değer üreten yöntem | Mercisizlik hattında çerçeve |

**Kurucunun kararı:** sınır, durumsuzluk ve bağlam **üçü de yazılır** — üç
farklı itiraza üç hat (sınır aşikârlığa, durumsuzluk "zaten biliniyor"a,
bağlam çerçeve kavramına). Oturumda bunlar bir ara "zayıf/düştü" diye
işaretlenmişti; **o eleme geri alındı**, katmanlı yapının amacı en iyisini
seçmek değil **çok hat bırakmak.**

### 19.5 Üçlülerde elenen X'ler

| X | Eleme gerekçesi |
|---|---|
| **Kapsayıcılık** (15) | Daraltıcı — "eşit olasılık" yazılırsa ağırlıklı dağıtım yapan rakip serbest kalır |
| **Kayıtsızlık** (6) | Muhasebe/vergi kaydıyla çelişiyor (indirim tutarı faturada görünmek zorunda) + rakibin kayıt tutmadığı ispatlanamaz |
| **Girdi yalınlığı** (12) | Daraltıcı — saat/kasa no ekleyen rakip serbest kalır (§17) |
| **Eşzamanlılık** (13) | 16 (yokluk) ile büyük ölçüde örtüşüyor; yokluk daha güçlü ifade |
| **Çokluk** (yeni aday) | **ASKIDA** — "her bildirim için ayrı ayrı üretilen". Toplu hesap yapan rakibi serbest bırakıyor. Mekanizmanın tur başına mı bildirim başına mı ürettiği bilinmeden karar verilemez. Kurucuya sorulacak |
| Geri döndürülemezlik (9) | Yanlışlanabilir ifade; doğru hali durumsuzluk olarak girdi |
| Hafızasızlık (7), Hesapsızlık (8), Öngörülemezlik (3) | Türev — eşleştiği unsurla yapı kurmuyor |

### 19.6 Kimliksizlik içermeyen üçlüler — HEPSİ ELENDİ

Kurucunun sorusu: *"A ve B bağımlı çalıştık hep, özgün üçlü çıkar mı?"*

| Üçlü | Gerekçe |
|---|---|
| 2+16+sınır | Belirsizlik + yokluk + bütçe güçlü **ama** kimliksizlik yok → kimlikli sistemler de kapsamda → prior art'ın en dolu alanı (sadakat, CRM, hedefli kupon) |
| 2+16+bağlam | Aynı sorun + sınır yok |
| 2+sınır+bağlam | Yokluk yok (zarf kapsamda, geniş) ama aynı prior art sorunu |
| 16+sınır+bağlam | Mercisizlik yok → sahibi yönlendirebilir → piyangoya yakın |
| 2+16+durumsuzluk | Üç belirsizlik unsuru, en kapalı — ama kimliksizlik yok |
| sınır+bağlam+durumsuzluk | Belirsizlik hiç yok → sıradan kampanya |

**Sonuç: özgün üçlü çıkmıyor.** Dosyadaki tespit sebebi:
*"prior art'ın %90'ı kimlikli alanda."* Kimliksizlik o alandan çıkaran tek
unsur; onu taşımayan her istem oraya düşüyor.

> **Kimliksizlik her bağımsız istemde bulunmak zorunda.** Bu bir kısıt değil,
> buluşun çekirdeği olduğunun kanıtı.

### 19.7 Sayım ve format uyarısı

**Mevcut: 2 ikili + 7 üçlü = 9 bağımsız istem.**

> ⚠️ **Format kararı henüz verilmedi.** 9 bağımsız istem pratikte fazla:
> **buluş bütünlüğü (SMK m.91)** itirazı gelir, ofis böler, her parça ayrı
> ücret. Tipik başvuru 2-3 bağımsız istem taşır.
>
> Seçenekler: (a) en güçlülerini bağımsız yaz, gerisini **tarifnameye**
> (başkası alamaz, ileride bölünmüş başvuruyla alınır), (b) dokuzunu da yaz,
> bölme riskini kabul et, (c) vekile bırak.
>
> Kurucu: *"tamam formata karar veririz"* → sonraya bırakıldı.

### 19.8 Sırada

1. **Katman 3 (dörtlüler)** — ön aday: 1+16+bağlam+sınır (kurucunun özet
   cümlesi: *"bir otobüste, bir konserde veya bir şehirde 2 değer üretmek"*)
   ve 1+2+bağlam+sınır
2. **Çokluk sorusu** — değer her bildirimde ayrı mı, tur başına bir kere mi?
3. **Format kararı** — kaç bağımsız istem
4. **Prior art taraması** — EN SON

---

## 20. KATMAN 1 — NİHAİ METİN (evren + girdiye tanımsızlık)

> §19.3'ü günceller. İki iyileştirme: **evren ifadesi** eklendi,
> **yokluk → girdiye tanımsızlık** olarak değişti.

### 20.1 Nihai istem metinleri

**İSTEM 1a** — kimliksizlik + mercisizlik

> Tanımlanmış veya tanımlanmamış bir evrende, bir bildirim üzerine, kimlik
> içermeyen bir girdiden, hiçbir tarafın etkisi olmaksızın bir değer üreten
> yöntem.

**İSTEM 1b** — kimliksizlik + girdiye tanımsızlık

> Tanımlanmış veya tanımlanmamış bir evrende, bir bildirim üzerine, kimlik
> içermeyen bir girdiden, bu girdiye önceden tanımlanmamış bir değer üreten
> yöntem.

### 20.2 "Tanımlanmış veya tanımlanmamış bir evrende" — neden eklendi

**Hiçbir şeyi dışlamıyor**, dolayısıyla kapsamı **daraltmıyor**:

| Evren tipi | Örnek | Kapsamda |
|---|---|---|
| Tanımlanmış (kapalı küme) | Otobüs — 47 kişi belli | ✓ |
| Tanımlanmamış (açık akış) | Mağaza — kaç müşteri geleceği bilinmiyor | ✓ |

**Kazancı dolaylı ama gerçek:**
1. "Evren" kavramı istemde geçtiği için **tarifnamede tanımlanabiliyor**
   (istemde olmayan bir kavram tarifnamede tanımlanırsa "destek yok" sorunu olur)
2. Alt katmanlarda **"belirli bir evrende"** diye daraltmanın zemini kurulur
3. Ofis *"bu yöntem nerede çalışıyor"* diye sorarsa cevap istemde var

**"Belirli bir evrende" yazılmadı** — o gerçek bir daraltma olurdu, evreni
belirsiz olan sistemleri (sürekli akış) dışlardı. Katman 2+ için saklandı.

### 20.3 "Girdiye önceden tanımlanmamış" — neden bu ifade

Kurucunun ifade arayışının son hali. Geçirdiği aşamalar:

| Aşama | İfade | Sorun |
|---|---|---|
| 1 | "hiçbir tarafça önceden belirlenemez oran değeri" | "oran" daraltıyor (tutar/puan kaçar) |
| 2 | "kimsenin belirleyemediği bir kaynaktan" | **Türkçe azizliği:** "belirlemek" = kaynağı seçmek VEYA çıktıyı öngörmek. Rakip *"kaynağı ben belirledim"* der |
| 3 | "hiçbir tarafça önceden belirlenemeyen değer" | Muğlak — hesaplanamayan mı, atanmamış mı |
| 4 | "bildirimden önce mevcut olmayan değer" | Net ama **dar** — zarf yöntemini kapsamdan çıkarıyor |
| 5 | "önceden tanımlanmamış değer" | Geniş ama muğlak — neye göre tanımsız? |
| **6** | **"bu girdiye önceden tanımlanmamış değer"** | **Net + geniş.** Tanımsızlığın neye göre olduğu belli: girdiye atanmış bir değer yok |

**Zarf testi:** Rakip gece 1000 değer üretip zarfa koysa, sıraya göre dağıtsa —
o değerler **hiçbir girdiye atanmış değil**, sadece sırada bekliyor. Yani
1b'yi **karşılıyor → kapsamda.** "Mevcut olmayan" yazılsaydı dışarıda
kalacaktı. İfade 6 daha geniş.

**Ve bu ifade dosyanın §12'siyle birebir örtüşüyor:** *"oran işleme kalıcı
atanmaz."* Başından beri doğru kavram buydu; oturum onu yeniden buldu.

### 20.4 Katman 1 neden iki istemde kalıyor

Çekirdek üç unsur: kimliksizlik, mercisizlik, girdiye tanımsızlık.
Üçünün ikilileri:

| İkili | Durum |
|---|---|
| kimliksizlik + mercisizlik | ✅ **1a** |
| kimliksizlik + girdiye tanımsızlık | ✅ **1b** |
| mercisizlik + girdiye tanımsızlık | ❌ Kimliksizlik yok → prior art'ın %90'ının bulunduğu kimlikli alana düşer |

Üçüncü ikili çıkmıyor. **Kimliksizlik her bağımsız istemde zorunlu** (§19.6).

### 20.5 Askıdakiler — karara bağlandı

| Aday unsur | Karar | Gerekçe |
|---|---|---|
| **Çokluk** ("her bildirim için ayrı ayrı üretilen") | **DÜŞTÜ → tarifname** | Kurucunun 512 örneği mekanizmayı aydınlattı: evren büyüklüğü (47) bilindikten sonra üretim yapılıyor → **tur başına tek hesap.** "Her bildirim için ayrı" yazılsa kurucunun kendi sistemi istem dışında kalırdı |
| **Bağlam büyüklüğü** ("bildirim sayısı belirlendikten sonra") | **DÜŞTÜ → tarifname** | Ciddi daraltma: sürekli akan sistemler (mağaza) dışlanır. Ayrıca mekanizmanın bir adımını açığa vuruyor |

**Tarifname cümlesi:**
> *"Bir uygulamada evren içindeki bildirim sayısı önceden bilinir ve üretim
> bu aralıkta yapılır; başka bir uygulamada bildirim akışı süreklidir ve
> evren büyüklüğü önceden bilinmez."*

### 20.6 STRATEJİ — teyit edildi

**Tek amaç: alınabilecek en geniş istemi almak.**

Kurucunun sorusu üzerine netleşen nüans:

> **Genişlik ve dolanılamazlık aynı şeydir.** İstem genişse rakip dolanamaz —
> dolanmak istemin dışına çıkmaktır, geniş istemin dışı yoktur. Dolanma her
> zaman **spesifiklikten** doğar: sayı yazarsan 11 der, kaynak yazarsan
> başkasına bağlar, tür yazarsan farklı tür üretir.

Bu yüzden istemlerde **yok:** sayı, kaynak adı, tür adı, ortam adı, taraf
listesi, hamle dizisi.

**Katmanların işlevi:** koruma katmanı DEĞİL, **deneme kademesi.**

| Katman | Unsur | İşlev |
|---|---|---|
| 1 | 2 | En geniş deneme |
| 2 | 3 | 1 reddedilirse |
| 3 | 4 | 2 reddedilirse |

Sınırın tam nerede olduğu bilinmediği için hepsi yazılıyor; ofis hangisini
verirse en geniş alınabilir olan alınmış olur. **Sınırı prior art taraması
söyler** (en sona bırakıldı).

### 20.7 Sırada

1. **Katman 2 metinlerini güncelle** — yedi üçlü (§19.4) yeni ifadeyle
   yazılacak: "evren" + "girdiye önceden tanımlanmamış"
2. **Katman 3 (dörtlüler)** — ön aday: 1+girdiye tanımsızlık+belirli evren+sınır
3. **Format kararı** — kaç bağımsız istem (9+ fazla, bütünlük itirazı riski)
4. **Prior art taraması** — EN SON

---

## 21. TEMEL KATMAN — tek unsurlu istem

> §15.5'teki *"tek unsurlu katman yok"* hükmünü **iptal eder.** O hüküm eski
> ifadelerle verilmişti ("mercisizlik" / "öngörülemezlik"). **Girdiye
> tanımsızlık** ifadesi bulunduktan sonra tek unsurlu istem mümkün hale geldi.
> Kurucunun tespiti: *"bu iyi bir damar, tek için duvara çarpmayacağımız
> ihtimali var."*

### 21.1 TEMEL İSTEM

> **Tanımlanmış veya tanımlanmamış bir evrende, bir bildirim üzerine, bu
> girdiye önceden tanımlanmamış bir değer üreten yöntem.**

Tek ayırt edici unsur: **girdiye tanımsızlık.**

### 21.2 Neden bu unsur tek başına ayakta durabilir

Diğer iki çekirdek unsur tek başına prior art'a çarpıyor:

| Tek unsur | Çarptığı yer |
|---|---|
| Kimliksizlik | Her anonim indirim — US20010034651A1, US8055535 |
| Mercisizlik | Her çekiliş/kura yazılımı |
| **Girdiye tanımsızlık** | **Farklı — aşağıda** |

**Fark:** kimliksizlik ve mercisizlik *"ne olmadığını"* söylüyor. Girdiye
tanımsızlık **bir şeyi yasaklıyor:** değerin girdiye kalıcı atanmasını.

Bu yasak, prior art'ın en büyük kütlesini — **kurallı sistemlerin tamamını** —
dışarıda bırakıyor:

| Sistem | Atama var mı | Temel istemin dışında mı |
|---|---|---|
| "100 TL'ye %10 indirim" | Kural = atama | ✓ dışında |
| Sadakat kademeleri | Eşik = atama | ✓ dışında |
| Kuponda yazan oran | Basılı = atama | ✓ dışında |
| Hedefli kupon (CRM) | Profilden hesap = atama | ✓ dışında |
| Dinamik fiyatlama | Formül = atama (arz-talep girdiye atanır) | ✓ dışında |
| Kademeli iskonto | Tablo = atama | ✓ dışında |

Yani tek unsur, prior art tablosunun (§4) neredeyse tamamını kapsam dışına
atıyor — ve bunu **istemi daraltarak değil**, yasağın kendisi üzerinden
yapıyor.

### 21.3 Risk — nerede çarpabilir

**Saf rastgele indirim veren sistemler.** Dosyada US2014/0149200A1 var
("rastgele ödül: yüksek/orta/düşük") ama o **program süresince** çalışıyor,
bildirim bazında değil. Yani çarpışma kesin değil.

**İkinci risk:** ofis *"bu çok geniş, bir mekanizma tarif etmiyor"* diyebilir
(SMK m.82 — soyut yöntem). Tek unsurlu istemde bu itiraz en güçlü halde.

**Değerlendirme:** reddedilme olasılığı yüksek ama **sıfır değil.** Ve
yazmanın maliyeti tek bir istem. Strateji gereği (§20.6: *"alınabilecek en
geniş istemi almak"*) sınır denenmeden bilinemez.

### 21.4 Güncel katman mimarisi

| Katman | Unsur | İstem sayısı | İşlev |
|---|---|---|---|
| **TEMEL** | **1** | **1** | **En geniş deneme — girdiye tanımsızlık** |
| 1 | 2 | 2 | 1a mercisizlik hattı, 1b tanımsızlık hattı |
| 2 | 3 | 7 | Yedi üçlü (§19.4) |
| 3 | 4 | ? | Dörtlüler — sırada |
| Tarifname | — | — | Bütün kombinasyonlar, olumlu varyasyon olarak |

### 21.5 İncelenmesi bekleyen ikinci damar — "veya"lı birleşik istem

Patent dilinde bir istemde alternatif unsur yazılabilir:

> *...hiçbir tarafın etkisi olmaksızın **veya** bu girdiye önceden
> tanımlanmamış bir değer üreten yöntem.*

İkisinden **birini** karşılayan rakip kapsamda → 1a ve 1b'nin toplamından
geniş. Tek istemde iki hat.

**Henüz değerlendirilmedi.** Risk: ofis *"iki ayrı buluş"* diyerek bölme
isteyebilir (SMK m.91). Sırada.

---

## 22. NİHAİ İSTEM METİNLERİ — ifade kilitlendi

> §20 ve §21'in metinlerini günceller. Ortak ifadeler tüm katmanlarda
> standartlaştırıldı.

### 22.1 Kilitlenen ortak ifadeler

| Kavram | NİHAİ İFADE | Elenen denemeler ve gerekçeleri |
|---|---|---|
| Tetikleyici | **"girdi veya bildirim tetiklemesi ile"** | "bir işlem bildirimi" (dar: ticari olmayanı dışlar) → "bir olay bildirimi" → "bir bildirim üzerine" ("bildirim" ile "girdi" iki ayrı kavram gibi duruyordu) |
| Evren | **"tanımlanmış veya tanımlanmamış bir evrende"** | "bağlam" (durum/koşul çağrışımı; evren = sayılabilir küme). "Belirli bir evrende" **daraltır** → Katman 2'ye saklandı |
| Belirsizlik | **"girdinin özellikleriyle ilişkisiz"** | Aşağıda, §22.2 |
| Mercisizlik | **"hiçbir tarafın etkisi olmaksızın"** | "kimsenin belirleyemediği" (Türkçe azizliği: belirlemek = kaynağı seçmek VEYA çıktıyı öngörmek) |
| Değer | **"bir değer"** | "oran" (rakip tutar/puan üretip kaçar), "ödül" (prior art'ın göbeği) |
| Koruma tipi | **"yöntem"** | "sistem" (cihaz/yazılım kokar, ortama bağlanır) |

### 22.2 "Girdinin özellikleriyle ilişkisiz" — ifade evrimi

Oturumun en uzun aradığı ifade. Yedi aşama:

| # | Deneme | Neden düştü |
|---|---|---|
| 1 | "hiçbir tarafça önceden belirlenemez" | Muğlak — hesaplanamayan mı, atanmamış mı? |
| 2 | "kimsenin belirleyemediği bir kaynaktan" | Rakip: *"kaynağı ben belirledim"* |
| 3 | "bildirimden önce mevcut olmayan" | Net ama **dar** — zarf yöntemini kapsamdan çıkarır |
| 4 | "önceden tanımlanmamış" | Muğlak — neye göre tanımsız? |
| 5 | "bu girdiye önceden atanmamış" | **Kurucunun itirazı:** *"sanki atanmalıydı da atanmayanı biz atıyoruz gibi"* — değerin zaten var olduğunu ima ediyor |
| 6 | "girdi ile ilişkisiz ve tamamen bağımsız" | Tekrar + "tamamen bağımsız" neyden bağımsız belirsiz |
| 7 | "girdi tetiklemesinden bağımsız" | **Mantık çelişkisi:** tetikleme ile ama tetiklemeden bağımsız? |
| **8** | **"girdinin özellikleriyle ilişkisiz"** | **KİLİTLENDİ** |

**Neden 8 doğru:**
- **Çelişki yok:** tetikleme *zamanı* veriyor, özellikler *değere* karışmıyor
- **Geniş:** "özellik" = kimlik, tutar, zaman, konum, sıra, sepet içeriği — hepsi
- **Atama imasını kaldırıyor:** bekleyen bir değer yok
- **Kimliksizliği içine alıyor:** kimlik girdinin bir özelliğidir → tek unsurla
  iki unsurun işi

Kurucunun otobüs tarifiyle birebir: *"sistem onu 'o geçen' olarak görüyor,
artık o her kimse."*

### 22.3 TEMEL KATMAN (1 unsur)

> **Tanımlanmış veya tanımlanmamış bir evrende, girdi veya bildirim
> tetiklemesi ile, girdinin özellikleriyle ilişkisiz bir değer üreten yöntem.**

Tek ayırt edici unsur: **girdiden ilişkisizlik.** Prior art'ın en büyük
kütlesini — kurallı sistemlerin tamamını — dışarıda bırakıyor (§21.2 tablosu).

### 22.4 KATMAN 1 (2 unsur)

**İSTEM 1a** — kimliksizlik + mercisizlik

> Tanımlanmış veya tanımlanmamış bir evrende, girdi veya bildirim tetiklemesi
> ile, kimlik içermeyen bir girdiden, hiçbir tarafın etkisi olmaksızın bir
> değer üreten yöntem.

**İSTEM 1b** — kimliksizlik + girdiden ilişkisizlik

> Tanımlanmış veya tanımlanmamış bir evrende, girdi veya bildirim tetiklemesi
> ile, kimlik içermeyen bir girdiden, girdinin özellikleriyle ilişkisiz bir
> değer üreten yöntem.

> **NOT:** 1b'de kimliksizlik teknik olarak **fazlalık** — "özellikleriyle
> ilişkisiz" kimliği de kapsıyor. Ama ayrıca yazılması zararsız (daraltmıyor,
> aynı şeyi vurguluyor) ve ofise kimliksizliği açıkça gösteriyor. Vekil
> sadeleştirmek isteyebilir.

### 22.5 KATMAN 2 (3 unsur, yedi bağımsız istem)

Ortak gövde: *"Tanımlanmış veya tanımlanmamış bir evrende, girdi veya bildirim
tetiklemesi ile, kimlik içermeyen bir girdiden, ..."*

| # | Üçüncü unsur | Gövdeye eklenen |
|---|---|---|
| **2a** | mercisizlik + ilişkisizlik | *...hiçbir tarafın etkisi olmaksızın, girdinin özellikleriyle ilişkisiz bir değer üreten yöntem* |
| **2b** | ilişkisizlik + **sınır** | *...belirlenen miktarda, girdinin özellikleriyle ilişkisiz bir değer üreten yöntem* |
| **2c** | ilişkisizlik + **durumsuzluk** | *...önceki bildirimlerden bağımsız olarak, girdinin özellikleriyle ilişkisiz bir değer üreten yöntem* |
| **2d** | ilişkisizlik + **belirli evren** | *...belirli bir evren içinde, girdinin özellikleriyle ilişkisiz bir değer üreten yöntem* |
| **2e** | mercisizlik + **sınır** | *...hiçbir tarafın etkisi olmaksızın, belirlenen miktarda bir değer üreten yöntem* |
| **2f** | mercisizlik + **durumsuzluk** | *...hiçbir tarafın etkisi olmaksızın, önceki bildirimlerden bağımsız bir değer üreten yöntem* |
| **2g** | mercisizlik + **belirli evren** | *...belirli bir evren içinde, hiçbir tarafın etkisi olmaksızın bir değer üreten yöntem* |

**2d ve 2g'de "belirli bir evren"** — Temel/Katman 1'deki "tanımlanmış veya
tanımlanmamış" ifadesinin yerini alıyor, yani gerçek bir daraltma.

### 22.6 Toplam yapı

| Katman | Unsur | İstem | Durum |
|---|---|---|---|
| **TEMEL** | 1 | 1 | ✅ Kilitlendi |
| **1** | 2 | 2 | ✅ Kilitlendi |
| **2** | 3 | 7 | ✅ Kilitlendi |
| **3** | 4 | ? | ⏳ Yapılmadı |
| Tarifname | — | — | ⏳ Yazılmadı |

**Toplam 10 bağımsız istem.**

### 22.7 Açık kalan kararlar

1. **Katman 3 (dörtlüler)** — yapılmadı
2. **"Veya"lı birleşik istem damarı** (§21.5) — 1a ve 1b'yi tek istemde
   alternatif olarak yazmak. İkisinden birini karşılayan kapsamda →
   toplamından geniş. Risk: ofis "iki buluş" diyip bölebilir (SMK m.91)
3. **FORMAT KARARI** — 10 bağımsız istem pratikte fazla; buluş bütünlüğü
   itirazı riski. Seçenekler: en güçlülerini bağımsız yaz + gerisini
   tarifnameye / hepsini yaz + bölme riskini kabul et / vekile bırak
4. **Prior art taraması** — EN SON (kurucu kararı)

---

## 23. SON IFADE DUZELTMESI — "bagimsiz"

> §22'yi gunceller. Son kilit: **"iliskisiz" -> "bagimsiz"**.

| Deneme | Sorun |
|---|---|
| "girdinin ozellikleriyle **iliskisiz**" | Bir **durum** tarif ediyor (iki sey arasinda bag yok). Rakibe kapi: *"bizde dolayli bir iliski var ama dogrudan degil"* |
| **"girdinin ozelliklerinden bagimsiz bir sekilde"** | Bir **yon** tarif ediyor: deger girdiye tabi degil, ondan etkilenmiyor. Dolayli iliski de kapaniyor |

Kurucunun ifadesi: *"girdinin ozelliklerinden bagimsiz bir sekilde."*

### TEMEL KATMAN (nihai)

> **Tanimlanmis veya tanimlanmamis bir evrende, girdi veya bildirim
> tetiklemesi ile, girdinin ozelliklerinden bagimsiz bir sekilde bir deger
> ureten yontem.**

### KATMAN 1 (nihai)

**1a** - kimliksizlik + mercisizlik
> Tanimlanmis veya tanimlanmamis bir evrende, girdi veya bildirim tetiklemesi
> ile, kimlik icermeyen bir girdiden, hicbir tarafin etkisi olmaksizin bir
> deger ureten yontem.

**1b** - kimliksizlik + girdiden bagimsizlik
> Tanimlanmis veya tanimlanmamis bir evrende, girdi veya bildirim tetiklemesi
> ile, kimlik icermeyen bir girdiden, girdinin ozelliklerinden bagimsiz bir
> sekilde bir deger ureten yontem.

### KATMAN 2 (nihai) - yedi bagimsiz istem

Ortak govde: *"Tanimlanmis veya tanimlanmamis bir evrende, girdi veya bildirim
tetiklemesi ile, kimlik icermeyen bir girdiden, ..."*

| # | Govdeye eklenen |
|---|---|
| **2a** | *...hicbir tarafin etkisi olmaksizin, girdinin ozelliklerinden bagimsiz bir sekilde bir deger ureten yontem* |
| **2b** | *...belirlenen miktarda, girdinin ozelliklerinden bagimsiz bir sekilde bir deger ureten yontem* |
| **2c** | *...onceki bildirimlerden bagimsiz olarak, girdinin ozelliklerinden bagimsiz bir sekilde bir deger ureten yontem* |
| **2d** | *...belirli bir evren icinde, girdinin ozelliklerinden bagimsiz bir sekilde bir deger ureten yontem* |
| **2e** | *...hicbir tarafin etkisi olmaksizin, belirlenen miktarda bir deger ureten yontem* |
| **2f** | *...hicbir tarafin etkisi olmaksizin, onceki bildirimlerden bagimsiz bir deger ureten yontem* |
| **2g** | *...belirli bir evren icinde, hicbir tarafin etkisi olmaksizin bir deger ureten yontem* |

> **IFADE KILITLENDI.** Bundan sonra ifade tartismasi yeniden acilmaz;
> §22.1 ve §22.2'deki eleme gerekceleri gecerli.

---

## 24. SABIT TERIM SOZLUGU + ONAYLANAN ISTEMLER

> Oturumda kavram adlari surekli degistigi icin ikimiz de kaybolduk.
> **Bundan sonra YALNIZCA bu adlar kullanilacak, yeni ad uydurulmayacak.**

### 24.1 Sabit terim sozlugu

| AD | ISTEM IFADESI |
|---|---|
| **BAGIMSIZLIK** | girdinin ozelliklerinden bagimsiz bir sekilde |
| **MERCISIZLIK** | hicbir tarafin etkisi olmaksizin |
| **SINIR** | belirlenen miktarda |
| **DURUMSUZLUK** | onceki bildirimlerden bagimsiz olarak |
| **EVREN** | belirli bir evren icinde |
| **KIMLIKSIZLIK** | kimlik icermeyen bir girdiden |

Ortak govde: *"Tanimlanmis veya tanimlanmamis bir evrende; girdi veya bildirim
tetiklemesi ile, ..."*

**Yazim kalibi:** evren ifadesinden sonra **noktali virgul** (cerceve ile
yontem ayrilir), unsurlar arasinda **"ve"** (virgul degil - virgul ikinci
ifadeyi birinciyi niteliyormus gibi okutur; "ve" ikisini ayri unsur olarak
isaretler, her unsur ayri sayilacagi icin bu kritik).

### 24.2 TEMEL KATMAN - ONAYLANDI

> **Tanimlanmis veya tanimlanmamis bir evrende; girdi veya bildirim
> tetiklemesi ile, girdinin ozelliklerinden bagimsiz bir sekilde bir deger
> ureten yontem.**

Tek unsur: BAGIMSIZLIK.

**Tekli katman son taramasi - baska aday yok:**

| Tek unsur | Sonuc |
|---|---|
| **BAGIMSIZLIK** | **TEMEL KATMAN** |
| KIMLIKSIZLIK | Her anonim indirim - US20010034651A1, US8055535 |
| MERCISIZLIK | Her cekilis/kura yazilimi |
| SINIR | Kontenjanli kupon - US20130144700A1 |
| EVREN | Her kampanya |
| DURUMSUZLUK | "Stateless yazilim" - 50 yillik standart, kesin ret |
| Kayitsizlik | Olumsuz ozellik, bulus degil |

**Yapisal gerekce:** diger unsurlarin hepsi ya bir **yoklugu** soyluyor
(kimlik yok, merci yok, kayit yok) - bu yokluklar yaygin, ayirt edici degil;
ya bir **kisit** koyuyor (sinir, evren) - kisitlar prior art'ta dolu.
BAGIMSIZLIK farkli: bir **tabiyeti** reddediyor. Deger ureten her sistem
girdiden turetir; o reddin kendisi ayirt edici.

### 24.3 KATMAN 1 - ISTEM 1a ONAYLANDI

> **ISTEM 1a (BAGIMSIZLIK + MERCISIZLIK)**
>
> Tanimlanmis veya tanimlanmamis bir evrende; girdi veya bildirim tetiklemesi
> ile, hicbir tarafin etkisi olmaksizin ve girdinin ozelliklerinden bagimsiz
> bir sekilde bir deger ureten yontem.

| Unsur | Neyi kapatiyor |
|---|---|
| hicbir tarafin etkisi olmaksizin | Sistem sahibi, isletme, gorevli - kimse sonucu yonlendiremiyor |
| girdinin ozelliklerinden bagimsiz | Kimlik, tutar, zaman, sira, konum - hicbiri degere karismiyor |

**Otobus:** Kim indigi etkisiz, sahibi de yonlendiremiyor. Iki farkli yon -
biri asagidan (girdi), biri yukaridan (sahip).

**Gucu:** Rakip *"girdiye bakmiyoruz ama sahibi ayarliyor"* derse kacar,
*"sahibi karismiyor ama tutara gore hesapliyoruz"* derse kacar. Ikisini
birden saglamali.

**Zaafi:** MERCISIZLIK bir olumsuzluk - ofis *"nasil kanitliyorsun"* diye
sorabilir. BAGIMSIZLIK ise test edilebilir: girdiyi degistir, sonuc degismiyor.

### 24.4 Katman 1 - kalan adaylar (HENUZ ONAYLANMADI)

| # | Ikili | Durum |
|---|---|---|
| **1a** | BAGIMSIZLIK + MERCISIZLIK | **ONAYLANDI** |
| 1b | BAGIMSIZLIK + SINIR | Siradaki - asikarlik savunmasi |
| 1c | BAGIMSIZLIK + DURUMSUZLUK | Bekliyor |
| 1d | BAGIMSIZLIK + EVREN | Zayif - sinir yok, "kaca?" acik |
| 1e | BAGIMSIZLIK + KIMLIKSIZLIK | **Fazlalik** - kimlik girdinin bir ozelligi, temel istem zaten kapsiyor |

### 24.5 "ve/veya" damari - degerlendirildi

Tek istemde coklu alternatif yazmak isteme genislik katar: `A ve/veya B`
yazilirsa **birini** karsilayan rakip kapsamda olur.

| Kullanim | Durum |
|---|---|
| `A ve/veya B` (iki unsur) | **Kabul edilir** |
| `A ve/veya B ve/veya C ve/veya D` | **Itiraz gelir** - belirsizlik (SMK aciklik sarti) + bulus butunlugu (m.91) |

**En mantikli kullanim yeri:** MERCISIZLIK ve BAGIMSIZLIK arasi - ikisi
akraba kavramlar, ofis "iki bulus" demez. O haliyle tek istem hem 1a'yi hem
temel istemi kapsar. **Karar verilmedi.**

### 24.6 Onceki katman yapisi NEDEN DEGISTI

§19-23'teki yapi **KIMLIKSIZLIK merkezliydi** (her bagimsiz istemde zorunlu
sayilmisti, §19.6). BAGIMSIZLIK ifadesi bulunduktan sonra bu gecersiz:

> **BAGIMSIZLIK, KIMLIKSIZLIGI zaten kapsiyor** - kimlik girdinin bir
> ozelligidir. Yani kimliksizligi ayrica yazmak **fazlalik**.

Bu yuzden Katman 1 artik `KIMLIKSIZLIK + X` degil, `BAGIMSIZLIK + X`.
§22.5'teki yedi uclu de bu mantikla yeniden kurulacak.

### 24.7 ISTEM 1b ONAYLANDI

> **ISTEM 1b (BAGIMSIZLIK + SINIR)**
>
> Tanimlanmis veya tanimlanmamis bir evrende; girdi veya bildirim tetiklemesi
> ile, belirlenen miktarda ve girdinin ozelliklerinden bagimsiz bir sekilde
> bir deger ureten yontem.

| Unsur | Neyi kapatiyor |
|---|---|
| belirlenen miktarda | Sinirsiz dagitim - kac deger uretilecegi belli |
| girdinin ozelliklerinden bagimsiz | Kimlik, tutar, zaman, sira - hicbiri degere karismiyor |

**Otobus:** 47 inen, 2 deger. Kac tane belli, kime gidecegi girdiye bakmiyor.

**Gucu:** **Asikarlik itirazina cevap veren tek ikili.** Ofis *"rastgele deger
vermek biliniyor"* derse savunma burada:

| | Miktar | Dagilim |
|---|---|---|
| Piyango | Uretici bilir | **Uretici bilir** |
| Saf rastgele | Kontrolsuz | Kimse bilmez |
| **BU BULUS** | **Belirli** | **Girdiden bagimsiz** |

Bu kombinasyon §15.2'deki dokuz yontem tablosunda yok.

**Zaafi:** Miktar belirlemeyen rakip serbest kaliyor. Pratikte butcesiz
sistem olmaz, kayip kucuk.

### 24.8 ISTEM 1c ONAYLANDI

> **ISTEM 1c (BAGIMSIZLIK + DURUMSUZLUK)**
>
> Tanimlanmis veya tanimlanmamis bir evrende; girdi veya bildirim tetiklemesi
> ile, onceki girdi/bildirimlerden ve girdinin ozelliklerinden bagimsiz bir
> sekilde bir deger ureten yontem.

| Unsur | Neyi kapatiyor |
|---|---|
| onceki girdi/bildirimlerden bagimsiz | Sayac, zincir, gecmis - hicbiri tasinmiyor |
| girdinin ozelliklerinden bagimsiz | Kimlik, tutar, zaman, sira - degere karismiyor |

**Iki eksen birden:** dikey (gecmis) ve yatay (girdinin kendisi).

**Otobus:** Ayni kisi 40 kez inse 40 ayri bildirim; sistem bag kurmuyor.
Kurucunun testi: *"adam 5 dk sonra ayni karti okuttu, etki ediyor mu? Hayir."*
Bu 1a ve 1b'de yazili DEGIL - sayac ilerleyen bir sistem ikisini de karsilar
ama durumsuz degildir.

**Iki ifade duzeltmesi (kurucu):**
- "onceki bildirimlerden" -> **"onceki girdi/bildirimlerden"** - tetikleyici
  "girdi veya bildirim" iken sonra yalnizca "bildirim" demek tutarsizlik
  yaratiyordu; rakip *"bizde bildirim degil girdi var"* diye oynayabilirdi
- Iki kez "bagimsiz" yerine **tek fiile baglama** - daha temiz, anlam ayni

**Zaafi:** Sayac/gecmis kullanan rakip serbest. Ayrica "durumsuzluk" yazilim
mimarisinde yaygin kavram (stateless) - ofis asikar sayabilir.

### 24.9 KATMAN 1 KAPANDI - uc onayli istem

| # | Ikili | Tasidigi savunma |
|---|---|---|
| **1a** | BAGIMSIZLIK + MERCISIZLIK | En kapali - girdi (asagi) + sahip (yukari) iki yon |
| **1b** | BAGIMSIZLIK + SINIR | **Asikarlik itirazina tek cevap** |
| **1c** | BAGIMSIZLIK + DURUMSUZLUK | Iki eksen - gecmis (dikey) + girdi (yatay) |

**Yazilmayanlar:**
- **1d** BAGIMSIZLIK + EVREN -> zayif (sinir yok, "kaca?" sorusu acik) -> tarifname
- **1e** BAGIMSIZLIK + KIMLIKSIZLIK -> fazlalik (kimlik girdinin bir ozelligi) -> tarifname

**Toplam onayli: 1 temel + 3 ikili = 4 bagimsiz istem.**

### 24.10 Sirada

1. **Katman 2 (ucluler)** - BAGIMSIZLIK + iki unsur. §22.5'teki yedi uclu
   KIMLIKSIZLIK merkezliydi, yeniden kurulacak. Olasi: BAGIMSIZLIK+MERCISIZLIK+SINIR,
   BAGIMSIZLIK+SINIR+DURUMSUZLUK, BAGIMSIZLIK+MERCISIZLIK+DURUMSUZLUK,
   BAGIMSIZLIK+SINIR+EVREN...
2. **Katman 3 (dortluler)**
3. **"ve/veya" karari** (§24.5)
4. **Format karari** - kac bagimsiz istem (butunluk itirazi riski)
5. **Prior art taramasi** - EN SON

### 24.11 ISTEM 1d ONAYLANDI - KIMLIKSIZLIK geri alindi

> **ISTEM 1d (BAGIMSIZLIK + KIMLIKSIZLIK)**
>
> Tanimlanmis veya tanimlanmamis bir evrende; girdi veya bildirim tetiklemesi
> ile, kimlik icermeyen bir girdiden ve girdinin ozelliklerinden bagimsiz bir
> sekilde bir deger ureten yontem.

**§24.4'te 1e "fazlalik" diye elenmisti - O GEREKCE YANLIS.** Kurucunun
sorusu (*"kimliksizligi kendi kendine yok mu ettin"*) duzeltmeyi getirdi.

**KIMLIKSIZLIK ile BAGIMSIZLIK ayni sey degil:**

| | Iddia | Reddettigi |
|---|---|---|
| **KIMLIKSIZLIK** | Kimlik **sisteme girmiyor** | Veri toplamayi |
| **BAGIMSIZLIK** | Kimlik girebilir ama **degere etki etmiyor** | Veri kullanmayi |

**Passolig testi:** Stadyuma Passolig ile giren biri. Sistem kart numarasini
**goruyor** (kimliksizlik YOK) ama deger uretirken ona **bakmiyor**
(bagimsizlik VAR). Iki ayri uygulama, iki ayri istem gerekiyor.

**Kurucunun mekanizmasi ikisini de iceriyor** - ama patent dili her unsuru
ayri yazmayi zorunlu kiliyor (her unsur bir kacis kapisi oldugu icin en genis
hal en az unsurla kurulur).

| Unsur | Ne sagliyor |
|---|---|
| kimlik icermeyen bir girdiden | Kimlik sisteme hic girmiyor |
| girdinin ozelliklerinden bagimsiz | Giren hicbir ozellik degere etki etmiyor |

**Gucu:** Prior art'taki *"anonim ama anonim kimlik tutuyor"* patentlerinden
(US8055535) net ayrilma. Onlar kimlik tutuyor; burada hic yok.

**Zaafi:** Kimlik alan ama kullanmayan rakip serbest (Passolig ornegi) -
bu yuzden temel katman daha genis kaliyor.

### 24.12 KATMAN 1 NIHAI - dort ikili

| # | Ikili | Tasidigi savunma |
|---|---|---|
| **1a** | BAGIMSIZLIK + MERCISIZLIK | Iki yon: girdi (asagi) + sahip (yukari) |
| **1b** | BAGIMSIZLIK + SINIR | **Asikarlik itirazina tek cevap** |
| **1c** | BAGIMSIZLIK + DURUMSUZLUK | Iki eksen: gecmis (dikey) + girdi (yatay) |
| **1d** | BAGIMSIZLIK + KIMLIKSIZLIK | Veri toplamayi + kullanmayi birlikte reddeder |

**Yazilmayan:** BAGIMSIZLIK + EVREN -> zayif (sinir yok, "kaca?" sorusu acik)
-> tarifname.

> **TOPLAM ONAYLI: 1 temel + 4 ikili = 5 bagimsiz istem. IKILILER KAPANDI.**

---

## 25. KATMAN 2 - ucluler

### 25.1 SINIR unsurunun ifadesi kilitlendi

| Deneme | Unsur mu | Asikarlik savunmasi | Karar |
|---|---|---|---|
| "belirlenen miktarda" | Evet ama dar (kesin rakam ima eder) | ✓ | Elendi |
| "sinirli sayida" | Evet | ✓ | "sayi" adet ima ediyor, dar |
| **"sinirlanan miktarda"** | **Evet** | **✓** | **KILITLENDI** |
| "sinirlandirilabilen miktarda" | **HAYIR** | ✗ | Elendi |
| "sinirlanmaya uygun miktarda" | **HAYIR** | ✗ | Elendi |
| "belirlenen veya belirlenmeyen miktarda" | **HAYIR** | ✗ | Elendi |

**Kural:** Patent isteminde unsur **fiilen var olan** bir seyi tarif etmeli,
**imkani** degil. "-abilen", "-maya uygun", "veya olmayan" ekleri unsuru
oldururur - hicbir seyi dislamazlar, ofis unsur saymaz.

**Neden "sinirlanan miktarda" en iyisi:**
- "miktar" > "sayi": adet (2 kisi), buyukluk (1000 TL), oran (%0.1) hepsi kapsamda
- "sinirlanan" > "belirlenen": kesin rakam sart degil, **ust sinir** yeterli
  ("en fazla su kadar" da kapsamda)

**Sinir koymayan uygulamalar kaybedilmiyor** - TEMEL KATMAN'da sinir hic
gecmiyor, orada sinirli+sinirsiz hepsi kapsamda. Katman 2'nin isi genis olmak
degil **savunulabilir** olmak; sinir net yazilmazsa o katmanin varlik sebebi
kalmiyor.

> **§24.7'deki 1b metni guncellendi:** "belirlenen miktarda" ->
> **"sinirlanan miktarda"**.

### 25.2 Katman 2 mantigi

Her katman bir oncekinin ustune bir unsur koyar: daha dar, daha savunulabilir.

```
TEMEL   : BAGIMSIZLIK                        (1 unsur)
KATMAN 1: BAGIMSIZLIK + X                    (2 unsur) - 4 istem
KATMAN 2: BAGIMSIZLIK + X + Y                (3 unsur) - 7 aday
KATMAN 3: BAGIMSIZLIK + X + Y + Z            (4 unsur)
```

Her uclu, Katman 1'deki **iki ikilinin birlesimi** - yani iki savunmayi
birden tasiyor.

### 25.3 Katman 2 adaylari

| # | Uclu | Birlestirdigi |
|---|---|---|
| **2a** | BAGIMSIZLIK + MERCISIZLIK + SINIR | 1a + 1b |
| 2b | BAGIMSIZLIK + MERCISIZLIK + DURUMSUZLUK | 1a + 1c |
| 2c | BAGIMSIZLIK + MERCISIZLIK + KIMLIKSIZLIK | 1a + 1d |
| 2d | BAGIMSIZLIK + SINIR + DURUMSUZLUK | 1b + 1c |
| 2e | BAGIMSIZLIK + SINIR + KIMLIKSIZLIK | 1b + 1d |
| 2f | BAGIMSIZLIK + DURUMSUZLUK + KIMLIKSIZLIK | 1c + 1d |
| 2g | BAGIMSIZLIK + SINIR + EVREN | evren hatti |

### 25.4 ISTEM 2a ONAYLANDI

> **ISTEM 2a (BAGIMSIZLIK + MERCISIZLIK + SINIR)**
>
> Tanimlanmis veya tanimlanmamis bir evrende; girdi veya bildirim tetiklemesi
> ile, hicbir tarafin etkisi olmaksizin, sinirlanan miktarda ve girdinin
> ozelliklerinden bagimsiz bir sekilde bir deger ureten yontem.

| Unsur | Neyi kapatiyor |
|---|---|
| hicbir tarafin etkisi olmaksizin | Sahip, isletme, gorevli yonlendiremiyor |
| sinirlanan miktarda | Kac deger uretilecegi sinirli |
| girdinin ozelliklerinden bagimsiz | Kimlik, tutar, zaman, sira etkisiz |

**Otobus:** 47 inen, 2 deger. Miktar sinirli; kime gidecegini ne girdi
belirliyor ne sahip.

**Gucu:** 1a ve 1b'nin savunmalarini birden tasiyor - asikarlik itirazina
cevap (miktar sinirli / dagilim bagimsiz) **ve** iki yonlu bagimsizlik
(girdi + sahip). Katman 1'deki en guclu iki istemin birlesimi, yani **ret
riski en dusuk uclu.**

**Zaafi:** Uc unsur, uc kacis kapisi. Miktar sinirlamayan, sahibin mudahale
ettigi, veya girdiye bakan rakip serbest.

### 25.5 DURUMSUZLUK unsurunun ifadesi kilitlendi

| Deneme | Sorun |
|---|---|
| "onceki bildirimlerden" | Tetikleyici "girdi veya bildirim" iken yalniz "bildirim" demek tutarsiz |
| "onceki girdi/bildirimlerden" | Daha iyi ama uretilmis degerleri, sayaclari kapsamiyor |
| **"onceki verilerden"** | **KILITLENDI** - girdi, bildirim, uretilen deger, sayac, her turlu gecmis kaydi kapsar |

**Parantezli liste isteme YAZILMAZ** (kurucunun "(girdi,bildirim,deger vs)"
onerisi) - liste sinir sayilir, rakip listede olmayan bir sey uydurur
(*"bizde veri degil durum var"*). Ornekler tarifnameye.

**Tarifname cumlesi:**
> *"Onceki veriler; onceki girdiler, bildirimler, uretilmis degerler,
> sayaclar veya benzeri her turlu gecmis kaydi kapsar."*

> **§24.8'deki 1c metni guncellendi:** "onceki girdi/bildirimlerden" ->
> **"onceki verilerden"**.

### 25.6 ISTEM 2b ONAYLANDI

> **ISTEM 2b (BAGIMSIZLIK + MERCISIZLIK + DURUMSUZLUK)**
>
> Tanimlanmis veya tanimlanmamis bir evrende; girdi veya bildirim tetiklemesi
> ile, hicbir tarafin etkisi olmaksizin, onceki verilerden ve girdinin
> ozelliklerinden bagimsiz bir sekilde bir deger ureten yontem.

| Unsur | Neyi kapatiyor |
|---|---|
| hicbir tarafin etkisi olmaksizin | Sahip yonlendiremiyor |
| onceki verilerden bagimsiz | Sayac, zincir, gecmis kayit tasinmiyor |
| girdinin ozelliklerinden bagimsiz | Kimlik, tutar, zaman etkisiz |

**Otobus:** Kim indigi etkisiz, kacinci inis oldugu etkisiz, sahip de
yonlendiremiyor. **Uc yon birden kapali.**

**Gucu:** Uc eksende bagimsizlik - yatay (girdi), dikey (gecmis), yukari
(sahip). Rakibin tutunacagi hicbir degisken kalmiyor.

**Zaafi:** SINIR yok -> asikarlik savunmasi bu istemde tasinmiyor. Ofis
*"rastgelelik biliniyor"* derse cevap yok (o savunma 2a'da).

### 25.7 KIMLIK tanimi - istem ve tarifname ayrimi

**ISTEMDE kalacak ifade: "kimlik icermeyen bir girdiden"**

**"anonim girdi" ELENDI.** Sektorde "anonim" = *"kimligi gizlenmis ama
izlenebilir"* anlaminda kullaniliyor (hash'lenmis kimlik, oturum no, cihaz
parmak izi hepsi "anonim" sayiliyor). Dosyadaki **US8055535 tam bunu yapiyor:**
*"anonim takip, kayit gerektirmez"* diyor ama anonim kimlik tutuyor. "Anonim"
yazmak o prior art ailesinin **icine girmek** olur.

| Ifade | Rakip kacabilir mi |
|---|---|
| "anonim girdi" | **Evet** - *"bizde hash'li kimlik var, anonim"* |
| "kimlik icermeyen girdi" | Hayir |

**TARIFNAME tanimi (yazilacak):**
> *"Kimlik; bir girdiyi baska bir girdiyle ayni kaynaga ait olarak tanimaya
> yarayan her turlu veriyi kapsar; isim, numara, oturum tanimlayicisi, cihaz
> parmak izi ve turetilmis (hash'lenmis) tanimlayicilar dahildir."*

**Olcut: iki bildirimi birbirine BAGLIYOR MU?**

| | Kimlik mi | Neden |
|---|---|---|
| "Bir yolcu" | Degil | Yalnizca varlik bildiriyor |
| "22 numarali koltuk" | **Kimlik** | Ayni koltuk tekrar gelirse bag kurulur |
| "Ahmet" | **Kimlik** | Acik |
| Bilet no - tek kullanimlik | Degil | Bag kurulamaz |
| Bilet no - abonman (ayni no her gun) | **Kimlik** | Bag kurulur |
| Sira konumu (12. inen) | Degil | Ayni kisi 40. inen olsa sistem bag kuramaz |

> **Kimligi kisiye baglilik degil, TEKRARLANABILIRLIK yapar.**

### 25.8 ACIK KONU - kurucunun alternatif kimlik olcutu

**Kurucunun tespiti:** *"Bence kimlik herhangi birine tekabul ediyorsa
kimliksizliktir."*

Yani olcut "tekrar eden tanimlayici var mi" degil, **"deger kime gittigi
belirsiz mi"**. Bu olcutle "12. inen" kimliksiz, cunku o 12. inen herhangi
biri olabilir.

**Neden isteme yazilmadi:**
- *"Herhangi birine tekabul eden"* mugak - ofis *"kim karar veriyor"* diye sorar
- **Risk:** koltuk 22'ye veriliyorsa ve ayni kisi hep 22'de oturuyorsa, sistem
  farkinda olmadan ayni kisiyi kayirir. Rakip bunu kullanir: *"kimliksizlik
  iddianiz sahte, tekrar eden bir tanimlayici var."*

**KARAR (kurucu): "Tarifnamede calisilir bu."**

Tarifname icin aday cumle:
> *"Girdi, belirli bir kisiyi degil, baglam icindeki herhangi bir unsuru
> isaret eder."*

Tarifname yazilirken bu olcut islenecek.

### 25.9 ISTEM 2c ONAYLANDI

> **ISTEM 2c (BAGIMSIZLIK + MERCISIZLIK + KIMLIKSIZLIK)**
>
> Tanimlanmis veya tanimlanmamis bir evrende; girdi veya bildirim tetiklemesi
> ile, kimlik icermeyen bir girdiden, hicbir tarafin etkisi olmaksizin ve
> girdinin ozelliklerinden bagimsiz bir sekilde bir deger ureten yontem.

| Unsur | Neyi kapatiyor |
|---|---|
| kimlik icermeyen bir girdiden | Kimlik sisteme hic girmiyor |
| hicbir tarafin etkisi olmaksizin | Sahip yonlendiremiyor |
| girdinin ozelliklerinden bagimsiz | Giren hicbir ozellik degere etki etmiyor |

**Gucu:** **Prior art'tan en net ayrilan uclu** - hem kimlikli sistemlerden
(CRM, sadakat, hedefli kupon) hem *"anonim ama izleyen"* patentlerden
(US8055535) ayriliyor.

**Zaafi:** SINIR yok -> asikarlik savunmasi tasinmiyor. Kimlik alip
kullanmayan sistemler (Passolig ornegi) serbest.

### 25.10 ISTEM 2d ONAYLANDI

> **ISTEM 2d (BAGIMSIZLIK + SINIR + DURUMSUZLUK)**
>
> Tanimlanmis veya tanimlanmamis bir evrende; girdi veya bildirim tetiklemesi
> ile, sinirlanan miktarda, onceki verilerden ve girdinin ozelliklerinden
> bagimsiz bir sekilde bir deger ureten yontem.

| Unsur | Neyi kapatiyor |
|---|---|
| sinirlanan miktarda | Kac deger uretilecegi sinirli |
| onceki verilerden bagimsiz | Sayac, zincir, gecmis tasinmiyor |
| girdinin ozelliklerinden bagimsiz | Kimlik, tutar, zaman etkisiz |

**Gucu:** Asikarlik savunmasi (sinir) + gecmisten bagimsizlik. MERCISIZLIK
yok, yani **olumsuz ispat sorunu da yok** - uc unsurun hepsi test edilebilir:
miktar sayilir, gecmis etkisi denenir, girdi degistirilir.

**Not:** Sahibin mudahale ettigi sistemler bu istemin **icinde** (mercisizlik
yazilmadigi icin) - yani yakalaniyor, kacmiyor.

### 25.11 ONEMLI KAVRAM DUZELTMESI - katmanlar "zaaf kapatmaz"

Kurucunun sorusu: *"bu zaafi da 4'luda kapatacaz, yani zaaf kapatmaca gibi
katmanlar degil mi?"*

**HAYIR.** Bu, §17'de duzeltilen hatanin aynisi:

> **Unsur eklemek rakibi SERBEST BIRAKIR, yakalamaz.**

Bir isteme mercisizlik eklersen, mercisizligi karsilamayan rakip o istemin
**tamamen disina** cikar - artik hic yakalanmaz. Dortlu, uclunun zaafini
kapatmiyor.

**Katmanlarin gercek islevi:**

| Katman | Unsur | Islev |
|---|---|---|
| Ust (az unsur) | 1-2 | **Genis kapsam** - cok rakip yakalar |
| Alt (cok unsur) | 3-4 | **Ret sigortasi** - ust reddedilirse ayakta kalir |

Katmanlar asagi indikce **DARALIR**, kapsam artmaz.

"Zaaf" kelimesi yanlis kullanildi. Dogrusu: *o istem o rakibi yakalamiyor,
ama daha GENIS bir istem (temel veya ikili) onu yakaliyor.*

### 25.12 ACIK SORU - temel istem kabul gorurse alt katmanlar gereksiz mi?

Kurucunun sorusu. **Durust cevap: buyuk olcude evet.**

Temel istem kabul edilirse en genis koruma alinmis olur; alt katmanlar onun
icinde kalan daha dar haller, ekstra rakip yakalamazlar.

**Yine de yazilma sebepleri:**

1. **Kabul edilmeme olasiligi yuksek** - temel istem tek unsurlu ve cok genis,
   ofis muhtemelen reddeder. Alt katmanlar devralir
2. **Iptal davasi sigortasi** - patent alindiktan sonra rakip iptal davasi
   acip genis istemi dusurebilir; alt istemler ayakta kalir, patent tamamen
   olmez. Alinmis patentlerin iptali sik gorulur
3. **Ucret** - belli bir istem sayisina kadar ek ucret dogmuyor

**AMA:** cogu alt katman fazlalik olabilir. 12 istem yerine 4-5 iyi istem
daha dogru olabilir. Fazlaliklar **tarifnameye** yazilirsa ayni isi gorur
(baskasi alamaz, ileride bolunmus basvuruyla alinir).

> **Kurucu karari: "Dur bitirelim, sonra cikan tabloya gore karar veririz."**
> Format karari tum katmanlar yazildiktan sonra verilecek.

### 25.13 ISTEM 2e ONAYLANDI - Katman 2'nin en guclu istemi

> **ISTEM 2e (BAGIMSIZLIK + SINIR + KIMLIKSIZLIK)**
>
> Tanimlanmis veya tanimlanmamis bir evrende; girdi veya bildirim tetiklemesi
> ile, kimlik icermeyen bir girdiden, sinirlanan miktarda ve girdinin
> ozelliklerinden bagimsiz bir sekilde bir deger ureten yontem.

| Unsur | Neyi kapatiyor |
|---|---|
| kimlik icermeyen bir girdiden | Kimlik sisteme hic girmiyor |
| sinirlanan miktarda | Kac deger uretilecegi sinirli |
| girdinin ozelliklerinden bagimsiz | Giren hicbir ozellik degere etki etmiyor |

**Gucu - ALINABILIRLIK ACISINDAN KATMAN 2'NIN EN GUCLUSU:**

| Ofisin itirazi | Cevabi veren unsur |
|---|---|
| *"Prior art var"* (CRM/sadakat/hedefli kupon) | **KIMLIKSIZLIK** |
| *"Asikar - rastgelelik biliniyor"* | **SINIR** (miktar sinirli / dagilim bagimsiz) |

Iki buyuk itiraza tek istemde cevap. Ve MERCISIZLIK olmadigi icin **olumsuz
ispat sorunu yok** - uc unsurun hepsi test edilebilir:
- kimlik: girdide var mi, bakilir
- miktar: sayilir
- bagimsizlik: girdi degistirilir, sonuc degismiyor

### 25.14 ISTEM 2f ONAYLANDI

> **ISTEM 2f (BAGIMSIZLIK + DURUMSUZLUK + KIMLIKSIZLIK)**
>
> Tanimlanmis veya tanimlanmamis bir evrende; girdi veya bildirim tetiklemesi
> ile, kimlik icermeyen bir girdiden, onceki verilerden ve girdinin
> ozelliklerinden bagimsiz bir sekilde bir deger ureten yontem.

| Unsur | Neyi kapatiyor |
|---|---|
| kimlik icermeyen bir girdiden | Kimlik sisteme hic girmiyor |
| onceki verilerden bagimsiz | Sayac, zincir, gecmis tasinmiyor |
| girdinin ozelliklerinden bagimsiz | Giren hicbir ozellik degere etki etmiyor |

**Gucu:** **Uc katmanli veri yalitimi** - kimlik alinmiyor, gecmis tutulmuyor,
giren etkisiz. KVKK/veri koruma acisindan en temiz hal. "Yapisal adalet"
iddiasinin (§15.4 unsur 7) tam karsiligi: sistem kayirmak isteseydi bile
kayiracagi kisiyi tanimiyor.

**Zaafi:** SINIR yok -> asikarlik savunmasi yok.

### 25.15 ISTEM 2g ONAYLANDI

> **ISTEM 2g (BAGIMSIZLIK + SINIR + EVREN)**
>
> **Belirli bir evren icinde**; girdi veya bildirim tetiklemesi ile,
> sinirlanan miktarda ve girdinin ozelliklerinden bagimsiz bir sekilde bir
> deger ureten yontem.

> **DIKKAT:** Bu istemde ortak govdedeki *"tanimlanmis veya tanimlanmamis bir
> evrende"* ifadesi **"belirli bir evren icinde"** oldu. Cunku burada EVREN
> artik bir **unsur**, cerceve degil - gercek bir daraltma.

| Unsur | Neyi kapatiyor |
|---|---|
| belirli bir evren icinde | Evren tanimli - surekli acik sistemler disarida |
| sinirlanan miktarda | Kac deger uretilecegi sinirli |
| girdinin ozelliklerinden bagimsiz | Giren hicbir ozellik degere etki etmiyor |

**Otobus:** Bu otobus (belirli evren), 2 deger (sinir), kim indigi etkisiz
(bagimsizlik). **Kurucunun ozet cumlesinin tam karsiligi:** *"bir otobuste,
bir konserde veya bir sehirde 2 deger uretmek."*

**Gucu:** EVREN + SINIR birlikte *"kapali kume icinde sinirli uretim"* diyor -
kurucunun **512 itirazinin** karsiligi (*"adam 512 ve 999 derse ne olacak"*),
aralik bilinerek uretim.

**Zaafi:** Surekli akan sistemler (magaza, site) disarida kaliyor. **En dar
uclu.**

### 25.16 KATMAN 2 KAPANDI - yedi uclu onayli

| # | Uclu | Tasidigi savunma |
|---|---|---|
| **2a** | BAGIMSIZLIK + MERCISIZLIK + SINIR | Asikarlik + iki yonlu bagimsizlik. Ret riski en dusuk |
| **2b** | BAGIMSIZLIK + MERCISIZLIK + DURUMSUZLUK | Uc eksen: yatay + dikey + yukari |
| **2c** | BAGIMSIZLIK + MERCISIZLIK + KIMLIKSIZLIK | Prior art'tan en net ayrilma |
| **2d** | BAGIMSIZLIK + SINIR + DURUMSUZLUK | Asikarlik + gecmis. Hepsi test edilebilir |
| **2e** | BAGIMSIZLIK + SINIR + KIMLIKSIZLIK | **Alinabilirlik acisindan EN GUCLU** - iki buyuk itiraza cevap |
| **2f** | BAGIMSIZLIK + DURUMSUZLUK + KIMLIKSIZLIK | Uc katmanli veri yalitimi, yapisal adalet |
| **2g** | BAGIMSIZLIK + SINIR + EVREN | Kapali kumede sinirli uretim. En dar |

**Yazilmayan ucluler:** MERCISIZLIK+DURUMSUZLUK+KIMLIKSIZLIK (bagimsizlik
yok -> kurallı sistemler kapsamda, prior art riski), EVREN'li diger
kombinasyonlar (2g disinda hepsi 2g'den dar veya tutarsiz) -> tarifname.

> **TOPLAM ONAYLI: 1 temel + 4 ikili + 7 uclu = 12 bagimsiz istem.**
>
> **SIRADA: Katman 3 (dortluler), sonra FORMAT KARARI** (§25.12 - 12 istem
> fazla olabilir; kurucu *"cikan tabloya gore karar veririz"* dedi).

---

## 26. KATMAN 2 DIP TARAMASI - BAGIMSIZLIK on-kosul olmaksizin

> Kurucunun sorusu: *"on unsur gozetmeksizin, yani su unsur mutlaka olmali
> demeksizin guclu uclu adaylari cikar mi?"*
>
> §25'te BAGIMSIZLIK **sabit** tutulmustu, hic sorgulanmadi. Bu tarama 6
> cekirdek unsurun **20 uclusunun tamamini** geciyor.

Unsurlar: **B**=BAGIMSIZLIK, **M**=MERCISIZLIK, **S**=SINIR,
**D**=DURUMSUZLUK, **K**=KIMLIKSIZLIK, **E**=EVREN

### 26.1 BAGIMSIZLIK iceren 10 uclu

| Uclu | Durum |
|---|---|
| B+M+S | ✅ 2a |
| B+M+D | ✅ 2b |
| B+M+K | ✅ 2c |
| B+S+D | ✅ 2d |
| B+S+K | ✅ 2e |
| B+D+K | ✅ 2f |
| B+S+E | ✅ 2g |
| B+M+E | Yazilmadi - 2g'den zayif (sinir yok) |
| B+D+E | Yazilmadi - sinir yok, "kaca?" sorusu acik |
| B+K+E | Yazilmadi - sinir yok |

### 26.2 BAGIMSIZLIK icermeyen 10 uclu - YENI TARAMA

| Uclu | Degerlendirme |
|---|---|
| **M+S+K** | **GUCLU ADAY -> 2h** |
| **M+S+D** | **ADAY -> 2i** |
| M+D+K | Tutarsiz: kimligi almiyor, gecmisi tutmuyor ama tutara gore deger verebilir |
| S+D+K | Belirsizlik hic yok -> kampanya |
| M+S+E | Kapali kumede mercisiz sinirli uretim = **piyangonun tarifi.** Prior art |
| M+D+E | Sinir yok + bagimsizlik yok -> zayif |
| M+K+E | Sinir yok -> zayif |
| S+D+E | Belirsizlik yok -> kampanya |
| S+K+E | Belirsizlik yok -> kontenjanli anonim kupon, US20130144700A1 |
| D+K+E | Belirsizlik yok -> zayif |

### 26.3 ISTEM 2h ONAYLANDI - dosyanin orijinal cekirdegi

> **ISTEM 2h (MERCISIZLIK + SINIR + KIMLIKSIZLIK)**
>
> Tanimlanmis veya tanimlanmamis bir evrende; girdi veya bildirim tetiklemesi
> ile, kimlik icermeyen bir girdiden, hicbir tarafin etkisi olmaksizin ve
> sinirlanan miktarda bir deger ureten yontem.

**Bu ucly §2'deki orijinal cekirdegin ta kendisi:** *"Musteriyi tanimaksizin,
islem tutarindan, indirim oranini hicbir tarafca onceden belirlenemez bicimde
ureten sistem"* + butce kontrolu.

**Neden 2e'den farkli ve gerekli:** BAGIMSIZLIK yok, yani **girdiye bakan
sistem de kapsamda.** Tutara gore degisen ama sahibi yonlendiremeyen bir
sistem bu istemin icinde, 2e'nin disinda. Farkli bir rakip kumesi yakaliyor.

| Unsur | Neyi kapatiyor |
|---|---|
| kimlik icermeyen bir girdiden | Kimlik sisteme hic girmiyor |
| hicbir tarafin etkisi olmaksizin | Sahip yonlendiremiyor |
| sinirlanan miktarda | Kac deger uretilecegi sinirli |

**Zaafi:** Girdiden bagimsizlik yok -> degeri tutardan/saatten tureten
sistemler de kapsamda; bu genislik prior art riskini artiriyor (dinamik
fiyatlama ailesi).

### 26.4 ISTEM 2i ONAYLANDI

> **ISTEM 2i (MERCISIZLIK + SINIR + DURUMSUZLUK)**
>
> Tanimlanmis veya tanimlanmamis bir evrende; girdi veya bildirim tetiklemesi
> ile, hicbir tarafin etkisi olmaksizin, onceki verilerden bagimsiz olarak ve
> sinirlanan miktarda bir deger ureten yontem.

**Dosyanin asikarlik savunmasini (§15.12) en sade tasiyan uclu:** miktar
sinirli, dagilim kimsenin etkisinde degil, gecmis tasinmiyor.

**Zaafi:** KIMLIK hic gecmiyor -> kimlikli sistemler de kapsamda, ve o alan
prior art'in %90'i. **Ret riski yuksek** - 2h'den daha riskli.

### 26.5 "Rastgele uclu" taramasi - cekirdek disi unsurlar

Kurucunun ikinci sorusu. 6 cekirdek disindaki unsurlar
(kayitsizlik, hafizasizlik, hesapsizlik, geri dondurulemezlik, girdi
yalinligi, eszamanlilik, tekrarsizlik, kapsayicilik) ile ucluler:

| Uclu | Sonuc |
|---|---|
| B+S+kayitsizlik | Muhasebeyle celisiyor (indirim tutari faturada gorunmek zorunda) + ispatlanamaz |
| B+S+kapsayicilik | En iyisi ama **daraltici**; "Kirma 5'i kapatir" iddiasi §17'de curutuldu |
| B+S+eszamanlilik | Zarf yontemini disliyor (daraltici) + BAGIMSIZLIK benzer is yapiyor |
| B+S+girdi yalinligi | BAGIMSIZLIK ile neredeyse ayni -> tekrar |
| M+S+kapsayicilik | Bagimsizlik yok + daraltici unsur |
| B+K+kapsayicilik | Sinir yok |
| Turev kombinasyonlar (7, 8, 9, 14) | Hepsi ya tekrar ya olcum sorunlu |

> **GUCLU ADAY CIKMADI.** Yapisal sebep: 6 cekirdek disindaki unsurlar ya
> **turev** (ayni seyin baska ifadesi), ya **daraltici**, ya **olculemez**.
> Cekirdek liste dogru secilmis.

### 26.6 KATMAN 2 NIHAI - dokuz uclu

| # | Uclu | Tasidigi savunma |
|---|---|---|
| 2a | B+M+S | Asikarlik + iki yonlu bagimsizlik |
| 2b | B+M+D | Uc eksen: yatay + dikey + yukari |
| 2c | B+M+K | Prior art'tan en net ayrilma |
| 2d | B+S+D | Asikarlik + gecmis, hepsi test edilebilir |
| **2e** | **B+S+K** | **Alinabilirlik acisindan en guclu** |
| 2f | B+D+K | Uc katmanli veri yalitimi |
| 2g | B+S+E | Kapali kumede sinirli uretim (en dar) |
| **2h** | **M+S+K** | **Dosyanin orijinal cekirdegi** - girdiye bakan sistemleri de yakalar |
| 2i | M+S+D | Asikarligi en sade tasir; ret riski yuksek |

> **TOPLAM ONAYLI: 1 temel + 4 ikili + 9 uclu = 14 bagimsiz istem.**

---

## 27. KATMAN 3 — DÖRTLÜLER, dip inceleme

> 6 çekirdek unsurdan 4'lü seçim = **15 kombinasyon**, tamamı tarandı.
> **B**=BAĞIMSIZLIK, **M**=MERCİSİZLİK, **S**=SINIR, **D**=DURUMSUZLUK,
> **K**=KİMLİKSİZLİK, **E**=EVREN

### 27.1 Ölçüt — dar katmanın işi ALINABİLİRLİK

Üst katmanlar kapsam için, dar katmanlar **ret sigortası** için. Yani ölçüt
"kaç rakip yakalar" değil → **"ofisin itirazlarına kaç cevap taşıyor."**

Ofisin üç itirazı ve cevabını veren unsurlar:

| İtiraz | Cevabı veren |
|---|---|
| **Prior art** — kimlikli alan dolu (%90) | **K** (tek alternatifi yok) |
| **Aşikârlık** — "rastgelelik biliniyor" | **S** (tek taşıyıcı: miktar sınırlı/dağılım belirsiz) |
| **İspat** — "kimse bilmiyor nasıl gösterilir" | **B** (test edilebilir: girdiyi değiştir, sonuç değişmiyor) |

**M'nin sorunu:** olumsuzluk, ispat yükü getiriyor — dar katmanın amacına ters
çalışabiliyor. **B ile birlikte yazıldığında** destekleniyor (bağımsızlık test
edilir, mercisizlik ondan türer).

**E'nin sorunu:** iki yönlü zarar — hem daraltıyor (sürekli akış dışarıda) hem
**E+M+S birleşimi piyangonun birebir tarifi** (kapalı küme + belirli sayı +
dağılımı kimse bilmiyor).

### 27.2 15 dörtlünün tamamı

| # | Dörtlü | P.art | Aşikâr | İspat | Değerlendirme |
|---|---|---|---|---|---|
| **1** | **K+B+S+M** | ✅ | ✅ | ✅ | **EN GÜÇLÜ** — üç itiraza üç cevap + M desteklenmiş |
| **2** | **K+B+S+D** | ✅ | ✅ | ✅ | **İKİNCİ** — M yok, tüm unsurlar test edilebilir |
| 3 | K+B+S+E | ✅ | ✅ | ✅ | Üçü var ama E daraltıyor; piyango riski yok (M yok) |
| 4 | K+B+M+D | ✅ | ❌ | ⚠️ | Aşikârlık cevabı yok |
| 5 | K+B+M+E | ✅ | ❌ | ⚠️ | Aşikârlık yok + E daraltıyor |
| 6 | K+B+D+E | ✅ | ❌ | ✅ | Aşikârlık yok |
| 7 | K+M+S+D | ✅ | ✅ | ❌ | B yok → ispat yükü, girdiye bakan sistemler kapsamda |
| 8 | **K+M+S+E** | ✅ | ✅ | ❌ | **ZEMİN DÖRTLÜ** — §27.4 |
| 9 | K+M+D+E | ✅ | ❌ | ❌ | İki itiraza cevapsız |
| 10 | K+S+D+E | ✅ | ✅ | ❌ | Belirsizlik unsuru YOK (ne M ne B) → buluş niteliği zayıf |
| 11 | B+M+S+D | ❌ | ✅ | ⚠️ | **K yok → prior art'ın %90'ına açık** |
| 12 | B+M+S+E | ❌ | ✅ | ⚠️ | K yok + piyango riski (M+S+E) |
| 13 | B+M+D+E | ❌ | ❌ | ⚠️ | K yok, aşikârlık yok |
| 14 | B+S+D+E | ❌ | ✅ | ✅ | K yok |
| 15 | M+S+D+E | ❌ | ✅ | ❌ | K yok, B yok |

**Kritik gözlem:** K içermeyen 5 dörtlünün (11-15) hepsi prior art'ın en dolu
alanına düşüyor. Dar katmanın amacı alınabilirlik olduğu için **K'sız dörtlü
anlamsız** — §19.6'daki tespit dörtlülerde de geçerli.

### 27.3 İSTEM 3a — EN GÜÇLÜ DÖRTLÜ (K+B+S+M)

> **Tanımlanmış veya tanımlanmamış bir evrende; girdi veya bildirim
> tetiklemesi ile, kimlik içermeyen bir girdiden, hiçbir tarafın etkisi
> olmaksızın, sınırlanan miktarda ve girdinin özelliklerinden bağımsız bir
> şekilde bir değer üreten yöntem.**

| Unsur | Hangi itiraza cevap |
|---|---|
| kimlik içermeyen bir girdiden | Prior art (kimlikli alan) |
| hiçbir tarafın etkisi olmaksızın | Buluş niteliği (belirsizlik) |
| sınırlanan miktarda | Aşikârlık |
| girdinin özelliklerinden bağımsız | İspat (test edilebilir) |

**Neden en güçlü:** ofisin elinde itiraz malzemesi kalmıyor. Dört savunma
birden. Ve M'nin ispat yükü B tarafından destekleniyor — *"bağımsızlık test
edilebilir, mercisizlik ondan türüyor"* argümanı kurulabiliyor.

**Dört katmanlı yalıtım:** kimliği almıyor (K), aldığını kullanmıyor (B),
sahip karışmıyor (M), miktar sınırlı (S).

**Zaafı:** Dört unsur = dört kaçış kapısı. En dar istem. Ama dar katmanın işi
bu — kapsam üst katmanlarda.

### 27.4 İSTEM 3b — ZEMİN DÖRTLÜ (K+M+E+S) ve kıyası

Kurucunun oturumun başında uzlaştığı metin (§15.8), güncel ifadeyle:

> **Belirli bir evren içinde; girdi veya bildirim tetiklemesi ile, kimlik
> içermeyen bir girdiden, hiçbir tarafın etkisi olmaksızın ve sınırlanan
> miktarda bir değer üreten yöntem.**

Kurucunun özet cümlesi: *"bir otobüste, bir konserde veya bir şehirde 2
rastgele değer üretmek."*

**Zemin dörtlü ile 3a kıyası:**

| | Zemin (K+M+E+S) | 3a (K+B+S+M) |
|---|---|---|
| Prior art cevabı | ✅ | ✅ |
| Aşikârlık cevabı | ✅ | ✅ |
| İspat kolaylığı | ❌ M tek başına | ⚠️ B destekliyor |
| **Piyango benzerliği** | ⚠️ **E+M+S = piyango tarifi** | ✅ risk yok |
| Kapsam | Dar (evren tanımlı olmalı) | Daha geniş (sürekli akış da içinde) |

> **E yerine B koymak her açıdan iyileştiriyor.** E'nin tek katkısı "512
> problemi"ni anlatmaktı (*"adam 512 ve 999 derse ne olacak"*) — o tarifnameye
> yazılır, isteme gerek yok.

**Karar:** zemin dörtlü yazılsın ama **birinci sıraya konmasın.**

### 27.5 İSTEM 3c — M'siz güvenli hat (K+B+S+D)

> **Tanımlanmış veya tanımlanmamış bir evrende; girdi veya bildirim
> tetiklemesi ile, kimlik içermeyen bir girdiden, önceki verilerden,
> sınırlanan miktarda ve girdinin özelliklerinden bağımsız bir şekilde bir
> değer üreten yöntem.**

**Neden ayrı yazılmalı:** dört unsurun **hepsi test edilebilir** —
- kimlik: girdide var mı, bakılır
- geçmiş: önceki veriyi değiştir, sonuç değişmiyor
- miktar: sayılır
- bağımsızlık: girdiyi değiştir, sonuç değişmiyor

M yok, yani *"kimsenin etkisi olmadığını nasıl kanıtlıyorsun"* itirazı hiç
doğmuyor. **İspat itirazına tamamen kapalı tek dörtlü.**

3a reddedilirse (M'nin ispat yükü yüzünden) bu ayakta kalır.

### 27.6 Katman 3 kararı — üç dörtlü

| # | Dörtlü | İşlevi |
|---|---|---|
| **3a** | K+B+S+M | **En güçlü** — dört itiraza dört cevap |
| **3b** | K+M+E+S | Zemin dörtlü (kurucunun orijinali) — evren hattı |
| **3c** | K+B+S+D | M'siz güvenli hat — ispat itirazına kapalı |

**Yazılmayanlar → tarifname:** 12 dörtlü. K'sız olanlar (11-15) prior art'a
açık; aşikârlık cevabı taşımayanlar (4, 5, 6, 9, 13) ret riski yüksek;
belirsizlik unsuru taşımayan (10) buluş niteliği zayıf.

### 27.7 GÜNCEL TOPLAM ve FORMAT UYARISI

| Katman | Unsur | İstem |
|---|---|---|
| Temel | 1 | 1 |
| 1 | 2 | 4 |
| 2 | 3 | 9 |
| 3 | 4 | 3 |
| **TOPLAM** | | **17 bağımsız istem** |

> ⚠️ **17 bağımsız istem başvurulamaz.** Buluş bütünlüğü (SMK m.91) itirazı
> neredeyse kesin; ofis böler, her parça ayrı ücret ve ayrı süreç.
>
> **Tipik başvuru: 2-3 bağımsız istem + 10-15 bağımlı istem.**
>
> **FORMAT KARARI ARTIK ZORUNLU** — kurucunun *"çıkan tabloya göre karar
> veririz"* dediği nokta burası.

### 27.8 Format önerisi — 3 bağımsız + gerisi bağımlı/tarifname

**Bağımsız istem olarak (3 tane):**

| Sıra | İstem | Gerekçe |
|---|---|---|
| **1** | **TEMEL** (B) | En geniş deneme. Kabul edilirse en büyük kazanç |
| **2** | **2e** (K+B+S) | **Alınabilirlik en yüksek** — üç itiraza üç cevap, hepsi test edilebilir |
| **3** | **3a** (K+B+S+M) | En güvenli sığınak — dört savunma |

Bu üçü bir **hiyerarşi** kuruyor: 1 reddedilirse 2, o da reddedilirse 3.
Ve üçü aynı buluşun giderek daralan halleri → bütünlük itirazı gelmez.

**Bağımlı istem olarak (10-15):** diğer unsurlar tek tek eklenerek
("İstem 2'ye göre yöntem, ayrıca ... ile karakterize") — M, D, E, kayıtsızlık,
kapsayıcılık, eşzamanlılık, girdi yalınlığı.

**Tarifnameye (olumlu varyasyon olarak, §18.4 kuralı):** kalan bütün
kombinasyonlar — 4 ikili, 9 üçlü, 15 dörtlü, hepsi *"bir uygulamada ...
biçiminde de uygulanabilir"* kalıbıyla. Başkası alamaz; ileride değerli
çıkarsa bölünmüş başvuruyla alınır.

**Not:** 2h (M+S+K, dosyanın orijinal çekirdeği) bağımsız istem listesinde
yok — çünkü B taşımadığı için ispat yükü var ve 2e ile 3a onun kapsadığı
alanı büyük ölçüde örtüyor. Ama **tarifnamede mutlaka bulunmalı**, hem tarihsel
çekirdek hem bölünmüş başvuru adayı.

---

## 28. TUM ISTEMLER - OZET TABLO (nihai envanter)

> Ortak govde: *"Tanimlanmis veya tanimlanmamis bir evrende; girdi veya
> bildirim tetiklemesi ile, ..."* (2g ve 3b'de **"Belirli bir evren icinde"**)

### 28.1 Unsur kisaltmalari ve guc degerlendirmesi

| Kod | Unsur | Istem ifadesi | Rakibe karsi | Ofise karsi |
|---|---|---|---|---|
| **B** | BAGIMSIZLIK | girdinin ozelliklerinden bagimsiz bir sekilde | **Cok guclu** (atlatmak = kurallı sistem olmak) | Ispat kolay (test edilebilir) |
| **K** | KIMLIKSIZLIK | kimlik icermeyen bir girdiden | **Guclu** (atlatmak = KVKK yuku) | **Prior art ayrimi** |
| **M** | MERCISIZLIK | hicbir tarafin etkisi olmaksizin | Orta (atlatmak = piyango olmak) | ⚠️ Ispat yuku (olumsuzluk) |
| **S** | SINIR | sinirlanan miktarda | Zayif (atlatmak kolay) | **Asikarlik cevabi - ZORUNLU** |
| **D** | DURUMSUZLUK | onceki verilerden bagimsiz olarak | Zayif (sayac eklemek bedava) | Ispat kolay |
| **E** | EVREN | belirli bir evren icinde | Cok zayif | ⚠️ Piyango benzerligi riski |

### 28.2 TEMEL KATMAN

| # | Unsur | Istem | Ozet |
|---|---|---|---|
| **T** | B | ...girdinin ozelliklerinden bagimsiz bir sekilde bir deger ureten yontem | **En genis.** Kurallı sistemlerin TAMAMI disarida (kural = girdiden turetme). Tek unsurla ayakta durabilen tek aday |

### 28.3 KATMAN 1 - ikililer

| # | Unsurlar | Govdeye eklenen | Ozet |
|---|---|---|---|
| **1a** | B+M | hicbir tarafin etkisi olmaksizin ve girdinin ozelliklerinden bagimsiz... | Iki yon: girdi (asagi) + sahip (yukari) |
| **1b** | B+S | sinirlanan miktarda ve girdinin ozelliklerinden bagimsiz... | **Asikarlik itirazina tek cevap** |
| **1c** | B+D | onceki verilerden ve girdinin ozelliklerinden bagimsiz... | Iki eksen: gecmis (dikey) + girdi (yatay) |
| **1d** | B+K | kimlik icermeyen bir girdiden ve girdinin ozelliklerinden bagimsiz... | Veri toplamayi (K) + kullanmayi (B) birlikte reddeder. Passolig testi |

### 28.4 KATMAN 2 - ucluler

| # | Unsurlar | Govdeye eklenen | Ozet |
|---|---|---|---|
| **2a** | B+M+S | hicbir tarafin etkisi olmaksizin, sinirlanan miktarda ve girdinin ozelliklerinden bagimsiz... | Asikarlik + iki yonlu bagimsizlik |
| **2b** | B+M+D | hicbir tarafin etkisi olmaksizin, onceki verilerden ve girdinin ozelliklerinden bagimsiz... | Uc eksen: yatay + dikey + yukari |
| **2c** | B+M+K | kimlik icermeyen bir girdiden, hicbir tarafin etkisi olmaksizin ve girdinin ozelliklerinden bagimsiz... | Prior art'tan en net ayrilma |
| **2d** | B+S+D | sinirlanan miktarda, onceki verilerden ve girdinin ozelliklerinden bagimsiz... | Asikarlik + gecmis; hepsi test edilebilir |
| **2e** | B+S+K | kimlik icermeyen bir girdiden, sinirlanan miktarda ve girdinin ozelliklerinden bagimsiz... | **ALINABILIRLIK EN YUKSEK** - iki buyuk itiraza cevap, M yok |
| **2f** | B+D+K | kimlik icermeyen bir girdiden, onceki verilerden ve girdinin ozelliklerinden bagimsiz... | Uc katmanli veri yalitimi, yapisal adalet |
| **2g** | B+S+E | *(Belirli bir evren icinde;)* sinirlanan miktarda ve girdinin ozelliklerinden bagimsiz... | Kapali kumede sinirli uretim. En dar uclu |
| **2h** | M+S+K | kimlik icermeyen bir girdiden, hicbir tarafin etkisi olmaksizin ve sinirlanan miktarda... | **DOSYANIN ORIJINAL CEKIRDEGI** (§2). B yok -> girdiye bakan sistemleri de yakalar |
| **2i** | M+S+D | hicbir tarafin etkisi olmaksizin, onceki verilerden bagimsiz olarak ve sinirlanan miktarda... | Asikarligi en sade tasir; K yok -> ret riski yuksek |

### 28.5 KATMAN 3 - dortluler

| # | Unsurlar | Govdeye eklenen | Ozet |
|---|---|---|---|
| **3a** | K+B+M+S | kimlik icermeyen bir girdiden, hicbir tarafin etkisi olmaksizin, sinirlanan miktarda ve girdinin ozelliklerinden bagimsiz... | **EN GUCLU.** Dort itiraza dort cevap; M'nin ispat yuku B ile destekleniyor |
| **3b** | K+M+E+S | *(Belirli bir evren icinde;)* kimlik icermeyen bir girdiden, hicbir tarafin etkisi olmaksizin ve sinirlanan miktarda... | **ZEMIN DORTLU** - kurucunun orijinal metni (§15.8). ⚠️ E+M+S = piyango benzerligi riski |
| **3c** | K+B+S+D | kimlik icermeyen bir girdiden, sinirlanan miktarda, onceki verilerden ve girdinin ozelliklerinden bagimsiz... | **M'SIZ SIGORTA** - dort unsur da test edilebilir, ispat itirazina tamamen kapali |

### 28.6 3c NEDEN DAHIL EDILDI

Kurucu kararsizdi; gerekce:

**3a ve 3b'nin IKISI DE M tasiyor.** Ofis M'yi ispat gerekcesiyle reddederse
(*"kimsenin etkisi olmadigini nasil kanitliyorsun"*) **ikisi birden duser.**
3c tek yumurtayi tek sepete koymamanin karsiligi.

| | 3a | 3b | 3c |
|---|---|---|---|
| M tasiyor | ✓ | ✓ | **✗** |
| Tum unsurlar test edilebilir | ✗ | ✗ | **✓** |

**3c'nin bedeli:** D kolay atlatiliyor (sayac eklemek bedava), yani "en zor
kapi" disiplinine ters. Ama islevi rakibi yakalamak degil, **ofis itirazina
karsi sigorta.**

### 28.7 MERCISIZLIGIN SOMUTLASTIRILMASI (tarifnameye)

M'nin ispat yukunu hafifleten tarifname metni - **istemde soyut kalir**,
tarifnamede somutlasir:

**1. Kimler "taraf":**
> *Taraf; yontemi uygulayan, isleten, bakimini yapan, yazilimini gelistiren,
> degeri alan ve bunlara erisimi olan ucuncu kisileri kapsar.*

**2. "Etki" ne demek:**
> *Etki; belirli bir ciktiyi elde etmek uzere uretim surecine mudahale
> edebilme yetenegidir. **Kaynagin secilmesi veya sistemin kurulmasi etki
> sayilmaz; ciktinin yonlendirilebilmesi etki sayilir.***

Bu cumle kurucunun yakaladigi Turkce azizligini kapatiyor - *"kaynagi ben
belirledim"* diyen rakip buna siginamiyor.

**3. Somut test (ispat yukunu cozen):**
> *Yontemi uygulayan taraf, belirli bir bildirimde belirli bir degerin
> uretilmesini amaclasa bile bunu saglayamaz; ayni kosullar altinda yapilan
> tekrarli denemelerde amaclanan cikti elde edilemez.*

Bu, mercisizligi **test edilebilir** hale getiriyor: sahibi istedigi sonucu
uretmeye calisir, basaramaz.

### 28.8 TOPLAM ENVANTER

| Katman | Unsur | Istem | Kodlar |
|---|---|---|---|
| Temel | 1 | 1 | T |
| 1 | 2 | 4 | 1a, 1b, 1c, 1d |
| 2 | 3 | 9 | 2a-2i |
| 3 | 4 | 3 | 3a, 3b, 3c |
| **TOPLAM** | | **17** | |

### 28.9 FORMAT - acik karar

**17 bagimsiz istem basvurulamaz** (SMK m.91 bulus butunlugu; ofis boler,
her parca ayri ucret ve surec). Tipik basvuru: **2-3 bagimsiz + 10-15 bagimli.**

**Kurucunun "en az ve en zor kapi" olcutu** (§28.1 tablosu): B > K > M zor,
S > D > E kolay. Bu olcutle minimum set:

| Katman | Istem |
|---|---|
| Temel | **T** (B) |
| Ikili | **1d** (B+K) |
| Uclu | **2c** (B+M+K) |
| Dortlu | **3a** (K+B+M+S) |

Dort istem, hepsi ayni eksende daralan haller -> **butunluk itirazi gelmez.**
S yalnizca dortluden itibaren giriyor (zayif kapi ama asikarlik icin zorunlu).
D ve E hic bagimsiz isteme girmiyor (kolay atlatiliyor, bos kapi acar).

**Alternatif - alinabilirlik odakli uclu set:**
T (en genis deneme) + **2e** (alinabilirlik en yuksek) + **3a** (en guvenli).

> **NIHAI KARAR VEKILE** - istem sayisi ve secimi **prior art taramasina
> bagli**, o tarama yapilmadi (kurucu karari: en sona). Vekil tarama sonucuna
> gore secer. Bu dosya 17 istem adayini, gerekcelerini, dolanma testlerini ve
> prior art on listesini hazir sunuyor.

**Yazilmayan butun kombinasyonlar** (6 ikili, 11 uclu, 12 dortlu) ->
**tarifnameye olumlu varyasyon olarak** (§18.4 kurali: *"bir uygulamada ...
bicimde de uygulanabilir"*, asla *"bunun aksine ... zayiftir"* denmez).
Baskasi alamaz (prior art olur); ileride degerli cikarsa bolunmus basvuruyla
alinir.

---

## 29. TEMEL ISTEM - SON IRDELEME VE NIHAI METIN

### 29.1 NIHAI TEMEL ISTEM

> **Tanimlanmis veya tanimlanmamis bir evrende; girdi veya bildirim
> tetiklemesi ile, girdi veya bildirimin ozelliklerinden bagimsiz bir
> sekilde, tetikleyen taraf icin bir fayda, hak veya sonuc degeri ureten
> yontem.**

### 29.2 Iki iyilestirme ve gerekceleri

**1. "bir deger" -> "tetikleyen taraf icin bir fayda, hak veya sonuc degeri"**

**Cozdugu sorun: SMK m.82 - matematiksel yontem itirazi.** "Bir deger ureten
yontem" soyut bir sayi uretiyormus gibi okunuyordu; ofis *"sayi uretmek
matematiktir, patentlenemez"* diyebilirdi.

Yeni ifade degerin **bir alicisi** ve **disarida bir etkisi** oldugunu
gosteriyor -> teknik sonuc. Itiraz **istemin kendisinde** karsilaniyor,
tarifnameye birakilmiyor.

**Elenen denemeler:**

| Deneme | Neden elendi |
|---|---|
| "maddi ve/veya manevi bir deger" | "Manevi" olculemez -> belirsizlik itirazi; ayrica soyutlugu **pekistiriyor** |
| "pozitif deger" | **Sifir degeri disliyor!** Dosyada aralik "0-50, sifir dahil" - kurucunun kendi sistemi istem disinda kalirdi. Ayrica "pozitif" matematiksel nitelik |
| "girdi icin elde edilesi deger" | Girdi bir veridir, deger alamaz - degeri alan girdinin **tarafi** |
| "tetikleyiciye" | Tetikleyici bir **olaydir**, deger alamaz -> belirsizlik itirazi |
| **"tetikleyen taraf icin"** | **KABUL** - eylemi yapani gosteriyor |

**Bedeli:** alicisi olmayan uygulamalar (orn. salt istatistik uretimi) kapsam
disinda kaliyor - ki o zaten bu yontem degil. **Kazanc > kayip.**

**2. "girdinin ozelliklerinden" -> "girdi veya bildirimin ozelliklerinden"**

Tetikleyici *"girdi veya bildirim"* iken sonra yalnizca *"girdinin"* demek
rakibe kapi aciyordu: *"bizde girdi yok, bildirim var."* Simdi ikisi de kapali.

> ⚠️ **Bu duzeltme TUM ISTEMLERI etkiliyor.** 17 istemin hepsinde:
> - "girdinin ozelliklerinden" -> **"girdi veya bildirimin ozelliklerinden"**
> - "kimlik icermeyen bir girdiden" -> **"kimlik icermeyen bir girdi veya
>   bildirimden"**

### 29.3 Temel istemin KALAN acigi - kabul edilen risk

**Aciklik itirazi: "kapsam bulusu asiyor."** Bu tanima yazi-tura atip indirim
veren bakkal da, tombala da giriyor. Tek unsurlu istemde bu kacinilmaz.

**Nasil karsilanir - yalnizca TARIFNAME ile:**
- Teknik problem tanimi: *"sinir altinda, kimsenin yonlendiremedigi deger uretimi"*
- Dokuz yontem tablosu (§15.2) - bosluk kaniti
- Piyango ayrimi (§14): bedel yok / kaybeden yok / ortaya konan yok
- Mekanizmanin anlatimi

**Beklenti:** Bu istem muhtemelen **reddedilecek.** Amaci siniri test etmek.
Reddedilirse alt katman devralir.

**Kabul edilen maliyet:** red sirasinda ofisin gosterecegi prior art dosyaya
girer ve alt istemleri de etkiler (*"zayif istem gucluyu zehirler"*). Tek
unsurun degeri bu riski haklı cikariyor - kabul edilirse rakibin tutunacagi
hicbir sey kalmiyor.

### 29.4 Tarifnameye yazilacak - deger tanimi

> *"Deger; bir bedelden yapilacak indirim orani veya tutari, bir puan, bir
> kontor, bir hak, bir hizmet veya bir nesne olabilir; **bunlarla sinirli
> degildir.** Uretilen deger, tetikleyen taraf icin bir fayda, hak veya sonuc
> olarak yansitilir. Degerin sifir olmasi da bir sonuctur; bu durumda
> tetikleyen taraf bir dezavantaj yasamaz."*

Son cumle **piyango ayrimini** destekliyor: kaybeden yok.

---

## 30. TEMEL ISTEM - KILITLENDI (son irdeleme)

### 30.1 NIHAI METIN

> **Birden fazla ogeden olusan bir evrende; bir ogenin tetiklemesi ile,
> ogenin ozelliklerinden bagimsiz bir sekilde, tetikleyen taraf icin bir
> fayda, hak veya sonuc degeri ureten yontem.**

### 30.2 "OGE" terimi - tek terime indirgeme

§29'da istem *"girdi veya bildirim"* ve *"evren"* diye iki ayri terim
kullaniyordu; ofis *"oge ile girdi ayni sey mi"* diye sorardi. **Tek terim:
OGE.**

**Oge = evren icindeki her bir tetikleyici olay.**

| Evren | Ogeler |
|---|---|
| Otobus | **Inisler** (oturup kalkmayan evrenin disinda) |
| Stadyum | Turnikeden gecisler |
| POS | Odeme islemleri |
| Magaza / site | Ziyaretler |
| LED lamba | Basislar |

**Kritik:** oge bir **kisi veya nesne degil, OLAYDIR.** Ayni kisinin iki ayri
girisi **iki ayri ogedir** - kimliksizlikle tutarli, sistem bag kurmuyor.

### 30.3 Evren ifadesinin evrimi

| Deneme | Sorun |
|---|---|
| "tanimlanmis veya tanimlanmamis bir evrende" | Hicbir seyi dislamiyor; ofis *"bu unsur ne sinirliyor"* der. Evrenin ne oldugunu soylemiyor |
| "bir girdi, bildirim veya islem evreninde" | Uc kelime sadece **olaylari** kapsiyor; sepet, topluluk, zaman dilimi disarida |
| "birden fazla unsur iceren" | **"Unsur" patent dilinde istem unsuru demek** - karisiklik yaratir |
| "oge sayisi sabit veya artan" | "Artan" sabit evrenleri disliyordu |
| "sabit veya degisen ogeli" | **"Sabit" bos duruyor** - hicbir evren sabit degil, ogeler birikiyor. Otobuste 47 kisi sabit ama **inisler** birikiyor |
| **"birden fazla ogeden olusan"** | **KILITLENDI** |

**Kurucunun kapatici tespiti:** *"Secim varsa birden fazladir. Iki
olay/odeme/islem varsa secmek isin icine giriyor zaten."*

Yani **"birden fazla" secimin on kosulu** - tek oge varsa secim yok, yontem
calismiyor. Fazladan niteleme (sabit/degisen/artan) gereksiz.

### 30.4 Deger ifadesi - matematiksel yontem itirazina karsi

> **"tetikleyen taraf icin bir fayda, hak veya sonuc degeri"**

**Cozdugu sorun: SMK m.82.** "Bir deger ureten yontem" soyut sayi uretiyormus
gibi okunuyordu; ofis *"sayi uretmek matematiktir"* diyebilirdi. Yeni ifade
degerin **bir alicisi** ve **disarida bir etkisi** oldugunu gosteriyor.

**Elenen denemeler:**

| Deneme | Neden |
|---|---|
| "maddi ve/veya manevi deger" | "Manevi" olculemez; soyutlugu pekistiriyor |
| "pozitif deger" | **Sifiri disliyor** - dosyada aralik "0-50, sifir dahil"; kurucunun kendi sistemi istem disinda kalirdi |
| "girdi icin elde edilesi" | Girdi bir veridir, deger alamaz |
| "tetikleyiciye" | Tetikleyici bir **olaydir**, deger alamaz |
| **"tetikleyen taraf icin"** | **KABUL** - eylemi yapani gosteriyor |

### 30.5 TARIFNAMEYE yazilacaklar

**1. Oge tanimi:**
> *"Oge; evren icindeki her bir girdi, bildirim veya islemdir - bir kisi veya
> nesne degil, onlarin yol actigi olaydir. Ayni kisinin iki ayri girisi iki
> ayri ogedir. Bir satis noktasindaki her odeme islemi, bir sepetteki her
> kalem, bir stadyuma her giris, bir aractan her inis, bir dugmeye her basis,
> bir cevrimici magazaya her ziyaret bir ogedir; bunlarla sinirli degildir."*

**2. Evren tanimi:**
> *"Evren; bir yer, bir zaman araligi, bir olay veya bir toplulukla
> sinirlanabilir. Evrenin oge sayisi onceden bilinebilir (bir aractaki yolcu
> sayisi) veya bilinemez (bir magazaya gelecek ziyaretci sayisi); yontem her
> iki durumda uygulanabilir."*

Ikinci cumle kurucunun **512 itirazinin** (*"adam 512 ve 999 derse ne olacak"*)
istem disinda karsiligi.

**3. Ozellik tanimi (ACIK KAPATIR):**
> *"Ozellik; oge ile birlikte gelen veya ondan turetilebilen her turlu veriyi
> kapsar; kimlik, tutar, zaman, konum, sira, kanal, cihaz, siklik ve benzeri."*

Bu olmadan rakip *"biz ogenin ozelligini degil, geldigi kanali kullaniyoruz"*
diyebilir.

**4. Deger tanimi:**
> *"Deger; bir bedelden yapilacak indirim orani veya tutari, bir puan, bir
> kontor, bir hak, bir hizmet veya bir nesne olabilir; bunlarla sinirli
> degildir. Degerin sifir olmasi da bir sonuctur; bu durumda tetikleyen taraf
> bir dezavantaj yasamaz."*

Son cumle **piyango ayrimini** destekliyor: kaybeden yok.

### 30.6 KALAN ACIKLAR

| Acik | Durum |
|---|---|
| *"Bizde tetikleme yok, surekli dongu var"* | **Zayif kacis** - dongu de ogeyi gorunce uretiyor, yani tetikleniyor. Yazili birakiliyor |
| "Kapsam bulusu asiyor" (yazi-tura atan bakkal da kapsamda) | **Kabul edilen risk** - tek unsurlu istemde kacinilmaz. Yalnizca tarifname ile karsilanir |
| Deger alan taraf ile tetikleyen taraf ayni mi? | **ACIK SORU** - ucretsiz kod modelinde merkez tetikliyor, musteri aliyor. Farkli olabiliyorsa "tetikleyen taraf icin" ifadesi daraltiyor. **Kurucuya soruldu, cevap bekliyor** |

> **TEMEL KATMAN KILITLENDI. Geri donulmeyecek.**

---

## 31. TEMEL ISTEM - KESIN NIHAI METIN

> **Birden fazla ogeden olusacak bir evrende; bir ogenin evrene eklenmesi ile
> tetiklenen ve ogenin ozelliklerinden bagimsiz bir sekilde, tetikleyen taraf
> icin bir fayda, hak veya sonuc degeri ureten yontem.**

§30'u gunceller. Iki son duzeltme:

### 31.1 "tetiklemesi ile" -> "evrene eklenmesi ile tetiklenen"

**Cozdugu kacis:** "Tetikleme" soyut bir kelimeydi; rakip *"bizde tetikleme
yok, surekli dongu var - her 10 saniyede bakiyoruz"* diyebilirdi.

**"Evrene eklenme" gozlenebilir bir olay** - kisi indi, islem oldu, oge
eklendi. Dongu de ogeyi gorunce calisiyorsa yine eklenme aninda tetiklenmis
olur. Kacis kapandi.

"Tetiklenen" sifat-fiil olarak kaldigi icin **"tetikleyen taraf"** ifadesi de
dayanagini koruyor (tutarlilik sorunu cozuldu).

### 31.2 "olusan" -> "olusacak" — SIFIR BASLANGIC KUSURU

**Kurucunun yakaladigi celiski:** *"Evren baslangicta 0'dir."*

"Birden fazla ogeden **olusan** bir evrende" + "bir ogenin eklenmesi ile"
-> ilk oge eklendiginde evren 1, henuz birden fazla degil. Yontem ilk ogede
calismiyormus gibi okunuyor.

**Rakip bunu kullanir:** *"Bizde ilk ogeden itibaren calisiyor; sizin isteminiz
birden fazla oge sarti koyuyor."*

**Cozum: "olusacak"** - gelecek zaman, evrenin **kapasitesini** tarif ediyor,
mevcut durumunu degil. Evren bos baslayabilir, ilk ogede calisabilir, cokluk
on kosulu korunur.

**Elenen alternatifler:** "birden fazla oge alabilen" ("-abilen" unsuru
zayiflatir), "ogelerden olusan" ("birden fazla" kaybolur), "bir evrende"
(cokluk on kosulu kaybolur).

### 31.3 Istemin dort isi

| Soru | Cevap veren ifade |
|---|---|
| **Nerede** | Birden fazla ogeden olusacak bir evrende (secim mumkun) |
| **Ne zaman** | Ogenin evrene eklenmesi ile (gozlenebilir an, dongu kacisi kapali) |
| **Nasil** | Ogenin ozelliklerinden bagimsiz (kim/ne kadar/ne zaman karismiyor) |
| **Kime** | Tetikleyen taraf icin (soyut sayi degil, alicisi olan sonuc) |

Tasidigi tek unsur: **BAGIMSIZLIK.** Gerisi cerceve.

**Otobus sahnesi birebir:** inisler evreni, biri indi (oge eklendi), kim oldugu
etkisiz, inene bir deger.

> **TEMEL KATMAN KESIN KILITLI.**

---

## 32. TEMEL ISTEM - ONAYLI NIHAI METIN

> # TEMEL ISTEM
>
> **Birden fazla ogeden olusacak bir evrende; bir ogenin evrene eklenmesi ile
> tetiklenen ve ogenin, eklenmesine ve/veya kendisine has ozelliklerinden
> bagimsiz bir sekilde, tetikleyen taraf icin bir fayda, hak veya sonuc degeri
> ureten yontem.**
>
> **KURUCU ONAYI ALINDI.** §29, §30, §31'deki ara metinler bu metinle
> gecersizdir.

### 32.1 Son eklenen unsur - "eklenmesine ve/veya kendisine has"

Kurucunun son hamlesi. Eskiden yalnizca *"ogenin ozelliklerinden bagimsiz"*
yaziyordu; rakip su kacisi kullanabilirdi:

> *"Biz ogenin kendisine bakmiyoruz, eklenme sirasina/zamanina bakiyoruz."*

Iki ozellik kumesi ayri ayri kapatildi:

| Kume | Kapsadiklari |
|---|---|
| **Eklenme ozellikleri** | Zaman, sira, kacinci oge, hangi kanal, eklenme hizi |
| **Kendisine has ozellikler** | Kimlik, tutar, icerik, sahibi, konum |

"Ve/veya" iki kume arasinda dogru kullanim - ikisi de dahil, birini tek basina
karsilamak yeterli sayilmaz.

### 32.2 Baslangic ve bitis kiyasi

| | Oturum basi (§15.8) | Nihai |
|---|---|---|
| Metin | *"...hicbir tarafca onceden belirlenemez bir oran degeri ureten, sinir kosullarina bagli yontem"* | *"Birden fazla ogeden olusacak bir evrende; bir ogenin evrene eklenmesi ile tetiklenen ve ogenin, eklenmesine ve/veya kendisine has ozelliklerinden bagimsiz bir sekilde, tetikleyen taraf icin bir fayda, hak veya sonuc degeri ureten yontem"* |
| **Unsur sayisi** | **4** | **1** |
| Kapsam ("oran" -> "deger") | tutar/puan kacar | hepsi kapsamda |
| Belirsizlik ifadesi | "belirlenemez" - mugak, iki anlamli | "ozelliklerinden bagimsiz" - tek anlamli, test edilebilir |
| Zaman boyutu | yok | "eklenme ile tetiklenen" - dongu kacisi kapali |
| Matematik itirazi (m.82) | acik | "tetikleyen taraf icin fayda/hak/sonuc" ile kapali |

**Dort unsurdan tek unsura inildi ve kapsam genisledi** - patent mantiginda
dogru yon.

### 32.3 Tasidigi tek unsur

**BAGIMSIZLIK.** Geri kalan her sey cerceve:

| Soru | Cevap veren ifade |
|---|---|
| Nerede | Birden fazla ogeden olusacak bir evrende |
| Ne zaman | Ogenin evrene eklenmesi ile |
| **Nasil** | **Eklenmesine ve/veya kendisine has ozelliklerinden bagimsiz** |
| Kime | Tetikleyen taraf icin |
| Ne | Bir fayda, hak veya sonuc degeri |

### 32.4 TARIFNAMEYE YAZILACAKLAR (temel istem icin)

**1. Oge:**
> *"Oge; evren icindeki her bir girdi, bildirim veya islemdir - bir kisi veya
> nesne degil, onlarin yol actigi olaydir. Ayni kisinin iki ayri girisi iki
> ayri ogedir. Bir satis noktasindaki her odeme islemi, bir sepetteki her
> kalem, bir stadyuma her giris, bir aractan her inis, bir dugmeye her basis,
> bir cevrimici magazaya her ziyaret bir ogedir; bunlarla sinirli degildir."*

**2. Evren:**
> *"Evren; bir yer, bir zaman araligi, bir olay veya bir toplulukla
> sinirlanabilir. Evrenin oge sayisi onceden bilinebilir (bir aractaki yolcu
> sayisi) veya bilinemez (bir magazaya gelecek ziyaretci sayisi); yontem her
> iki durumda uygulanabilir."*

**3. Eklenme** (rakibin *"biz eklemiyoruz, goruyoruz"* kacisini kapatir):
> *"Eklenme; ogenin sisteme bildirilmesi veya sistem tarafindan algilanmasidir;
> ayri bir kayit islemi gerektirmez."*

**4. Ozellik** (rakibin *"biz kanali kullaniyoruz"* kacisini kapatir):
> *"Ozellik; oge ile birlikte gelen veya ondan turetilebilen her turlu veriyi
> kapsar. Kendisine has ozellikler; kimlik, tutar, icerik, sahip, konum ve
> benzeri. Eklenme ozellikleri; zaman, sira, kacinci oge oldugu, geldigi
> kanal, eklenme hizi ve benzeri."*

**5. Tetikleyen taraf** (ucretsiz kod modelini kapsar):
> *"Tetikleyen taraf; ogenin evrene eklenmesine yol acan kisi veya
> kurulustur. Uretilen deger, tetikleyen tarafa **veya onun yonlendirdigi
> ucuncu bir tarafa** yansitilabilir."*

**6. Deger:**
> *"Deger; bir bedelden yapilacak indirim orani veya tutari, bir puan, bir
> kontor, bir hak, bir hizmet veya bir nesne olabilir; bunlarla sinirli
> degildir. Degerin sifir olmasi da bir sonuctur; bu durumda tetikleyen taraf
> bir dezavantaj yasamaz."*

### 32.5 Kabul edilen risk

**"Kapsam bulusu asiyor"** itirazi - bu tanima yazi-tura atip indirim veren
bir bakkal da girer. Tek unsurlu istemde kacinilmaz.

Yalnizca **tarifname** ile karsilanir: teknik problem tanimi, dokuz yontem
tablosu (§15.2), piyango ayrimi (§14), mekanizmanin anlatimi.

**Beklenti:** bu istem muhtemelen reddedilecek; amaci siniri test etmek.
Reddedilirse alt katmanlar devralir.

### 32.6 SIRADA

**Katman 1'den itibaren tum istemler bu yeni govdeyle yeniden yazilacak.**
§28'deki tablo eski govdeye (*"Tanimlanmis veya tanimlanmamis bir evrende;
girdi veya bildirim tetiklemesi ile..."*) dayaniyor, guncellenecek.

Yeni ortak govde:
> *"Birden fazla ogeden olusacak bir evrende; bir ogenin evrene eklenmesi ile
> tetiklenen ve [UNSURLAR], tetikleyen taraf icin bir fayda, hak veya sonuc
> degeri ureten yontem."*

Sirasiyla: 1a (M), 1b (S), 1c (D), 1d (K) -> ucluler -> dortluler.

---

## 33. TEMEL ISTEM - EVREN BUYUKLUGU EKLENDI (v2)

> §32'yi gunceller.

### 33.1 GUNCEL METIN

> **Birden fazla ogeden olusacak ve buyuklugune karar verilebilen bir evrende;
> bir ogenin evrene eklenmesi ile tetiklenen ve ogenin, eklenmesine ve/veya
> kendisine has ozelliklerinden bagimsiz bir sekilde, tetikleyen taraf icin
> bir fayda, hak veya sonuc degeri ureten yontem.**

### 33.2 "Buyuklugune karar verilebilen" - BULUSUN CEKIRDEGI

**Kurucunun tanimi:** *"Benim bulusum bu kombinasyonu kurmak ve calistirmak."*

C(1.000.000, 2) hesabi icin evren buyuklugunun bilinmesi sart. Buyukluk
belirlenmezse kombinasyon kurulamaz -> **yontem calismaz.** Yani bu bir
niteleme degil, **isleyisin on kosulu.**

### 33.3 PIYANGODAN AYIRAN TAM NOKTA

| | Piyango | Bu yontem |
|---|---|---|
| Evren buyuklugu | **KESIN** (1.000.000 bilet basildi) | **KARAR** (1M varsayalim) |
| Havuz | Kapali | Acik |
| Gercek sayi | Buyuklukle ayni | **Farkli cikabilir** |

**Kritik:** *"buyuklugu bilinen"* yazilsa piyangonun **icine** girilirdi.
*"Buyuklugune karar verilebilen"* yazildigi icin yontem piyangoyu **kapsiyor
ama ona indirgenmiyor** - piyangonun kapsamadigi acik uclu evrenleri de aliyor.

| Evren | Buyukluk | Kapsamda |
|---|---|---|
| Otobus | 47, biliniyor | ✓ |
| Sinema | 1M, tahmin | ✓ |
| Cuma gunu magaza | Bilinmiyor, 1000 varsayilir | ✓ |
| Piyango | 1M, kesin | ✓ |

**Elenen alternatifler:**

| Deneme | Neden elendi |
|---|---|
| "buyuklugu ongorulebilir" | POS ve online'i disliyor - kurucunun ana ticari uygulamalari |
| "buyuklugu sinirlandirilabilir" | Islevsiz - her evren sinirlandirilabilir |
| "buyuklugu belirlenen" | Gercek sayiya mi karar verilen olcege mi isaret ettigi belirsiz |
| **"buyuklugune karar verilebilen"** | **KABUL - piyangodan ayiran sey bu** |

### 33.4 "Karar veren kim?" sorusuna cevap

**Yontemi uygulayan taraf** - isletme, sistemi kuran.

**Celiski yok**, cunku iki ayri karar:

| Karar | Kim verir | Sonuca etkisi |
|---|---|---|
| Evren buyuklugu (1M varsayalim) | **Isletme** | **Yok** |
| Hangi ogelere deger gidecegi | **Kimse** | — |

Dosyanin cekirdek ayrimi: *"miktar kontrollu, dagilim bilinmez."* Isletme
cerceveyi kurar, icindeki dagilimi bilmez.

**Tarifname cumlesi (§32.4'teki ozellik tanimina ek):**
> *"Kaynagin secilmesi, evren buyuklugune karar verilmesi veya sistemin
> kurulmasi etki sayilmaz; yalnizca ciktinin yonlendirilebilmesi etki
> sayilir."*

> *"Evren buyuklugu; gerceklesecek oge sayisinin kesin bilgisi degil, yontemi
> uygulayan tarafca belirlenen bir olcektir. Gercek oge sayisi bu olcekten
> farkli olabilir."*

### 33.5 Kacis tablosu - guncel

| Rakibin iddiasi | Kapsamda mi |
|---|---|
| "Donanim rastgeleligi kullaniyoruz" | **Iceride** - kaynak yazilmadi |
| "Blockchain'e bakiyoruz" | **Iceride** |
| "Gece uretip tabloya yaziyoruz" | **Iceride** - zaman yazilmadi |
| "Donguyle her 10 sn bakiyoruz" | **Iceride** - eklenmede tetikleniyor |
| "Indirim degil puan veriyoruz" | **Iceride** - "deger" |
| "Deger degil durum degistiriyoruz" | **Iceride** - "sonuc" |
| "Secim yapiyoruz" | **Iceride** - secim arac, sonuc doguyor |
| "Fiyat belirliyoruz" | **Iceride** - fiyat dusmesi fayda |
| "POS'ta degil lambada" | **Iceride** - ortam yazilmadi |
| "Kimlik kullaniyoruz" | **Iceride** - kimlik yasaklanmadi, etkisiz olmasi yeter |
| "20 kisi degil %0.1" | **Iceride** - sinir yazilmadi |
| "Sahibi sonucu ayarliyor" | **Iceride** - mercisizlik yazilmadi (1a'da giriyor) |
| "Tutara gore hesapliyoruz" | **Disarida** - bagimsizlik ihlali |
| "Siraya gore hesapliyoruz" | **Disarida** - ayni |

**12 iceride, 2 disarida.**

**O iki disaridakini iceri almak MUMKUN DEGIL:** bagimsizlik unsurunu silmek
gerekir, o zaman istem **sifir ayirt edici unsura** duser ve her sadakat
programi, kademeli iskonto, kupon sistemi, dinamik fiyatlama kapsama girer ->
ofis tek prior art gostererek reddeder.

**Ve o sistemler bu bulus degil** - girdiden tureten sistemler kurallidir,
bagimsizlik iddiasi tasimazlar.

### 33.6 Sira ve tutar - kurucunun netlestirmesi

**Kurucunun ifadesi:** *"Derdimiz iki sey: oge olmasi ve evren icinde
kalmasi."*

| | Sistemde var mi | Istemle uyumlu mu |
|---|---|---|
| Tutarin **varligi** | Tetikleyici (sepet olusumu) | ✓ "eklenmesi ile tetiklenen" |
| Tutarin **miktari** | Etkisiz (Urfa 100 / Istanbul 270 esit) | ✓ "ozelliklerinden bagimsiz" |
| Siranin **sayimi** | Sinir takibi icin | ✓ sayim girdi degil |
| Siranin **girdi olmasi** | **YOK** | ✓ istem disliyor, celiski yok |

**Kritik:** sayim ≠ girdi. Sistem evren icinde kalmak icin sayiyor, hangi
ogeye verecegini siradan turetmiyor. (Dun kaydedilen *"sayac ≠ kayit"*
ayriminin ayni mantigi.)

**Tarifname ornegi:**
> *"Bir filmin biletleri farkli sehirlerde farkli bedellerle satiliyor
> olabilir; yontem bakimindan her bilet alimi esit bir ogedir, bedelin miktari
> uretilen degeri etkilemez."*

### 33.7 Oge tanimina ek - kisi de oge olabilir

> *"Oge; evren icindeki her bir girdi, bildirim, islem veya katilimdir. Bir
> kisi de oge olabilir; ancak **ayni kisinin her gorunusu ayri bir ogedir** -
> sistem onceki gorunusleriyle bag kurmaz. Bir etkinlige katilim, bir aractan
> inis, bir odeme islemi, bir dugmeye basis birer ogedir; bunlarla sinirli
> degildir."*

**"Katilimci" terimi ELENDI:** (a) katilimci bir kisi, oge bir olay - kisi
sayilirsa kimliksizlikle celisir, rakip *"kisi sayiyorsaniz taniyorsunuz"*
der; (b) "katilim" gonullu eylem ima eder -> piyango/cekilis dili, prior art
alani; (c) LED lamba gibi makine uygulamalarini disliyor.

---

## 34. TEMEL İSTEM v3 — "k" EKLENDİ (kombinasyon tamamlandı)

### 34.1 GÜNCEL METİN

> **Birden fazla öğeden oluşacak ve büyüklüğüne karar verilebilen bir evrende;
> bir öğenin evrene eklenmesi ile tetiklenen ancak öğenin eklenmesine ve/veya
> kendisine has özelliklerinden bağımsız bir şekilde, sayısına karar
> verilebilen öğeler için özel bir fayda, hak veya sonuç değeri üreten
> yöntem.**

### 34.2 Kombinasyon tamamlandı: n ve k

Kurucunun buluş tanımı: *"Benim buluşum bu kombinasyonu kurmak ve
çalıştırmak."* C(n,k) için iki parametre gerekiyordu:

| Parametre | İstem ifadesi | Niteliği |
|---|---|---|
| **n** (evren) | "büyüklüğüne karar verilebilen bir evrende" | **Karar**, kesin bilgi değil |
| **k** (seçilen) | "sayısına karar verilebilen öğeler için" | **Karar**, sabit sayı değil |

**İkisi de "karar"** — piyangodan ayrım bu paralellikte: piyangoda n (basılı
bilet) ve k (ödül sayısı) **kesin ve ilan edilmiş**; burada ikisi de karar ve
tur tur değişebilir (dosyadaki tespit: *"bu tur 3 kuzu çıkar, sonraki tur 0"*).

### 34.3 "ve" → "ancak" (kurucu düzeltmesi)

*"...ile tetiklenen **ancak** öğenin ... özelliklerinden bağımsız..."*

"Ancak" tetikleme ile bağımsızlık arasındaki **karşıtlığı** gösteriyor:
tetikliyor ama etkilemiyor. "Ve" bunu düz bir liste gibi okutuyordu.

### 34.4 "Özel" kelimesi — eşit dağıtımı dışlıyor

*"...öğeler için **özel** bir fayda..."*

k öğenin aldığı şey diğerlerinden farklı. Bu, §15.2 dokuz yöntem
tablosundaki **1. satırı (eşit dağıtım)** dışlıyor: "herkese %10 indirim"
kapsam dışında.

**Elenen alternatifler:**

| Deneme | Neden |
|---|---|
| "farklı değerler üreten" | **Yanlışlanabilir** — rastgelelikte iki öğe aynı değeri alabilir, o an iddia çöker (1+9 aynı sebeple elenmişti) |
| "eşit veya farklı değerler üreten" | **Hiçbir şeyi dışlamıyor** — her sistem ya eşit ya farklı üretir; ayrıca eşit dağıtımı geri içeri alıyor |
| "birbirinden bağımsız değerler" | k belirliyse kalan öğelerin sıfır olduğu zaten belli; yapıyı yanlış tarif ediyor |
| **"sayısına karar verilebilen öğeler için özel"** | **KABUL** — hem k'yı hem farklılığı taşıyor, yanlışlanamaz |

---

## 35. LEHTE ARGÜMANLAR — tarifnameye yazılacak

### 35.1 ORTAM BAĞIMSIZLIĞI TESTİ — en güçlü argüman

**Soru:** Mevcut yöntemler bir lambaya, bir otobüse ve bir sinema biletine
**aynı şekilde** uygulanıp aynı sonucu verir mi?

| Yöntem | Lamba | Otobüs | Sinema | Sonuç |
|---|---|---|---|---|
| **Piyango** | ✗ | ✗ | Kısmen | Bilet basmak, dağıtmak, kura çekmek, ilan etmek gerekir. İnen kişi bilet almamış |
| **Çekiliş** | ✗ | ✗ | ✗ | Katılım eylemi gerekiyor (form, kayıt). İnen kişi hiçbir şey doldurmuyor |
| **Kumar makinesi** | Kısmen | ✗ | ✗ | Kol çekme eylemi + bedel şart; ayrıca her basışta sonuç verir, k dışındakiler sonuç almaz |
| **Rastgele ödül** (US2014/0149200A1) | ✗ | ✗ | ✗ | Program süresince çalışıyor; evren tanımı ve k yok |
| **Kontenjanlı kupon** (US20130144700A1) | ✗ | ✗ | Kısmen | Rastgelelik yok — hızlı olan alır |
| **BU YÖNTEM** | **✓** | **✓** | **✓** | **Tek mekanizma, üç ortam, uyarlama gerekmiyor** |

| | Evren | Öğe | k |
|---|---|---|---|
| Lamba | Basışlar | Her basış | 100'de 2 |
| Otobüs | İnişler | Her iniş | 47'de 2 |
| Sinema | Bilet alımları | Her alım | 1M'de 5 |

**Patent dilindeki karşılığı:** *"teknik problemin genel çözümü."* Aşikârlık
itirazına karşı güçlü cevap: **mevcut yöntemler ortama bağımlıdır, bu yöntem
ortamdan bağımsızdır.**

### 35.2 PİYANGONUN YAPISAL KUSURU — satılmayan bilet

**Kurucunun tespiti:** *"Piyangonun satılmayan bilete isabet etmesi oranı
değiştirmiyor mu?"*

| | Piyango | Bu yöntem |
|---|---|---|
| Evren | 1M bilet **basılı** | Öğeler **gerçekleşiyor** |
| Satılmayan/oluşmayan | 400 bin hayalet bilet | **Yok** — öğe varsa gerçektir |
| Ödül | Satılmayan bilete isabet edebilir → **boşa gider** | Boşa gitmez |
| Katılanın gerçek şansı | İlan edilenden **farklı** | İlan edilenle **aynı** |
| İhtimalin doğuş anı | Baskıda, önceden dağıtılmış | **Öğe geldiğinde** |

**Kaynağı:** kurucunun *"oluşacak evren"* ifadesi. Piyangoda evren baştan var
(basılı biletler), burada **oluşuyor** (gerçekleşen öğeler).

**Sonuç:** her öğe gerçek, her öğe aday, boşa giden ihtimal yok. "Her biri
için geçerli" olmasının yapısal sebebi bu.

### 35.3 Şans oyunu / kumar farkları — üç yapısal ayrım

| # | Ayrım | Kumar/şans oyunu | Bu yöntem |
|---|---|---|---|
| 1 | **Katılım eylemi** | Para at, kol çek — ayrı eylem, ayrı bedel | **Yok** — öğe zaten oluşuyor (alışveriş, iniş) |
| 2 | **Kaybetme** | Ortaya konan var, kaybedilebilir | **Yok** — k dışındakiler bir şey kaybetmiyor, ödediği zaten normal bedel |
| 3 | **Olasılık sabitliği** | Sabit ve tanımlı (çarklar, RTP oranı) | n ve k **karar**; gerçek sayı farklı çıkabilir |

İstemdeki karşılığı (1. ayrım): *"bir öğenin evrene eklenmesi ile tetiklenen"*
— eklenme zaten olan bir şey, oyuna girme eylemi değil.

### 35.4 Buluşun özü — tek cümle

**Ayrıcalığı hak edişten kopararak, ama sayısını kontrol altında tutarak
dağıtan yöntem.**

Mevcut yöntemlerin **hepsi** ayrıcalığı bir nitelikten türetir:

| Yöntem | Ayrıcalık neye dayanır |
|---|---|
| Sadakat | Harcama |
| Kampanya | Zaman |
| İlk gelen | Hız |
| Yarışma | Performans |
| Jüri | Değerlendirme |
| Piyango | Bilet alma |
| **Bu yöntem** | **Hiçbirine** |

Teknik problem: *bir topluluktan belirli sayıda birime ayrıcalık tanımak, ancak
bu ayrıcalığı o birimlerin niteliklerine dayandırmamak.*

---

## 36. ALEYHTE RİSKLER — UYARILAR

> Bu bölüm başvuru öncesi mutlaka okunacak. Lehte argümanlar §35'te.

### 36.1 ⚠️ AŞİKÂRLIK İTİRAZI — en büyük tehdit

Ofis diyebilir: *"Kumar makinesi, piyango, rastgele ödül, kontenjanlı kupon —
hepsi biliniyor. Bunları birleştirmek aşikâr."*

**Dosyanın kendi tespiti (§4):** *"Her bileşen ayrı ayrı var, üçü bir arada
bulunamadı."* Yani buluş bir **birleşim** ve birleşim patentlerinin klasik
duvarı aşikârlıktır.

**Savunma:** §35.1 (ortam bağımsızlığı) + §35.4 (ayrıcalığın hiçbir niteliğe
dayanmaması) + n ve k'nın karar olması.

**Dürüst değerlendirme:** Ayrım gerçek ama **ince.** Ofis "önemsiz varyasyon"
diyebilir. Garanti yok.

### 36.2 ⚠️ Temel istem yakın ailelere komşu

Bu cümle şu patent ailelerine **yakın duruyor**, birebir aynı değil:

| Aile | Ortak yanı | Fark |
|---|---|---|
| Kumar makinesi RNG patentleri | Özellikten bağımsız seçim | Katılım eylemi + bedel; olasılık sabit |
| Piyango mekanizma patentleri | n ve k var | İkisi de kesin ve ilan edilmiş |
| US2014/0149200A1 | Rastgele ödül | Program süresince, bildirim bazında değil |
| US20130144700A1 | k var | Rastgelelik yok |

⚠️ **Kumar makinesi patentleri mekanizma patentidir** (RNG, çark sıralaması,
ödeme hesabı) ve temel isteme prior art olarak çıkabilir. Çünkü bu cümledeki
*"özelliklerinden bağımsız değer üretmek"* kumar makinesinin yaptığı şeyin de
tarifi.

### 36.3 ⚠️ Ayrımı kalınlaştıran unsurlar temel istemde YOK

| Unsur | Temel istemde | Nerede |
|---|---|---|
| Mercisizlik (sahibi de bilmiyor) | ✗ | Katman 1 (1a) |
| Kimliksizlik (kimlik hiç girmiyor) | ✗ | Katman 1 (1d) |
| Durumsuzluk (geçmiş taşınmıyor) | ✗ | Katman 1 (1c) |

**Sonuç:** temel istem yakın duruyor, **alt katmanlar ayrımı kalınlaştırıyor.**
17 istem adayının gerekçesi bu.

### 36.4 ⚠️ "Eşit ihtimal" istemde YAZILMADI — bilinçli

Kurucunun tespiti doğru ve lehte (§35.2): her öğe için eşit ihtimal var,
piyangoda yok.

**Ama isteme yazılmadı, çünkü:**
1. Ağırlıklı dağıtım yapan rakip **serbest kalır** (dün "kapsayıcılık" unsuru
   aynı sebeple elenmişti)
2. ⚠️ **Çelişki riski:** 1M öğeye eşit ihtimal verilecek ama k=5 seçilecekse,
   sistem 1M'i beklemek zorunda — yoksa ilk öğelere daha çok şans vermiş olur.
   Ofis bunu sorabilir.

**Karar:** istemde yazılmaz, tarifnamede piyango kıyası olarak anlatılır —
orada güçlü argüman, istemde yük.

### 36.5 ⚠️ Kapsam dışında kalan iki hal — geri alınamaz

| Rakip | Durum |
|---|---|
| "Tutara göre hesaplıyoruz" | **Dışarıda** |
| "Sıraya göre hesaplıyoruz" | **Dışarıda** |

**İçeri almak mümkün değil:** bağımsızlık unsurunu silmek gerekir, o zaman
istem **sıfır ayırt edici unsura** düşer ve her sadakat programı, kademeli
iskonto, kupon sistemi, dinamik fiyatlama kapsama girer → tek prior art ile
ret.

Ve o sistemler **bu buluş değil** — girdiden türeten sistemler kurallıdır.

### 36.6 ⚠️ Matematiksel yöntem itirazı (SMK m.82)

*"Bir değer üreten yöntem"* soyut sayı üretiyormuş gibi okunabilir.

**Karşılanma:** *"tetikleyen taraf için bir fayda, hak veya sonuç değeri"* —
değerin alıcısı ve dışarıda etkisi var.

⚠️ Yine de ofis *"farklı sayılar üretmek matematiktir"* diyebilir. Tarifnamede
değerin bir bedele/duruma uygulandığı açıkça gösterilmeli.

### 36.7 ⚠️ Önceden yayımlama — EN ACELE RİSK

**TR'de 12 ay hoşgörü var, uluslararasında YOK.**

Jestopya'yı sahaya sürmek, sistemi canlıya almak, yatırımcıya anlatmak —
hepsi **yayım** sayılabilir ve kendi yeniliğini öldürür.

> **Başvuru, sahaya çıkıştan ÖNCE yapılmalı.**

---

## 37. TEMEL İSTEM — KELİME KELİME TARİFNAME NOTU

> Bu bölüm vekille yapılacak görüşme için yazıldı. Amaç: istemdeki **her
> kelimenin** neden orada olduğunu, hangi kaçışı kapattığını ve hangi
> alternatifin neden elendiğini, konuyu hiç bilmeyen biri de anlayacak
> şekilde göstermek.

### 37.0 İSTEM

> **Birden fazla öğeden oluşacak ve büyüklüğüne karar verilebilen bir evrende;
> bir öğenin evrene eklenmesi ile tetiklenen ancak öğenin eklenmesine ve/veya
> kendisine has özelliklerinden bağımsız bir şekilde, sayısına karar
> verilebilen öğeler için özel bir fayda, hak veya sonuç değeri üreten
> yöntem.**

**Önce basit anlatım:** Bir yerde bir sürü şey oluyor (insanlar iniyor, ödeme
yapılıyor, düğmeye basılıyor). Bunlardan birkaçına özel bir şey veriyoruz.
Kime verileceği, o şeyin hiçbir özelliğine bakılarak seçilmiyor — kim olduğu,
ne kadar harcadığı, kaçıncı olduğu hiçbir şey ifade etmiyor. Kaç kişiye
verileceğine ve kalabalığın ne kadar olduğuna biz karar veriyoruz, ama kimin
alacağına kimse karar vermiyor.

---

### 37.1 "Birden fazla"

**Ne diyor:** Evrende en az iki öğe olacak.

**Neden var:** Seçim ancak çoklukta olur. Tek bir öğe varsa "seçmek" diye bir
şey yoktur, yöntem çalışmaz. Kurucunun ifadesi: *"Seçim varsa birden fazladır.
İki olay/ödeme/işlem varsa seçmek işin içine giriyor zaten."*

**Olmasa ne olurdu:** Ofis *"tek öğeli bir evrende bu yöntem nasıl çalışır"*
diye sorardı. Ayrıca "seçim" iddiası dayanaksız kalırdı.

---

### 37.2 "öğeden"

**Ne diyor:** Evrenin içindekilere "öğe" diyoruz.

**Öğe nedir:** Olan bir şey — bir iniş, bir ödeme, bir giriş, bir basış.
**Bir kişi veya nesne DEĞİL, onların yol açtığı olay.**

**Neden "öğe", neden "katılımcı" değil:**

| Terim | Sorun |
|---|---|
| "katılımcı" | (a) Kişi sayar → aynı kişiyi iki kez görse tek katılımcı sayması gerekir → **kimliksizlik iddiası çöker**, rakip *"kişi sayıyorsanız tanıyorsunuz demektir"* der. (b) "Katılım" gönüllü eylem ima eder → piyango/çekiliş dili, prior art alanı. (c) LED lamba gibi makine uygulamalarını dışlar |
| "kişi" | Aynı sorunlar + ticari işlemleri dışlar |
| "işlem" | Sadece ticari olanı kapsar; iniş, basış dışarıda kalır |
| **"öğe"** | Nötr. Olay, özne, işlem hepsini kapsar |

**Kritik nüans:** Kişi de öğe olabilir — **ama her görünüşü ayrı bir öğedir.**
Aynı kişi 40 kez gelse 40 öğe olur; sistem önceki görünüşleriyle bağ kurmaz.
Bu, kimliksizlik iddiasıyla tutarlılığı korur.

---

### 37.3 "oluşacak"

**Ne diyor:** Evren zamanla dolacak; öğeler tek tek eklenerek birikecek.

**Neden "oluşan" değil, "oluşacak":** Kurucunun yakaladığı kusur: *"Evren
başlangıçta 0'dır."*

"Birden fazla öğeden **oluşan** bir evrende" + "bir öğenin eklenmesi ile"
denirse mantık çelişir: ilk öğe eklendiğinde evren 1 tanedir, henüz "birden
fazla" değildir. Yöntem ilk öğede çalışmıyormuş gibi okunur.

**Rakip bunu kullanır:** *"Bizde ilk öğeden itibaren çalışıyor; sizin isteminiz
birden fazla öğe şartı koyuyor, biz o şartı karşılamıyoruz."*

**"Oluşacak" ne yapıyor:** Gelecek zaman, evrenin **kapasitesini** tarif ediyor,
o anki durumunu değil. Evren boş başlayabilir, ilk öğede çalışabilir, çokluk
ön koşulu korunur.

**Elenen alternatifler:** "birden fazla öğe alabilen" (-abilen eki unsuru
zayıflatır), "öğelerden oluşan" ("birden fazla" kaybolur), "bir evrende"
(çokluk ön koşulu kaybolur).

**Ayrıca piyangodan ayırıyor:** Piyangoda evren baştan **vardır** (biletler
basılmıştır). Burada **oluşur** (öğeler gerçekleştikçe). Bu, §35.2'deki
"satılmayan bilet" argümanının temelidir.

---

### 37.4 "ve büyüklüğüne karar verilebilen"

**Ne diyor:** Evrenin ne kadar büyük sayılacağına biri karar veriyor.

**Neden gerekli:** Buluşun özü kombinasyon kurmak — C(n,k). "n"yi bilmeden
kombinasyon kurulamaz. Kurucunun örneği: *"adam 512 ve 999 derse ne olacak"* —
47 kişilik otobüste 512 anlamsızdır. Yani üretim, evren büyüklüğü belirlendikten
sonra ve o aralıkta yapılır.

**Neden "bilinen" değil, "karar verilebilen" — EN KRİTİK AYRIM:**

| İfade | Sonuç |
|---|---|
| "büyüklüğü **bilinen**" | **Piyangonun içine girer** — orada 1.000.000 bilet kesin olarak basılmıştır |
| "büyüklüğü **öngörülebilen**" | POS ve online uygulamaları dışlar (cuma günü kaç kişi geleceği bilinemez) |
| "büyüklüğü **sınırlandırılabilir**" | İşlevsiz — her evren sınırlandırılabilir |
| **"büyüklüğüne karar verilebilen"** | **Hepsini kapsar** |

**Kurucunun tespiti:** *"Evren büyüklüğü bilinmiyor ya. Ben nerden bileyim cuma
günü kaç kişi alışveriş yapacak. En fazla tahmin edilebilir."*

Yani bu bir **bilgi** değil, bir **karar**:

| Uygulama | Büyüklük | Nasıl |
|---|---|---|
| Otobüs | 47 | Biliniyor |
| Sinema | 1.000.000 | Tahmin |
| Cuma günü mağaza | 1.000 | Varsayım |
| Piyango | 1.000.000 | Kesin |

Dördü de kapsamda. **Gerçek sayı, karar verilen ölçekten farklı çıkabilir** —
cuma günü 800 kişi gelir, sen 1000 varsaymışsındır, kombinasyon 1000 üzerinden
kurulmuştur. Piyangoda böyle bir esneklik yoktur.

**"Karar veren kim?" sorusuna cevap:** Yöntemi uygulayan taraf — işletme.
**Bu bir çelişki yaratmaz**, çünkü iki ayrı karar vardır:

| Karar | Kim verir | Sonuca etkisi |
|---|---|---|
| Evren büyüklüğü ("1M varsayalım") | İşletme | **YOK** |
| Hangi öğelere değer gideceği | **Kimse** | — |

Dosyanın çekirdek ayrımı: *"miktar kontrollü, dağılım bilinmez."* İşletme
çerçeveyi kurar, içindeki dağılımı bilmez. Tarifnameye yazılacak cümle:
*"Kaynağın seçilmesi, evren büyüklüğüne karar verilmesi veya sistemin
kurulması etki sayılmaz; yalnızca çıktının yönlendirilebilmesi etki sayılır."*

---

### 37.5 "bir evrende"

**Ne diyor:** Yöntem bir sınırlı küme içinde çalışır.

**Evren nedir:** Bir yer, bir zaman aralığı, bir olay veya bir toplulukla
sınırlanmış öğeler kümesi. Otobüs, konser, bir şehir, cuma günü, bir web
sitesi, bir satış noktası.

**Neden "bağlam" değil "evren":** "Bağlam" durum/koşul çağrıştırıyor; "evren"
**sayılabilir bir küme** demek. Kombinasyon ancak sayılabilir bir kümede
kurulur.

**Neden tekil ("bir evrende"):** Patent isteminde tekil yazım çoğulu da
kapsar. "Evrenlerde" yazılsa rakip *"bizde tek evren var"* diyebilirdi.

**Not:** "Tanımlanmış veya tanımlanmamış bir evrende" ifadesi önce denendi,
sonra atıldı — hiçbir şeyi dışlamadığı için ofis *"bu unsur ne sınırlıyor"*
diye sorardı. "Büyüklüğüne karar verilebilen" onun yerini aldı ve gerçek bir
şey söylüyor.

---

### 37.6 "bir öğenin evrene eklenmesi ile tetiklenen"

**Ne diyor:** Yöntem, bir öğe evrene katıldığı anda çalışır.

**Neden "tetiklemesi ile" değil, "eklenmesi ile tetiklenen":**

"Tetikleme" soyut bir kelimeydi. Rakip şöyle kaçabilirdi: *"Bizde tetikleme
yok, sürekli çalışan bir döngü var — her 10 saniyede bakıyoruz."*

**"Evrene eklenme" gözlenebilir bir olaydır** — kişi indi, işlem oldu, öğe
eklendi. Döngü de öğeyi gördüğünde çalışıyorsa, yine eklenme anında
tetiklenmiş olur. Kaçış kapanır.

**"Eklenme" ne demek (tarifnameye):** *"Eklenme; öğenin sisteme bildirilmesi
veya sistem tarafından algılanmasıdır; ayrı bir kayıt işlemi gerektirmez."*
Bu cümle olmadan rakip *"biz eklemiyoruz, sadece görüyoruz"* diyebilir.

**Kumar/şans oyunundan ayıran ilk nokta:** Kumar makinesinde oyuna girmek için
**ayrı bir eylem** gerekir (para at, kol çek). Burada öğe zaten oluşuyor —
alışveriş yapıyorsun, otobüsten iniyorsun. Oyuna girmek için hiçbir şey
yapmıyorsun, bedel ödemiyorsun.

---

### 37.7 "ancak"

**Ne diyor:** Tetikliyor **ama** etkilemiyor.

**Neden "ve" değil "ancak":** Kurucunun düzeltmesi. "Ve" iki ifadeyi düz bir
liste gibi okutuyordu. "Ancak" aradaki **karşıtlığı** gösteriyor: öğe yöntemi
başlatıyor, fakat o öğenin ne olduğu sonucu belirlemiyor.

Bu, istemin en kolay yanlış anlaşılacak yerini netleştiriyor — ofis
*"tetikliyorsa etkiliyor demektir"* diye okumasın diye.

---

### 37.8 "öğenin eklenmesine ve/veya kendisine has özelliklerinden bağımsız bir şekilde"

**Ne diyor:** Üretilen değer, öğenin hiçbir niteliğinden türetilmiyor.

**Bu istemin TEK AYIRT EDİCİ UNSURU.** Geri kalan her şey çerçeve.

**İki özellik kümesi, neden ayrı ayrı yazıldı:**

| Küme | Kapsadıkları |
|---|---|
| **Eklenme özellikleri** | Zaman, sıra, kaçıncı öğe olduğu, geldiği kanal, eklenme hızı |
| **Kendisine has özellikler** | Kimlik, tutar, içerik, sahip, konum |

**Olmasa ne olurdu:** Sadece "öğenin özelliklerinden bağımsız" yazılsa, rakip
şöyle kaçardı: *"Biz öğenin kendisine bakmıyoruz, eklenme sırasına/zamanına
bakıyoruz."* Şimdi ikisi de kapalı.

**"ve/veya" neden:** İki kümenin ikisi de dahil; birini tek başına karşılamak
yeterli sayılmasın diye.

**"Özellik" ne demek (tarifnameye):** *"Özellik; öğe ile birlikte gelen veya
ondan türetilebilen her türlü veriyi kapsar."* Bu cümle olmadan rakip *"biz
özelliğini değil kanalını kullanıyoruz"* diyebilir.

**İfadenin uzun evrimi — sekiz deneme:**

| # | Deneme | Neden düştü |
|---|---|---|
| 1 | "hiçbir tarafça önceden belirlenemez" | Muğlak — hesaplanamayan mı, atanmamış mı? |
| 2 | "kimsenin belirleyemediği bir kaynaktan" | **Türkçe azizliği:** "belirlemek" iki anlamlı — kaynağı seçmek VEYA çıktıyı öngörmek. Rakip *"kaynağı ben belirledim"* der |
| 3 | "bildirimden önce mevcut olmayan" | Net ama **dar** — "zarf yöntemini" (gece üretip tabloya yazma) kapsamdan çıkarıyor |
| 4 | "önceden tanımlanmamış" | Muğlak — neye göre tanımsız? |
| 5 | "bu girdiye önceden atanmamış" | **Kurucunun itirazı:** *"sanki atanmalıydı da atanmayanı biz atıyoruz gibi"* — değerin zaten var olduğunu ima ediyor |
| 6 | "girdi ile ilişkisiz ve tamamen bağımsız" | Tekrar + "tamamen bağımsız" neyden bağımsız olduğu belirsiz |
| 7 | "girdi tetiklemesinden bağımsız" | **Mantık çelişkisi:** tetikleme ile ama tetiklemeden bağımsız? |
| 8 | "girdinin özellikleriyle **ilişkisiz**" | Bir **durum** tarif ediyor; rakibe kapı: *"bizde dolaylı ilişki var ama doğrudan değil"* |
| **9** | **"özelliklerinden bağımsız"** | **KABUL** — bir **tabiyeti** reddediyor, dolaylı ilişki de kapanıyor |

**Tutarın özel durumu — kurucunun netleştirmesi:**

| | Durum | İstemle ilişkisi |
|---|---|---|
| Tutarın **varlığı** | Tetikleyici (sepetin oluşması) | "eklenmesi ile tetiklenen" |
| Tutarın **miktarı** | Etkisiz | "özelliklerinden bağımsız" |

Kurucunun örneği: *"Bilet fiyatı sabit değil — Urfa'da 100, İstanbul'da 270."*
İkisi de eşit birer öğedir, bedelin miktarı üretilen değeri etkilemez.
Kademeli iskonto olsaydı İstanbul'a daha çok indirim verirdi; burada eşit.

**Sıranın özel durumu:** Sistem evren içinde kalmak için **sayar**, ama hangi
öğeye vereceğini sıradan **türetmez.** Yani sayım ≠ girdi. (Dosyada daha önce
kaydedilen "sayaç ≠ kayıt" ayrımının aynı mantığı.) Kurucunun ifadesi:
*"Derdimiz iki şey: öğe olması ve evren içinde kalması."*

**Bu unsurun bedeli (§36.5):** "Tutara göre hesaplıyoruz" ve "sıraya göre
hesaplıyoruz" diyen rakipler **kapsam dışında** kalır. Bu geri alınamaz —
içeri almak için bu unsuru silmek gerekir, o zaman istem sıfır ayırt edici
unsura düşer ve her sadakat programı, kademeli iskonto, kupon sistemi,
dinamik fiyatlama kapsama girer → tek prior art ile ret. Ve o sistemler bu
buluş değildir; girdiden türeten sistemler kurallıdır.

---

### 37.9 "sayısına karar verilebilen öğeler için"

**Ne diyor:** Kaç öğeye değer verileceğine karar veriliyor.

**Neden gerekli:** Kombinasyonun "k" parametresi. C(n,k) için n yetmez, k de
gerekir. n § 37.4'te geldi, k burada.

**Neden "karar verilebilen" (n ile aynı kalıp):** Piyangoda ödül sayısı
**ilan edilmiş ve sabittir** (1 büyük ikramiye, 10 amorti). Burada k'ya karar
verilir ve tur tur değişebilir — dosyadaki tespit: *"bu tur 3 kuzu çıkar,
sonraki tur 0."*

**n ve k'nın ikisinin de "karar" olması**, piyangodan ayrımın matematiksel
temelidir: orada ikisi de kesin, burada ikisi de karar.

**Neden sabit sayı yazılmadı:** "2 öğe için" veya "%0.1 için" yazılsa rakip
başka bir sayı/oran kullanarak kaçardı — kurucunun "10 değil 11 hamle" olarak
adlandırdığı dolanma yolu.

---

### 37.10 "özel"

**Ne diyor:** O k öğenin aldığı şey, diğerlerinden farklıdır.

**Neden gerekli:** Eşit dağıtımı dışlıyor. "Herkese %10 indirim" bu yöntem
değildir — §15.2'deki dokuz yöntem tablosunun 1. satırı (eşit dağıtım)
kapsam dışında kalır.

**Elenen alternatifler:**

| Deneme | Neden |
|---|---|
| "farklı değerler üreten" | **Yanlışlanabilir** — rastgelelikte iki öğe aynı değeri alabilir; o an iddia çöker. (Aynı sebeple "aynı girdi aynı sonucu vermez" ifadesi de elenmişti) |
| "eşit veya farklı değerler üreten" | **Hiçbir şeyi dışlamıyor** — her sistem ya eşit ya farklı üretir. Ayrıca eşit dağıtımı geri içeri alıyor |
| "birbirinden bağımsız değerler" | k belirliyse kalan öğelerin sıfır olduğu zaten bellidir; yapıyı yanlış tarif ediyor |
| **"özel"** | **KABUL** — farklılığı söylüyor ama yanlışlanamıyor |

---

### 37.11 "bir fayda, hak veya sonuç değeri üreten"

**Ne diyor:** Üretilen şeyin bir alıcısı ve dışarıda bir etkisi var.

**Neden "bir değer" tek başına yetmedi — SMK m.82:** Matematiksel yöntemler
patent dışıdır. "Bir değer üreten yöntem" soyut bir sayı üretiyormuş gibi
okunur; ofis *"sayı üretmek matematiktir, patentlenemez"* diyebilir.

"Fayda, hak veya sonuç" üçlüsü değerin **dışarıda bir etkisi** olduğunu
gösteriyor → teknik sonuç → itiraz istemin kendisinde karşılanıyor.

**Üçlünün kapattığı kaçışlar:**

| Rakip ne der | Sonuç |
|---|---|
| "Biz indirim değil puan veriyoruz" | Kapsamda — "değer" |
| "Biz değer değil durum değiştiriyoruz" | Kapsamda — "sonuç" |
| "Biz sadece bir seçim yapıyoruz" | Kapsamda — seçim araç, sonuç doğuyor |
| "Biz fiyat belirliyoruz, değer vermiyoruz" | Kapsamda — fiyatın düşmesi faydadır |

**Elenen alternatifler:**

| Deneme | Neden |
|---|---|
| "maddi ve/veya manevi değer" | "Manevi" ölçülemez → belirsizlik itirazı; ayrıca soyutluğu pekiştiriyor |
| "pozitif değer" | **Sıfırı dışlıyor!** Dosyada aralık "0-50, sıfır dahil" — kurucunun kendi sistemi istem dışında kalırdı |
| "girdi için elde edilesi değer" | Girdi bir veridir, değer alamaz |

**Değer nedir (tarifnameye):** *"Bir bedelden yapılacak indirim oranı veya
tutarı, bir puan, bir kontör, bir hak, bir hizmet veya bir nesne olabilir;
bunlarla sınırlı değildir. Değerin sıfır olması da bir sonuçtur; bu durumda
tetikleyen taraf bir dezavantaj yaşamaz."*

Son cümle **piyango ayrımını** destekler: kaybeden yok.

---

### 37.12 "tetikleyen taraf için"

**Ne diyor:** Değer, öğeyi oluşturan tarafa gider.

**Neden "öğe için" değil:** Öğe bir **olaydır**, değer alamaz. "Öğeye değer
vermek" ofiste soru doğurur: *"öğe bir olaysa değeri kim alıyor?"*

**Neden "tetikleyiciye" değil:** Aynı sorun — tetikleyici de bir olaydır.

**Esneklik (tarifnameye):** *"Tetikleyen taraf; öğenin evrene eklenmesine yol
açan kişi veya kuruluştur. Üretilen değer, tetikleyen tarafa **veya onun
yönlendirdiği üçüncü bir tarafa** yansıtılabilir."*

Son kısım, kurucunun ücretsiz kod modelini kapsar: güzellik merkezi kodu
üretir (tetikler), müşterisi değeri kullanır.

---

### 37.13 "yöntem"

**Ne diyor:** Korunan şey bir usuldür, bir cihaz veya yazılım değil.

**Neden "sistem" değil:** "Sistem" cihaz/yazılım çağrıştırır ve patenti o
ortama bağlar. **Yöntem istemi ortamdan bağımsızdır** — POS'ta, turnikede,
LED lambada, mobilde, bulutta çalışsın; yöntemi kullanan ihlal eder.

**LED lamba testi:** Yöntem bir lambaya yüklenirse — basış = öğe, basan kim
olduğu etkisiz, 100 basışta 2 yanma = n ve k. Dört unsur tam, **kapsamda.**
Patent yöntemi korur, cihazı korumaz; lamba üreticisi lamba satmaya devam
eder, yöntemi uygulayan ihlal eder.

**Neden "dağıtım" veya "eşleştirme" değil:**

| Terim | İma ettiği | Bu yöntemde |
|---|---|---|
| "dağıtım" | Hazır bir havuzdan pay vermek | Havuz yok, değer o anda üretiliyor |
| "eşleştirme" | İki hazır liste arasında bağ kurmak | İkisi de yok |
| "seçim" | Var olanlar arasından ayıklamak | Üretim var |
| **"üretme"** | O anda oluşturma | **Doğru** |

---

### 37.14 İSTEMDE BİLİNÇLİ OLARAK YAZILMAYANLAR

Her kelime bir kaçış kapısı olduğu için şunlar **kasten dışarıda bırakıldı:**

| Yazılmayan | Neden |
|---|---|
| **Sayı** (2 öğe, %0.1) | Rakip başka sayı kullanır — "10 değil 11 hamle" dolanması |
| **Kaynak adı** (donanım, blockchain, rastgele sayı üreteci) | Kurucunun tespiti: *"bunu bir şeye bağlarsan, başkası da başka bir şeye bağlar."* Donanım yazılsa rakip blockchain'e, blockchain yazılsa donanıma bağlar |
| **Zamanlama** ("işlem anında üretilir") | "Gece üretip tabloya yazma" yöntemini kapsamdan çıkarırdı |
| **Tür adı** (indirim, ödül, piyango, çekiliş) | Her tür adı bir prior art ailesine bağlar; "ödül" ve "piyango" en dolu alanlar |
| **Ortam adı** (POS, CRM, mobil) | Patenti o ortama bağlar |
| **Taraf listesi** ("müşteri, kasiyer, işletme bilmez") | Rakip listede olmayan bir rol uydurur: *"bizde onaylayıcı var"* |
| **Mekanizma adımları** | İsteme girmez — kuralı yaz, diziyi yazma |
| **"Eşit ihtimal"** | (a) Ağırlıklı dağıtım yapan rakip serbest kalır. (b) Çelişki riski: 1M öğeye eşit ihtimal + k=5 ise sistem 1M'i beklemek zorunda, yoksa ilk öğelere daha çok şans vermiş olur. Tarifnamede anlatılır, istemde yazılmaz |
| **Kimliksizlik, mercisizlik, durumsuzluk** | Temel istem **en geniş** olmalı; bu unsurlar alt katmanlarda (1a, 1c, 1d) giriyor |

---

### 37.15 TARİFNAMEYE YAZILACAK TANIMLAR — toplu liste

1. **Öğe:** *"Evren içindeki her bir girdi, bildirim, işlem veya katılımdır —
   bir kişi veya nesne değil, onların yol açtığı olaydır. Bir kişi de öğe
   olabilir; ancak aynı kişinin her görünüşü ayrı bir öğedir ve sistem önceki
   görünüşleriyle bağ kurmaz. Bir satış noktasındaki her ödeme işlemi, bir
   sepetteki her kalem, bir stadyuma her giriş, bir araçtan her iniş, bir
   düğmeye her basış, bir çevrimiçi mağazaya her ziyaret bir öğedir; bunlarla
   sınırlı değildir."*

2. **Evren:** *"Bir yer, bir zaman aralığı, bir olay veya bir toplulukla
   sınırlanabilir. Evrenin öğe sayısı önceden bilinebilir (bir araçtaki yolcu
   sayısı) veya bilinemez (bir mağazaya gelecek ziyaretçi sayısı); yöntem her
   iki durumda uygulanabilir."*

3. **Evren büyüklüğü:** *"Gerçekleşecek öğe sayısının kesin bilgisi değil,
   yöntemi uygulayan tarafça belirlenen bir ölçektir. Gerçek öğe sayısı bu
   ölçekten farklı olabilir."*

4. **Eklenme:** *"Öğenin sisteme bildirilmesi veya sistem tarafından
   algılanmasıdır; ayrı bir kayıt işlemi gerektirmez."*

5. **Özellik:** *"Öğe ile birlikte gelen veya ondan türetilebilen her türlü
   veriyi kapsar. Kendisine has özellikler; kimlik, tutar, içerik, sahip,
   konum ve benzeri. Eklenme özellikleri; zaman, sıra, kaçıncı öğe olduğu,
   geldiği kanal, eklenme hızı ve benzeri."*

6. **Etki:** *"Belirli bir çıktıyı elde etmek üzere üretim sürecine müdahale
   edebilme yeteneğidir. Kaynağın seçilmesi, evren büyüklüğüne karar verilmesi
   veya sistemin kurulması etki sayılmaz; yalnızca çıktının yönlendirilebilmesi
   etki sayılır."*

7. **Tetikleyen taraf:** *"Öğenin evrene eklenmesine yol açan kişi veya
   kuruluştur. Üretilen değer, tetikleyen tarafa veya onun yönlendirdiği
   üçüncü bir tarafa yansıtılabilir."*

8. **Değer:** *"Bir bedelden yapılacak indirim oranı veya tutarı, bir puan,
   bir kontör, bir hak, bir hizmet veya bir nesne olabilir; bunlarla sınırlı
   değildir. Değerin sıfır olması da bir sonuçtur; bu durumda tetikleyen taraf
   bir dezavantaj yaşamaz."*

9. **Bağımsızlığın kapsamı:** *"Bağımsızlık, üretilen değerin kendisine
   ilişkindir; değerin bir bedele uygulanması sonucunda ortaya çıkan miktar,
   bedele bağlı olabilir."* (Bu cümle olmadan ofis *"%10, bin liralık sepette
   daha fazla indirim demek, nasıl bağımsız"* diye sorabilir.)

---

### 37.16 TARİFNAMEYE YAZILACAK ÖRNEKLER

1. **Üç ortam, tek mekanizma** (§35.1 ortam bağımsızlığı argümanı):
   lamba (100 basışta 2), otobüs (47 inişte 2), sinema (1M bilette 5).

2. **Farklı bedel, eşit öğe:** *"Bir filmin biletleri farklı şehirlerde farklı
   bedellerle satılıyor olabilir; yöntem bakımından her bilet alımı eşit bir
   öğedir, bedelin miktarı üretilen değeri etkilemez."*

3. **Tekrarlanan kişi:** *"Aynı kişinin beş dakika sonra aynı kartla yaptığı
   ikinci işlem, birinciden bağımsız yeni bir öğedir."*

4. **Piyango kıyası** (§35.2): satılmayan bilete isabet eden ödül boşa gider;
   bu yöntemde her öğe gerçekleşmiştir, boşa giden ihtimal yoktur.

5. **Sıfır değer:** *"Beş ardışık öğede üretilen değerler %12, %38, %0, %25,
   %7 olabilir."* (Sıfırın bir sonuç olduğunu gösterir.)

---

## 38. KATMAN DÜZELTMESİ — temel tek unsurlu, k Katman 1'e indi

> §34'ü günceller. Kurucu kararı: *"temel tek unsur, bu halini ikililere at."*

### 38.1 Neden düzeltildi

§34'te k eklenince temel istem **iki unsurlu** olmuştu (BAĞIMSIZLIK + SINIR)
ama tek unsurlu sayılmaya devam edilmişti. Kurucunun tespiti bunu ortaya
çıkardı: *"sınırlanan miktarda ne? Sayısına karar verilebilenden farkı ne?"*
— ikisi aynı kısıtı tarif ediyordu, yani SINIR zaten temelin içindeydi.

### 38.2 TEMEL İSTEM (tek unsur — BAĞIMSIZLIK)

> **Birden fazla öğeden oluşacak ve büyüklüğüne karar verilebilen bir evrende;
> bir öğenin evrene eklenmesi ile tetiklenen ancak öğenin eklenmesine ve/veya
> kendisine has özelliklerinden bağımsız bir şekilde, tetikleyen taraf için
> bir fayda, hak veya sonuç değeri üreten yöntem.**

k çıktı, "tetikleyen taraf için" geri geldi.

### 38.3 KATMAN 1 — İSTEM 1a (BAĞIMSIZLIK + SINIR)

> **Birden fazla öğeden oluşacak ve büyüklüğüne karar verilebilen bir evrende;
> bir öğenin evrene eklenmesi ile tetiklenen ancak öğenin eklenmesine ve/veya
> kendisine has özelliklerinden bağımsız bir şekilde, sayısına karar
> verilebilen öğeler için özel bir fayda, hak veya sonuç değeri üreten
> yöntem.**

§34'te onaylanan metin; artık Katman 1'in ilk istemi.

### 38.4 Katman 1 sızıntı analizi

**Sızıntı** = temel istem reddedilip o istem tek başına kaldığında kaçan
rakip oranı. Kurucunun modeli: *"amacımız en dar katmandan bir üst katmana
olabildiğince az sızıntı oluşturmak."*

| # | Eklenen unsur | İstem ifadesi | Sızıntı | Ofise karşı |
|---|---|---|---|---|
| **1a** | **SINIR (k)** | "sayısına karar verilebilen öğeler için özel" | **5/100** | ✅ Aşikârlık cevabı |
| **1b** | **MERCİSİZLİK** | "hiçbir tarafın etkisi olmaksızın" | **10/100** (pratik 25-30) | ⚠️ İspat yükü |
| **1c** | **KİMLİKSİZLİK** | "kimlik içermeyen bir öğeden" | **20/100** | ✅ Prior art ayrımı |
| 1d | DURUMSUZLUK | "önceki verilerden bağımsız olarak" | 45/100 | Nötr |
| 1e | EVREN | "belirli bir evren içinde" | 60/100 | ⚠️ Piyango riski |

**1a'nın 5 sızıntısı kim:**

| Kaçan rakip tipi | Nasıl kaçıyor |
|---|---|
| Olasılık tabanlı | *"Kaç kişiye vereceğimizi belirlemiyoruz, her öğe için %0.1 ihtimal"* |
| Eşik tabanlı | *"Bir sayı üretiyoruz, 95 üstü çıkarsa veriyoruz"* |
| Bütçe tabanlı | *"Günde ₺10.000 dağıtıyoruz, kaç kişi olduğu belirsiz"* |
| Herkese dağıtan | *"Her öğeye üretiyoruz, bazıları sıfır"* |
| Gerçekten sınırsız | Nadir, teorik |

**Kritik:** Bu beşi de **temel istemde yakalanıyor** (temelde k yok). Yani
sızıntı ancak temel reddedilirse gerçek kayba dönüşüyor. Kurucunun tespiti:
*"bunlar temelde kapanıyor."*

**1b'nin ispat riski:** Mercisizlik bir olumsuzluk; mahkemede rakibin müdahale
etmediğini **davacı kanıtlamak** zorunda (koduna bakmak gerekiyor). Dava
edemediğin her rakip fiilen kaçmış sayılır → teorik 10, pratik 25-30.

**1c'nin özel durumu:** Temel istem kimliği **kullanmayı** yasaklıyor
("özelliklerinden bağımsız" — kimlik bir özellik). 1c ise **toplamayı**
yasaklıyor. Yani kimlik toplayan ama kullanmayan rakip temelde içeride,
1c'de dışarıda. Bu yüzden 1c sızıntısı yüksek ama **ofise karşı en değerli
unsur** — prior art'ın %90'ı kimlikli alanda, oradan çıkaran tek unsur.

**1c yumuşatılamaz:** "Kimliği kullanmayan" yazılsa temel istemle aynı şeyi
söyler, ofis tekrar sayıp siler.

### 38.5 Toplam sızıntı — istemler paralel çalışır

İstemler birleşmez; rakip **herhangi birini** ihlal ederse yakalanır.

| Yazılan istemler | Teorik sızıntı | Pratik sızıntı |
|---|---|---|
| Yalnız 1a | 5 | 5 |
| 1a + 1b | 3 | ~8 |
| **1a + 1b + 1c** | **2** | **~8-12** |
| + 1d, 1e | 2 | ~8-12 (**iyileşme yok**) |

**1d ve 1e eklemek sızıntıyı düşürmüyor** — onlardan kaçanlar diğer üçünden
yakalanıyor. Bağımsız istem olarak yer işgal ediyor, koruma katmıyor →
tarifnameye.

**Darboğaz:** 1b'nin ispat yükü. 1c onu çözmüyor, o yüzden teorik 3→2
iyileşmesi pratiğe yansımıyor.

### 38.6 KATMAN 1 KARARI — üç istem

| # | Unsur | Gerekçe |
|---|---|---|
| **1a** | BAĞIMSIZLIK + SINIR | En az sızıntı (5) + aşikârlık savunmasını taşıyan tek unsur |
| **1b** | BAĞIMSIZLIK + MERCİSİZLİK | İkinci en az sızıntı (10); rakip kaçarken kendi ürününü bozuyor |
| **1c** | BAĞIMSIZLIK + KİMLİKSİZLİK | Sızıntısı yüksek (20) ama **prior art ayrımını açıkça yazan tek istem** |

**Yazılmayanlar → tarifname:** 1d (durumsuzluk, 45), 1e (evren, 60).

---

## 39. TEKNİK PROBLEM TANIMI — tarifnameye

> Ofis "farklı" demeyi yetersiz bulur, **"hangi teknik problemi çözüyor"**
> diye sorar. Farklılık sonuç, problem sebep. Bu bölüm o sorunun cevabı.

### 39.1 Buluşun konumu — alternatif, birleşim değil

> *"Bu yöntem, ödül ve şans yöntemlerine bir **alternatiftir**. Aynı amaca —
> bir topluluktan belirli sayıda birime ayrıcalık tanımaya — hizmet eder,
> ancak mevcut yöntemlerin tamamından farklı bir yolla: ayrıcalığı hiçbir
> eylem, nitelik veya katılıma bağlamaksızın."*

**Neden bu konumlandırma kritik:** Aşikârlık itirazı *"mevcutların birleşimi"*
iddiasına dayanır. "Alternatif" demek, aynı teknik amaca **farklı bir yolla**
ulaşıldığını söyler — birleşim değil, ikame.

### 39.2 "Hayattan kesit" kavramı — kurucunun tanımı

**Kurucunun ifadesi:** *"Bizim olayımız hayat normal akarken bir kesit alıp o
kesitteki öğeler için eşit şans, adil, rastgele bir şekilde değer üretmek."*

> **Mevcut yöntemler bir oyun alanı kurar; bu yöntem hayatın kendisini alan
> olarak kullanır.**

| | Mevcut yöntemler | Bu yöntem |
|---|---|---|
| Alan | **Kurulur** — bilet sistemi, makine, kayıt, kart | **Zaten var** — alışveriş, geçiş, iniş |
| Katılım | Hayattan **çıkıp** oyuna girmek | Hayata devam etmek |
| Kesit | Oyuncular | **Hayatın bir dilimi** |

"Kesit" evren tanımının ta kendisidir: otobüs bir kesit, cuma günü bir kesit,
bir şehir bir kesit. Hayat akar, yöntem bir dilim alır.

### 39.3 TEK KOŞUL — buluşun en sade tarifi

**Kurucunun ifadesi:** *"Yani değer için tek şey var: evrenin bir öğesi
olmak."*

> *"Değer üretimi için tek koşul, öğenin evrene dahil olmasıdır; öğeden başka
> hiçbir eylem, nitelik veya katılım beklenmez."*

Mevcutların hepsinde **en az bir ek koşul** var:

| Yöntem | Ek koşul |
|---|---|
| Piyango | Bilet al |
| Çekiliş | Kayıt ol |
| Kumar | Bedel öde, kol çek |
| Sadakat | Harca, kart taşı |
| İlk gelen | Hızlı ol |
| Yarışma | Performans göster |
| Kampanya | Doğru zamanda gel |
| **BU YÖNTEM** | **YOK — var olmak yeterli** |

Teknik problemin çözümü: **ayrıcalığı koşulsuzlaştırmak, ancak sayısını
kontrol altında tutmak.**

### 39.4 TEKNİK PROBLEM — resmi tanım

> *Mevcut yöntemler, ayrıcalık dağıtmak için ayrı bir katılım altyapısı kurar
> (bilet, kayıt, kart, makine) ve ayrıcalığı o altyapıdaki bir eyleme veya
> niteliğe bağlar. Bu üç sonucu doğurur: (a) katılmayan dışlanır,
> (b) altyapı maliyeti doğar, (c) yöntem ortama bağımlı hale gelir ve her
> ortam için yeniden kurulması gerekir.*
>
> *Bu yöntem, mevcut bir faaliyet akışından bir kesit alır ve o kesitteki
> öğelere, hiçbir eylem veya nitelik gerektirmeksizin, sayısı kontrol altında
> tutulan değerler üretir.*

### 39.5 ÇÖZÜLEN SORUNLAR — yedi kalem

| # | Sorun | Nasıl çözülüyor | Patent ağırlığı |
|---|---|---|---|
| 1 | **Adil ve eşit ihtimal** *(kurucunun ilk tespiti)* | Koşul yoksa ayrıcalık yok; çok harcayan, hızlı olan, bilet alan avantaj kazanmıyor. Eşitlik kuralla değil **yapıyla** sağlanıyor | Sosyal — ofis "teknik etki" saymayabilir |
| 2 | **Katılım eşiği** | Bilet/kayıt/kart/uygulama eşiği yok; hayat akarken dahil olunuyor | **Güçlü** |
| 3 | **Altyapı maliyeti** | Mevcut akışın üstüne hiçbir sistem eklenmiyor | **Güçlü** |
| 4 | **Ortam bağımlılığı** | Tek mekanizma; lamba, otobüs, POS, sinema — uyarlama gerekmiyor | **En güçlü** |
| 5 | **Mahremiyet yükü** | Niteliğe bakılmadığı için veri toplamak gerekmiyor → KVKK/GDPR yükü doğmuyor | Güçlü ama hukuki |
| 6 | **Davranış manipülasyonu** | Sadakatte kişi sistemi "oynar" (eşiği geçmek için fazladan harcar); burada oynanacak bir şey yok | Orta |
| 7 | **Bütçe öngörülebilirliği** | Sayıya karar verildiği için maliyet baştan belli; olasılık tabanlı sistemlerde bu yok (bazen 800, bazen 1200 kişi) | Orta |

### 39.6 KARŞILAŞTIRMA TABLOSU — ispat

| Yöntem | Ayrıcalık neye dayanır | Altyapı şartı | Lamba | Otobüs | Sinema |
|---|---|---|---|---|---|
| Piyango | Bilet alma | Bilet basımı | ✗ | ✗ | Kısmen |
| Çekiliş | Kayıt/form | Katılım sistemi | ✗ | ✗ | ✗ |
| Kumar makinesi | Bedel + eylem | Makine | Kısmen | ✗ | ✗ |
| Sadakat | Harcama | Kimlik/kart | ✗ | ✗ | Kısmen |
| Kampanya | Zaman | — | Kısmen | ✗ | Kısmen |
| İlk gelen | Hız | — | ✗ | Kısmen | Kısmen |
| Yarışma | Performans | Değerlendirme | ✗ | ✗ | ✗ |
| Jüri | Karar | İnsan | ✗ | ✗ | ✗ |
| Rastgele ödül (US2014/0149200A1) | Program dönemi | — | ✗ | ✗ | ✗ |
| Kontenjanlı kupon (US20130144700A1) | Hız | Kupon basımı | ✗ | ✗ | Kısmen |
| **BU YÖNTEM** | **Hiçbirine** | **Yok** | **✓** | **✓** | **✓** |

Son satır teknik üstünlüğün kanıtı: **tek mekanizma, uyarlama gerektirmeden
üç farklı ortamda aynı sonucu veriyor.**

### 39.7 ŞANS OYUNLARINDAN AYRIM — detaylı

En yakın duran aile; ofis ilk oraya bakacak.

| | Şans oyunu (loto, kazı-kazan, çekiliş, kumar makinesi) | Bu yöntem |
|---|---|---|
| Ayrıcalık neye dayanır | **Katılım eylemi** — bilet al, kol çek, kazı | **Hiçbirine** — öğe zaten oluşuyor |
| Bedel | Var (bilet parası, jeton) | **Yok** |
| Kaybetme | Var | **Yok** — ödediği zaten normal bedel |
| Evren | Baştan sayılı (basılı bilet, çark yüzleri) | **Oluşuyor** |
| Evren büyüklüğü | **Kesin** | **Karar** |
| Boşa giden ihtimal | **Var** (satılmayan bilete isabet eden ödül) | **Yok** |
| Altyapı | Bilet/makine/kayıt şart | **Yok** |
| Ortam bağımlılığı | Yüksek | **Yok** |

**En kritik ayrım:** şans oyununda ayrıcalık **ayrı bir eyleme** bağlıdır;
sistem "oyuna girenler" arasından seçer. Bu yöntemde oyuna girme diye bir şey
yoktur; zaten olan bir olay değerlendirilir.

Patent dilindeki karşılığı: *"mevcut çözümler ayrı bir katılım altyapısı
gerektirir; bu yöntem gerektirmez."*

---

## 40. KATMAN 2 ve NIHAI ISTEM SETI - KARAR

### 40.1 Onemli duzeltme: asikarlik savunmasi TEMELDE

§38-39 boyunca asikarlik savunmasi SINIR unsuruna baglanmisti. **Yanlis.**
O baglanti dosyanin **eski** notundan geliyordu (*"miktar kontrollu, dagilim
bilinmez"*), bugunku temel istem yazilmadan onceki hali.

**Bugunku temel istem asikarlik savunmasini kendisi tasiyor:**

| Savunma | Nerede |
|---|---|
| Piyangodan ayrim | "buyuklugune **karar verilebilen**" (piyangoda kesin) |
| Tum kurallı sistemlerden ayrim | "ozelliklerinden **bagimsiz**" |
| Ortam bagimsizligi | Ortam adi yazilmadi + §39.6 tablosu |
| Hayattan kesit / tek kosul | §39.2, §39.3 |

**Sonuc:** SINIR unsurunun tek ustunlugu **en az sizdiran unsur** olmasi
(5/100). Ofis savunmasi degil. "Sinir her katmanda bulunmali" tespiti
gecersiz.

### 40.2 KATMAN 2 - iki istem

**ISTEM 2a (SINIR + MERCISIZLIK)**

> Birden fazla ogeden olusacak ve buyuklugune karar verilebilen bir evrende;
> bir ogenin evrene eklenmesi ile tetiklenen ancak ogenin eklenmesine ve/veya
> kendisine has ozelliklerinden bagimsiz bir sekilde, **hicbir tarafin etkisi
> olmaksizin**, sayisina karar verilebilen ogeler icin ozel bir fayda, hak
> veya sonuc degeri ureten yontem.

**ISTEM 2b (SINIR + KIMLIKSIZLIK)**

> Birden fazla ogeden olusacak ve buyuklugune karar verilebilen bir evrende;
> bir ogenin evrene eklenmesi ile tetiklenen ancak ogenin eklenmesine ve/veya
> kendisine has ozelliklerinden bagimsiz bir sekilde, **kimlik icermeyen bir
> ogeden**, sayisina karar verilebilen ogeler icin ozel bir fayda, hak veya
> sonuc degeri ureten yontem.

### 40.3 Secim gerekcesi - "en az daraltilmis hal"

Kurucunun olcutu: *"hangileri temel katmanin veya 1. katmanin en az
daraltilmis hali."*

Katman 1 istemlerine ikinci unsur eklendiginde sizinti artisi:

| Mevcut istem | Eklenen | Sizinti artisi |
|---|---|---|
| 1b (mercisizlik) | **SINIR** | **+5** ← en az |
| 1c (kimliksizlik) | **SINIR** | **+5** ← en az |
| 1a (sinir) | MERCISIZLIK | +10 |
| 1a (sinir) | KIMLIKSIZLIK | +20 |
| herhangi | DURUMSUZLUK | +45 |
| herhangi | EVREN | +60 |

**Katman 2'ye gecerken en kucuk adim SINIR eklemekle atiliyor.** Bu yuzden
2a ve 2b'nin ikisi de sinir uzerine kurulu.

**MERCISIZLIK + KIMLIKSIZLIK yazilmadi:** sizinti 6'ya cikiyor ve iki zaaf
birikiyor (ispat yuku + kimlik toplama kacisi).

**2a ve 2b birbirini tamamliyor:**

| | Ispat yuku | Prior art ayrimi |
|---|---|---|
| 2a | ⚠️ Var (mercisizlik olumsuzluk) | Dolayli |
| 2b | **Yok** - hepsi test edilebilir | ✅ Acikca yazili |

Biri duserse digeri ayakta.

### 40.4 KATMAN 3 YAZILMIYOR - gerekce

Uc unsurlu istemler Katman 2'nin kapsadigi alanin **icinde** kaliyor; yeni
koruma getirmiyorlar. Islevleri yalnizca ret sigortasi.

**O islev bagimli istemle saglanir:** *"Istem 2b'ye gore yontem, ayrica
onceki verilerden bagimsiz olmasi ile karakterize"* gibi. Maliyeti dusuk,
butunluk itirazi riski yok.

### 40.5 NIHAI ISTEM SETI - 6 bagimsiz istem

| # | Unsurlar | Sizinti | Islevi |
|---|---|---|---|
| **TEMEL** | BAGIMSIZLIK | — | En genis; bulusun ozu |
| **1a** | + SINIR | 5 | En az sizintili ikili |
| **1b** | + MERCISIZLIK | 10 (pratik 25-30) | Rakibe karsi en dar kapi |
| **1c** | + KIMLIKSIZLIK | 20 | Prior art ayrimini acikca yazan tek istem |
| **2a** | SINIR + MERCISIZLIK | ~3 | 1b'nin en az daraltilmis hali |
| **2b** | SINIR + KIMLIKSIZLIK | ~4 | **Alinabilirlik en yuksek** - ispat yuku yok |

**Toplam sizinti (hepsi birlikte): teorik ~2/100, pratik ~8-12/100.**

**Butunluk itirazi riski dusuk:** altisi da ayni eksende, temel istemin
giderek daralan halleri. Ofis "ayri bulusler" diyemez.

### 40.6 Hicbir katmanda yer almayanlar -> tarifname

| Unsur | Sizinti | Neden yazilmadi |
|---|---|---|
| DURUMSUZLUK | 45 | Sayac eklemek bedava; bos kapi acar |
| EVREN (belirli) | 60 | Surekli acik calisan sistemler kaciyor + piyango benzerligi riski |
| Kayitsizlik | — | Muhasebe/vergi kaydiyla celisiyor, ispatlanamaz |
| Kapsayicilik | — | Agirlikli dagitim yapani serbest birakiyor |
| Eszamanlilik | — | "Zarf yontemini" kapsamdan cikariyor |
| Girdi yalinligi | — | BAGIMSIZLIK ile ortusuyor |

Hepsi **§18.4 kuralina gore** tarifnameye olumlu varyasyon olarak yazilir
(*"bir uygulamada ... bicimde de uygulanabilir"*, asla *"bunun aksine ...
zayiftir"* denmez). Baskasi alamaz; ileride degerli cikarsa bolunmus
basvuruyla alinir.

### 40.7 SIRADA

1. **Bagimli istemler** (10-15 adet) - durumsuzluk, evren, kayitsizlik,
   kapsayicilik vb. tek tek eklenerek
2. **Tarifname** - §37.15 (9 tanim), §37.16 (5 ornek), §39 (teknik problem),
   §40.6 (varyasyonlar)
3. **PRIOR ART TARAMASI** - G06Q 30/02, tam istem metinleri, Espacenet/USPTO.
   **Istem secimi ve sayisi bu taramaya gore kesinlesir.**
4. ⚠️ **Basvuru, sahaya cikistan ONCE** (§36.7 - TR'de 12 ay hosgoru,
   uluslararasinda YOK)

---

## 41. SIZINTI ANALİZİ — somut kaçış senaryoları

> §38.4 ve §40'taki sızıntı **sayıları** (5/100, 45/100 vb.) hiçbir veriye
> dayanmıyordu; muhakemeyle üretilmiş tahminlerdi ve karar zemini yapılmaları
> hataydı. Bu bölüm sayı yerine **somut kaçış senaryoları** kuruyor: rakip ne
> yapar, nasıl yapar, bedeli ne.
>
> **Güvenilir olan: senaryoların varlığı ve maliyet sıralaması.
> Güvenilir olmayan: yüzde rakamları.**

### 41.1 Yöntem — kaçış maliyeti ölçütü

Bir unsurdan kaçmak için rakip ne ödemek zorunda:

| Maliyet sınıfı | Anlamı |
|---|---|
| **Sıfır** | Bir satır kod, bir ayar değişikliği |
| **Düşük** | Mevcut altyapıda küçük ekleme |
| **Orta** | Yeni altyapı veya süreç |
| **Yüksek** | Ürünün kendi değer önerisini bozma |
| **Yapısal** | Artık farklı bir ürün olma |

Kaçış maliyeti yükseldikçe sızıntı düşer. Ölçülebilir olan bu, yüzde değil.

---

### 41.2 TEMEL İSTEM — kaçış senaryoları

> Birden fazla öğeden oluşacak ve büyüklüğüne karar verilebilen bir evrende;
> bir öğenin evrene eklenmesi ile tetiklenen ancak öğenin eklenmesine ve/veya
> kendisine has özelliklerinden bağımsız bir şekilde, tetikleyen taraf için
> bir fayda, hak veya sonuç değeri üreten yöntem.

**Kaçış kapısı: BAĞIMSIZLIK (tek unsur)**

| # | Senaryo | Rakip ne der | Maliyet | Değerlendirme |
|---|---|---|---|---|
| **K1** | **Nitelik karıştırma** | *"Değeri tutara göre hesaplıyoruz"* | **Yapısal** | Artık kurallı sistem; değer öngörülebilir hale gelir, ürünün kendi iddiası ölür |
| **K2** | **Sıra karıştırma** | *"Her 10. öğeye veriyoruz"* | **Yapısal** | Aynı — öngörülebilir, 50 yıllık promosyon tekniğine döner |
| **K3** | **Zayıf bağımlılık** | *"Tutar sadece %1 etkiliyor, gerisi bağımsız"* | **Düşük** | ⚠️ **EN CİDDİ KAÇIŞ.** İstemde "tamamen/hiçbir" yazılmadığı için kısmi bağımlılık tartışmaya açık |
| **K4** | **Dolaylı bağımlılık** | *"Öğenin özelliğine değil, ondan türetilen bir göstergeye bakıyoruz"* | **Düşük** | ⚠️ Tarifnamedeki özellik tanımı (*"ondan türetilebilen her türlü veri"*) bunu kapatmayı amaçlıyor ama istemde yok |
| **K5** | **Evren tanımsızlığı** | *"Bizim evrenimizin büyüklüğüne karar verilmiyor"* | Orta | Kombinasyon kurulamaz; mekanizma zaten çalışmaz |
| **K6** | **Alıcı yokluğu** | *"Değer kimseye yansıtılmıyor, sadece istatistik"* | **Yüksek** | Ticari anlamı kalmaz |

**Sonuç:** Temel istemin iki gerçek açığı **K3 ve K4** — ikisi de "bağımsızlık"
ifadesinin kesinlik derecesiyle ilgili. İkisi de **istem metni düzeltmesiyle**
kapatılabilir (bkz. §41.5), yeni unsur eklemeye gerek yok.

---

### 41.3 KATMAN 1 — kaçış senaryoları

#### 1a = Temel + SINIR ("sayısına karar verilebilen öğeler için özel")

| # | Senaryo | Rakip ne der | Maliyet |
|---|---|---|---|
| S1 | Olasılık tabanlı | *"Sayı belirlemiyoruz; her öğe için %0.1 ihtimal"* | **Sıfır** |
| S2 | Eşik tabanlı | *"Bir değer üretip 95 üstünü seçiyoruz"* | **Sıfır** |
| S3 | Bütçe tabanlı | *"Günde ₺10.000 dağıtıyoruz, kaç kişi olduğu belirsiz"* | **Sıfır** |
| S4 | Herkese dağıtım | *"Her öğeye üretiyoruz, bazıları sıfır"* | **Sıfır** |

⚠️ **Kritik bulgu:** Dördü de **sıfır maliyetli.** Yani SINIR unsuru kolay
atlatılıyor — §38.4'teki "5/100, en az sızdıran unsur" değerlendirmesi
**yanlıştı.**

Yanlışın kaynağı: "sınırsız dağıtan işletme yaşayamaz" varsayımı. Oysa rakip
sınırsız dağıtmıyor — **sınırı başka bir yolla** koyuyor (olasılık, eşik,
bütçe). Sonuç ticari olarak aynı, istem bakımından dışarıda.

**Ve S4 ayrıca tehlikeli:** kurucunun kendi tespiti *"0 bir değerdir, sınırsız
dağıtmak sorun değil"* — yani mekanizma S4 biçiminde çalışıyorsa, 1a
**kurucunun kendi sistemini de dışlıyor olabilir.**

#### 1b = Temel + MERCİSİZLİK ("hiçbir tarafın etkisi olmaksızın")

| # | Senaryo | Rakip ne der | Maliyet |
|---|---|---|---|
| M1 | Açık müdahale | *"Sahibi kime gideceğini seçiyor"* | **Yüksek** — piyango/çekiliş rejimi, güven kaybı, "kimse bilmiyor" iddiası ölür |
| M2 | Parametre müdahalesi | *"Sonuca karışmıyoruz ama parametreleri ayarlıyoruz"* | **Düşük** ⚠️ |
| M3 | İspat zorluğu | *"Biz de müdahale etmiyoruz"* (aksini kanıtlamak davacıya düşer) | **Sıfır** ⚠️ |

⚠️ **M3 en ciddi açık.** Mercisizlik bir olumsuzluk; ihlal iddiasında rakibin
müdahale ettiğini **davacı kanıtlamak** zorunda — rakibin koduna erişmek
gerekir. Dava edilemeyen rakip fiilen kaçmış sayılır.

⚠️ **M2 de gerçek:** "Etki" tanımı tarifnamede var (*"kaynağın seçilmesi veya
sistemin kurulması etki sayılmaz; çıktının yönlendirilebilmesi etki sayılır"*)
ama parametre ayarı ile çıktı yönlendirme arasındaki sınır tartışmaya açık.

#### 1c = Temel + KİMLİKSİZLİK ("kimlik içermeyen bir öğeden")

| # | Senaryo | Rakip ne der | Maliyet |
|---|---|---|---|
| I1 | Kimlik toplama | *"Bizde kart okunuyor, kimlik var"* | **Sıfır** ⚠️ |
| I2 | Hash/oturum | *"Kimlik değil, anonim tanımlayıcı tutuyoruz"* | **Sıfır** |

⚠️ **I1 sıfır maliyetli ve yaygın.** Her POS kart okuyor, her site çerez
koyuyor. Rakip hiçbir şey değiştirmeden *"bizde kimlik var"* diyerek bu
istemin dışına çıkar.

**I2 kapatılabilir:** tarifnamedeki kimlik tanımı (*"türetilmiş (hash'lenmiş)
tanımlayıcılar dahildir"*) bunu kapsıyor.

**Ama 1c'nin asıl işlevi rakip yakalamak değil:** prior art ayrımını açıkça
yazan tek istem olması. Kimlikli sistemler (CRM, sadakat, hedefli kampanya)
prior art'ın en dolu alanı ve 1c o alandan net ayrılma beyanı.

---

### 41.4 KAÇIŞ MALİYETİ — düzeltilmiş sıralama

| Unsur | En kolay kaçış | Maliyet | Önceki tahmin |
|---|---|---|---|
| **BAĞIMSIZLIK** | K3 zayıf bağımlılık | **Düşük** (metinle kapatılabilir) | — |
| **MERCİSİZLİK** | M3 ispat zorluğu | **Sıfır** (hukuki) | 10/100 |
| **KİMLİKSİZLİK** | I1 kimlik toplama | **Sıfır** | 20/100 |
| **SINIR** | S1-S4 olasılık/eşik/bütçe | **Sıfır** | 5/100 ⚠️ yanlıştı |
| DURUMSUZLUK | Sayaç ekleme | **Sıfır** | 45/100 |
| EVREN | Sürekli açık çalışma | **Sıfır** | 60/100 |

> ⚠️ **ÖNEMLİ:** Beş unsurun beşi de sıfır veya düşük maliyetle atlatılabiliyor.
> §38.4/§40'taki sıralama ("sınır en güçlü") **geçersiz.** Unsurlar arasında
> anlamlı bir koruma farkı yok; hepsi tek bir ifade değişikliğiyle aşılıyor.

**Bundan çıkan sonuç — stratejik:**

Koruma, **unsur eklemekten** gelmiyor. Çünkü her ek unsur rakibe sıfır
maliyetli bir "bunu karşılamıyorum" beyanı imkânı veriyor.

Koruma iki yerden geliyor:

1. **Temel istemin kendi ifadesinin keskinliği** (K3, K4'ü kapatmak)
2. **Tarifnamedeki tanımların genişliği** (özellik, kimlik, etki tanımları)

---

### 41.5 TEMEL İSTEM — iki ifade düzeltmesi önerisi

**K3 (zayıf bağımlılık) ve K4 (dolaylı bağımlılık) için:**

Mevcut:
> ...öğenin eklenmesine ve/veya kendisine has özelliklerinden bağımsız bir
> şekilde...

Düzeltilmiş:
> ...öğenin eklenmesine ve/veya kendisine has **hiçbir özelliğinden ve bu
> özelliklerden türetilen hiçbir veriden** etkilenmeksizin...

| Ekleme | Kapattığı |
|---|---|
| "hiçbir" | K3 — *"sadece %1 etkiliyor"* diyemez |
| "türetilen hiçbir veriden" | K4 — *"özelliğe değil göstergeye bakıyoruz"* diyemez |
| "etkilenmeksizin" | "Bağımsız"dan daha kesin; derece tartışması kapanır |

⚠️ **Risk:** Bu daraltma. "Hiçbir" yazılınca, özelliklerden **kısmen** etkilenen
sistemler kapsamdan çıkar. Ama o sistemler zaten bu buluş değil (kurallı
sistemler).

⚠️ **İkinci risk:** "Hiçbir" mutlak bir iddia; ofis *"bunu nasıl
kanıtlıyorsunuz"* diye sorabilir. §28.7'deki tarifname testi
(*"uygulayan taraf belirli bir çıktıyı amaçlasa bile elde edemez"*) bunu
karşılıyor.

---

### 41.6 BU ANALİZDEN ÇIKAN KARAR TAVSİYESİ

**1. İstem sayısını azalt.** Altı bağımsız istemin koruma katkısı sanıldığı
kadar değil — her biri ayrı bir "karşılamıyorum" kapısı açıyor. Temel istem +
en çok 2 yedek yeterli.

**2. Ağırlığı tarifnameye kaydır.** Gerçek koruma tanımların genişliğinden
geliyor: özellik, kimlik, etki, eklenme, değer tanımları (§37.15).

**3. Temel istemin ifadesini keskinleştir** (§41.5).

**4. İstem seçimini prior art taramasından sonra kesinleştir.** Hangi unsurun
gerçekten ayırt edici olduğu, hangi patentlerin durduğuna bağlı — tahminle
karar verilemez.

---

## 42. PROFESYONEL ANALİZ — gerçek prior art taraması

> 14 Ekim 2026. §41'deki kaçış senaryoları gerçek patent verisiyle sınandı.
> Yöntem: Google Patents / USPTO tam metin, CPC G06Q30/0212 ("chance
> discounts or incentives") ve G06Q30/02 ekseninde.
>
> ⚠️ **Bu bir vekil taraması değildir.** Altı arama, dört patentin tam metni
> okundu. Vekil taraması Espacenet + USPTO + devam başvuruları (continuation)
> + aile analizi gerektirir. Ama §4'teki "4 web araması, tam istemler
> okunmadı" halinden ciddi biçimde ileridedir.

### 42.1 EN ÖNEMLİ BULGU — US 5,774,884

**"Service method using on-line systems of financial institutions"**
Başvuru: 8 Mart 1995 · Yayın: 30 Haziran 1998 · **Durum: SÜRESİ DOLDU**
(ücret ödenmemesi, Ağustos 2006; öngörülen bitiş 30 Haziran 2015)

Bu patent temel istemin **çekirdeğine doğrudan temas ediyor.** Tam metinden
doğrulanan unsurlar:

| Unsur | US5774884'te var mı | Kaynak |
|---|---|---|
| **Sabit sayıda alıcı seçimi** | ✅ **VAR** — tanım: *"selecting a fixed number of customers from customers who have executed a predetermined item of transaction"* | Tarifname tanımı |
| **İşlem anında tetikleme** | ✅ **VAR** — İstem 2-4: işlem gerçekleşince "lottery start signal" üretiliyor; **zamanlanmış çekiliş yok** | İstem 2-4 |
| **Tutardan bağımsızlık** | ✅ Ana istemde **VAR** (bağımlı istemlerde tutar eşiği ekleniyor: istem 7) | İstem 1 / 7 |
| **Evren büyüklüğü belirsiz** | ✅ Havuz = nitelikli işlem yapan herkes; **önceden sabit değil** | Tarifname |
| **Kayıt/üyelik gerektirmez** | ⚠️ Kısmen — ayrı kayıt yok, ama kart/cüzdan (manyetik kod) şart | İstem 1 |
| **Kimliksizlik** | ❌ **YOK** — seçim *"magnetic code of the transactor recognizing medium"* üzerinden; kart kimliği okunuyor | İstem 1 |
| **Evren büyüklüğüne karar verme** | ❌ **YOK** — kazanan numaralar belirleniyor, evren ölçeği belirlenmiyor | Tarifname |

**Sonuç:** Temel istemdeki **SINIR (k)** ve **eşzamanlı üretim** unsurları
1995'te yazılmış. §38.4'te SINIR'a verilen *"en az sızdıran, en değerli
unsur"* değerlendirmesi **çöküyor** — o unsur yeni değil.

**Ama iki unsur ayakta:** kimliksizlik ve evren büyüklüğüne karar verme.
US5774884 kart kimliği üzerinden seçim yapıyor; bizim yöntem öğenin hiçbir
özelliğine bakmıyor.

**Süresi dolmuş olması ne demek:** İhlal tehdidi yok (kimse bu patentle dava
açamaz) ama **prior art olarak tam güçte** — yenilik ve aşikârlık
değerlendirmesinde kullanılır. Süresi dolmuş patent, yeni başvuruyu
reddetmeye yeter.

### 42.2 US 2010/0153194 — "random chance" ifadesinin sahibi

**"System, Device and Method for Incorporating Randomly Selected Prizes with
Transactions"** · Başvuru: 11 Mart 2009 · **Durum: TERK EDİLMİŞ (abandoned)**

Tarifnamesinden doğrulanan ifade: ödül miktarı *"determined wholly or partly
via random chance, rather than just by the purchase amount or other typical
metric."*

| Unsur | Var mı |
|---|---|
| Tutardan bağımsız değer | ✅ **VAR** — birebir bu ifadeyle |
| Anonimlik imkânı | ⚠️ *"preserve anonymity for players"* geçiyor ama **istem 1 kimlik şart koşuyor:** *"terminal adapted to identify an individual via a personally identifying transaction instrument"* |
| Sabit sayıda kazanan | ❌ **YOK** — havuz endeksi + olasılık; kazanan sayısı sabit değil |
| Evren büyüklüğüne karar | ❌ Havuz *"can replenish, replace, shrink or append"* — sabit değil |
| Harcamadan bağımsızlık | ❌ Bir uygulamada *"for each $1 in purchases, one chance"* — harcamaya bağlı |

**Sonuç:** *"Tutardan bağımsız değer"* ifadesi 2009'da yazılmış. Ama **sabit
sayıda kazanan yok** ve **kimlik şart.** Bizim yöntemin bu iki unsuru onu
aşıyor.

**Terk edilmiş olması:** aynı şekilde prior art olarak geçerli.

### 42.3 WO 1999/021103 ailesi — operatörün kazanan sayısını belirlemesi

(CA2308751A1, EP1025509A2 ile aynı aile)

Tarifnameden: sponsor parametre giriyor — *"the duration of the incentive
program, **the number of winners** who may participate in the incentive
program, the frequency of winning."*

**Yani "kazanan sayısına karar verme" 1999'da yazılmış.** Bizim k unsurumuzun
muadili.

| Unsur | Var mı |
|---|---|
| Kazanan sayısına operatör karar verir | ✅ **VAR** |
| Anonimlik | ❌ Belirtilmemiş |
| Kayıtsızlık | ❌ Belirtilmemiş |
| Öğe özelliklerinden bağımsızlık | ❌ Belirtilmemiş |

### 42.4 USRE45006E1 — oran tabanlı rastgele kupon

*"a random lottery coupon wherein one coupon is randomly generated out of each
100 accesses"*

Bu, §41.3'teki **S1 senaryosunun** (olasılık tabanlı kaçış) patentlenmiş hali:
sabit sayı değil, **sabit oran.** Müşteri kimliği gerektiriyor.

**Önemi:** Rakibin *"biz sayı belirlemiyoruz, oran kullanıyoruz"* kaçışı
sadece teorik değil — 1990'lardan beri patentli bir teknik.

### 42.5 EP 0653735B1 — "chance discounts" sınıfının merkezi

CPC **G06Q30/0212** = *"Subject matter in which the incentive is the
opportunity to participate in a random event, e.g. sweepstakes, jackpots"*

Bu patent: kazanma olasılığı *"modified by rules and prizes related to other
predetermined parameters such as the type of purchase or the total sum spent."*

**Yani bizim yöntemin tam tersi** — olasılık satın alma tutarına bağlı. Bu
lehimize: ayrımı net gösteren bir karşı örnek.

### 42.6 Anonimlik ekseni — US8655722B1 ve EP2690590A1

| Patent | Ne yapıyor | Rastgelelik var mı |
|---|---|---|
| **US8655722B1** "Anonymous rewards club program" | *"acquire and redeem points without his or her identity or phone number being known"* | ❌ **YOK** — puan sistemi |
| **EP2690590A1** "Anonymous loyalty program consent" | *"customer remains anonymous and is not profiled"*, POS'ta otomatik tanınma | ❌ **YOK** |

**Kritik bulgu:** Anonim ödül sistemleri var, rastgele ödül sistemleri var —
ama **anonimlik + rastgelelik + sabit sayı** birleşimi bulunamadı.

### 42.7 TARAMANIN SONUCU — unsur unsur yenilik durumu

| Unsur | Prior art'ta var mı | Hangi patent |
|---|---|---|
| Sabit sayıda alıcı seçimi (k) | ✅ **VAR** | US5774884 (1995), WO1999021103 |
| İşlem anında üretim | ✅ **VAR** | US5774884 istem 2-4 |
| Tutardan bağımsız değer | ✅ **VAR** | US20100153194 (2009) |
| Oran tabanlı rastgele kupon | ✅ **VAR** | USRE45006E1 |
| Anonim ödül | ✅ **VAR** (rastgelelik olmadan) | US8655722B1, EP2690590A1 |
| Rastgele ödül (kimlikli) | ✅ **VAR** | US8682791B2, US20060277100A1 |
| **Öğenin HİÇBİR özelliğinden bağımsızlık** | ❓ **BULUNAMADI** | — |
| **Evren büyüklüğüne KARAR verme (n)** | ❓ **BULUNAMADI** | — |
| **Anonimlik + rastgelelik + sabit sayı birleşimi** | ❓ **BULUNAMADI** | — |
| **Ortam bağımsızlığı (lamba/otobüs/POS tek mekanizma)** | ❓ **BULUNAMADI** | — |

### 42.8 DÜRÜST DEĞERLENDİRME

**Boşluk var ama daraldı.** Dosyanın §4'teki iyimser tespiti (*"her bileşen
ayrı ayrı var, üçü bir arada bulunamadı"*) hâlâ doğru — ama **"bileşenler"in
daha fazlası prior art'ta.** Özellikle k unsuru (sabit sayı) ve eşzamanlılık
1995'te yazılmış.

**Ayakta kalan gerçek yenilik — üç unsur:**

1. **Tam bağımsızlık** — *öğenin eklenmesine ve/veya kendisine has hiçbir
   özelliğinden* etkilenmeme. Prior art'ta "tutardan bağımsız" var ama
   "hiçbir özellikten bağımsız" bulunamadı. US5774884 kart kimliği kullanıyor,
   US20100153194 kimlik şart koşuyor.

2. **Evren büyüklüğüne karar verme (n)** — piyangoda kesin, US5774884'te
   belirsiz, bu yöntemde **karar.** Bu unsur hiçbir patentte bulunamadı.

3. **Üçlü birleşim** — kimliksizlik + rastgelelik + sabit sayı. Üçü ayrı ayrı
   var, birlikte yok.

**En güçlü lehte argüman — ortam bağımsızlığı (§39.6):** Taranan hiçbir patent
bir LED lambaya, bir otobüs turnikesine ve bir POS'a aynı mekanizmayla
uygulanamıyor. Hepsi ya kart, ya kiosk, ya kupon, ya makine gerektiriyor.
Bu, patent dilinde *"teknik problemin genel çözümü"* argümanının gerçek
dayanağı.

### 42.9 ⚠️ CİDDİ RİSKLER — taramadan çıkan

**1. Aşikârlık riski arttı.** Beş ayrı patentte beş bileşen ayrı ayrı var. Ofis
şöyle diyebilir: *"US5774884 sabit sayı + işlem anında üretimi öğretiyor;
US8655722 anonimliği öğretiyor; US20100153194 tutardan bağımsızlığı öğretiyor.
Birleştirmek aşikârdır."*

**Karşı argüman:** birleşimin **teknik sinerjisi** var — kimlik olmadığında
sadece dağıtım anonim olmuyor, **yapısal olarak ayrımcılık imkânsız** hale
geliyor (hafızasızlık). Ve ortam bağımsızlığı yalnızca üçü birlikte olduğunda
doğuyor. Bu argüman yazılmalı; "yeni birleşim" demek yetmez, **"beklenmeyen
teknik etki"** gösterilmeli.

**2. SINIR unsuru artık savunma taşımıyor.** §38.4 ve §40'ta SINIR'a verilen
değer (*"en az sızdıran, aşikârlığa tek cevap"*) **geçersiz** — US5774884
tam o unsuru 1995'te yazmış. 1a ve 2a/2b istemlerinin gerekçesi yeniden
kurulmalı.

**3. İstem 1c (kimliksizlik) beklenenden değerli.** Taramada anonimlik +
rastgelelik birleşimi bulunamadı. §38.4'te kimliksizliğe verilen *"20/100
sızıntı, zayıf"* değerlendirmesi yanlış yönlüydü — rakip kaçışı kolay olabilir
ama **yenilik açısından en güçlü unsur bu.**

**4. SMK m.82 / Alice riski.** [Knobbe blog](https://www.knobbe.com/blog/no-patent-eligibility-reward-customer-loyalty-program-computer-system/)
kaydı: ABD'de bir müşteri sadakat programı bilgisayar sistemi **patent
uygunluğu reddi** almış. Yani bu alanda soyut fikir (abstract idea) itirazı
gerçek ve yaygın. Tarifnamede teknik etki vurgusu kritik.

### 42.10 REVİZE EDİLMİŞ STRATEJİ TAVSİYESİ

**1. İstem hiyerarşisini yeniden kur.** Yenilik ağırlığı değişti:

| Eski sıralama (§40) | Yeni sıralama (taramaya göre) |
|---|---|
| 1a (SINIR) en güçlü | ⚠️ SINIR prior art — US5774884 |
| 1c (KİMLİKSİZLİK) zayıf | ✅ **KİMLİKSİZLİK en güçlü** — birleşimi bulunamadı |
| — | ✅ **Evren büyüklüğüne karar** — bulunamadı |

**Öneri:** bağımsız istemlerde **kimliksizlik + tam bağımsızlık** ekseni öne
alınmalı; SINIR bağımlı isteme inmeli.

**2. Tarifnamede "beklenmeyen teknik etki" bölümü yazılmalı.** Aşikârlık
itirazına karşı tek gerçek savunma bu: birleşimin parçaların toplamından
fazlasını ürettiğini göstermek (ortam bağımsızlığı + yapısal ayrımcılık
imkânsızlığı + altyapısızlık).

**3. US5774884 tarifnamede açıkça ele alınmalı.** Prior art'ı gizlemek değil,
**ondan nasıl ayrıldığını yazmak** daha güçlü: *"Bilinen yöntemlerde seçim,
işlem aracının kimlik kodu üzerinden yapılır (US5774884); bu yöntemde hiçbir
tanımlayıcı kullanılmaz."*

**4. Vekil taraması hâlâ zorunlu.** Bu tarama altı arama + dört tam metin.
Eksik kalanlar: Espacenet, devam başvuruları, JP/KR/CN aileleri, G07F17/32
(POS'ta oyun) sınıfı, 2016 sonrası GDPR dönemi başvuruları.

**5. Başvuru aciliyeti arttı.** Bu alan aktif — 1995'ten 2014'e kadar sürekli
başvuru var. Sahaya çıkmadan önce başvuru (§36.7).

---

## 43. US5774884 TAM METIN DOGRULAMASI - §42 DUZELTMESI

> Kurucunun itirazi (*"bu benzer ama ayni degil"*) uzerine patentin secim
> mekanizmasi tam metinden yeniden okundu. **§42.1 ve §42.9/2 hatali ciktii.**

### 43.1 Patent kendi icinde tutarsiz

| Nerede | Ne diyor |
|---|---|
| **Tarifname tanimi** | *"selecting a fixed number of customers"* |
| **Aciklanan mekanizma** | *"one number is selected from among the numbers of 1 through 100 on a random-number basis"* |

Yani *"fixed number"* ifadesi **havada kalmis, mekanizmayla desteklenmemis.**
Patent fiilen **per-islem olasilik** ogretiyor, sabit sayi ogretmiyor.

Patent ofisi degerlendirmede **isteme ve aciklanan mekanizmaya** bakar;
desteklenmeyen tarifname ifadesine degil.

### 43.2 Secim mekanizmasi - dogrulanmis ayrintilar

| Soru | Cevap |
|---|---|
| Kazanan nasil belirleniyor | Iki uygulama: (a) kart kodu saklanan "winning code" grubuyla eslesiyor (adim 41), (b) "random number table"dan sayi cekiliyor (adim 51) |
| Kart kodunun degeri hesaba giriyor mu | **Hayir** - yalnizca kazanan grup uyeligi uzerinden. Rakam eslestirme veya kod uzerinde hesap **yok** |
| Kazanan sayisi sabit mi | **Hayir** - per-islem olasilik (1-100'den biri) |
| Evren buyuklugu ele alinmis mi | **HAYIR** - yalnizca *"pre-filtering reduces the number of customers"*; olceklendirme yontemi verilmiyor |
| Ortam serbest mi | **Hayir** - Istem 1 **banka merkez sistemine bagli ozel terminal** sart kosuyor; bagimli istem 6 islemleri *"transfer of cash"*e daraltiyor |

### 43.3 DUZELTILMIS FARK TABLOSU

| Unsur | US5774884 | BU YONTEM |
|---|---|---|
| Tetikleyici | ✓ Islem aninda | ✓ Ayni |
| **Secim mekanizmasi** | **Olasilik** (1-100) | **Sabit sayi** (n'den k) |
| **Kimlik** | **Kart kodu okunuyor** | **Hic yok** |
| **Evren buyuklugu** | **Hic ele alinmamis** | **Karar veriliyor** |
| **Ortam** | **Banka terminali SART** | **Her ortam** |
| Islem turu | Para transferi odakli | Her olay |

**Dort ayri fark, ikisi yapisal.**

### 43.4 §42'DE IPTAL EDILEN HUKUMLER

| § | Hatali hukum | Dogrusu |
|---|---|---|
| 42.1 | *"Sabit sayida alici secimi US5774884'te VAR"* | **YOK** - mekanizma olasilik tabanli; "fixed number" desteklenmemis bir tarifname ifadesi |
| 42.7 | *"Sabit sayida alici (k) prior art'ta var"* | **Temiz** - k unsuru ayakta |
| 42.9/2 | *"SINIR unsuru artik savunma tasimiyor, bagimli isteme insin"* | **GERI ALINDI** - SINIR bagimsiz istemde kalabilir |
| 42.10/1 | *"SINIR prior art, kimliksizlik one alinmali"* | Kimliksizlik guclu ama SINIR da temiz; siralama degismiyor |

**Ayakta kalan §42 bulgulari:**
- US20100153194 *"tutardan bagimsiz deger"* ifadesini 2009'da yazmis ✓
- Anonim odul sistemleri var ama **rastgelelik yok** (US8655722B1, EP2690590A1) ✓
- Rastgele odul sistemleri var ama **kimlik sart** (US5774884, US20100153194) ✓
- **Anonimlik + rastgelelik + sabit sayi birlesimi bulunamadi** ✓
- Ortam bagimsizligi hicbir patentte yok ✓
- ABD'de sadakat programi patentine **uygunluk reddi** ornegi var (Alice riski) ✓

### 43.5 n ve k IKILISI TEMIZ

Kurucunun bulus tanimi (*"bulusum bu kombinasyonu kurmak ve calistirmak"*)
ayakta:

| Parametre | Prior art'ta | Durum |
|---|---|---|
| **n** (evren buyuklugune karar) | Hicbir patentte bulunamadi | ✅ **Temiz** |
| **k** (sabit sayida alici) | US5774884'te desteklenmemis ifade; mekanizma olasilik | ✅ **Temiz** |

**Kalan risk - asikarlik:** Ofis *"olasiliktan sabit sayiya gecmek bariz bir
adim"* diyebilir.

**Karsi argument (tarifnameye yazilacak):** Sabit sayi **butce
ongorulebilirligi** sagliyor. Olasilik tabanli sistemlerde ayni parametreyle
bazen 800 bazen 1200 alici cikar; isletme maliyeti ongoremez. Sabit sayi bu
teknik problemi cozuyor. Bu, **beklenmeyen teknik etki** argumaninin parcasi.

### 43.6 TEMEL ISTEM - KESINLESMIS

> **Birden fazla ogeden olusacak ve buyuklugune karar verilebilen bir evrende;
> bir ogenin evrene eklenmesi ile tetiklenen ancak ogenin eklenmesine ve/veya
> kendisine has ozelliklerinden bagimsiz bir sekilde, tetikleyen taraf icin
> bir fayda, hak veya sonuc degeri ureten yontem.**

**Tarama sonrasi hicbir kelimesi dusmedi.**

**"Hicbir" onerisi REDDEDILDI** (kurucu karari: *"bagimsiz kelimesi yetiyor
bence"*).

Gerekcesi savunulabilir: "bagimsiz" Turkcede **tam** bagimsizlik ifade eder;
"kismi bagimsizlik" bir celiskidir. US20100153194'un *"wholly or partly"*
ifadesiyle karismasi halinde cevap tarifnamede hazir:
- Ozellik tanimi (*"ondan turetilebilen her turlu veri"*)
- Mercisizlik testi (*"uygulayan taraf belirli bir ciktiyi amaclasa bile elde
  edemez"*)

Istemi sismeye gerek yok.

---

## 44. KATMAN 1 - ISTEM 1a KESINLESTI

### 44.1 NIHAI METIN

> **1a (BAGIMSIZLIK + NICELIK KARARI)**
>
> Buyuklugune ve **FAYDALANDIRILACAKLARIN NICELIGINE** karar verilebilen,
> birden fazla ogeden olusacak bir evrende; bir ogenin evrene eklenmesi ile
> tetiklenen ancak ogenin eklenmesine ve/veya kendisine has ozelliklerinden
> bagimsiz bir sekilde belirlenen ogeler icin bir fayda, hak veya sonuc degeri
> ureten yontem.

**Temel istemden farki:** *"ve FAYDALANDIRILACAKLARIN NICELIGINE"* ibaresi
eklendi; *"tetikleyen taraf icin"* yerine *"belirlenen ogeler icin"* geldi.

| | |
|---|---|
| **Eklenen unsur** | k - faydalandirilacaklarin niceligine karar |
| **Sizinti** | ~2/100 ⚠️ **tahmin, veri degil** |
| **Daralma fedakarligi** | **COK DUSUK** - hicbir nicelige karar vermeyen (butcesiz, kapsamsiz) sistem pratikte yok |
| **Prior art** | ✅ Temiz - US5774884'un *"fixed number"* ifadesi mekanizmayla desteklenmemis (§43) |
| **Ispat** | ✅ Kolay - kac ogeye verildigi sayilir |
| **Bulus tanimi** | ✅ **n+k kombinasyonu tamamlandi** (*"bulusum bu kombinasyonu kurmak"*) |
| **Teknik etki** | Butce ongorulebilirligi - olasilik tabanli sistemlerde ayni parametreyle bazen 800 bazen 1200 alici cikar; isletme maliyeti ongoremez |

### 44.2 "NICELIK" kelimesinin secimi - celiski cozumu

**Kurucunun yakaladigi celiski:** *"ikisi celiski degil mi, sayi bir oge
eklemesi ozelligi degil mi?"*

Metinde iki ayri sey ayni kelimeyle anilinca karisiyordu:

| | Neyin niceligi | Durum |
|---|---|---|
| **Yasak** | Tek ogenin ozellikleri - tutar, sira, saat | Bagimsizlik unsuru |
| **Serbest** | Kac ogenin faydalanacagi | Nicelik karari |

Birincisi **oge bazinda**, ikincisi **evren bazinda.** "12. ogeye ver" yasak
(sira bir eklenme ozelligi), "10 ogeye ver" serbest.

**Cozum iki adimda:**
1. **"faydalandirilacaklarin"** eklendi -> neyin niceligi oldugu netlesti,
   ogenin ozelligi olarak okunamaz hale geldi
2. **Siralama degisti** -> n ve k yan yana, ikisi de evren duzeyi karari
   olarak cumle basinda

### 44.3 Ifade evrimi - elenen denemeler

| Deneme | Sorun |
|---|---|
| "sayisina karar verilebilen ogeler icin ozel" | Sadece **sayi** - olasilik, oran, butce kaciyordu (S1/S2/S3 senaryolari) |
| "SAYISINA, ORANINA, OLASILIGINA, TOPLAM DEGERINE VEYA FARKLI BIR NICELIGINE..." | Liste kapsami genisletti ✓ ama **neyin niceligi** belirsiz kaldi; ayrica unsur erimeye basladi |
| "...NICELIK UZERINDEN KARAR VERILEBILEN" | Ayni belirsizlik + tamlama kirildi |
| "KONTENJANINA KARAR VERILEBILEN" | Tek kelime, celiski yok ama gunluk dilde "sabit sayi" cagristiriyor |
| "faydalandirilacaklar sayisina" | Neyin oldugu netlesti ama yalniz **sayi** |
| **"FAYDALANDIRILACAKLARIN NICELIGINE"** | **KABUL** - hem neyin hem her bicimi (sayi/oran/olasilik/butce) |

**Tarifnameye:** *"Faydalandirilacaklarin niceligi; bir adet, bir oran, bir
olasilik, bir toplam deger veya benzeri bir olcu ile belirlenebilir."*

### 44.4 "OZEL" kelimesi CIKARILDI - bilincli

Onceki hal: *"...belirlenen ogelere **ozel**, bir fayda..."*

**Kurucunun karari:** *"Ben esiti de kapsasin istiyorum zaten. Ister 10 kisiye
bir elma, ister 1 kisiye 10 elma verebileyim."*

"Ozel" esit dagitimi disliyordu (§15.2 dokuz yontem tablosunun 1. satiri).
Cikarilinca istem **ucunu birden** kapsiyor:

| Dagitim bicimi | Kapsamda |
|---|---|
| 10 ogeye birer elma (esit) | ✓ |
| 1 ogeye 10 elma (tek alici) | ✓ |
| 3 ogeye farkli miktarlar (esitsiz) | ✓ |

**Nicelik karari yalnizca KAC ogenin faydalanacagini soyluyor, NE alacagini
soylemiyor.**

### 44.5 "Degerin buyuklugu" tartismasi - KAPANDI

Bir ara tespit: bagimsizlik unsuru yalnizca **oge secimini** niteliyor,
uretilen degerin **buyuklugunu** nitelemiyor. Rakip *"kimi sececegimi bagimsiz
seciyorum ama ne kadar verecegimi tutara gore hesapliyorum"* diyebilir.

**Kurucunun karari:** *"Degerin buyuklugu onemli mi abe. Ister at veririz
ister avrat, kime ne."*

Konu disi - bulus **kime gittiginin nasil belirlendigi** ile ilgili, ne
verildigiyle degil. Isteme eklenmedi.

### 44.6 Sirada: 1b (KIMLIKSIZLIK)

Taramanin en guclu bulgusu (§42.6): anonim odul sistemleri var ama
rastgelelik yok (US8655722B1, EP2690590A1); rastgele odul sistemleri var ama
kimlik sart (US5774884 kart kodu okuyor, US20100153194 istem 1'de kimlik sart).
**Birlesim bulunamadi.**

---

## 45. KATMAN 1 - ISTEM 1b

### 45.1 METIN

> **1b (BAGIMSIZLIK + KIMLIKSIZLIK)**
>
> Buyuklugune karar verilebilen, birden fazla ogeden olusacak bir evrende;
> **KIMLIK ICERMEYEN** bir ogenin evrene eklenmesi ile tetiklenen ancak ogenin
> eklenmesine ve/veya kendisine has ozelliklerinden bagimsiz bir sekilde
> belirlenen ogeler icin bir fayda, hak ve/veya sonuc degeri ureten yontem.

**Temel istemden farki:** ogenin *"kimlik icermeyen"* olmasi sarti.

| | |
|---|---|
| **Eklenen unsur** | Kimliksizlik |
| **Sizinti** | ~20/100 ⚠️ **tahmin, veri degil** |
| **Daralma fedakarligi** | **ORTA-YUKSEK** - kimlik toplayan her sistem disarida; POS kart okur, site cerez koyar, kacis **sifir maliyetli** |
| **Prior art** | ✅ **TARAMANIN EN GUCLU BULGUSU** (§42.6) |
| **Ispat** | ✅ Kolay - girdide kimlik var mi, bakilir; olumsuzluk ispati yok |
| **Ofise karsi** | ✅ Prior art'in %90'i kimlikli alanda; oradan net ayrilma beyani |

### 45.2 Neden en guclu unsur - tarama kaniti

| Patent | Rastgelelik | Kimliksizlik |
|---|---|---|
| US5774884 | ✓ | ✗ **kart kodu okuyor** |
| US20100153194 | ✓ | ✗ **istem 1 kimlik sart kosuyor** |
| US8655722B1 "Anonymous rewards club" | ✗ **puan sistemi** | ✓ |
| EP2690590A1 "Anonymous loyalty consent" | ✗ | ✓ |

**Ikisi birden hicbirinde yok.** Anonim odul sistemleri var, rastgele odul
sistemleri var, birlesimi bulunamadi.

### 45.3 Temelden gercek farki

| | Yasakladigi |
|---|---|
| **Temel istem** | Kimligi **KULLANMAK** (kimlik bir ozellik; "ozelliklerinden bagimsiz") |
| **1b** | Kimligin **OGEDE BULUNMASI** |

Kimlik toplayip kullanmayan rakip: temelde **iceride**, 1b'de **disarida.**
Farkli kosul, tekrar degil.

**Yumusatilamaz:** *"kimligi kullanmayan"* yazilsa temelle ayni olur, ofis
tekrar sayip siler.

### 45.4 "POZITIF DEGER" onerisi IPTAL

Kurucunun onerisi (*"bir fayda, hak ve/veya pozitif deger"*) iki parcaya
ayrildi:

| Parca | Karar |
|---|---|
| **"ve/veya"** | ✅ **KABUL** - "veya" zaten kapsiyor ama "ve/veya" daha kesin: ucu birden de olabilir |
| **"pozitif"** | ❌ **IPTAL** (kurucu karari: *"pozitif iptal"*) |

**"Pozitif" neden iptal:**
1. **Sifiri disliyor.** Dosyada aralik *"0-50, sifir dahil"*; kurucunun kendi
   tespiti *"0 bir degerdir."* 10 ogeden 9'una sifir veren sistem kismen
   disarida kalirdi
2. Matematiksel nitelik -> SMK m.82 soyutluk itirazini **pekistiriyor**
3. **"Sonuc"** en genis kelimeydi (lamba yanmasi, durum degisikligi, fiyat
   dusmesi hepsi sonuc); "pozitif deger" onu daraltiyordu

### 45.5 TUTARLILIK NOTU

*"ve/veya"* ifadesi **temel isteme ve 1a'ya da** uygulanmali. Aksi halde uc
istemde iki farkli ifade dolasir ve ofis *"aralarinda fark var mi"* diye
sorar.

**Guncellenecek:**
- Temel: *"...bir fayda, hak **ve/veya** sonuc degeri ureten yontem."*
- 1a: *"...bir fayda, hak **ve/veya** sonuc degeri ureten yontem."*

### 45.6 KATMAN 1 - toplam

| # | Eklenen unsur | Sizinti (tahmin) | Prior art |
|---|---|---|---|
| **1a** | Faydalandirilacaklarin niceligi (k) | ~2 | ✅ Temiz |
| **1b** | Kimliksizlik | ~20 | ✅ **En guclu** |

**Mercisizlik Katman 1'e alinmadi** - temiz ama **ispat yuku** var (olumsuzluk;
rakibin mudahale etmedigini davaci kanitlamak zorunda). Katman 2'de
kimliksizlikle birlikte daha guvenli duruyor.

---

## 46. KATMAN 1 - TEK KALIBA OTURTULDU (nihai metinler)

> §32, §44.1, §45.1'i gunceller. Uc istem ayni govdede; her katman **tek**
> ekleme yapiyor.

### 46.1 TEMEL ISTEM

> **Birden fazla ogeden olusacak ve buyuklugune karar verilebilen bir evrende;
> bir ogenin evrene eklenmesi ile tetiklenen ancak ogenin eklenmesine ve/veya
> kendisine has ozelliklerinden bagimsiz olarak belirlenen ogeler icin bir
> fayda, hak ve/veya sonuc degeri ureten yontem.**

### 46.2 ISTEM 1a (+ nicelik karari)

> **Birden fazla ogeden olusacak, buyuklugune VE FAYDALANDIRILACAKLARIN
> NICELIGINE karar verilebilen bir evrende; bir ogenin evrene eklenmesi ile
> tetiklenen ancak ogenin eklenmesine ve/veya kendisine has ozelliklerinden
> bagimsiz olarak belirlenen ogeler icin bir fayda, hak ve/veya sonuc degeri
> ureten yontem.**

### 46.3 ISTEM 1b (+ kimliksizlik)

> **Birden fazla ogeden olusacak ve buyuklugune karar verilebilen bir evrende;
> KIMLIK ICERMEYEN bir ogenin evrene eklenmesi ile tetiklenen ancak ogenin
> eklenmesine ve/veya kendisine has ozelliklerinden bagimsiz olarak belirlenen
> ogeler icin bir fayda, hak ve/veya sonuc degeri ureten yontem.**

### 46.4 Katmanlar arasi tek fark

| # | Ekleme | Yeri |
|---|---|---|
| Temel | — | — |
| **1a** | VE FAYDALANDIRILACAKLARIN NICELIGINE | Evren tanimi icinde (n'in yanina) |
| **1b** | KIMLIK ICERMEYEN | Oge tanimi onunde |

Govde birebir ayni. Ofis farki tek bakista gorur; butunluk itirazi gelmez.

### 46.5 Son uc ifade duzeltmesi

**1. "bagimsiz bir sekilde" -> "bagimsiz olarak"**

| | Sorun / kazanc |
|---|---|
| "bagimsiz bir sekilde belirlenen" | *"bir sekilde"* ayri obek gibi okunabiliyor: *"bagimsiz bir sekilde, belirlenen ogeler"* -> belirsizlik |
| **"bagimsiz olarak belirlenen"** | Tek obek, tartisma yok. Ayrica daha kesin - "olarak" dogrudan bagliyor |

**2. "veya" -> "ve/veya"** (uc istemde de)

"Veya" zaten kapsiyor ama "ve/veya" daha kesin: fayda, hak ve sonuc **ucu
birden** de olabilir.

**3. "tetikleyen taraf icin" -> "belirlenen ogeler icin"** (temel istemde)

1a ve 1b ile hizalama. ⚠️ **Not:** bu degisiklikle temeldeki **alici vurgusu
dolaylilasti.** O ifade SMK m.82 (matematiksel yontem) itirazina karsi
calisiyordu. *"Belirlenen ogeler icin fayda uretmek"* de bir alici gosteriyor
ama daha zayif. **Tarifnamede alici vurgusu guclendirilmeli:**
*"Uretilen deger, ogeyi evrene ekleyen tarafa veya onun yonlendirdigi ucuncu
bir tarafa bir fayda, hak veya sonuc olarak yansitilir."*

### 46.6 "-EBILEN" EKI - kacis kapatici (kurucunun tespiti)

**Kurucunun sorusu:** *"Rakip 'biz buyuklugune karar vermiyoruz' derse sorun
olur mu? Verilebilen, istemli bir sey dimi."*

**Cevap kurucunun lehine:** *"Verilebilen"* bir **yetenek** ifadesi, fiili
karar degil. Rakip *"biz karar vermiyoruz"* derse cevap: **"vermenize gerek
yok, verilebilir olmasi yeterli."**

Pratikte her evrenin buyuklugune karar verilebilir (bir sinir konabilir, bir
olcek belirlenebilir) -> unsur neredeyse kimseyi dislamiyor.

| | Sonuc |
|---|---|
| **Kazanc** | Rakip kacamiyor - yetenegi reddetmek zor |
| **Risk** | Ofis *"bu unsur ne sinirliyor"* diye sorabilir, unsur saymayabilir |

Risk zararsiz: unsur sayilmasa bile istemi **daraltmiyor.**

**Ayni mantik 1a'daki k icin de gecerli:** *"faydalandirilacaklarin niceligine
karar verilebilen"* - rakip *"biz nicelik belirlemiyoruz"* derse ayni cevap.

**Tarifnameye yazilacak:**
> *"Karar verilebilir olmasi, her uygulamada fiilen karar verilmis olmasini
> gerektirmez; evrenin buyuklugunun ve faydalandirilacaklarin niceliginin
> belirlenebilir olmasi yeterlidir."*

### 46.7 KATMAN 1 KAPANDI

| # | Unsur | Sizinti (tahmin) | Prior art | Ispat |
|---|---|---|---|---|
| **Temel** | Bagimsizlik | — | ✅ Temiz | Kolay |
| **1a** | + nicelik karari (k) | ~2 | ✅ Temiz | Kolay |
| **1b** | + kimliksizlik | ~20 | ✅ **En guclu** | Kolay |

⚠️ Sizinti sayilari **tahmindir, veri degildir.** Siralamaya guvenilir,
rakama guvenilmez.

**Mercisizlik Katman 1'e alinmadi** - prior art acisindan temiz ama **ispat
yuku** var (olumsuzluk: rakibin mudahale etmedigini davaci kanitlamak zorunda,
koduna erisim gerekir). Katman 2'de kimliksizlikle birlikte daha guvenli.

**SIRADA: Katman 2** - 1a + 1b birlesimi (nicelik + kimliksizlik), sonra
mercisizlik eklemeleri.

---

## 47. ONAYLANAN ISTEM SETI - KATMAN 1 (kurucu onayi alindi)

> §46'yi gunceller. **4 bagimsiz istem onaylandi.** §46 sonrasi denenen
> 7-istem / 15-istem yapilari ve kapsayicilik/ongorulemezlik eklemeleri
> **IPTAL** (gerekceleri §47.5'te).

### 47.1 ISTEM 1 - TEMEL ✅ ONAYLI

> **Birden fazla ogeden olusacak ve buyuklugune karar verilebilen bir evrende;
> bir ogenin evrene eklenmesi ile tetiklenen ancak ogenin eklenmesine ve/veya
> kendisine has ozelliklerinden bagimsiz olarak belirlenen ogeler icin bir
> fayda, hak ve/veya sonuc degeri ureten yontem.**

| | |
|---|---|
| Unsur | BAGIMSIZLIK (tek) |
| **Darlik** | **En genis.** Tutara/siraya gore hesaplayan sistemler disinda herkesi yakaliyor |
| **Patent gucu** | **Orta.** Tek unsurlu ve genis -> asikarlik + "soyut fikir" (SMK m.82) itirazina acik. Savunmasi tarifnamede: ortam bagimsizligi, hayattan kesit, tek kosul |

### 47.2 ISTEM 2 (1a) - + NICELIK KARARI ✅ ONAYLI

> **Birden fazla ogeden olusacak, buyuklugune VE FAYDALANDIRILACAKLARIN
> NICELIGINE karar verilebilen bir evrende; bir ogenin evrene eklenmesi ile
> tetiklenen ancak ogenin eklenmesine ve/veya kendisine has ozelliklerinden
> bagimsiz olarak belirlenen ogeler icin bir fayda, hak ve/veya sonuc degeri
> ureten yontem.**

| | |
|---|---|
| Eklenen | k - faydalandirilacaklarin niceligine karar |
| **Darlik** | **Cok az.** "-ebilen" yetenegini reddetmek zor; butcesiz/kapsamsiz dagitan sistem pratikte yok |
| **Patent gucu** | **Orta-yuksek.** n+k kombinasyonunu tamamliyor (bulus tanimi). US5774884 *"fixed number"* yazmis ama mekanizmasi olasilik tabanli - desteklenmemis. **Butce ongorulebilirligi** teknik etkisi |

### 47.3 ISTEM 3 (1b) - + KIMLIKSIZLIK ✅ ONAYLI

> **Birden fazla ogeden olusacak ve buyuklugune karar verilebilen bir evrende;
> KIMLIK ICERMEYEN bir ogenin evrene eklenmesi ile tetiklenen ancak ogenin
> eklenmesine ve/veya kendisine has ozelliklerinden bagimsiz olarak belirlenen
> ogeler icin bir fayda, hak ve/veya sonuc degeri ureten yontem.**

| | |
|---|---|
| Eklenen | Kimliksizlik |
| **Darlik** | **Orta-yuksek.** Kimlik toplayan her sistem disarida; POS kart okur, site cerez koyar - kacis **bedava** |
| **Patent gucu** | **EN YUKSEK.** Taramanin en net bulgusu (§42.6): anonim odul var ama rastgelelik yok (US8655722B1, EP2690590A1); rastgele odul var ama kimlik sart (US5774884 kart kodu okuyor, US20100153194 istem 1 kimlik sart). **Birlesim bulunamadi.** Ispati kolay - girdide kimlik var mi, bakilir |

### 47.4 ISTEM 4 (1a+1b) - + NICELIK + KIMLIKSIZLIK ✅ ONAYLI

> **Birden fazla ogeden olusacak, buyuklugune VE FAYDALANDIRILACAKLARIN
> NICELIGINE karar verilebilen bir evrende; KIMLIK ICERMEYEN bir ogenin evrene
> eklenmesi ile tetiklenen ancak ogenin eklenmesine ve/veya kendisine has
> ozelliklerinden bagimsiz olarak belirlenen ogeler icin bir fayda, hak ve/veya
> sonuc degeri ureten yontem.**

| | |
|---|---|
| Eklenen | k + kimliksizlik (ikisi cumlenin farkli yerinde, cakisma yok) |
| **Darlik** | 1a'nin cok az daralmasi + 1b'nin orta-yuksek daralmasi birikiyor. Rakip **birini** karsilamazsa kaciyor; **kimliksizlik darbogaz** |
| **Patent gucu** | **EN YUKSEK.** Taramada bulunamayan birlesim tam bu: anonimlik + nicelik karari + bagimsizlik. Uc patent de ucunu birden tasimiyor |
| **Islevi** | Temel ve tek unsurlu istemler reddedilirse ayakta kalacak **en guclu siginak**; alinma sansi en yuksek istem |

### 47.5 IPTAL EDILEN DENEMELER

**7-istem ve 15-istem yapilari:** 15 bagimsiz istem ⚠️ **butunluk itirazi**
(SMK m.91) neredeyse kesin -> ofis boler, her parca ayri basvuru/ucret/surec;
⚠️ **zayif istem gucluyu zehirler** - her ret icin gosterilen prior art dosyaya
girer; ⚠️ sure 3 yildan 6-7 yila cikar. Ve **15 bagimsiz istem 4'ten fazla
koruma saglamiyor** - hepsi ayni govdenin varyasyonu, birbirinin alt kumesi.

**KAPSAYICILIK ("evrendeki her oge aday") - IPTAL.** Kurucunun tespiti:
*"zaten ogenin eklenmesi ile tetiklenmiyor mu, her oge aday zaten."* Dogru -
tetikleme ifadesi her ogenin degerlendirildigini zaten soyluyor, **tekrar.**
Ayrica on filtre kacisi da kapali: rakip *"sadece ilk 1000 aday"* derse onun
**evreni** o 1000 oge olur, yine her oge aday.

**ONGORULEMEZLIK - IPTAL.** Kurucunun sorusu: *"ongorulemez ne demek, deger
belirsiz mi olacak yoksa ilan mi edilmeyecek?"* Iki okuma var:

| Okuma | Durum |
|---|---|
| (a) Deger belirsiz - bilgi uretilmemis | Mercisizlik **zaten** bunu soyluyor -> tekrar |
| (b) Ilan edilmemis - belli ama saklaniyor | **Prior art dolu** - her surpriz kampanyasi, her kazi-kazan |

Rakip belirsizligi kullanir: *"bizde de ongorulemiyor cunku aciklamiyoruz."*
Ya mugak ya tekrar -> isteme girmez.

### 47.6 KATMAN 1 TABLOSU

| # | Unsur sayisi | Eklenen | Darlik | Patent gucu |
|---|---|---|---|---|
| **1** | 0 | TEMEL (bagimsizlik) | En genis | Orta |
| **2** | 1 | k | Cok az | Orta-yuksek |
| **3** | 1 | kimliksizlik | Orta-yuksek | **En yuksek** |
| **4** | 2 | k + kimliksizlik | Birikmis | **En yuksek** |

En genisten en dara siralanmis; ofis yukaridan okur, ilk gecen verilir.

**MERCISIZLIK Katman 1'e alinmadi** - prior art acisindan temiz, daraltmasi
dusuk, ama **ispat yuku** var (olumsuzluk: rakibin mudahale etmedigini davaci
kanitlamak zorunda, koduna erisim gerekir). Katman 2 adayi.

---

## 48. ISTEM 5 - EN DAR SIGINAK ✅ ONAYLI

### 48.1 METIN

> **Birden fazla ogeden olusacak, buyuklugune VE FAYDALANDIRILACAKLARIN
> NICELIGINE karar verilebilen bir evrende; KIMLIK ICERMEYEN bir ogenin evrene
> eklenmesi ile tetiklenen ancak ogenin eklenmesine ve/veya kendisine has
> ozelliklerinden bagimsiz olarak VE YONTEMI UYGULAYAN DAHIL HICBIR TARAFIN
> ETKISI OLMAKSIZIN belirlenen ogeler icin bir fayda, hak ve/veya sonuc degeri
> ureten yontem.**

Uc ekleme: **nicelik karari (k) + kimliksizlik + mercisizlik.**

| | |
|---|---|
| **Darlik** | Uc unsur birikmis - en dar istem. Rakip **birini** karsilamazsa kaciyor |
| **Patent gucu** | **En yuksek.** Dort savunma birden: bagimsizlik, n+k kombinasyonu, anonimlik, mercisizlik |
| **Islevi** | 1-4 reddedilirse ayakta kalacak son siginak; **alinma sansi en yuksek istem** |
| **Zaafi** | ⚠️ Mercisizlik **ispat yuku** getiriyor (olumsuzluk: rakibin mudahale etmedigini davaci kanitlamak zorunda, koduna erisim gerekir). Tarifnamedeki test bunu hafifletiyor: *"uygulayan taraf belirli bir ciktiyi amaclasa bile elde edemez"* |

### 48.2 MERCISIZLIK neden secildi - 9 aday karsilastirmasi

| # | Unsur | Daraltma | Patent gucu | Karar |
|---|---|---|---|---|
| **1** | **MERCISIZLIK** | **Dusuk** | **Yuksek** | ✅ **SECILDI** |
| 2 | Kayitsizlik | Orta | Yuksek | Ikinci siradaydi |
| 3 | Devredilebilirlik | Dusuk | Orta-yuksek | Bulus cekirdegiyle ilgisi zayif |
| 4 | Girdi yalinligi | Cok dusuk | Dusuk-orta | Bagimsizlikla ortusuyor |
| 5 | Hafizasizlik | Orta-yuksek | Orta | Kayitsizligin turevi, tekrar |
| 6 | Durumsuzluk | **Yuksek** | Orta | Sayac eklemek bedava |
| 7 | Eszamanlilik | Orta | **Dusuk** | ⚠️ **PRIOR ART** - US5774884 istem 2-4 |
| 8 | Tekrarsizlik | Dusuk | Dusuk | Uygulama detayi; ayrica ayni kisi tekrar gelirse yeni oge sayiliyor -> kafa karistirir |
| 9 | Butce kapaliligi | Cok dusuk | **Dusuk** | 1a'daki k zaten kapsiyor -> tekrar |

**MERCISIZLIK'in gerekcesi:** en iyi daraltma/guc orani. Kacmak icin
mudahaleli sistem kurmak gerekiyor -> piyango rejimine girer, *"kimse
bilmiyor"* iddiasi oluri, urunun kendi deger onerisi bozulur. Patent
tarafinda: US5774884'te kazanan kod grubunu **operator belirliyor**
(*"winning codes chosen arbitrarily beforehand"* / *"set randomly by day,
week, or month"*); mercisizlik ondan net ayiriyor.

### 48.3 NIHAI BAGIMSIZ ISTEM SETI - 5 istem ✅

| # | Unsur | Eklenen | Darlik | Patent gucu |
|---|---|---|---|---|
| **1** | 0 | TEMEL - bagimsizlik | En genis | Orta |
| **2** | 1 | k | Cok az | Orta-yuksek |
| **3** | 1 | kimliksizlik | Orta-yuksek | **En yuksek** |
| **4** | 2 | k + kimliksizlik | Birikmis | **En yuksek** |
| **5** | 3 | k + kimliksizlik + mercisizlik | **En dar** | **En yuksek** |

**Yapi:** en genisten en dara, her kademe bir unsur ekliyor. Besi de ayni
govdeden turuyor -> **butunluk itirazi (SMK m.91) riski dusuk.**

**Hiyerarsi mantigi:** Ofis yukaridan okur, ilk gecen verilir. 1 kabul
edilirse en genis koruma; reddedilirse 2, 3, 4, 5 sirayla devralir.

**Format hedefi:** 5-6 bagimsiz + 9-10 bagimli (kurucu karari). **Bagimsiz
taraf tamamlandi.**

### 48.4 BAGIMLI ISTEM ADAYLARI (9-10 adet yazilacak)

Bagimsiz isteme girmeyen unsurlar, "Istem N'e gore yontem, ayrica ... ile
karakterize" kalibiyla:

| Aday | Unsur |
|---|---|
| 1 | Kayitsizlik - *hangi ogeye hangi degerin uretildigi kaydedilmeksizin* |
| 2 | Girdi yalinligi - *tetikleyicinin varligi disinda hicbir verinin etkisi olmaksizin* |
| 3 | Durumsuzluk - *onceki verilerden bagimsiz olarak* |
| 4 | Hafizasizlik - *onceki ogelerle iliskilendirilmeksizin* |
| 5 | Devredilebilirlik - *ucuncu bir tarafa devredilebilen deger* |
| 6 | Deger turu - *indirim orani, tutar, puan, kontor, hak, hizmet veya nesne* |
| 7 | Ortam - *satis noktasi, gecis noktasi, cevrimici ortam veya cihaz* |
| 8 | Evren turu - *yer, zaman araligi, olay veya toplulukla sinirlanmis evren* |
| 9 | Sifir deger - *uretilen degerin sifir olabilmesi* |
| 10 | Tekrarlanan oge - *ayni kaynaktan gelen her ogenin ayri oge sayilmasi* |

⚠️ 6-9 arasi "olabilmesi" kalibiyla yazilanlar **daraltmiyor**, tarifnameyi
isteme bagliyor. Ofis *"bu neyi sinirliyor"* diye sorabilir; vekil bunlari
eleyebilir.

---

## 49. ISTEM 6 ve 7 - kimliksizliksiz hatlar ✅ ONAYLI

### 49.1 Neden iki istem daha - bosluk analizi

Mevcut 5 istemde iki gercek bosluk vardi:

| Bosluk | Aciklama |
|---|---|
| **B1** | Istem 3, 4, 5'in **ucu de kimliksizlik tasiyor.** Ofis kimliksizligi reddederse elde yalnizca 1 ve 2 kaliyor (0-1 unsurlu, zayif). **Kimliksizlik tasimayan guclu istem yok** |
| **B2** | Mahremiyet **tek yoldan** savunuluyor (kimlik toplamama). Alternatif hat yok |

10 kombinasyon tarandi, 5'i testi gecti (A, B, C, E, F). Secilen ikisi:
**k + gecmis deger bagimsizligi** ve **k + mercisizlik.**

### 49.2 ISTEM 6 - k + GECMIS DEGER BAGIMSIZLIGI

> **Birden fazla ogeden olusacak, buyuklugune VE FAYDALANDIRILACAKLARIN
> NICELIGINE karar verilebilen bir evrende; bir ogenin evrene eklenmesi ile
> tetiklenen ancak ogenin eklenmesine ve/veya kendisine has ozelliklerinden
> VE ONCEKI OGELER ICIN URETILMIS DEGERLERDEN bagimsiz olarak belirlenen
> ogeler icin bir fayda, hak ve/veya sonuc degeri ureten yontem.**

**Kurucunun hamlesi:** kayitsizlik yerine *"onceki ogelere verilenlerden
bagimsiz"*. Uc unsuru ayirmak gerekiyor:

| Unsur | Ne reddediyor |
|---|---|
| Kayitsizlik | Eslestirmenin **saklanmasini** (mahremiyet iddiasi) |
| Durumsuzluk | Onceki **verilerin** etkisini (genis, her tur gecmis) |
| **Gecmis deger bagimsizligi** | Onceki ogelere **uretilmis degerlerin** etkisini |

Ucuncusu daha keskin ve bir seyi reddediyor: **telafi/dengeleme mekanizmasi.**
*"Bu ogeye az verdik, sonrakine fazla verelim"* veya *"son 10 ogeye hic
vermedik, simdi vermeliyiz"* gibi dengeleme yok.

| | |
|---|---|
| **Darlik** | **Orta** - telafi/dengeleme kullanan sistemler disarida; cogu sistem boyle calismiyor |
| **Patent gucu** | **Orta-yuksek.** US20100153194 **tam bunu yapiyor:** *"alters odds based on frequency of past wins or losses"* - gecmis kazanclara gore olasilik degistiriyor. Bu unsur ondan net ayiriyor |
| **Kayitsizliga gore avantaji** | ⚠️ **Muhasebe celiskisi yok.** Kayitsizlikta *"kayit tutmuyoruz"* demek fatura sorunu doguruyordu (indirim tutari faturada gorunmek zorunda); burada kayit tutulabilir, yalnizca **kullanilmiyor** |
| **B1/B2** | B1 ✓ (kimliksizlik tasimiyor) · B2 ✓ (alternatif hat) |

### 49.3 ISTEM 7 - k + MERCISIZLIK

> **Birden fazla ogeden olusacak, buyuklugune VE FAYDALANDIRILACAKLARIN
> NICELIGINE karar verilebilen bir evrende; bir ogenin evrene eklenmesi ile
> tetiklenen ancak ogenin eklenmesine ve/veya kendisine has ozelliklerinden
> bagimsiz olarak VE YONTEMI UYGULAYAN DAHIL HICBIR TARAFIN ETKISI OLMAKSIZIN
> belirlenen ogeler icin bir fayda, hak ve/veya sonuc degeri ureten yontem.**

| | |
|---|---|
| **Darlik** | **Dusuk** - iki unsur da az daraltiyor |
| **Patent gucu** | **Yuksek.** Dosyanin cekirdek ayrimi: *"miktar kontrollu, dagilim bilinmez."* Piyangoda ikisi de bilinir |
| **Islevi** | **Istem 5'in kimliksizliksiz hali** - ayni savunma, bir unsur eksik, yani **daha genis** |
| **B1/B2** | B1 ✓ · B2 ✗ |

### 49.4 ELENEN ADAYLAR

| Kombinasyon | Eleme gerekcesi |
|---|---|
| kimliksizlik + kayitsizlik | Iki yuksek-darlik unsuru birlikte -> cok dar |
| k + mercisizlik + kayitsizlik | Istem 5'e cok yakin (kimliksizlik yerine kayitsizlik) |
| mercisizlik + kayitsizlik | Istem 6'nin k'siz hali; 6 daha iyi |
| k + kimliksizlik + kayitsizlik | Istem 4'un **alt kumesi** |
| k + girdi yalinligi | Girdi yalinligi bagimsizlikla **ortusuyor**, yeni sey katmiyor |
| k + durumsuzluk | Durumsuzluk kolay atlatiliyor (sayac bedava) |
| kimliksizlik + durumsuzluk | Ayni sorun |
| 4 unsurlu kombinasyonlar | Asiri dar, 5'in alt kumesi |

### 49.5 NIHAI 7 BAGIMSIZ ISTEM - en genisten en dara

| # | Unsur | Eklenenler | Kimliksizlik | Darlik | Guc |
|---|---|---|---|---|---|
| **1** | 0 | TEMEL - bagimsizlik | — | **En genis** | Orta |
| **2** | 1 | k | ✗ | Cok az | Orta-yuksek |
| **3** | 1 | kimliksizlik | ✓ | Orta-yuksek | **En yuksek** |
| **7** | 2 | k + mercisizlik | ✗ | **Dusuk** | Yuksek |
| **6** | 2 | k + gecmis deger bagimsizligi | ✗ | Orta | Orta-yuksek |
| **4** | 2 | k + kimliksizlik | ✓ | Birikmis | **En yuksek** |
| **5** | 3 | k + kimliksizlik + mercisizlik | ✓ | **En dar** | **En yuksek** |

⚠️ **SIRALAMA NOTU:** Yukaridaki tablo **darlik sirasina** gore dizilmis.
Basvuruda istemler bu sirayla numaralandirilmali (en genis = Istem 1):
**1 → 2 → 3 → 7 → 6 → 4 → 5**

Yani mevcut "6" ve "7" numaralari gecicidir; basvuru metninde yeniden
numaralandirilacak.

**Kimliksizlik dagilimi:** 3, 4, 5 tasiyor; 1, 2, 6, 7 tasimiyor. Ofis
kimliksizligi reddederse **dort istem ayakta kalir** (B1 cozuldu).

**Format durumu:** 7 bagimsiz istem. Kurucunun hedefi 5-6'ydi; 7'ye cikildi.
⚠️ Butunluk itirazi riski artar ama hepsi ayni govdeden turuyor, risk yonetilebilir.

---

## 50. YENILIK AGIRLIKLARI YENIDEN - "ESIHTIMALLIK" bulundu

> 15 Ekim 2026. Kurucunun sorgulamalari §42/§49'daki yenilik
> degerlendirmelerini duzeltti ve **yeni bir unsur** ortaya cikardi.

### 50.1 YENI UNSUR: ESIHTIMALLIK

**Kurucunun tanimi:** *"Her eklenen ogenin, gecmis ve yeni eklenecek sayi ne
olursa olsun, esit ihtimalde sansli olusu."*

> **ESIHTIMALLIK** = *"evrene eklenen her ogenin, eklenme sirasindan ve
> evrenin nihai buyuklugunden bagimsiz olarak esit olasilikla
> faydalandirilacak olmasi"*

**Neden teknik bir PROBLEM cozuyor:**

Evren akarken esitligi korumak celiskili gorunur. Ilk oge geldiginde evren 1,
sonuncu geldiginde 1000. Sistem her oge icin *"k/n ihtimalle ver"* diye
calisirsa n buyudukce sans degisir -> ilk ogeler avantajli olur. Esitligi
korumak icin evrenin tamamlanmasini beklemek gerekir, ama o zaman **anlik
deger uretilemez.**

**Iki sey catisiyor: anlik uretim ile esit ihtimal.** Bu yontem ikisini birden
sagliyor.

**Prior art'ta cozumu YOK:**

| Patent | Durum |
|---|---|
| Piyango | Havuz bastan tam -> problem hic dogmuyor |
| US5774884 | Per-islem olasilik (1-100); esitlik iddiasi yok |
| USRE45006E1 | Sabit oran (100'de 1); esitlik degil |
| US20100153194 | Gecmis kazanclara gore olasilik **degisiyor** - tam tersi |

**Patent dilindeki degeri:** digerleri bir *durum* tarif ediyor; bu bir
**cozulmus teknik problem.** "Teknik problem + cozum" yapisi patentte en
guclu argument bicimi.

⚠️ **Sart:** mekanizma bunu gercekten saglamali, yoksa istem kendi bulusunu
kapsamaz. **Kurucu teyit etti: mekanizma bunu sagliyor.** (Ispat teklif
edildi, **reddedildi** - mekanizma bu dosyaya yazilmaz.)

### 50.2 BIRIKEN EVREN - yenilik degeri yukseltildi

**Kurucunun itirazi:** *"Hicbir sistemde biriken evren var mi?"*

§49'da evren *"her kampanya bir evrende calisir, yenilik degil"* diye
degerlendirilmisti. **Yanlis** - ayrim statik/biriken ekseninde:

| Patent | Evren |
|---|---|
| Piyango | Biletler **basilmis**, havuz bastan tam |
| US5774884 | Tanimli kume; *"pre-filtering"* ile daraltiliyor |
| US20100153194 | *"generates and stores an initial pool"* - onceden olusturulmus |
| Kumar makinesi | Cark yuzleri sabit |
| Kontenjanli kupon | 1000 kupon basilmis |

**Hicbirinde evren akarak olusmuyor.** Hepsinde once havuz kurulur, sonra
icinden secim yapilir.

| | Yenilik mi |
|---|---|
| "Bir evrende calismak" | ✗ Degil |
| **"Biriken evren"** | ✓ **Yeni** - bulunamadi |

Istemdeki karsiligi **"olusacak"** kelimesi (§31.2'de sifir-baslangic
celiskisi icin secilmisti; degeri sanilandan buyuk).

**Ve piyango kiyasini guclendiriyor:** piyangoda satilmayan bilete odul isabet
edebilir cunku havuz bastan tam; biriken evrende her oge gerceklesmistir,
bosa giden ihtimal yoktur.

### 50.3 MERCISIZLIK - yenilik degeri DUSURULDU

**Kurucunun tespiti:** *"Mercisizlik hala bagimsizlik siddetinde bir bulus
degil, onu anladim."*

**Dogru.** Fark:

| | Ne yapiyor | Ispat |
|---|---|---|
| **Bagimsizlik** | Bir **yapiyi** reddediyor (girdiden turetme) | Test edilebilir |
| **Mercisizlik** | Bir **durumu** tarif ediyor (mudahale yoklugu) | Tartismaya acik |

Ofis diyebilir: *"rastgele sayi kullanan her sistemde zaten kimse
yonlendirmez"* -> mercisizlik rastgeleligin **sonucu** gibi gorulebilir.

**Hayattaki ustunlugu gercek ama patentte zayif:**

Piyango guveni **denetimle** sagliyor (noter, komisyon, kamera) - o kadar
denetim mekanizmasi, mudahalenin **mumkun oldugu** varsayimi uzerine kurulu.
Bu yontem guveni **yapiyla** sagliyor; denetlenecek bir mudahale noktasi yok.

Bu argument **tarifnameye** yazilir, ama istemde yenilik yuku bindirilmez.

### 50.4 Elenen mekanizma fikirleri (kurucu sorulari uzerine)

| Fikir | Neden elendi |
|---|---|
| **"Yoldan geci cevirip iki rakam soyletmek"** metaforu | Dis kaynaktan rastgelelik **bilinen teknik**: donanim entropisi (her OS'ta standart), blockchain hash, random.org (1998'den beri), Cloudflare lava lambalari. Ofis: *"kaynagin cinsi onemsiz."* Metafor **tarifnameye ornek** olur, yenilik iddiasi olmaz |
| **Yapay zeka ile belirleme** | (a) AI ile karar vermek 2020'lerin en yaygin teknigi -> prior art dolu; (b) **ispat sorunu** - model agirliklari/prompt degistirilebilir, mercisizlik coker; (c) AI **deterministik**, rastgelelik icin ayrica kaynak gerekiyor -> araya gereksiz kutu; (d) egitim verisinden ortuntu ogrenmis olabilir -> **bagimsizlik iddiasi riske girer** |
| **Ilk ogenin sepet tutarindan tohum uretme** | ⚠️ **CELISKI** - istem *"ozelliklerinden bagimsiz"* diyor, tarifname tutar kullaniyor -> *"istem desteklenmiyor."* Ozellik tanimi bunu kapsiyor: *"ondan **turetilebilen** her turlu veri."* Ayrica tutari bilen k'yi hesaplar -> mercisizlik coker. Prior art: US6292786B1 *"incentives based on real-time purchase information"* |

> **Mekanizma karari istemde YAZILMIYOR** - kaynak adi gecmedigi icin hangi
> yol secilirse secilsin istem kapsiyor. Kurucunun kurali: *"bunu bir seye
> baglarsan, baskasi baskasina baglar."* Tarifnamede **bir** uygulama ornegi
> verilir (ofis *"uzman kisi uygulayabilir mi"* diye bakar), istem onunla
> sinirlanmaz.

### 50.5 GUNCEL YENILIK SIRALAMASI

| Unsur | Yenilik gucu | Gerekce |
|---|---|---|
| **ESIHTIMALLIK** | **En yuksek** | Cozulmus teknik problem; prior art'ta cozumu yok |
| **BIRIKEN EVREN** | **Yuksek** | Hicbir patentte evren akarak olusmuyor |
| **BAGIMSIZLIK** | **Yuksek** | US20100153194 *"tutardan bagimsiz"* yazmis ama "hicbir ozellikten" bulunamadi |
| NICELIK KARARI (k) | Orta-yuksek | WO1999021103 kazanan sayisi belirlemeyi yazmis |
| KIMLIKSIZLIK | Orta-yuksek | ⚠️ **Tek basina ESKI** (US8655722B1 tam eslesme); birlesimde guclu |
| MERCISIZLIK | **Orta** | Rastgelelikten ayirt edilmesi zor |
| Gecmis deger bagimsizligi | Orta | US20100153194'ten ayiriyor |

**Kritik ayrim - tek basina vs birlesimde:**

| Unsur | Tek basina | Birlesimde |
|---|---|---|
| Esihtimallik | **Yeni** | Guclu |
| Biriken evren | **Yeni** | Guclu |
| Bagimsizlik | Kismen yeni | Guclu |
| Kimliksizlik | **Eski** - US8655722B1 | Guclu |
| Mercisizlik | **Eski** - her RNG | Orta |

### 50.6 SIRADAKI IS

**ESIHTIMALLIK istemlere yerlestirilecek.** Su an hicbir istemde yok; yenilik
gucu en yuksek unsur istemsiz duruyor.

**BIRIKEN EVREN one cikarilacak** - su an *"olusacak"* kelimesiyle govdede
gizli; vurgulanmasi gerekiyor.

Mevcut 7 istem bu iki unsur isiginda yeniden degerlendirilecek.

---

## 51. GERÇEK LİTERATÜR TARAMASI — Neuchâtel ekolü okundu

**Tarih:** 17 Ekim 2026
**Yöntem:** Tam metin indirildi ve okundu. Özet/soyut üzerinden hüküm verilmedi.

### 51.1 ÖNCE: İKİ METODOLOJİK HATANIN KAYDI

Bu bölüm iki hatanın düzeltilmesinden doğdu. İkisi de tekrarlanmamalı.

**HATA 1 — Tarifname ile istem karıştırıldı.**

§42 ve §43'te patentler okunurken, metinde geçen her ifade *"bu patentlenmiş"*
sayıldı. Yanlış. Patentte korunan **yalnızca istemlerdir**. Tarifname yüz sayfa
olabilir; içindeki fikirler korunmuyorsa kimsenin tekelinde değildir.

Ayrıca iki ayrı soru vardır ve ayrı tutulmalıdır:

| Soru | Nereye bakılır |
|---|---|
| **İhlal** — rakip bizi engeller mi? | Yalnızca **istemler** |
| **Yenilik** — bizim buluş yeni mi? | **Tüm yayım** (tarifname dahil) |

Terk edilmiş/süresi dolmuş başvurularda **hiçbir istem korunmaz** (ihlal riski
yok) ama **yayım oldukları için yenilik açısından sayılırlar**. §42'de
*"terk edilmiş, sorun yok"* denmişti — ihlal için doğru, yenilik için yanlış.

**HATA 2 — Yapay zekâ kaynaklarının künyelerine güvenildi.**

Danışılan harici YZ kaynağı **üç kez uydurma referans üretti**:

| İddia | Gerçek |
|---|---|
| "Stateless Cross-Sectional Fairness Problem" literatürde var | **Yok.** Kaynak kendisi kabul etti: *"tarafımdan üretilmiş sentetik kavramlaştırmadır"* |
| US10860998B2 = "Stateless deterministic random sampling for distributed event processors" | **Yanlış.** Gerçek başlık: *"Payment processing with two-portion tokens at a point-of-service"*, sahibi PayNearMe (eski Handle Financial), öncelik 2011. Rastgele örnekleme veya kesitleme **yok** |
| McNicholas (2010), "Online Stratified Sampling for Streaming Data", JSPI 140(5) | **Bulunamadı.** Böyle bir makale yok. En yakın: *"Online stratified sampling: evaluating classifiers at web-scale"* (CIKM '10) — farklı yazar, farklı dergi, farklı konu |
| RFC 2698 = "Periodic Block Pseudo-Random Interleaving" | **Yanlış.** RFC 2698 = *"A Two Rate Three Color Marker"* (Heinanen & Guerin, Eylül 1999) — DiffServ trafik işaretleme. Örnekleme yok, rastgelelik yok |

**"Numara gerçek, konu uydurma"** en tehlikeli hata tipidir: doğrulanabilir
görünür.

**KURAL: Hiçbir YZ künyesi doğrulanmadan dosyaya girmez.**

### 51.2 STRATIFIED SAMPLING İTİRAZI — ÇÜRÜDÜ

Harici kaynak son değerlendirmesinde şunu iddia etti:

> *"Bu yapı, tek başına devrimsel yeni bir algoritma olarak değil; Systematic
> Stratified Sampling ilkesinin Pre-computed Block-Permutation ile
> birleşimidir... Sizin modelinizin tam karşılığıdır."*

Bu iddia **yanlış** ve yanlışlığı literatürün kendi tanımından çıkıyor.

**Katmanlı örneklemede (stratified sampling) katmanlar yardımcı değişkene göre
kurulur.** Kaynaklar aynı şeyi söylüyor:

- *"units are grouped into strata by their values on one or more auxiliary
  variables"*
- *"the strata chosen from variables known in advance for every unit"*
- *"the more strongly the auxiliary variables correlate with the target
  variables, the greater the benefit"*

Yani katmanın **varlık sebebi** öğenin bir özelliğidir: yaş, bölge, ciro,
nüfus. Amaç homojen alt gruplar kurup varyansı düşürmektir.

**Bizde yardımcı değişken yoktur.** Kesit yalnızca sayımla kurulur; öğenin
hiçbir özelliğine bakılmaz. Stratifikasyonun amacı (varyans düşürme) bizde
hiç yoktur.

Akış literatüründeki katmanlı çalışmalar da (Nguyen et al. 2020 S-VOILA;
Lee et al. SSDBM 2010 "Stratified Reservoir Sampling") **hepsi anahtar/özellik
bazlı katman** kullanır.

**SONUÇ: Bizim kesit yapımız stratified sampling değildir. Katmanı özelliğe
göre değil sıraya göre kurmak, kimliksizlik unsurumuzun ta kendisidir.**

### 51.3 NEUCHÂTEL EKOLÜ — alan haritası

En yakın prior art, Yves Tillé (Université de Neuchâtel) ve öğrencilerinin
akıştan örnekleme çalışmalarıdır. Tam metinler okundu.

| Yıl | Çalışma | Künye |
|---|---|---|
| 1949 | Sistematik örnekleme | Madow, W.G., *Annals of Mathematical Statistics* 20:333–354, DOI 10.1214/aoms/1177729988 |
| 1982 | Reservoir (genel amaçlı) | Chao, M.-T., *Biometrika* 69:653–656 |
| 1985 | Reservoir sampling | Vitter, J.S. |
| 1998 | Ordered pivotal / splitting | Deville & Tillé, *Biometrika* 85:89–101 |
| 1998 | Deville sistematik | Deville, J.-C., Technical Report 9804, Insee Paris |
| 2006 | Kitap | Tillé, Y., *Sampling Algorithms*, Springer |
| 2009 | VarOpt | Cohen, Duffield, Kaplan, Lund & Thorup, ACM-SIAM SODA; *SIAM J. Computing* 40(5):1402-1431 (2011); arXiv:0803.0473 |
| 2012 | Eşdeğerlik kanıtı | Chauvet, G., *Bernoulli* 18(4):1320-1340 |
| 2012 | Hayalet öğe (phantom unit) | Grafström, Matei, Qualité & Tillé, *Electronic J. Statistics* 6:1477-1489 |
| 2019 | Akıştan dengeli örnekleme | Tillé, Y., *Information Processing Letters* 152:1-6, DOI 10.1016/j.ipl.2019.105840 |
| 2020 | Saldırıya dayanıklı | Busnel & Tillé, ICCDA 2020 San Jose, s.72-78, DOI 10.1145/3388142.3388162, hal-02456880 |
| 16 Kas 2021 | **OSOD** | Panahbehagh, Jauslin & Tillé, *"Sequential Unequal Probability Sampling For Stream Population"*, arXiv:2111.08433 |
| 17 Kas 2021 | **IDS** | Panahbehagh, Jauslin & Tillé, *"Stream Sampling with Immediate Decision"*, arXiv:2111.09309 |

**Alanın açık olduğunun kanıtı:** OSOD (16 Kasım) kendini *"ilk yöntem"* diye
tanıtıyor, IDS ise bir gün sonra (17 Kasım) yayınlanıyor. 2021'de hâlâ
"ilk"lerin kurulduğu bir alan.

### 51.4 IDS 2021 — EN YAKIN PRIOR ART, TAM METİN OKUNDU

**Panahbehagh, Jauslin & Tillé (2021), arXiv:2111.09309 [cs.DS], 9 sayfa.**

Soyut: *"The manuscript introduces a method to select a random sample from a
stream by deciding on each sampling unit immediately after observing it."*

**Ne olduğu:** Yeni bir tasarım değil. Kendi özeti: *"The proposed algorithm
gives a straightforward implementation of Deville's (ordered pivotal) sampling
design."* Result 3: IDS ve Deville sistematik örneklemesi **aynı tasarımın iki
uygulaması**. Yani kök 1998'de.

**Algoritma 1 (tam metinden):**

```
F = 0, n = 0, s = {}
Öğe j geldiğinde:
  1. u ~ Uniform[0,1]
  2. F1 = F,  F = F + pi_j,  alfa = ceil(F) - floor(F1) - 1,
     beta = ceil(F) - n,  m = F1 - floor(F1)
  3. u <= [min(beta,1)*pi_j - alfa*(2-beta)*(1-m)] /
          [(1-alfa)*(1-m) + alfa*{(2-beta)*m + pi_j*(beta-1)}]
     ise s = s + {j}, n = n + 1
```

**BİZDEN BEŞ TEMEL FARKI:**

**(1) pi_j girdidir, türetilmiş değil — ve nereden geldiği makalede hiç yok.**

Algoritmanın girdisi her öğenin pi_j değeri. Makale bunun nereden geldiğini
**hiç ele almıyor**, çünkü klasik örneklemede pi_j öğenin bir özelliğinden
türer (büyüklük, ciro, tutar — bu yüzden adı *unequal probability sampling*).

Bizde olasılık öğenin hiçbir özelliğinden gelmez; **k/M'den, yalnızca
sayımdan** türer. Bu kimliksizlik unsurumuzun ta kendisidir.

**(2) Pencere sabit sayıda öğe değil, olasılık kütlesidir.**

Tanım: *"the sum of inclusion probabilities within the window is one"* —
pencere olasılıklar toplamı 1 olunca kapanır. Öğe sayısı değişkendir.

Sonucu: **bir öğe iki pencereye bölünür** ("cross-border unit").

**(3) Karar her öğe için anında kesinleşmez.**

Makalenin adı "immediate decision" ama cross-border öğeler için karar
erteleniyor: *"if v11 is rounded to 0, then we do not make final decision about
unit v1 and **postpone** making decision about this unit later by updating
v12."*

Bizde hiçbir öğe bölünmez, hiçbir karar ertelenmez.

**(4) Pencere başına TAM 1 seçim. Bizde k serbesttir.**

Result 4, ilk satır: *"If j and j' are two non-cross-border units that belong
to the same window, then pi_jj' = 0."* Aynı pencereden **iki öğe asla birlikte
seçilmez**.

Bizim kesitte k=2, k=10 olabilir. **IDS bunu yapamaz.**

**(5) Amaç tahmindir, tahsis değil.**

Makale baştan sona: *"The sample is generally selected with the aim of
estimating some population parameters"* + Horvitz-Thompson estimatörü +
ikinci derece dahil olma olasılıkları (Result 4, beş formül).

İkinci derece olasılıklar **yalnızca varyans hesabı için** gerekir. Bizde
tahmin yoktur; seçilen öğe **sonuç alır**, ölçülmez.

**Makalede OLMAYANLAR (grep ile doğrulandı):**

- Bellek analizi yok — O(1) iddiası hiç geçmiyor
- Simülasyon yok — 9 sayfa tamamen teorik
- **Kimlik / anonimlik / mahremiyet: sıfır kez geçiyor**

**Hayalet öğe notu:** IDS yarım pencere için *"a phantom unit (Grafström
et al., 2012) will be added"* diyor. Harici kaynağın bize önerdiği "padding"
çözümü **literatürde var ve 2012'ye ait**. Uygulamadığımız iyi oldu: hem
gereksiz (bkz. 51.8), hem bilinen teknik.

### 51.5 OSOD 2021 — N BİLİNMEK ZORUNDA

**arXiv:2111.08433 [stat.ME], 16 sayfa.** Aynı üç yazar, IDS'ten bir gün önce.

İddiası güçlü: *"The OSOD method is the first method in unequal probability
sampling that can decide about the units completely based on their order."*

**Ama bizim 1. koşulumuzu karşılamıyor.** Denklem (1):

```
toplam(k=2..N) min(c1 * pi_k, 1) = n
```

Bu denklem **tüm popülasyonu (N) gerektirir.** Sabit c1 ancak N biliniyorsa
hesaplanır. Yani OSOD akış için uyarlanmış ama **N meçhul koşulunu
sağlamıyor.**

Kendi ifadesi: *"After the first step, the decision is irrevocably made for
unit 1"* — geri dönülemezlik var, ama bedeli N'nin bilinmesi.

### 51.6 BUSNEL & TILLÉ 2020 — ÖNGÖRÜLEMEZLİK TEKNİK PROBLEMDİR

**Bu bölümün en değerli bulgusu.** ICCDA 2020, DOI 10.1145/3388142.3388162.

Soyut: *"we propose a family of new sampling techniques that take into account
both the sliding window model and the presence of a **malicious adversary**."*

Sonuç: *"less predictable and seems appropriate to be **protected from
malicious attacks** when sampling from a stream."*

Mekanizma: Fuller (1970) yönteminin yayılma (spreading) ayar parametresiyle
genelleştirilmesi.

**NEDEN ÖNEMLİ:**

Harici kaynak *"anlık/öngörülemez karar bir iş kuralıdır (business
requirement), COMVIK'e göre teknik probleme dahil edilmez"* demişti.
**Bu literatür aksini gösteriyor:** öngörülemezlik bir **güvenlik problemi**
olarak tanımlı ve çözümü için ayrı bir makale yazılmış.

Saldırgan modeli: kötü niyetli taraf saldırısını **örneklenmeyen öğeler
arasına saklıyor** (*"his attacks among the unsampled packets"*). Yani seçimin
öngörülebilir olması somut bir güvenlik açığıdır.

**Bu, kurucunun baştan beri söylediği şeyin teknik dayanağıdır:**

> *"benim için en önemli şey öngörülemezlik"*

**Madow 1949 bu yüzden elenir.** OSOD'un giriş cümlesi:

> *"Systematic sampling with unequal probabilities (Madow, 1949) allows
> sequential sampling from a stream. However, once the first units are
> examined, this method quickly becomes **deterministic, making it
> predictable**, which can be problematic. Indeed, sampling cannot be
> predictable if it is used to perform a control."*

Madow'un yöntemi (rastgele başlangıç + her k'ıncı öğe) dört koşulu sağlar ama
ilk seçimden sonra **tüm kazananlar bellidir**. Bizim kesit yapısında her
kesit yeniden randomize edilir; öngörülemezlik sürer.

**Ayrıca:** Busnel & Tillé'nin çözümü **ayar parametresi** gerektirir. Bizde
ayar parametresi yoktur — her kesit sıfırdan randomize.

### 51.7 TILLÉ 2019 — MOTİVASYON BİZİM ALAN, MANTIK TERS

*Information Processing Letters* 152:1-6 (2019).

Motivasyonu bizim uygulama alanımız: **finansal işlemler.** Ama mantık ters:

> *"financial transactions selected with unequal probabilities **proportional
> to their amounts** or to an index that measures the risk of fraud"*

**Tutara oranlı seçim.** Bizim istemimizin çekirdeği ise tutardan
bağımsızlıktır (bkz. kurucu: *"tutarın miktarı etkisiz, tutar değişken
sonuçta. ama tutarın varlığı etkili"*).

**Literatürün tamamı "unequal probability sampling" — yani kasıtlı olarak
eşitsiz.** Sebebi: amaç tahmindir. Büyük işlemi daha sık seçersen toplamı
daha iyi tahmin edersin (Horvitz-Thompson).

Bizim amacımız tahmin değil **tahsis**; o yüzden eşit olasılık isteriz.
**Eşit olasılık + tahsis birleşimi bu ekolün hiç bakmadığı yerdir.**

### 51.8 YARIM KESİT İTİRAZI — ÇÜRÜDÜ (kurucu itirazı)

Harici kaynak şöyle bir açık iddia etmişti: M=100, k=2 kesitte akış 40. öğede
biterse, gerçekleşen oran 2/40=%5 veya 0/40=%0 olur, *"eşitlik çöker"*,
EPC m.83 / SMK m.92 (yetersiz açıklama) itirazı doğar.

**Kurucu itirazı iki cümlede çürüttü:**

> *"gelmiş olsalardı eşit ihtimal devam ederdi. yani tezimizi çürütmüyor ki"*

> *"iddiamızı son kişiye göre yapamayız çünkü sistemde akışkan. son kişi
> hiçbir zaman olmayacak ki. biz sonsuz kesitlerden oluşan bir evren
> tanımladık"*

**Harici kaynak itirazı geri aldı:** *"İtirazınızı TAMAMEN KABUL EDİYORUM.
Olasılık teorisi açısından yaptığınız ayrım %100 doğrudur ve önceki
yanıtımdaki frekans odaklı eleştiri bir olasılık iddiasını çürütme yöntemi
olarak geçersizdir."*

**Hatanın adı: gerçekleşen frekans ile a priori olasılığın karıştırılması.**
Zar 3 kez atılıp 6 gelmemesi P(6)=1/6 iddiasını çürütmez.

**Optional Stopping Theorem de bizi destekliyor** (kaynak kendi atfını
*"kavramsal bağlamı zorlayan hatalı bir zorlama"* diye geri aldı, sonra
doğrusunu kurdu):

S_n = toplam(X_j), E[X_j] = k/M, ve M_n = S_n - n*(k/M) bir martingale.
tau durdurma zamanı için OST:

```
E[S_tau] = E[tau] * (k/M)
```

**Yani akış herhangi bir anda kesilse bile, dağıtılan beklenen değer sayısı
geçen öğe sayısıyla orantılı kalır.** Bu, *"578 kesit çalıştı, 579. değer
dağıtılmadı"* sorusunun matematiksel cevabıdır: dağıtılmayan değer **hiç
eklenmemiş bir öğeye** aittir.

**TARİFNAMEYE YAZILACAK PARAGRAF:**

> Yöntem akışın sonlanmasını varsaymaz; her kesit açıldığında dolmamıştır ve
> dolduğunda kapanır. Dolayısıyla dolmamış bir kesit eksiklik değil, yöntemin
> normal işleyiş hâlidir. Eşit olasılık her öğe için eklenme anında geçerlidir
> ve akışın kesildiği nokta geriye dönük olarak bu olasılığı değiştirmez.
> Dağıtılan değer sayısı, evrene eklenen öğe sayısıyla orantılıdır;
> öngörülenden az öğe eklenmesi hâlinde daha az değer üretilir. Bu bir sapma
> değil, yöntemin öğe sayımına dayanmasının doğal sonucudur.

**Reddedilen çözümler:**

- **Padding / hayalet öğe** — gereksiz (açık yok) + Grafström 2012'de zaten var
- **k-1 dağıtım** — son pozisyonun şansını sıfırlar, eşihtimalliği bizzat
  bozar; gerekçesi olmayan sayısal kısıt gerekçesiz daraltmadır

### 51.9 EŞİHTİMALLİK İFADESİ — KESİNLEŞTİ

Kurucu önerisi *"eklenen her öğe eşihtimalle"* idi. **Düzeltildi:**
"eşihtimalle eklenen" ifadesi öğenin evrene **girişinin** rastgele olduğu
anlamına gelir. Oysa öğe evrene kesin olarak girer; rastgele olan **değer
alıp almamasıdır.**

**ONAYLANAN İFADE (24. bölüm sözlüğündeki hâli korundu):**

> **her öğenin, eklenme sırasından bağımsız olarak eşit olasılığa sahip
> olması**

Gerekçe: "sıra" kelimesi hem yarım kesit itirazını hem reservoir sampling'i
tek hamlede karşılar (reservoir'da da sıra kazananı etkiler).

**Harici kaynak bu ifadeyi savunulabilir buldu** ve kendi tablosunu düzeltti:
*"Kesit içi marjinal olasılık k/M olarak tanımlandığında EVET, sağlanır."*
Ayrıca *"payda N yerine sabit M alınması imkânsızlık kanıtını ortadan
kaldırmıştır."*

**Literatürdeki doğru adlandırmalar** (ilki doğrulandı):

- *Within-Stratum Equiprobability* — Cochran (1977), *Sampling Techniques*
- *Conditional Equiprobability Given Segment Membership* —
  P(X_i=1 | i kesit S_m içinde) = k/M
- *"Local Expected Equiprobability"* — **kaynağın kendi türetmesi, literatürde
  yok** (kaynak kabul etti)

### 51.10 ALTI YÖNTEM, BEŞ KOŞUL — nihai tablo

Beşinci koşul **öngörülemezlik** olarak eklendi (51.6 gerekçesiyle).

| Yöntem | N meçhul | O(1) bellek | Sıra-bağımsız eşitlik | Girişte kesin karar | Öngörülemez |
|---|---|---|---|---|---|
| Madow 1949 sistematik | ✓ | ✓ | ✓ | ✓ | **✗ deterministik** |
| Fisher-Yates | ✗ | ✗ | ✓ | ✗ | ✓ |
| Reservoir (Chao 1982, Vitter 1985) | ✓ | ✓ | ✓ | **✗ eviction** | ✓ |
| VarOpt (Cohen et al. 2009) | ✓ | ✓ | **✗ ağırlıklı** | ✗ | ✓ |
| Bernoulli / Poisson | ✓ | ✓ | ✓ | ✓ | **✗ k sabit değil** |
| OSOD 2021 | **✗ N gerekli** | ✗ pencere | ✗ eşitsiz | ✓ | ✓ |
| IDS 2021 | ✓ | ? analiz yok | ✓ (olasılıklar eşitse) | ~ cross-border | ✓ |
| **BİZİM YÖNTEM** | ✓ | ✓ | ✓ | ✓ | ✓ |

**En öğretici satır Madow'dur:** dört koşulu sağlar, beşincide çakılır — ve
literatür bunu açıkça kusur sayar.

**En yakın satır IDS'tir:** olasılığı girdi alır, kesit başına tek seçim yapar.

### 51.11 SECRETARY PROBLEM — İLGİSİZ, tarandı

Tarandı ve elendi. Orada amaç **en iyiyi seçmektir** (maksimumu bulmak), eşit
şans vermek değil. Öğeler karşılaştırılır ve sıralanır — bizim bağımsızlık
unsurumuzun tam tersi. Klasik kuruluşta N bilinir.

### 51.12 50.6 SIRADAKİ İŞ — BU TARAMANIN ETKİSİ

50.6'da iki iş bırakılmıştı. Bu tarama ikisini de etkiliyor:

**1. EŞİHTİMALLİK istemlere yerleştirilecek** → ifadesi 51.9'da kesinleşti.
Ekleneceği yer temel istemdir (ayrı damar açmaya gerek yok; bağımsızlık
unsuru eşihtimalliğin sebebidir).

**2. BİRİKEN EVREN öne çıkarılacak** → 51.5 bunu güçlendirdi: OSOD bile
N'yi bilmek zorunda. Biriken/meçhul evren en ayırt edici unsurdur.

**YENİ İŞLER (bu taramadan doğan):**

**3.** İsteme **"sabit sayıda öğeden oluşan kesit"** girecek — IDS'ten en net
ayrım (onda pencere olasılık kütlesidir).

**4.** İsteme **olasılığın kesit boyutundan türemesi** girecek — IDS'te
olasılık girdidir.

**5.** Tarifnameye **"tahsis, ölçme değil"** teknik problem olarak yazılacak —
tüm Neuchâtel ekolünün amacı Horvitz-Thompson tahminidir. En güçlü hukuki
ayrım budur: **farklı teknik problem.**

**6.** Tarifnameye **öngörülemezlik güvenlik problemi** olarak yazılacak —
Busnel & Tillé 2020 dayanağıyla. Harici kaynağın "iş kuralı" itirazı bu
atıfla karşılanır.

### 51.13 DÜRÜST RİSK KAYDI

**IDS hâlâ en yakın komşudur** ve tüm olasılıklar eşit alınırsa davranışı
bizimkine benzer sonuç verir. Bir incelemeci şunu söyleyebilir: *"IDS'i eşit
olasılıklarla çalıştırın, kesitiniz çıkar."*

**Üç kademeli cevap:**

1. IDS'te pencere başına **tam 1** seçim (Result 4: aynı pencereden iki öğe
   asla birlikte seçilmez) — bizde k serbest
2. IDS'te olasılık **girdidir**; bizde k/M'den türer — mekanizmanın kurulumu
   farklı
3. IDS'in amacı Horvitz-Thompson tahminidir; bizde tahmin yoktur

Üçüncüsü en güçlü hukuki argümandır.

**İkinci risk:** Bu tarama bir vekilin yapacağı taramanın yerini **tutmaz.**
Patent sınıfları (CPC) üzerinden sistematik tarama yapılmadı. Harici kaynağın
verdiği sınıf tavsiyesi mantıklı ve not edilmeye değer (künyeleri uydurma
olsa da sınıf mantığı doğru):

- **G06F 7/58** — rastgele/pseudo-rastgele sayı üreteçleri
- **G07F 17/32** — oyun/erişim sistemlerinde kriptografik rastgele değer
- **H04L 9/3218** — sıfır bilgi kanıtı, anonim doğrulama

G06Q (ticari yöntemler) sınıfında arama yapılmıştı; birleşimin orada
bulunamaması normaldir.

### 51.14 BU BÖLÜMÜN NET KAZANIMI

| Konu | Durum |
|---|---|
| Stratified sampling itirazı | ✅ **Çürüdü** — katman özellikten kurulur, bizde özellik yok |
| Yarım kesit itirazı | ✅ **Çürüdü** — kurucu itirazı, kaynak geri aldı |
| "Anlık karar iş kuralıdır" itirazı | ✅ **Çürüdü** — Busnel & Tillé 2020: güvenlik problemi |
| Reservoir sampling ayrımı | ✅ Net — eviction / geri alınabilirlik |
| Secretary problem | ✅ İlgisiz — amaç maksimum bulmak |
| Eşihtimallik ifadesi | ✅ Kesinleşti (51.9) |
| Öngörülemezlik | ✅ **Beşinci koşul oldu**, literatür dayanaklı |
| IDS 2021 | ⚠️ **En yakın prior art. Beş fark var, yok sayılamaz** |
| Vekil taraması | ⛔ **Hâlâ yapılmadı — bu tarama onun yerini tutmaz** |

**Dosyada tutulan tam metinler:** scratchpad/ids/ klasöründe `ids2021.pdf`,
`seq2021.pdf`, `busnel2020.pdf` ve çıkarılmış `.txt` dosyaları.
