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

async function checkElizete() {
  const id = 'af16cf4c-103c-4e19-b84c-6d3c33572a68';
  const { data, error } = await supabaseNew.from('profiles').select('*').eq('id', id).single();
  if (error) {
    console.error("Erro ao buscar Elizete:", error);
  } else {
    console.log("Elizete encontrada:", data);
  }
}

checkElizete();
