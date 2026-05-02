import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const URL = process.env.VITE_SUPABASE_URL_NEW!;
const KEY = process.env.VITE_SUPABASE_ANON_KEY_NEW!;

async function rawCheck() {
  console.log(`🔍 Raw check: ${URL}/rest/v1/profiles`);
  const res = await fetch(`${URL}/rest/v1/profiles?select=count`, {
    method: 'GET',
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Range-Unit': 'items',
      'Prefer': 'count=exact'
    }
  });

  console.log(`Status: ${res.status}`);
  const text = await res.text();
  console.log(`Response: ${text}`);
}

rawCheck();
