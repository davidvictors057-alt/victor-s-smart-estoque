import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const OLD_DB = {
  url: process.env.VITE_SUPABASE_URL!,
  key: process.env.VITE_SUPABASE_ANON_KEY!,
};

const supabaseOld = createClient(OLD_DB.url, OLD_DB.key);

async function inspectSchema() {
  const { data, error } = await supabaseOld.from('app_settings').select('*').limit(1);
  if (error) {
    console.error(error);
    return;
  }
  if (data && data.length > 0) {
    console.log("Colunas da tabela 'products':", Object.keys(data[0]));
    console.log("Amostra:", data[0]);
  } else {
    console.log("Tabela 'products' vazia.");
  }
}

inspectSchema();
