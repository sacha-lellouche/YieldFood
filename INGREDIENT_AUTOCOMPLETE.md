# 🔍 Auto-complétion des Ingrédients

## Fonctionnalité

L'auto-complétion des ingrédients permet aux utilisateurs de :
- **Saisir rapidement** des ingrédients lors de la création de recettes
- **Voir des suggestions** automatiques en temps réel
- **Gérer singulier/pluriel** : "tomate" trouve aussi "tomates", "poireau" trouve "poireaux", etc.
- **Utiliser deux sources** : catalogue de produits et historique personnel

## Comment ça marche

### 1. Gestion Singulier/Pluriel

Le système normalise automatiquement les noms d'ingrédients selon les règles du français :

#### Règles implémentées :
- **Pluriel en -s** : `tomate` ↔ `tomates`
- **Pluriel en -x** : `poireau` ↔ `poireaux`, `chou` ↔ `choux`
- **Pluriel en -al/-aux** : `animal` ↔ `animaux`
- **Recherche bidirectionnelle** : Chercher "tomates" trouve aussi "tomate"

#### Exemples :
```typescript
"pomme"     → trouve: pomme, pommes
"poireau"   → trouve: poireau, poireaux
"chou"      → trouve: chou, choux
"tomates"   → trouve: tomates, tomate
"carottes"  → trouve: carottes, carotte
```

### 2. Sources de Suggestions

#### a) Catalogue de produits (prioritaire)
- Base de données partagée de tous les produits
- Badge vert "Catalogue"
- Contient : nom, unité, catégorie

#### b) Historique personnel
- Ingrédients déjà utilisés dans vos recettes
- Badge bleu "Historique"
- Contient : nom, unité

### 3. Ordre de Pertinence

Les suggestions sont triées par :
1. **Correspondance exacte** en premier
2. **Commence par la recherche**
3. **Catalogue avant historique**
4. **Ordre alphabétique**

## Utilisation

### Dans la création de recette

1. Commencez à taper un ingrédient : `tom`
2. Une liste de suggestions apparaît automatiquement
3. Utilisez les flèches ↑↓ pour naviguer
4. Appuyez sur **Entrée** ou cliquez pour sélectionner
5. L'unité est automatiquement remplie

### Raccourcis clavier

- **↓** : Suggestion suivante
- **↑** : Suggestion précédente
- **Entrée** : Sélectionner
- **Échap** : Fermer les suggestions

## API

### Endpoint de recherche

```typescript
GET /api/ingredients/search?q=tomate&limit=10

Response:
[
  {
    id: "uuid",
    name: "Tomate",
    unit: "kg",
    category: "Légumes",
    source: "catalog"
  },
  {
    name: "Tomates cerises",
    unit: "barquette",
    source: "history"
  }
]
```

### Paramètres

- `q` (required) : Terme de recherche (min 2 caractères)
- `limit` (optional) : Nombre max de résultats (défaut: 10)

## Composant

### IngredientAutocomplete

```tsx
import IngredientAutocomplete from '@/components/IngredientAutocomplete'

<IngredientAutocomplete
  value={ingredientName}
  onChange={(value) => setIngredientName(value)}
  onSelect={(suggestion) => {
    // Auto-remplissage de l'unité
    setUnit(suggestion.unit)
  }}
  placeholder="Nom de l'ingrédient"
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `value` | string | Valeur actuelle |
| `onChange` | (value: string) => void | Callback changement |
| `onSelect` | (suggestion) => void | Callback sélection |
| `placeholder` | string | Texte placeholder |
| `className` | string | Classes CSS |

## Performances

- **Debounce** : 300ms entre les recherches
- **Cache** : Résultats mis en cache côté client
- **Limite** : 10 suggestions max par défaut
- **Index DB** : Optimisé avec index sur `product.name` et `recipe_ingredients.ingredient_name`

## Améliorations futures

- [ ] Support des synonymes (ex: courgette/zucchini)
- [ ] Suggestions basées sur la fréquence d'utilisation
- [ ] Cache des recherches récentes
- [ ] Support multi-langue
- [ ] Suggestions contextuelles (selon la recette)
- [ ] Auto-correction des fautes de frappe
