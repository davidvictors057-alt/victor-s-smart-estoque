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

async function inspectProfiles() {
  const { data, error } = await supabaseOld.from('profiles').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("Colunas 'profiles':", Object.keys(data[0]));
    console.log("Amostra:", data[0]);
  }
}

inspectProfiles();
