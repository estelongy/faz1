'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface DayState {
  is_active: boolean
  start_time: string
  end_time: string
  slot_duration_minutes: number
}

interface SaveInput {
  clinicId: string
  days: Record<number, DayState>
}

export async function saveMusaitlikAction(
  input: SaveInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }

  // Ownership kontrolü
  const { data: clinic } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', input.clinicId)
    .eq('user_id', user.id)
    .single()
  if (!clinic) return { ok: false, error: 'Klinik bulunamadı' }

  // Her gün için upsert
  const rows = Object.entries(input.days).map(([dayStr, day]) => ({
    clinic_id: input.clinicId,
    day_of_week: parseInt(dayStr, 10),
    start_time: day.start_time,
    end_time: day.end_time,
    slot_duration_minutes: day.slot_duration_minutes,
    is_active: day.is_active,
  }))

  const { error } = await supabase
    .from('clinic_availability')
    .upsert(rows, { onConflict: 'clinic_id,day_of_week' })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/klinik/panel/musaitlik')
  revalidatePath('/randevu')
  return { ok: true }
}
