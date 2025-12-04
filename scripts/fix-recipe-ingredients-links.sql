-- Script de migration pour lier les recipe_ingredients existants au catalogue ingredients
-- Ce script va associer automatiquement les ingrédients de recettes avec les ingrédients du catalogue
-- en se basant sur le nom et l'unité

-- 1. Vérifier l'état actuel
SELECT 
  COUNT(*) as total_recipe_ingredients,
  COUNT(ingredient_id) as avec_id,
  COUNT(*) - COUNT(ingredient_id) as sans_id
FROM recipe_ingredients;

-- 2. Lier automatiquement les recipe_ingredients sans ingredient_id
-- aux ingredients du catalogue en matchant sur le nom (insensible à la casse) et l'unité
UPDATE recipe_ingredients ri
SET ingredient_id = i.id
FROM ingredients i
WHERE 
  ri.ingredient_id IS NULL
  AND LOWER(TRIM(ri.ingredient_name)) = LOWER(TRIM(i.name))
  AND ri.unit = i.unit;

-- 3. Lier aussi en ne comparant que le nom (si l'unité ne match pas exactement)
UPDATE recipe_ingredients ri
SET ingredient_id = i.id
FROM ingredients i
WHERE 
  ri.ingredient_id IS NULL
  AND LOWER(TRIM(ri.ingredient_name)) = LOWER(TRIM(i.name))
  AND NOT EXISTS (
    -- S'assurer qu'il n'y a qu'un seul ingrédient avec ce nom
    SELECT 1 
    FROM ingredients i2 
    WHERE LOWER(TRIM(i2.name)) = LOWER(TRIM(ri.ingredient_name))
    AND i2.id != i.id
  );

-- 4. Vérifier les résultats
SELECT 
  COUNT(*) as total_recipe_ingredients,
  COUNT(ingredient_id) as avec_id,
  COUNT(*) - COUNT(ingredient_id) as sans_id
FROM recipe_ingredients;

-- 5. Lister les recipe_ingredients qui n'ont toujours pas d'ingredient_id
SELECT DISTINCT
  ri.ingredient_name,
  ri.unit,
  COUNT(*) as occurrences
FROM recipe_ingredients ri
WHERE ri.ingredient_id IS NULL
GROUP BY ri.ingredient_name, ri.unit
ORDER BY occurrences DESC;

-- 6. Pour les ingrédients restants, on peut les créer automatiquement
-- (à exécuter seulement si vous voulez créer automatiquement les ingrédients manquants)
-- ATTENTION : Cela va créer des ingrédients pour TOUS les utilisateurs
-- Si vous voulez le faire par utilisateur, il faut adapter le script

/*
INSERT INTO ingredients (user_id, name, unit, current_stock, category, created_at, updated_at)
SELECT DISTINCT
  r.user_id,
  ri.ingredient_name,
  ri.unit,
  0, -- Stock initial à 0
  'autre',
  NOW(),
  NOW()
FROM recipe_ingredients ri
JOIN recipes r ON r.id = ri.recipe_id
WHERE ri.ingredient_id IS NULL
ON CONFLICT DO NOTHING;

-- Puis relancer l'UPDATE pour lier ces nouveaux ingrédients
UPDATE recipe_ingredients ri
SET ingredient_id = i.id
FROM ingredients i
JOIN recipes r ON r.id = ri.recipe_id
WHERE 
  ri.ingredient_id IS NULL
  AND LOWER(TRIM(ri.ingredient_name)) = LOWER(TRIM(i.name))
  AND ri.unit = i.unit
  AND i.user_id = r.user_id;
*/
