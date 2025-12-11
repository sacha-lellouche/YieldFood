-- Migration optimisée pour intégrer "Mes consommations" dans le schéma existant
-- À exécuter dans le SQL Editor de Supabase Dashboard

-- 1. Créer la table consumptions
CREATE TABLE IF NOT EXISTS public.consumptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recipe_id uuid NOT NULL,
  consumption_type character varying NOT NULL CHECK (consumption_type IN ('sale', 'loss')),
  portions numeric NOT NULL CHECK (portions > 0),
  consumption_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT consumptions_pkey PRIMARY KEY (id),
  CONSTRAINT consumptions_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE
);

-- 2. Créer la table consumption_ingredient_impacts
-- Réutilise la logique de stock_movements pour la cohérence
CREATE TABLE IF NOT EXISTS public.consumption_ingredient_impacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  consumption_id uuid NOT NULL,
  ingredient_id uuid NOT NULL,
  quantity_consumed numeric NOT NULL,
  stock_before numeric NOT NULL,
  stock_after numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT consumption_ingredient_impacts_pkey PRIMARY KEY (id),
  CONSTRAINT consumption_ingredient_impacts_consumption_id_fkey FOREIGN KEY (consumption_id) REFERENCES public.consumptions(id) ON DELETE CASCADE,
  CONSTRAINT consumption_ingredient_impacts_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE
);

-- 3. Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_consumptions_user_id ON public.consumptions(user_id);
CREATE INDEX IF NOT EXISTS idx_consumptions_recipe_id ON public.consumptions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_consumptions_date ON public.consumptions(consumption_date DESC);
CREATE INDEX IF NOT EXISTS idx_consumptions_type ON public.consumptions(consumption_type);
CREATE INDEX IF NOT EXISTS idx_consumption_impacts_consumption_id ON public.consumption_ingredient_impacts(consumption_id);
CREATE INDEX IF NOT EXISTS idx_consumption_impacts_ingredient_id ON public.consumption_ingredient_impacts(ingredient_id);

-- 4. Activer Row Level Security (RLS)
ALTER TABLE public.consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_ingredient_impacts ENABLE ROW LEVEL SECURITY;

-- 5. Créer les politiques RLS pour consumptions
CREATE POLICY "Users can view their own consumptions"
  ON public.consumptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consumptions"
  ON public.consumptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consumptions"
  ON public.consumptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consumptions"
  ON public.consumptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Créer les politiques RLS pour consumption_ingredient_impacts
CREATE POLICY "Users can view impacts of their own consumptions"
  ON public.consumption_ingredient_impacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.consumptions
      WHERE consumptions.id = consumption_ingredient_impacts.consumption_id
      AND consumptions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert impacts for their own consumptions"
  ON public.consumption_ingredient_impacts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.consumptions
      WHERE consumptions.id = consumption_ingredient_impacts.consumption_id
      AND consumptions.user_id = auth.uid()
    )
  );

-- 7. Créer un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_consumptions_updated_at
  BEFORE UPDATE ON public.consumptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Commentaires pour la documentation
COMMENT ON TABLE public.consumptions IS 'Enregistrement des ventes et pertes de recettes avec déduction automatique du stock d''ingrédients';
COMMENT ON TABLE public.consumption_ingredient_impacts IS 'Historique détaillé des impacts sur le stock d''ingrédients lors d''une consommation';
COMMENT ON COLUMN public.consumptions.consumption_type IS 'Type de consommation: sale (vente) ou loss (perte)';
COMMENT ON COLUMN public.consumptions.portions IS 'Nombre de portions consommées (peut être décimal)';
COMMENT ON COLUMN public.consumption_ingredient_impacts.stock_before IS 'Stock avant la consommation';
COMMENT ON COLUMN public.consumption_ingredient_impacts.stock_after IS 'Stock après la consommation';

-- Fin de la migration
