'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * İzleme ilerlemesi kaydet/güncelle.
 * Idempotent — aynı (user_id, video_id) için upsert.
 *
 * `completed` parametresi true ise videoyu tamamlanmış işaretler.
 * watched_seconds artırılır (mevcut + delta), duration'ı geçemez.
 */
export async function updateVideoProgress(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Giriş gerekli.')

  const videoId       = String(formData.get('video_id') ?? '').trim()
  const packageId     = String(formData.get('package_id') ?? '').trim()
  const slug          = String(formData.get('slug') ?? '').trim()
  const completedFlag = String(formData.get('completed') ?? '') === 'true'
  const watchedSec    = Math.max(0, parseInt(String(formData.get('watched_seconds') ?? '0'), 10) || 0)

  if (!videoId || !packageId) throw new Error('Video veya paket ID eksik.')

  // Kullanıcı paketi satın aldı mı?
  const { data: purchase } = await supabase
    .from('course_purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('package_id', packageId)
    .eq('status', 'paid')
    .maybeSingle()
  if (!purchase) throw new Error('Bu paketi satın almadınız.')

  // Video gerçekten bu pakete ait mi?
  const { data: video } = await supabase
    .from('course_videos')
    .select('id, package_id, duration_seconds')
    .eq('id', videoId)
    .eq('package_id', packageId)
    .maybeSingle()
  if (!video) throw new Error('Video bu pakette bulunamadı.')

  const cap = Math.min(watchedSec, video.duration_seconds || watchedSec)

  const { error } = await supabase
    .from('course_progress')
    .upsert({
      user_id: user.id,
      package_id: packageId,
      video_id: videoId,
      watched_seconds: cap,
      completed: completedFlag,
      last_watched_at: new Date().toISOString(),
    }, { onConflict: 'user_id,video_id' })

  if (error) throw new Error(error.message)

  if (slug) {
    revalidatePath(`/panel/kurslarim/${slug}`)
    revalidatePath('/panel/kurslarim')
  }
}
