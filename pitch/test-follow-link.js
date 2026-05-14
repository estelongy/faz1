// Follows the Supabase recovery action_link with redirects manually,
// printing each hop. This shows EXACTLY where the user lands.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, key, { auth: { persistSession: false } });

async function follow(startUrl, label) {
  console.log(`\n━━━ ${label} ━━━`);
  console.log('start:', startUrl);
  let next = startUrl, hops = 0;
  while (next && hops < 6) {
    hops++;
    const res = await fetch(next, { method: 'GET', redirect: 'manual' });
    const loc = res.headers.get('location');
    console.log(`  hop ${hops}: status=${res.status} → ${loc || '(end)'}`);
    if (!loc) break;
    next = loc.startsWith('http') ? loc : new URL(loc, next).toString();
  }
}

(async () => {
  // Scenario A: redirectTo whitelist-uyumlu
  const a = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: 'estelongy@gmail.com',
    options: { redirectTo: 'https://estelongy.com/auth/update-password' },
  });
  await follow(a.data.properties.action_link, 'A: redirectTo=/auth/update-password');

  // Scenario B: redirectTo whitelist-DIŞI (özellikle yanlış path)
  const b = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: 'estelongy@gmail.com',
    options: { redirectTo: 'https://kotu-site.com/hack' },
  });
  await follow(b.data.properties.action_link, 'B: redirectTo=kotu-site (whitelist dışı)');

  // Scenario C: hiç redirectTo verilmemiş
  const c = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: 'estelongy@gmail.com',
  });
  await follow(c.data.properties.action_link, 'C: redirectTo=undefined');
})();
