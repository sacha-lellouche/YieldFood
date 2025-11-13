-- ÉTAPE 3: Créer les tables recipes et recipe_ingredients
-- Exécutez ce fichier EN DERNIER (après avoir créé ingredients)

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  servings INT DEFAULT 1,
  prep_time INT,
  cook_time INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create recipe_ingredients table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  ingredient_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);

-- Trigger to update updated_at on recipes
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can insert their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can view ingredients of their recipes" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can insert ingredients to their recipes" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can update ingredients of their recipes" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can delete ingredients from their recipes" ON recipe_ingredients;

-- RLS Policies for recipes
CREATE POLICY "Users can view their own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for recipe_ingredients
CREATE POLICY "Users can view ingredients of their recipes"
  ON recipe_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ingredients to their recipes"
  ON recipe_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ingredients of their recipes"
  ON recipe_ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ingredients from their recipes"
  ON recipe_ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

-- View pour faciliter les requêtes
CREATE OR REPLACE VIEW recipes_with_ingredient_count AS
SELECT 
  r.*,
  COUNT(ri.id) as ingredient_count
FROM recipes r
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
GROUP BY r.id;
