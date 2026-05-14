// Estelongy Investor + CTO Deck
const PptxGenJS = require('pptxgenjs');
const pres = new PptxGenJS();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5

const NAVY  = '1E3A8A';
const GOLD  = 'D97706';
const GREEN = '059669';
const WHITE = 'FFFFFF';
const INK   = '0F172A';
const MUTED = '64748B';
const BG    = 'F8FAFC';
const LINE  = 'E2E8F0';

const HFONT = 'Georgia';
const BFONT = 'Calibri';

// Helper: page number + brand strip footer
function footer(slide, n) {
  slide.addShape('rect', { x: 0, y: 7.3, w: 13.333, h: 0.2, fill: { color: NAVY }, line: { color: NAVY } });
  slide.addShape('rect', { x: 0, y: 7.3, w: 4.4, h: 0.2, fill: { color: GOLD }, line: { color: GOLD } });
  slide.addText('ESTELONGY  ·  Yatırımcı Sunumu  ·  2026', {
    x: 0.4, y: 7.0, w: 8, h: 0.25, fontSize: 9, fontFace: BFONT, color: MUTED,
  });
  slide.addText(String(n).padStart(2, '0'), {
    x: 12.6, y: 7.0, w: 0.6, h: 0.25, fontSize: 9, fontFace: BFONT, color: MUTED, align: 'right', bold: true,
  });
}

function titleBlock(slide, eyebrow, title) {
  slide.addText(eyebrow.toUpperCase(), {
    x: 0.6, y: 0.45, w: 12, h: 0.3,
    fontSize: 11, fontFace: BFONT, color: GOLD, bold: true, charSpacing: 4,
  });
  slide.addText(title, {
    x: 0.6, y: 0.75, w: 12, h: 0.9,
    fontSize: 32, fontFace: HFONT, color: INK, bold: true,
  });
}

/* ───────── 1. COVER ───────── */
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  // Gold accent block
  s.addShape('rect', { x: 0, y: 0, w: 0.35, h: 7.5, fill: { color: GOLD }, line: { color: GOLD } });
  s.addShape('rect', { x: 0.35, y: 0, w: 0.05, h: 7.5, fill: { color: GREEN }, line: { color: GREEN } });

  s.addText('ESTELONGY', {
    x: 1.0, y: 2.3, w: 11, h: 0.5,
    fontSize: 14, fontFace: BFONT, color: GOLD, bold: true, charSpacing: 8,
  });
  s.addText('Sağlıklı görünmenin\nyeni adresi.', {
    x: 1.0, y: 2.8, w: 11, h: 2.0,
    fontSize: 54, fontFace: HFONT, color: WHITE, bold: true,
  });
  s.addText('Türkiye merkezli, dünyaya açılan estetik + longevity ekosistemi.', {
    x: 1.0, y: 4.9, w: 11, h: 0.5,
    fontSize: 18, fontFace: BFONT, color: 'CBD5E1', italic: true,
  });
  s.addText('Yatırımcı & CTO Sunumu', {
    x: 1.0, y: 6.6, w: 6, h: 0.35,
    fontSize: 11, fontFace: BFONT, color: 'CBD5E1', charSpacing: 4,
  });
  s.addText('Hazırlayan: Baş Mimar Ofisi  ·  Mayıs 2026', {
    x: 7, y: 6.6, w: 5.8, h: 0.35,
    fontSize: 11, fontFace: BFONT, color: 'CBD5E1', align: 'right',
  });
}

/* ───────── 2. PROBLEM ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Problem', 'Estetik sektörü güvensizlik üzerinde duruyor.');

  const cards = [
    { n: '01', t: 'Bilgi asimetrisi',     d: 'Hasta hangi kliniğin gerçekten yetkin olduğunu bilmiyor; karar fiyat ve Instagram\'a kalıyor.' },
    { n: '02', t: 'Sertifikasyon boşluğu',d: 'Türkiye sağlık turizminde dünya lideri; ama kalite çıtası, denetim ve standart yok.' },
    { n: '03', t: 'Dağınık dijital alt yapı', d: 'Klinikler 5 ayrı yazılım kullanıyor: randevu, CRM, muhasebe, pazarlama, e-ticaret.' },
    { n: '04', t: '"Genç görünme" yarışı', d: 'Sektör estetiği görüntüye indirgemiş; sağlık ve longevity unutulmuş.' },
  ];
  cards.forEach((c, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.6 + col * 6.3;
    const y = 2.0 + row * 2.4;
    s.addShape('rect', { x, y, w: 6.0, h: 2.1, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x, y, w: 0.08, h: 2.1, fill: { color: GOLD }, line: { color: GOLD } });
    s.addText(c.n, { x: x + 0.3, y: y + 0.2, w: 1.5, h: 0.4, fontSize: 28, fontFace: HFONT, color: GOLD, bold: true });
    s.addText(c.t, { x: x + 1.7, y: y + 0.25, w: 4.1, h: 0.5, fontSize: 18, fontFace: HFONT, color: INK, bold: true });
    s.addText(c.d, { x: x + 1.7, y: y + 0.85, w: 4.1, h: 1.1, fontSize: 12, fontFace: BFONT, color: MUTED });
  });
  footer(s, 2);
}

/* ───────── 3. VISION ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Vizyon', 'Sağlıklı görünmek > genç görünmek.');

  // Left: big quote
  s.addShape('rect', { x: 0.6, y: 1.9, w: 6.2, h: 4.8, fill: { color: NAVY }, line: { color: NAVY } });
  s.addText('"', { x: 0.8, y: 1.8, w: 1.5, h: 1.3, fontSize: 120, fontFace: HFONT, color: GOLD, bold: true });
  s.addText('Estetik bir görüntü\nmeselesi değil,\nlongevity kültürünün\nbir parçasıdır.', {
    x: 0.9, y: 3.0, w: 5.8, h: 2.5, fontSize: 28, fontFace: HFONT, color: WHITE, bold: true,
  });
  s.addText('— Estelongy Manifestosu', {
    x: 0.9, y: 6.0, w: 5.8, h: 0.4, fontSize: 12, fontFace: BFONT, color: GOLD, italic: true,
  });

  // Right: 3 pillars
  const pillars = [
    { c: GOLD,  t: 'Bilim', d: 'Tedavi, ürün ve hekim önerisi kanıta dayalı; pazarlama jargonuyla değil.' },
    { c: GREEN, t: 'Şeffaflık', d: 'Fiyat, ehliyet, hasta yorumu ve sonuç verisi herkese açık.' },
    { c: NAVY,  t: 'Süreklilik', d: 'Tek seferlik tedavi değil; hasta yolculuğu boyunca koruyucu bakım.' },
  ];
  pillars.forEach((p, i) => {
    const y = 1.9 + i * 1.65;
    s.addShape('ellipse', { x: 7.1, y: y + 0.15, w: 0.7, h: 0.7, fill: { color: p.c }, line: { color: p.c } });
    s.addText(String(i + 1), { x: 7.1, y: y + 0.15, w: 0.7, h: 0.7, fontSize: 22, fontFace: HFONT, color: WHITE, bold: true, align: 'center', valign: 'middle' });
    s.addText(p.t, { x: 8.0, y: y + 0.1, w: 4.8, h: 0.5, fontSize: 22, fontFace: HFONT, color: INK, bold: true });
    s.addText(p.d, { x: 8.0, y: y + 0.6, w: 4.8, h: 1.0, fontSize: 13, fontFace: BFONT, color: MUTED });
  });
  footer(s, 3);
}

/* ───────── 4. 5-LAYER ECOSYSTEM ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Çözüm', 'Tek bir uygulama değil — 5 katmanlı bir ekosistem.');

  const layers = [
    { c: NAVY,  t: 'STANDART',     d: 'Sektörün kalite çıtası: EGP sertifikasyonu, denetim, etik kod.' },
    { c: GOLD,  t: 'EKOSİSTEM',    d: 'Doğrulanmış klinikler, hekimler ve tedaviler — keşif & randevu.' },
    { c: GREEN, t: 'YOLCULUK',     d: 'Hasta deneyimi: konsültasyon, tedavi sonrası takip, hatırlatma.' },
    { c: NAVY,  t: 'MARKETPLACE',  d: 'Bilim temelli cilt bakım ürünleri; hekim onaylı katalog.' },
    { c: GOLD,  t: 'SaaS',         d: 'Klinik panel: randevu + CRM + muhasebe + EGP raporlama.' },
  ];
  layers.forEach((l, i) => {
    const y = 1.9 + i * 1.02;
    s.addShape('rect', { x: 0.6, y, w: 1.6, h: 0.85, fill: { color: l.c }, line: { color: l.c } });
    s.addText(`0${i + 1}`, { x: 0.6, y, w: 1.6, h: 0.85, fontSize: 28, fontFace: HFONT, color: WHITE, bold: true, align: 'center', valign: 'middle' });
    s.addShape('rect', { x: 2.2, y, w: 10.5, h: 0.85, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addText(l.t, { x: 2.45, y: y + 0.05, w: 4, h: 0.4, fontSize: 16, fontFace: HFONT, color: l.c, bold: true, charSpacing: 2 });
    s.addText(l.d, { x: 2.45, y: y + 0.42, w: 10.1, h: 0.45, fontSize: 12, fontFace: BFONT, color: MUTED });
  });
  footer(s, 4);
}

/* ───────── 5. EGP ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Ayırt edici özellik', 'EGP — Estelongy Güven Puanı.');

  // Left: definition
  s.addText('Sektörün IMDb skoru ne ise,\nestetikte EGP odur.', {
    x: 0.6, y: 1.9, w: 6.2, h: 1.5, fontSize: 24, fontFace: HFONT, color: INK, bold: true,
  });
  s.addText('Klinik veya tedavi için tek bir bağımsız güven göstergesi:', {
    x: 0.6, y: 3.4, w: 6.2, h: 0.5, fontSize: 13, fontFace: BFONT, color: MUTED,
  });

  const bullets = [
    '• Bilimsel temel & literatür gücü',
    '• Hekim ehliyet ve deneyim profili',
    '• Doğrulanmış hasta sonuç verisi',
    '• Sürdürülebilirlik & yan etki profili',
    '• Şikayet/dava geçmişi & denetim skoru',
  ];
  bullets.forEach((b, i) => {
    s.addText(b, { x: 0.6, y: 3.95 + i * 0.42, w: 6.2, h: 0.4, fontSize: 13, fontFace: BFONT, color: INK });
  });

  // Right: example badge
  s.addShape('rect', { x: 7.5, y: 1.9, w: 5.2, h: 4.9, fill: { color: NAVY }, line: { color: NAVY } });
  s.addText('ÖRNEK', { x: 7.7, y: 2.05, w: 5, h: 0.3, fontSize: 10, fontFace: BFONT, color: GOLD, bold: true, charSpacing: 4 });
  s.addText('HA Dolgu', { x: 7.7, y: 2.4, w: 5, h: 0.6, fontSize: 26, fontFace: HFONT, color: WHITE, bold: true });
  s.addText('9.2 / 10', { x: 7.7, y: 3.1, w: 5, h: 1.0, fontSize: 64, fontFace: HFONT, color: GOLD, bold: true });
  s.addText('EGP — Estelongy Güven Puanı', { x: 7.7, y: 4.2, w: 5, h: 0.3, fontSize: 11, fontFace: BFONT, color: 'CBD5E1', italic: true });

  const rows = [
    ['Skin Booster',  '8.5'],
    ['Güneş Koruyucu','8.5'],
    ['Botoks',        '7.0'],
    ['Altın İğne',    '6.5'],
  ];
  rows.forEach((r, i) => {
    const y = 4.8 + i * 0.42;
    s.addText(r[0], { x: 7.7, y, w: 3.5, h: 0.35, fontSize: 12, fontFace: BFONT, color: WHITE });
    s.addText(r[1], { x: 11.2, y, w: 1.4, h: 0.35, fontSize: 12, fontFace: BFONT, color: GOLD, bold: true, align: 'right' });
  });
  footer(s, 5);
}

/* ───────── 6. MARKET ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Pazar', 'İki büyük dalga aynı anda yükseliyor.');

  const stats = [
    { v: '$2.6B', l: 'Türkiye estetik sağlık turizmi (2025)', s: 'YBO %14, 2030\'a kadar $5B+' },
    { v: '$610B', l: 'Global longevity pazarı (2025)',        s: 'YBO %6.7, 2030\'a kadar $850B' },
    { v: '15.000+', l: 'Türkiye\'de estetik klinik & hekim',  s: 'Çoğu hâlâ Excel ile çalışıyor' },
  ];
  stats.forEach((st, i) => {
    const x = 0.6 + i * 4.2;
    s.addShape('rect', { x, y: 1.9, w: 4.0, h: 3.5, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x, y: 1.9, w: 4.0, h: 0.12, fill: { color: GOLD }, line: { color: GOLD } });
    s.addText(st.v, { x: x + 0.2, y: 2.2, w: 3.6, h: 1.4, fontSize: 56, fontFace: HFONT, color: NAVY, bold: true });
    s.addText(st.l, { x: x + 0.25, y: 3.7, w: 3.5, h: 0.6, fontSize: 13, fontFace: BFONT, color: INK, bold: true });
    s.addText(st.s, { x: x + 0.25, y: 4.4, w: 3.5, h: 0.8, fontSize: 11, fontFace: BFONT, color: MUTED, italic: true });
  });

  s.addShape('rect', { x: 0.6, y: 5.7, w: 12.1, h: 1.2, fill: { color: NAVY }, line: { color: NAVY } });
  s.addText('Sağlık turizmi + longevity + SaaS dijitalleşmesi — üçü kesişen tek oyuncu yok.', {
    x: 0.9, y: 5.85, w: 11.5, h: 0.9, fontSize: 16, fontFace: HFONT, color: WHITE, italic: true, valign: 'middle',
  });
  footer(s, 6);
}

/* ───────── 7. BUSINESS MODEL ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'İş modeli', 'Tek hasta — üç gelir kanalı.');

  const streams = [
    { c: GOLD,  t: 'Kredi sistemi',  d: 'Klinikler Estelongy üzerinden hasta aldıkça kredi yakar. Ön ödemeli, marj yüksek.',  k: '%40 brüt marj', s: 'Kredi paketleri €49 — €299' },
    { c: GREEN, t: 'Marketplace',    d: 'Hekim onaylı cilt bakım ürünleri. Satıcı komisyonu + lojistik.',                    k: '%15 komisyon',  s: 'Stripe Connect entegre' },
    { c: NAVY,  t: 'SaaS — Klinik Paneli', d: 'Randevu + CRM + muhasebe + EGP raporlama tek panelde.',                        k: '€49/ay başlangıç', s: 'Yıllık ödemede %20 indirim' },
  ];
  streams.forEach((st, i) => {
    const x = 0.6 + i * 4.2;
    s.addShape('rect', { x, y: 1.9, w: 4.0, h: 5.0, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x, y: 1.9, w: 4.0, h: 0.65, fill: { color: st.c }, line: { color: st.c } });
    s.addText(st.t, { x: x + 0.25, y: 1.95, w: 3.6, h: 0.55, fontSize: 16, fontFace: HFONT, color: WHITE, bold: true, valign: 'middle' });
    s.addText(st.d, { x: x + 0.25, y: 2.85, w: 3.5, h: 1.8, fontSize: 12, fontFace: BFONT, color: INK });
    s.addText(st.k, { x: x + 0.25, y: 5.5,  w: 3.5, h: 0.5, fontSize: 22, fontFace: HFONT, color: st.c, bold: true });
    s.addText(st.s, { x: x + 0.25, y: 6.1,  w: 3.5, h: 0.6, fontSize: 11, fontFace: BFONT, color: MUTED, italic: true });
  });
  footer(s, 7);
}

/* ───────── 8. TECH STACK (CTO slide) ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'CTO için', 'Üretimde çalışan modern bir altyapı.');

  // Stack column
  const stack = [
    { c: NAVY,  t: 'Frontend', d: 'Next.js 14 App Router · TypeScript · Tailwind · React Server Components' },
    { c: GOLD,  t: 'Backend',  d: 'Supabase (Postgres + RLS + Auth + Storage) · Edge Functions · Vercel' },
    { c: GREEN, t: 'Ödeme',    d: 'Stripe Checkout + Connect · Webhook tabanlı kredi mutasyonu · Live mod hazır' },
    { c: NAVY,  t: 'Mesajlaşma', d: 'Resend (primary) + Postmark (fallback) · Netgsm SMS · Upstash rate limit' },
    { c: GOLD,  t: 'Güvenlik', d: 'RLS policy\'leri owner_id bazlı · PKCE OAuth · DMARC/DKIM/SPF · audit log' },
  ];
  stack.forEach((row, i) => {
    const y = 1.9 + i * 0.95;
    s.addShape('rect', { x: 0.6, y, w: 1.5, h: 0.75, fill: { color: row.c }, line: { color: row.c } });
    s.addText(row.t, { x: 0.6, y, w: 1.5, h: 0.75, fontSize: 12, fontFace: BFONT, color: WHITE, bold: true, align: 'center', valign: 'middle', charSpacing: 2 });
    s.addShape('rect', { x: 2.1, y, w: 7.5, h: 0.75, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addText(row.d, { x: 2.3, y, w: 7.2, h: 0.75, fontSize: 12, fontFace: BFONT, color: INK, valign: 'middle' });
  });

  // Metrics box
  s.addShape('rect', { x: 9.9, y: 1.9, w: 2.8, h: 4.65, fill: { color: NAVY }, line: { color: NAVY } });
  s.addText('OPERASYON', { x: 10.05, y: 2.05, w: 2.6, h: 0.3, fontSize: 10, fontFace: BFONT, color: GOLD, bold: true, charSpacing: 4 });

  const metrics = [
    ['Uptime',     '99.9%'],
    ['P95 latency','< 300ms'],
    ['RLS test',   '100%'],
    ['DB region',  'EU-Central'],
    ['CI/CD',      'Vercel'],
    ['Monitoring', 'Sentry + Logs'],
  ];
  metrics.forEach((m, i) => {
    const y = 2.55 + i * 0.62;
    s.addText(m[0], { x: 10.05, y, w: 1.5, h: 0.3, fontSize: 11, fontFace: BFONT, color: 'CBD5E1' });
    s.addText(m[1], { x: 11.55, y, w: 1.1, h: 0.3, fontSize: 12, fontFace: HFONT, color: WHITE, bold: true, align: 'right' });
  });
  footer(s, 8);
}

/* ───────── 9. COMPETITIVE POSITIONING (IMDb) ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Rekabet', 'Estetikte IMDb yok. Biz olacağız.');

  // Three columns: IMDb, Tripadvisor, Estelongy
  const cols = [
    { t: 'Sinema',     k: 'IMDb',         d: 'Bağımsız skor. Karar mercii. Sektör buna göre konumlanır.' },
    { t: 'Seyahat',    k: 'Tripadvisor',  d: 'Şeffaf yorum. Kalite skoru. Tüketici güvenini standartlaştırdı.' },
    { t: 'Estetik',    k: 'Estelongy',    d: 'EGP + ekosistem. Hastanın gerçek karar adresi olmak.' },
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.2;
    const isUs = i === 2;
    s.addShape('rect', {
      x, y: 1.9, w: 4.0, h: 4.5,
      fill: { color: isUs ? NAVY : WHITE },
      line: { color: isUs ? NAVY : LINE, width: 1 },
    });
    s.addText(c.t.toUpperCase(), {
      x: x + 0.3, y: 2.1, w: 3.5, h: 0.4,
      fontSize: 11, fontFace: BFONT, color: isUs ? GOLD : MUTED, bold: true, charSpacing: 4,
    });
    s.addText(c.k, {
      x: x + 0.3, y: 2.55, w: 3.5, h: 0.9,
      fontSize: 32, fontFace: HFONT, color: isUs ? WHITE : INK, bold: true,
    });
    s.addText(c.d, {
      x: x + 0.3, y: 3.7, w: 3.5, h: 2.4,
      fontSize: 13, fontFace: BFONT, color: isUs ? 'CBD5E1' : INK,
    });
  });

  s.addText('Doctolib randevuya odaklı, Realself ABD\'ye sıkışmış. Türkiye\'nin lokasyon avantajı + EGP\'nin bilimsel derinliği = farklılaşma.', {
    x: 0.6, y: 6.55, w: 12.1, h: 0.5, fontSize: 12, fontFace: BFONT, color: MUTED, italic: true,
  });
  footer(s, 9);
}

/* ───────── 10. TRACTION & ROADMAP ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Yol haritası', 'Faz 1 üretimde. Faz 2 büyüme.');

  const phases = [
    { p: 'FAZ 1', t: 'MVP & Lansman', d: 'Klinik panel, kredi sistemi, marketplace MVP, KYC, ödeme altyapısı.', s: 'TAMAMLANDI · estelongy.com canlı', c: GREEN },
    { p: 'FAZ 2', t: 'EGP & Akademi', d: 'EGP skorlama motoru v1, Estelongy Akademi (hekim eğitim), pilot 50 klinik.', s: 'Q3 2026 · Pilot başlangıç',         c: GOLD  },
    { p: 'FAZ 3', t: 'Ölçeklendirme', d: 'Marketplace genişleme, B2B SaaS satış ekibi, Avrupa açılım (DE/NL).',   s: 'Q1 2027 · 500 klinik hedef',         c: NAVY  },
    { p: 'FAZ 4', t: 'Longevity',     d: 'Genetik & biomarker entegrasyon, koruyucu tıp protokolleri, sigorta ortaklık.', s: 'Q4 2027 · Global marka',     c: NAVY  },
  ];
  phases.forEach((ph, i) => {
    const x = 0.6 + i * 3.15;
    s.addShape('rect', { x, y: 1.9, w: 2.95, h: 4.9, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x, y: 1.9, w: 2.95, h: 0.5, fill: { color: ph.c }, line: { color: ph.c } });
    s.addText(ph.p, { x: x + 0.2, y: 1.95, w: 2.6, h: 0.4, fontSize: 12, fontFace: BFONT, color: WHITE, bold: true, charSpacing: 3, valign: 'middle' });
    s.addText(ph.t, { x: x + 0.2, y: 2.55, w: 2.6, h: 0.5, fontSize: 18, fontFace: HFONT, color: INK, bold: true });
    s.addText(ph.d, { x: x + 0.2, y: 3.15, w: 2.6, h: 2.5, fontSize: 11, fontFace: BFONT, color: MUTED });
    s.addText(ph.s, { x: x + 0.2, y: 6.2,  w: 2.6, h: 0.5, fontSize: 11, fontFace: BFONT, color: ph.c, bold: true });
  });
  footer(s, 10);
}

/* ───────── 11. TEAM / CHIEF ARCHITECT ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Ekip', 'Baş mimar yaklaşımı — strateji + mimari + üretim aynı çatıda.');

  // Left: principles
  const principles = [
    { c: GOLD,  t: 'Strateji',   d: 'Her kararın "neden"i yazılı. Pozisyonlama 5 katmandan biri olmadan atılmaz.' },
    { c: GREEN, t: 'Mimari',     d: 'Veritabanı → RLS → server actions → UI hattı tek elden. Teknik borç gözle görünür.' },
    { c: NAVY,  t: 'Üretim',     d: 'Auto-commit, auto-push, smoke test gate. Şu an üretimde, müşteri kullanıyor.' },
  ];
  principles.forEach((p, i) => {
    const y = 1.9 + i * 1.6;
    s.addShape('ellipse', { x: 0.6, y, w: 0.7, h: 0.7, fill: { color: p.c }, line: { color: p.c } });
    s.addText(String(i + 1), { x: 0.6, y, w: 0.7, h: 0.7, fontSize: 22, fontFace: HFONT, color: WHITE, bold: true, align: 'center', valign: 'middle' });
    s.addText(p.t, { x: 1.5, y: y - 0.05, w: 5, h: 0.5, fontSize: 20, fontFace: HFONT, color: INK, bold: true });
    s.addText(p.d, { x: 1.5, y: y + 0.45, w: 5.3, h: 1.0, fontSize: 12, fontFace: BFONT, color: MUTED });
  });

  // Right: dark panel
  s.addShape('rect', { x: 7.5, y: 1.9, w: 5.2, h: 5.0, fill: { color: NAVY }, line: { color: NAVY } });
  s.addText('FELSEFE', { x: 7.7, y: 2.05, w: 5, h: 0.3, fontSize: 10, fontFace: BFONT, color: GOLD, bold: true, charSpacing: 4 });
  s.addText('"Geliştirici değil baş mimar. Mimari, strateji ve gerekçe sunmak benim sorumluluğum."', {
    x: 7.7, y: 2.5, w: 4.8, h: 2.0, fontSize: 18, fontFace: HFONT, color: WHITE, italic: true,
  });
  s.addShape('line', { x: 7.7, y: 4.7, w: 1.5, h: 0, line: { color: GOLD, width: 2 } });
  s.addText('ARANAN', { x: 7.7, y: 4.85, w: 5, h: 0.3, fontSize: 10, fontFace: BFONT, color: GOLD, bold: true, charSpacing: 4 });
  s.addText('• CTO / VP Engineering ortağı\n• Klinik satış lideri (B2B SaaS)\n• Medikal advisory board (3 hekim)', {
    x: 7.7, y: 5.25, w: 4.8, h: 1.5, fontSize: 13, fontFace: BFONT, color: 'CBD5E1',
  });
  footer(s, 11);
}

/* ───────── 12. FINANCIAL PROJECTION ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Finansal projeksiyon', '3 yıl — €0\'dan €18M ARR\'ye.');

  // Table-style projection
  const headers = ['', '2026', '2027', '2028'];
  const rows = [
    ['Klinik (aktif)',      '50',     '500',    '2.000'],
    ['Hasta (kümülatif)',   '5K',     '80K',    '450K'],
    ['Gelir (€)',           '€120K',  '€2.4M',  '€18M'],
    ['Brüt marj',           '%55',    '%62',    '%68'],
    ['Yakım (€/ay)',        '€40K',   '€90K',   '€180K'],
  ];

  const startX = 0.6, startY = 1.9, colW = [3.5, 3.0, 3.0, 3.0];
  const rowH = 0.62;

  // Header row
  s.addShape('rect', { x: startX, y: startY, w: 12.5, h: rowH, fill: { color: NAVY }, line: { color: NAVY } });
  let cx = startX;
  headers.forEach((h, i) => {
    s.addText(h, { x: cx + 0.2, y: startY, w: colW[i] - 0.2, h: rowH, fontSize: 13, fontFace: BFONT, color: WHITE, bold: true, valign: 'middle' });
    cx += colW[i];
  });

  rows.forEach((r, ri) => {
    const y = startY + rowH + ri * rowH;
    if (ri % 2 === 0) s.addShape('rect', { x: startX, y, w: 12.5, h: rowH, fill: { color: WHITE }, line: { color: LINE, width: 0.5 } });
    else s.addShape('rect', { x: startX, y, w: 12.5, h: rowH, fill: { color: BG }, line: { color: LINE, width: 0.5 } });
    cx = startX;
    r.forEach((v, ci) => {
      const isLabel = ci === 0;
      const isGoldRow = ri === 2; // gelir
      s.addText(v, {
        x: cx + 0.2, y, w: colW[ci] - 0.2, h: rowH,
        fontSize: 13, fontFace: isLabel ? BFONT : HFONT,
        color: isGoldRow && !isLabel ? GOLD : INK,
        bold: isGoldRow || isLabel, valign: 'middle',
      });
      cx += colW[ci];
    });
  });

  // Bottom callouts
  const calls = [
    { v: '€2M',  l: 'Seed turu hedef' },
    { v: '24 ay', l: 'Runway' },
    { v: '%15-25', l: 'Seed sonrası dilim' },
  ];
  calls.forEach((c, i) => {
    const x = 0.6 + i * 4.2;
    s.addShape('rect', { x, y: 5.7, w: 4.0, h: 1.15, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x, y: 5.7, w: 0.12, h: 1.15, fill: { color: GOLD }, line: { color: GOLD } });
    s.addText(c.v, { x: x + 0.3, y: 5.78, w: 3.7, h: 0.65, fontSize: 28, fontFace: HFONT, color: NAVY, bold: true });
    s.addText(c.l, { x: x + 0.3, y: 6.4,  w: 3.7, h: 0.35, fontSize: 12, fontFace: BFONT, color: MUTED });
  });
  footer(s, 12);
}

/* ───────── 13. WHY NOW ───────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBlock(s, 'Neden şimdi?', 'Üç dalga aynı kıyıda buluşuyor.');

  const why = [
    { c: GOLD,  t: 'Talep tarafı',  d: 'Z ve millennial kuşağı estetiği "yaşa karşı savaş" yerine "kendine bakım" olarak görüyor. Erken yaşta giriş.' },
    { c: GREEN, t: 'Arz tarafı',    d: 'Türkiye estetik turizminde dünya lideri — ama dağınık. Kategoride lider markaya açık talep var.' },
    { c: NAVY,  t: 'Teknoloji',     d: 'AI destekli skorlama, görüntü analizi ve veri toplama maliyeti 5 yıl öncesinin %10\'una indi.' },
  ];
  why.forEach((w, i) => {
    const y = 2.0 + i * 1.5;
    s.addShape('rect', { x: 0.6, y, w: 12.1, h: 1.3, fill: { color: WHITE }, line: { color: LINE, width: 1 } });
    s.addShape('rect', { x: 0.6, y, w: 0.15, h: 1.3, fill: { color: w.c }, line: { color: w.c } });
    s.addText(w.t.toUpperCase(), { x: 1.0, y: y + 0.15, w: 4, h: 0.35, fontSize: 11, fontFace: BFONT, color: w.c, bold: true, charSpacing: 4 });
    s.addText(w.d, { x: 1.0, y: y + 0.55, w: 11.5, h: 0.7, fontSize: 14, fontFace: BFONT, color: INK });
  });

  s.addText('Pencere 18-24 ay. Bu kategoride ikinci olmak — olmamaktır.', {
    x: 0.6, y: 6.6, w: 12.1, h: 0.4, fontSize: 14, fontFace: HFONT, color: NAVY, italic: true, bold: true, align: 'center',
  });
  footer(s, 13);
}

/* ───────── 14. ASK / CLOSE ───────── */
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addShape('rect', { x: 0, y: 0, w: 13.333, h: 0.15, fill: { color: GOLD }, line: { color: GOLD } });
  s.addShape('rect', { x: 0, y: 7.35, w: 13.333, h: 0.15, fill: { color: GOLD }, line: { color: GOLD } });

  s.addText('YATIRIM ÇAĞRISI', { x: 0.6, y: 1.0, w: 12, h: 0.4, fontSize: 12, fontFace: BFONT, color: GOLD, bold: true, charSpacing: 6 });
  s.addText('Estelongy\'nin bir sonraki\nadımı için ortak arıyoruz.', {
    x: 0.6, y: 1.5, w: 12, h: 2.0, fontSize: 44, fontFace: HFONT, color: WHITE, bold: true,
  });

  const asks = [
    { v: '€2M',     l: 'Seed turu', d: 'SAFE / pre-money €10M' },
    { v: '24 ay',   l: 'Runway',    d: 'Faz 2 → Faz 3 ölçeklenme' },
    { v: '3',       l: 'Pilot şehir', d: 'İstanbul · Ankara · İzmir' },
  ];
  asks.forEach((a, i) => {
    const x = 0.6 + i * 4.2;
    s.addShape('rect', { x, y: 4.3, w: 4.0, h: 1.7, fill: { color: '0F2167' }, line: { color: GOLD, width: 1 } });
    s.addText(a.v, { x: x + 0.25, y: 4.4, w: 3.5, h: 0.7, fontSize: 36, fontFace: HFONT, color: GOLD, bold: true });
    s.addText(a.l, { x: x + 0.25, y: 5.15, w: 3.5, h: 0.35, fontSize: 13, fontFace: BFONT, color: WHITE, bold: true });
    s.addText(a.d, { x: x + 0.25, y: 5.5, w: 3.5, h: 0.4, fontSize: 11, fontFace: BFONT, color: 'CBD5E1', italic: true });
  });

  s.addText('estelongy@gmail.com  ·  estelongy.com', {
    x: 0.6, y: 6.4, w: 12, h: 0.4, fontSize: 14, fontFace: BFONT, color: GOLD, bold: true,
  });
  s.addText('Sağlıklı görünmek için kurulduk. Sektörü değiştirmek için ortağa ihtiyacımız var.', {
    x: 0.6, y: 6.8, w: 12, h: 0.4, fontSize: 12, fontFace: BFONT, color: 'CBD5E1', italic: true,
  });
}

pres.writeFile({ fileName: 'estelongy-yatirimci-sunumu.pptx' })
  .then(f => console.log('OK:', f));
