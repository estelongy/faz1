import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Güvenlik & Sorumlu Açıklama',
  description: 'Estelongy güvenlik politikası, açık bildirim kanalı ve KVKK/GDPR iletişim bilgileri.',
}

export default function GuvenlikPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-200">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 mb-8 text-slate-400 hover:text-white text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Anasayfa
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Güvenlik &amp; Sorumlu Açıklama</h1>
        <p className="text-slate-400 mb-10">
          Estelongy kullanıcı verisini ve platform bütünlüğünü ciddiye alır. Aşağıda güvenlik açığı bildirim
          süreci, kapsam ve KVKK/GDPR iletişim kanalları yer alır.
        </p>

        {/* ── Bildirim Kanalı ── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-3">Açık Bildirim</h2>
          <p className="text-slate-300 leading-relaxed mb-3">
            Bir güvenlik açığı keşfettiyseniz, lütfen bizi <strong>kamuya açık olarak duyurmadan önce</strong>{' '}
            bilgilendirin. Düzeltme süreci tamamlandıktan sonra (90 güne kadar) açıklama yayınlanabilir.
          </p>
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5 space-y-2">
            <div className="text-sm">
              <span className="text-slate-500">Birincil:</span>{' '}
              <a href="mailto:guvenlik@estelongy.com" className="text-violet-400 hover:underline">
                guvenlik@estelongy.com
              </a>
            </div>
            <div className="text-sm">
              <span className="text-slate-500">Yedek:</span>{' '}
              <a href="mailto:estelongy@gmail.com" className="text-violet-400 hover:underline">
                estelongy@gmail.com
              </a>
            </div>
            <div className="text-sm text-slate-500 pt-2">
              Lütfen bildiriminize: zafiyetin tipi, etkilenen URL/endpoint, yeniden üretim adımları, (varsa) PoC
              ve etki analizi ekleyin.
            </div>
          </div>
        </section>

        {/* ── Kapsam ── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-3">Kapsam</h2>
          <p className="text-slate-300 mb-3">İlgili tüm Estelongy mülkleri:</p>
          <ul className="list-disc pl-6 text-slate-300 space-y-1 text-sm">
            <li><code className="text-violet-300">estelongy.com</code> ve alt domainleri</li>
            <li><code className="text-violet-300">estelongy-clean.vercel.app</code></li>
            <li>Estelongy mobil ve web uygulamaları</li>
            <li>Estelongy API ve servis altyapısı</li>
          </ul>
        </section>

        {/* ── İlgi alanı ── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-3">İlgi Duyduğumuz Bulgular</h2>
          <ul className="list-disc pl-6 text-slate-300 space-y-1 text-sm">
            <li>Hesap ele geçirme (ATO) — yetkilendirme, oturum, OTP atlatma</li>
            <li>SQL injection, NoSQL injection, RCE</li>
            <li>SSRF, IDOR, yetki yükseltme</li>
            <li>Stored / DOM / Reflected XSS</li>
            <li>RLS atlatma — Supabase row-level security bypass</li>
            <li>Ödeme manipülasyonu — Stripe / fiyat / kupon</li>
            <li>Hassas veri sızıntısı (PII, sağlık verisi, finansal kayıt)</li>
          </ul>
        </section>

        {/* ── Kapsam dışı ── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-3">Kapsam Dışı</h2>
          <ul className="list-disc pl-6 text-slate-300 space-y-1 text-sm">
            <li>Sosyal mühendislik, oltalama (phishing), fiziksel saldırı</li>
            <li>Volumetric DDoS, brute-force kullanıcı tahmini</li>
            <li>Otomatik tarayıcı raporları (kanıt olmadan)</li>
            <li>SPF/DKIM eksikliği — bilinçli yapılandırma</li>
            <li>Sürüm bilgisi ifşası, bilgi açıklayan başlıklar</li>
            <li>Self-XSS, kullanıcının kendi cihazına saldırı</li>
          </ul>
        </section>

        {/* ── Kurallar ── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-3">Kurallar</h2>
          <ul className="list-disc pl-6 text-slate-300 space-y-1 text-sm">
            <li>Üçüncü kişi verilerine erişmeyin, ifşa etmeyin, indirmeyin</li>
            <li>Test hesapları kullanın — gerçek kullanıcı verilerine dokunmayın</li>
            <li>Servisi bozmayın — DDoS, kalıcı veri silme yapmayın</li>
            <li>Bulguyu kamu ile paylaşmadan önce 90 gün düzeltme süresi tanıyın</li>
            <li>Bu politikaya uyarsanız yasal işlem başlatılmayacaktır</li>
          </ul>
        </section>

        {/* ── KVKK/GDPR ── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-3">KVKK / GDPR İletişim</h2>
          <p className="text-slate-300 mb-3">
            Kişisel veri işleme, silme, düzeltme, taşınabilirlik talepleriniz için:
          </p>
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5 space-y-2">
            <div className="text-sm">
              <span className="text-slate-500">Veri Sorumlusu İletişim:</span>{' '}
              <a href="mailto:kvkk@estelongy.com" className="text-violet-400 hover:underline">
                kvkk@estelongy.com
              </a>
            </div>
            <div className="text-sm text-slate-500 pt-2">
              KVKK 11. madde kapsamındaki haklarınızı (silme/unutulma, erişim, düzeltme) hesap panelinizden
              doğrudan kullanabilirsiniz: <Link href="/panel/hesabim" className="text-violet-400 hover:underline">/panel/hesabim</Link>
            </div>
          </div>
        </section>

        {/* ── Teşekkürler ── */}
        <section id="tesekkurler" className="mb-10">
          <h2 className="text-xl font-bold text-white mb-3">Teşekkürler</h2>
          <p className="text-slate-400 text-sm">
            Sorumlu açıklama yapan araştırmacılar, izinleri olduğunda burada listelenir.
          </p>
        </section>

        <div className="text-sm text-slate-500 pt-8 border-t border-slate-800">
          security.txt: <Link href="/.well-known/security.txt" className="text-slate-400 hover:underline">
            /.well-known/security.txt
          </Link>
          <span className="mx-2">·</span>
          Son güncelleme: 2026-05-07
        </div>
      </div>
    </main>
  )
}
