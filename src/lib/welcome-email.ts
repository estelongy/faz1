/**
 * Rol bazlı "hoş geldiniz" maili.
 * Kullanıcıya panel linki, klinik'e klinik panel linki, vendor'a satıcı panel linki.
 */
import { sendEmail } from './notifications'

export type WelcomeRole = 'user' | 'clinic' | 'vendor'

interface Opts {
  to: string
  firstName: string
  role: WelcomeRole
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://estelongy-clean.vercel.app'

const ROLE_META: Record<WelcomeRole, { subject: string; heading: string; body: string; ctaLabel: string; ctaPath: string }> = {
  user: {
    subject: 'Estelongy\'ye Hoş Geldiniz 💜',
    heading: 'Gençlik yolculuğunuz başlıyor',
    body: 'Artık cilt analizleri yapabilir, Gençlik Skorunuzu takip edebilir, randevu alıp ürün satın alabilirsiniz.',
    ctaLabel: 'Panelime Git',
    ctaPath: '/panel',
  },
  clinic: {
    subject: 'Klinik Başvurunuz Onaylandı — Estelongy\'ye Hoş Geldiniz 🎉',
    heading: 'Kliniğiniz aktif',
    body: 'Klinik başvurunuz Estelongy ekibi tarafından onaylandı. Artık klinik panelinize erişebilir, hasta randevularınızı yönetebilir ve Estelongy platformunda hizmet vermeye başlayabilirsiniz. Hoş geldiniz!',
    ctaLabel: 'Klinik Panelime Git',
    ctaPath: '/klinik/panel',
  },
  vendor: {
    subject: 'Satıcı Başvurunuz Onaylandı — Estelongy\'ye Hoş Geldiniz 🎉',
    heading: 'Satıcı hesabınız aktif',
    body: 'Satıcı başvurunuz Estelongy ekibi tarafından onaylandı. Artık satıcı panelinize erişebilir, ürünlerinizi yükleyebilir ve siparişleri yönetmeye başlayabilirsiniz. Hoş geldiniz!',
    ctaLabel: 'Satıcı Panelime Git',
    ctaPath: '/satici/panel',
  },
}

export async function sendWelcomeEmail({ to, firstName, role }: Opts): Promise<boolean> {
  const m = ROLE_META[role]
  const ctaUrl = `${APP_URL}${m.ctaPath}`

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${m.subject}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
          <tr>
            <td style="padding:40px 32px 24px;text-align:center;">
              <div style="display:inline-block;padding:12px;background:linear-gradient(135deg,#8b5cf6,#a855f7);border-radius:12px;margin-bottom:20px;">
                <span style="color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">✨ Estelongy</span>
              </div>
              <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 8px;">Merhaba ${firstName},</h1>
              <h2 style="color:#a78bfa;font-size:18px;font-weight:600;margin:0 0 16px;">${m.heading}</h2>
              <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 28px;">${m.body}</p>
              <a href="${ctaUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#8b5cf6,#a855f7);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;">
                ${m.ctaLabel} →
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 32px;border-top:1px solid #334155;text-align:center;">
              <p style="color:#64748b;font-size:12px;margin:0;line-height:1.5;">
                Bu e-posta Estelongy Gençlik Skoru platformundan otomatik olarak gönderilmiştir.<br>
                <a href="${APP_URL}" style="color:#8b5cf6;text-decoration:none;">estelongy.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return sendEmail(to, m.subject, html)
}
