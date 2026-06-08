import Link from 'next/link'
import { CreditCard, Gift, AlertTriangle } from 'lucide-react'
import KrediSatinAlMobil from './KrediSatinAlMobil'

const TYPE_LABEL: Record<string, string> = {
  purchase: 'Satın Alma',
  usage: 'Kullanım',
  refund: 'İade',
  manual: 'Manuel',
}
const TYPE_COLOR: Record<string, string> = {
  purchase: 'text-emerald-300',
  usage: 'text-rose-300',
  refund: 'text-blue-300',
  manual: 'text-emerald-300',
}

export type CreditTxn = {
  id: string
  amount: number
  type: string
  description: string | null
  created_at: string
  appointment_id: string | null
}

interface Props {
  clinicName: string
  creditBalance: number
  freeRemaining: number
  totalCredits: number
  totalKullanim: number
  totalYukleme: number
  transactions: CreditTxn[]
  success?: boolean
  cancelled?: boolean
}

/**
 * EsteKlinikPRO app — /klinik/panel/kredi mobil görünümü.
 */
export default function KrediAppView({
  clinicName,
  creditBalance,
  freeRemaining,
  totalCredits,
  totalKullanim,
  totalYukleme,
  transactions,
  success,
  cancelled,
}: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-2">
        <p className="text-xs uppercase tracking-[0.18em] text-emerald-400/80">{clinicName}</p>
        <p className="mt-1 text-sm text-slate-400">
          Her hasta kabulünde 1 kredi düşer. Önce ücretsiz haklar, sonra bakiye.
        </p>
      </header>

      {/* Sonuç bannerları */}
      {success && (
        <section className="px-5 mt-3">
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium px-4 py-3">
            ✓ Ödeme başarılı — krediniz yüklendi.
          </div>
        </section>
      )}
      {cancelled && (
        <section className="px-5 mt-3">
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-medium px-4 py-3">
            ⚠ Ödeme iptal edildi.
          </div>
        </section>
      )}

      {/* Bakiye kartı — büyük */}
      <section className="px-5 mt-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300/80">
            Toplam Kredi
          </p>
          <p className="mt-1 text-5xl font-black tabular-nums text-white">{totalCredits}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Mini
              icon={<Gift size={14} className="text-emerald-300" />}
              label="Ücretsiz"
              value={freeRemaining}
              accent={freeRemaining === 0 ? 'text-slate-500' : 'text-emerald-300'}
            />
            <Mini
              icon={<CreditCard size={14} className="text-emerald-300" />}
              label="Bakiye"
              value={creditBalance}
              accent={
                creditBalance === 0
                  ? 'text-rose-300'
                  : creditBalance <= 10
                  ? 'text-amber-300'
                  : 'text-white'
              }
            />
          </div>
        </div>
      </section>

      {/* Uyarı */}
      {totalCredits === 0 && (
        <section className="px-5 mt-3">
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm p-4 flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p>
              <strong>Krediniz tükendi.</strong> Hasta kabulü kapalı. Yeni kredi yükleyin.
            </p>
          </div>
        </section>
      )}
      {totalCredits > 0 && totalCredits <= 10 && (
        <section className="px-5 mt-3">
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm p-4 flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p>
              <strong>Son {totalCredits} kredi.</strong> Tükendiğinde kabul kapanır.
            </p>
          </div>
        </section>
      )}

      {/* Satın al */}
      <section className="px-5 mt-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-3">
          Kredi Satın Al
        </p>
        <KrediSatinAlMobil />
      </section>

      {/* Özet */}
      <section className="px-5 mt-5 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Toplam Yüklenen
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums text-emerald-300">{totalYukleme}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Toplam Kullanılan
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums text-slate-300">{totalKullanim}</p>
        </div>
      </section>

      {/* Geçmiş */}
      <section className="px-5 mt-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-3">
          İşlem Geçmişi {transactions.length > 0 && `· ${transactions.length}`}
        </p>
        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-center text-sm text-slate-400">
            Henüz işlem yok.
          </div>
        ) : (
          <ul className="space-y-2">
            {transactions.map(t => (
              <li
                key={t.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-bold uppercase tracking-wide ${
                        TYPE_COLOR[t.type] ?? 'text-slate-400'
                      }`}
                    >
                      {TYPE_LABEL[t.type] ?? t.type}
                    </p>
                    <p className="text-sm text-slate-300 mt-0.5 truncate">
                      {t.description ?? '—'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(t.created_at).toLocaleString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-base font-black tabular-nums shrink-0 ${
                      t.amount > 0 ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {t.amount > 0 ? `+${t.amount}` : t.amount}
                  </span>
                </div>
                {t.appointment_id && (
                  <Link
                    href={`/klinik/panel/randevu/${t.appointment_id}`}
                    className="mt-2 inline-block text-xs font-medium text-emerald-400 active:text-emerald-300"
                  >
                    Randevuya git →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Mini({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent: string
}) {
  return (
    <div className="rounded-xl bg-slate-950/40 border border-emerald-500/15 p-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80">
          {label}
        </p>
      </div>
      <p className={`mt-1 text-2xl font-black tabular-nums ${accent}`}>{value}</p>
    </div>
  )
}
