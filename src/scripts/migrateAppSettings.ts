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

const NEW_DB = {
  url: process.env.VITE_SUPABASE_URL!,
  key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!,
};

const supabaseOld = createClient(OLD_DB.url, OLD_DB.key);

async function migrateAppSettings() {
  const { data } = await supabaseOld.from('app_settings').select('*');
  if (!data) return;

  for (const item of data) {
    const { id, ...cleanItem } = item;
    console.log(`Migrating setting: ${item.key}`);
    const res = await fetch(`${NEW_DB.url}/rest/v1/app_settings`, {
        method: 'POST',
        headers: {
            'apikey': NEW_DB.key,
            'Authorization': `Bearer ${NEW_DB.key}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(cleanItem)
    });
    console.log(`Status: ${res.status}`);
    if (res.status !== 201 && res.status !== 204 && res.status !== 200) {
        const text = await res.text();
        console.log(`Body: ${text}`);
    }
  }
}

migrateAppSettings();
