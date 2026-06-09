/**
 * Klinik (EsteKlinikPRO) bildirimleri.
 *
 * Tetikleyiciler:
 *  - notifyClinicNewAppointment(appointmentId) → hasta randevu oluşturduktan sonra
 *  - notifyClinicNewPrivateMessage(reviewId)   → hasta özel mesaj attıktan sonra
 *
 * Hepsi fire-and-forget — başarısızlık UI'yı bloklamaz, console'a yazılır.
 * Email kaynağı: auth.users (clinic.user_id).
 * SMS kaynağı: clinics.phone.
 * Push: clinic.user_id → esteklinikpro flavor token'ları.
 *
 * NOT: order-notifications.ts klinik versiyonu — aynı pattern (mail + sms + push).
 */

import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/notifications'
import { sendInfoSms } from '@/lib/netgsm'
import { sendPushToClinic } from '@/lib/push'

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://estelongy.com').replace(/\/$/, '')
}

function formatDateTimeTR(iso: string): string {
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

// ── Şablon: yeni randevu (klinik) ────────────────────────────────────
function tmplClinicNewAppointment(p: {
  clinicName: string
  patientName: string
  whenLabel: string
  panelUrl: string
}) {
  return {
    subject: `[Estelongy] Yeni Randevu Talebi — ${p.patientName}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;color:#111;padding:0;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="padding:24px;background:linear-gradient(135deg,#10b981,#059669);color:#fff">
          <h1 style="margin:0;font-size:22px">📅 Yeni Randevu Talebi</h1>
          <p style="margin:6px 0 0;opacity:0.9">${p.clinicName}</p>
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 16px">Yeni bir hasta randevu talep etti. Onayını bekliyor.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;background:#f9fafb;border-radius:8px;overflow:hidden">
            <tr><td style="padding:10px 14px;color:#6b7280">Hasta</td><td style="padding:10px 14px;text-align:right;font-weight:600">${p.patientName}</td></tr>
            <tr><td style="padding:10px 14px;color:#6b7280;border-top:1px solid #e5e7eb">Tarih</td><td style="padding:10px 14px;text-align:right;font-weight:700;border-top:1px solid #e5e7eb">${p.whenLabel}</td></tr>
          </table>
          <div style="margin-top:24px;text-align:center">
            <a href="${p.panelUrl}" style="display:inline-block;padding:12px 32px;background:#059669;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Randevuyu Aç →</a>
          </div>
          <p style="margin-top:24px;color:#6b7280;font-size:13px">EsteKlinikPRO panelinden tek dokunuşla onaylayabilir veya reddedebilirsin.</p>
        </div>
      </div>
    `,
  }
}

function smsClinicNewAppointment(p: { patientName: string; whenLabel: string }) {
  // Netgsm Turkce karakter destegi yok — sadeyaz.
  return `Estelongy: Yeni randevu talebi - ${p.patientName.slice(0, 30)} icin ${p.whenLabel}. Panelden onayla.`
}

// ── Tetikleyici: yeni randevu (klinik) ──────────────────────────────
export async function notifyClinicNewAppointment(appointmentId: string): Promise<void> {
  try {
    const admin = createServiceClient()

    // Randevu + klinik + hasta profil
    const { data: appt } = await admin
      .from('appointments')
      .select('id, clinic_id, user_id, appointment_date, clinics(name, user_id, phone), profiles(full_name)')
      .eq('id', appointmentId)
      .single()
    if (!appt) return

    const clinic = appt.clinics as unknown as { name: string; user_id: string; phone: string | null } | null
    if (!clinic) return

    const patientName = (appt.profiles as unknown as { full_name?: string | null } | null)?.full_name ?? 'Hasta'
    const whenLabel = appt.appointment_date ? formatDateTimeTR(appt.appointment_date) : 'Tarih belirlenmedi'
    const panelUrl = `${baseUrl()}/klinik/panel/randevu/${appt.id}`

    // 1) Klinik sahibinin email'i
    const { data: ownerData } = await admin.auth.admin.getUserById(clinic.user_id)
    const clinicEmail = ownerData?.user?.email ?? null

    if (clinicEmail) {
      const { subject, html } = tmplClinicNewAppointment({
        clinicName: clinic.name,
        patientName,
        whenLabel,
        panelUrl,
      })
      await sendEmail(clinicEmail, subject, html)
    }

    // 2) SMS — klinik phone varsa
    if (clinic.phone) {
      await sendInfoSms(clinic.phone, smsClinicNewAppointment({ patientName, whenLabel }))
    }

    // 3) Push — klinik PRO app açıksa
    await sendPushToClinic(clinic.user_id, {
      title: 'Yeni randevu talebi',
      body: `${patientName} — ${whenLabel}`,
      link: `/klinik/panel/randevu/${appt.id}`,
    })
  } catch (e) {
    console.error('[clinic-notifications] notifyClinicNewAppointment exception:', e)
  }
}

// ── Tetikleyici: yeni özel mesaj (klinik) ───────────────────────────
function tmplClinicNewPrivateMessage(p: {
  clinicName: string
  patientName: string
  preview: string
  panelUrl: string
}) {
  return {
    subject: `[Estelongy] Yeni özel mesaj — ${p.patientName}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;color:#111;padding:0;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="padding:24px;background:linear-gradient(135deg,#10b981,#059669);color:#fff">
          <h1 style="margin:0;font-size:22px">✉️ Özel Mesaj</h1>
          <p style="margin:6px 0 0;opacity:0.9">${p.clinicName}</p>
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 12px"><strong>${p.patientName}</strong> sana özel mesaj attı:</p>
          <blockquote style="margin:0;padding:14px 18px;background:#f9fafb;border-left:3px solid #10b981;color:#374151;font-size:14px;border-radius:6px">
            ${p.preview}
          </blockquote>
          <div style="margin-top:24px;text-align:center">
            <a href="${p.panelUrl}" style="display:inline-block;padding:12px 32px;background:#059669;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Mesajı Aç →</a>
          </div>
        </div>
      </div>
    `,
  }
}

function smsClinicNewPrivateMessage(p: { patientName: string }) {
  return `Estelongy: ${p.patientName.slice(0, 30)} sana ozel mesaj atti. Panelden yanitla.`
}

export async function notifyClinicNewPrivateMessage(reviewId: string): Promise<void> {
  try {
    const admin = createServiceClient()
    const { data: review } = await admin
      .from('clinic_reviews')
      .select('id, clinic_id, user_id, iyilestirme_metni, clinics(name, user_id, phone), profiles(full_name)')
      .eq('id', reviewId)
      .single()
    if (!review) return

    const clinic = review.clinics as unknown as { name: string; user_id: string; phone: string | null } | null
    if (!clinic) return

    const patientName = (review.profiles as unknown as { full_name?: string | null } | null)?.full_name ?? 'Hasta'
    const preview = (review.iyilestirme_metni as string | null)?.slice(0, 180) ?? ''
    if (!preview) return

    const panelUrl = `${baseUrl()}/klinik/panel/mesajlar`

    const { data: ownerData } = await admin.auth.admin.getUserById(clinic.user_id)
    const clinicEmail = ownerData?.user?.email ?? null

    if (clinicEmail) {
      const { subject, html } = tmplClinicNewPrivateMessage({
        clinicName: clinic.name,
        patientName,
        preview: escapeHtml(preview),
        panelUrl,
      })
      await sendEmail(clinicEmail, subject, html)
    }

    if (clinic.phone) {
      await sendInfoSms(clinic.phone, smsClinicNewPrivateMessage({ patientName }))
    }

    await sendPushToClinic(clinic.user_id, {
      title: `Özel mesaj — ${patientName}`,
      body: preview.slice(0, 80),
      link: '/klinik/panel/mesajlar',
    })
  } catch (e) {
    console.error('[clinic-notifications] notifyClinicNewPrivateMessage exception:', e)
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
