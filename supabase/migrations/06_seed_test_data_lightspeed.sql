-- Seed Data pour Tester le Système Lightspeed
-- Exécutez ce script APRÈS avoir appliqué la migration 05_lightspeed_integration.sql

-- ATTENTION: Remplacez 'YOUR_USER_ID' par votre UUID utilisateur réel
-- Pour obtenir votre user_id:
-- SELECT id FROM auth.users LIMIT 1;

DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID'; -- ⚠️ REMPLACER ICI
  v_recipe_panini UUID;
  v_recipe_burger UUID;
  v_recipe_frites UUID;
  v_ingredient_pain_panini UUID;
  v_ingredient_tomate UUID;
  v_ingredient_mozzarella UUID;
  v_ingredient_courgette UUID;
  v_ingredient_aubergine UUID;
  v_ingredient_basilic UUID;
  v_ingredient_pain_burger UUID;
  v_ingredient_steak UUID;
  v_ingredient_salade UUID;
  v_ingredient_pomme_terre UUID;
BEGIN

  -- ==================== CRÉER LES INGRÉDIENTS ====================
  
  -- Ingrédients pour Panini
  INSERT INTO public.ingredients (user_id, name, quantity, unit, current_stock, minimum_stock, alert_threshold)
  VALUES 
    (v_user_id, 'Pain panini', 0, 'unité', 50, 10, 15),
    (v_user_id, 'Tomate', 0, 'grammes', 2000, 500, 800),
    (v_user_id, 'Mozzarella', 0, 'grammes', 1500, 300, 500),
    (v_user_id, 'Courgette', 0, 'grammes', 1000, 200, 400),
    (v_user_id, 'Aubergine', 0, 'grammes', 800, 200, 350),
    (v_user_id, 'Basilic', 0, 'grammes', 200, 50, 80)
  RETURNING id INTO v_ingredient_pain_panini;

  SELECT id INTO v_ingredient_tomate FROM public.ingredients WHERE name = 'Tomate' AND user_id = v_user_id;
  SELECT id INTO v_ingredient_mozzarella FROM public.ingredients WHERE name = 'Mozzarella' AND user_id = v_user_id;
  SELECT id INTO v_ingredient_courgette FROM public.ingredients WHERE name = 'Courgette' AND user_id = v_user_id;
  SELECT id INTO v_ingredient_aubergine FROM public.ingredients WHERE name = 'Aubergine' AND user_id = v_user_id;
  SELECT id INTO v_ingredient_basilic FROM public.ingredients WHERE name = 'Basilic' AND user_id = v_user_id;

  -- Ingrédients pour Burger
  INSERT INTO public.ingredients (user_id, name, quantity, unit, current_stock, minimum_stock, alert_threshold)
  VALUES 
    (v_user_id, 'Pain burger', 0, 'unité', 100, 20, 30),
    (v_user_id, 'Steak haché', 0, 'grammes', 3000, 500, 800),
    (v_user_id, 'Salade', 0, 'grammes', 1000, 200, 350)
  RETURNING id INTO v_ingredient_pain_burger;

  SELECT id INTO v_ingredient_steak FROM public.ingredients WHERE name = 'Steak haché' AND user_id = v_user_id;
  SELECT id INTO v_ingredient_salade FROM public.ingredients WHERE name = 'Salade' AND user_id = v_user_id;

  -- Ingrédients pour Frites
  INSERT INTO public.ingredients (user_id, name, quantity, unit, current_stock, minimum_stock, alert_threshold)
  VALUES 
    (v_user_id, 'Pomme de terre', 0, 'grammes', 5000, 1000, 1500)
  RETURNING id INTO v_ingredient_pomme_terre;

  RAISE NOTICE '✅ Ingrédients créés';

  -- ==================== CRÉER LES RECETTES ====================

  -- Recette: Panini Végétarien
  INSERT INTO public.recipes (user_id, name, description, servings, prep_time, cook_time, sku, is_active)
  VALUES (
    v_user_id,
    'Panini Végétarien',
    'Délicieux panini avec légumes grillés et mozzarella',
    1,
    10,
    5,
    'PAN-001',
    true
  )
  RETURNING id INTO v_recipe_panini;

  -- Ingrédients du Panini
  INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, ingredient_name, quantity, unit)
  VALUES
    (v_recipe_panini, v_ingredient_pain_panini, 'Pain panini', 1, 'unité'),
    (v_recipe_panini, v_ingredient_tomate, 'Tomate', 50, 'grammes'),
    (v_recipe_panini, v_ingredient_mozzarella, 'Mozzarella', 40, 'grammes'),
    (v_recipe_panini, v_ingredient_courgette, 'Courgette', 30, 'grammes'),
    (v_recipe_panini, v_ingredient_aubergine, 'Aubergine', 30, 'grammes'),
    (v_recipe_panini, v_ingredient_basilic, 'Basilic', 5, 'grammes');

  RAISE NOTICE '✅ Recette Panini créée avec SKU: PAN-001';

  -- Recette: Burger Classic
  INSERT INTO public.recipes (user_id, name, description, servings, prep_time, cook_time, sku, is_active)
  VALUES (
    v_user_id,
    'Burger Classic',
    'Burger classique avec steak, salade, tomate',
    1,
    15,
    10,
    'BUR-001',
    true
  )
  RETURNING id INTO v_recipe_burger;

  -- Ingrédients du Burger
  INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, ingredient_name, quantity, unit)
  VALUES
    (v_recipe_burger, v_ingredient_pain_burger, 'Pain burger', 1, 'unité'),
    (v_recipe_burger, v_ingredient_steak, 'Steak haché', 120, 'grammes'),
    (v_recipe_burger, v_ingredient_salade, 'Salade', 20, 'grammes'),
    (v_recipe_burger, v_ingredient_tomate, 'Tomate', 30, 'grammes');

  RAISE NOTICE '✅ Recette Burger créée avec SKU: BUR-001';

  -- Recette: Frites Maison
  INSERT INTO public.recipes (user_id, name, description, servings, prep_time, cook_time, sku, is_active)
  VALUES (
    v_user_id,
    'Frites Maison',
    'Frites fraîches faites maison',
    1,
    5,
    10,
    'FRI-001',
    true
  )
  RETURNING id INTO v_recipe_frites;

  -- Ingrédients des Frites
  INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, ingredient_name, quantity, unit)
  VALUES
    (v_recipe_frites, v_ingredient_pomme_terre, 'Pomme de terre', 200, 'grammes');

  RAISE NOTICE '✅ Recette Frites créée avec SKU: FRI-001';

  -- ==================== RÉSUMÉ ====================

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SEED DATA CRÉÉ AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Ingrédients créés: 9';
  RAISE NOTICE '🍽️  Recettes créées: 3';
  RAISE NOTICE '';
  RAISE NOTICE 'SKUs Lightspeed configurés:';
  RAISE NOTICE '  - PAN-001 : Panini Végétarien';
  RAISE NOTICE '  - BUR-001 : Burger Classic';
  RAISE NOTICE '  - FRI-001 : Frites Maison';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Stocks initiaux:';
  RAISE NOTICE '  - Pain panini: 50 unités (min: 10)';
  RAISE NOTICE '  - Pain burger: 100 unités (min: 20)';
  RAISE NOTICE '  - Tomate: 2000g (min: 500g)';
  RAISE NOTICE '  - Pomme de terre: 5000g (min: 1000g)';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Vous pouvez maintenant tester avec:';
  RAISE NOTICE '  npm run test:lightspeed';
  RAISE NOTICE '';

END $$;

-- Vérification finale
SELECT 
  'Recettes' as type,
  COUNT(*) as count,
  STRING_AGG(sku, ', ') as skus
FROM recipes 
WHERE sku IS NOT NULL
UNION ALL
SELECT 
  'Ingrédients',
  COUNT(*),
  STRING_AGG(name, ', ')
FROM ingredients 
WHERE current_stock > 0;
