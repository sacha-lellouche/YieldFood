-- Migration complète pour créer toutes les tables nécessaires
-- Exécutez ce script APRÈS avoir exécuté 00_fix_ingredients_table.sql

-- 1. Créer la table recipes
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  servings INT DEFAULT 1,
  prep_time INT,
  cook_time INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Créer la table recipe_ingredients
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
  ingredient_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Créer les indexes
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_name ON public.recipes(name);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON public.recipe_ingredients(ingredient_id);

-- 4. Trigger pour recipes
DROP TRIGGER IF EXISTS update_recipes_updated_at ON public.recipes;
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Activer RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- 6. Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view their own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can insert their own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can update their own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can view ingredients of their recipes" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Users can insert ingredients to their recipes" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Users can update ingredients of their recipes" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Users can delete ingredients from their recipes" ON public.recipe_ingredients;

-- 7. Policies pour recipes
CREATE POLICY "Users can view their own recipes"
  ON public.recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes"
  ON public.recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes"
  ON public.recipes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
  ON public.recipes FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Policies pour recipe_ingredients
CREATE POLICY "Users can view ingredients of their recipes"
  ON public.recipe_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ingredients to their recipes"
  ON public.recipe_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ingredients of their recipes"
  ON public.recipe_ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ingredients from their recipes"
  ON public.recipe_ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

-- 9. Créer la vue pour les statistiques
CREATE OR REPLACE VIEW public.recipes_with_ingredient_count AS
SELECT 
  r.*,
  COUNT(ri.id) as ingredient_count
FROM public.recipes r
LEFT JOIN public.recipe_ingredients ri ON r.id = ri.recipe_id
GROUP BY r.id;
