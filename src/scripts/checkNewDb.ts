import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });


const NEW_DB = {
  url: process.env.VITE_SUPABASE_URL_NEW!,
  key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY_NEW!,
};

const supabaseNew = createClient(NEW_DB.url, NEW_DB.key);

async function checkTables() {
  const TABLES = [
    'profiles',
    'product_catalog',
    'products',
    'movements',
    'notifications',
    'support_tickets',
    'app_settings'
  ];
  console.log("🔍 Verificando prontidão do novo banco...");

  for (const table of TABLES) {
    const res = await supabaseNew.from(table).select('id', { count: 'exact', head: true });
    if (res.error) {
      console.log(`❌ Tabela '${table}' ERRO: ${res.error.message} (${res.error.code})`);
    } else {
      console.log(`✅ Tabela '${table}' pronta. Count: ${res.count}`);
    }
  }
}

checkTables();
