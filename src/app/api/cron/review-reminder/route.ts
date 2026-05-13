import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/notifications'
import { sendInfoSms } from '@/lib/netgsm'

/**
 * Klinik deneyim yorumu hatırlatma cron — günlük 09:30
 *
 * Tetikleyici: appointment.status='completed' AND completed_at <= (now - 6h)
 * AND review_reminder_sent_at IS NULL AND henüz clinic_reviews kaydı yok.
 *
 * Hem e-posta hem SMS gönderir (telefon doğrulanmışsa).
 * Gönderim sonrası appointment.review_reminder_sent_at set edilir.
 *
 * Cron secret: header `x-cron-secret`.
 */
export async function GET(req: NextRequest) {
  // Vercel cron 'Authorization: Bearer <secret>' gonderir; manuel tetikleme icin 'x-cron-secret' de kabul edilir
  const authHeader = req.headers.get('authorization')
  const customHeader = req.headers.get('x-cron-secret')
  const expected = process.env.CRON_SECRET
  if (expected) {
    const bearerOk = authHeader === `Bearer ${expected}`
    const customOk = customHeader === expected
    if (!bearerOk && !customOk) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createServiceClient()

  try {
    const cutoffTop = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()      // 6h önce
    const cutoffBottom = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 gün önce (eskileri atla)

    // Hatırlatma gönderilecek appointment'lar (max 50/çalıştırma)
    const { data: appts, error } = await admin
      .from('appointments')
      .select(`
        id, user_id, completed_at,
        clinics:clinic_id (id, name)
      `)
      .eq('status', 'completed')
      .is('review_reminder_sent_at', null)
      .lte('completed_at', cutoffTop)
      .gte('completed_at', cutoffBottom)
      .limit(50)

    if (error) throw error
    if (!appts || appts.length === 0) {
      return NextResponse.json({ ok: true, processed: 0 })
    }

    // Mevcut yorumları kontrol et — kullanıcı zaten yazmışsa atla
    const apptIds = appts.map(a => a.id)
    const { data: existingReviews } = await admin
      .from('clinic_reviews')
      .select('appointment_id')
      .in('appointment_id', apptIds)
    const reviewedSet = new Set((existingReviews ?? []).map(r => r.appointment_id))

    let sent = 0
    let skipped = 0

    for (const a of appts) {
      if (reviewedSet.has(a.id)) {
        // Zaten yorum yapmış → marker set, atla
        await admin
          .from('appointments')
          .update({ review_reminder_sent_at: new Date().toISOString() })
          .eq('id', a.id)
        skipped++
        continue
      }

      // Kullanıcı bilgileri
      const { data: ud } = await admin.auth.admin.getUserById(a.user_id as string)
      const email = ud?.user?.email ?? null
      const authPhone = ud?.user?.phone ?? null

      let phone: string | null = authPhone
      let fullName: string = 'Hasta'
      if (a.user_id) {
        const { data: prof } = await admin
          .from('profiles')
          .select('phone, phone_verified, full_name')
          .eq('id', a.user_id)
          .maybeSingle()
        if (prof?.phone_verified && prof.phone) phone = prof.phone
        if (prof?.full_name) fullName = prof.full_name
      }

      const clinic = a.clinics as unknown as { id: string; name: string } | null
      const clinicName = clinic?.name ?? 'klinik'
      const reviewLink = `https://estelongy.com/panel/degerlendir/${a.id}`

      // E-posta
      if (email) {
        const html = renderReviewReminderEmail({
          patientName: fullName.split(' ')[0] || 'Estelongy Kullanıcısı',
          clinicName,
          reviewLink,
        })
        await sendEmail(email, `${clinicName} deneyimini paylaş — Estelongy`, html)
      }

      // SMS
      if (phone) {
        const msg = `Estelongy: ${clinicName} ziyaretin nasıl gecti? 1 dk'da degerlendir, klinik EGP'sine katki sun. ${reviewLink}`
        await sendInfoSms(phone, msg)
      }

      // Marker set
      await admin
        .from('appointments')
        .update({ review_reminder_sent_at: new Date().toISOString() })
        .eq('id', a.id)

      sent++
    }

    return NextResponse.json({ ok: true, processed: appts.length, sent, skipped })
  } catch (err) {
    console.error('[review-reminder] error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

function renderReviewReminderEmail(args: {
  patientName: string
  clinicName: string
  reviewLink: string
}): string {
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;">
      <div style="background:linear-gradient(135deg,#10b981,#0d9488);padding:24px;border-radius:16px 16px 0 0;">
        <h1 style="color:white;margin:0;font-size:22px;">Deneyimini paylaşır mısın?</h1>
      </div>
      <div style="background:#1e293b;padding:24px;border-radius:0 0 16px 16px;">
        <p style="margin:0 0 16px 0;line-height:1.6;">Merhaba ${args.patientName},</p>
        <p style="margin:0 0 16px 0;line-height:1.6;">
          <strong>${args.clinicName}</strong> ziyaretin için Estelongy'ye 1 dakikalık değerlendirme yazar mısın?
          Yorumun klinik EGP'sine katkı sunar ve diğer Estelongy kullanıcılarına yol gösterir.
        </p>
        <p style="margin:0 0 24px 0;line-height:1.6;color:#94a3b8;font-size:13px;">
          4 boyut + tavsiye eğilimi + serbest yorum. İstersen anonim yayınlayabilirsin.
          7 gün boyunca düzenleme penceren açık kalır.
        </p>
        <a href="${args.reviewLink}" style="display:inline-block;background:#10b981;color:white;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:600;">
          Değerlendirmeyi Aç →
        </a>
        <p style="margin:24px 0 0 0;color:#64748b;font-size:11px;line-height:1.5;">
          Estelongy ölçüm platformu — hekim sanatı puanlanmaz, sonucu sistem ölçer.<br/>
          Bu maili istemiyorsan panelden bildirim tercihlerini değiştirebilirsin.
        </p>
      </div>
    </div>
  `
}
