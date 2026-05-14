// Generates a recovery link via Supabase admin API and prints the URL
// that would be embedded in the email. This lets us see EXACTLY where
// Supabase is pointing users without actually sending the mail.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing env'); process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

async function test(redirectTo) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: 'estelongy@gmail.com',
    options: { redirectTo },
  });
  if (error) { console.log('ERR with redirectTo=', redirectTo, '→', error.message); return; }
  console.log('redirectTo:', redirectTo || '(none)');
  console.log('  action_link →', data.properties.action_link);
  console.log('  hashed_token →', data.properties.hashed_token?.slice(0, 20) + '...');
  console.log('');
}

(async () => {
  console.log('=== Supabase recovery link test ===\n');
  await test('https://estelongy.com/auth/update-password');
  await test('https://estelongy.com/auth/update-password?from=test');
  await test(undefined); // bakalım default ne dönüyor
})();
