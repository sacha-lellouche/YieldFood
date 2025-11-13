-- Migration pour adapter votre base de données existante
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Modifier la table ingredients existante pour correspondre à nos besoins
ALTER TABLE public.ingredients 
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS quantity DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Modifier la colonne id pour utiliser UUID au lieu de bigint
-- Note: Cette opération supprimera les données existantes dans ingredients
-- Si vous avez des données importantes, faites d'abord une sauvegarde !
DROP TABLE IF EXISTS public.ingredients CASCADE;

CREATE TABLE public.ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL DEFAULT 'kg',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Créer les indexes
CREATE INDEX IF NOT EXISTS idx_ingredients_user_id ON public.ingredients(user_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON public.ingredients(name);

-- 4. Créer la fonction de mise à jour (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer le trigger
DROP TRIGGER IF EXISTS update_ingredients_updated_at ON public.ingredients;
CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON public.ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Activer RLS
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

-- 7. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view their own ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Users can insert their own ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Users can update their own ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Users can delete their own ingredients" ON public.ingredients;

-- 8. Créer les policies RLS
CREATE POLICY "Users can view their own ingredients"
  ON public.ingredients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ingredients"
  ON public.ingredients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ingredients"
  ON public.ingredients FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ingredients"
  ON public.ingredients FOR DELETE
  USING (auth.uid() = user_id);
