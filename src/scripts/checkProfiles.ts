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

async function countProfiles() {
  const { count, error } = await supabaseOld.from('profiles').select('*', { count: 'exact', head: true });
  if (error) {
    console.error("Erro ao contar perfis:", error.message);
  } else {
    console.log(`\n🔍 Total de Perfis no Banco Antigo: ${count}`);
    
    const { data } = await supabaseOld.from('profiles').select('full_name, role');
    console.log("Lista de Perfis Encontrados:");
    data?.forEach((p, i) => {
      console.log(`${i+1}. ${p.full_name} (${p.role})`);
    });
  }
}

countProfiles();
