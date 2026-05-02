-- VICTOR'S SMART ESTOQUE - FIX SCHEMA
-- Execute este script para adicionar as colunas que faltaram na transição do V1 para o V2.

-- 1. Ajustes em profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS store_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_access_alerts BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_access_management BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_access_table BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS visible_password TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Ajustes em app_settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS client_id UUID;

-- 3. Forçar recarregamento do cache (se possível via SQL)
NOTIFY pgrst, 'reload schema';
