# Correctif : Liaison Recettes → Ingrédients → Consommations

## 🔍 Problème identifié

Les consommations de recettes n'affichaient pas les détails des ingrédients consommés et ne déduisaient pas les stocks, car les `recipe_ingredients` n'étaient pas liés au catalogue `ingredients`.

### Causes
1. Le formulaire de création de recette ne sauvegardait pas l'`ingredient_id` lors de la sélection d'un ingrédient
2. Le formulaire d'édition de recette avait le même problème
3. Les recettes existantes ont été créées sans liens vers le catalogue

## ✅ Corrections apportées

### 1. Formulaire de création de recette (`app/recipes/new/page.tsx`)

**Changement 1 : Sauvegarde de l'ingredient_id**
```typescript
const handleIngredientSelect = (index: number, suggestion: any) => {
  const updated = [...ingredients]
  updated[index] = {
    ...updated[index],
    ingredientId: suggestion.id, // ✅ Nouveau : Sauvegarder l'ID
    ingredientName: suggestion.name,
    unit: suggestion.unit
  }
  setIngredients(updated)
}
```

**Changement 2 : Envoi de l'ingredient_id à l'API**
```typescript
ingredients: validIngredients.map(ing => ({
  ingredient_id: ing.ingredientId || null, // ✅ Nouveau : Envoyer l'ID
  ingredient_name: ing.ingredientName.trim(),
  quantity: ing.quantity,
  unit: ing.unit
}))
```

### 2. Formulaire d'édition de recette (`app/recipes/[id]/page.tsx`)

**Changement 1 : Interface mise à jour**
```typescript
interface RecipeIngredient {
  id?: string
  ingredient_id?: string | null // ✅ Nouveau champ
  ingredient_name: string
  quantity: number
  unit: string
}
```

**Changement 2 : Même corrections que pour la création**
- Sauvegarde de l'`ingredient_id` dans `handleIngredientSelect`
- Envoi de l'`ingredient_id` lors de la mise à jour

### 3. Outil de réparation automatique

**Nouvelle API : `/api/recipes/fix-ingredients`**
- Route POST pour réparer automatiquement les liens
- Compare les noms et unités pour faire les associations
- Retourne le nombre de liens créés et les ingrédients manquants

**Nouvelle page : `/debug-consommations`**
- Interface graphique pour exécuter la réparation
- Affiche les résultats et les instructions
- Liste les ingrédients manquants dans le catalogue

### 4. Scripts SQL de maintenance

**`scripts/fix-recipe-ingredients-links.sql`**
- Script SQL pour réparer les liens directement dans la base de données
- Peut être exécuté manuellement si nécessaire

**`scripts/debug-consumptions.sql`**
- Requêtes de diagnostic pour vérifier l'état des données
- Utile pour comprendre les problèmes

## 🚀 Comment utiliser

### Pour les nouvelles recettes
1. Lors de la création/édition, tapez le nom de l'ingrédient
2. Sélectionnez l'ingrédient depuis l'autocomplétion
3. L'ingrédient sera automatiquement lié au catalogue ✅

### Pour les recettes existantes
1. Allez sur `/debug-consommations`
2. Cliquez sur "Réparer maintenant"
3. Le système va lier automatiquement les ingrédients
4. Si des ingrédients manquent, ajoutez-les au catalogue
5. Relancez la réparation

## 📊 Fonctionnement des consommations

### Avant validation
```
Recette : Pâtes à la sauce tomate (2 portions)
Ingrédients calculés :
  - Pâtes : -200g (Stock: 500g → 300g) ✅
  - Sel : -5g (Stock: 100g → 95g) ✅
  - Huile : -20ml (Stock: 15ml → -5ml) ⚠️ Insuffisant
  - Sauce tomate : -100g (Stock: 200g → 100g) ✅
```

### Après validation
1. ✅ Création d'une entrée `consumptions`
2. ✅ Création d'entrées `consumption_ingredient_impacts` pour chaque ingrédient
3. ✅ Mise à jour des stocks dans `ingredients`
4. ✅ Affichage dans l'historique avec détail des impacts

## 🔐 Architecture de la base de données

```
recipes
  ├─ recipe_ingredients
  │    ├─ ingredient_id → ingredients (NOUVELLE LIAISON)
  │    └─ ingredient_name (fallback)
  │
  └─ consumptions
       └─ consumption_ingredient_impacts
            ├─ ingredient_id → ingredients
            ├─ quantity_consumed
            ├─ stock_before
            └─ stock_after
```

## ⚠️ Points importants

1. **Toujours utiliser l'autocomplétion** lors de la création de recettes
2. Les ingrédients doivent exister dans le catalogue pour que les consommations fonctionnent
3. Si un ingrédient n'est pas dans le catalogue, il peut être ajouté depuis "Gestion des Stocks"
4. L'outil de réparation peut être relancé plusieurs fois sans danger

## 🧪 Tests recommandés

1. ✅ Créer une nouvelle recette avec des ingrédients du catalogue
2. ✅ Déclarer une consommation de cette recette
3. ✅ Vérifier que les impacts s'affichent correctement
4. ✅ Valider et vérifier que les stocks sont déduits
5. ✅ Consulter l'historique des consommations

## 📝 Fichiers modifiés

- `app/recipes/new/page.tsx` - Formulaire de création
- `app/recipes/[id]/page.tsx` - Formulaire d'édition
- `app/api/recipes/fix-ingredients/route.ts` - API de réparation (nouveau)
- `app/debug-consommations/page.tsx` - Page de maintenance (nouveau)
- `scripts/fix-recipe-ingredients-links.sql` - Script SQL (nouveau)
- `scripts/debug-consumptions.sql` - Requêtes de diagnostic (nouveau)

## 🎯 Résultat attendu

Désormais, lorsque vous déclarez avoir consommé **2 portions de pâtes à la sauce tomate** :

1. ✅ Le système calcule automatiquement les quantités de chaque ingrédient
2. ✅ La colonne "Ingrédients consommés" affiche le détail complet
3. ✅ À la validation, les stocks de tous les ingrédients sont déduits
4. ✅ L'historique conserve la trace des impacts sur chaque ingrédient

---

**Date de la correction** : 4 décembre 2025
**Version** : 1.0
