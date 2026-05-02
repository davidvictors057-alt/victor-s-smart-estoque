import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const NEW_DB = {
  url: process.env.VITE_SUPABASE_URL!,
  key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!,
};

const supabaseAdmin = createClient(NEW_DB.url, NEW_DB.key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrateAuthUsers() {
  console.log('Fetching profiles from NEW DB...');
  const { data: profiles, error: pError } = await supabaseAdmin.from('profiles').select('id, email, pin, full_name');
  
  if (pError) {
    console.error('Error fetching profiles:', pError);
    return;
  }

  console.log(`Found ${profiles.length} profiles. Starting Auth migration...`);

  for (const profile of profiles) {
    if (!profile.email) {
      console.warn(`Skipping ${profile.full_name}: No email.`);
      continue;
    }

    console.log(`Creating/Updating Auth user for ${profile.full_name} (${profile.email})...`);
    
    // We try to create. If it exists, we might get an error.
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      id: profile.id,
      email: profile.email,
      password: profile.pin, // PIN is used as password in this app
      email_confirm: true,
      user_metadata: { full_name: profile.full_name }
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`User ${profile.email} already exists. Updating password...`);
        const { error: uError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
          password: profile.pin
        });
        if (uError) console.error(`Error updating ${profile.email}:`, uError.message);
      } else {
        console.error(`Error creating ${profile.email}:`, error.message);
      }
    } else {
      console.log(`Successfully created Auth user for ${profile.full_name}`);
    }
  }

  console.log('Auth migration finished.');
}

migrateAuthUsers();
