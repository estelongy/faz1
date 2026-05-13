import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmailDetailed } from '@/lib/notifications'

/**
 * Admin için Postmark test endpoint'i.
 * Admin'in kayıtlı e-postasına test maili gönderir.
 *
 * Güvenlik:
 *  - Auth: admin rolü zorunlu
 *  - Rate limit: yok (admin only, manuel)
 *  - Sadece kendi adresine gönderir (başkasına spam etmek imkansız)
 */
export async function POST(): Promise<Response> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })
  }
  const role = (user.app_metadata as Record<string, string>)?.role
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 })
  }

  // Admin'in gerçek e-postasını service client ile çek
  const admin = createServiceClient()
  const { data: authUser } = await admin.auth.admin.getUserById(user.id)
  const email = authUser?.user?.email ?? user.email
  if (!email) {
    return NextResponse.json({ error: 'Hesabınızda kayıtlı e-posta yok' }, { status: 400 })
  }

  const subject = 'Estelongy E-posta Entegrasyon Testi'
  const html = `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
        <tr><td style="padding:40px 32px;text-align:center;">
          <div style="display:inline-block;padding:12px;background:linear-gradient(135deg,#10b981,#059669);border-radius:12px;margin-bottom:20px;">
            <span style="color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">✓ Test Başarılı</span>
          </div>
          <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 16px;">E-posta altyapısı çalışıyor</h1>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 16px;">
            Bu mail estelongy.com altyapısı üzerinden gönderildi (Resend primary, Postmark fallback).
          </p>
          <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:16px;margin:20px 0;text-align:left;font-family:monospace;font-size:12px;color:#94a3b8;">
            <div><strong style="color:#10b981">From:</strong> ${process.env.FROM_EMAIL ?? 'noreply@estelongy.com'}</div>
            <div><strong style="color:#10b981">To:</strong> ${email}</div>
            <div><strong style="color:#10b981">Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</div>
            <div><strong style="color:#10b981">Stream:</strong> outbound (transactional)</div>
          </div>
          <p style="color:#64748b;font-size:13px;margin-top:24px;">
            Eğer bu maili spam klasöründe görüyorsan, DKIM/SPF doğrulamasında sorun olabilir.<br>
            Inbox'ta görüyorsan deliverability tamam.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const result = await sendEmailDetailed(email, subject, html)

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? 'Gönderilemedi' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    sentTo: email,
    messageId: result.messageId,
    provider: result.provider,
    from: process.env.FROM_EMAIL ?? 'noreply@estelongy.com',
  })
}
