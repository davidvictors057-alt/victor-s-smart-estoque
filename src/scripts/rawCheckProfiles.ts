import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const URL = process.env.VITE_SUPABASE_URL_NEW!;
const KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY_NEW!;

async function rawCheckProfiles() {
  console.log(`🔍 Raw check profiles: ${URL}/rest/v1/profiles`);
  const res = await fetch(`${URL}/rest/v1/profiles?select=*`, {
    method: 'GET',
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`
    }
  });

  console.log(`Status: ${res.status}`);
  const data = await res.json();
  console.log(`Total encontrado: ${Array.isArray(data) ? data.length : 'Erro'}`);
  if (Array.isArray(data)) {
    data.forEach(p => console.log(`- ${p.full_name}`));
  } else {
    console.log(data);
  }
}

rawCheckProfiles();
