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
  key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!,
};

const supabaseNew = createClient(NEW_DB.url, NEW_DB.key);

async function checkDavidPin() {
  const { data, error } = await supabaseNew.from('profiles').select('full_name, pin').eq('id', 'af16cf4c-103c-4e19-b84c-6d3c33572a68').single();
  if (error) {
    console.error('Error fetching David:', error);
    return;
  }
  console.log('David Profile:', data);
}

checkDavidPin();
