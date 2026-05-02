-- VICTOR'S SMART ESTOQUE - DATABASE SCHEMA
-- Execute este script no SQL Editor do seu novo projeto Supabase.

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA: profiles (Perfis de Usuários/Operadores)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
  avatar_url TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy')),
  last_active TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  pin TEXT,
  email TEXT,
  phone TEXT,
  bio TEXT,
  accent_color TEXT,
  theme_style TEXT,
  client_id UUID,
  score INTEGER DEFAULT 0,
  shift TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA: product_catalog (Catálogo Inteligente de Modelos)
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

-- 3. TABELA: products (Estoque Físico de Itens Únicos)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT, -- Relacionado ao product_catalog.sku
  name TEXT NOT NULL,
  spec TEXT,
  imei TEXT,
  imei2 TEXT,
  brand TEXT,
  category TEXT,
  cost DECIMAL(10, 2) DEFAULT 0,
  sale DECIMAL(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'sold', 'reserved', 'repair')),
  image_url TEXT,
  internal_code TEXT,
  client_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA: movements (Histórico de Movimentações)
CREATE TABLE IF NOT EXISTS movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  client_id UUID
);

-- 5. TABELA: notifications (Alertas e Logs do Sistema)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tone TEXT DEFAULT 'primary' CHECK (tone IN ('danger', 'ai', 'success', 'primary')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  client_id UUID
);

-- 6. TABELA: support_tickets (Suporte e IA)
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  client_id UUID,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high', 'emergency')),
  context JSONB,
  ai_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TABELA: app_settings (Configurações do Sistema e Tokens)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (Opcional, mas recomendado)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Política simples para permitir acesso total com as chaves fornecidas
-- Recomenda-se refinar estas políticas após a migração.
CREATE POLICY "Acesso Total" ON profiles FOR ALL USING (true);
CREATE POLICY "Acesso Total" ON products FOR ALL USING (true);
CREATE POLICY "Acesso Total" ON product_catalog FOR ALL USING (true);
CREATE POLICY "Acesso Total" ON movements FOR ALL USING (true);
CREATE POLICY "Acesso Total" ON notifications FOR ALL USING (true);
CREATE POLICY "Acesso Total" ON support_tickets FOR ALL USING (true);
CREATE POLICY "Acesso Total" ON app_settings FOR ALL USING (true);
