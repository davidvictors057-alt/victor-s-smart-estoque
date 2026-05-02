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

async function checkDavidCaetano() {
  const { data, error } = await supabaseNew.from('profiles').select('full_name, pin').eq('id', '285b3875-2046-43c9-988a-f88809164994').single();
  if (error) {
    console.error(error);
    return;
  }
  console.log('David Caetano Profile:', data);
}

checkDavidCaetano();
