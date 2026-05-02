-- VICTOR'S SMART ESTOQUE - DATABASE SCHEMA V2
-- Execute este script para atualizar/criar as tabelas com todos os campos necessários.

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA: profiles (Perfis Completos)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator', -- admin, operator
  client_id UUID,
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  store_id UUID,
  can_access_alerts BOOLEAN DEFAULT false,
  can_access_management BOOLEAN DEFAULT false,
  can_access_table BOOLEAN DEFAULT true,
  visible_password TEXT,
  gender TEXT,
  email TEXT,
  avatar_type TEXT,
  avatar_url TEXT,
  username TEXT,
  pin TEXT,
  status TEXT DEFAULT 'offline',
  phone TEXT,
  bio TEXT,
  accent_color TEXT DEFAULT 'cyan',
  theme_style TEXT DEFAULT 'neon',
  score INTEGER DEFAULT 0,
  shift TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA: product_catalog (Catálogo Inteligente)
CREATE TABLE IF NOT EXISTS product_catalog (
  sku TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  spec TEXT,
  image_url TEXT,
  cost DECIMAL(10, 2) DEFAULT 0,
  sale DECIMAL(10, 2) DEFAULT 0,
  client_id UUID,
  internal_code TEXT,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA: products (Estoque Físico)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT,
  name TEXT NOT NULL,
  spec TEXT,
  imei TEXT,
  imei2 TEXT,
  brand TEXT,
  category TEXT,
  cost DECIMAL(10, 2) DEFAULT 0,
  sale DECIMAL(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_stock',
  image_url TEXT,
  internal_code TEXT,
  client_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA: movements (Histórico)
CREATE TABLE IF NOT EXISTS movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- in, out
  notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  client_id UUID
);

-- 5. TABELA: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tone TEXT DEFAULT 'primary',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  client_id UUID
);

-- 6. TABELA: support_tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  client_id UUID,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'low',
  context JSONB,
  ai_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TABELA: app_settings (Com client_id)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  client_id UUID
);

-- Resetar RLS para garantir acesso total via service_role inicialmente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_catalog DISABLE ROW LEVEL SECURITY;
ALTER TABLE movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
