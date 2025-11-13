-- 🧪 Données de test pour le module "Mes Stocks"
-- À exécuter APRÈS avoir créé la table ingredients
-- IMPORTANT : Remplacez 'YOUR_USER_ID' par votre vrai user_id

-- Pour trouver votre user_id :
-- 1. Allez dans Authentication > Users dans Supabase
-- 2. Copiez l'ID de votre utilisateur
-- 3. Remplacez 'YOUR_USER_ID' ci-dessous

-- Ingrédients de base
INSERT INTO ingredients (user_id, name, quantity, unit) VALUES
  ('YOUR_USER_ID', 'Farine', 5.0, 'kg'),
  ('YOUR_USER_ID', 'Sucre', 2.5, 'kg'),
  ('YOUR_USER_ID', 'Sel', 1.0, 'kg'),
  ('YOUR_USER_ID', 'Huile d''olive', 2.0, 'L'),
  ('YOUR_USER_ID', 'Lait', 3.0, 'L'),
  ('YOUR_USER_ID', 'Œufs', 24.0, 'pièce'),
  ('YOUR_USER_ID', 'Beurre', 500.0, 'g'),
  ('YOUR_USER_ID', 'Tomates', 3.0, 'kg'),
  ('YOUR_USER_ID', 'Oignons', 2.0, 'kg'),
  ('YOUR_USER_ID', 'Ail', 10.0, 'pièce'),
  ('YOUR_USER_ID', 'Riz', 5.0, 'kg'),
  ('YOUR_USER_ID', 'Pâtes', 3.0, 'kg'),
  ('YOUR_USER_ID', 'Levure', 100.0, 'g'),
  ('YOUR_USER_ID', 'Chocolat noir', 500.0, 'g'),
  ('YOUR_USER_ID', 'Crème fraîche', 1.0, 'L');

-- Vérification
SELECT COUNT(*) as "Nombre d'ingrédients insérés" FROM ingredients WHERE user_id = 'YOUR_USER_ID';
