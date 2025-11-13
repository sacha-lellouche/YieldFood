-- Migration SÉCURISÉE : Sauvegarde et migration des données ingredients
-- Ce script préserve vos données existantes

-- ÉTAPE 1: Sauvegarder l'ancienne table ingredients
CREATE TABLE IF NOT EXISTS ingredients_backup AS 
SELECT * FROM public.ingredients;

-- ÉTAPE 2: Supprimer l'ancienne table
DROP TABLE IF EXISTS public.ingredients CASCADE;

-- ÉTAPE 3: Créer la nouvelle table ingredients avec UUID
CREATE TABLE public.ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL DEFAULT 'kg',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ÉTAPE 4: Créer les indexes
CREATE INDEX idx_ingredients_user_id ON public.ingredients(user_id);
CREATE INDEX idx_ingredients_name ON public.ingredients(name);

-- ÉTAPE 5: Créer la fonction de mise à jour
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ÉTAPE 6: Créer le trigger
CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON public.ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ÉTAPE 7: Activer RLS
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 8: Créer les policies RLS
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

-- ÉTAPE 9: Restaurer les données (si vous aviez des données avec user_id)
-- ⚠️ Décommentez cette ligne SI votre ancienne table avait déjà un user_id
-- INSERT INTO public.ingredients (user_id, name, quantity, unit, created_at)
-- SELECT user_id, name, quantity, unit, created_at 
-- FROM ingredients_backup
-- WHERE user_id IS NOT NULL;

-- Note: Les anciennes données de ingredients_backup restent disponibles
-- Vous pouvez les consulter avec: SELECT * FROM ingredients_backup;
