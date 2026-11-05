# Referansör ekonomisi — karar kaydı

> 5-6 Kasım 2026, kurucu kararı. Uzun bir tartışmanın sonucu; **başa sarma**.
> Uygulama durumu: kararlar alındı, kod henüz yazılmadı.

---

## Tek kural

**Referanslı her işlemde %10 indirim var. Referansör ilk 10.000 TL'ye %20,
üstüne %10 puan kazanır. %10 üstü indirim referansörün puanından düşer ve
o işlemde puan kazanmaz.**

Bireysel ve kurumsal **aynı** — şimdilik. Kurumsalda `havuz_oran` alanı duruyor,
gerçek bir anlaşma yapılınca oradan ayarlanır.

---

## Sayılar (7.500 TL'lik işlem örneği)

| Müşteriye | Hastadan alınan | Puandan düşen | Puan kazancı |
|---|---|---|---|
| %10 (standart) | 6.750 | — | **+1.500** |
| %20 | 6.000 | 750 | 0 |
| %40 | 4.500 | 2.250 | 0 |
| %100 | 0 | 6.750 | 0 |

Formül: **puandan düşen = indirim tutarı − (taban × %10)**

Sınır: referansörün bakiyesi. 2.000 puanı varsa en fazla 2.750 TL indirim yapabilir.

### Ek işlem satışı — kademeli oran
Botoks için gelen hastaya ek işlem satılabiliyor; o günkü **toplam** referans
işlemi sayılır (personel tek rakam girer, ayrıştırma yok — operasyonel yük ve
hata riski yaratırdı).

Ama düz %20 büyük satışta orantısız kaçıyordu: 50.000'lik satışta referansöre
10.000 puan. Çözüm **kademeli oran**:

| İşlem | İlk 10.000 (%20) | Üstü (%10) | Toplam puan | Gerçek maliyet |
|---|---|---|---|---|
| 7.500 | 1.500 | — | 1.500 | ~500 |
| 15.000 | 2.000 | 500 | 2.500 | ~833 |
| 50.000 | 2.000 | 4.000 | 6.000 | ~2.000 |

Tavan yerine kademe seçildi: tavanda "kesildim" hissi olur, kademede sadece
azalan pay var. Normal işlemler (7.500–10.000) hiç etkilenmiyor.

Üstü için %5 tartışıldı, **%10'da karar kılındı**: tasarruf küçük (nadir
görülen büyük işlemlerde birkaç yüz lira), ama referansörün büyük hasta
getirme motivasyonu değerli.

### Kayıt bonusu
**4.000 puan**, kayıt anında verilir (ilk müşteri beklenmez).

Bonus 4.000 + iki işlem puanı (2 × 1.500) = **7.000** → iki hasta getiren
referansör bedava işlem hakkına ulaşır. Hedef bilinçli olarak böyle kuruldu:
ulaşılabilir, anlatılabilir, motive edici.

### Puanın kullanımı — tek hesap, üç yol
Puandan düşen her zaman **işlemin %90'ı**, kim için kullanıldığına bakılmaz:
- Referansör kendine işlem yaptırır → 6.750 düşer
- Sevdiğine yaptırır → 6.750 düşer
- Müşterisine indirim yapar → 6.750 düşer

Referansöre söylenen cümle: *"Fiyatımız 7.500; puanınla alsan bile %10 indirimin var."*
Yani referansör kliniğin ayrıcalıklı müşterisi — puan sadece bedava işlem değil,
kalıcı statü.

**Kendi kullandığı işlemden puan kazanmaz** (kendi kendini referans edemez).

---

## Maliyet

Referansör hediyesinin gerçek maliyeti **değerinin ~1/3'ü** (ürün maliyeti).
Kurucunun verdiği rakam: 1.500 TL değerinde hediye ≈ 500 TL maliyet.

| Kalem | Değer | Gerçek maliyet |
|---|---|---|
| Müşteri indirimi %10 | 750 | **750** (tam nakit kaybı) |
| Referansör puanı %20 | 1.500 | **~500** |
| **Toplam** | 2.250 (%30) | **1.250 (%17)** |

Yani nominal dağılım %30, gerçek yük **%17**.

Bedava işlem senaryosunda (2 hasta sonrası): 7.500'lük işlem ~1.500 ürün
maliyetiyle yapılır, kasaya nakit girmez. Karşılığında 2 ödeyen hasta gelmiştir
(2 × 6.750 = 13.500).

---

## Elenen seçenekler — tekrar açma

- ❌ **Kademe sistemi** (ciro/hasta sayısına göre yükselen oran). Bireysel referansör
  ömrü boyunca 2-3 kişi getiriyor; kademe çoğunluk için hiç işlemeyen bir
  mekanizma olurdu. Panelde "ciro arttıkça payınız yükselir" vaadi de tutmuyordu.
  Kurumsalda belki, şimdi değil.
- ❌ **Taban fiyat / alt sınır sistemi.** Pazarlık serbest kalsın; sistemde kısıt yok.
- ❌ **Üç dilimli seçim** (%10/%15/%20 müşteriye). Mahremiyet sorunu yaratıyordu —
  referansör telefonu gösterse "bana neden %10 tanımladın" tartışması çıkar.
  Ayrıca sosyal baskı: yakınları "biraz daha yapsana" der, referansör hayır diyemez.
  Tek sabit oran bu baskıyı tamamen kaldırıyor.
- ❌ **Asimetrik ceza tablosu** (10/20, 15/10, 20/5). Caydırıcıydı ama anlatılamazdı;
  referansör kafasında kuramaz. Maliyet farkı da sadece 6 puan — kısıtlamaya değmez.
- ❌ **Harcarken puan kazanmak.** Sistem kendi kuyruğunu yerdi (sonsuz döngü).
- ❌ **İndirimli fiyat üzerinden pay.** Referansör iki kez cezalanırdı; ayrıca
  "30 puan var, bölüşüyoruz" anlatımı bozulurdu. Pay **taban fiyat** üzerinden.

---

## İkinci aşamaya bırakılanlar

1. **Kampanya oranları.** DB'de teklifler kendi oranlarını taşıyor (Botoks %20,
   Skin Booster %25, Dolgu %35). Ortak kural %10 olunca çelişiyor. Üç seçenek:
   hepsi %10'a geçsin · kampanya oranı varsa o geçerli · kampanya sadece koşul
   belirlesin (görsel izni gibi), oran hep %10.
2. **Kurumsal farklılaşma.** Kurum tipine göre havuz dağılımı:
   kamu/belediye (tamamı müşteriye, kurum kazanmaz) · spor salonu/kuaför (karma) ·
   güzellik merkezi (nakit ağırlıklı, ticari ortak). Gerçek bir anlaşma yapılınca
   netleşecek.
3. **Nakde dönüş oranı.** Şu an %50 kesinti. Hesap: 10.000 puan kliniğe
   harcanırsa sana ~2.000 maliyet (ürün), nakde çevrilirse 5.000 TL nakit —
   yani nakit **2,5 kat pahalı**. Zarar değil ama en ucuz yol değil.
   Eşitlemek için %80 kesinti gerekir, o da kırıcı görünür; %70 ortada.
   **Kurucu kararı: şimdilik işlem puanıyla gidilecek, nakde dönüş sözel
   pazarlıkla hallolur.** Sistemde mekanizma zorlanmayacak.
4. **Puan ömrü.** Şu an 180 gün. Bireysel referansör 6 ayda 2-3 kişi getiriyor;
   biriktirmesini isteyip 180 günde yakmak çelişki. 365 gün önerildi, karar
   verilmedi — kurucu "sorun yok, böyle başlayabiliriz" dedi.
5. **Tekrar payı.** Getirilen hasta ikinci, üçüncü kez geldiğinde referansör
   hiçbir şey almıyor. Konuşuldu, karara bağlanmadı.

---

## Yapılacak (kod)

- [ ] Kayıt bonusunu **kayıt anına** taşı (bugün `referral_isaretle`'ye geri
      alınmıştı — kurucu "direkt ver, sıkıntı yok" dedi), tutarı 4.000 yap
- [ ] `referral_kademe` tek satıra insin: müşteri %10, puan oranı %20
- [ ] `referral_oran_bul` kademe aramayı bıraksın
- [ ] Panelde "ciro arttıkça payınız yükselir" metinleri kalksın
- [ ] %10 üstü indirim akışı: bakiye kontrolü + puandan düşme + o işlemde
      puan kazancı yok
- [ ] Referansörün kendi işleminde puan kazanmaması
