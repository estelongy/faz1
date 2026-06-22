import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'İade & Cayma Hakkı — Estelongy',
  description: '14 günlük cayma hakkı, iade koşulları ve istisnalar.',
}

export default function IadePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors text-base font-semibold">
          ← Anasayfa
        </Link>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-2">İade & Cayma Hakkı</h1>
          <p className="text-slate-500 text-sm mb-8">
            6502 sayılı TKHK ve Mesafeli Sözleşmeler Yönetmeliği kapsamında — Yürürlük: 22 Haziran 2026 · Sürüm 1.0
          </p>

          <div className="space-y-7 text-slate-300 text-sm leading-relaxed">

            <section className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <h2 className="text-emerald-300 font-semibold text-base mb-2">✓ 14 Gün Cayma Hakkı</h2>
              <p className="text-slate-300">
                Ürünü teslim aldığınız tarihten itibaren <strong>14 gün</strong> içinde herhangi bir gerekçe
                göstermeksizin ve cezai şart ödemeksizin cayma hakkınızı kullanabilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">1. Cayma Hakkı Nasıl Kullanılır?</h2>
              <ol className="list-decimal list-outside pl-5 space-y-2 text-slate-400">
                <li>
                  Cayma bildiriminizi 14 gün içinde <a href="mailto:destek@estelongy.com" className="text-violet-400 hover:text-violet-300">destek@estelongy.com</a>{' '}
                  adresine veya hesap panelinizden &quot;İade Talebi&quot; üzerinden iletin.
                </li>
                <li>
                  Bildiriminize sipariş numarası, iade etmek istediğiniz ürünler ve banka/kart bilgilerinizi (iade
                  için) ekleyin.
                </li>
                <li>
                  Onayımızı takip eden 10 gün içinde ürünü orijinal ambalajı ve faturasıyla anlaşmalı kargo firmamızla
                  iade gönderim adresine gönderin.
                </li>
                <li>
                  Ürün depomuza ulaştığında <strong>14 gün içinde</strong> ödemeniz, kullandığınız ödeme yöntemine
                  iade edilir (banka süreleri eklenebilir — kart iadesi 2–7 iş günü içinde hesabınıza yansır).
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">2. İade Koşulları</h2>
              <ul className="list-disc list-outside pl-5 space-y-1 text-slate-400">
                <li>Ürün <strong className="text-slate-300">orijinal ambalajıyla</strong>, etiketleri sökülmemiş, kullanılmamış olmalıdır.</li>
                <li>Sipariş faturası ve varsa aksesuarlar (kablo, başlık, koruyucu kap) eksiksiz iade edilmelidir.</li>
                <li>İade kargo bedeli, üründe ayıp/yanlış sevkiyat varsa SATICI&apos;ya aittir; cayma hakkı kullanımında ALICI&apos;ya aittir.</li>
                <li>Anlaşmalı kargo firması dışında bir kargo ile gönderim halinde kargo ücreti ALICI&apos;ya aittir.</li>
              </ul>
            </section>

            <section className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <h2 className="text-amber-300 font-semibold text-base mb-3">
                3. Cayma Hakkının İstisnaları (Yönetmelik m.15)
              </h2>
              <p className="text-slate-300 mb-3">
                Aşağıdaki ürünlerde cayma hakkı <strong>kullanılamaz</strong>:
              </p>
              <ul className="list-disc list-outside pl-5 space-y-2 text-slate-300">
                <li>
                  <strong>Kişisel bakım/hijyen ürünleri</strong> — ambalajı, koruyucu folyo ya da güvenlik mührü açıldıktan sonra:
                  serum, krem, maske, dudak ürünleri, sünger, fırça başlığı, vb.
                </li>
                <li>
                  <strong>Hijyen koşulları nedeniyle iade edilemez ürünler</strong> — cihaz başlıkları, ağız aparatları, tek
                  kullanımlık ürünler.
                </li>
                <li>
                  <strong>Tesliminden sonra başka ürünlerle karışan ve doğası gereği ayrıştırılamayan ürünler</strong>
                  (örn. dökme veya karma içerikli paketler).
                </li>
                <li>
                  <strong>Dijital içerikler</strong> — kurs, video, PDF: <em>kullanıcı erişim sağladığı andan</em> itibaren
                  cayma hakkı kullanılamaz.
                </li>
                <li>
                  <strong>Kişiselleştirilmiş üretim</strong> — ALICI&apos;nın istekleri/talepleri doğrultusunda hazırlanan ürünler.
                </li>
                <li>
                  <strong>Çabuk bozulan veya son kullanma tarihi geçebilecek ürünler.</strong>
                </li>
              </ul>
              <p className="text-sm text-slate-400 mt-3">
                İstisna kapsamına giren ürünler, ürün detay sayfasında ve sipariş özeti ekranında açıkça
                işaretlenir; ödeme öncesi onayınız alınır.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">4. Ayıplı Ürün / Yanlış Sevkiyat</h2>
              <p>
                Eğer teslim aldığınız ürün ayıplı (üretim hatası, eksik parça, çalışmıyor) veya yanlış gönderildiyse
                — bu durum cayma hakkı süresinden bağımsızdır:
              </p>
              <ul className="list-disc list-outside pl-5 space-y-1 text-slate-400 mt-2">
                <li><strong className="text-slate-300">TKHK m.11</strong>: ücretsiz onarım, değişim, iade veya fiyat indirimi haklarınız vardır.</li>
                <li>Bildirimi teslim tarihinden itibaren 30 gün içinde yapmanız hakkınızı korur; iddia süresi 2 yıldır.</li>
                <li>Kargo hasarı için <strong className="text-slate-300">teslimat anında kuryeye tutanak</strong> tutturmanız önemlidir.</li>
                <li>Cihazlar için üretici/ithalatçı garantisi ayrıca geçerlidir.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">5. Klinik Hizmeti İade?</h2>
              <p>
                Klinikten satın aldığınız randevu/hizmet, randevu tarihinden{' '}
                <strong className="text-slate-300">48 saat öncesine kadar</strong> ücretsiz iptal edilebilir. Sonraki iptaller
                klinik politikasına tabidir (genellikle %50 kesinti). Tamamlanmış hizmet için iade söz konusu değildir;
                memnuniyetsizlik durumu için klinik ve Estelongy arabuluculuk sağlar.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">6. İletişim</h2>
              <p>
                İade ve cayma talepleri:{' '}
                <a href="mailto:destek@estelongy.com" className="text-violet-400 hover:text-violet-300">destek@estelongy.com</a>
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Tüketici Hakem Heyeti / Tüketici Mahkemesi başvuru sınırları için T.C. Ticaret Bakanlığı&apos;nın
                yıllık duyurularını takip ediniz.
              </p>
            </section>

            <section className="pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-500">
                Bu sayfa <Link href="/hakkinda/mesafeli-satis" className="text-violet-400 hover:text-violet-300 underline">
                Mesafeli Satış Sözleşmesi
                </Link>{' '}ile birlikte ön bilgilendirme formu niteliğindedir.
              </p>
            </section>

          </div>
        </div>
      </div>
    </main>
  )
}
