import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Randevu oluştur. Oturum açık olmalı — client OTP doğruladıktan sonra buraya post ediyor.
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

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        user_id: user.id,
        clinic_id: clinicId,
        appointment_date: dateTime,
        status: 'pending',
        notes: notes || null,
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: true, appointmentId: data.id })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Hata' },
      { status: 500 },
    )
  }
}
