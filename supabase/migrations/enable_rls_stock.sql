-- Enable Row Level Security on stock table
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own stocks" ON stock;
DROP POLICY IF EXISTS "Users can insert their own stocks" ON stock;
DROP POLICY IF EXISTS "Users can update their own stocks" ON stock;
DROP POLICY IF EXISTS "Users can delete their own stocks" ON stock;

-- Create RLS policies for stock table

-- Policy: Users can view their own stocks
CREATE POLICY "Users can view their own stocks"
  ON stock FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own stocks
CREATE POLICY "Users can insert their own stocks"
  ON stock FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own stocks
CREATE POLICY "Users can update their own stocks"
  ON stock FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own stocks
CREATE POLICY "Users can delete their own stocks"
  ON stock FOR DELETE
  USING (auth.uid() = user_id);

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'stock';

-- List all policies on stock table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'stock';
