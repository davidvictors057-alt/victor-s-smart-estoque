import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const NEW_DB = {
  url: process.env.VITE_SUPABASE_URL_NEW!,
  key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY_NEW!,
};

const supabaseNew = createClient(NEW_DB.url, NEW_DB.key);

async function listTables() {
  console.log("🔍 Listando tabelas via RPC/Query...");
  const { data, error } = await supabaseNew.rpc('get_tables'); // Pode não existir
  
  if (error) {
    console.log("RPC falhou, tentando via query direta (se permitido)...");
    const { data: qData, error: qError } = await supabaseNew.from('profiles').select('*').limit(0);
    console.log("Query 'profiles' result:", { data: qData, error: qError });
  } else {
    console.log("Tabelas encontradas:", data);
  }
}

listTables();
