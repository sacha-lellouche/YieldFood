-- Ajouter le champ low_stock_threshold à la table product
ALTER TABLE product
ADD COLUMN IF NOT EXISTS low_stock_threshold DECIMAL(10, 2) DEFAULT 5;

COMMENT ON COLUMN product.low_stock_threshold IS 'Seuil en dessous duquel le stock est considéré comme faible';
