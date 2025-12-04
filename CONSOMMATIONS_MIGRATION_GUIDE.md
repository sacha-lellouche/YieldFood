# Migration "Mes Consommations" - Instructions d'exécution

## 📋 Résumé

Cette migration ajoute le module "Mes consommations" à votre schéma Supabase existant avec un minimum de modifications.

## 🎯 Ce qui est créé

1. **Table `consumptions`** - Enregistrements des ventes et pertes
2. **Table `consumption_ingredient_impacts`** - Historique des impacts sur les stocks
3. **Index optimisés** - Pour les requêtes rapides
4. **Politiques RLS** - Sécurité au niveau ligne
5. **Trigger `updated_at`** - Mise à jour automatique des timestamps

## ⚙️ Intégration avec votre schéma existant

### Tables réutilisées (sans modification) :
- ✅ `recipes` - Lien via `recipe_id`
- ✅ `ingredients` - Lien via `ingredient_id`
- ✅ Colonne `current_stock` dans `ingredients` (déjà existante)
- ✅ Colonne `servings` dans `recipes` (déjà existante)

### Compatibilité :
- ✅ Suit les mêmes conventions de nommage que votre schéma
- ✅ Utilise les mêmes types de données (uuid, timestamp with time zone, etc.)
- ✅ Cohérent avec votre structure `stock_movements`
- ✅ RLS activé comme vos autres tables

## 🚀 Instructions d'exécution

### Option 1 : Via Supabase Dashboard (Recommandé)

1. Connectez-vous à votre [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **New Query**
5. Copiez-collez le contenu complet du fichier :
   ```
   supabase/migrations/07_create_consumptions_optimized.sql
   ```
6. Cliquez sur **Run** (ou Ctrl/Cmd + Enter)
7. Vérifiez que le message indique : **Success. No rows returned**

### Option 2 : Via Supabase CLI

```bash
# Si vous utilisez la CLI Supabase
cd YieldFood
supabase db push

# Ou exécutez directement le fichier
supabase db execute --file ./supabase/migrations/07_create_consumptions_optimized.sql
```

## ✅ Vérification post-migration

Exécutez cette requête dans le SQL Editor pour vérifier :

```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('consumptions', 'consumption_ingredient_impacts');

-- Vérifier les politiques RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('consumptions', 'consumption_ingredient_impacts');

-- Vérifier les index
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('consumptions', 'consumption_ingredient_impacts');
```

Vous devriez voir :
- ✅ 2 tables
- ✅ 6 politiques RLS (4 pour consumptions, 2 pour impacts)
- ✅ 6 index

## 🔄 Rollback (si nécessaire)

Si vous devez annuler la migration :

```sql
-- Supprimer les tables (CASCADE supprime aussi les politiques et index)
DROP TABLE IF EXISTS public.consumption_ingredient_impacts CASCADE;
DROP TABLE IF EXISTS public.consumptions CASCADE;

-- Supprimer la fonction trigger si elle n'est pas utilisée ailleurs
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## 📊 Exemple de données après migration

Après votre première consommation, voici ce que vous verrez :

```sql
-- Voir vos consommations
SELECT * FROM public.consumptions WHERE user_id = auth.uid();

-- Voir les impacts détaillés
SELECT 
  c.consumption_date,
  r.name as recipe_name,
  c.consumption_type,
  c.portions,
  i.name as ingredient_name,
  ci.quantity_consumed,
  ci.stock_before,
  ci.stock_after
FROM public.consumptions c
JOIN public.consumption_ingredient_impacts ci ON ci.consumption_id = c.id
JOIN public.recipes r ON r.id = c.recipe_id
JOIN public.ingredients i ON i.id = ci.ingredient_id
WHERE c.user_id = auth.uid()
ORDER BY c.consumption_date DESC;
```

## 🐛 Dépannage

### Erreur : "relation already exists"
- Les tables existent déjà, pas besoin de réexécuter
- Ou utilisez `DROP TABLE ... CASCADE` puis réexécutez

### Erreur : "foreign key constraint"
- Vérifiez que les tables `recipes` et `ingredients` existent
- Vérifiez que vous avez des recettes créées

### Erreur : "permission denied"
- Vérifiez que vous êtes connecté en tant qu'admin
- Dans Dashboard, vous avez automatiquement les permissions

## 📝 Notes importantes

1. **Pas de perte de données** : Cette migration n'affecte aucune donnée existante
2. **Performance** : Les index sont optimisés pour les requêtes fréquentes
3. **Sécurité** : RLS garantit l'isolation des données entre utilisateurs
4. **Évolutivité** : Structure prête pour des statistiques futures

## 🎉 Une fois terminé

Vous pouvez :
1. Accéder à `/consommations` dans votre application
2. Créer votre première vente ou perte
3. Voir le stock se mettre à jour automatiquement
4. Consulter l'historique complet

---

**Fichiers modifiés dans le code :**
- ✅ `types/consumption.ts` - Types TypeScript
- ✅ `app/api/consumptions/route.ts` - API endpoints
- ✅ `app/consommations/page.tsx` - Interface utilisateur
- ✅ `components/Header.tsx` - Navigation

**Prêt à exécuter !** 🚀
