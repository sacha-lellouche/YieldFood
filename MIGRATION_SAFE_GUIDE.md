# 🛡️ GUIDE DE MIGRATION SÉCURISÉE - YieldFood

## ✅ Migration avec sauvegarde des données

J'ai créé une migration **sécurisée** qui préserve vos données.

---

## 📝 Ordre d'exécution (SIMPLE - 2 étapes)

### ✅ ÉTAPE 1 : Migrer la table ingredients avec sauvegarde

**Fichier :** `SAFE_00_migrate_ingredients.sql`

Ce script va :
1. 💾 **Sauvegarder** l'ancienne table → `ingredients_backup`
2. 🗑️ Supprimer l'ancienne table `ingredients`
3. ✨ Créer la nouvelle table avec UUID
4. 🔐 Ajouter les policies RLS
5. 📊 (Optionnel) Restaurer les anciennes données si elles avaient un `user_id`

**Exécutez le contenu complet de ce fichier dans Supabase SQL Editor.**

---

### ✅ ÉTAPE 2 : Créer les tables recipes

**Fichier :** `04_create_all_recipes_tables.sql`

Ce script crée :
- 📋 Table `recipes` (vos recettes)
- 🥗 Table `recipe_ingredients` (ingrédients par recette)
- 📊 Vue `recipes_with_ingredient_count` (statistiques)
- 🔐 Toutes les policies RLS

**Exécutez le contenu complet de ce fichier après l'Étape 1.**

---

## 🔍 Vérification après migration

Dans Supabase SQL Editor, vérifiez que tout est OK :

```sql
-- 1. Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ingredients', 'ingredients_backup', 'recipes', 'recipe_ingredients');

-- Résultat attendu : 4 tables

-- 2. Vérifier le contenu de la sauvegarde
SELECT COUNT(*) as "Nombre de lignes sauvegardées" 
FROM ingredients_backup;

-- 3. Vérifier les policies RLS
SELECT tablename, COUNT(*) as policies_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('ingredients', 'recipes', 'recipe_ingredients')
GROUP BY tablename;

-- Résultat attendu : 
-- ingredients: 4 policies
-- recipes: 4 policies
-- recipe_ingredients: 4 policies
```

---

## 🎯 Après la migration réussie

1. **Tester l'application** :
   ```bash
   npm run dev
   ```

2. **Aller sur** : http://localhost:3002/stocks
   - Créer un nouvel ingrédient (ça devrait fonctionner !)

3. **Aller sur** : http://localhost:3002/recipes
   - Créer une nouvelle recette
   - Tester les suggestions IA

---

## 📦 Restaurer les anciennes données (si nécessaire)

Si votre ancienne table `ingredients_backup` contenait des données avec un `user_id`, vous pouvez les restaurer.

**Dans Supabase SQL Editor, exécutez :**

```sql
-- Vérifier d'abord la structure de la sauvegarde
SELECT * FROM ingredients_backup LIMIT 5;

-- Si elle contient : user_id, name, quantity, unit
-- Alors restaurez avec :
INSERT INTO public.ingredients (user_id, name, quantity, unit, created_at)
SELECT 
  user_id::uuid,  -- Convertir en UUID si nécessaire
  name::varchar(255),
  quantity::decimal(10,2),
  COALESCE(unit, 'kg')::varchar(50),
  created_at
FROM ingredients_backup
WHERE user_id IS NOT NULL;
```

---

## 🆘 Troubleshooting

### ❌ Erreur : "relation ingredients already exists"
```sql
-- Solution : Forcer la suppression
DROP TABLE IF EXISTS public.ingredients CASCADE;
-- Puis relancez la migration
```

### ❌ Erreur : "column user_id does not exist" (dans ingredients_backup)
➡️ Normal ! Votre ancienne table n'avait pas de `user_id`.  
➡️ Les nouvelles données créées via l'app auront automatiquement un `user_id`.

### ❌ Erreur : "foreign key constraint"
➡️ Exécutez bien `SAFE_00_migrate_ingredients.sql` AVANT `04_create_all_recipes_tables.sql`

---

## 📊 Structure finale de la base de données

Après migration, vous aurez :

```
✅ ingredients (nouvelle structure UUID)
   ├── id: UUID
   ├── user_id: UUID
   ├── name: VARCHAR(255)
   ├── quantity: DECIMAL(10,2)
   ├── unit: VARCHAR(50)
   ├── created_at: TIMESTAMP
   └── updated_at: TIMESTAMP

✅ recipes
   ├── id: UUID
   ├── user_id: UUID
   ├── name: VARCHAR(255)
   ├── description: TEXT
   ├── servings: INT
   ├── prep_time: INT
   ├── cook_time: INT
   ├── created_at: TIMESTAMP
   └── updated_at: TIMESTAMP

✅ recipe_ingredients
   ├── id: UUID
   ├── recipe_id: UUID (FK → recipes)
   ├── ingredient_id: UUID (FK → ingredients, nullable)
   ├── ingredient_name: VARCHAR(255)
   ├── quantity: DECIMAL(10,2)
   ├── unit: VARCHAR(50)
   └── created_at: TIMESTAMP

💾 ingredients_backup (sauvegarde de l'ancienne table)
   └── Vos anciennes données

✅ product (inchangé)
✅ stock (inchangé)
```

---

## ✨ Prêt à migrer ?

**Ouvrez Supabase Dashboard → SQL Editor**

1. Copiez le contenu de `SAFE_00_migrate_ingredients.sql`
2. Cliquez sur **Run**
3. Attendez le succès ✅
4. Copiez le contenu de `04_create_all_recipes_tables.sql`
5. Cliquez sur **Run**
6. Attendez le succès ✅

**C'est tout ! 🎉**

---

## 🔄 Rollback (annuler la migration)

Si vous voulez revenir en arrière :

```sql
-- Supprimer les nouvelles tables
DROP TABLE IF EXISTS public.recipe_ingredients CASCADE;
DROP TABLE IF EXISTS public.recipes CASCADE;
DROP TABLE IF EXISTS public.ingredients CASCADE;

-- Restaurer l'ancienne table
ALTER TABLE ingredients_backup RENAME TO ingredients;
```

Vos données dans `product` et `stock` ne sont **jamais touchées**. 🛡️
