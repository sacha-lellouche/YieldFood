# 🎯 Ajout d'ingrédient avec sélection depuis le catalogue produit

## Fonctionnalité implémentée

Le composant `IngredientDialog` a été amélioré pour permettre aux utilisateurs de **choisir un produit depuis le catalogue** (`product` table) lors de l'ajout d'un nouvel ingrédient, au lieu de saisir manuellement toutes les informations.

## 📋 Fichiers modifiés/créés

### 1. **Nouvelle route API** - `/app/api/products/route.ts`
- **Endpoint**: `GET /api/products`
- **Fonction**: Récupère tous les produits disponibles dans le catalogue
- **Paramètres optionnels**:
  - `?search=tomate` - Recherche par nom de produit
  - `?category=Légumes` - Filtre par catégorie

### 2. **Composant mis à jour** - `/components/IngredientDialog.tsx`
**Nouvelles fonctionnalités**:
- ✅ **Mode "Catalogue"**: Sélectionner un produit existant depuis la base de données
- ✅ **Mode "Manuel"**: Saisir manuellement (ancien comportement)
- ✅ **Recherche de produits**: Champ de recherche pour filtrer les produits
- ✅ **Auto-complétion**: Quand un produit est sélectionné, nom et unité sont pré-remplis
- ✅ **Bascule entre modes**: Boutons pour choisir le mode de saisie

## 🎨 Interface utilisateur

### Mode Catalogue (par défaut)
```
┌─────────────────────────────────────┐
│ 📦 Catalogue  |  ✏️ Manuel           │ <- Toggle buttons
├─────────────────────────────────────┤
│ Rechercher un produit               │
│ [Tomate, Farine...]         [🔍]    │
├─────────────────────────────────────┤
│ Produit                             │
│ [▼ Sélectionner un produit]         │
├─────────────────────────────────────┤
│ Quantité         | Unité            │
│ [0.00]          | kg (auto)         │
├─────────────────────────────────────┤
│ [Annuler]              [Ajouter]    │
└─────────────────────────────────────┘
```

### Mode Manuel
```
┌─────────────────────────────────────┐
│ 📦 Catalogue  |  ✏️ Manuel           │
├─────────────────────────────────────┤
│ Nom de l'ingrédient                 │
│ [Ex: Farine, Tomates...]            │
├─────────────────────────────────────┤
│ Quantité         | Unité            │
│ [0.00]          | [▼ kg]            │
├─────────────────────────────────────┤
│ [Annuler]              [Ajouter]    │
└─────────────────────────────────────┘
```

## 🔄 Flux d'utilisation

### Scénario 1: Ajout avec produit du catalogue

1. Utilisateur clique sur "Ajouter un ingrédient"
2. **Mode "Catalogue" activé par défaut**
3. (Optionnel) Utilisateur tape "tomate" dans la recherche et clique 🔍
4. Utilisateur sélectionne "Tomate (kg)" dans le dropdown
5. → **Nom et unité se remplissent automatiquement**
6. Utilisateur saisit la quantité (ex: 5)
7. Clique sur "Ajouter"
8. → Un stock est créé avec `product_id` pointant vers le produit

### Scénario 2: Ajout manuel (comme avant)

1. Utilisateur clique sur "Ajouter un ingrédient"
2. Utilisateur clique sur "✏️ Manuel"
3. Saisit nom, quantité, unité manuellement
4. Clique sur "Ajouter"
5. → Ancien comportement (crée un ingredient sans product_id)

### Scénario 3: Modification d'un ingrédient existant

1. Utilisateur clique sur modifier
2. **Mode manuel forcé** (pas de changement de produit possible)
3. Peut modifier nom, quantité, unité
4. Clique sur "Modifier"

## 🔌 API appelée lors de l'ajout

### Mode Catalogue
```javascript
POST /api/ingredients
{
  "product_id": "uuid-du-produit",  // ← ID du produit sélectionné
  "quantity": 5
}
```

### Mode Manuel
```javascript
POST /api/ingredients
{
  "name": "Tomate",
  "quantity": 5,
  "unit": "kg"
}
```

## 🛠️ Modifications nécessaires dans l'API `/api/ingredients/route.ts`

L'API doit être adaptée pour supporter le nouveau champ `product_id`:

```typescript
// POST /api/ingredients
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { product_id, name, quantity, unit } = body

  let insertData
  
  if (product_id) {
    // Mode catalogue: utiliser le produit existant
    insertData = {
      user_id: user.id,
      product_id: product_id,
      quantity: quantity,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  } else {
    // Mode manuel: créer avec nom/unité
    insertData = {
      user_id: user.id,
      name: name,
      quantity: quantity,
      unit: unit,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  const { data, error } = await supabase
    .from('ingredients')
    .insert(insertData)
    .select()
    .single()
  
  // ...
}
```

## 🗄️ Structure de données

### Si utilisation du catalogue (recommandé pour nouvelle architecture)

**Table `stock`** au lieu de `ingredients`:
```sql
CREATE TABLE stock (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES product(id),
  quantity DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  CONSTRAINT unique_user_product UNIQUE (user_id, product_id)
);
```

### Si garde de l'ancienne table `ingredients`

Ajouter une colonne optionnelle `product_id`:
```sql
ALTER TABLE ingredients 
ADD COLUMN product_id UUID REFERENCES product(id);
```

## ✨ Avantages de cette approche

✅ **Cohérence des données**: Nom et unité standardisés  
✅ **Gain de temps**: Pas besoin de retaper les infos  
✅ **Moins d'erreurs**: Pas de fautes de frappe  
✅ **Traçabilité**: Lien direct avec le catalogue produit  
✅ **Flexibilité**: Mode manuel toujours disponible  
✅ **UX améliorée**: Recherche et sélection intuitive  

## 🔍 Points d'attention

1. **Migration progressive**: Le mode manuel permet de garder la compatibilité avec l'ancien système
2. **Gestion des doublons**: Si vous avez "Tomate" en manuel ET dans le catalogue
3. **Produits manquants**: Certains produits peuvent ne pas être dans le catalogue
4. **Catégories**: Affichées dans le dropdown pour aider l'utilisateur

## 🧪 Tests recommandés

1. ✅ Créer un ingrédient depuis le catalogue
2. ✅ Créer un ingrédient en mode manuel
3. ✅ Rechercher un produit avant sélection
4. ✅ Basculer entre les deux modes
5. ✅ Modifier un ingrédient existant
6. ✅ Vérifier que l'unité est bien pré-remplie depuis le produit
7. ✅ Tester avec un catalogue vide
8. ✅ Tester la recherche avec aucun résultat

## 📝 TODO / Améliorations futures

- [ ] Ajouter un bouton "Créer nouveau produit" dans le dialogue
- [ ] Permettre de changer le produit lors de la modification
- [ ] Afficher l'image du produit si disponible
- [ ] Filtrer par catégorie dans le dropdown
- [ ] Auto-complétion temps réel (debounced search)
- [ ] Afficher la description du produit
- [ ] Suggérer des produits similaires

---

**Date**: 13 novembre 2025  
**Version**: 1.0
