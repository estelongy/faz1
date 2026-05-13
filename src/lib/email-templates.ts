/**
 * Tek dosyada e-posta şablonları — yan etki yaratmayan saf fonksiyonlar.
 *
 * notifications.ts içinde de bazı şablonlar var (randevu, skor); o tarafı
 * bozmadan yeni güvenlik şablonları burada toplanıyor.
 */

interface FailedLoginPayload {
  email: string
  ip: string
  when: string
}

export function tmplFailedLoginAlert(p: FailedLoginPayload) {
  return {
    subject: '[Estelongy] Hesabınızda Başarısız Giriş Denemesi',
    html: `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
        <tr><td style="padding:40px 32px;">
          <div style="display:inline-block;padding:8px 16px;background:#dc2626;border-radius:8px;margin-bottom:20px;">
            <span style="color:#fff;font-size:13px;font-weight:700;">⚠ Güvenlik Uyarısı</span>
          </div>
          <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 16px;">Hesabınıza yanlış şifreyle giriş denendi</h1>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 16px;">
            Son 24 saat içinde <strong style="color:#fff">${escapeHtml(p.email)}</strong> hesabınız için 3 veya daha fazla başarısız giriş denemesi yapıldı.
          </p>
          <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:16px;margin:20px 0;font-family:monospace;font-size:13px;color:#94a3b8;">
            <div style="margin-bottom:8px;"><strong style="color:#f59e0b">IP:</strong> ${escapeHtml(p.ip)}</div>
            <div><strong style="color:#f59e0b">Zaman:</strong> ${escapeHtml(p.when)}</div>
          </div>
          <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:24px 0 8px;">
            <strong style="color:#fff">Bu denemeler siz yapıyorsanız:</strong> Bu maili görmezden gelin.
          </p>
          <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0 0 24px;">
            <strong style="color:#fff">Siz değilseniz:</strong> Şifrenizi hemen değiştirin ve hesabınıza tekrar girip telefon doğrulamanızı kontrol edin. 10 başarısız deneme olursa IP'miz 15 dakikalığına otomatik bloklanır.
          </p>
          <a href="https://estelongy.com/giris" style="display:inline-block;padding:12px 28px;background:#dc2626;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
            Şifremi Değiştir
          </a>
          <p style="color:#64748b;font-size:12px;margin:32px 0 0;line-height:1.5;">
            Bu bir otomatik güvenlik bildirimidir. Yanıtlamayın.<br>
            Sorularınız için: <a href="mailto:destek@estelongy.com" style="color:#94a3b8;">destek@estelongy.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
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
