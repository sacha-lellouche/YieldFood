# 📦 Module "Mes Stocks" - YieldFood

Module CRUD complet pour gérer les stocks d'ingrédients dans votre application YieldFood.

## 🎯 Fonctionnalités

- ✅ **Affichage des ingrédients** : Liste complète avec nom, quantité, unité et date de mise à jour
- ✅ **Ajouter un ingrédient** : Formulaire avec validation (nom, quantité, unité)
- ✅ **Modifier un ingrédient** : Édition inline avec mise à jour instantanée
- ✅ **Supprimer un ingrédient** : Suppression avec confirmation
- ✅ **Recherche** : Filtrage par nom d'ingrédient
- ✅ **Tri automatique** : Par date de mise à jour (le plus récent en premier)
- ✅ **Statistiques** : Vue d'ensemble du stock avec compteurs
- ✅ **Responsive** : Interface adaptée mobile, tablette et desktop

## 🚀 Installation & Configuration

### 1. Créer la table dans Supabase

1. Connectez-vous à votre dashboard Supabase : https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Copiez et exécutez le contenu du fichier `supabase/migrations/create_ingredients_table.sql`
5. Cliquez sur **Run** pour créer la table et les policies

### 2. Installer les dépendances

Les dépendances ont déjà été installées, mais si vous avez des problèmes :

```bash
cd frontend
npm install --legacy-peer-deps
```

### 3. Lancer l'application

```bash
cd frontend
npm run dev
```

L'application sera accessible sur : **http://localhost:3000** (ou 3001/3002 si le port est occupé)

## 📁 Structure des fichiers créés

```
frontend/
├── app/
│   ├── api/
│   │   └── ingredients/
│   │       ├── route.ts                 # GET, POST /api/ingredients
│   │       └── [id]/route.ts            # PUT, DELETE /api/ingredients/[id]
│   └── stocks/
│       └── page.tsx                     # Page principale "Mes Stocks"
├── components/
│   ├── Header.tsx                       # Navigation avec lien Stocks
│   ├── IngredientDialog.tsx             # Dialog add/edit ingrédient
│   └── ui/                              # Composants shadcn/ui
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       └── table.tsx
├── types/
│   └── ingredient.ts                    # Types TypeScript
└── lib/
    └── utils.ts                         # Utilitaires (cn helper)

supabase/
└── migrations/
    └── create_ingredients_table.sql     # Schéma SQL complet
```

## 🎨 Composants UI (shadcn/ui)

Les composants suivants ont été installés et configurés :

- **Button** : Boutons avec variants (default, outline, destructive)
- **Card** : Conteneurs avec header, content, footer
- **Dialog** : Modales pour formulaires
- **Input** : Champs de saisie stylisés
- **Label** : Labels pour formulaires
- **Select** : Menus déroulants (pour les unités)
- **Table** : Tableaux responsives

## 🔐 Sécurité

- ✅ **Row Level Security (RLS)** : Chaque utilisateur ne voit que ses propres ingrédients
- ✅ **Authentification requise** : Redirection vers /login si non connecté
- ✅ **Validation côté serveur** : Vérification des données dans les API routes
- ✅ **Validation côté client** : Feedback immédiat pour l'utilisateur

## 📊 API Routes

### GET /api/ingredients
Récupère tous les ingrédients de l'utilisateur connecté.

**Query params :**
- `search` (optional) : Filtrer par nom
- `sortBy` (optional) : Champ de tri (default: `updated_at`)
- `sortOrder` (optional) : `asc` ou `desc` (default: `desc`)

**Réponse :**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Farine",
    "quantity": 2.5,
    "unit": "kg",
    "created_at": "2025-11-13T10:00:00Z",
    "updated_at": "2025-11-13T10:00:00Z"
  }
]
```

### POST /api/ingredients
Crée un nouvel ingrédient.

**Body :**
```json
{
  "name": "Farine",
  "quantity": 2.5,
  "unit": "kg"
}
```

### PUT /api/ingredients/[id]
Met à jour un ingrédient existant.

**Body :**
```json
{
  "name": "Farine T55",
  "quantity": 3.0,
  "unit": "kg"
}
```

### DELETE /api/ingredients/[id]
Supprime un ingrédient.

## 🎯 Unités disponibles

Le composant propose les unités suivantes dans le menu déroulant :
- kg (kilogrammes)
- g (grammes)
- L (litres)
- mL (millilitres)
- pièce
- unité
- boîte
- sachet
- paquet

## 🎨 Design & UX

- **Couleurs** : Palette verte cohérente avec le thème YieldFood
- **Icons** : Lucide React pour une UI moderne
- **Animations** : Transitions fluides et feedback visuel
- **Empty states** : Messages clairs quand aucun ingrédient
- **Loading states** : Indicateurs de chargement pendant les requêtes
- **Error handling** : Messages d'erreur contextuels

## 📱 Responsive

L'interface s'adapte automatiquement :
- **Mobile** : Navigation simplifiée, boutons adaptés
- **Tablette** : Grille 2 colonnes pour les statistiques
- **Desktop** : Vue complète avec toutes les colonnes

## 🐛 Troubleshooting

### Erreur "Invalid Supabase URL"
Vérifiez que `.env.local` contient bien vos credentials Supabase.

### Erreur "Non autorisé" dans les API
1. Vérifiez que vous êtes connecté
2. Vérifiez que la table `ingredients` existe dans Supabase
3. Vérifiez que les RLS policies ont été créées

### Les changements ne s'affichent pas
1. Supprimez le cache : `rm -rf .next`
2. Relancez : `npm run dev`

## 🚀 Prochaines étapes

Pour aller plus loin, vous pouvez ajouter :
- 📊 Graphiques d'évolution des stocks
- 🔔 Alertes quand stock faible
- 📥 Import/Export CSV
- 🏷️ Catégories d'ingrédients
- 📸 Photos des ingrédients
- 📅 Date d'expiration

---

**Bon développement ! 🎉**
