# 🚀 Guide de Migration Base de Données - YieldFood

## 📊 Situation actuelle

Votre base de données contient :
- ✅ `ingredients` (id: bigint, created_at)
- ✅ `product` (id: uuid, name, description, unit, category)
- ✅ `stock` (id: uuid, user_id, product_id, quantity)

## 🎯 Objectif

Créer une nouvelle structure pour le module "Mes Recettes" :
- `ingredients` (refactorisé avec UUID et user_id)
- `recipes` (nouvelles recettes)
- `recipe_ingredients` (relation recette-ingrédient)

---

## ⚠️ IMPORTANT : Sauvegarde

Avant de continuer, **faites une sauvegarde** dans Supabase :
1. Dashboard → Database → Backups
2. Ou exportez vos données si elles sont importantes

---

## 📝 Ordre d'exécution des migrations

### Étape 1 : Recréer la table `ingredients`

**Fichier :** `00_fix_ingredients_table.sql`

⚠️ **Attention :** Ce script **supprime** l'ancienne table `ingredients` (avec id: bigint) et la recrée avec UUID.

**Si vous avez des données dans `ingredients`**, sauvegardez-les d'abord :

```sql
-- Exécutez ceci AVANT la migration pour sauvegarder
CREATE TABLE ingredients_backup AS SELECT * FROM public.ingredients;
```

Ensuite, exécutez tout le contenu de `00_fix_ingredients_table.sql`.

---

### Étape 2 : Créer les tables recipes

**Fichier :** `04_create_all_recipes_tables.sql`

Exécutez ce fichier après l'Étape 1. Il crée :
- Table `recipes`
- Table `recipe_ingredients` 
- Vue `recipes_with_ingredient_count`
- Toutes les policies RLS

---

## ✅ Vérification

Après avoir exécuté les deux scripts, vérifiez que tout fonctionne :

```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ingredients', 'recipes', 'recipe_ingredients');

-- Vérifier les policies RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('ingredients', 'recipes', 'recipe_ingredients');
```

Vous devriez voir :
- ✅ 3 tables créées
- ✅ 12 policies RLS (4 par table)

---

## 🔄 Alternative : Garder votre structure actuelle

Si vous voulez garder vos tables `product` et `stock` **ET** utiliser le nouveau module recettes, vous pouvez :

1. **Ne pas toucher** à la table `ingredients` actuelle
2. Créer de nouvelles tables : `ingredients_v2`, `recipes`, `recipe_ingredients`
3. Modifier le code de l'application pour utiliser `ingredients_v2`

Dans ce cas, dites-le moi et je modifierai les fichiers en conséquence ! 🔧

---

## 🆘 En cas de problème

### Erreur : "relation already exists"
➡️ Ajoutez `IF NOT EXISTS` ou supprimez d'abord : `DROP TABLE IF EXISTS xxx CASCADE;`

### Erreur : "column user_id does not exist"
➡️ Le problème vient des policies RLS. Vérifiez que la table est bien créée d'abord.

### Erreur : "foreign key constraint"
➡️ Assurez-vous d'exécuter `00_fix_ingredients_table.sql` AVANT `04_create_all_recipes_tables.sql`

---

## 📞 Questions fréquentes

**Q : Vais-je perdre mes données dans `product` et `stock` ?**  
R : Non ! Ces tables ne sont pas touchées par les migrations.

**Q : Pourquoi recréer `ingredients` ?**  
R : L'ancienne table utilise `bigint` comme id, mais notre code utilise `UUID`. C'est incompatible.

**Q : Puis-je annuler les changements ?**  
R : Oui, si vous avez fait une sauvegarde, vous pouvez restaurer avec :
```sql
DROP TABLE public.ingredients CASCADE;
CREATE TABLE public.ingredients AS SELECT * FROM ingredients_backup;
```

---

## 🎉 Après la migration

Une fois les migrations exécutées avec succès :

1. Redémarrez votre serveur : `npm run dev`
2. Allez sur http://localhost:3002/recipes
3. Testez la création d'une recette
4. Vérifiez que les suggestions IA fonctionnent

Tout devrait fonctionner ! 🚀
