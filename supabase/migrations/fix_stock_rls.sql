-- Fix RLS policies for stock table
-- Execute this SQL in Supabase SQL Editor: https://app.supabase.com/project/gqellifidskqaqjwmepi/sql

-- First, disable RLS temporarily to see if that's the issue
ALTER TABLE stock DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their own stocks" ON stock;
DROP POLICY IF EXISTS "Users can insert their own stocks" ON stock;
DROP POLICY IF EXISTS "Users can update their own stocks" ON stock;
DROP POLICY IF EXISTS "Users can delete their own stocks" ON stock;

-- Re-enable RLS
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper permissions

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

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'stock';
