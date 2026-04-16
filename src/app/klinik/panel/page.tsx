export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

interface Appointment {
  id: string
  appointment_date: string | null
  status: AppointmentStatus
  profiles: { full_name: string | null; email: string | null } | null
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandı',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
}

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

async function handleSignOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/giris')
}

export default async function KlinikPanelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  // Kullanıcının klinik kaydını çek
  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Klinik yoksa oluşturma sayfasına yönlendir
  // (Geliştirme aşamasında null clinic için mock data ile devam et)

  // Randevuları çek
  const { data: appointments } = clinic
    ? await supabase
        .from('appointments')
        .select('id, appointment_date, status, profiles(full_name, email)')
        .eq('clinic_id', clinic.id)
        .order('appointment_date', { ascending: true })
        .limit(50)
    : { data: [] }

  // İstatistikler
  const totalAppointments = appointments?.length ?? 0
  const appts = (appointments ?? []) as unknown as Appointment[]
  const pendingCount = appts.filter(a => a.status === 'pending').length
  const confirmedCount = appts.filter(a => a.status === 'confirmed').length
  const completedCount = appts.filter(a => a.status === 'completed').length

  // Bugünkü randevular
  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = appts.filter(a => a.appointment_date?.startsWith(today))

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <span className="text-white font-bold text-sm">
                  {clinic?.name ?? 'Klinik Paneli'}
                </span>
                <p className="text-slate-500 text-xs">Estelongy</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm hidden sm:block">{user.email}</span>
              <form action={handleSignOut}>
                <button type="submit" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Çıkış
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Başlık */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Klinik Paneli
          </h1>
          <p className="text-slate-400 mt-1">
            {clinic?.name ?? 'Kliniğiniz'} — randevu ve hasta yönetimi
          </p>
        </div>

        {/* İstatistik kartları */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Toplam Randevu', value: totalAppointments, color: 'from-violet-500 to-purple-600', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )},
            { label: 'Bekleyen', value: pendingCount, color: 'from-amber-500 to-orange-600', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )},
            { label: 'Onaylanan', value: confirmedCount, color: 'from-blue-500 to-cyan-600', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )},
            { label: 'Tamamlanan', value: completedCount, color: 'from-emerald-500 to-teal-600', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )},
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700 backdrop-blur-sm">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-3`}>
                {icon}
              </div>
              <div className="text-3xl font-bold text-white mb-0.5">{value}</div>
              <div className="text-slate-500 text-sm">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bugünkü randevular */}
          <div className="lg:col-span-1 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Bugün
              {todayAppointments.length > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  {todayAppointments.length}
                </span>
              )}
            </h2>
            {todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map((apt: Appointment) => (
                  <div key={apt.id} className="p-3 bg-slate-900/50 rounded-xl">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-white text-sm font-medium">
                          {apt.profiles?.full_name ?? 'Hasta'}
                        </div>
                        <div className="text-slate-500 text-xs mt-0.5">
                          {apt.profiles?.email}
                        </div>
                        <div className="text-slate-400 text-xs mt-1">
                          {apt.appointment_date
                            ? new Date(apt.appointment_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${STATUS_COLOR[apt.status as AppointmentStatus] ?? STATUS_COLOR.pending}`}>
                        {STATUS_LABEL[apt.status as AppointmentStatus] ?? apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm">Bugün randevu yok</p>
              </div>
            )}
          </div>

          {/* Tüm randevular listesi */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Tüm Randevular</h2>
            </div>
            {appts.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {appts.map((apt: Appointment) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl hover:bg-slate-900/80 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center shrink-0">
                        <span className="text-violet-400 text-sm font-bold">
                          {(apt.profiles?.full_name ?? apt.profiles?.email ?? '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-white text-sm font-medium truncate">
                          {apt.profiles?.full_name ?? 'Hasta'}
                        </div>
                        <div className="text-slate-500 text-xs truncate">{apt.profiles?.email}</div>
                        <div className="text-slate-400 text-xs mt-0.5">
                          {apt.appointment_date
                            ? new Date(apt.appointment_date).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full shrink-0 ml-2 ${STATUS_COLOR[apt.status as AppointmentStatus] ?? STATUS_COLOR.pending}`}>
                      {STATUS_LABEL[apt.status as AppointmentStatus] ?? apt.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-slate-400 font-medium mb-1">Henüz randevu yok</p>
                <p className="text-slate-600 text-sm">Hastalar randevu aldığında burada görünecek.</p>
              </div>
            )}
          </div>
        </div>

        {/* Klinik kaydı yoksa bilgi kartı */}
        {!clinic && (
          <div className="mt-6 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-amber-400 font-bold mb-1">Klinik kaydı bulunamadı</h3>
                <p className="text-slate-400 text-sm">
                  Bu hesaba bağlı bir klinik kaydı yok. Klinik oluşturmak veya mevcut bir kliniğe bağlanmak için
                  destek ekibiyle iletişime geçin.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hızlı bağlantılar */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { href: '/panel', label: 'Kullanıcı Paneli', icon: '👤' },
            { href: '/analiz', label: 'Yeni Analiz', icon: '🔬' },
            { href: '/randevu', label: 'Randevu Al', icon: '📅' },
          ].map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white transition-all text-sm"
            >
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
