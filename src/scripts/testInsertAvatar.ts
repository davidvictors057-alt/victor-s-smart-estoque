import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const URL = process.env.VITE_SUPABASE_URL_NEW!;
const KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY_NEW!;

async function testInsertAvatar() {
  console.log(`🧪 Test insert with avatar_type: ${URL}/rest/v1/profiles`);
  const res = await fetch(`${URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      full_name: 'Teste Avatar',
      role: 'admin',
      avatar_type: 'test-avatar'
    })
  });

  console.log(`Status: ${res.status}`);
  const data = await res.json();
  console.log(`Response:`, data);
}

testInsertAvatar();
