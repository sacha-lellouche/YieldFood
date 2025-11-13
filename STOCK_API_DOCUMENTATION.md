# API de Gestion des Stocks - Documentation

## Vue d'ensemble

Ce module permet de gérer dynamiquement les quantités de produits dans le stock des utilisateurs. Il sépare les concepts de **produit** (catalogue) et **stock** (inventaire utilisateur).

## Structure de la base de données

### Table `product`
```sql
CREATE TABLE public.product (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  category TEXT NULL,
  CONSTRAINT product_pkey PRIMARY KEY (id)
);
```

### Table `stock`
```sql
CREATE TABLE public.stock (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT stock_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_product UNIQUE (user_id, product_id),
  CONSTRAINT stock_product_id_fkey FOREIGN KEY (product_id) 
    REFERENCES product (id) ON DELETE CASCADE
);
```

## Routes API

### 1. Ajuster par ID de produit (Recommandé)

**Endpoint:** `PATCH /api/stock/[productId]/adjust`

**Avantages:**
- Plus rapide (pas de recherche par nom)
- Plus précis
- Plus efficace

**Body:**
```json
{
  "quantity": 5  // Positif = ajout, Négatif = retrait
}
```

**Exemples:**

```typescript
// Ajouter 5 kg de tomates
await fetch('/api/stock/550e8400-e29b-41d4-a716-446655440000/adjust', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ quantity: 5 })
})

// Retirer 2 unités de laitue
await fetch('/api/stock/550e8400-e29b-41d4-a716-446655440001/adjust', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ quantity: -2 })
})
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Ajouté 5 kg de Tomate",
  "product": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Tomate",
    "unit": "kg"
  },
  "stock": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid",
    "product_id": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 15,
    "created_at": "2025-11-13T10:00:00Z",
    "updated_at": "2025-11-13T14:30:00Z"
  },
  "previousQuantity": 10,
  "newQuantity": 15,
  "adjustment": 5
}
```

### 2. Ajuster par nom de produit

**Endpoint:** `PATCH /api/stock/update-quantity`

**Utilisation:** Quand vous connaissez uniquement le nom du produit

**Body:**
```json
{
  "productName": "Tomate",
  "deltaQuantity": 5,
  "isAddition": true
}
```

**Exemples:**

```typescript
// Ajouter 5 kg de tomates après une commande
await fetch('/api/stock/update-quantity', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productName: "Tomate",
    deltaQuantity: 5,
    isAddition: true
  })
})

// Retirer 2 unités de laitue après une vente
await fetch('/api/stock/update-quantity', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productName: "Laitue",
    deltaQuantity: 2,
    isAddition: false
  })
})
```

## Règles métier

### Sécurité
- ✅ Un utilisateur ne peut modifier que **son propre stock** (filtré par `user_id`)
- ✅ L'authentification est requise pour toutes les opérations
- ✅ Les contraintes de base de données empêchent les doublons (`unique_user_product`)

### Validations
- ✅ La quantité ne peut pas devenir négative
- ✅ La quantité doit être un nombre valide
- ✅ Le produit doit exister dans la table `product`
- ✅ Pour un retrait, le stock doit exister et être suffisant

### Comportements
- ✅ Le champ `updated_at` est automatiquement mis à jour
- ✅ Si le stock n'existe pas et qu'on fait un ajout, il est créé
- ✅ Si le stock n'existe pas et qu'on fait un retrait, une erreur est retournée

## Utilisation du composant React

### Composant `StockQuantityAdjuster`

```tsx
import { StockQuantityAdjuster } from '@/components/StockQuantityAdjuster'

function MyStockPage() {
  const stock = {
    id: '...',
    user_id: '...',
    product_id: '550e8400-e29b-41d4-a716-446655440000',
    quantity: 10,
    created_at: '...',
    updated_at: '...',
    product: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Tomate',
      unit: 'kg',
      description: null,
      created_at: '...',
      category: 'Légumes'
    }
  }

  return (
    <StockQuantityAdjuster 
      stock={stock}
      onAdjustmentComplete={(response) => {
        console.log('Ajustement réussi!', response)
        // Rafraîchir la liste, afficher une notification, etc.
      }}
    />
  )
}
```

## Gestion des erreurs

### Erreur 400 - Quantité insuffisante
```json
{
  "error": "Quantité insuffisante",
  "details": "Stock actuel: 3 kg. Impossible de retirer 5 kg.",
  "currentQuantity": 3,
  "requestedAdjustment": -5
}
```

### Erreur 400 - Stock inexistant
```json
{
  "error": "Stock inexistant",
  "details": "Impossible de retirer du stock pour un produit non présent dans votre inventaire."
}
```

### Erreur 404 - Produit introuvable
```json
{
  "error": "Produit \"Tomate\" introuvable"
}
```

### Erreur 401 - Non autorisé
```json
{
  "error": "Non autorisé"
}
```

## Tests recommandés

### Test 1: Ajouter au stock existant
```bash
curl -X PATCH http://localhost:3001/api/stock/{productId}/adjust \
  -H "Content-Type: application/json" \
  -d '{"quantity": 5}'
```

### Test 2: Retirer du stock
```bash
curl -X PATCH http://localhost:3001/api/stock/{productId}/adjust \
  -H "Content-Type: application/json" \
  -d '{"quantity": -2}'
```

### Test 3: Créer un nouveau stock
```bash
curl -X PATCH http://localhost:3001/api/stock/{productId}/adjust \
  -H "Content-Type: application/json" \
  -d '{"quantity": 10}'
```

### Test 4: Tentative de retrait avec quantité insuffisante
```bash
curl -X PATCH http://localhost:3001/api/stock/{productId}/adjust \
  -H "Content-Type: application/json" \
  -d '{"quantity": -1000}'
```

## Migration depuis l'ancienne structure

Si vous utilisez actuellement la table `ingredients`, voici un script de migration :

```sql
-- 1. Créer les tables product et stock
-- (Utiliser les CREATE TABLE ci-dessus)

-- 2. Migrer les données
INSERT INTO product (id, name, unit, created_at)
SELECT 
  gen_random_uuid(),
  DISTINCT name,
  unit,
  MIN(created_at)
FROM ingredients
GROUP BY name, unit;

INSERT INTO stock (user_id, product_id, quantity, created_at, updated_at)
SELECT 
  i.user_id,
  p.id,
  i.quantity,
  i.created_at,
  i.updated_at
FROM ingredients i
JOIN product p ON p.name = i.name AND p.unit = i.unit;

-- 3. Vérifier les données
SELECT COUNT(*) FROM product;
SELECT COUNT(*) FROM stock;
```

## Performance

- **Index recommandés:**
  ```sql
  CREATE INDEX idx_stock_user_id ON stock(user_id);
  CREATE INDEX idx_stock_product_id ON stock(product_id);
  CREATE INDEX idx_product_name ON product(name);
  ```

- **Contrainte UNIQUE** sur `(user_id, product_id)` empêche les doublons et améliore les performances des requêtes

## Support

Pour toute question ou problème, consultez :
- Les types TypeScript dans `/types/stock.ts`
- Les routes API dans `/app/api/stock/`
- Le composant React dans `/components/StockQuantityAdjuster.tsx`
