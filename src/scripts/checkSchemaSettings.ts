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

async function checkSchema() {
  const { data, error } = await supabaseNew.from('app_settings').select('*').limit(1);
  if (error) {
    console.log('Error selecting:', error.message);
  } else {
    console.log('Columns:', Object.keys(data[0] || {}));
  }
}

checkSchema();
