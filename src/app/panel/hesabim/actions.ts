'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }

  const firstName = (formData.get('firstName') as string ?? '').trim()
  const lastName  = (formData.get('lastName') as string ?? '').trim()
  const birthYearRaw = formData.get('birthYear') as string
  const birthYear = birthYearRaw ? parseInt(birthYearRaw, 10) : null

  if (!firstName || !lastName) return { ok: false, error: 'Ad ve soyad zorunludur' }
  const currentYear = new Date().getFullYear()
  if (birthYear && (isNaN(birthYear) || birthYear < 1900 || birthYear > currentYear - 18)) {
    return { ok: false, error: 'Geçerli bir doğum yılı girin (18+)' }
  }

  const fullName = `${firstName} ${lastName}`
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, ...(birthYear ? { birth_year: birthYear } : {}) })
    .eq('id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/panel/hesabim')
  return { ok: true }
}

export async function deleteAccountAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  // NOT: Gerçek hesap silme için service role gerekiyor — bu basit versiyonda
  // profili pasif yapıp oturumu kapatıyoruz.
  // Tam silme için admin endpoint eklenmeli (Faz 2).
  await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', user.id)

  await supabase.auth.signOut()
  redirect('/?deleted=1')
}
