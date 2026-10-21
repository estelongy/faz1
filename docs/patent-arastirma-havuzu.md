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

**⚠️ Kapsam notu (21 Ekim):** Bu tarama **mekanizma** için gereklidir,
**evren tanımı** için değil. Kurucunun hatırlatması:

> *"derdimiz literatürde olmayan evren tanımı değil ki, yöntemin
> uygulandığı evreni net belirlemek. evren patenti almıyoruz dert etme"*

Evren tanımının **yeni olması gerekmez**; **belirli** olması gerekir — ki
istem belirli olsun. Bkz. ana dosya §53.4: *"evren buluş değildir; buluş,
bu evren için indirgeme gerektirmeyen bir mekanizmadır."*

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

**✅ ÇÖZÜLDÜ (21 Ekim) — kurucunun açıklaması:**

> *"öğenin özelliğinden kastımız, bir öğenin diğer öğeden imtiyazsız
> olması. kadınlardan oluşan bir evrende 'kadın' özelliği ayırt edici bir
> özellik mi?"*

**Yanlış okuma:** *"hiçbir özellik kullanılmaz"* — bu okumayla "kadınlar
evreni" kurmak unsurla çelişirdi.

**Doğru okuma:** **evren içinde imtiyaz yoktur.** Kadınlar evreninde "kadın
olmak" ayırt edici değildir, çünkü **herkes kadındır.** Bir özelliğin ayırt
edici olabilmesi için bazı öğelerde olup bazılarında olmaması gerekir.

**Unsurun anlamı:** *Aynı evrendeki iki öğe arasında, birini diğerine üstün
kılacak bir özellik kullanılmaz.* Evrenin kapısı ne olursa olsun, içeride
tüm öğeler eşittir.

**§51.2 stratified sampling çürütmesi korunuyor:** Orada katmanlar
**birbiriyle kıyaslanır** (varyans düşürmek için ortak popülasyonun
bölümleridir). Burada her evren **kendi başına** işler; evrenler arası
kıyas yoktur.

**✅ Son soru da kapandı:** Bir öğe iki evrene birden ait olabilir mi?

> *"bir adam hem camiye hem avm ye girer mi. evet girer. hayatın olağan
> akışı bu zaten"*

**Evet, girebilir ve bu bir kusur değildir.** CE2'nin doğal sonucudur: aynı
insan her evrende **farklı bir öğedir.** Cami evreninde bir öğe, AVM
evreninde başka bir öğe; aralarında bağ yoktur — mekanizma zaten bağ
kuramaz, kimlik tutmaz.

**Endişe neden yersizdi:** Eşitlik iddiası **evren içi**dir, evrenler arası
değil. Cami evreninde herkes eşit, AVM evreninde herkes eşit. Birinin
ikisine birden girmesi hiçbirinin iç eşitliğini bozmaz.

**Üstelik engellemeye çalışmak** tam da kaçınılan şeye götürürdü: kimlik
tutmak, kimin nereye girdiğini izlemek.

**İlke:** Evrenler birbirini bilmez, ortak sayaç yoktur.

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

### CE3. PİYANGODAN ÜSTÜNLÜK — hangisi savunulur, hangisi savunulmaz

Kurucu dört üstünlük saydı: *"daha rastlantısal, daha adil, daha mercisiz,
daha kimliksiz."* **İkisi yapısal, ikisi tartışmalı.** Patent metnine
yalnızca savunulabilir olanlar girmeli.

#### ✅ YAPISAL ÜSTÜNLÜKLER (tartışmaya kapalı)

| Üstünlük | Gerekçe |
|---|---|
| **Kimliksizlik** | Piyango bilet numarası tutmak **zorundadır** — kazananı bulmak ve ödemeyi yapmak için. Bu buluşta zorunluluk yok: kazanan anında belli olur, ödeme o anda yapılır |
| **Mercisizlik** | Piyangoda **her zaman bir merci vardır** (idare, noter, çekiliş komisyonu) ve **olmak zorundadır**, çünkü güven oradan gelir. Bu buluşta mekanizmanın kendisi merci |
| **Bedelsizlik** | Piyangoda katılım kapısı paradır. Burada kapı yoktur — zaten yapılan işlem sırasında dahil olunur. Hem ticari hem hukuki fark (bedel yoksa şans oyunu mevzuatına girmez, bkz. `surpriz-odul-pos.md` §5b) |
| **Akışı kesmemek** | Piyango **durup çekiliş yapmak zorundadır**. Bu buluş akışı kesmez. Teknik üstünlük, kanıtlanabilir |

#### ⚠️ TARTIŞMALI — patent metnine KONMAMALI

**"Daha rastlantısal"** — Piyangonun topları fiziksel, gözle görünür,
bağımsız denetçili. Donanım entropisi matematiksel olarak daha iyi olabilir
ama *"daha rastlantısal"* demek savunulamaz. Kurucunun kendi tespiti burada
bize karşı çalışır:

> *"%100'e yakın rastgelelik varsa bunun doğrulanması mümkün değil ki.
> aynı koşullarda 4 zar atsan bile aynı gelme ihtimali %100 değildir."*

**Doğru ifade:** *farklı bir rastgelelik modeli* — piyangoda kazanan numara
bellidir, kimin aldığı belirsizdir; burada kazanan konum bellidir, kimin
geleceği belirsizdir.

**"Daha adil"** — Adalet tanıma bağlıdır:

| | Piyango | Bu buluş |
|---|---|---|
| Bilet alan / evrene giren | Herkes eşit | Herkes eşit |
| Almayan / girmeyen | Şans sıfır | Şans sıfır |

İkisi de **kendi evreninde** eşittir. Fark adalette değil, **evrenin kimi
kapsadığındadır** (bedelsizlik maddesine bağlanır).

### CE4. KAPSAM DENETİMİ — iki soru soruldu, ikisi de kapandı

Evren tanımının hayatın olağan akışında kapsamadığı bir şey var mı diye
soruldu. İki aday boşluk çıktı; **ikisi de tanımın içinde çözülüyormuş.**

#### Soru 1: Eşzamanlı giriş

*"Stadyuma 8 turnikeden aynı anda insan giriyor; mekanizma kaçıncı öğe
olduğunu nasıl biliyor?"*

**Kurucunun cevabı:**

> *"sen evreni b turnikesinden giriş yapanlar diye de kurabilirsin.
> a b c d... turnikelerinden giriş yapanlar diye de. zor değil bu.
> sonuçta sen evrene öğe biriktiriyorsun. (...) evrene çoklu giriş olmaz
> hocam, bu yönteme ters ve saçma. aynı numaralı bilet basılıyor mu ki aynı
> iki öğe oluşsun evrende."*

**İki ayrı şey karıştırılmıştı:**

| | Kim belirler |
|---|---|
| **Evren tanımı** (hangi turnikeler dahil) | Kurgulayan — dışsal tanım |
| **Öğe sayımı** (her giriş ayrı öğe) | Tanım gereği — iki öğe aynı olamaz |

**Sonuç:** Evrene çoklu giriş **tanım gereği yoktur.** Öğe tekil bir olaydır;
iki olay aynı olamaz.

> *"eş zamanlı giriş teknik olarak mümkün değil ki. evren kapısı çalınır
> içeri girer, olay biter."*

Kurucunun erken ilkesiyle tutarlı: *"yaşamayarak, yaşatmayarak çözüyorum."*
Eşzamanlı tahsis problemi **doğmaz.**

**Kalan tek mesele ölçektir, mantık değil:**

> *"200m işlemin aynı anda gerçekleşmesi durumunda teker teker alma olayı
> sistemi yavaşlatabilir. bu çok küçük bir ihtimal. soruna dönüşürse
> çözülür. basit bir mesele."*

Çok yüksek eşzamanlı yükte sıralama bir **mühendislik** sorunu olabilir
(kuyruk, parçalama, paralel evrenler). Bu **patentin konusu değildir**,
uygulamanındır. Mekanizmanın mantığı etkilenmez.

#### Soru 2: Geri alınan öğe (iptal, iade)

*"Satış iptal edilirse öğe evrenden çıkar mı? Çıkarsa ⊆ bozulur."*

**Kurucunun cevabı:**

> *"değer öğe olması ile ilgili, öğe olabiliyorsa değer alma ihtimali
> bakidir. kimse bunun için sonsuz deneme yapamaz. yolcuların 'aaaa olmadı
> bir daha ineyim' demesi saçma değil mi?"*

**Doğru çerçeve:** Soru *"öğe çıkar mı"* değil. Öğe olmak **değer alma
ihtimalini doğurur** ve bu ihtimal geri alınamaz. İşlem iptal edilse bile
öğe evrende kalır — ⊆ bozulmaz.

**Suistimal sorusunun cevabı pratiktir:** Öğe olmak **bedelli**dir — para
değil ama gerçek bir eylem (otobüsten inmek, alışveriş yapmak, turnikeden
geçmek). Sonsuz deneme için sonsuz eylem gerekir.

Bu, bedelsizliğin diğer yüzüdür: **katılım parasızdır ama bedava değildir.**
Eylemin kendisi filtredir.

#### Kapsanan akış tipleri

| Akış tipi | Örnek |
|---|---|
| İnsan akışı | AVM, stat, otobüs, cemaat |
| İşlem akışı | POS, sepet, ödeme |
| Olay akışı | Lamba yakma, turnike, tıklama |
| Nesne akışı | Üretim bandı, paket |
| Dijital akış | Site girişi, uygulama açılışı |

Ortak koşul: **öğeler teker teker gelir, geri alınmaz, sayılabilir.**
Bu denetimde kapsanmayan bir akış tipi bulunamadı.

### CE5. ⭐ BULUŞUN ADI — "akışkan evrende değer konumlandırma"

**Kurucunun tarifi (21 Ekim 2026):**

> *"buluş akışkan evrende değer konumlandırma. bence bu daha iyi bir tarif"*

**Neden önceki adlandırmalardan iyi:** Eski adaylar (*değer üretme sistemi*,
*ödül dağıtım sistemi*, *bedelsiz çekiliş*, *öğe işaretleme*) **ne
üretildiğini** söylüyordu. Bu tarif **nasıl üretildiğini** söylüyor.

| Parça | Taşıdığı |
|---|---|
| **Akışkan evren** | §52-54'te tanımlanan evren — büyüklüğü bilinmeyen fakat tahmin edilebilen, öğe eklenmeye devam eden |
| **Değer** | İçeriği serbest (çay, simit, botoks, indirim) — temel istemdeki *"fayda, hak veya sonuç değeri"* |
| **Konumlandırma** | ⭐ Mekanizmanın özü: değer **bir yere** konur, bir **kişiye** değil |

#### Kaynak metafor — kurucunun cümlesi

> *"mekanizma stadyum boşken koltuğu seçiyor. kim oturursa artık."*

Bu tek cümle bütün unsurları taşıyor:

| Cümlede | Unsur |
|---|---|
| Stadyum **boşken** | Öğeler henüz yok — evren tanımı |
| **Koltuğu** seçiyor | Kişiyi değil konumu — kimliksizlik |
| **Kim oturursa** | Özelliğe bakılmıyor — bağımsızlık |
| **Artık** | Karar kesin, geri dönüş yok |
| Seçim önce, oturma sonra | Hiçbir taraf etkileyemez — mercisizlik |

**Neden güçlü:** Seçim ile seçilen arasında **bağ yoktur.** Koltuk
seçildiğinde ortada kimse yoktur; kimse kendini seçtiremez, kimse
kayıramaz — seçilecek bir *"kim"* yoktur.

Piyangoda bilet alınır, numara olur, sonra çekiliş yapılır: **sen varsın,
numaran var.** Burada **numara var, sen yoksun** — sonra geliyorsun.

#### Ters çevirme

| Klasik yaklaşım | Bu buluş |
|---|---|
| Kim var? → içinden seç | **Nerede?** → gelen o olur |
| Liste gerekir | Sayaç yeter |
| Sonradan seçilir | **Önceden işaretlenir** |

Kurucunun erken ifadesi *"genişleyen evrende öğe işaretleme"* buydu —
ancak işaretlenen **öğe değil, yerdir.**

#### Tribün metaforu — kesit yapısının sezgisel karşılığı

Kurucuya *"28.358 kişiden 5'ini nasıl seçersin"* diye soruldu:

> *"tirübünü göz kararı 5'e bölerim. her bölmeden keyfi olarak gözüme ilk
> çarpanı seçerdim. bölmenin ortası olur, sağ altı olur."*

| Metafor | Mekanizma |
|---|---|
| Tribünü **5'e bölmek** | Evreni kesitlere bölmek |
| **Göz kararı** bölmek | Tahminle kesit boyutu (28.000 ÷ 5) |
| Her bölmeden **bir** kişi | Kesit başına k |
| **Gözüne ilk çarpan** | Kesit içinde rastgele konum |
| Ortası, sağ altı — fark etmez | Konum sabit değil, her kesitte yeniden |

**⚠️ B6'ya etkisi:** *"Göz kararı"* ifadesi kesitlerin **eşit olmak zorunda
olmadığını** gösteriyor. Biri 5.000, biri 6.200 olabilir. Kesit katmanında
değerlendirilecek.

### CE6. YÖNTEM KARŞILAŞTIRMASI — stadyum metaforuyla

Her yöntem aynı stadyuma konup *"5 kişiyi nasıl seçerdi"* diye soruldu.

| | Liste gerekir | Kimlik gerekir | Akış durur | Karar kesin | Sayı belirli |
|---|---|---|---|---|---|
| **Piyango** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Kumar makinesi** | ❌ | ❌ | ❌ | ✅ | **❌** |
| **Çekiliş / kura** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Sadakat programı** | ❌ | **✅** | ❌ | ✅ | ❌ |
| **Reservoir sampling** | ❌ | ❌ | **✅** | **❌** | ✅ |
| **BU BULUŞ** | ❌ | ❌ | ❌ | ✅ | ✅ |

**Son satır tektir:** beş sütunun hepsinde istenen değer.

#### Tek cümlelik ayrımlar

| Yöntem | Ayrım |
|---|---|
| **Piyango** | Önce insanlar var, sonra seçim yapılır. Burada önce seçim yapılır, sonra insanlar gelir |
| **Kumar makinesi** | 5 kişi seçemezsin — olasılık ayarlarsın, 0 da çıkar 50 de (Bernoulli'nin aynı sorunu, bkz. A1) |
| **Çekiliş** | Fisher-Yates tam burada çalışır, ama **listeyi ister**. Liste yoksa yöntem yok |
| **Sadakat** | Rastgelelik yok, kural işler; sayaç kime ait olduğu için **kimlik zorunlu** (okunan beş ticari patent burada, bkz. A2) |
| **Reservoir** | 3.117. kişiye *"kazandın"* diyemezsin — belki 20.000. kişi gelince çıkarılacak |

#### Ayrıntılı ayrımlar — tarifnameye hazır

**PİYANGO**

Stadyuma girerken herkese bilet satılır: 28.358 bilet, hepsi numaralı,
kimin aldığı kayıtlı. Maç bittikten sonra bir numara çekilir, sahibi
aranır, bulunur, ödeme yapılır.

| | Piyango | Bu buluş |
|---|---|---|
| Seçim anı | Akış **bittikten sonra** | Akış **başlamadan önce** |
| Seçilen şey | Numara → **sahibi var** | Konum → **sahibi yok** |
| Katılım | **Bilet satın alınır** | Yalnızca öğe olmak |
| Kayıt | Numara–kişi eşleşmesi **zorunlu** | Hiçbir kayıt yok |
| Merci | Çekilişi yapan **bir taraf var** | Yok |
| Akış | **Durur**, çekiliş yapılır | Durmaz |

**KUMAR MAKİNESİ**

Stadyumda evren yoktur. Her kişi turnikeye gelir, kolu çeker, kendi
sonucunu alır. 28.358 kişi = 28.358 bağımsız oyun.

| | Kumar makinesi | Bu buluş |
|---|---|---|
| Evren | **Yok** — her oyun ayrı | Var, öğeler birikir |
| Toplam kazanan | **Belirsiz** — 0 da olur 500 de | Kesit başına belirli |
| Olasılık | Her oyunda sabit p | Kesit içinde k/M |
| Kaynak | **Sınırsız** (teorik) | Kesite bağlı sınırlı |
| Bedel | **Her oyunda ödenir** | Yok |

**Kritik:** Kumar makinesinde *"5 kişi seçeceğim"* diyemezsin. Olasılığı
ayarlarsın, *"ortalama 5 çıkar"* dersin — ama 0 da çıkabilir, 50 de.
Bu, Bernoulli örneklemesinin aynı sorunudur (bkz. A1 beş koşul tablosu).

**ÇEKİLİŞ / KURA**

Stadyum dolar, kapılar kapanır, liste hazırlanır: 28.358 isim yazılır,
karıştırılır, 5'i okunur.

| | Çekiliş | Bu buluş |
|---|---|---|
| Liste | **Zorunlu** | Yok |
| N | **Bilinmeli** | Bilinmez |
| Zaman | Liste kapandıktan sonra | Akış sırasında |
| Kimlik | **Zorunlu** — kimi çağıracaksın? | Yok |

**Not:** Fisher-Yates tam burada çalışır — ancak **listeyi ister.**
Liste yoksa yöntem de yoktur.

**SADAKAT PROGRAMI**

Stadyuma giren herkese kart verilir. 10 maça gelen ödül alır. Kart
okutulur, sayaç artar.

| | Sadakat | Bu buluş |
|---|---|---|
| Rastgelelik | **Yok** — kural işler | Var |
| Kimlik | **Zorunlu** — sayaç kime ait? | Yok |
| Durum | Geçmiş **saklanır** | Saklanmaz |
| Kazanan | Eşiği dolduran | Konuma denk gelen |

**Not:** Okunan beş ticari patentin tamamı bu sınıftadır (A2). Hepsi bir
tanımlayıcı saklar, çünkü **saymak zorundadırlar.**

**RESERVOIR SAMPLING (Vitter 1985)**

Stadyuma giren ilk 5 kişi cebe konur. 6. kişi gelince zar atılır; belki
biri çıkarılır, yenisi konur. Maç bitene kadar böyle sürer.

| | Reservoir | Bu buluş |
|---|---|---|
| Karar | **Geçici** — sonradan değişir | Kesin |
| Bitiş | **Beklenir** | Beklenmez |
| Bellekte tutulan | Seçilen **öğeler** | Yalnızca konum |
| Kazanan ne zaman belli | Akış bitince | **O an** |

**En yakın akademik komşu ama temel fark:** Reservoir'da 3.117. kişiye
*"kazandın"* denemez — 20.000. kişi geldiğinde havuzdan çıkarılabilir.

---

## CK. KESİT KATMANI

### CK1. KESİT YAPISI — karara bağlandı

**Mekanizma:**

| | |
|---|---|
| Kesit sayısı | Etahmini ÷ k |
| Kesit boyutu | Etahmini ÷ k |
| Yeni kesit ne zaman açılır | **Önceki dolduğunda** |
| Konumlar ne zaman belirlenir | **Kesit açıldığı anda** |
| Tahmin aşılırsa | Yeni kesit açılır, mekanizma değişmez |

**Kurucunun ifadesi:**

> *"tahmini bir sayı var kabaca kesite bölüyoruz. kaç kesit olacağını
> Et ve k belirliyor"*

> *"yeni kesit önceki dolduğunda açılıyor"*

**Son nokta mercisizlik açısından önemli:** Konumlar kesit **açıldığı anda**
belirlenir, önceden değil. Böylece bir sonraki kesitin konumları hiçbir
zaman *"önceden bilinebilir"* durumda olmaz.

### CK2. YARIM KESİT — adaletsizlik yok

**Kurucunun argümanı (önceki savunmadan daha güçlü):**

> *"düşün 5. kesitimiz 250 ile 400 arasında. 4 kesit, yani 600 öğe oluşmuş
> ve yeni kesit açılmış. yöntem 270 ile 390'ı belirledi. 270'e kadar
> girenler aynı ihtimalle öğe oldular"*

**Önceki savunma (§51.8):** *"olasılık ≠ gerçekleşen frekans"* — istatistiksel
ayrım.

**Yeni savunma (daha sağlam):** **Kesit açıldığı anda konumlar
belirlenmiştir.** O kesite giren 270. kişi de, 350. kişi de, 390. kişi de
**aynı belirsizlikle** girdi. Hiçbiri *"benim şansım yoktu"* diyemez —
hepsi kesit kurulduğunda eşit konumdaydı.

Akışın 390'da kesilmesi, 391'den sonra kimsenin **gelmemesi** demektir.
Gelmeyen kişiye haksızlık yapılamaz.

**Not:** Örnekte k=2 (270 ve 390). Akış 390'da kesilirse ikisi de
gerçekleşir; 350'de kesilirse biri gerçekleşir. Her iki durumda da kesite
giren herkes aynı iki konuma karşı eşit durumdaydı.

### CK3. ⭐ KESİTSEL BAKIŞIN LİTERATÜRLE İLİŞKİSİ

**Özet hüküm:** **Yapı örtüşüyor, kuruluş ayrışıyor.**

#### Örtüşen — bölme fikri yeni değil

Akışı parçalara ayırıp her parçadan seçmek bilinen bir fikirdir:

| Alan | Adı | Nasıl |
|---|---|---|
| İstatistik | Systematic sampling (Madow 1949) | Rastgele başlangıç + her k'ıncı öğe |
| Klinik araştırma | Permuted block randomization | Blok içi tedavi dengeleme |
| Ağ | Periyodik örnekleme | Her n'inci paketi al |

**Bunu saklamanın anlamı yok** — incelemeci zaten bulur. Tarifnamede açıkça
kabul edilip fark anlatılmalı.

#### Ayrışan — dört nokta

**1. Bölme neye göre yapılıyor**

| | Bölme ölçüsü |
|---|---|
| IDS 2021 | **Olasılık kütlesi** — pencere π'lar toplamı 1 olunca kapanır |
| Permuted block | **Tedavi dengesi** — her blokta eşit sayıda A ve B |
| Systematic | Sabit aralık k = N/n → **N bilinmeli** |
| **Bu buluş** | **Öğe sayısı** — N bilinmeden |

**2. Bölme ne zaman yapılıyor**

Hepsinde **önceden**: popülasyon bilinir, bloklar kurulur, sonra uygulanır.

Bu buluşta **akarken**: bir kesit dolunca bir sonraki açılır. N'yi bilmeden
bölmeyi mümkün kılan budur.

**3. Blok içinde ne yapılıyor**

| | Blok içi |
|---|---|
| Systematic | **Deterministik** — ilk seçimden sonra hepsi belli |
| Permuted block | Sıralama karışır, **hepsi** tedavi alır |
| IDS | Pencere başına **tam 1** |
| **Bu buluş** | **k serbest**, her kesitte yeniden rastgele |

**4. Amaç**

Hepsi **ölçme veya dengeleme** için böler. Bu buluş **tahsis** için böler.

#### Tek cümleyle

> Bölme fikri yeni değildir. Yeni olan: **N bilinmeden, akarken, öğe
> sayısına göre bölmek ve her bölmede yeniden rastgeleleştirmek.**

#### ⚠️ Dürüst risk ve cevabı

**İtiraz:** *"Systematic sampling'de de bölme var; siz sadece N yerine
tahmin koymuşsunuz — rutin değişiklik."*

**Cevap:** Systematic sampling ilk seçimden sonra **deterministik** hale
gelir. OSOD 2021'in kendi ifadesi:

> *"once the first units are examined, this method quickly becomes
> deterministic, making it predictable, which can be problematic."*

Bu buluşta **her kesit yeniden randomize edilir.** Fark *"tahmin kullandık"*
değil, **"her kesitte yeniden rastgeleleştiriyoruz."** Bu fark
öngörülemezlik koşulunda somutlaşır ve Busnel & Tillé 2020 bunu **güvenlik
problemi** olarak tanımlar (bkz. A1).

### CK4. AÇIK KALAN KÜÇÜK SORULAR

| # | Soru | Durum |
|---|---|---|
| **CK4a** | **B6 çelişkisi:** Temel istem *"sabit sayıda öğeden oluşan kesitler"* diyor; tarifname (§54.2) ve tribün metaforu (*"göz kararı"*) eşit olmak zorunda olmadığını söylüyor. **Hangisi?** Ön görüş: *"sabit"* çıkarılmalı — IDS'ten ayrım boyutun sabitliğinde değil, **neyle ölçüldüğünde** (öğe sayısı vs olasılık kütlesi) | ⚠️ Karara bağlanmadı |
| **CK4b** | k>1 iken kesit içinde iki konum **aynı** olabilir mi? Kodda `Set` kullanıldığı için hayır; **istemde yazılı değil** | ⚠️ Karara bağlanmadı |

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
