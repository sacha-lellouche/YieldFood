-- Migration pour créer la table des consommations de recettes
-- Cette table permet de suivre les ventes et les pertes de recettes

-- 1. Créer la table consumptions (consommations)
CREATE TABLE IF NOT EXISTS public.consumptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  consumption_type VARCHAR(20) NOT NULL CHECK (consumption_type IN ('sale', 'loss')),
  portions DECIMAL(10, 2) NOT NULL CHECK (portions > 0),
  consumption_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Créer une table pour l'historique détaillé des impacts sur les ingrédients
CREATE TABLE IF NOT EXISTS public.consumption_ingredient_impacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consumption_id UUID NOT NULL REFERENCES public.consumptions(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  ingredient_name VARCHAR(255) NOT NULL,
  quantity_consumed DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  stock_before DECIMAL(10, 2) NOT NULL,
  stock_after DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Créer les indexes pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_consumptions_user_id ON public.consumptions(user_id);
CREATE INDEX IF NOT EXISTS idx_consumptions_recipe_id ON public.consumptions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_consumptions_date ON public.consumptions(consumption_date DESC);
CREATE INDEX IF NOT EXISTS idx_consumptions_type ON public.consumptions(consumption_type);
CREATE INDEX IF NOT EXISTS idx_consumption_impacts_consumption_id ON public.consumption_ingredient_impacts(consumption_id);
CREATE INDEX IF NOT EXISTS idx_consumption_impacts_ingredient_id ON public.consumption_ingredient_impacts(ingredient_id);

-- 4. Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_consumptions_updated_at ON public.consumptions;
CREATE TRIGGER update_consumptions_updated_at
  BEFORE UPDATE ON public.consumptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Activer Row Level Security (RLS)
ALTER TABLE public.consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_ingredient_impacts ENABLE ROW LEVEL SECURITY;

-- 6. Policies pour consumptions
DROP POLICY IF EXISTS "Users can view their own consumptions" ON public.consumptions;
CREATE POLICY "Users can view their own consumptions"
  ON public.consumptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own consumptions" ON public.consumptions;
CREATE POLICY "Users can insert their own consumptions"
  ON public.consumptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own consumptions" ON public.consumptions;
CREATE POLICY "Users can update their own consumptions"
  ON public.consumptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own consumptions" ON public.consumptions;
CREATE POLICY "Users can delete their own consumptions"
  ON public.consumptions FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Policies pour consumption_ingredient_impacts
DROP POLICY IF EXISTS "Users can view impacts of their consumptions" ON public.consumption_ingredient_impacts;
CREATE POLICY "Users can view impacts of their consumptions"
  ON public.consumption_ingredient_impacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.consumptions 
      WHERE consumptions.id = consumption_ingredient_impacts.consumption_id 
      AND consumptions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert impacts for their consumptions" ON public.consumption_ingredient_impacts;
CREATE POLICY "Users can insert impacts for their consumptions"
  ON public.consumption_ingredient_impacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.consumptions 
      WHERE consumptions.id = consumption_ingredient_impacts.consumption_id 
      AND consumptions.user_id = auth.uid()
    )
  );

-- 8. Commentaires pour documentation
COMMENT ON TABLE public.consumptions IS 'Historique des consommations de recettes (ventes et pertes)';
COMMENT ON TABLE public.consumption_ingredient_impacts IS 'Détail de l''impact de chaque consommation sur les stocks d''ingrédients';
COMMENT ON COLUMN public.consumptions.consumption_type IS 'Type de consommation: sale (vente) ou loss (perte)';
COMMENT ON COLUMN public.consumptions.portions IS 'Nombre de portions consommées';
COMMENT ON COLUMN public.consumption_ingredient_impacts.stock_before IS 'Stock avant la consommation';
COMMENT ON COLUMN public.consumption_ingredient_impacts.stock_after IS 'Stock après la consommation';
