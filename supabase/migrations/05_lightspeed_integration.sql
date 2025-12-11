-- Migration pour l'intégration Lightspeed
-- Ajoute les colonnes et tables nécessaires pour la synchronisation

-- 1. Ajouter les colonnes SKU et gestion de stock aux recettes
ALTER TABLE public.recipes 
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Modifier la table ingredients pour ajouter les colonnes de gestion de stock
ALTER TABLE public.ingredients 
  ADD COLUMN IF NOT EXISTS current_stock DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minimum_stock DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS alert_threshold DECIMAL(10, 2) DEFAULT 0;

-- 3. Créer la table stock_movements pour la traçabilité
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  movement_type VARCHAR(50) NOT NULL, -- 'sale', 'manual_adjustment', 'inventory', 'waste', 'return'
  quantity_change DECIMAL(10, 2) NOT NULL, -- Négatif = sortie, Positif = entrée
  stock_before DECIMAL(10, 2) NOT NULL,
  stock_after DECIMAL(10, 2) NOT NULL,
  reference_type VARCHAR(50), -- 'lightspeed_sale', 'manual', 'recipe_production'
  reference_id VARCHAR(255), -- saleID de Lightspeed ou autre référence
  reference_order VARCHAR(255), -- orderNumber de Lightspeed
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Créer la table sync_logs pour suivre les synchronisations Lightspeed
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sync_type VARCHAR(50) NOT NULL, -- 'webhook', 'manual_sync', 'cron'
  status VARCHAR(50) NOT NULL, -- 'success', 'error', 'partial'
  lightspeed_sale_id VARCHAR(100) UNIQUE NOT NULL, -- Pour éviter les doublons
  lightspeed_order_number VARCHAR(100),
  sale_date TIMESTAMP WITH TIME ZONE,
  items_count INT DEFAULT 0,
  ingredients_updated INT DEFAULT 0,
  error_message TEXT,
  request_payload JSONB, -- Stockage du JSON Lightspeed complet
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. Créer la table stock_alerts pour gérer les alertes de réapprovisionnement
CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  alert_type VARCHAR(50) NOT NULL, -- 'low_stock', 'out_of_stock', 'negative_stock'
  current_stock DECIMAL(10, 2) NOT NULL,
  minimum_stock DECIMAL(10, 2) NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. Créer les indexes pour les performances
CREATE INDEX IF NOT EXISTS idx_recipes_sku ON public.recipes(sku);
CREATE INDEX IF NOT EXISTS idx_ingredients_current_stock ON public.ingredients(current_stock);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ingredient_id ON public.stock_movements(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference_id ON public.stock_movements(reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sale_id ON public.sync_logs(lightspeed_sale_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON public.sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_ingredient_id ON public.stock_alerts(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_is_resolved ON public.stock_alerts(is_resolved);

-- 7. Trigger pour stock_alerts updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stock_alerts_updated_at ON public.stock_alerts;
CREATE TRIGGER update_stock_alerts_updated_at
  BEFORE UPDATE ON public.stock_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Activer RLS sur les nouvelles tables
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- 9. Policies pour stock_movements
CREATE POLICY "Users can view their own stock movements"
  ON public.stock_movements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 10. Policies pour sync_logs
CREATE POLICY "Users can view their own sync logs"
  ON public.sync_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs"
  ON public.sync_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync logs"
  ON public.sync_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- 11. Policies pour stock_alerts
CREATE POLICY "Users can view their own stock alerts"
  ON public.stock_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock alerts"
  ON public.stock_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock alerts"
  ON public.stock_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock alerts"
  ON public.stock_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- 12. Fonction pour créer automatiquement des alertes quand le stock est bas
CREATE OR REPLACE FUNCTION check_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le stock passe en dessous du minimum et qu'il n'y a pas d'alerte non résolue
  IF NEW.current_stock <= NEW.minimum_stock THEN
    INSERT INTO public.stock_alerts (
      ingredient_id,
      user_id,
      alert_type,
      current_stock,
      minimum_stock,
      is_resolved
    )
    SELECT 
      NEW.id,
      NEW.user_id,
      CASE 
        WHEN NEW.current_stock <= 0 THEN 'out_of_stock'
        WHEN NEW.current_stock < 0 THEN 'negative_stock'
        ELSE 'low_stock'
      END,
      NEW.current_stock,
      NEW.minimum_stock,
      false
    WHERE NOT EXISTS (
      SELECT 1 FROM public.stock_alerts 
      WHERE ingredient_id = NEW.id 
      AND is_resolved = false
    );
  END IF;
  
  -- Si le stock remonte au-dessus du minimum, résoudre les alertes
  IF NEW.current_stock > NEW.minimum_stock THEN
    UPDATE public.stock_alerts 
    SET is_resolved = true, 
        resolved_at = now(),
        updated_at = now()
    WHERE ingredient_id = NEW.id 
    AND is_resolved = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_stock_alert ON public.ingredients;
CREATE TRIGGER trigger_check_stock_alert
  AFTER UPDATE OF current_stock ON public.ingredients
  FOR EACH ROW
  EXECUTE FUNCTION check_stock_alert();

-- 13. Commentaires pour documentation
COMMENT ON TABLE public.stock_movements IS 'Historique de tous les mouvements de stock avec traçabilité complète';
COMMENT ON TABLE public.sync_logs IS 'Logs de synchronisation avec Lightspeed pour éviter les doublons et tracer les erreurs';
COMMENT ON TABLE public.stock_alerts IS 'Alertes de réapprovisionnement générées automatiquement';
COMMENT ON COLUMN public.recipes.sku IS 'SKU Lightspeed pour identifier la recette lors des ventes';
COMMENT ON COLUMN public.ingredients.current_stock IS 'Stock actuel en temps réel';
COMMENT ON COLUMN public.ingredients.minimum_stock IS 'Seuil minimum avant alerte de réapprovisionnement';
