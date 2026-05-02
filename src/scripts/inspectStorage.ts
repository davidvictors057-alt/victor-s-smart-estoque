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
  key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!,
};

const supabaseOld = createClient(OLD_DB.url, OLD_DB.key);

async function inspectStorage() {
  console.log("🔍 Inspecionando Storage do banco antigo...");
  const { data: buckets, error } = await supabaseOld.storage.listBuckets();
  
  if (error) {
    console.error("❌ Erro ao listar buckets:", error.message);
    return;
  }

  console.log(`✅ ${buckets.length} buckets encontrados.`);
  for (const bucket of buckets) {
    console.log(`- Bucket: ${bucket.name}`);
    const { data: files } = await supabaseOld.storage.from(bucket.name).list();
    if (files) {
      console.log(`  (${files.length} arquivos)`);
    }
  }
}

inspectStorage();
