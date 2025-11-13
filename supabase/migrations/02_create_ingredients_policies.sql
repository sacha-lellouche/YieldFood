-- ÉTAPE 2: Activer RLS et créer les policies pour ingredients
-- Exécutez ce fichier APRÈS avoir créé la table

-- Enable Row Level Security
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own ingredients" ON ingredients;
DROP POLICY IF EXISTS "Users can insert their own ingredients" ON ingredients;
DROP POLICY IF EXISTS "Users can update their own ingredients" ON ingredients;
DROP POLICY IF EXISTS "Users can delete their own ingredients" ON ingredients;

-- Create policies
CREATE POLICY "Users can view their own ingredients"
  ON ingredients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ingredients"
  ON ingredients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ingredients"
  ON ingredients FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ingredients"
  ON ingredients FOR DELETE
  USING (auth.uid() = user_id);
