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

async function setupPolicies() {
  console.log('🛡️ Configurando Políticas de Storage...');

  // Supabase Storage policies are SQL-based. We can use the RPC or raw SQL if available, 
  // but usually we do it via the dashboard or a migration.
  // Since I don't have direct SQL access to storage tables easily via the client, 
  // I will inform the user.
  
  // Actually, I can try to use the `supabase.rpc` if there's a helper, but there isn't for storage policies.
  
  console.log('⚠️ AVISO: O bucket "products" foi criado como PÚBLICO.');
  console.log('⚠️ Para permitir UPLOADS via celular (anon), você precisa ativar estas permissões no Dashboard do Supabase:');
  console.log('1. Vá em Storage > Buckets > products');
  console.log('2. Clique em "Policies"');
  console.log('3. Adicione uma política para "INSERT" e "SELECT" permitindo para "public" (ou anon).');
}

setupPolicies();
