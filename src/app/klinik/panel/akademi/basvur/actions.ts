'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function applyForEducator(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const message = (formData.get('message') as string)?.trim()
  if (!message || message.length < 50) {
    throw new Error('Başvuru mesajı en az 50 karakter olmalıdır.')
  }
  if (message.length > 2000) {
    throw new Error('Başvuru mesajı en fazla 2000 karakter olabilir.')
  }

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, approval_status, is_educator, educator_application_status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!clinic) redirect('/esteklinik/basvur')
  if (clinic.approval_status !== 'approved') {
    throw new Error('Klinik onayınız tamamlanmadan eğitmen başvurusu yapamazsınız.')
  }
  if (clinic.is_educator) {
    throw new Error('Zaten eğitmen yetkiniz var.')
  }
  if (clinic.educator_application_status === 'pending') {
    throw new Error('Mevcut bir başvurunuz değerlendiriliyor.')
  }

  const { error } = await supabase
    .from('clinics')
    .update({
      educator_application_status: 'pending',
      educator_application_message: message,
      educator_applied_at: new Date().toISOString(),
      educator_decision_note: null,
      educator_decided_at: null,
    })
    .eq('id', clinic.id)

  if (error) throw new Error(error.message)

  revalidatePath('/klinik/panel/akademi/basvur')
  revalidatePath('/klinik/panel')
  redirect('/klinik/panel/akademi/basvur?status=submitted')
}

export async function withdrawApplication() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, educator_application_status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!clinic || clinic.educator_application_status !== 'pending') {
    throw new Error('Geri çekilecek aktif başvuru yok.')
  }

  await supabase
    .from('clinics')
    .update({
      educator_application_status: 'none',
      educator_applied_at: null,
    })
    .eq('id', clinic.id)

  revalidatePath('/klinik/panel/akademi/basvur')
  revalidatePath('/klinik/panel')
}
