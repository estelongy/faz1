# BiyoAGE — Görünüm Yaşı Ölçümü

> Karar tarihi: 7 Ekim 2026 · Durum: **araştırma tamam, algoritma tasarımı onaylı, kod yazılmadı**
> Mevcut skor sistemi: [src/lib/egs.ts](../src/lib/egs.ts) · [src/lib/skor-durum.ts](../src/lib/skor-durum.ts)

---

## 0. Neden değişiyor

Bugünkü **Gençlik Skoru** 0-100, yüksek = iyi. Yedi bileşen toplanıyor
(`c250_base`, anketler, tetkik, ileri AI, hekim değerlendirmesi %15 ağırlıkla).

**Sorun: skorun birimi yok.** 73 ne demek, neye göre 73? Kendi içinde tutarlı
ama dışarıda bir şeye dayanmıyor. Hastaya "73'sünüz" dendiğinde karşılığı yok.

**Çözüm: görünüm yaşı** — yıl cinsinden, kronolojik yaşla kıyaslanan.
Bunun bilimsel karşılığı var (bkz. §1).

| | Eski | Yeni |
|---|---|---|
| Çıktı | 73 puan | "38 gösteriyor, 43 yaşındasınız" |
| Anlamı | belirsiz | **−5 yıl** |
| Dayanağı | iç formül | BMJ 2009, ikiz kohortu |
| Doğruluk | ölçülemez | yıl cinsinden ölçülür (MAE) |
| Takip | 73 → 78 (ne kadar iyi?) | −5 → −8 (3 yıl kazandı) |

**Skor kalıyor ama türev oluyor** — renk bölgeleri, kademe sistemi, mevcut
ekranlar bozulmuyor; altına gerçek bir birim giriyor (bkz. §5).

---

## 1. Üç yaş kavramı

| Kavram | Ne demek | BiyoAGE için anlamı |
|---|---|---|
| **Kronolojik yaş** | Nüfustaki yaş | Referans/kıyas noktası |
| **Algılanan yaş** | Yüze bakınca "kaç gösteriyor" | **Asıl ölçtüğümüz** |
| **Biyolojik yaş** | Vücudun gerçek yıpranması | Algılanan yaş bunun göstergesi |

### Dayanak: Christensen, BMJ 2009

Danimarka ikiz kohortu — 1.826 ikiz (70+), 41 bağımsız değerlendirici
fotoğraftan yaş tahmin etti, 2008'e kadar takip (%37'si öldü).

| Bulgu | Sonuç |
|---|---|
| Algılanan yaş ↔ sağkalım | **Anlamlı** (kronolojik yaş, cinsiyet, yetişme ortamı düzeltildikten sonra bile) |
| İkiz çiftinde yaşlı görünen | **Önce ölüyor**; fark büyüdükçe olasılık artıyor |
| Telomer uzunluğu | Algılanan yaşla korele |
| Fiziksel + bilişsel işlev | Korele |

İkiz tasarımı kritik: genetik kontrol altında, fark **yaşanmışlıktan** geliyor.

**Ve en önemli rakam: varyasyonun ~%40'ı genetik dışı.**
Yani algılanan yaş değiştirilebilir. Kliniğin bilimsel dayanağı tam burası.

### Neyin etkilediği (Rexbye, Age & Ageing 2006)

| Faktör | Etki |
|---|---|
| Sigara | ↑ yaşlı gösterir (erkekte anlamlı) |
| Güneş maruziyeti | ↑ yaşlı gösterir |
| Düşük BMI | ↑ yaşlı gösterir (her iki cinste) |
| Düşük sosyal sınıf | ↑ yaşlı (kadında) |
| Evli olmak, düşük depresyon | ↓ genç gösterir |

---

## 2. Ölçüm kümeleri ve ağırlıkları

Flament'in üç kümesi algılanan yaşın ~%90'ını açıklıyor; kalan ~%10'u
yüz kontrastı ve hacim dolduruyor. Ağırlıklar bu mantıkla ölçeklendi:

| Küme | Ağırlık | Ne ölçülür | Kaynak |
|---|---|---|---|
| **Kırışıklık / Doku** | ~%30 | Alın, glabella, kaz ayağı, nazolabial, üst dudak | Flament/Nkengne |
| **Sarkma / Ptozis** | ~%30 | Jawline netliği, malar düşme, üst göz kapağı | Flament/Nkengne |
| **Pigmentasyon** | ~%20 | Ton eşitsizliği, leke yoğunluğu, melanin düzensizliği | Flament/Nkengne |
| **Yüz kontrastı** | ~%12 | Kaş/ağız/göz çevresi — çevre deriye göre | Porcheron & Russell |
| **Dudak + göz çevresi hacmi** | ~%8 | Dudak yüksekliği/kırmızılığı, koyu halka, torba | Çoklu kaynak |

> ⚠️ **Bu ağırlıklar literatürden TÜRETİLDİ, tek bir çalışmada birlikte
> ölçülmedi.** Kendi kalibrasyon verimizle düzeltilecek ilk şey budur.
> Ayrıca ağırlıklar etniğe göre değişiyor (Asyalı yüzde pigment daha baskın) —
> Türk popülasyonu kalibrasyonu gerekli.

### Yüz kontrastı — neden ayrı bir boyut

**Porcheron, Mauger, Russell (Frontiers in Psychology 2017):**
Yüz özelliklerinin çevre deriden farkı yaşla azalıyor; yaş algısının
**bağımsız** belirleyicisi. Kontrastı yüksek yüz daha genç algılanıyor.

| Ölçülen | Güç |
|---|---|
| Kaş–deri **parlaklık** kontrastı | En güçlü |
| Ağız **yeşil-kırmızı** (a*) kontrastı | İkinci |
| Göz çevresi **mavi-sarı** (b*) kontrastı | Üçüncü |

Üç sebeple önemli:
1. Flament'in üç kümesinde **yok** — bağımsız boyut
2. Fotoğraftan **doğrudan hesaplanır** — AI gerekmiyor, piksel renk değeri yeter
3. **Kültürlerarası doğrulanmış** (2013 Kafkas, 2017 çok etnikli) — etnik
   kalibrasyon sorunu bu boyutta daha az

**Pratik sonuç:** kontrast kaybı makyajla telafi edilebilir. Ölçümde makyaj
varsa skor şişer — standart çekimdeki "makyajsız" şartının bilimsel gerekçesi budur.

**Nasıl hesaplanır:** kaş bölgesi ortalama parlaklık − çevre deri parlaklığı;
ağız ve göz çevresi için CIELab a*/b* farkı. Sunucuda basit görüntü işleme.

### Kapsam dışı (şimdilik)

**Hacim kaybı ve kemik erimesi** — orbital genişleme, maksiller geri çekilme,
prejowl rezorpsiyon. 3D tarama + PCA ile ölçülüyor, **fotoğraftan ölçülemez.**
İleride 3D tarayıcı alınırsa ayrı katman olarak eklenir.

**Saç ağarması** — bağımsız olarak anlamlı bulunmuş ama boyayla değişiyor,
klinik müdahalenin konusu değil. Ölçülmez; çekimde saç yüzden uzak tutulur.

---

## 3. Doğruluk hedefi

### "%90 doğruluk" doğrudan tanımlanabilir bir hedef değil

Görünüm yaşı için **altın standart yok.** Kronolojik yaş tahmin ediliyorsa
doğruluk ölçülebilir — ama ölçtüğümüz o değil. Görünüm yaşının "gerçeği",
bir insan panelinin verdiği ortalama tahmindir. Panelin kendi içindeki
dağılım bile ±4-5 yıl.

**Doğru hedef:** *"Bir uzman panelinin vereceği tahmine en yakın sayı."*
Ölçüsü **MAE (ortalama mutlak hata)**, birimi yıl.

**"%90 doğruluk" şöyle tanımlanır:** tahminlerin %90'ı ±5 yıl bandında.
Bu, MAE ≈ 3 yıl demektir.

### Literatürdeki en iyi değerler

| Yöntem | MAE |
|---|---|
| Derin öğrenme, algılanan yaş (Turner, JEADV 2024) | **2.4–2.8 yıl** |
| PhotoAgeClock | 2.3 yıl |
| En iyi Xception modeli | 2.30 yıl |
| Genel ön-eğitimli ağlar | 2–8 yıl |

MAE 2.3-2.8, **insan değerlendiriciden daha tutarlı.**

### Bizim beklenen eğrimiz

| Kalibrasyon verisi | Beklenen MAE |
|---|---|
| 0 kayıt | 4–6 yıl (Türk yüzünde kalibrasyonsuz) |
| 30–50 | 3.5–4.5 (sistematik sapma düzelir) |
| 150–200 | 3–3.5 (yaş/cinsiyet bazlı düzeltme) |
| 500+ | 2.5–3 (kendi model eğitimi mümkün) |

> Bu eğri **ekstrapolasyon** — literatürdeki kalibrasyon çalışmalarının tipik
> seyri. Kendi verimizde farklı çıkabilir.

---

## 4. Üç katmanlı mimari

### Katman 1 — Çoklu model konsensüsü

Tek AI'ya güvenilmez. 3-4 bağımsız tahmin alınır, **medyan** kullanılır
(ortalama değil — aykırı değer bozmasın).

| Kaynak | Ne verir |
|---|---|
| Vision model #1 | Yaş tahmini + gerekçe |
| Vision model #2 | Bağımsız tahmin |
| Yaş regresyon modeli (ticari lisanslı) | Sayısal tahmin |
| Yapısal skorlama (§2 kümeleri) | Kümelerden yaş eşlemesi |

**Dağılım ±8 yıldan genişse sayı verilmez** — "güvenilir değil" denir.
Bu dürüstlük sistemin lehine çalışır.

### Katman 2 — Yapısal ölçüm

§2'deki beş küme ayrı skorlanır. İki kazanç:
- **Açıklanabilirlik** — hastaya "sarkma puanın düşük" denebilir
- **Takip** — hangi müdahale neyi düzeltti görülür

### Katman 3 — Kendi kalibrasyonumuz

**Bu olmadan hedefe ulaşılamaz.** Hazır modeller Kafkas/Asya verisiyle
eğitilmiş, Türk yüzünde sapar.

**Yakıt: hekim tahmini.** Her analiz sonrası tek soru — *"Sizce kaç gösteriyor?"*
Tek kutu, 3 saniye.

| Model | Hekim | Fark |
|---|---|---|
| 41 | 38 | −3 |
| 37 | 39 | +2 |
| 44 | 44 | 0 |

20-30 kayıtta sistematik sapma görünür ("model sürekli 2-3 yıl fazla söylüyor"),
200'de sapma yaş grubuna ve cinsiyete göre ayrışır.

İleride panel (5-7 bağımsız tahmin) eklenirse referans daha sağlam olur.

**Kronolojik yaş hedef OLARAK KULLANILMAZ** — ölçtüğümüz kaç yaşında olduğu
değil, kaç gösterdiği.

---

## 5. Mevcut skorla bağ

Gençlik Skoru korunur, görünüm yaşından **türetilir**:

```
fark = kronolojik yaş − görünüm yaşı
skor = clamp(70 + fark × 3, 0, 100)
```

| Durum | Fark | Skor | Bölge |
|---|---|---|---|
| 10 yıl genç | +10 | 100 | 🔵 Harika |
| 5 yıl genç | +5 | 85 | 🟢 İyi |
| 3 yıl genç | +3 | 79 | 🟡 Normal |
| Yaşında | 0 | 70 | 🟡 Normal |
| 5 yıl yaşlı | −5 | 55 | 🔴 Çok Düşük |

**Çarpan 3 seçildi** çünkü MAE ~2.5 — ölçüm hatası tek başına bir renk
bölgesini aşmasın.

Mevcut renk bölgeleri (`colorZone`), durum etiketleri
(Tahmini / Güncelleniyor / Klinik Onaylı) ve kademe sistemi **değişmez.**

Anket, tetkik, klinik adımları **biyolojik** tarafı besler — görünüm yaşından
ayrı yaşar, skorda ayrı bileşen kalır.

---

## 6. Standart çekim protokolü

**Bu olmadan diğer her şey boşa.** Işık/açı/makyaj değişirse tahmin 5-8 yıl oynar.

| Kural | Neden |
|---|---|
| Sabit ışık (halka ışık, gölgesiz) | Gölge kırışık gibi görünür |
| Nötr ifade, ağız kapalı | Gülümseme kaz ayağı yaratır |
| Tam cephe, göz hizası | Açı sarkmayı gizler/abartır |
| **Makyajsız** | Fondöten lekeyi kapatır, ruj kontrastı şişirir |
| Saç yüzden uzak | Jawline görünmeli |
| Aynı mesafe/odak | Ölçek tutarlılığı |

Mevcut `SeriKamera` bileşenine kılavuz eklenecek.

---

## 7. Veri modeli (taslak)

```sql
internal_face_estimate
  photo_id, model_tahminleri jsonb, medyan_tahmin, guven_araligi,
  hekim_tahmin, panel_ortalama, kronolojik_yas, cinsiyet,
  kume_skorlari jsonb,          -- kırışık/sarkma/pigment/kontrast/hacim
  kontrast_olcumleri jsonb,     -- kaş-L*, ağız-a*, göz-b*
  cekim_standart_mi, created_at

internal_calibration
  yas_grubu, cinsiyet, ofset, orneklem_sayisi, guncellenme
```

`internal_calibration` haftalık yeniden hesaplanır.
Model çıktısı → ofset eklenir → düzeltilmiş tahmin.

Ekranda her zaman görünür: **"n kayıtla kalibre edildi, ±X yıl"** — hem hekime
geri bildirim, hem hastaya dürüstlük.

---

## 8. Dürüst sınırlar

1. **BMJ çalışması 70+ yaşta.** Genç yaşta sağkalım ilişkisi test edilmedi;
   40 yaşındaki hastada "yaşlanma hızı" iddiası ekstrapolasyondur.
2. **MAE ~2.5-3 yıl** — iki ölçüm arası 2 yıllık fark gürültü olabilir.
   Ölçüm aralığı en az 6 ay.
3. **Ağırlıklar etniktir.** Türk popülasyonu kalibrasyonu yapılmadı.
4. **Fotoğraf koşulu belirleyici.** Standart çekim yoksa karşılaştırma yapılamaz.
5. **FaceAge ticari kullanıma KAPALI** (GitHub: AIM-Harvard/FaceAge —
   "not intended for clinical care or commercial use"). İlham/kalibrasyon
   referansı olur, üründe kullanılamaz.
6. Dışa dönük dil: **"tahmini görünüm yaşı"** — "biyolojik yaşınız" denmez.

---

## 9. İnşa sırası

1. **Standart çekim protokolü** — en ucuz, en yüksek etkili adım
2. **Çoklu model + medyan + güven aralığı**
3. **Beş kümeli yapısal skor** (kontrast dahil)
4. **Hekim tahmini kutusu** — kalibrasyon yakıtı
5. **Kalibrasyon tablosu + haftalık ofset hesabı**
6. 500+ kayıt sonrası: kendi model eğitimi değerlendirilir

İlk üçüyle MAE ~3-4 yıl. Dördüncü ve beşinciyle 2.5-3 — literatürün en iyisi.

---

## 10. Kaynaklar

- Christensen ve ark., **BMJ 2009** — Perceived age as clinically useful
  biomarker of ageing: cohort study · https://pubmed.ncbi.nlm.nih.gov/20008378/
- Rexbye ve ark., **Age & Ageing 2006** — Influence of environmental factors
  on facial ageing · https://pubmed.ncbi.nlm.nih.gov/16407433/
- Porcheron, Mauger, Russell, **Front Psychol 2017** — Facial Contrast Is a
  Cross-Cultural Cue for Perceiving Age · https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5524771/
- Porcheron ve ark., **PLOS ONE 2013** — Aspects of Facial Contrast Decrease
  with Age · https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0057985
- Turner ve ark., **JEADV 2024** — Deep learning predicted perceived age ·
  https://onlinelibrary.wiley.com/doi/10.1111/jdv.20365
- PhotoAgeClock, **Aging-US** · https://www.aging-us.com/article/101629/text
- Flament/Nkengne · PMID 33165995 · PMID 32649786
- HOYS programı — apparent skin age after botulinum toxin and fillers ·
  https://www.tandfonline.com/doi/full/10.2147/CCID.S34705
- 15-Year Computational Twin Modeling of Botulinum Toxin A ·
  https://pubmed.ncbi.nlm.nih.gov/41345304/
- Machine learning methods for determining skin age: systematic review ·
  https://www.sciencedirect.com/science/article/pii/S0965206X2500035X
