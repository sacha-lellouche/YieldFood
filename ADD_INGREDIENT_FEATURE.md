# ➕ Ajout d'ingrédients personnalisés

## Fonctionnalité

Quand un utilisateur tape un ingrédient qui n'existe pas dans le catalogue, il peut maintenant l'ajouter directement via un bouton "Ajouter".

## Comment ça marche

### 1. Détection automatique
- L'utilisateur tape un ingrédient (min. 2 caractères)
- Si aucun résultat n'est trouvé après 300ms
- Un bouton **"Ajouter [nom]"** apparaît automatiquement

### 2. Création de l'ingrédient
Quand l'utilisateur clique sur "Ajouter", un dialog s'ouvre avec :
- **Nom** : Pré-rempli avec ce qui a été tapé
- **Unité** : À sélectionner (g, kg, ml, l, pièce, etc.)
- **Catégorie** : Optionnel (Légumes, Épices, etc.)

### 3. Ajout au catalogue
- L'ingrédient est ajouté à la table `product`
- Il devient disponible pour tous
- Il apparaît dans les recherches futures
- L'auto-complétion le sélectionne automatiquement après création

## Où c'est disponible

✅ **Page de gestion des stocks** (`/stocks`)
- Lors de l'ajout d'un produit au stock
- Le bouton "Ajouter" apparaît si le produit n'existe pas

✅ **Page de création de recette** (`/recipes/new`)
- Lors de l'ajout d'un ingrédient
- Peut être activé/désactivé avec `showAddButton={false}`

## Raccourcis clavier

- **Entrée** : Si pas de résultats, ouvre le dialog d'ajout
- **Échap** : Ferme le dialog

## Exemple d'utilisation

```tsx
<IngredientAutocomplete
  value={ingredientName}
  onChange={setIngredientName}
  onSelect={(suggestion) => {
    // Sélection d'un ingrédient existant
    setIngredientId(suggestion.id)
    setUnit(suggestion.unit)
  }}
  onAddNew={(name) => {
    // Ouverture du dialog pour créer un nouvel ingrédient
    console.log('Créer:', name)
  }}
  showAddButton={true} // Active le bouton (true par défaut)
/>
```

## Composants

### IngredientAutocomplete
- Props : `value`, `onChange`, `onSelect`, `onAddNew`, `showAddButton`
- Affiche automatiquement le bouton si pas de résultats

### AddIngredientDialog
- Props : `open`, `onOpenChange`, `initialName`, `onSuccess`
- Formulaire complet pour créer un ingrédient
- Validation et gestion des erreurs

## API

### POST /api/products
Crée un nouveau produit dans le catalogue.

**Body:**
```json
{
  "name": "Tomate ancienne",
  "unit": "kg",
  "category": "Légumes",
  "description": "Description optionnelle"
}
```

**Validation:**
- Nom et unité requis
- Vérifie que le produit n'existe pas déjà
- Normalise les espaces

**Response:**
```json
{
  "id": "uuid",
  "name": "Tomate ancienne",
  "unit": "kg",
  "category": "Légumes",
  "created_at": "2025-11-20T..."
}
```

## Avantages

✨ **UX fluide** : Pas besoin de quitter le formulaire
✨ **Moins d'étapes** : Création en 1 clic
✨ **Catalogue enrichi** : Les utilisateurs contribuent
✨ **Pas de doublons** : Vérification automatique
✨ **Contextuel** : Le nom est pré-rempli
