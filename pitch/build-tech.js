// Estelongy — Technical / CTO Deep-Dive Deck (özellik-yoğun)
const PptxGenJS = require('pptxgenjs');
const pres = new PptxGenJS();
pres.layout = 'LAYOUT_WIDE';

const NAVY  = '1E3A8A';
const GOLD  = 'D97706';
const GREEN = '059669';
const RED   = 'DC2626';
const WHITE = 'FFFFFF';
const INK   = '0F172A';
const MUTED = '64748B';
const BG    = 'F8FAFC';
const LINE  = 'E2E8F0';
const CODE_BG = '0F172A';
const CODE_TXT = 'E2E8F0';

const HFONT = 'Georgia';
const BFONT = 'Calibri';
const MONO  = 'Consolas';

let SLIDE_N = 0;

function footer(slide) {
  SLIDE_N += 1;
  slide.addShape('rect', { x: 0, y: 7.3, w: 13.333, h: 0.2, fill: { color: NAVY }, line: { color: NAVY } });
  slide.addShape('rect', { x: 0, y: 7.3, w: 4.4, h: 0.2, fill: { color: GREEN }, line: { color: GREEN } });
  slide.addText('ESTELONGY  ·  Teknik Mimari Sunumu  ·  CTO Brifingi', {
    x: 0.4, y: 7.0, w: 9, h: 0.25, fontSize: 9, fontFace: BFONT, color: MUTED,
  });
  slide.addText(String(SLIDE_N).padStart(2, '0'), {
    x: 12.6, y: 7.0, w: 0.6, h: 0.25, fontSize: 9, fontFace: BFONT, color: MUTED, align: 'right', bold: true,
  });
}

function titleBlock(slide, eyebrow, title) {
  slide.addText(eyebrow.toUpperCase(), {
    x: 0.6, y: 0.45, w: 12, h: 0.3,
    fontSize: 11, fontFace: BFONT, color: GREEN, bold: true, charSpacing: 4,
  });
  slide.addText(title, {
    x: 0.6, y: 0.75, w: 12, h: 0.9,
    fontSize: 30, fontFace: HFONT, color: INK, bold: true,
  });
}

/* ───────── 1. COVER ───────── */
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addShape('rect', { x: 0, y: 0, w: 0.35, h: 7.5, fill: { color: GREEN }, line: { color: GREEN } });
  s.addShape('rect', { x: 0.35, y: 0, w: 0.05, h: 7.5, fill: { color: GOLD }, line: { color: GOLD } });
  s.addText('ESTELONGY  ·  TEKNİK MİMARİ', {
    x: 1.0, y: 2.3, w: 11, h: 0.5,
    fontSize: 14, fontFace: BFONT, color: GREEN, bold: true, charSpacing: 8,
  });
  s.addText('İnce, hızlı,\nölçeklenebilir.', {
    x: 1.0, y: 2.85, w: 11, h: 2.0,
    fontSize: 60, fontFace: HFONT, color: WHITE, bold: true,
  });
  s.addText('120+ aktif modül · 14 RLS-korumalı tablo · 3 panel · üretimde.', {
    x: 1.0, y: 4.95, w: 11, h: 0.5,
    fontSize: 18, fontFace: BFONT, color: 'CBD5E1', italic: true,
  });
  s.addText('CTO Deep-Dive  ·  Mayıs 2026', {
    x: 1.0, y: 6.6, w: 6, h: 0.35,
    fontSize: 11, fontFace: BFONT, color: 'CBD5E1', charSpacing: 4,
  });
  s.addText('Hazırlayan: Baş Mimar Ofisi', {
    x: 7, y: 6.6, w: 5.8, h: 0.35,
    fontSize: 11, fontFace: BFONT, color: 'CBD5E1', align: 'right',
  });
  SLIDE_N += 1;
}

/* ───────── 2. STACK SNAPSHOT ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Genel bakış', 'Tek bir teknoloji kararı — hızlı iterasyon.');
  const tech = [
    { c: NAVY,  t: 'Frontend',   k: 'Next.js 14 App Router', d: 'React Server Components, Edge runtime, TypeScript strict' },
    { c: GOLD,  t: 'Backend',    k: 'Supabase + Postgres 17', d: 'RLS, row-level auth, Storage, Realtime, Edge Functions' },
    { c: GREEN, t: 'Hosting',    k: 'Vercel',                 d: 'Edge network, otomatik CI/CD, preview deployments' },
    { c: NAVY,  t: 'Ödeme',      k: 'Stripe Checkout + Connect', d: 'Webhook-driven mutasyon, multi-vendor split' },
    { c: GOLD,  t: 'Mail/SMS',   k: 'Resend · Postmark · Netgsm', d: 'Çift sağlayıcılı email (failover) + TR SMS' },
    { c: GREEN, t: 'Rate Limit', k: 'Upstash Redis',          d: 'IP + user bazlı koruma, lockout, sliding window' },
  ];
  tech.forEach((t, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.6 + col * 4.15, y = 2.0 + row * 2.5;
    s.addShape('rect', { x, y, w: 3.9, h: 2.25, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x, y, w: 3.9, h: 0.45, fill: { color: t.c }, line: { color: t.c } });
    s.addText(t.t.toUpperCase(), { x: x + 0.2, y: y + 0.04, w: 3.6, h: 0.35, fontSize: 11, fontFace: BFONT, color: WHITE, bold: true, charSpacing: 3, valign: 'middle' });
    s.addText(t.k, { x: x + 0.2, y: y + 0.6, w: 3.6, h: 0.55, fontSize: 18, fontFace: HFONT, color: INK, bold: true });
    s.addText(t.d, { x: x + 0.2, y: y + 1.2, w: 3.5, h: 0.95, fontSize: 11, fontFace: BFONT, color: MUTED });
  });
  footer(s);
}

/* ───────── 3. FEATURE MAP — KLİNİK PANEL ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Özellikler · Klinik paneli', '15 modül — klinik tek panelden yönetilir.');

  const mods = [
    { c: GOLD,  t: 'Randevu',       d: '/randevu · /randevular · /takvim — takvim görünümü, drag-drop, çakışma kontrolü' },
    { c: GOLD,  t: 'Hastalar',      d: '/hastalarim · /hasta — hasta dosyası, notlar, tedavi geçmişi' },
    { c: GOLD,  t: 'Muhasebe',      d: '/muhasebe — günlük yekün, tedavi kataloğu, tahsilat, EGP raporlama' },
    { c: GREEN, t: 'Kredi',         d: '/kredi — Stripe Checkout, paket alımı, otomatik webhook → bakiye' },
    { c: GREEN, t: 'Müsaitlik',     d: '/musaitlik — haftalık slot tanımı, mola, izin günü' },
    { c: GREEN, t: 'Pazarlama',     d: '/pazarlama — kupon, kampanya, paylaş bağlantısı, QR' },
    { c: NAVY,  t: 'Mesajlar',      d: '/mesajlar — hasta DM, klinik bildirim, okundu işareti' },
    { c: NAVY,  t: 'Yorumlar',      d: '/yorumlar — yorum yanıtlama, moderasyon talebi' },
    { c: NAVY,  t: 'Rapor',         d: '/rapor — performans, gelir, randevu KPI dashboard' },
    { c: GOLD,  t: 'Akademi',       d: '/akademi — kurs satışı, hekim eğitim sertifikasyon' },
    { c: GOLD,  t: 'Topluluk',      d: '/topluluk — klinikler arası bilgi paylaşımı (forum)' },
    { c: GREEN, t: 'Destek',        d: '/destek — ticket sistemi, SLA takibi' },
    { c: GREEN, t: 'Profil',        d: '/profil — klinik kartı, fotoğraf, hizmet listesi' },
    { c: NAVY,  t: 'Onboarding',    d: '/klinik/basvur — başvuru → admin onay → KYC akışı' },
    { c: NAVY,  t: 'Müşteri EGP',   d: 'Cron: clinic-egp.skor günlük hesap, public klinik kartı' },
  ];
  // 5x3 grid
  mods.forEach((m, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = 0.5 + col * 2.5;
    const y = 1.95 + row * 1.65;
    s.addShape('rect', { x, y, w: 2.4, h: 1.55, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x, y, w: 2.4, h: 0.08, fill: { color: m.c }, line: { color: m.c } });
    s.addText(m.t, { x: x + 0.12, y: y + 0.15, w: 2.2, h: 0.35, fontSize: 13, fontFace: HFONT, color: INK, bold: true });
    s.addText(m.d, { x: x + 0.12, y: y + 0.5, w: 2.2, h: 1.0, fontSize: 9, fontFace: BFONT, color: MUTED });
  });
  footer(s);
}

/* ───────── 4. FEATURE MAP — HASTA + MARKETPLACE ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Özellikler · Hasta + Marketplace', 'Tüketici tarafı — keşiften ödemeye.');

  // Two columns
  // Left: Hasta panel
  s.addText('HASTA PANELİ', { x: 0.6, y: 1.95, w: 4, h: 0.3, fontSize: 12, fontFace: BFONT, color: GOLD, bold: true, charSpacing: 4 });
  const hasta = [
    { t: 'Randevularım',   d: '/panel/randevularim — geçmiş + planlı, iptal/erteleme' },
    { t: 'Analizlerim',    d: '/panel/analizlerim · /analiz — AI cilt analizi sonuçları' },
    { t: 'Kurslarım',      d: '/panel/kurslarim — Akademi satın alınan içerikler' },
    { t: 'Siparişlerim',   d: '/panel/siparislerim — Marketplace + iade akışı' },
    { t: 'Değerlendirme',  d: '/panel/degerlendir — tedavi sonrası 7. gün hatırlatma cron' },
    { t: 'Referral',       d: '/panel/referral + /r/[code] — kod paylaşım, puan' },
    { t: 'Adresler',       d: '/panel/adreslerim — fatura + teslimat' },
    { t: 'Hesap',          d: '/panel/hesabim — KVKK hak yönetimi, hesap silme cascade' },
  ];
  hasta.forEach((h, i) => {
    const y = 2.4 + i * 0.6;
    s.addShape('rect', { x: 0.6, y, w: 6.1, h: 0.5, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x: 0.6, y, w: 0.1, h: 0.5, fill: { color: GOLD }, line: { color: GOLD } });
    s.addText(h.t, { x: 0.85, y: y + 0.05, w: 1.8, h: 0.4, fontSize: 12, fontFace: HFONT, color: INK, bold: true });
    s.addText(h.d, { x: 2.7, y: y + 0.05, w: 4.0, h: 0.4, fontSize: 10, fontFace: MONO, color: MUTED, valign: 'middle' });
  });

  // Right: Marketplace
  s.addText('MARKETPLACE — ESTESTORE', { x: 6.9, y: 1.95, w: 6, h: 0.3, fontSize: 12, fontFace: BFONT, color: GREEN, bold: true, charSpacing: 4 });
  const mp = [
    { t: 'Kategori sayfası',   d: '/estestore/[category] — filtreleme, sıralama' },
    { t: 'Ürün detay',         d: '/estestore/[category]/[slug] — hekim onaylı rozet, EGP' },
    { t: 'Mağaza',             d: '/magaza/[slug] · /magaza/satici/[id] — satıcı vitrin' },
    { t: 'Sepet',              d: '/sepet — kupon, vergi, kargo hesabı server-side' },
    { t: 'Ödeme',              d: '/odeme + /api/checkout/create-intent — Stripe Elements' },
    { t: 'Sipariş takip',      d: '/siparis/[orderNumber] — kargo takip, fatura PDF' },
    { t: 'Kupon doğrulama',    d: '/api/checkout/validate-coupon — admin tanımlı, kullanım limiti' },
    { t: 'İade akışı',         d: '/siparis/.../iade-actions — KVKK uyumlu 14 gün cayma' },
  ];
  mp.forEach((m, i) => {
    const y = 2.4 + i * 0.6;
    s.addShape('rect', { x: 6.9, y, w: 6.1, h: 0.5, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x: 6.9, y, w: 0.1, h: 0.5, fill: { color: GREEN }, line: { color: GREEN } });
    s.addText(m.t, { x: 7.15, y: y + 0.05, w: 1.9, h: 0.4, fontSize: 12, fontFace: HFONT, color: INK, bold: true });
    s.addText(m.d, { x: 9.05, y: y + 0.05, w: 3.95, h: 0.4, fontSize: 10, fontFace: MONO, color: MUTED, valign: 'middle' });
  });
  footer(s);
}

/* ───────── 5. FEATURE MAP — SATICI + ADMIN + API ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Özellikler · Satıcı + Admin + API', 'Üç operasyonel katman.');

  // 3 columns
  const cols = [
    {
      h: 'SATICI PANELİ', c: GOLD,
      items: [
        ['Başvuru',     '/satici/basvur — auto-create user + vendor'],
        ['Ürün yönetimi','/satici/panel/urunler — CRUD, görsel, stok'],
        ['Siparişler',  '/satici/panel/siparisler — kargo durumu'],
        ['Kazanç',      '/satici/panel/kazanc — komisyon, payout takibi'],
        ['İadeler',     '/satici/panel/iadeler — iade işlem akışı'],
        ['KYC',         '/satici/panel/kyc — vergi, MERSIS, IBAN, ITS'],
        ['Ödeme hesabı','/satici/panel/odeme-hesabi — Stripe Connect'],
      ],
    },
    {
      h: 'ADMIN PANELİ', c: NAVY,
      items: [
        ['Klinikler',    '/admin/klinikler — onay, EGP, askıya alma'],
        ['Satıcılar',    '/admin/saticilar — KYC inceleme, onay'],
        ['Kullanıcılar', '/admin/kullanicilar — rol değişim, ban'],
        ['Ürünler',      '/admin/urunler — moderasyon, ön plan'],
        ['Kuponlar',     '/admin/kuponlar — kampanya yönetimi'],
        ['İadeler',      '/admin/iadeler — global iade kuyruğu'],
        ['İçerik',       '/admin/icerik — rehber, akademi içerik'],
        ['Audit',        '/admin/audit — kritik işlem logu'],
        ['Hesap',        '/admin/hesap — admin OTP (Netgsm SMS)'],
      ],
    },
    {
      h: 'API & CRON', c: GREEN,
      items: [
        ['Auth login',     '/api/auth/login — IP+user bruteforce lock'],
        ['Stripe webhook', '/api/stripe/webhook — credit + order mutasyon'],
        ['Stripe Connect', '/api/stripe/connect — onboarding link'],
        ['OTP send/verify','/api/otp/* — Upstash 3/dk limit'],
        ['Randevu create', '/api/randevu/create — kredi düş + bildirim'],
        ['Analiz',         '/api/analiz — AI cilt analizi pipeline'],
        ['Cron · EGP',     '/api/cron/clinic-egp — günlük skor refresh'],
        ['Cron · Akademi', '/api/cron/akademi-quality-score'],
        ['Cron · Review',  '/api/cron/review-reminder — 7gün sonrası'],
      ],
    },
  ];
  cols.forEach((col, ci) => {
    const x = 0.5 + ci * 4.2;
    s.addText(col.h, { x: x + 0.1, y: 1.95, w: 4, h: 0.3, fontSize: 11, fontFace: BFONT, color: col.c, bold: true, charSpacing: 4 });
    col.items.forEach((it, i) => {
      const y = 2.35 + i * 0.5;
      s.addShape('rect', { x, y, w: 4.0, h: 0.42, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
      s.addShape('rect', { x, y, w: 0.09, h: 0.42, fill: { color: col.c }, line: { color: col.c } });
      s.addText(it[0], { x: x + 0.2, y: y + 0.02, w: 1.3, h: 0.38, fontSize: 10, fontFace: HFONT, color: INK, bold: true, valign: 'middle' });
      s.addText(it[1], { x: x + 1.55, y: y + 0.02, w: 2.4, h: 0.38, fontSize: 8.5, fontFace: MONO, color: MUTED, valign: 'middle' });
    });
  });
  footer(s);
}

/* ───────── 6. KEY FEATURES — DERİNLEMESİNE ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Öne çıkan özellikler', 'Pazarda farkı yapan 6 özellik.');

  const feat = [
    { c: GOLD,  t: 'AI Cilt Analizi',       d: 'Yüklenen selfie → cilt yaşı + sorun bölgeleri + tedavi önerisi. Paylaşılabilir skor sayfası /paylas/[id].' },
    { c: GREEN, t: 'EGP — Güven Puanı',     d: 'Klinik & tedavi bazlı skor. Cron job ile günlük refresh, /preview-skor önizleme, public widget.' },
    { c: NAVY,  t: 'Kredi Ekonomisi',       d: 'Stripe ön-ödemeli paketler · webhook-driven atomik mutasyon · audit_log · Refund desteği.' },
    { c: GOLD,  t: 'Çift kanal e-posta',    d: 'Resend primary + Postmark fallback. DMARC/DKIM/SPF tam set. Spam puanı 9.8/10.' },
    { c: GREEN, t: 'Akıllı rate limit',     d: 'Login 10/dk, OTP 3/dk, Checkout 5/dk. 15dk lockout + uyarı maili. Upstash sliding window.' },
    { c: NAVY,  t: 'KVKK-Ready cascade',    d: 'app_delete_account_cascade — kullanıcı silindiğinde 14 tablo otomatik temizlenir. Audit korunur.' },
  ];
  feat.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.3, y = 1.95 + row * 1.75;
    s.addShape('rect', { x, y, w: 6.0, h: 1.6, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x, y, w: 0.15, h: 1.6, fill: { color: f.c }, line: { color: f.c } });
    s.addText(f.t, { x: x + 0.35, y: y + 0.15, w: 5.5, h: 0.45, fontSize: 17, fontFace: HFONT, color: INK, bold: true });
    s.addText(f.d, { x: x + 0.35, y: y + 0.65, w: 5.5, h: 0.95, fontSize: 12, fontFace: BFONT, color: MUTED });
  });
  footer(s);
}

/* ───────── 7. ARCHITECTURE DIAGRAM ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Mimari', 'İstek hayatı — kullanıcıdan veritabanına 4 hop.');
  const nodes = [
    { x: 0.6,  c: NAVY,  t: 'BROWSER',     d: 'React Client\nCookies (PKCE)\nServiceWorker' },
    { x: 3.2,  c: GOLD,  t: 'VERCEL EDGE', d: 'Middleware\nGeo routing\nRate limit (Upstash)' },
    { x: 5.8,  c: GREEN, t: 'NEXT.JS SSR', d: 'Server Components\nServer Actions\nAPI Routes' },
    { x: 8.4,  c: NAVY,  t: 'SUPABASE',    d: 'Postgres + RLS\nAuth (JWT)\nStorage' },
    { x: 11.0, c: GOLD,  t: 'EXTERNAL',    d: 'Stripe · Resend\nPostmark · Netgsm\nSentry' },
  ];
  nodes.forEach((n, i) => {
    s.addShape('rect', { x: n.x, y: 2.5, w: 2.0, h: 2.4, fill: { color: n.c }, line: { color: n.c } });
    s.addText(n.t, { x: n.x, y: 2.7, w: 2.0, h: 0.4, fontSize: 11, fontFace: BFONT, color: WHITE, bold: true, align: 'center', charSpacing: 3 });
    s.addShape('line', { x: n.x + 0.3, y: 3.15, w: 1.4, h: 0, line: { color: GOLD, width: 1.5 } });
    s.addText(n.d, { x: n.x + 0.1, y: 3.3, w: 1.8, h: 1.5, fontSize: 11, fontFace: BFONT, color: WHITE, align: 'center', valign: 'middle' });
    if (i < nodes.length - 1) {
      s.addShape('rightTriangle', { x: n.x + 2.05, y: 3.6, w: 0.5, h: 0.25, fill: { color: GOLD }, line: { color: GOLD }, rotate: 90 });
    }
  });
  const p = [
    { c: NAVY,  t: 'Edge-first',  d: 'Statik içerik & kimlik kontrolü kullanıcıya en yakın PoP\'ta.' },
    { c: GOLD,  t: 'Zero ORM',    d: 'Supabase SDK doğrudan SQL/RLS — runtime overhead yok.' },
    { c: GREEN, t: 'Stateless',   d: 'Tüm state Postgres\'te; ölçeklenme yatay.' },
  ];
  p.forEach((pi, i) => {
    const x = 0.6 + i * 4.2;
    s.addShape('rect', { x, y: 5.5, w: 4.0, h: 1.3, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x, y: 5.5, w: 0.12, h: 1.3, fill: { color: pi.c }, line: { color: pi.c } });
    s.addText(pi.t, { x: x + 0.3, y: 5.6, w: 3.7, h: 0.4, fontSize: 14, fontFace: HFONT, color: INK, bold: true });
    s.addText(pi.d, { x: x + 0.3, y: 6.0, w: 3.7, h: 0.75, fontSize: 11, fontFace: BFONT, color: MUTED });
  });
  footer(s);
}

/* ───────── 8. DATA MODEL ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Veri modeli', 'Postgres üzerinde 4 domain — açık sınırlı.');
  const domains = [
    { c: NAVY,  t: 'AUTH & PROFİL',     items: ['auth.users (Supabase)', 'profiles (role, hp_*)', 'clinics (KYC, EGP)', 'vendors (KYC, Stripe)'] },
    { c: GOLD,  t: 'KREDİ & TİCARET',   items: ['credit_transactions', 'credit_balance / settings', 'orders / order_items', 'products / vendor_payouts'] },
    { c: GREEN, t: 'KLİNİK OPERASYON',  items: ['appointments', 'internal_patient', 'internal_treatment (+catalog)', 'internal_payment'] },
    { c: NAVY,  t: 'İÇERİK & İZ',       items: ['analyses (cilt analizi)', 'reviews', 'audit_log', 'notifications'] },
  ];
  domains.forEach((d, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.3, y = 2.0 + row * 2.5;
    s.addShape('rect', { x, y, w: 6.0, h: 2.3, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x, y, w: 0.15, h: 2.3, fill: { color: d.c }, line: { color: d.c } });
    s.addText(d.t, { x: x + 0.35, y: y + 0.15, w: 5.5, h: 0.4, fontSize: 13, fontFace: BFONT, color: d.c, bold: true, charSpacing: 3 });
    d.items.forEach((it, j) => {
      s.addText('•  ' + it, { x: x + 0.35, y: y + 0.62 + j * 0.38, w: 5.5, h: 0.35, fontSize: 12, fontFace: MONO, color: INK });
    });
  });
  footer(s);
}

/* ───────── 9. AUTH & RLS ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Yetkilendirme', 'JWT + RLS — uygulama katmanında güven yok.');
  s.addShape('rect', { x: 0.6, y: 1.9, w: 7.2, h: 5.0, fill: { color: CODE_BG }, line: { color: CODE_BG } });
  s.addText('postgres / rls.sql', { x: 0.8, y: 2.0, w: 6, h: 0.35, fontSize: 10, fontFace: MONO, color: GOLD });
  const codeLines = [
    '-- Vendor sadece kendi ürününü görebilir',
    'create policy "vendor_own_products"',
    '  on public.products for all',
    '  using (',
    '    vendor_id in (',
    '      select id from vendors',
    '      where user_id = auth.uid()',
    '    )',
    '  );',
    '',
    '-- Admin override',
    'create policy "admin_full_access"',
    '  on public.products for all',
    '  using (',
    "    (auth.jwt() -> 'app_metadata' ->> 'role')",
    "    = 'admin'",
    '  );',
  ];
  codeLines.forEach((ln, i) => {
    s.addText(ln, {
      x: 0.8, y: 2.4 + i * 0.27, w: 7.0, h: 0.26,
      fontSize: 11, fontFace: MONO,
      color: ln.startsWith('--') ? '94A3B8' : CODE_TXT,
    });
  });
  s.addText('İlke', { x: 8.1, y: 1.9, w: 5, h: 0.4, fontSize: 11, fontFace: BFONT, color: GREEN, bold: true, charSpacing: 4 });
  const rules = [
    { t: 'Single source of truth', d: 'Yetki yalnız Postgres\'te. Frontend → arka kapı yok.' },
    { t: 'Owner-based RLS',        d: 'Her tabloda owner_id / user_id / vendor_id; auth.uid() kıyaslaması.' },
    { t: 'Role via JWT',           d: 'app_metadata.role server-side imzalı; client değiştiremez.' },
    { t: 'PKCE OAuth',             d: 'Şifre sıfırlama, magic link, email change — tek modern akış.' },
  ];
  rules.forEach((r, i) => {
    const y = 2.35 + i * 1.15;
    s.addShape('ellipse', { x: 8.1, y: y + 0.05, w: 0.45, h: 0.45, fill: { color: GREEN }, line: { color: GREEN } });
    s.addText(String(i + 1), { x: 8.1, y: y + 0.05, w: 0.45, h: 0.45, fontSize: 14, fontFace: HFONT, color: WHITE, bold: true, align: 'center', valign: 'middle' });
    s.addText(r.t, { x: 8.7, y: y, w: 4.2, h: 0.45, fontSize: 14, fontFace: HFONT, color: INK, bold: true });
    s.addText(r.d, { x: 8.7, y: y + 0.42, w: 4.2, h: 0.7, fontSize: 11, fontFace: BFONT, color: MUTED });
  });
  footer(s);
}

/* ───────── 10. PAYMENTS FLOW ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Ödeme akışı', 'Stripe webhook → atomik kredi mutasyonu.');
  const steps = [
    { n: '1', t: 'Klinik panel',     d: '/api/stripe/checkout → Stripe Session URL döner', c: NAVY  },
    { n: '2', t: 'Stripe Checkout',  d: 'Kullanıcı kart bilgisi girer (PCI dışı kalırız)',  c: GOLD  },
    { n: '3', t: 'Webhook',          d: 'checkout.session.completed → /api/stripe/webhook', c: GREEN },
    { n: '4', t: 'DB transaction',   d: 'add_credit() rpc — credit_balance + tx kaydı atomik', c: NAVY },
    { n: '5', t: 'Bildirim',         d: 'Resend ile fatura maili + panel realtime push',     c: GOLD  },
  ];
  steps.forEach((st, i) => {
    const y = 2.0 + i * 0.96;
    s.addShape('rect', { x: 0.6, y, w: 0.9, h: 0.85, fill: { color: st.c }, line: { color: st.c } });
    s.addText(st.n, { x: 0.6, y, w: 0.9, h: 0.85, fontSize: 32, fontFace: HFONT, color: WHITE, bold: true, align: 'center', valign: 'middle' });
    s.addShape('rect', { x: 1.5, y, w: 7.0, h: 0.85, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addText(st.t, { x: 1.7, y: y + 0.05, w: 6.6, h: 0.4, fontSize: 15, fontFace: HFONT, color: INK, bold: true });
    s.addText(st.d, { x: 1.7, y: y + 0.42, w: 6.7, h: 0.45, fontSize: 11, fontFace: MONO, color: MUTED });
  });
  s.addShape('rect', { x: 8.9, y: 2.0, w: 3.8, h: 4.8, fill: { color: NAVY }, line: { color: NAVY } });
  s.addText('GARANTİLER', { x: 9.1, y: 2.15, w: 3.5, h: 0.3, fontSize: 10, fontFace: BFONT, color: GREEN, bold: true, charSpacing: 4 });
  const guarantees = [
    'Idempotency key — duplikat webhook güvenli',
    'Stripe signature doğrulama (HMAC)',
    'DB transaction — rollback on failure',
    'Audit log — her kredi hareketi izlenebilir',
    'Stripe Connect — vendor split otomatik',
    'Live + Test environment ayrımı',
  ];
  guarantees.forEach((g, i) => {
    s.addText('✓  ' + g, { x: 9.1, y: 2.6 + i * 0.62, w: 3.6, h: 0.55, fontSize: 11, fontFace: BFONT, color: 'E2E8F0' });
  });
  footer(s);
}

/* ───────── 11. EMAIL / SMS INFRA ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'İletişim altyapısı', 'Çift sağlayıcılı email + Türkiye SMS — failover\'lı.');
  s.addShape('rect', { x: 0.6, y: 1.9, w: 8.1, h: 2.3, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
  s.addText('EMAIL', { x: 0.8, y: 2.0, w: 4, h: 0.3, fontSize: 11, fontFace: BFONT, color: GOLD, bold: true, charSpacing: 4 });
  const eflow = [
    { x: 0.9,  c: GREEN, t: 'sendEmail()',    s: 'lib/notifications.ts' },
    { x: 3.0,  c: GOLD,  t: 'Resend',         s: 'Primary · REST API' },
    { x: 5.1,  c: NAVY,  t: 'Postmark',       s: 'Fallback (hata durumu)' },
    { x: 7.2,  c: GREEN, t: 'Kullanıcı',      s: 'noreply@estelongy.com' },
  ];
  eflow.forEach((e, i) => {
    s.addShape('rect', { x: e.x, y: 2.5, w: 1.85, h: 1.4, fill: { color: e.c }, line: { color: e.c } });
    s.addText(e.t, { x: e.x, y: 2.65, w: 1.85, h: 0.4, fontSize: 13, fontFace: HFONT, color: WHITE, bold: true, align: 'center' });
    s.addText(e.s, { x: e.x + 0.1, y: 3.1, w: 1.65, h: 0.7, fontSize: 10, fontFace: BFONT, color: 'E2E8F0', align: 'center' });
    if (i < eflow.length - 1) {
      s.addShape('rightTriangle', { x: e.x + 1.9, y: 3.05, w: 0.3, h: 0.2, fill: { color: GOLD }, line: { color: GOLD }, rotate: 90 });
    }
  });
  s.addShape('rect', { x: 8.9, y: 1.9, w: 3.8, h: 2.3, fill: { color: NAVY }, line: { color: NAVY } });
  s.addText('SMS / OTP', { x: 9.1, y: 2.0, w: 3, h: 0.3, fontSize: 11, fontFace: BFONT, color: GREEN, bold: true, charSpacing: 4 });
  s.addText('Netgsm', { x: 9.1, y: 2.4, w: 3.5, h: 0.55, fontSize: 24, fontFace: HFONT, color: WHITE, bold: true });
  s.addText('Türkiye OTP + bildirim\nUpstash sliding window rate limit\nCanlıda 1.2K SMS/ay', {
    x: 9.1, y: 3.05, w: 3.5, h: 1.1, fontSize: 11, fontFace: BFONT, color: 'E2E8F0',
  });
  s.addText('DNS GÜVENLİK', { x: 0.6, y: 4.5, w: 4, h: 0.3, fontSize: 11, fontFace: BFONT, color: GOLD, bold: true, charSpacing: 4 });
  const dns = [
    { k: 'SPF',   v: 'v=spf1 include:resend.com -all' },
    { k: 'DKIM',  v: 'resend._domainkey · 2048-bit' },
    { k: 'DMARC', v: 'v=DMARC1; p=none; rua=mailto:…' },
    { k: 'TLS',   v: 'StartTLS + SMTPS 465' },
  ];
  dns.forEach((d, i) => {
    const x = 0.6 + i * 3.05;
    s.addShape('rect', { x, y: 4.9, w: 2.9, h: 1.8, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addText(d.k, { x: x + 0.2, y: 5.05, w: 2.6, h: 0.5, fontSize: 20, fontFace: HFONT, color: NAVY, bold: true });
    s.addText(d.v, { x: x + 0.2, y: 5.65, w: 2.6, h: 0.95, fontSize: 11, fontFace: MONO, color: MUTED });
  });
  footer(s);
}

/* ───────── 12. EGP SCORING ENGINE ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'EGP — Skorlama motoru', 'Bilim + veri + denetim → tek skor.');
  s.addText('GİRDİLER', { x: 0.6, y: 1.9, w: 4, h: 0.3, fontSize: 11, fontFace: BFONT, color: GOLD, bold: true, charSpacing: 4 });
  const inputs = [
    { c: NAVY, t: 'Literatür',    d: 'PubMed/Cochrane atıf gücü' },
    { c: NAVY, t: 'Hekim',        d: 'Ehliyet · deneyim · vaka sayısı' },
    { c: NAVY, t: 'Hasta verisi', d: 'Memnuniyet · sonuç · yan etki' },
    { c: NAVY, t: 'Denetim',      d: 'Şikayet · dava · audit skoru' },
  ];
  inputs.forEach((it, i) => {
    const y = 2.3 + i * 1.05;
    s.addShape('rect', { x: 0.6, y, w: 3.5, h: 0.9, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x: 0.6, y, w: 0.12, h: 0.9, fill: { color: it.c }, line: { color: it.c } });
    s.addText(it.t, { x: 0.85, y: y + 0.1, w: 3.2, h: 0.35, fontSize: 13, fontFace: HFONT, color: INK, bold: true });
    s.addText(it.d, { x: 0.85, y: y + 0.45, w: 3.2, h: 0.4, fontSize: 10, fontFace: BFONT, color: MUTED });
  });
  s.addShape('rect', { x: 4.7, y: 2.3, w: 4.1, h: 4.4, fill: { color: NAVY }, line: { color: NAVY } });
  s.addText('SKORLAMA MOTORU', { x: 4.9, y: 2.45, w: 3.7, h: 0.3, fontSize: 11, fontFace: BFONT, color: GOLD, bold: true, charSpacing: 3 });
  s.addText('Weighted Bayesian\nUpdate', { x: 4.9, y: 2.85, w: 3.7, h: 1.0, fontSize: 22, fontFace: HFONT, color: WHITE, bold: true });
  s.addShape('line', { x: 4.9, y: 3.95, w: 3.6, h: 0, line: { color: GOLD, width: 2 } });
  const engineBits = [
    'Postgres mat. view (60 dk refresh)',
    'Edge Function — incremental update',
    'Versiyonlu skor (audit trail)',
    'Manuel admin override (gerekçeli)',
  ];
  engineBits.forEach((b, i) => {
    s.addText('› ' + b, { x: 4.9, y: 4.2 + i * 0.55, w: 3.7, h: 0.45, fontSize: 11, fontFace: MONO, color: 'CBD5E1' });
  });
  s.addText('ÇIKTI', { x: 9.4, y: 1.9, w: 4, h: 0.3, fontSize: 11, fontFace: BFONT, color: GOLD, bold: true, charSpacing: 4 });
  s.addShape('rect', { x: 9.4, y: 2.3, w: 3.3, h: 2.4, fill: { color: WHITE }, line: { color: GREEN, width: 2 } });
  s.addText('9.2', { x: 9.4, y: 2.4, w: 3.3, h: 1.5, fontSize: 90, fontFace: HFONT, color: GREEN, bold: true, align: 'center' });
  s.addText('EGP — HA Dolgu', { x: 9.4, y: 4.0, w: 3.3, h: 0.4, fontSize: 12, fontFace: BFONT, color: MUTED, italic: true, align: 'center' });
  s.addText('Public API', { x: 9.4, y: 4.95, w: 3.3, h: 0.3, fontSize: 10, fontFace: BFONT, color: GOLD, bold: true, charSpacing: 3 });
  s.addText('GET /api/egp/{slug}\nWidget · SDK · iframe',
    { x: 9.4, y: 5.3, w: 3.3, h: 1.0, fontSize: 11, fontFace: MONO, color: INK });
  footer(s);
}

/* ───────── 13. SECURITY & COMPLIANCE ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Güvenlik & uyum', 'Saldırı yüzeyi bilerek küçük tutuluyor.');
  const sec = [
    { c: NAVY,  t: 'RLS-first',         d: 'Tüm tablolarda RLS açık. service_role yalnız webhook + admin işlemi.' },
    { c: GOLD,  t: 'Rate limiting',     d: 'Upstash sliding window — login 10/dk, checkout 5/dk, OTP 3/dk.' },
    { c: GREEN, t: 'Brute-force lock',  d: 'IP + user bazlı 15dk lockout, 3+ yanlış denemede uyarı maili.' },
    { c: NAVY,  t: 'Audit log',         d: 'Kritik işlemler (kredi, KYC, role change) immutable audit_log.' },
    { c: GOLD,  t: 'KVKK / GDPR',       d: 'Hesap silme cascade fn, veri minimizasyonu, EU-Central region.' },
    { c: GREEN, t: 'Secrets',           d: 'Vercel encrypted env, rotation log, .env asla repo\'da değil.' },
  ];
  sec.forEach((sd, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.3, y = 1.9 + row * 1.55;
    s.addShape('rect', { x, y, w: 6.0, h: 1.4, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x, y, w: 0.15, h: 1.4, fill: { color: sd.c }, line: { color: sd.c } });
    s.addText(sd.t, { x: x + 0.35, y: y + 0.15, w: 5.6, h: 0.4, fontSize: 15, fontFace: HFONT, color: INK, bold: true });
    s.addText(sd.d, { x: x + 0.35, y: y + 0.6, w: 5.6, h: 0.75, fontSize: 12, fontFace: BFONT, color: MUTED });
  });
  footer(s);
}

/* ───────── 14. OBSERVABILITY & DEVOPS ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Operasyon', 'Gözlemlenebilirlik — sorunlar müşteriye varmadan görülür.');
  s.addText('CI / CD', { x: 0.6, y: 1.9, w: 4, h: 0.3, fontSize: 11, fontFace: BFONT, color: GOLD, bold: true, charSpacing: 4 });
  const ci = [
    { t: 'git push',       c: NAVY  },
    { t: 'Vercel build',   c: GOLD  },
    { t: 'tsc + lint',     c: GREEN },
    { t: 'Preview deploy', c: NAVY  },
    { t: 'Smoke test',     c: GOLD  },
    { t: 'Production',     c: GREEN },
  ];
  ci.forEach((c, i) => {
    const x = 0.6 + i * 2.05;
    s.addShape('rect', { x, y: 2.3, w: 1.85, h: 0.6, fill: { color: c.c }, line: { color: c.c } });
    s.addText(c.t, { x, y: 2.3, w: 1.85, h: 0.6, fontSize: 11, fontFace: BFONT, color: WHITE, bold: true, align: 'center', valign: 'middle' });
    if (i < ci.length - 1) {
      s.addShape('rightTriangle', { x: x + 1.88, y: 2.5, w: 0.15, h: 0.2, fill: { color: GOLD }, line: { color: GOLD }, rotate: 90 });
    }
  });
  s.addText('METRİKLER (PROD)', { x: 0.6, y: 3.2, w: 6, h: 0.3, fontSize: 11, fontFace: BFONT, color: GOLD, bold: true, charSpacing: 4 });
  const m = [
    { v: '99.9%',   l: 'Uptime (90gün)' },
    { v: '< 300ms', l: 'P95 latency' },
    { v: '< 50ms',  l: 'DB query p95' },
    { v: '0',       l: 'Açık P0 bug' },
  ];
  m.forEach((mi, i) => {
    const x = 0.6 + i * 3.15;
    s.addShape('rect', { x, y: 3.6, w: 2.95, h: 1.5, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x, y: 3.6, w: 2.95, h: 0.08, fill: { color: GREEN }, line: { color: GREEN } });
    s.addText(mi.v, { x: x + 0.2, y: 3.75, w: 2.75, h: 0.85, fontSize: 30, fontFace: HFONT, color: NAVY, bold: true });
    s.addText(mi.l, { x: x + 0.2, y: 4.6, w: 2.75, h: 0.4, fontSize: 11, fontFace: BFONT, color: MUTED });
  });
  s.addText('ARAÇLAR', { x: 0.6, y: 5.4, w: 6, h: 0.3, fontSize: 11, fontFace: BFONT, color: GOLD, bold: true, charSpacing: 4 });
  s.addShape('rect', { x: 0.6, y: 5.8, w: 12.1, h: 1.2, fill: { color: NAVY }, line: { color: NAVY } });
  const tools = ['Sentry (error + perf)', 'Vercel Analytics', 'Supabase Logs', 'Stripe Dashboard', 'Resend Logs', 'Custom audit_log'];
  tools.forEach((t, i) => {
    const x = 0.7 + (i % 3) * 4.0;
    const y = 5.9 + Math.floor(i / 3) * 0.5;
    s.addText('›  ' + t, { x, y, w: 4, h: 0.4, fontSize: 12, fontFace: MONO, color: 'E2E8F0' });
  });
  footer(s);
}

/* ───────── 15. PERFORMANCE / SCALABILITY ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Performans', 'Bugün 10K kullanıcı. Yarın 1M — aynı mimari.');
  const headers = ['', 'BUGÜN', 'FAZ 2 (50K)', 'FAZ 3 (500K)'];
  const rows = [
    ['Postgres',   'Supabase Pro',   'Read replica',     'Sharded + replica'],
    ['Cache',      'Yok',            'Redis (Upstash)',  'Multi-region cache'],
    ['Asset',      'Vercel Edge',    'Vercel + R2',      'CDN multi-cloud'],
    ['Background', 'Edge Functions', 'Inngest jobs',     'Inngest + worker'],
    ['Image',      'next/image',     'Cloudflare Images','+ AI upscale'],
  ];
  const startX = 0.6, startY = 1.9, colW = [2.5, 3.4, 3.4, 3.4];
  const rowH = 0.6;
  s.addShape('rect', { x: startX, y: startY, w: 12.7, h: rowH, fill: { color: NAVY }, line: { color: NAVY } });
  let cx = startX;
  headers.forEach((h, i) => {
    s.addText(h, { x: cx + 0.15, y: startY, w: colW[i] - 0.2, h: rowH, fontSize: 12, fontFace: BFONT, color: i === 0 ? GREEN : WHITE, bold: true, valign: 'middle', charSpacing: 2 });
    cx += colW[i];
  });
  rows.forEach((r, ri) => {
    const y = startY + rowH + ri * rowH;
    s.addShape('rect', { x: startX, y, w: 12.7, h: rowH, fill: { color: ri % 2 ? BG : WHITE }, line: { color: LINE, width: 0.5 } });
    cx = startX;
    r.forEach((v, ci) => {
      s.addText(v, {
        x: cx + 0.15, y, w: colW[ci] - 0.2, h: rowH,
        fontSize: 12, fontFace: ci === 0 ? BFONT : MONO,
        color: ci === 0 ? INK : MUTED, bold: ci === 0, valign: 'middle',
      });
      cx += colW[ci];
    });
  });
  s.addShape('rect', { x: 0.6, y: 6.05, w: 12.7, h: 0.95, fill: { color: NAVY }, line: { color: NAVY } });
  s.addText('Postgres dikey ölçeklenme + Vercel yatay ölçeklenme — Faz 3\'e kadar mimari değişikliği YOK.', {
    x: 0.9, y: 6.15, w: 12.1, h: 0.8, fontSize: 14, fontFace: HFONT, color: WHITE, italic: true, valign: 'middle',
  });
  footer(s);
}

/* ───────── 16. TECH DEBT & 90-DAY PLAN ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Açık konular', 'Şeffaf teknik borç + ilk 90 gün planı.');
  s.addText('TEKNİK BORÇ', { x: 0.6, y: 1.9, w: 4, h: 0.3, fontSize: 11, fontFace: BFONT, color: RED, bold: true, charSpacing: 4 });
  const debt = [
    { p: 'P1', d: 'Mor renk paleti — marka tutarsızlığı (navy/gold/green geçişi planlı)' },
    { p: 'P2', d: 'E2E test coverage %35 — Playwright ile %80 hedefi' },
    { p: 'P2', d: 'Vendor onboarding manuel — KYC otomasyon yok' },
    { p: 'P3', d: 'Mobile uygulama yok — şu an PWA' },
    { p: 'P3', d: 'i18n altyapısı kısmi — sadece TR aktif' },
  ];
  debt.forEach((d, i) => {
    const y = 2.3 + i * 0.85;
    s.addShape('rect', { x: 0.6, y, w: 6.0, h: 0.75, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x: 0.6, y, w: 0.6, h: 0.75, fill: { color: RED }, line: { color: RED } });
    s.addText(d.p, { x: 0.6, y, w: 0.6, h: 0.75, fontSize: 14, fontFace: HFONT, color: WHITE, bold: true, align: 'center', valign: 'middle' });
    s.addText(d.d, { x: 1.35, y, w: 5.2, h: 0.75, fontSize: 11, fontFace: BFONT, color: INK, valign: 'middle' });
  });
  s.addText('İLK 90 GÜN', { x: 6.9, y: 1.9, w: 4, h: 0.3, fontSize: 11, fontFace: BFONT, color: GREEN, bold: true, charSpacing: 4 });
  const plan = [
    { d: '0-30',  t: 'Onboarding & audit',  s: 'Sistem tanıma, kritik akış incelemesi, test coverage baseline' },
    { d: '30-60', t: 'Test + observability', s: 'Playwright E2E suite, Sentry alerts, p95 latency takip' },
    { d: '60-90', t: 'EGP v1 + scale',      s: 'EGP motor production, read replica, kapasite testi' },
  ];
  plan.forEach((p, i) => {
    const y = 2.3 + i * 1.5;
    s.addShape('rect', { x: 6.9, y, w: 6.0, h: 1.4, fill: { color: NAVY }, line: { color: NAVY } });
    s.addText(p.d + ' GÜN', { x: 7.1, y: y + 0.1, w: 5.6, h: 0.3, fontSize: 10, fontFace: BFONT, color: GREEN, bold: true, charSpacing: 3 });
    s.addText(p.t, { x: 7.1, y: y + 0.4, w: 5.6, h: 0.45, fontSize: 16, fontFace: HFONT, color: WHITE, bold: true });
    s.addText(p.s, { x: 7.1, y: y + 0.85, w: 5.6, h: 0.5, fontSize: 11, fontFace: BFONT, color: 'CBD5E1' });
  });
  footer(s);
}

/* ───────── 17. HIRING PLAN ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Ekip planı', '12 ayda 4 kişiden 12 kişiye.');
  const hires = [
    { c: GOLD,  t: 'CTO / VP Eng',       d: 'Mimari sahibi · ekip kuran · ürün-mühendislik köprüsü',  when: 'Ay 0' },
    { c: GREEN, t: 'Sr. Full-stack (2)', d: 'Next.js + Supabase + Stripe deneyimi · TR/EU remote',     when: 'Ay 1-3' },
    { c: NAVY,  t: 'Sr. Backend / Data', d: 'Postgres tuning · EGP motoru · analitik pipeline',        when: 'Ay 3-6' },
    { c: GOLD,  t: 'DevOps / SRE',       d: 'Observability · CI/CD · incident response',               when: 'Ay 6-9' },
    { c: GREEN, t: 'Mobile (RN)',        d: 'Hasta + klinik native uygulamaları',                      when: 'Ay 6-12' },
    { c: NAVY,  t: 'QA / SDET',          d: 'Playwright · regresyon · release gate',                   when: 'Ay 9-12' },
  ];
  hires.forEach((h, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.6 + col * 4.15, y = 2.0 + row * 2.4;
    s.addShape('rect', { x, y, w: 3.9, h: 2.15, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x, y, w: 3.9, h: 0.5, fill: { color: h.c }, line: { color: h.c } });
    s.addText(h.t, { x: x + 0.2, y: y + 0.05, w: 3.0, h: 0.4, fontSize: 13, fontFace: HFONT, color: WHITE, bold: true, valign: 'middle' });
    s.addText(h.when, { x: x + 0.2, y: y + 0.05, w: 3.5, h: 0.4, fontSize: 10, fontFace: BFONT, color: WHITE, align: 'right', valign: 'middle', charSpacing: 2 });
    s.addText(h.d, { x: x + 0.25, y: y + 0.7, w: 3.5, h: 1.3, fontSize: 11, fontFace: BFONT, color: MUTED });
  });
  footer(s);
}

/* ───────── 18. CLOSE ───────── */
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addShape('rect', { x: 0, y: 0, w: 13.333, h: 0.15, fill: { color: GREEN }, line: { color: GREEN } });
  s.addShape('rect', { x: 0, y: 7.35, w: 13.333, h: 0.15, fill: { color: GREEN }, line: { color: GREEN } });
  s.addText('NEDEN ESTELONGY', { x: 0.6, y: 1.0, w: 12, h: 0.4, fontSize: 12, fontFace: BFONT, color: GREEN, bold: true, charSpacing: 6 });
  s.addText('Üretimde çalışan bir sistem.\nBüyütmeyi bekleyen bir mimari.', {
    x: 0.6, y: 1.5, w: 12, h: 2.0, fontSize: 36, fontFace: HFONT, color: WHITE, bold: true,
  });
  const stats = [
    { v: '40+',      l: 'Aktif sayfa rotası' },
    { v: '15',       l: 'API endpoint + 3 cron' },
    { v: '99.9%',    l: 'Uptime' },
    { v: '0',        l: 'Açık P0 bug' },
  ];
  stats.forEach((st, i) => {
    const x = 0.6 + i * 3.1;
    s.addShape('rect', { x, y: 4.2, w: 2.9, h: 1.7, fill: { color: '0F2167' }, line: { color: GREEN, width: 1 } });
    s.addText(st.v, { x: x + 0.2, y: 4.35, w: 2.6, h: 0.8, fontSize: 36, fontFace: HFONT, color: GREEN, bold: true });
    s.addText(st.l, { x: x + 0.2, y: 5.2,  w: 2.6, h: 0.6, fontSize: 12, fontFace: BFONT, color: 'CBD5E1' });
  });
  s.addText('Aranılan: ürünü değil, kategoriyi inşa etmek isteyen CTO ortağı.', {
    x: 0.6, y: 6.2, w: 12, h: 0.4, fontSize: 16, fontFace: HFONT, color: GREEN, italic: true, bold: true,
  });
  s.addText('estelongy@gmail.com  ·  estelongy.com  ·  github.com/estelongy', {
    x: 0.6, y: 6.7, w: 12, h: 0.4, fontSize: 13, fontFace: MONO, color: 'CBD5E1',
  });
}

pres.writeFile({ fileName: 'estelongy-teknik-sunumu.pptx' })
  .then(f => console.log('OK:', f));
