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
