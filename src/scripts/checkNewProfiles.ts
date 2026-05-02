import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const NEW_DB = {
  url: process.env.VITE_SUPABASE_URL_NEW!,
  key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY_NEW!,
};

const supabaseNew = createClient(NEW_DB.url, NEW_DB.key);

async function checkNewProfiles() {
  const { data, error } = await supabaseNew.from('profiles').select('*');
  if (error) {
    console.error("Erro ao buscar perfis novos:", error.message);
  } else {
    console.log(`\n🔍 Total de Perfis no Banco Novo: ${data?.length}`);
    data?.forEach((p, i) => {
      console.log(`${i+1}. ${p.full_name} (${p.role})`);
    });
  }
}

checkNewProfiles();
