import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Aydınlatma Metni & Gizlilik Politikası — Estelongy',
  description: 'KVKK ve GDPR kapsamında kişisel verilerinizin nasıl işlendiğine dair açıklama.',
}

export default function AydinlatmaPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors text-sm">
          ← Anasayfa
        </Link>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-2">Aydınlatma Metni & Gizlilik Politikası</h1>
          <p className="text-slate-500 text-sm mb-8">
            6698 sayılı KVKK (Türkiye) ve 2016/679 sayılı GDPR (AB) kapsamında —
            Yürürlük: Mayıs 2026 · Sürüm 1.1
          </p>

          <div className="space-y-7 text-slate-300 text-sm leading-relaxed">

            {/* 1 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">1. Veri Sorumlusu</h2>
              <p>
                Estelongy platformunu işleten <strong>Vestoriq OÜ</strong> (Tallinn, Estonya;
                Estonya Ticaret Sicili) — &ldquo;Estelongy&rdquo; veya &ldquo;Platform&rdquo;.
                Estelongy, Vestoriq OÜ&apos;nün tescilli markasıdır. Türkiye&apos;de yerleşik
                kullanıcılar açısından KVKK madde 3/ç anlamında veri sorumlusu sıfatı taşır.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                İletişim: <a href="mailto:kvkk@estelongy.com" className="text-violet-400 hover:text-violet-300">kvkk@estelongy.com</a>
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">2. İşlenen Kişisel Veri Kategorileri</h2>
              <ul className="list-disc list-outside pl-5 space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Kimlik:</strong> Ad, soyad, doğum yılı.</li>
                <li><strong className="text-slate-300">İletişim:</strong> E-posta, cep telefonu, teslimat adresi.</li>
                <li><strong className="text-slate-300">Biyometrik / özel nitelikli (KVKK m.6):</strong> Yüklediğiniz selfie / yüz fotoğrafları, bunlardan üretilen analiz puanları (yalnızca açık rıza ile).</li>
                <li><strong className="text-slate-300">Sağlık (özel nitelikli):</strong> Longevity anketi yanıtları, klinik randevu kayıtları, hekim notları (yalnızca açık rıza ile).</li>
                <li><strong className="text-slate-300">İşlem & finansal:</strong> Sipariş geçmişi, ödeme metaverisi (kart numarası tarafımızda saklanmaz; ödeme sağlayıcı PCI-DSS uyumlu işler).</li>
                <li><strong className="text-slate-300">Cihaz & log:</strong> IP adresi, tarayıcı tipi, oturum çerezleri, hata logları, güvenlik denetim kayıtları.</li>
                <li><strong className="text-slate-300">Pazarlama & tercih:</strong> Bildirim ayarları, ilgi alanları (yalnızca açık rıza ile).</li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">3. İşleme Amaçları & Hukuki Sebepler</h2>
              <ul className="list-disc list-outside pl-5 space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Üyelik & oturum yönetimi</strong> — KVKK m.5/2-c (sözleşmenin kurulması), GDPR Art.6(1)(b).</li>
                <li><strong className="text-slate-300">Estelongy Gençlik Skoru analizi</strong> (selfie + anket + tetkik) — KVKK m.6/2 ve GDPR Art.9(2)(a) <em>açık rıza</em>.</li>
                <li><strong className="text-slate-300">Klinik randevu eşleştirme & ödeme</strong> — sözleşme ifası.</li>
                <li><strong className="text-slate-300">Faturalama, mali kayıt & yasal saklama</strong> — KVKK m.5/2-a (kanunen öngörülme), VUK m.253 (5 yıl) ve TTK m.82 (10 yıl).</li>
                <li><strong className="text-slate-300">Güvenlik, dolandırıcılık önleme & log tutma</strong> — meşru menfaat (KVKK m.5/2-f, GDPR Art.6(1)(f)).</li>
                <li><strong className="text-slate-300">Pazarlama, kampanya & e-bülten</strong> — açık rıza, istediğinizde geri alabilirsiniz.</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">4. Yurt Dışına & Üçüncü Taraflara Aktarım</h2>
              <p>
                Hizmet sürekliliği için aşağıdaki <strong>veri işleyenler</strong> kullanılmaktadır.
                Hepsiyle KVKK m.9 ve GDPR Art.28 uyarınca veri işleme sözleşmesi (DPA) bulunmaktadır.
              </p>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 pr-4 text-slate-300 font-semibold">Sağlayıcı</th>
                      <th className="text-left py-2 pr-4 text-slate-300 font-semibold">Amaç</th>
                      <th className="text-left py-2 text-slate-300 font-semibold">Lokasyon</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-400">
                    <tr className="border-b border-slate-800">
                      <td className="py-2 pr-4">Supabase Inc.</td>
                      <td className="py-2 pr-4">Veritabanı, kimlik doğrulama, dosya depolama</td>
                      <td className="py-2">AB / ABD</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 pr-4">Vercel Inc.</td>
                      <td className="py-2 pr-4">Web hosting, CDN, edge fonksiyon</td>
                      <td className="py-2">ABD</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 pr-4">Stripe Inc. / Stripe Payments Europe Ltd.</td>
                      <td className="py-2 pr-4">Ödeme işleme (PCI-DSS Level 1)</td>
                      <td className="py-2">ABD / İrlanda</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 pr-4">Postmark (ActiveCampaign LLC)</td>
                      <td className="py-2 pr-4">İşlemsel e-posta (sipariş, OTP, bildirim)</td>
                      <td className="py-2">ABD</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 pr-4">Netgsm</td>
                      <td className="py-2 pr-4">SMS doğrulama (OTP) ve bildirim</td>
                      <td className="py-2">Türkiye</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 pr-4">Upstash Inc.</td>
                      <td className="py-2 pr-4">Hız sınırlama, oturum tampon belleği</td>
                      <td className="py-2">AB / ABD</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 pr-4">OpenAI Inc.</td>
                      <td className="py-2 pr-4">Yapay zekâ destekli analiz (selfie işlenir)</td>
                      <td className="py-2">ABD</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Sentry / Functional Software Inc.</td>
                      <td className="py-2 pr-4">Hata izleme & uygulama performansı</td>
                      <td className="py-2">ABD</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                ABD&apos;deki sağlayıcılar için aktarım, AB Standart Sözleşme Hükümleri (SCC) ve KVKK m.9
                kapsamında açık rızanıza dayanılarak gerçekleştirilir.
              </p>
              <p className="mt-2">
                Ayrıca <strong>seçtiğiniz klinik/iş ortağı</strong>, randevu/sipariş süreci için ad,
                telefon ve gerekli sağlık bilgilerinize erişir; başka amaçla kullanmaları yasaktır.
                Yetkili kamu kurumlarına yalnızca yasal zorunluluk halinde aktarım yapılır.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">5. Saklama Süreleri</h2>
              <ul className="list-disc list-outside pl-5 space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Selfie / biyometrik:</strong> En geç 12 ay; daha erken silmek için panelden talep gönderebilirsiniz.</li>
                <li><strong className="text-slate-300">Hesap ve profil:</strong> Üyelik aktif olduğu sürece + silme talebinden sonra 30 gün geri al penceresi.</li>
                <li><strong className="text-slate-300">Mali kayıtlar (sipariş, fatura):</strong> Yasal zorunluluk gereği 10 yıl (TTK m.82); kişisel bağ silinince anonim tutulur.</li>
                <li><strong className="text-slate-300">Güvenlik logları (denetim, IP):</strong> 12 ay.</li>
                <li><strong className="text-slate-300">Pazarlama tercihleri:</strong> Üyelik süresince + rıza geri alınana kadar.</li>
              </ul>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">6. Haklarınız (KVKK m.11 / GDPR Art.15-22)</h2>
              <ul className="list-disc list-outside pl-5 space-y-1 text-slate-400">
                <li><strong className="text-slate-300">Bilgi alma:</strong> Verilerinizin işlenip işlenmediğini, kapsamını ve amacını öğrenme.</li>
                <li><strong className="text-slate-300">Erişim & taşınabilirlik:</strong> Verilerinizin bir kopyasını yapılandırılmış formatta talep etme.</li>
                <li><strong className="text-slate-300">Düzeltme:</strong> Eksik / yanlış verilerin güncellenmesini isteme.</li>
                <li>
                  <strong className="text-slate-300">Silme (unutulma hakkı):</strong>{' '}
                  <Link href="/panel/hesabim" className="text-violet-400 hover:text-violet-300 underline">
                    panelden anında
                  </Link>{' '}
                  kullanabilir veya kvkk@estelongy.com adresine yazılı talep gönderebilirsiniz.
                </li>
                <li><strong className="text-slate-300">İşlemeyi sınırlama:</strong> Belirli amaçlar için işlemeyi geçici durdurma.</li>
                <li><strong className="text-slate-300">İtiraz:</strong> Otomatik karar / profil oluşturmaya itiraz.</li>
                <li><strong className="text-slate-300">Açık rızanın geri alınması:</strong> Pazarlama veya biyometrik analiz için verilen rızayı her zaman geri alabilirsiniz.</li>
                <li><strong className="text-slate-300">Şikâyet:</strong> Kişisel Verileri Koruma Kurumu (KVKK) veya AB üye devletinizin Veri Koruma Otoritesine başvurma.</li>
              </ul>
              <p className="mt-3 text-xs text-slate-500">
                Talepler en geç 30 gün içinde, yazılı bildirim halinde KVKK m.13 kapsamında
                ücretsiz olarak yanıtlanır.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">7. Çocukların Verisi</h2>
              <p>
                Estelongy 18 yaş altı kullanıcılara hizmet sunmamaktadır. 18 yaş altında olduğunuzu
                tespit edersek hesap kapatılır ve tüm verileriniz silinir.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">8. Veri Güvenliği</h2>
              <p>
                Verileriniz uçtan uca şifreli (TLS 1.2+) bağlantı ile aktarılır; veritabanı düzeyinde
                AES-256 şifreleme uygulanır. Erişim, en az ayrıcalık prensibine göre çalışan personel
                ile sınırlıdır. Sızma testi ve güvenlik denetimi düzenli aralıklarla yapılır. Olası bir
                veri ihlali halinde KVKK m.12/5 ve GDPR Art.33 gereği 72 saat içinde Kuruma ve
                etkilenen kullanıcılara bildirim yapılır.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">9. Çerezler</h2>
              <p>
                Çerez kullanımına dair detaylar{' '}
                <Link href="/hakkinda/cerez" className="text-violet-400 hover:text-violet-300 underline">
                  Çerez Politikamızda
                </Link>{' '}
                yer almaktadır. Yalnızca zorunlu çerezler varsayılan olarak aktiftir; pazarlama
                çerezleri açık rıza ile çalışır.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">10. Politika Güncellemeleri</h2>
              <p>
                Bu metin ihtiyaç halinde güncellenir. Esaslı değişikliklerde kayıtlı e-posta adresinize
                bildirim gönderilir; metnin yeni sürümü siteyi kullanmaya devam etmeniz halinde
                kabul edilmiş sayılır.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">11. İletişim</h2>
              <p>
                Veri sorumlusu: <strong>Vestoriq OÜ</strong> — Tallinn, Estonya<br />
                E-posta: <a href="mailto:kvkk@estelongy.com" className="text-violet-400 hover:text-violet-300">kvkk@estelongy.com</a><br />
                Web: <Link href="/hakkinda/iletisim" className="text-violet-400 hover:text-violet-300 underline">iletişim sayfası</Link>
              </p>
            </section>

          </div>
        </div>
      </div>
    </main>
  )
}
