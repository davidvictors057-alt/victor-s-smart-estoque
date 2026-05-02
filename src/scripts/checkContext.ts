import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const URL = process.env.VITE_SUPABASE_URL_NEW!;
const KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY_NEW!;

async function checkContext() {
  console.log(`🔍 Checking DB context: ${URL}`);
  
  // Tentar listar tabelas via information_schema
  const res = await fetch(`${URL}/rest/v1/rpc/get_server_info`, {
    method: 'POST',
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (res.status === 404) {
      console.log("RPC get_server_info não existe. Tentando query direta...");
      const res2 = await fetch(`${URL}/rest/v1/profiles?select=full_name`, {
        method: 'GET',
        headers: {
          'apikey': KEY,
          'Authorization': `Bearer ${KEY}`
        }
      });
      console.log(`Status profiles: ${res2.status}`);
      const data = await res2.json();
      console.log(`Data profiles:`, data);
  } else {
      const data = await res.json();
      console.log(`Data:`, data);
  }
}

checkContext();
