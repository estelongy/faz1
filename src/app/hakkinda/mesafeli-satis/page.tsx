import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mesafeli Satış Sözleşmesi — Estelongy',
  description: '6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında mesafeli satış sözleşmesi.',
}

export default function MesafeliSatisPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors text-base font-semibold">
          ← Anasayfa
        </Link>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-2">Mesafeli Satış Sözleşmesi</h1>
          <p className="text-slate-500 text-sm mb-8">
            6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği
            kapsamında — Yürürlük: 22 Haziran 2026 · Sürüm 1.0
          </p>

          <div className="space-y-7 text-slate-300 text-sm leading-relaxed">

            {/* 1 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">1. Taraflar</h2>
              <p>
                İşbu sözleşme; aşağıda <strong>&ldquo;SATICI&rdquo;</strong> ile <strong>&ldquo;ALICI&rdquo;</strong> arasında, ALICI&apos;nın
                EsteStore (estelongy.store) üzerinden yaptığı sipariş esnasında elektronik ortamda kurulur ve
                onaylanır.
              </p>
              <div className="mt-3 p-4 rounded-lg bg-slate-900/60 border border-slate-700">
                <p><strong className="text-slate-300">SATICI:</strong> Vestoriq OÜ (Estonya Ticaret Sicili)</p>
                <p className="text-slate-400">Tallinn, Estonya</p>
                <p className="text-slate-400">E-posta: <a href="mailto:destek@estelongy.com" className="text-violet-400 hover:text-violet-300">destek@estelongy.com</a></p>
                <p className="text-slate-500 text-sm mt-2">
                  Pazaryeri kalemleri için sözleşme; ürünü sunan bağımsız satıcı (vendor) ile ALICI arasında
                  kurulur. Vendor unvanı ürün sayfasında ve fatura üzerinde gösterilir.
                </p>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                <strong className="text-slate-300">ALICI:</strong> Sipariş esnasında ad, soyad, T.C. kimlik bilgisi,
                teslimat adresi, e-posta ve telefon bilgilerini sağlayan kişi.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">2. Sözleşmenin Konusu</h2>
              <p>
                ALICI&apos;nın EsteStore üzerinden seçtiği ürün(ler)in satışı ve teslimi ile bunların bedelinin
                tahsiline ilişkin tarafların hak ve yükümlülüklerinin düzenlenmesi.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">3. Ürün, Bedel ve Ödeme</h2>
              <ul className="list-disc list-outside pl-5 space-y-1 text-slate-400">
                <li>Ürün adı, adet, birim fiyat, KDV dahil toplam tutar, kargo bedeli ve ödeme şekli sipariş özeti ekranında ALICI&apos;ya açıkça gösterilir.</li>
                <li>Ödeme; Stripe Inc. / Stripe Payments Europe Ltd. üzerinden PCI-DSS Level 1 uyumlu altyapı ile alınır. Kart bilgisi SATICI tarafından saklanmaz.</li>
                <li>Fiyatlar Türk Lirası (₺) cinsinden gösterilir; uluslararası kart kullanımında bankanız döviz çevrim ücreti uygulayabilir.</li>
                <li>Sipariş tamamlanmadan önce SATICI&apos;dan kaynaklanmayan fiyat değişikliklerinde ALICI bilgilendirilir; onay vermezse sipariş iptal edilir.</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">4. Teslimat</h2>
              <ul className="list-disc list-outside pl-5 space-y-1 text-slate-400">
                <li>Teslimat süresi, sipariş onayından itibaren en geç <strong className="text-slate-300">30 gün</strong>dür (TKHK m.48/4). Pratik teslim süresi ürün sayfasında belirtilir.</li>
                <li>Pazaryeri kalemleri vendor depolarından kargolanır; takip numarası &quot;Siparişlerim&quot; ekranında görüntülenir.</li>
                <li>Kargo hasarı veya eksiklik durumunda <strong className="text-slate-300">teslimat anında</strong> kuryeye tutanak tutturulması gerekir.</li>
                <li>Teslim alacak kişinin ALICI&apos;dan farklı olması, sorumluluğu ALICI&apos;dan kaldırmaz.</li>
              </ul>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">5. Cayma Hakkı</h2>
              <p>
                ALICI; teslim tarihinden itibaren <strong className="text-slate-300">14 gün</strong> içinde hiçbir gerekçe
                göstermeksizin ve cezai şart ödemeksizin cayma hakkına sahiptir.
              </p>
              <p className="mt-2">
                Cayma hakkının kullanımı ve istisnaları için ayrıntılı bilgi:{' '}
                <Link href="/hakkinda/iade" className="text-violet-400 hover:text-violet-300 underline">
                  İade & Cayma Hakkı sayfası
                </Link>.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Cayma bildirimi, bu sözleşmenin sonunda yer alan örnek form ile veya açık beyan ile{' '}
                <a href="mailto:destek@estelongy.com" className="text-violet-400 hover:text-violet-300">destek@estelongy.com</a>
                {' '}adresine yapılabilir.
              </p>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">6. Cayma Hakkının İstisnaları (Yönetmelik m.15)</h2>
              <ul className="list-disc list-outside pl-5 space-y-1 text-slate-400">
                <li>Tek kullanımlık ürünler, kişisel bakım/hijyen amaçlı ürünler (cilt bakımı serumu, krem, sünger vb.) ambalajı açıldıktan sonra cayma hakkından yararlanılamaz.</li>
                <li>Sağlık ve hijyen açısından iade için uygun olmayan ürünler (uygulama cihazı başlığı, dudak ürünleri vb.).</li>
                <li>Tesliminden sonra başka ürünlerle karışan ve doğası gereği ayrıştırılamayan ürünler.</li>
                <li>Dijital içerikler (kurs, video, PDF) — kullanıcı erişim sağlandığı andan itibaren.</li>
                <li>Ön sipariş veya kişiselleştirilmiş üretim ürünleri.</li>
              </ul>
              <p className="mt-3 text-sm text-slate-500">
                İstisna kapsamına giren ürünler, sipariş ekranında ve ürün detay sayfasında açıkça işaretlenir.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">7. İade Şartları</h2>
              <ul className="list-disc list-outside pl-5 space-y-1 text-slate-400">
                <li>Ürün orijinal ambalajı, faturası ve aksesuarlarıyla birlikte gönderilmelidir.</li>
                <li>İade kargo bedeli, ürün ayıplı/yanlış gönderildi ise SATICI&apos;ya; cayma hakkı kullanımında ALICI&apos;ya aittir.</li>
                <li>İade onayı sonrası ödeme, kullanılan ödeme yöntemine 14 gün içinde iade edilir (banka süreleri eklenebilir).</li>
              </ul>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">8. Garanti ve Ayıplı Ürün</h2>
              <p>
                ALICI, teslim tarihinden itibaren <strong className="text-slate-300">2 yıl</strong> içinde TKHK
                kapsamında ayıplı maldan kaynaklı haklarını (ücretsiz onarım, değişim, iade, indirim) kullanabilir.
                Cihazlar için üretici/ithalatçı garantisi ayrıca geçerlidir.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">9. Uyuşmazlık Çözümü</h2>
              <p>
                ALICI; bu sözleşmeden doğan uyuşmazlıklarda T.C. Ticaret Bakanlığı&apos;nca yıllık olarak belirlenen
                parasal sınırlar dahilinde <strong className="text-slate-300">İlçe/İl Tüketici Hakem Heyeti</strong>&apos;ne;
                bu sınırı aşan uyuşmazlıklarda <strong className="text-slate-300">Tüketici Mahkemesi</strong>&apos;ne başvurabilir.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-white font-semibold text-base mb-2">10. Onay ve Yürürlük</h2>
              <p>
                ALICI; sipariş ekranında bu sözleşmeyi okuduğunu ve kabul ettiğini onaylar.
                Sözleşme, ödeme onayı ile yürürlüğe girer ve sipariş kayıt edilir.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Bu sözleşmenin bir kopyası, sipariş onayı ile birlikte ALICI&apos;nın e-posta adresine gönderilir.
              </p>
            </section>

            {/* Cayma örnek formu */}
            <section className="pt-4 border-t border-slate-700">
              <h2 className="text-white font-semibold text-base mb-2">Örnek Cayma Bildirim Metni</h2>
              <pre className="text-sm text-slate-400 bg-slate-900/60 border border-slate-700 rounded-lg p-4 whitespace-pre-wrap font-mono">{`KONU: Cayma Hakkı Bildirimi

Sipariş No:    [ ___________ ]
Sipariş Tarihi:[ ___________ ]
Teslim Tarihi: [ ___________ ]

Aşağıda detayları yer alan ürün(ler) için cayma hakkımı kullanıyorum.
Ürün(ler)i hasar görmemiş şekilde, orijinal ambalajıyla iade edeceğim.

Ürün(ler):
  • [ ___________ ]

Ad Soyad: [ ___________ ]
İmza:     [ ___________ ]
Tarih:    [ ___________ ]

destek@estelongy.com adresine bu formu iletmeniz yeterlidir.`}</pre>
            </section>

          </div>
        </div>
      </div>
    </main>
  )
}
