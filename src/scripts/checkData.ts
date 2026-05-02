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

async function checkData() {
  const { data, error } = await supabaseOld.from('products').select('name, image_url').limit(5);
  if (error) {
    console.error(error);
    return;
  }
  console.log("Exemplos de Produtos e Imagens:");
  data?.forEach(p => {
    console.log(`- ${p.name}: ${p.image_url?.substring(0, 50)}...`);
  });
}

checkData();
