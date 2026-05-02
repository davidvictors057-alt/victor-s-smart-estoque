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

async function openStorageAndDatabase() {
  console.log('🔓 Abrindo Portas Táticas (Desativando RLS para Testes)...');

  // No Supabase, para desativar RLS via código, precisamos rodar SQL.
  // Como não temos uma ferramenta de SQL direta, vamos tentar usar o RPC se o usuário tiver algum helper, 
  // mas o padrão é usar as Políticas de Storage que são mais fáceis de "abrir".

  // Vamos tentar criar políticas de "Permitir Tudo" no Storage
  // Nota: Isso requer SQL que o cliente JS não faz diretamente para políticas.
  // MAS, podemos informar ao usuário o comando SQL para ele colar no Editor do Supabase se o script falhar.

  console.log('⚠️ Comando SQL para abrir o DATABASE (Copie e cole no SQL Editor do Supabase):');
  console.log('ALTER TABLE products DISABLE ROW LEVEL SECURITY;');
  console.log('ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;');
  console.log('ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;');
  
  console.log('\n⚠️ Comando SQL para abrir o STORAGE (Copie e cole no SQL Editor do Supabase):');
  console.log(`
    CREATE POLICY "Permitir Tudo" ON storage.objects FOR ALL USING ( bucket_id = 'products' );
    CREATE POLICY "Permitir Tudo Insert" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'products' );
    CREATE POLICY "Permitir Tudo Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'products' );
  `);

  console.log('\n✅ Script finalizado. David, como estamos em fase de teste, o ideal é você rodar os comandos acima no "SQL Editor" do seu painel Supabase para liberar o acesso total sem burocracia.');
}

openStorageAndDatabase();
