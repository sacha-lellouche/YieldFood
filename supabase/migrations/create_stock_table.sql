-- Create stock table and RLS policies
-- Execute this SQL in Supabase SQL Editor: https://app.supabase.com/project/gqellifidskqaqjwmepi/sql

-- Create stock table if it doesn't exist
CREATE TABLE IF NOT EXISTS stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stock_user_id ON stock(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_product_id ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_user_product ON stock(user_id, product_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_stock_updated_at ON stock;
CREATE TRIGGER update_stock_updated_at
    BEFORE UPDATE ON stock
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own stocks" ON stock;
DROP POLICY IF EXISTS "Users can insert their own stocks" ON stock;
DROP POLICY IF EXISTS "Users can update their own stocks" ON stock;
DROP POLICY IF EXISTS "Users can delete their own stocks" ON stock;

-- Create RLS policies

-- Policy: Users can view their own stocks
CREATE POLICY "Users can view their own stocks"
  ON stock FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own stocks
CREATE POLICY "Users can insert their own stocks"
  ON stock FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own stocks
CREATE POLICY "Users can update their own stocks"
  ON stock FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own stocks
CREATE POLICY "Users can delete their own stocks"
  ON stock FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Verify table and policies
SELECT 'stock table created/verified' as status;

SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'stock';

SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'stock';
