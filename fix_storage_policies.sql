-- VICTOR'S SMART ESTOQUE - STORAGE POLICIES FIX
-- Execute este script no SQL Editor do Supabase para garantir acesso público às imagens.

-- 1. Garantir que o bucket 'products' seja público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'products';

-- 2. Remover políticas antigas de SELECT (para evitar conflitos)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Select" ON storage.objects;

-- 3. Criar política de visualização pública para o bucket 'products'
-- Permite que qualquer pessoa (anon ou authenticated) visualize os arquivos
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT 
USING (bucket_id = 'products');

-- 4. Criar política de upload para usuários autenticados (opcional, mas recomendado)
-- Se você quiser restringir quem sobe fotos, ajuste aqui.
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'products');

-- 5. Criar política de atualização/delete para o dono ou admin
DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
CREATE POLICY "Owner Update" ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
CREATE POLICY "Owner Delete" ON storage.objects 
FOR DELETE 
USING (bucket_id = 'products');
