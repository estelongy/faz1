'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Sonuc = { ok: true; token: string } | { ok: false; error: string }

/**
 * Referansörün kendi davet bağlantısını üretmesi — şifresiz.
 * Kurallar (aylık limit, kontenjan, teklif geçerliliği) Postgres'te;
 * burada yalnızca RPC çağrılır.
 */
export async function uretLinkOnek(onek: string, offerId: string): Promise<Sonuc> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('referral_link_uret_onek', {
    p_onek: onek, p_offer: offerId,
  })
  if (error) return { ok: false, error: error.message }

  const row = Array.isArray(data) ? data[0] as { token?: string } | undefined : null
  if (!row?.token) return { ok: false, error: 'Bağlantı üretilemedi.' }

  revalidatePath(`/tavsiye/${onek}`)
  return { ok: true, token: row.token }
}
