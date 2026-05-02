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

async function checkInfoSchema() {
  const { data, error } = await supabaseNew.rpc('get_table_columns', { table_name: 'app_settings' });
  if (error) {
    // If RPC doesn't exist, try direct query to information_schema
    const { data: cols, error: e2 } = await supabaseNew.from('information_schema.columns').select('column_name').eq('table_name', 'app_settings');
    if (e2) {
       console.log('Error:', e2.message);
    } else {
       console.log('Columns from info schema:', cols.map(c => c.column_name));
    }
  } else {
    console.log('Columns from RPC:', data);
  }
}

checkInfoSchema();
