'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // Logout sonrası anasayfaya — zorla giriş ekranına atmak yerine kullanıcıyı serbest bırak.
  // Tekrar girmek isterse Giriş butonu (SafeLink) galaksi-bilinçli yönlendirir.
  redirect('/')
}
