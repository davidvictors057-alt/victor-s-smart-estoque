import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const OLD_DB = {
  url: process.env.VITE_SUPABASE_URL!,
  key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!,
};

const NEW_DB = {
  url: process.env.VITE_SUPABASE_URL_NEW!,
  key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY_NEW!,
};

const supabaseOld = createClient(OLD_DB.url, OLD_DB.key);
const supabaseNew = createClient(NEW_DB.url, NEW_DB.key);

const BUCKETS = ['products', 'avatars'];

async function migrateBucket(bucketName: string) {
  console.log(`\n📂 Iniciando migração do Bucket: ${bucketName}...`);

  // 1. Listar arquivos no bucket antigo (recursivamente)
  const { data: files, error: listError } = await supabaseOld.storage.from(bucketName).list('', {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (listError) {
    console.error(`❌ Erro ao listar arquivos no bucket ${bucketName}:`, listError.message);
    return;
  }

  if (!files || files.length === 0) {
    console.log(`⚠️ Bucket ${bucketName} está vazio. Pulando...`);
    return;
  }

  console.log(`✅ ${files.length} arquivos encontrados em ${bucketName}.`);

  for (const file of files) {
    if (file.name === '.emptyFolderPlaceholder') continue;

    console.log(`⏳ Transferindo: ${file.name}...`);

    // 2. Download do arquivo antigo
    const { data: blob, error: downloadError } = await supabaseOld.storage.from(bucketName).download(file.name);

    if (downloadError) {
      console.error(`❌ Erro ao baixar ${file.name}:`, downloadError.message);
      continue;
    }

    // 3. Upload para o banco novo
    const { error: uploadError } = await supabaseNew.storage.from(bucketName).upload(file.name, blob, {
      upsert: true,
      contentType: blob.type
    });

    if (uploadError) {
      console.error(`❌ Erro ao subir ${file.name} para o novo banco:`, uploadError.message);
      if (uploadError.message.includes("not found")) {
        console.warn(`💡 Dica: Verifique se o bucket '${bucketName}' foi criado no novo projeto Supabase.`);
      }
    } else {
      console.log(`🚀 ${file.name} transferido com sucesso.`);
    }
  }

  console.log(`✨ Migração do bucket ${bucketName} concluída.`);
}

async function runStorageMigration() {
  console.log("🚀 INICIANDO MIGRAÇÃO DE STORAGE...");
  
  for (const bucket of BUCKETS) {
    await migrateBucket(bucket);
  }

  console.log("\n🏁 MIGRAÇÃO DE STORAGE CONCLUÍDA!");
}

runStorageMigration().catch(err => {
  console.error("🚨 Falha fatal na migração de storage:", err);
});
