# 🔄 Migration vers architecture Stock/Product

## Vue d'ensemble

Le système a été migré pour utiliser **uniquement** les tables `product` et `stock` de Supabase, **abandonnant complètement** la table `ingredients`.

## Architecture

### Tables Supabase

#### 1. **Table `product`** (Catalogue global)
- **Rôle** : Catalogue de tous les produits disponibles
- **Propriétaire** : Système (partagé entre tous les utilisateurs)
- **Colonnes** :
  - `id` : UUID (PK)
  - `name` : Nom du produit
  - `description` : Description (nullable)
  - `unit` : Unité de mesure (kg, L, pièce, etc.)
  - `category` : Catégorie (nullable)
  - `created_at` : Date de création

#### 2. **Table `stock`** (Inventaire utilisateur)
- **Rôle** : Stocks personnels de chaque utilisateur
- **Propriétaire** : Par utilisateur (RLS activé sur `user_id`)
- **Colonnes** :
  - `id` : UUID (PK)
  - `user_id` : UUID (FK vers auth.users)
  - `product_id` : UUID (FK vers product)
  - `quantity` : Nombre décimal
  - `created_at` : Date de création
  - `updated_at` : Date de mise à jour

### Flux de données

```
┌─────────────────┐
│     PRODUCT     │ ← Catalogue global (lecture seule pour users)
│   (Catalogue)   │
└────────┬────────┘
         │
         │ FK: product_id
         │
         ▼
┌─────────────────┐
│      STOCK      │ ← Inventaire personnel (CRUD par user)
│  (Inventaire)   │
└─────────────────┘
```

## Composants Frontend

### 1. **StockDialog** (`/components/StockDialog.tsx`)
Remplace l'ancien `IngredientDialog`.

**Modes** :
- **Ajout** : Sélection d'un produit du catalogue + quantité
- **Édition** : Modification de la quantité d'un stock existant

**Fonctionnalités** :
- Recherche inline dans le catalogue produit
- Filtrage en temps réel
- Affichage de l'unité et catégorie
- Validation des données

### 2. **Page Stocks** (`/app/stocks/page.tsx`)
Interface principale de gestion des stocks.

**Fonctionnalités** :
- Liste des stocks avec infos produit (jointure)
- Statistiques (total, stock bas, rupture)
- Recherche par nom ou catégorie
- Ajustement rapide +/- 1
- Édition et suppression
- Indicateurs visuels de statut

## API Endpoints

### GET `/api/stock`
Récupère tous les stocks de l'utilisateur avec les infos des produits.

**Query params** :
- `search` : Filtrer par nom ou catégorie
- `category` : Filtrer par catégorie spécifique
- `lowStock` : Seuil pour stock bas

**Response** :
```typescript
StockWithProduct[] = [
  {
    id: string
    user_id: string
    product_id: string
    quantity: number
    created_at: string
    updated_at: string
    product: {
      id: string
      name: string
      description: string | null
      unit: string
      category: string | null
      created_at: string
    }
  }
]
```

### POST `/api/stock`
Crée un nouveau stock.

**Body** :
```json
{
  "product_id": "uuid",
  "quantity": 10.5
}
```

**Validations** :
- Vérifie que le produit existe
- Empêche les doublons (un seul stock par produit/utilisateur)
- Quantité >= 0

### PATCH `/api/stock/[productId]/adjust`
Ajuste la quantité d'un stock existant.

**Body** :
```json
{
  "quantity": 5  // Positif = ajouter, Négatif = retirer
}
```

**Exemples** :
- `{ "quantity": 5 }` → Ajoute 5 unités
- `{ "quantity": -2 }` → Retire 2 unités

### DELETE `/api/stock?id=xxx`
Supprime un stock.

**Query params** :
- `id` : ID du stock à supprimer

## Types TypeScript

Définis dans `/types/stock.ts` :

```typescript
export interface Product {
  id: string
  name: string
  description: string | null
  unit: string
  category: string | null
  created_at: string
}

export interface Stock {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
}

export interface StockWithProduct extends Stock {
  product: Product
}
```

## Fichiers obsolètes

Ces fichiers ne sont **plus utilisés** et peuvent être supprimés :

- ❌ `/components/IngredientDialog.tsx`
- ❌ `/app/api/ingredients/route.ts`
- ❌ `/app/api/ingredients/[id]/route.ts`
- ❌ `/types/ingredient.ts`
- ❌ `/app/stocks/page_old.tsx` (backup de l'ancienne version)
- ❌ `/supabase/migrations/*ingredients*.sql`

## Migration des données

Si vous aviez des données dans la table `ingredients`, il faut les migrer :

```sql
-- 1. Créer des produits pour chaque ingrédient unique
INSERT INTO product (name, unit, description)
SELECT DISTINCT name, unit, NULL
FROM ingredients
ON CONFLICT DO NOTHING;

-- 2. Créer des stocks en liant aux produits
INSERT INTO stock (user_id, product_id, quantity)
SELECT 
  i.user_id,
  p.id as product_id,
  i.quantity
FROM ingredients i
JOIN product p ON i.name = p.name AND i.unit = p.unit
ON CONFLICT DO NOTHING;

-- 3. (Optionnel) Supprimer la table ingredients
DROP TABLE IF EXISTS ingredients CASCADE;
```

## Avantages de la nouvelle architecture

### ✅ Normalisation
- Un seul produit = une seule entrée dans `product`
- Pas de duplication du nom/unité dans chaque stock

### ✅ Catalogue centralisé
- Ajout facile de nouveaux produits pour tous
- Cohérence des noms et unités
- Possibilité d'enrichir (descriptions, images, etc.)

### ✅ Séparation des préoccupations
- `product` : Définition du produit (what)
- `stock` : Quantité possédée (how much)

### ✅ Flexibilité
- Facile d'ajouter des features (prix, fournisseurs, etc.)
- Statistiques globales sur les produits populaires
- Suggestions basées sur le catalogue

## Prochaines étapes possibles

1. **Gestion des catégories** : Créer une table `category` séparée
2. **Historique** : Tracker les mouvements de stock
3. **Alertes** : Notifications pour stock bas
4. **Partage** : Listes de courses générées depuis les stocks
5. **Analytics** : Consommation moyenne, prévisions

## Note importante

⚠️ **La table `ingredients` n'est plus utilisée !** Toutes les références à cette table ont été supprimées du code. Le système fonctionne maintenant exclusivement avec `product` (catalogue) et `stock` (inventaire).
