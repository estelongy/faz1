# PATENT ARAŞTIRMA HAVUZU

**Amaç:** Katman katman ilerlerken (evren → kesit → öğeler → k) biriken
bulgular, şüpheler ve okunmamış kaynaklar burada toplanır.
**Nihai sentez sonda yapılır** — her bulgu anında yorumlanıp ana dosyaya
yazılmaz.

**Ana dosya:** `anonim-indirim-motoru.md` (§51-54 literatür bölümleri)

---

## A. OKUNMUŞ VE KARARA BAĞLANMIŞ

Bunlar tam metinden okundu, hüküm verildi. Sentezde tekrar açılmayacak —
yalnızca referans.

### A1. Neuchâtel ekolü — örnekleme teorisi

| Kaynak | Durum |
|---|---|
| **IDS 2021** (arXiv:2111.09309) Panahbehagh, Jauslin & Tillé | ✅ Tam metin. **En yakın akademik komşu.** Beş fark: pencere olasılık kütlesi / pencere başına tam 1 seçim / olasılık girdi / cross-border erteleme / amaç tahmin |
| **OSOD 2021** (arXiv:2111.08433) | ✅ Tam metin. Denklem (1) **N gerektiriyor** → elenir |
| **Busnel & Tillé 2020** (ICCDA, DOI 10.1145/3388142.3388162) | ✅ Tam metin. Öngörülemezlik = **güvenlik problemi** dayanağı |
| Madow 1949, Vitter 1985, Deville & Tillé 1998, Chauvet 2012 | ✅ Künye doğrulandı, rol belirlendi (§51.3) |

### A2. Ticari patentler

| Patent | Durum |
|---|---|
| **US7784682B2** (JPMorgan Chase, **AKTİF** 2026-09-12'ye kadar) | ✅ **İstem 1 okundu.** ATM + kart okutma + kimlik tespiti + üç ayrı işlem geçmişi + *"at least one identifier"* zorunlu → **ihlal riski yok.** ⚠️ Tarifnamesinde *"each nth customer, such as every 100 customers"* + *"pseudo-random algorithm"* geçiyor → **yenilik açısından atıf gerekli** |
| US5774884, US20100153194, US20090287562, US20200311760, US8463645B1 | ⚠️ **Yalnızca tarifnameden okundu, istemler okunmadı** (§51.1 hata kaydı). Hüküm verilmedi |

### A3. Elenen alanlar

| Alan | Neden elendi |
|---|---|
| **Stratified sampling** | Katman **yardımcı değişkenden** kurulur; bizde yardımcı değişken yok (§51.2) |
| **Secretary problem** | Amaç **maksimumu bulmak**, eşit şans vermek değil; N bilinir |
| **VRF / blockchain çekilişleri** | Herkese açık doğrulanabilirlik kuruyor → *"public verifiability works against anonymity"*. Zıt yön |
| **Open population (Jolly-Seber, CJS)** | **Capture-recapture aynı bireyi tanımaya dayanır — kimlik zorunlu.** Kimliksiz kurulamaz bile. Ayrıca amaç tahmin (yaşam oranı, bolluk) |
| **Goodman 1953** (AoMS 24(1):56-69, DOI 10.1214/aoms/1177729082) | Künye ✅ doğrulandı. Sequential **tagging** → kimlik + tahmin. Uzak |
| **Pólya urn** | Mekanizma **zıt**: seçilenin olasılığı artar (*"rich get richer"*); bizde eşitlik korunur |
| **Mahremiyet literatürü** (PoPETs 2021, uCentive, anonymous credentials) | Kriptografik anonimlik: *"kimlik var ama gizli"*. Bizde kimlik **hiç yok**. Ayrıca **rastgele seçim yok** |

---

## B. AÇIK ŞÜPHELER — sentezde karara bağlanacak

### B1. ⚠️ ONLINE FAIR ALLOCATION — yeni açıldı, okunmadı

**En yakın komşu buradan çıkabilir.** Dördü de "online, geri alınamaz karar,
bilinmeyen ufuk" kuruyor — bizim 1. ve 4. koşulumuz.

| Künye | Örtüşen | Görünen fark | Durum |
|---|---|---|---|
| arXiv:2504.10389 — *Diversity-Fair Online Selection* | **Bilinmeyen ufuk**, en fazla K seçim, adversarial sıra | Amaç çeşitlilik dengesi | ⛔ Okunmadı |
| arXiv:2605.19844 — *Perpetual Fully Online Horizon-Free Approximate Fairness* | *"ufku bilmeye gerek yok, geçmiş kararları değiştirmez"* | Amaç orantılı paylaşım | ⛔ Okunmadı |
| arXiv:2510.21055 — *Online Multi-Class Selection with Group Fairness* | **Kota + rastgeleleştirilmiş set-aside** | Başlangıç envanteri ve sınıf sayısı **önceden biliniyor** | ⛔ Okunmadı |
| arXiv:2408.02403 — *Online Fair Allocation with Best-of-Many-Worlds* | Ufuk bilinmiyor, önceden bilgi yok | Amaç adil bölüşüm | ⛔ Okunmadı |

**Ortak fark (arama özetlerinden):** amaçları **adalet/çeşitlilik dengesi**,
eşit olasılık değil. Kimliksizlik hiçbirinde yok.

**Risk:** Koşullarımızın dördünü sağlayan bir çalışma çıkabilir. Tam metin
okunmadan hüküm verilmemeli.

### B2. ⚠️ Beş ticari patentin istemleri okunmadı

A2'deki beş patent yalnızca tarifnameden okundu. §51.1'de hata olarak
kaydedildi. İhlal riski için **istem** okunması şart.

### B3. ⚠️ CPC sınıf taraması yapılmadı

Önerilen sınıflar (§51.13):
- **G06F 7/58** — rastgele/pseudo-rastgele sayı üreteçleri
- **G07F 17/32** — oyun/erişim sistemlerinde kriptografik rastgele değer
- **H04L 9/3218** — sıfır bilgi kanıtı, anonim doğrulama

G06Q (ticari yöntemler) tarandı; birleşim orada bulunamadı — normal.

**Bu tarama vekilin işi.** Bizim yaptığımız taramalar onun yerini tutmaz.

### B4. ⚠️ "Beş koşul" tablosu benim kurgum

§51.10'daki tablo (N meçhul / O(1) bellek / sıra-bağımsız eşitlik / girişte
kesin karar / öngörülemezlik) **benim seçtiğim koşul setine** bağlı. Başka
bir koşul seti kurulursa tablo değişir. Vekil farklı kurabilir.

Daha sağlam ayrım: **amaç farkı** (tahmin vs tahsis) — koşul setinden
bağımsız, literatürün kendi tanımından çıkıyor.

### B5. ⚠️ İhlal tespiti (detectability) sorunu

Üç unsurun hiçbiri dışarıdan doğrulanamaz:

| Unsur | Neden doğrulanamaz |
|---|---|
| Kimlik saklamama | Kaynak kodu görmeden bilinemez |
| Eşit olasılık | Çıktıdan kanıtlanamaz (kurucunun zar tespiti) |
| Öngörülemezlik | Tanımı belirsiz |

**Sonuç:** Patent alınır ama ihlal ispatı çok zor. Yatırımcı/caydırıcılık
amacı için sorun değil; dava için zayıf.

### B6. ⚠️ İstemde çelişki — kesit sabit mi değişken mi

| Nerede | İfade |
|---|---|
| Temel istem (§52.10) | *"sabit sayıda öğeden oluşan kesitler"* |
| Tarifname (§54.2) | *"kesit büyüklükleri eşit olabilir veya farklı belirlenebilir"* |

**Çelişki.** Kesit katmanı işlenirken karara bağlanacak.

---

## C. KARARA BAĞLANMAMIŞ İÇ MESELELER

| # | Konu | Durum |
|---|---|---|
| C1 | **Eşihtimallik istemde nerede duracak** — temele mi, ayrı bağımlı isteme mi? İfadesi hazır (§51.9) | §52.11'den devrediyor |
| C2 | **Kesit sabit/değişken** (bkz. B6) | Kesit katmanında |
| C3 | US7784682B2'nin tarifnameye atıfla işlenmesi | Yazılmadı |

---

## C-EK. ÖĞELER KATMANINA DEVREDEN SORULAR

Evren katmanında ortaya çıktı, **kritiği öğeler katmanında yapılacak.**
Burada hüküm verilmedi.

### CE1. Evren içi evrenler

Kurucunun tespiti: tek bir akıştan **birden fazla evren** tanımlanabilir.
AVM girişi bir evren; onun içinden tanımlanan daha dar kümeler de ayrı
evrenler olabilir. Her birinin kendi Etahmini'si, kendi kesit dizisi, kendi
k'sı olur.

Evren katmanı açısından kayda geçen: **evren yeniden tanımlanabilir bir
çerçevedir.** Evrenler paralel işleyebilir; birbirini bilmezler, ortak sayaç
yoktur (durumsuzlukla tutarlı).

**Öğeler katmanında çözülecek sorular:**

1. Evren kapısı öğenin bir özelliğine göre tanımlanırsa, bu temel istemdeki
   *"öğenin kendisine has özelliklerinden bağımsız"* unsuruyla çelişir mi?
   - Özellik **seçim anında** kullanılırsa → unsur ihlal edilir
   - Özellik **evrenin kapısında** kullanılıp içeride seçim kör kalırsa →
     ihlal yok (bağımsızlık *evren içi* bir iddiadır)
   - **Hangi okuma geçerli, karara bağlanmadı**

2. Bu kurgu §51.2'deki stratified sampling çürütmesini etkiler mi?
   Orada *"katman yardımcı değişkenden kurulur, bizde yardımcı değişken
   yok"* denmişti.

3. Bir öğe **iki evrene birden** ait olabilir mi? Olabiliyorsa toplam
   olasılığı artar; *"her öğe eşit"* iddiası evrenler arası kıyasta
   zayıflar mı?

### CE1b. Evren tanımı bir ŞABLONDUR

**Kurucunun tespiti:**

> *"bu cumadaki cemaat ile, gelecek haftadaki cemaat aynı değil ki.
> öğeler de, tahmini değer de"*

*"Cuma namazı cemaati"* tek bir evren değildir; her cuma o şablondan **yeni
bir evren doğar.** Şablon sabit, gerçekleşme değişken:

| | Bu cuma | Gelecek cuma |
|---|---|---|
| Öğeler | Gelen 800 kişi | Başka kişiler |
| Etahmini | 800 | 850 (hava, tatil, mevsim) |
| Kesit dizisi | Kendi Ea1, Ea2… | **Yeniden başlar** |
| Birikim | — | **Sıfırdan** |

Aynı mekân, aynı saat, aynı tanım — **ama aynı evren değil.**

**Durumsuzlukla bağı:** Geçen gerçekleşmenin kesit sayacı yenisine
taşınmaz. Mekanizma *"geçen hafta kaç kişiydi"* diye bakmaz; bakarsa
durumsuzluk bozulur. Her evren temiz sayfadır.

**Tarifnameye yazılabilir:** *"Evren tanımı bir şablondur; her gerçekleşme
ayrı bir evren üretir ve önceki gerçekleşmelerden bağımsızdır."*

**Karara bağlanmadı:** Bu açıkça yazılacak mı, yoksa *"öğe eklenmeye devam
eden"* ifadesi yeterli mi?

### CE2. ⭐ KİMLİKSİZLİĞİN KAYNAĞI — öğe tanımı

**Kurucunun tespiti (21 Ekim 2026):**

> *"aynı insan her seferinde, yada her evrende farklı bir öğedir.
> kimliksizliğin sırrı burada"*

**Neden kritik:** Kimliksizlik şimdiye kadar bir **kısıt** olarak
kurulmuştu — *"sistem kimlik saklamaz"*, yani bir tercih. Bu tespit onu
**tanıma** çeviriyor: saklanacak kimlik zaten yoktur.

| | Kuruluş | Niteliği |
|---|---|---|
| Eski | "Kimlik saklamıyoruz" | Politika / tercih |
| **Yeni** | **"Öğe tanımı gereği kimliksizdir"** | **Ontoloji / yapı** |

**Üç kazanç:**

**1. Mahremiyet literatüründen tam ayrılma.** PoPETs 2021, uCentive,
anonymous credentials — hepsi kimliği **gizler** (kör imza, sıfır bilgi
kanıtı), çünkü gizlenecek bir kimlik vardır. Bu buluşta gizlenecek bir şey
yoktur; kriptografiye gerek olmamasının sebebi budur.

**2. İspat yükü kalkar.** *"Kimlik saklamıyoruz"* iddiası dışarıdan
doğrulanamaz (bkz. B5 detectability). Ancak *"öğe tanımı gereği
kimliksizdir"* **yapısal** bir ifadedir; mekanizmanın kurulumundan okunur,
çıktıdan ispat gerektirmez.

**3. Tekrar eden katılım sorunu doğmaz.** Sadakat programları *"aynı kişi
iki kez kazanmasın"* diye kimlik tutar. Burada böyle bir kural gerekmez
çünkü *"aynı kişi"* kavramı yoktur. Kurucunun erken cümlesi aynı noktaya
çıkıyordu:

> *"adam 5 dk sonra yeniden alışveriş yaptı, aynı kartı okuttu, bu sonuca
> etki ediyor mu? hayırrrrrr"*

O zaman **bağımsızlık** unsuru diye kurulmuştu; aslında kimliksizliğin
sonucuymuş.

**⚠️ SINIR — abartılmamalı:** Bu, **mekanizma içindeki** kimliksizliktir.
Dışarıda kimlik olabilir (klinik hastayı tanır, fatura keser, randevu
verir). Doğru iddia: *"öğe, mekanizma açısından kimliksizdir."*
*"Hiçbir yerde kimlik yok"* denirse gerçek dışı olur ve çürütülür.

**Öğeler katmanında işlenecek.**

---

## D. HAVUZ KULLANIM KURALI

1. **Her yeni bulgu buraya yazılır**, ana dosyaya değil
2. **Tam metin okunmadan hüküm verilmez** — §51.1'deki iki hata tekrarlanmasın:
   - Tarifname ≠ istem
   - YZ künyeleri doğrulanmadan kullanılmaz (üç kez uydurma referans geldi)
3. **Sentez sonda** — katmanlar (evren → kesit → öğeler → k) bittikten sonra
   havuz bütün hâlinde değerlendirilir

---

**Son güncelleme:** 21 Ekim 2026 — open population taraması sonrası
