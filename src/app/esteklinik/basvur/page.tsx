export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import KlinikBasvurForm from '@/components/KlinikBasvurForm'
import EsteKlinikNav from '@/app/esteklinik/EsteKlinikNav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Klinik Başvurusu',
  description: 'Kliniğinizi Estelongy platformuna kaydedin. Hastaları kolayca yönetin.',
}

async function submitApplication(formData: FormData) {
  'use server'
  const supabase = await createClient()
  let { data: { user } } = await supabase.auth.getUser()

  // Giriş yapılmamışsa yeni hesap oluştur
  if (!user) {
    const firstName  = (formData.get('first_name') as string)?.trim()
    const lastName   = (formData.get('last_name') as string)?.trim()
    const email      = (formData.get('email') as string)?.trim()
    const password   = formData.get('password') as string
    const birthYear  = formData.get('birth_year') as string
    const phoneInput = (formData.get('phone') as string)?.trim()
    const phoneE164  = phoneInput ? (phoneInput.startsWith('+') ? phoneInput : (phoneInput.startsWith('0') ? '+9' + phoneInput.replace(/\D/g, '') : '+90' + phoneInput.replace(/\D/g, ''))) : undefined

    if (!firstName || !email || !password) redirect('/esteklinik/basvur?error=eksik')

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
      // Email zaten kayıtlıysa kullanıcıyı giriş ekranına yönlendir
      const msg = (createErr?.message ?? '').toLowerCase()
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        redirect('/esteklinik/basvur?error=email_var')
      }
      redirect('/esteklinik/basvur?error=hesap')
    }

    // Profil güncelle
    if (birthYear) {
      await admin.from('profiles').update({ birth_year: parseInt(birthYear) }).eq('id', created.user.id)
    }

    user = created.user
  }

  const name        = formData.get('name') as string
  const phone       = formData.get('phone') as string
  const location    = formData.get('location') as string
  const bio         = formData.get('bio') as string
  const clinicType  = formData.get('clinic_type') as string
  const specialties = formData.getAll('specialties') as string[]

  // Yeni oluşturulan kullanıcılar için oturum cookie'si olmayacağından service client kullan
  const insertClient = createServiceClient()
  const { error } = await insertClient.from('clinics').insert({
    user_id:         user.id,
    name,
    phone:           phone || null,
    location:        location || null,
    bio:             bio || null,
    clinic_type:     clinicType || null,
    specialties:     specialties.length > 0 ? specialties : null,
    approval_status: 'pending',
    is_active:       false,
  })

  if (error) redirect('/esteklinik/basvur?error=1')
  redirect('/esteklinik/basvur?success=1')
}

export default async function KlinikBasvurPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params    = await searchParams
  const errorType = params.error ?? ''
  const hasError  = !!errorType
  const isSuccess = params.success === '1'
  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Zaten başvurusu var mı?
  if (user) {
    const { data: existing } = await supabase
      .from('clinics')
      .select('id, approval_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      return (
        <>
          <EsteKlinikNav />
          <main className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md text-center p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                existing.approval_status === 'approved' ? 'bg-[#10876B]/15' :
                existing.approval_status === 'rejected' ? 'bg-red-100' : 'bg-amber-100'
              }`}>
                <svg className={`w-8 h-8 ${
                  existing.approval_status === 'approved' ? 'text-[#10876B]' :
                  existing.approval_status === 'rejected' ? 'text-red-500' : 'text-amber-500'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {existing.approval_status === 'approved' ? 'Klinik Hesabınız Aktif' :
                 existing.approval_status === 'rejected' ? 'Başvurunuz Reddedildi' : 'Başvurunuz İnceleniyor'}
              </h2>
              <p className="text-slate-600 text-sm mb-6">
                {existing.approval_status === 'approved' ? 'Klinik panelinize erişebilirsiniz.' :
                 existing.approval_status === 'rejected' ? 'Başvurunuz onaylanmadı. Destek ekibiyle iletişime geçin.' :
                 'Başvurunuz admin onayı bekliyor. En kısa sürede değerlendirilecek.'}
              </p>
              <Link href={existing.approval_status === 'approved' ? '/klinik/panel' : '/panel'}
                className="inline-flex items-center justify-center w-full py-3 bg-[#10876B] hover:bg-[#0E7559] text-white font-bold rounded-xl transition-colors shadow-md shadow-[#10876B]/30">
                {existing.approval_status === 'approved' ? 'Klinik Paneline Git' : 'Panele Dön'}
              </Link>
            </div>
          </main>
          <Footer />
        </>
      )
    }
  }

  // Başarılı başvuru ekranı (yeni kayıt)
  if (isSuccess) {
    return (
      <>
        <EsteKlinikNav />
        <main className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#10876B]/15 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#10876B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Başvurunuz Alındı</h2>
            <p className="text-slate-600 text-sm mb-2">
              Başvurunuz incelemeye alındı. En kısa sürede değerlendirilecek.
            </p>
            <p className="text-slate-500 text-xs mb-6">
              Hesabınız oluşturuldu. Onay sonrası <strong className="text-slate-700">giriş yaparak</strong> klinik panelinize erişebilirsiniz.
            </p>
            <Link href="/giris"
              className="inline-flex items-center justify-center w-full py-3 bg-[#10876B] hover:bg-[#0E7559] text-white font-bold rounded-xl transition-colors shadow-md shadow-[#10876B]/30">
              Giriş Yap
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <EsteKlinikNav />
      <main className="min-h-screen bg-white">
        {/* Hero şerit */}
        <section className="relative bg-gradient-to-br from-[#064E3B] via-[#0A6347] to-[#053527] overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full opacity-25 blur-3xl"
            style={{ background: 'radial-gradient(circle, #10876B 0%, transparent 70%)' }}
          />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-8">
            <nav className="flex items-center gap-2 text-xs text-emerald-200/70 mb-3">
              <Link href="/esteklinik" className="hover:text-white transition-colors">EsteKlinik</Link>
              <span>·</span>
              <span className="text-white font-semibold">Başvuru</span>
            </nav>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300 mb-2">
              EsteKlinik · Klinik Katılım
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Klinik Olarak Katıl</h1>
            <p className="text-emerald-100/80 text-sm mt-1">Başvurunuz admin onayından sonra aktive edilir</p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <KlinikBasvurForm action={submitApplication} hasError={hasError} errorType={errorType} isLoggedIn={!!user} />
        </div>
      </main>
      <Footer />
    </>
  )
}
