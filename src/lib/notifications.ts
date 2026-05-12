/**
 * Bildirim altyapısı — tek kaynak
 * notification_queue tablosuna yazma + e-posta gönderme
 *
 * Sağlayıcı önceliği:
 *   1) RESEND_API_KEY varsa → Resend (primary)
 *   2) Başarısızsa veya yoksa → POSTMARK_API_TOKEN (fallback)
 *   3) İkisi de yoksa → sessiz atla
 */

import { createServiceClient } from '@/lib/supabase/service'

// ── E-posta gönderici ─────────────────────────────────────────────────
export interface SendEmailResult {
  ok: boolean
  /** Sağlayıcı message ID — Activity/Logs'ta aramak için */
  messageId?: string
  /** Hangi sağlayıcı başardı: 'resend' | 'postmark' */
  provider?: 'resend' | 'postmark'
  error?: string
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const res = await sendEmailDetailed(to, subject, html)
  return res.ok
}

export async function sendEmailDetailed(
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  const resendKey = process.env.RESEND_API_KEY
  const postmarkToken = process.env.POSTMARK_API_TOKEN
  const from = process.env.FROM_EMAIL ?? 'noreply@estelongy.com'

  // 1) Resend (primary)
  if (resendKey) {
    const r = await sendViaResend({ apiKey: resendKey, from, to, subject, html })
    if (r.ok) return r
    console.warn('[notifications] Resend başarısız, Postmark fallback denenecek:', r.error)
  }

  // 2) Postmark (fallback — veya Resend yoksa primary)
  if (postmarkToken) {
    return sendViaPostmark({ token: postmarkToken, from, to, subject, html })
  }

  // 3) İkisi de yok
  console.warn('[notifications] RESEND_API_KEY ve POSTMARK_API_TOKEN eksik, e-posta atlandı')
  return { ok: false, error: 'E-posta sağlayıcı yapılandırılmamış' }
}

// ── Resend ────────────────────────────────────────────────────────────
async function sendViaResend(args: {
  apiKey: string; from: string; to: string; subject: string; html: string
}): Promise<SendEmailResult> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${args.apiKey}`,
      },
      body: JSON.stringify({
        from: args.from,
        to: [args.to],
        subject: args.subject,
        html: args.html,
      }),
    })

    const data = (await res.json().catch(() => ({}))) as {
      id?: string
      statusCode?: number
      name?: string
      message?: string
    }

    if (!res.ok) {
      const errMsg = `Resend ${res.status}: ${data.message ?? data.name ?? 'Bilinmeyen hata'}`
      return { ok: false, provider: 'resend', error: errMsg }
    }

    return { ok: true, provider: 'resend', messageId: data.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, provider: 'resend', error: `Resend exception: ${msg}` }
  }
}

// ── Postmark (fallback — orijinal davranış, hiç değişmedi) ────────────
async function sendViaPostmark(args: {
  token: string; from: string; to: string; subject: string; html: string
}): Promise<SendEmailResult> {
  try {
    const res = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': args.token,
      },
      body: JSON.stringify({
        From: args.from,
        To: args.to,
        Subject: args.subject,
        HtmlBody: args.html,
        MessageStream: 'outbound',
      }),
    })

    const data = (await res.json().catch(() => ({}))) as {
      MessageID?: string
      ErrorCode?: number
      Message?: string
    }

    if (!res.ok) {
      const errMsg = `Postmark ${res.status}${data.ErrorCode ? ` [${data.ErrorCode}]` : ''}: ${data.Message ?? 'Bilinmeyen hata'}`
      console.error('[notifications] Postmark hatası:', errMsg)
      return { ok: false, provider: 'postmark', error: errMsg }
    }

    return { ok: true, provider: 'postmark', messageId: data.MessageID }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[notifications] Postmark exception:', msg)
    return { ok: false, provider: 'postmark', error: msg }
  }
}

// ── Kuyruğa ekle ──────────────────────────────────────────────────────
interface EnqueueOpts {
  userId?: string
  type: string
  channel?: 'email' | 'sms' | 'push'
  payload: Record<string, unknown>
  scheduledAt?: Date
}

export async function enqueueNotification(opts: EnqueueOpts): Promise<void> {
  const admin = createServiceClient()
  await admin.from('notification_queue').insert({
    user_id:      opts.userId ?? null,
    type:         opts.type,
    channel:      opts.channel ?? 'email',
    payload:      opts.payload,
    scheduled_at: opts.scheduledAt?.toISOString() ?? new Date().toISOString(),
    status:       'pending',
  })
}

// ── E-posta şablonları ────────────────────────────────────────────────
export function tmplAppointmentConfirmed(payload: {
  patientName: string
  clinicName: string
  date: string
}) {
  return {
    subject: `[Estelongy] Randevunuz Onaylandı — ${payload.clinicName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:16px">
        <div style="margin-bottom:24px">
          <span style="font-weight:900;font-size:22px;background:linear-gradient(90deg,#7c3aed,#9333ea);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Estelongy</span>
        </div>
        <h2 style="color:#fff;margin:0 0 8px">Randevunuz Onaylandı ✓</h2>
        <p style="color:#94a3b8;margin:0 0 24px">Merhaba ${payload.patientName},</p>
        <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 8px"><strong style="color:#7c3aed">Klinik:</strong> <span style="color:#fff">${payload.clinicName}</span></p>
          <p style="margin:0"><strong style="color:#7c3aed">Tarih:</strong> <span style="color:#fff">${payload.date}</span></p>
        </div>
        <p style="color:#64748b;font-size:14px">Randevunuzu iptal etmek veya yönetmek için panele giriş yapın.</p>
        <a href="https://estelongy-clean.vercel.app/panel" style="display:inline-block;margin-top:16px;padding:12px 28px;background:linear-gradient(90deg,#7c3aed,#9333ea);color:#fff;border-radius:10px;text-decoration:none;font-weight:700">Panele Git →</a>
      </div>
    `,
  }
}

export function tmplAppointmentReminder(payload: {
  patientName: string
  clinicName: string
  date: string
  hoursLeft: number
}) {
  const timeLabel = payload.hoursLeft <= 1 ? '1 saat' : '24 saat'
  return {
    subject: `[Estelongy] Randevunuzu Unutmayın — ${timeLabel} kaldı`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:16px">
        <div style="margin-bottom:24px">
          <span style="font-weight:900;font-size:22px;background:linear-gradient(90deg,#7c3aed,#9333ea);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Estelongy</span>
        </div>
        <h2 style="color:#fff;margin:0 0 8px">⏰ Randevunuza ${timeLabel} kaldı</h2>
        <p style="color:#94a3b8;margin:0 0 24px">Merhaba ${payload.patientName},</p>
        <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 8px"><strong style="color:#f59e0b">Klinik:</strong> <span style="color:#fff">${payload.clinicName}</span></p>
          <p style="margin:0"><strong style="color:#f59e0b">Tarih:</strong> <span style="color:#fff">${payload.date}</span></p>
        </div>
        <a href="https://estelongy-clean.vercel.app/panel" style="display:inline-block;margin-top:16px;padding:12px 28px;background:linear-gradient(90deg,#f59e0b,#d97706);color:#fff;border-radius:10px;text-decoration:none;font-weight:700">Panele Git →</a>
      </div>
    `,
  }
}

export function tmplScoreUpdate(payload: {
  patientName: string
  score: number
  scoreType: 'on_analiz' | 'klinik_onayli'
}) {
  const isKlinik = payload.scoreType === 'klinik_onayli'
  const colorMap = (s: number) => s >= 90 ? '#00d4ff' : s >= 75 ? '#22c55e' : s >= 50 ? '#f59e0b' : '#ef4444'
  return {
    subject: isKlinik
      ? `[Estelongy] Klinik Onaylı Gençlik Skorunuz: ${payload.score}`
      : `[Estelongy] Ön Analiz Gençlik Skorunuz: ${payload.score}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:16px">
        <div style="margin-bottom:24px">
          <span style="font-weight:900;font-size:22px;background:linear-gradient(90deg,#7c3aed,#9333ea);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Estelongy</span>
        </div>
        <h2 style="color:#fff;margin:0 0 8px">${isKlinik ? '✦ Klinik Onaylı Gençlik Skorunuz' : 'Ön Analiz Gençlik Skorunuz'}</h2>
        <p style="color:#94a3b8;margin:0 0 24px">Merhaba ${payload.patientName},</p>
        <div style="text-align:center;padding:32px;background:#1e293b;border-radius:16px;margin-bottom:24px">
          <div style="font-size:72px;font-weight:900;color:${colorMap(payload.score)}">${payload.score}</div>
          <div style="color:#64748b;font-size:14px;margin-top:4px">${isKlinik ? 'Klinik Onaylı Gençlik Skoru' : 'Ön Analiz Gençlik Skoru'}</div>
        </div>
        <a href="https://estelongy-clean.vercel.app/panel" style="display:inline-block;padding:12px 28px;background:linear-gradient(90deg,#7c3aed,#9333ea);color:#fff;border-radius:10px;text-decoration:none;font-weight:700">Detayları Gör →</a>
      </div>
    `,
  }
}

// ── SMS şablonları (Netgsm — Türkçe karaktersiz, max 155 char) ─────────
export function smsAppointmentConfirmed(p: { clinicName: string; date: string }) {
  return `Estelongy: Randevunuz onaylandi. ${p.clinicName} - ${p.date}. Detay: estelongy.com/panel`
}

export function smsAppointmentReminder(p: { clinicName: string; date: string; hoursLeft: number }) {
  const t = p.hoursLeft <= 1 ? '1 saat' : '24 saat'
  return `Estelongy hatirlatma: ${t} sonra ${p.clinicName} randevunuz var (${p.date}). Detay: estelongy.com/panel`
}

export function smsScoreUpdate(p: { score: number; scoreType: 'on_analiz' | 'klinik_onayli' }) {
  const label = p.scoreType === 'klinik_onayli' ? 'Klinik Onayli' : 'On Analiz'
  return `Estelongy: ${label} Genclik Skorunuz ${p.score}. Detay: estelongy.com/panel`
}
