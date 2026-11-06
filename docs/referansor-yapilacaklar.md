# Referansör sistemi — yapılacaklar

> Test akışında biriken tespitler. Her yeni bulgu buraya, toplu kapanış için.
> Son güncelleme: 4 Kasım 2026

---

## Bekleyen

### 12. `/referansor-basvuru` davetsiz de açılıyor
**Durum:** iş kararı bekliyor
`searchParams.ref ?? ''` — önek olmadan da form açılıyor, yani adresi bilen herkes
başvuru bırakabilir. Zarar sınırlı (onaysız referansör oluşmuyor, kuyruğa düşüyor)
ama davetsiz başvurular birikebilir. Ayrıca gelen önek doğrulanmıyor.

Soru: referansörlük davetle mi yayılsın, isteyen başvurabilsin mi?

### 13. `uyelik_baslat` RPC'sinin iki sürümü var
**Durum:** açık — bugünkü PGRST203 hatasının aynısı
`uyelik_baslat(uuid,uuid,text,text)` ve `uyelik_baslat(uuid,uuid,text,text,boolean)`.
Kod 5 parametreliyi çağırıyor; 4 parametreli çağrı gelirse aynı "Could not choose
the best candidate function" hatası çıkar. Eski sürüm düşürülmeli — önce
`pg_get_functiondef` ile yedeği alınmalı.

### 3. Panel linki referansöre hiç gitmiyor
**Durum:** karar bekliyor (dışarı çıkan iş — onay şart)
Referansör üye oluyor, paneli `/tavsiye/<önek>` hazır, ama adresi bildiren
otomatik mesaj yok. Klinik personeli elle iletmek zorunda.
`referans-mesajlar.ts`'teki dört metin de müşteri için — referansörün kendisi için yok.

Önerilen: `uyelikOnayla` (uyelik-actions.ts) içinde `referansor === true` ise
panel linkini SMS ile gönder.

### 4. Panelde "ana ekrana ekle" yönlendirmesi yok
**Durum:** yapılabilir, kimseye mesaj gitmez
PWA kurulumu çalışıyor (`tavsiye-manifest.json`, `start_url: "."` kendi öneğini açıyor)
ama kullanıcı bunu kendiliğinden bilmez. Panelde bir şerit/ipucu gerekiyor.

### 5. RPC tanımları repoda yok — yapısal risk
**Durum:** açık
`referral_kurum_kabul`, `referral_referansor_ekle`, `referral_basvuru_onayla`,
`referral_panel`, `referral_kilitle_aday` ve diğerleri yalnızca Supabase'de duruyor;
`supabase/migrations/` altında `CREATE` tanımları yok.

**Bugün bunun bedeli ödendi:** `referral_davet_baslat`'ın iki sürümü birikmiş,
PGRST203 hatası çıkmış, yedek bile alınamıyordu. Aynısı diğer RPC'lerde tekrarlayabilir.

Yapılacak: her RPC'nin `pg_get_functiondef` çıktısı migration olarak repoya alınmalı,
bundan sonra imza değişiklikleri migration'dan geçmeli.

### 6. Kaybolan üç koruma
**Durum:** davranış kararı bekliyor
Silinen 4 parametreli `referral_davet_baslat` sürümünde olup kalan sürümde **olmayan**
kontroller:
- ad ≥ 2 karakter / telefon ≥ 10 hane doğrulaması (DB katmanında)
- "bu numara daha önce indirim kodu kullanmış" engeli
- aynı numaraya açık davet varsa iptal etme

Bunlar zaten devre dışıydı (kod yeni sürümü çağırıyordu), ama artık DB'de hiç yoklar.
Soru: **aynı müşteri ikinci kez indirim alabilsin mi?**
Not: ad/telefon doğrulaması `actions.ts`'te uygulama katmanında var, kayıp değil.

### 7. Referansör sistemi muhasebe altında — geçici adres
**Durum:** bilgi notu
Şu an `klinik/panel/muhasebe/referans/` altında. Muhasebe owner-whitelist'li özel CRM
(Dr. İzzet + Işık Anka), referansör ise her kliniğin kullanacağı sistem.
İleride kendi yerine taşınacak — bugün yazılan kod taşınabilir kalmalı, muhasebeye gömülmemeli.

### 9. Altın kod ekranda sabit kalıyor — kapatma yolu yok
**Durum:** düzeltilebilir
`ReferansorPanel.tsx:64` `altinKod` state'i yalnız `basla` (80) ve `tekrarGonder` (91)
başında `null`'a dönüyor. Yani kod, **yeni bir davet başlatılana kadar** ekranda asılı kalıyor.
Kapatma butonu yok.

Risk: referansör telefonunu birine gösterdiğinde önceki müşterinin altın kodu görünür.
Gerekli: "Tamam / Kapat" butonu, ya da kopyalandıktan bir süre sonra otomatik gizlenme.

### 10. SMS sonunda `B021` çöpü
**Durum:** Netgsm hesabı tarafı — kodda düzeltilecek şey yok
Gelen SMS: `Dr. Izzet GOK B021`. Kodda `KLINIK = 'Dr. İzzet GÖK'`, ek yok;
`B021` projede hiç geçmiyor (grep temiz).

Demek ki Netgsm mesaj başlığı tarafından ekleniyor. CLAUDE.md `NETGSM_MSGHEADER=ESTELONGY`
diyor ama gelen mesajda "ESTELONGY" görünmüyor — onaysız başlıkta operatör bayi kodu ekliyor
olabilir. Netgsm panelinden başlık onayı kontrol edilmeli.

### 8. `/referansor-basvuru` kapısı hiç test edilmedi
**Durum:** test bekliyor
Üç kapıdan ikisi çalıştı (hasta kartı + SMS → DH6/SD8; kurumsal davet → SE9 uçtan uca).
Dışarıdan aday başvurusu kapısı hiç denenmedi, bekleyen başvuru yok.

---

### 15. İşlem kataloğu — fiyat ve stok bağlanacak
**Durum:** sonraya bırakıldı (kurucu: "fiyat listeleri ve stokları bağlayacaz sonra")

Katalog 6 Kas'ta yeniden kuruldu: 55 kalem, 8 kategori, hepsi `Grup - Ayrıntı`
kalıbında (Botoks - Glabella, Gençlik Aşısı - Profhilo, Sıvı Yüz Germe - Radiesse…).
Eski genel kalemler (Botoks, HA Dolgu, Mezoterapi, Skin Booster) silindi — yeni
bölge bazlı listeyle çakışıyorlardı. Geçmiş 51 işlemin adı `internal_treatment.name`
alanında metin olarak duruyor, yalnız `catalog_id` bağı koptu.

Bekleyen:
- `default_price` alanı boş — dolunca işlem seçilince ücret otomatik dolacak
  (bağlantı `IslemAdiSecici` içinde hazır, `onSec` ile çalışıyor)
- Stok eşlemesi: `internal_product` + stok tabloları var, katalogla bağlanmadı

## Çözülenler

- **KURAL: bir telefon, bir aktif referansör** (migration `20261111_...`, uygulandı).
  Kurucunun kararı. DB trigger'ı olarak kondu — referansör dört ayrı yoldan
  açılıyor, her birine ayrı kontrol yazmak eksik kalırdı.
  Semra Demirlenk hem üye (SD8) hem kurumsal (SE9) açılmıştı, aynı numaraya bağlı;
  elle pasife alınarak çözülmüştü. Asıl risk girişteydi: `referral_giris_onek`
  `limit 1` diyor, iki aktif kayıtta hangi panele girileceği belirsiz kalıyordu.
  İki senaryoda doğrulandı: pasif kaydı aktife çekmek engellendi, aynı numaraya
  yeni kayıt açmak engellendi. Pasif kayıtlar serbest (arşiv/askıya alma çalışıyor).
- **Dört giriş kapısı da test edildi** (5 Kas): hasta kartı+SMS · kendi başvurusu ·
  üyelikle birlikte · kurumsal davet. Dördü de çalışıyor.
- **Kayıt bonusu artık işliyor** (migration + commit `ded69e6`, test edildi).
  Hiçbir yerde verilmiyordu — `bonus_uye`/`bonus_kurumsal` tanımlıydı ama ne
  `uyelik_baslat` ne `referral_referansor_ekle` okuyordu; DH6'daki `true` elle
  yazılmış olmalı. Bonus ortak yere (`referral_referansor_ekle`) kondu: referansör
  kaydı hangi yoldan açılırsa açılsın deftere `puan_bonus` satırı yazılıyor.
  IG5GOK'ta doğrulandı: 3000 puan, `bonus_verildi: true`.
- **Başvuru onayı diğer yollarla hizalandı** (migration). Kendi önek mantığını
  yazıyordu (addan ilk iki harf `IZ`, `max(kod_rakam)+1`); artık ortak fonksiyonu
  çağırıyor — `referral_bas_harf()` ile `IG`, rakam boşlardan rastgele. Ayrıca
  rıza izi damgalanıyor, telefon eşleştirmesi son 10 haneye çevrildi (mükerrer
  hasta kaydı açmasın).
- **Hoş geldin SMS'i** (commit `ded69e6`): onay + bonus + panel linki tek mesajda.
  Panel adresi daha önce hiçbir kanaldan gitmiyordu, personel elle iletiyordu.
  Bonus yoksa o satır hiç yazılmıyor. SMS gidemezse akış bozulmuyor.

- **Üye hastayı SMS onayıyla referansör yapma** (commit `4e2dc38`, canlıda, test edildi).
  Üyelik akışı yalnız üye OLMAYANLARDA çalışıyordu; üye birini referansör yapmanın
  onaylı yolu yoktu. Referanslar sekmesine kondu: hasta ara → seç → onay kodu →
  referansörlük açılır, `referansor_onay_at` damgalanır.
- **Onaysız referansör yapma kapatıldı** (commit `5c36f46`). Eski "anında referansör yap"
  düğmesi kişinin haberi olmadan yetki veriyordu; kaldırıldı, server action hata döndürüyor.
- **PWA kısayolu anasayfaya atıyordu** (commit `cc29051`, canlıda, test edildi).
  Manifest kökte tek statik dosyaydı, `start_url: "."` göreliydi ve manifestin
  konumuna göre çözümlendiği için kökü işaret ediyordu. Koddaki "kurulan kısayol
  kendi öneğini açar" yorumu yanlıştı — hiç test edilmemiş. Manifest artık önek
  altından üretiliyor (`/tavsiye/<önek>/manifest.webmanifest`), `start_url` tam
  panel adresi. Eski statik dosya silindi.

- **Referansör girişi SMS doğrulamalı oldu** (commit `0d731b9`, migration uygulandı, canlıda).
  Panel eskiden tamamen açıktı: öneği (DH6GOK) bilen herkes açabiliyordu.
  - Şifre **bilerek konmadı**: referansör ayda bir girer, parola unutur, sıfırlama
    akışı dört yeni ekran demekti. Yerine telefon + 6 haneli SMS kodu.
  - Doğrulama sonrası çerez **90 gün** durur; başka cihaz/tarayıcı → yeniden sorar.
  - **`/tavsiye` (öneksiz)** giriş kapısı: panel adresi unutulursa telefonla girilir,
    sistem kendi paneline yönlendirir. Önek ezberlenmesi gerekmiyor.
  - **Numara sızdırma koruması:** kayıtlı olmayan numaraya da "kod gönderildi" denir,
    SMS gitmez, kota yakılmaz.
  - `referral_giris_onek` RPC (SECURITY DEFINER): numara formatları tutarsız
    (`5538693433` / `05418404465`), son 10 hane karşılaştırılıyor. Beş senaryoda
    doğrulandı: 0'lı, çıplak, +90'lı formatlar aynı öneğe düşüyor; kayıtsız ve
    geçersiz numara boş dönüyor; pasif kayıtlar `aktif` filtresiyle eleniyor.
  - Panelde **"Çıkış yap"** — ortak/ödünç cihaz için.
  - **APK'ya gerek yok:** PWA zaten app gibi kuruluyor, artık girişi de korumalı.

- **SMS'te indirim oranı artık her zaman görünüyor** (commit `adda4ec`, canlıda).
  "Referans Ekle" gibi kendi oranı olmayan tekliflerde müşteriye "size ozel indirim"
  diye boş bir söz gidiyordu. Oran teklif metninde yoksa referansörün `musteri_max`
  değerinden alınıyor — veri `referral_panel` RPC'sinde zaten vardı, DB'ye dokunulmadı.
  Her iki SMS de düzeldi. Genel teklif artık **%20** gösteriyor.

- **PGRST203 "Davet Gönder" bozuk** — DB'de `referral_davet_baslat`'ın iki sürümü vardı.
  4 parametreli eski sürüm düşürüldü (4 Kas 2026). İki gövde de
  `supabase/migrations/_yedek_referral_davet_baslat.sql` içinde yedekli.
  REST'ten doğrulandı: her iki çağrı şekli de artık temiz çalışıyor.
- **"Kodu referansiniza iletin"** → `referansorunuze` olarak düzeltildi
  (`referans-mesajlar.ts:85`). **Henüz canlıda değil — push bekliyor.**
- **Altın kod SMS'i son hali** (`smsKodOzetMetni`, 5 Kas) — kurucunun yazdığı ton:
  ```
  Sayin Izzet G., Dr. Izzet GOK kliniginde %25 indirim tanimli ALTIN KODUNUZ: TJKJ
  Indirim firsati icin son tarih 11 Kasim. Ref: Deniz H.
  ```
  - Yeni yardımcı `adSoyadBasHarf`: "İZZET GÖK" → "İzzet G." — hem müşteri hem referansör
    adında soyadı açıkta kalmıyor.
  - `Ref:` satırı eklendi; veri `referral_davet_goster` RPC'sinde **zaten vardı**
    (`referansor` alanı), DB'ye dokunulmadı — `actions.ts`'te geçirildi.
  - **Panel öneki (DH6GOK) SMS'e ASLA yazılmaz** — o, referansörün şifresiz panel adresi.
    Kurucunun "D.H.-refKodu" önerisi bu yüzden elendi; ayrıca DH zaten "Deniz Hanım"ın
    baş harfleri, tekrar olurdu.
  - Ölçüldü: 4 senaryoda da tek kredi (en uzun 141/155).
- **(önceki tur)** Altın kod SMS'i yeniden yazılmıştı — heyecanlı/teşvik edici ton,
  "ALTIN KODUNUZ" vurgusu. Üç değişiklik:
  (a) `ayricalik` metni artık ham basılmıyor, yalnız oran çekiliyor → "Tanıdığınız
  indirimli işlem yaptırsın" saçmalığı müşteriye gitmiyor, **DB'deki metni düzeltmeye
  gerek kalmadı**, panelde doğru haliyle kalabiliyor;
  (b) imza satırı (`KLINIK`) kaldırıldı — klinik adı zaten ilk satırda, tekrardı;
  (c) uzunluk ölçüldü: en kötü senaryo 154/155 karakter = **tek kredi**
  (önceki hali 160 karaktere çıkıp çift kredi yakıyordu).
  Yeni metin: `Sayin Izzet, Dr. Izzet GOK kliniginde %25 indirimli ALTIN KODUNUZ: TJKJ`
  `11 Kasim tarihine kadar gecerli. Indirim icin kodu soylemeniz yeterli!`
  **Henüz canlıda değil — push bekliyor.**
- **Üyelik onay SMS'inde soyadı eksikti** — commit `7b33bfb`.

---

## Commit bekleyen

- `docs/referansor-yapilacaklar.md` (bu dosya)
- `supabase/migrations/20261109_referral_davet_baslat_eski_surum_sil.sql`
- `supabase/migrations/_yedek_referral_davet_baslat.sql`
- `src/app/klinik/panel/muhasebe/referans-mesajlar.ts` (referansörünüze düzeltmesi)
- Ayrıca referans sistemine ait 7 değişmiş dosya (74 satır, `islem_notu` alanı dahil)
  — içerikleri henüz okunmadı

**Push hedefi belirsiz:** repo `master`'da, ama CLAUDE.md ve memory production dalını
`claude/priceless-ellis` diyor. Sormadan push edilmeyecek.
