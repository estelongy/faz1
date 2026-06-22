import type { Metadata } from 'next'
import Link from 'next/link'
import KvkkBasvuruForm from './KvkkBasvuruForm'

export const metadata: Metadata = {
  title: 'KVKK Başvuru Formu — Estelongy',
  description: '6698 sayılı KVKK madde 11 kapsamında veri sahibi başvuru formu.',
}

export default function KvkkBasvuruPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/hakkinda/aydinlatma" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors text-base font-semibold">
          ← Aydınlatma Metni
        </Link>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-2">Veri Sahibi Başvuru Formu</h1>
          <p className="text-slate-500 text-sm mb-6">
            6698 sayılı Kişisel Verilerin Korunması Kanunu madde 11 ve KVKK Tebliğ&apos;ine uygun olarak —
            haklarınızı bu form ile kullanabilirsiniz.
          </p>

          <div className="mb-6 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 text-sm text-slate-300 leading-relaxed">
            <p className="text-violet-300 font-semibold mb-2">Hangi haklarınızı kullanabilirsiniz?</p>
            <ul className="list-disc list-outside pl-5 space-y-1 text-slate-400">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse, hangi amaçla işlendiğine dair bilgi talep etme</li>
              <li>Verilerinizin bir kopyasını yapılandırılmış formatta isteme (taşınabilirlik)</li>
              <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
              <li>Verilerinizin silinmesini veya yok edilmesini isteme (unutulma hakkı)</li>
              <li>Otomatik karar / profil oluşturmaya itiraz etme</li>
              <li>Açık rızanızı geri alma</li>
            </ul>
            <p className="text-sm text-slate-500 mt-3">
              Talepleriniz en geç <strong>30 gün</strong> içinde, KVKK m.13 kapsamında ücretsiz olarak yanıtlanır.
            </p>
          </div>

          <KvkkBasvuruForm />

          <div className="mt-8 pt-6 border-t border-slate-700 text-sm text-slate-500 space-y-2">
            <p><strong className="text-slate-300">Alternatif kanal:</strong> Bu formun yerine doğrudan{' '}
              <a href="mailto:kvkk@estelongy.com" className="text-violet-400 hover:text-violet-300">kvkk@estelongy.com</a>
              {' '}adresine de yazılı başvurabilirsiniz.
            </p>
            <p>
              Anonim başvuru kabul edilmez; kimliğinizi doğrulamamız için TC kimlik numarası veya hesap e-posta
              adresiniz gereklidir.
            </p>
            <p>
              Veri sorumlusu: <strong className="text-slate-300">Vestoriq OÜ</strong> — Tallinn, Estonya.
              Türkiye&apos;de yerleşik kullanıcılar açısından KVKK m.3/ç anlamında veri sorumlusu.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
