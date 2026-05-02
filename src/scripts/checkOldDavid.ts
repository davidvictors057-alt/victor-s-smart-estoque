import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const OLD_DB = {
  url: process.env.VITE_SUPABASE_URL_OLD!,
  key: process.env.VITE_SUPABASE_ANON_KEY_OLD!,
};

const supabaseOld = createClient(OLD_DB.url, OLD_DB.key);

async function checkOldDavid() {
  const { data, error } = await supabaseOld.from('profiles').select('full_name, pin').eq('id', 'af16cf4c-103c-4e19-b84c-6d3c33572a68').single();
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Old David Profile:', data);
}

checkOldDavid();
