import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyClinicNewAppointment } from '@/lib/clinic-notifications'

/**
 * Randevu oluştur. Oturum açık olmalı — client OTP doğruladıktan sonra buraya post ediyor.
 *
 * Bildirim akışı:
 *   - **Klinik tarafı** (yeni): hasta randevu olusturunca klinige email+SMS+push
 *     ile yeni randevu talebi yollanir (fire-and-forget, notifyClinicNewAppointment).
 *   - Hasta tarafı: klinik kabul edip status='confirmed' yapinca
 *     `appointment_confirmed` + 24h/1h hatirlatma enqueue edilir
 *     (src/app/klinik/panel/page.tsx içindeki action).
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })
    }

    const { clinicId, dateTime, notes } = await req.json()
    if (!clinicId || !dateTime) {
      return NextResponse.json({ error: 'Eksik alan' }, { status: 400 })
    }

    // Klinik randevu kabul modu: auto_confirm true → direkt confirmed, false → pending (klinik onayı bekler)
    const { data: clinicRow } = await supabase
      .from('clinics')
      .select('auto_confirm_appointments')
      .eq('id', clinicId)
      .maybeSingle()
    const initialStatus = clinicRow?.auto_confirm_appointments === false ? 'pending' : 'confirmed'

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        user_id: user.id,
        clinic_id: clinicId,
        appointment_date: dateTime,
        status: initialStatus,
        notes: notes || null,
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Klinik bildirim — fire-and-forget (yanit gecikmesin)
    notifyClinicNewAppointment(data.id).catch(err =>
      console.error('[randevu/create] notifyClinicNewAppointment hata:', err),
    )

    return NextResponse.json({ success: true, appointmentId: data.id })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Hata' },
      { status: 500 },
    )
  }
}
