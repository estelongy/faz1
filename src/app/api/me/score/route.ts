import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Oturumlu kullanıcının en güncel Gençlik Skoru — AppHome halkasını
 * doldurmak için. Skor yoksa (anonim ya da hiç analiz yapmamış) null döner;
 * AppHome o durumda "?" davet ekranını gösterir. Sahte skor YOK.
 *
 * Kaynak: analyses.final_overall ?? temp_overall ?? web_overall (0–100).
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      return NextResponse.json({ score: null, loggedIn: false })
    }

    const { data: latest } = await supabase
      .from('analyses')
      .select('web_overall, temp_overall, final_overall, status')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const raw =
      latest?.final_overall ?? latest?.temp_overall ?? latest?.web_overall ?? null
    const score = typeof raw === 'number' ? Math.round(raw) : null

    return NextResponse.json({
      score,
      status: latest?.status ?? null,
      loggedIn: true,
    })
  } catch {
    return NextResponse.json({ score: null, loggedIn: false })
  }
}
