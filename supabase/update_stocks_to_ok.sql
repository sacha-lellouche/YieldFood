-- Script SQL pour mettre tous les stocks à un niveau "ok"
-- À exécuter dans l'éditeur SQL de Supabase

-- Met à jour tous les stocks qui sont à 0 ou bas
-- Stock en rupture (0) -> 50 unités
-- Stock bas (< seuil) -> seuil + 10 unités
-- Stock ok -> inchangé

UPDATE stock
SET quantity = CASE
  -- Si le stock est à 0, mettre à 50
  WHEN quantity = 0 THEN 50
  
  -- Si le stock est en dessous du seuil du produit, mettre à seuil + 10
  WHEN quantity < COALESCE(
    (SELECT low_stock_threshold FROM product WHERE product.id = stock.product_id),
    10
  ) THEN COALESCE(
    (SELECT low_stock_threshold FROM product WHERE product.id = stock.product_id),
    10
  ) + 10
  
  -- Sinon, garder la quantité actuelle
  ELSE quantity
END
WHERE quantity < COALESCE(
  (SELECT low_stock_threshold FROM product WHERE product.id = stock.product_id),
  10
);

-- Vérifier les résultats
SELECT 
  p.name as produit,
  s.quantity as quantite_actuelle,
  p.low_stock_threshold as seuil,
  p.unit as unite,
  CASE
    WHEN s.quantity = 0 THEN '🔴 Rupture'
    WHEN s.quantity < p.low_stock_threshold THEN '🟠 Bas'
    ELSE '🟢 Ok'
  END as statut
FROM stock s
JOIN product p ON s.product_id = p.id
ORDER BY 
  CASE
    WHEN s.quantity = 0 THEN 1
    WHEN s.quantity < p.low_stock_threshold THEN 2
    ELSE 3
  END,
  p.name;
