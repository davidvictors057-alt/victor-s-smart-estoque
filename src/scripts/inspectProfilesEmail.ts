import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const NEW_DB = {
  url: process.env.VITE_SUPABASE_URL!,
  key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!,
};

const supabaseNew = createClient(NEW_DB.url, NEW_DB.key);

async function inspectProfilesEmail() {
  const { data, error } = await supabaseNew.from('profiles').select('id, full_name, email, pin');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.table(data);
}

inspectProfilesEmail();
