# 📡 API Documentation - Module Stocks

Documentation complète des endpoints API pour le module de gestion des stocks.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Toutes les requêtes nécessitent une session Supabase valide. Les cookies d'authentification sont automatiquement gérés par le navigateur.

---

## Endpoints

### 1. Liste des ingrédients

**GET** `/api/ingredients`

Récupère tous les ingrédients de l'utilisateur connecté.

#### Query Parameters

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `search` | string | Non | Filtre par nom (recherche partielle) |
| `sortBy` | string | Non | Champ de tri (`name`, `quantity`, `updated_at`) - Default: `updated_at` |
| `sortOrder` | string | Non | Ordre de tri (`asc`, `desc`) - Default: `desc` |

#### Exemple de requête

```bash
# Liste complète
curl http://localhost:3000/api/ingredients

# Recherche
curl http://localhost:3000/api/ingredients?search=farine

# Tri personnalisé
curl http://localhost:3000/api/ingredients?sortBy=name&sortOrder=asc
```

#### Réponse (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Farine",
    "quantity": 5.0,
    "unit": "kg",
    "created_at": "2025-11-13T10:00:00.000Z",
    "updated_at": "2025-11-13T14:30:00.000Z"
  },
  {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Sucre",
    "quantity": 2.5,
    "unit": "kg",
    "created_at": "2025-11-13T10:05:00.000Z",
    "updated_at": "2025-11-13T10:05:00.000Z"
  }
]
```

#### Codes d'erreur

- `401` : Non autorisé (pas connecté)
- `500` : Erreur serveur

---

### 2. Créer un ingrédient

**POST** `/api/ingredients`

Ajoute un nouvel ingrédient au stock.

#### Body (JSON)

```json
{
  "name": "Farine",
  "quantity": 5.0,
  "unit": "kg"
}
```

#### Validation

- `name` : string, obligatoire, non vide
- `quantity` : number, obligatoire, ≥ 0
- `unit` : string, obligatoire, non vide

#### Exemple de requête

```bash
curl -X POST http://localhost:3000/api/ingredients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Farine",
    "quantity": 5.0,
    "unit": "kg"
  }'
```

#### Réponse (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Farine",
  "quantity": 5.0,
  "unit": "kg",
  "created_at": "2025-11-13T10:00:00.000Z",
  "updated_at": "2025-11-13T10:00:00.000Z"
}
```

#### Codes d'erreur

- `400` : Validation échouée (champs manquants ou invalides)
- `401` : Non autorisé
- `500` : Erreur serveur

---

### 3. Mettre à jour un ingrédient

**PUT** `/api/ingredients/[id]`

Modifie un ingrédient existant.

#### Body (JSON)

Tous les champs sont optionnels. Seuls les champs fournis seront mis à jour.

```json
{
  "name": "Farine T55",
  "quantity": 3.0,
  "unit": "kg"
}
```

#### Exemple de requête

```bash
# Modifier la quantité uniquement
curl -X PUT http://localhost:3000/api/ingredients/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"quantity": 3.0}'

# Modifier plusieurs champs
curl -X PUT http://localhost:3000/api/ingredients/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Farine T55",
    "quantity": 3.0
  }'
```

#### Réponse (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Farine T55",
  "quantity": 3.0,
  "unit": "kg",
  "created_at": "2025-11-13T10:00:00.000Z",
  "updated_at": "2025-11-13T14:30:00.000Z"
}
```

#### Codes d'erreur

- `400` : Validation échouée ou aucune donnée à mettre à jour
- `401` : Non autorisé
- `404` : Ingrédient non trouvé
- `500` : Erreur serveur

---

### 4. Supprimer un ingrédient

**DELETE** `/api/ingredients/[id]`

Supprime un ingrédient du stock.

#### Exemple de requête

```bash
curl -X DELETE http://localhost:3000/api/ingredients/550e8400-e29b-41d4-a716-446655440000
```

#### Réponse (200 OK)

```json
{
  "message": "Ingrédient supprimé avec succès"
}
```

#### Codes d'erreur

- `401` : Non autorisé
- `500` : Erreur serveur

---

## Exemples JavaScript/TypeScript

### Avec fetch (navigateur)

```typescript
// Récupérer tous les ingrédients
const ingredients = await fetch('/api/ingredients')
  .then(res => res.json())

// Ajouter un ingrédient
const newIngredient = await fetch('/api/ingredients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Farine',
    quantity: 5.0,
    unit: 'kg'
  })
}).then(res => res.json())

// Modifier un ingrédient
const updated = await fetch(`/api/ingredients/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ quantity: 3.0 })
}).then(res => res.json())

// Supprimer un ingrédient
await fetch(`/api/ingredients/${id}`, {
  method: 'DELETE'
})
```

### Avec gestion d'erreurs

```typescript
async function addIngredient(data: { name: string; quantity: number; unit: string }) {
  try {
    const response = await fetch('/api/ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors de l\'ajout')
    }

    return await response.json()
  } catch (error) {
    console.error('Erreur:', error)
    throw error
  }
}
```

---

## Sécurité

### Row Level Security (RLS)

Toutes les requêtes sont automatiquement filtrées par `user_id` grâce aux policies Supabase :

- Les utilisateurs ne peuvent voir que leurs propres ingrédients
- Les utilisateurs ne peuvent modifier/supprimer que leurs propres ingrédients
- Impossible d'accéder aux données d'un autre utilisateur

### Validation

- **Côté serveur** : Validation complète de toutes les données
- **Côté client** : Validation préalable pour UX rapide
- **Types TypeScript** : Typage fort pour éviter les erreurs

---

## Rate Limiting

Actuellement aucune limite n'est appliquée. Pour la production, considérer :

- Limitation par IP
- Limitation par utilisateur
- Cache côté serveur

---

## Webhooks

Pour recevoir des notifications lors de changements :

1. Créer une fonction Supabase Edge Function
2. Écouter les événements INSERT/UPDATE/DELETE sur la table `ingredients`
3. Déclencher vos webhooks personnalisés

---

## Support

Pour toute question sur l'API, ouvrir une issue GitHub ou contacter l'équipe de développement.
