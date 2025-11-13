-- Fix ingredients table structure
-- Cette migration ajoute les colonnes manquantes si nécessaire

-- Vérifier et ajouter la colonne user_id si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ingredients' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE ingredients ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX idx_ingredients_user_id ON ingredients(user_id);
    END IF;
END $$;

-- Vérifier et ajouter la colonne product_id si elle n'existe pas (pour lier au catalogue)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ingredients' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE ingredients ADD COLUMN product_id UUID REFERENCES product(id) ON DELETE SET NULL;
        CREATE INDEX idx_ingredients_product_id ON ingredients(product_id);
    END IF;
END $$;

-- Vérifier et ajouter d'autres colonnes si nécessaires
DO $$ 
BEGIN
    -- Colonne name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ingredients' AND column_name = 'name'
    ) THEN
        ALTER TABLE ingredients ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT '';
        CREATE INDEX idx_ingredients_name ON ingredients(name);
    END IF;

    -- Colonne quantity
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ingredients' AND column_name = 'quantity'
    ) THEN
        ALTER TABLE ingredients ADD COLUMN quantity DECIMAL(10, 2) NOT NULL DEFAULT 0;
    END IF;

    -- Colonne unit
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ingredients' AND column_name = 'unit'
    ) THEN
        ALTER TABLE ingredients ADD COLUMN unit VARCHAR(50) NOT NULL DEFAULT 'kg';
    END IF;

    -- Colonne created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ingredients' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE ingredients ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL;
    END IF;

    -- Colonne updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ingredients' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE ingredients ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL;
    END IF;
END $$;

-- Enable Row Level Security (RLS)
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_ingredients_updated_at ON ingredients;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
