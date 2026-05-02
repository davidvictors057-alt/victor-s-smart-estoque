import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const URL = process.env.VITE_SUPABASE_URL_NEW!;
const KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY_NEW!;

async function checkAppSettingsSchema() {
  console.log(`🔍 Checking app_settings schema: ${URL}/rest/v1/app_settings`);
  const res = await fetch(`${URL}/rest/v1/app_settings?select=*&limit=1`, {
    method: 'GET',
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Prefer': 'count=exact'
    }
  });

  console.log(`Status: ${res.status}`);
  const text = await res.text();
  console.log(`Response: ${text}`);
}

checkAppSettingsSchema();
