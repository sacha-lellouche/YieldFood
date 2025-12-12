-- Enable RLS on product table and add permissive policies
-- Execute this SQL in Supabase SQL Editor

-- Enable Row Level Security on product table
ALTER TABLE product ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can view products" ON product;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON product;
DROP POLICY IF EXISTS "Authenticated users can update products" ON product;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON product;

-- Create permissive RLS policies for product table
-- Products are shared resources, so we use permissive policies

-- Policy: Everyone can view products
CREATE POLICY "Everyone can view products"
  ON product FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert products
CREATE POLICY "Authenticated users can insert products"
  ON product FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update products
CREATE POLICY "Authenticated users can update products"
  ON product FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete products
CREATE POLICY "Authenticated users can delete products"
  ON product FOR DELETE
  TO authenticated
  USING (true);

-- Verify policies
SELECT 'product RLS policies created' as status;

SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'product';

SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'product';
