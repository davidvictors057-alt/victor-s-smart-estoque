import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase env variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  console.log('🚀 Iniciando Configuração de Storage...');

  // 1. Criar o bucket 'products' se não existir
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('❌ Erro ao listar buckets:', listError.message);
    return;
  }

  const bucketExists = buckets.find(b => b.name === 'products');

  if (!bucketExists) {
    console.log('📦 Criando bucket "products"...');
    const { error: createError } = await supabase.storage.createBucket('products', {
      public: true,
      allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
      fileSizeLimit: 5242880 // 5MB limit
    });

    if (createError) {
      console.error('❌ Erro ao criar bucket:', createError.message);
      return;
    }
    console.log('✅ Bucket "products" criado com sucesso!');
  } else {
    console.log('✅ Bucket "products" já existe.');
  }

  console.log('🎬 Configuração Finalizada!');
}

setupStorage();
