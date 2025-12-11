-- Migration pour ajouter une catégorie personnalisée aux stocks
-- Permet à chaque utilisateur de personnaliser la catégorie d'un produit sans modifier le catalogue global

-- Ajouter la colonne category_override à la table stock
ALTER TABLE public.stock 
ADD COLUMN IF NOT EXISTS category_override text;

-- Créer un index pour faciliter les requêtes par catégorie
CREATE INDEX IF NOT EXISTS idx_stock_category_override ON public.stock(category_override);

-- Note: La catégorie affichée sera category_override si définie, sinon product.category
