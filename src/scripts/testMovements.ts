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

async function testInsert() {
  console.log("🧪 Testando inserção direta em 'movements'...");
  
  // Pegar um ID de produto e perfil que já foram migrados
  const { data: prod } = await supabaseNew.from('products').select('id').limit(1).single();
  const { data: prof } = await supabaseNew.from('profiles').select('id').limit(1).single();

  if (!prod || !prof) {
    console.log("❌ Necessário ter produtos e perfis no banco novo para este teste.");
    return;
  }

  const testRow = {
    product_id: prod.id,
    operator_id: prof.id,
    type: 'in',
    notes: 'Teste de Migração'
  };

  const { data, error } = await supabaseNew.from('movements').insert(testRow).select();
  
  if (error) {
    console.error("❌ Erro no teste:", error);
  } else {
    console.log("✅ Inserção concluída com sucesso:", data);
  }
}

testInsert();
