import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis do .env
dotenv.config({ path: resolve(__dirname, '../../.env') });

const OLD_DB = {
  url: process.env.VITE_SUPABASE_URL!,
  key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!, // Preferência por service_role se disponível
};

const NEW_DB = {
  url: process.env.VITE_SUPABASE_URL_NEW!,
  key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY_NEW!,
};

if (!OLD_DB.url || !NEW_DB.url) {
  console.error("❌ Erro: Credenciais dos bancos não encontradas no .env");
  process.exit(1);
}

const supabaseOld = createClient(OLD_DB.url, OLD_DB.key, {
  db: { schema: 'public' }
});
const supabaseNew = createClient(NEW_DB.url, NEW_DB.key, {
  db: { schema: 'public' }
});

const TABLES = [
  'profiles',
  'product_catalog',
  'products',
  'movements',
  'notifications',
  'support_tickets',
  'app_settings'
];

async function migrateTable(tableName: string) {
  console.log(`\n📦 Iniciando migração da tabela: ${tableName}...`);
  
  // 1. Buscar dados do banco antigo
  const { data, error: fetchError } = await supabaseOld.from(tableName).select('*');
  
  if (fetchError) {
    console.error(`❌ Erro ao buscar dados de ${tableName}:`, fetchError.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log(`⚠️ Tabela ${tableName} está vazia. Pulando...`);
    return;
  }

  // Mapeamento de Roles (Antigo: employee -> Novo: operator)
  const processedData = data.map(item => {
    if (tableName === 'profiles' && item.role === 'employee') {
      return { ...item, role: 'operator' };
    }
    return item;
  });

  console.log(`✅ ${processedData.length} registros encontrados em ${tableName}.`);

  // 2. Inserir no banco novo (Upsert para evitar duplicatas se rodar de novo)
  const CHUNK_SIZE = 50;
  for (let i = 0; i < processedData.length; i += CHUNK_SIZE) {
    const chunk = processedData.slice(i, i + CHUNK_SIZE);
    let onConflict = 'id';
    if (tableName === 'app_settings') onConflict = 'key';
    if (tableName === 'product_catalog') onConflict = 'sku';
    
    const res = await supabaseNew.from(tableName).upsert(chunk, { onConflict });
    
    if (res.error) {
      console.error(`❌ Erro ao inserir chunk em ${tableName}:`, res.error);
    } else {
      console.log(`🚀 Chunk migrado. Status: ${res.status}`);
    }
  }

  console.log(`✨ Migração de ${tableName} concluída.`);
}

async function runMigration() {
  console.log("🚀 INICIANDO MIGRAÇÃO GLOBAL DE DADOS...");
  console.log(`De: ${OLD_DB.url}`);
  console.log(`Para: ${NEW_DB.url}`);

  for (const table of TABLES) {
    await migrateTable(table);
  }

  console.log("\n🏁 MIGRAÇÃO CONCLUÍDA COM SUCESSO!");
}

runMigration().catch(err => {
  console.error("🚨 Falha fatal na migração:", err);
});
