# Anonim İndirim Motoru — patent çekirdeği

> 8 Ekim 2026 · Durum: **çekirdek tanımlandı, ön tarama yapıldı, vekile gidilmedi**
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
