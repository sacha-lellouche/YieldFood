-- Script de diagnostic pour comprendre le problème des consommations

-- 1. Vérifier les recettes et leurs ingrédients
SELECT 
  r.id as recipe_id,
  r.name as recipe_name,
  ri.ingredient_id,
  ri.ingredient_name,
  ri.quantity,
  ri.unit,
  CASE 
    WHEN ri.ingredient_id IS NULL THEN 'NON LIEN AU CATALOGUE'
    ELSE 'LIEN OK'
  END as statut
FROM recipes r
LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
ORDER BY r.name, ri.ingredient_name;

-- 2. Vérifier les consommations existantes
SELECT 
  c.id as consumption_id,
  c.consumption_date,
  c.consumption_type,
  c.portions,
  r.name as recipe_name,
  COUNT(cii.id) as nombre_impacts
FROM consumptions c
LEFT JOIN recipes r ON r.id = c.recipe_id
LEFT JOIN consumption_ingredient_impacts cii ON cii.consumption_id = c.id
GROUP BY c.id, c.consumption_date, c.consumption_type, c.portions, r.name
ORDER BY c.consumption_date DESC;

-- 3. Détail des impacts d'une consommation spécifique
SELECT 
  c.consumption_date,
  r.name as recipe_name,
  i.name as ingredient_name,
  cii.quantity_consumed,
  i.unit,
  cii.stock_before,
  cii.stock_after
FROM consumptions c
JOIN recipes r ON r.id = c.recipe_id
LEFT JOIN consumption_ingredient_impacts cii ON cii.consumption_id = c.id
LEFT JOIN ingredients i ON i.id = cii.ingredient_id
ORDER BY c.consumption_date DESC, i.name;

-- 4. Vérifier les ingrédients dans le catalogue
SELECT 
  id,
  name,
  unit,
  current_stock
FROM ingredients
ORDER BY name;

-- 5. Compter les recipe_ingredients avec et sans ingredient_id
SELECT 
  COUNT(*) as total,
  COUNT(ingredient_id) as avec_id,
  COUNT(*) - COUNT(ingredient_id) as sans_id
FROM recipe_ingredients;
