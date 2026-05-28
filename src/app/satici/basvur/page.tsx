export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SaticiBasvurForm from '@/components/SaticiBasvurForm'
import KomisyonHesaplayici from './KomisyonHesaplayici'

import SafeLink from '@/components/SafeLink'
export const metadata: Metadata = {
  title: 'İş Ortağı Başvurusu',
  description: 'Cilt bakım ürünlerinizi Estelongy platformunda satışa sunun.',
}

async function submitApplication(formData: FormData) {
  'use server'
  const supabase = await createClient()
  let { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const firstName  = (formData.get('first_name') as string)?.trim()
    const lastName   = (formData.get('last_name') as string)?.trim()
    const email      = (formData.get('email') as string)?.trim()
    const password   = formData.get('password') as string
    const birthYear  = formData.get('birth_year') as string
    const phoneInput = (formData.get('phone') as string)?.trim()
    const phoneE164  = phoneInput ? (phoneInput.startsWith('+') ? phoneInput : (phoneInput.startsWith('0') ? '+9' + phoneInput.replace(/\D/g, '') : '+90' + phoneInput.replace(/\D/g, ''))) : undefined

    if (!firstName || !email || !password) redirect('/satici/basvur?error=eksik')

    const admin = createServiceClient()
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      phone: phoneE164,
      email_confirm: true,
      phone_confirm: phoneE164 ? true : undefined,
      user_metadata: { first_name: firstName, last_name: lastName || '' },
    })
    if (createErr || !created.user) {
      // 422 = "already exists" → ayrı kod ile yönlendir
      const isDuplicate = createErr?.message?.toLowerCase().includes('already') ||
                          createErr?.message?.toLowerCase().includes('exist') ||
                          (createErr as { status?: number })?.status === 422
      redirect(`/satici/basvur?error=${isDuplicate ? 'hesap' : 'hesap_diger'}`)
    }

    if (birthYear) {
      await admin.from('profiles').update({ birth_year: parseInt(birthYear) }).eq('id', created.user.id)
    }

    user = created.user
  }

  const company_name = formData.get('company_name') as string
  const tax_number   = formData.get('tax_number') as string
  const phone        = formData.get('phone') as string

  const insertClient = createServiceClient()
  const { error } = await insertClient.from('vendors').insert({
    user_id:         user.id,
    company_name,
    tax_number:      tax_number || null,
    phone:           phone || null,
    approval_status: 'pending',
    is_active:       false,
  })

  if (error) redirect('/satici/basvur?error=1')
  redirect('/satici/basvur?success=1')
}

const ERROR_MESSAGES: Record<string, string> = {
  eksik:  'Zorunlu alanlar eksik. Ad, e-posta ve şifreyi doldurun.',
  hesap:  'Bu e-posta veya telefon zaten kayıtlı. Lütfen önce giriş yapın, ardından başvurunuzu gönderin.',
  '1':    'Başvuru kaydedilemedi. Bilgileri kontrol edip tekrar deneyin.',
}

export default async function SaticiBasvurPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params    = await searchParams
  const errorCode = typeof params.error === 'string' ? params.error : null
  const hasError  = !!errorCode
  const errorMsg  = errorCode ? (ERROR_MESSAGES[errorCode] ?? 'Bir hata oluştu. Lütfen tekrar deneyin.') : null
  const isSuccess = params.success === '1'
  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: existing } = await supabase
      .from('vendors')
      .select('id, approval_status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      return (
        <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
              existing.approval_status === 'approved' ? 'bg-emerald-500/20' :
              existing.approval_status === 'rejected' ? 'bg-red-500/20' : 'bg-[#C9A961]/20'
            }`}>
              <svg className={`w-8 h-8 ${
                existing.approval_status === 'approved' ? 'text-emerald-400' :
                existing.approval_status === 'rejected' ? 'text-red-400' : 'text-[#C9A961]'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {existing.approval_status === 'approved' ? 'İş Ortağı Hesabınız Aktif' :
               existing.approval_status === 'rejected' ? 'Başvurunuz Reddedildi' : 'Başvurunuz İnceleniyor'}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              {existing.approval_status === 'approved' ? 'Ürünlerinizi yönetebilirsiniz.' :
               existing.approval_status === 'rejected' ? 'Başvurunuz onaylanmadı. Destek ekibiyle iletişime geçin.' :
               'Başvurunuz admin onayı bekliyor. En kısa sürede değerlendirilecek.'}
            </p>
            <Link href={existing.approval_status === 'approved' ? '/satici/panel' : '/panel'}
              className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] text-white font-semibold rounded-xl">
              {existing.approval_status === 'approved' ? 'İş Ortağı Paneline Git' : 'Panele Dön'}
            </Link>
          </div>
        </main>
      )
    }
  }

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Başvurunuz Alındı</h2>
          <p className="text-slate-400 text-sm mb-2">
            Başvurunuz incelemeye alındı. En kısa sürede değerlendirilecek.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Hesabınız oluşturuldu. Onay sonrası <strong className="text-slate-400">giriş yaparak</strong> iş ortağı panelinize erişebilirsiniz.
          </p>
          <SafeLink href="/giris"
            className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] text-white font-semibold rounded-xl">
            Giriş Yap
          </SafeLink>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 hover:bg-slate-800/40 text-slate-300 hover:text-white text-base font-medium transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-9 2v8a1 1 0 001 1h3m4 0h3a1 1 0 001-1v-8m-9 2h4" /></svg>
            Anasayfa
          </Link>
          <span className="text-white font-bold">İş Ortağı</span>
          <a href="#basvur" className="px-4 py-2 bg-[#C9A961] hover:bg-[#D4B872] text-slate-900 text-sm font-bold rounded-lg">
            Başvur →
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-24 pb-12 px-4">
        <div className="absolute inset-0 bg-gradient-radial from-[#C9A961]/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <p className="inline-block px-3 py-1 rounded-full bg-[#C9A961]/15 border border-[#C9A961]/30 text-[#C9A961] text-xs font-bold uppercase tracking-[0.2em] mb-5">
            ✦ Estelongy İş Ortağı Programı
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-[-0.03em] leading-[1.05]">
            Cilt sağlığına yatırım yapan
            <br />
            <span className="bg-gradient-to-r from-[#C9A961] via-[#D4B872] to-[#B8964F] bg-clip-text text-transparent">
              gerçek müşterilere
            </span> ulaş.
          </h1>
          <p className="text-slate-300 text-lg sm:text-xl mt-6 max-w-2xl mx-auto leading-relaxed">
            Estelongy, EP skoruyla doğrulanmış küratörlü longevity & estetik mağazası. Genel pazaryeri değil —
            sadece bilim destekli ürünler.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#basvur" className="px-6 py-3 bg-gradient-to-r from-[#C9A961] to-[#B8964F] hover:from-[#D4B872] hover:to-[#C9A961] text-slate-900 font-bold rounded-xl text-base shadow-lg shadow-[#C9A961]/20">
              Başvuru Formu →
            </a>
            <a href="#nasil" className="px-6 py-3 border border-slate-700 hover:border-[#C9A961] text-slate-300 hover:text-white font-semibold rounded-xl text-base">
              Nasıl çalışır?
            </a>
          </div>

          {/* Hızlı sayısal vaatler */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <Stat value="%15" label="Komisyon" />
            <Stat value="T+7" label="Ödeme Periyodu" />
            <Stat value="48 sa" label="Onay Süresi" />
            <Stat value="0₺" label="Aylık Ücret" />
          </div>
        </div>
      </section>

      {/* NEDEN ESTELONGY */}
      <section className="py-16 px-4 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-white text-center tracking-[-0.02em] mb-3">
            Neden <span className="text-[#C9A961]">Estelongy</span>?
          </h2>
          <p className="text-slate-400 text-center text-base sm:text-lg mb-12 max-w-2xl mx-auto">
            Trendyol&apos;da kaybolma. Niş, küratörlü ve müşterisi <em>cilde para harcayan</em> bir pazaryerinde sat.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Value icon="🎯" title="Niş ve Küratörlü"
              body="Sadece longevity, anti-aging, klinik sonrası bakım, sarf-medikal. Müşteriler &quot;ne arıyorum&quot; biliyor, fiyata duyarlı değil." />
            <Value icon="🧪" title="EP Skoru Avantajı"
              body="Ürününüz bilim + hekim + müşteri puanlamasından geçer. EP&apos;si yüksek ürünler ekstra vitrin görünürlüğü kazanır." />
            <Value icon="🏥" title="Klinik Köprüsü"
              body="Estetik kliniklerinden gelen müşteri akışı — &quot;İşlem sonrası bakım sepeti&quot; içinde ürünleriniz önerilir." />
            <Value icon="🚚" title="Tek Tık Kargo"
              body="Etiket sistemi entegre, toplu kargolama, müşteriye otomatik bildirim. Hobi gibi değil, şirket gibi yönetirsiniz." />
            <Value icon="💳" title="Stripe Connect"
              body="Para doğrudan banka hesabınıza Stripe üzerinden, T+7 günde. Ek aracı yok, gizli kesinti yok." />
            <Value icon="🛡️" title="KVKK + ÜTS Uyumlu"
              body="Tüm ürünler ÜTS kayıtlı olmak zorunda. Sahte ürün riski sıfır. Müşteri güveni satıcının kazancıdır." />
          </div>
        </div>
      </section>

      {/* NASIL ÇALIŞIR */}
      <section id="nasil" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-white text-center tracking-[-0.02em] mb-12">
            5 Adımda Satışa Başla
          </h2>

          <div className="space-y-4">
            {[
              { n: 1, t: 'Başvuru Formu', d: 'Şirket bilgilerin + vergi numarası. 2 dakika sürer.' },
              { n: 2, t: 'KYC + Onay', d: 'Vergi levhası, ÜTS sertifikası vb. evrak yükle. 48 saatte cevaplıyoruz.' },
              { n: 3, t: 'Mağaza Vitrini', d: 'Logo, banner, hakkımızda, sosyal — markanı tanıt.' },
              { n: 4, t: 'Ürünleri Ekle', d: 'Tek tek veya CSV ile 500 ürüne kadar toplu yükle. Admin EP onayı sonrası canlı.' },
              { n: 5, t: 'Satış + Kargo', d: 'Sipariş gelir, tek tıkla etiket bas, kargoya ver. Para T+7 hesabında.' },
            ].map(step => (
              <div key={step.n} className="flex items-start gap-4 p-5 bg-slate-800/50 border border-slate-700 rounded-2xl hover:border-[#C9A961]/40 transition-colors">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#C9A961] to-[#8B7339] flex items-center justify-center text-slate-900 font-black text-xl">
                  {step.n}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">{step.t}</h3>
                  <p className="text-slate-400 text-base mt-1">{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KOMİSYON & HESAPLAYICI */}
      <section className="py-16 px-4 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-white text-center tracking-[-0.02em] mb-3">
            Şeffaf Komisyon
          </h2>
          <p className="text-slate-400 text-center text-base mb-10 max-w-xl mx-auto">
            Sabit oran. Gizli kesinti yok. Aşağıda kendi fiyatını yazıp net kazancını anında gör.
          </p>
          <KomisyonHesaplayici />
        </div>
      </section>

      {/* SSS */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-white text-center tracking-[-0.02em] mb-12">
            Sık Sorulanlar
          </h2>
          <div className="space-y-3">
            <Faq q="Sahibi olmadığım ürünü satabilir miyim?"
              a="Hayır. Estelongy yalnız ÜTS kayıtlı ürünleri kabul eder. Her ürünün kendi vergi makbuzunda olmak zorunda." />
            <Faq q="Aylık ücret veya raf parası var mı?"
              a="Hayır. Sadece satıştan %15 komisyon. Ürün yüklemek, mağaza açmak, mesaj atmak ücretsiz." />
            <Faq q="Kargoyu kim taşıyor?"
              a="Sen kendi anlaşmalı kargonu kullanırsın. Estelongy tek tık etiket üretimi + müşteri bildirimi sağlar. Kargo bedeli müşteriden tahsil edilir." />
            <Faq q="İade durumunda komisyon iade olur mu?"
              a="Evet, iade onaylanırsa komisyon da iade edilir. Adil." />
            <Faq q="Ne kadar sürede onaylanırım?"
              a="Tam evrak ile başvuruysa 48 saat içinde. Eksik evrak varsa süre uzar." />
            <Faq q="Bir hesabımdan birden çok mağaza yönetebilir miyim?"
              a="Şu an her e-posta için tek vendor hesabı. Birden fazla marka için ayrı hesaplar açılabilir." />
          </div>
        </div>
      </section>

      {/* BAŞVURU FORMU */}
      <section id="basvur" className="py-16 px-4 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-[-0.02em]">
              Başvuruyu Doldur
            </h2>
            <p className="text-slate-400 text-base mt-2">2 dakika. Admin onayından sonra panelin aktive olur.</p>
          </div>
          <SaticiBasvurForm action={submitApplication} hasError={hasError} errorMessage={errorMsg ?? undefined} isLoggedIn={!!user} />
        </div>
      </section>
    </main>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4 py-3 rounded-2xl bg-slate-900/60 border border-slate-700">
      <p className="text-2xl sm:text-3xl font-black text-[#C9A961]">{value}</p>
      <p className="text-slate-400 text-sm font-semibold mt-1">{label}</p>
    </div>
  )
}

function Value({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="p-5 bg-slate-800/40 border border-slate-700 rounded-2xl hover:border-[#C9A961]/40 transition-colors">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="text-white font-bold text-lg leading-tight">{title}</h3>
      <p className="text-slate-400 text-sm mt-2 leading-relaxed">{body}</p>
    </div>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group p-5 bg-slate-800/40 border border-slate-700 rounded-2xl hover:border-slate-600 transition-colors">
      <summary className="flex items-center justify-between cursor-pointer text-white font-semibold text-base list-none">
        <span>{q}</span>
        <span className="text-slate-500 text-xl group-open:rotate-45 transition-transform">+</span>
      </summary>
      <p className="text-slate-400 text-base mt-3 leading-relaxed">{a}</p>
    </details>
  )
}
