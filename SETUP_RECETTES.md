# Configuration du module "Mes Recettes" ✅

## 📋 Récapitulatif des fichiers créés

### Backend (API Routes)
- ✅ `app/api/recipes/route.ts` - GET (liste) + POST (création)
- ✅ `app/api/recipes/[id]/route.ts` - GET (détail) + DELETE (suppression)
- ✅ `app/api/recipes/suggest/route.ts` - POST (suggestions IA)

### Frontend (Pages & Components)
- ✅ `app/recipes/page.tsx` - Page liste des recettes (cartes + recherche)
- ✅ `app/recipes/new/page.tsx` - Page création de recette
- ✅ `components/ui/textarea.tsx` - Composant Textarea
- ✅ `components/Header.tsx` - Navigation mise à jour (desktop + mobile)

### Types & Base de données
- ✅ `types/recipe.ts` - Interfaces TypeScript
- ✅ `supabase/migrations/create_recipes_tables.sql` - Schéma SQL

---

## 🚀 Étape 1: Exécuter la migration SQL

**IMPORTANT**: Il faut créer les tables dans Supabase avant d'utiliser le module recettes.

1. Ouvrir [Supabase Dashboard](https://app.supabase.com)
2. Sélectionner votre projet
3. Menu latéral → **SQL Editor**
4. Copier le contenu du fichier `supabase/migrations/create_recipes_tables.sql`
5. Coller dans l'éditeur et cliquer sur **Run**

Cela va créer:
- Table `recipes` (nom, description, portions, temps de préparation/cuisson)
- Table `recipe_ingredients` (jonction recette-ingrédient avec quantités)
- Vue `recipes_with_count` (recettes + nombre d'ingrédients)
- Politiques RLS (Row Level Security)

---

## 🤖 Étape 2 (Optionnel): Configurer l'IA OpenAI

### Option A: Utiliser les suggestions IA réelles

Ajouter votre clé API OpenAI dans `.env.local`:

```bash
OPENAI_API_KEY=sk-proj-...votre-clé-ici...
```

### Option B: Utiliser les suggestions mock (par défaut)

Si vous n'avez pas de clé OpenAI, le système utilise automatiquement des suggestions intelligentes basées sur des patterns:

- **Carbonara** → Pâtes, bacon, œufs, parmesan
- **Pizza** → Farine, tomate, mozzarella, huile d'olive
- **Omelette** → Œufs, beurre, sel, poivre
- **Poulet** → Poulet, oignon, ail, huile d'olive
- **Gâteau** → Farine, sucre, œufs, beurre
- **Pâtes** → Pâtes, ail, huile d'olive, parmesan
- **Salade caesar** → Laitue, poulet, parmesan, croûtons

---

## ✨ Fonctionnalités implémentées

### Page liste (`/recipes`)
- 📊 **Statistiques**: Total recettes, ingrédients, portions
- 🔍 **Recherche**: Par nom de recette
- 🗂️ **Cartes**: Design responsive avec:
  - Nombre d'ingrédients
  - Portions
  - Temps de préparation
  - Temps de cuisson
- 🗑️ **Suppression**: Avec confirmation

### Page création (`/recipes/new`)
- 📝 **Formulaire complet**:
  - Nom de la recette (requis)
  - Description (optionnel)
  - Nombre de portions
  - Temps de préparation (minutes)
  - Temps de cuisson (minutes)
  
- 🤖 **Bouton "Suggérer avec IA"**:
  - Génère automatiquement une liste d'ingrédients
  - Basé sur le nom de la recette
  - Utilise OpenAI ou des patterns intelligents
  
- 📋 **Gestion des ingrédients**:
  - Table éditable (nom, quantité, unité)
  - Boutons + et - pour ajouter/supprimer des lignes
  - Validation: au moins 1 ingrédient requis
  
- 💾 **Sauvegarde**:
  - Crée la recette + tous les ingrédients associés
  - Redirection vers `/recipes` après succès

---

## 🧪 Test du module

1. **Démarrer le serveur** (si pas déjà lancé):
```bash
npm run dev
```

2. **Naviguer vers** → http://localhost:3002/recipes

3. **Créer une recette**:
   - Cliquer sur "Créer une recette"
   - Entrer "Pâtes carbonara"
   - Cliquer sur "Suggérer avec IA"
   - Ajuster les quantités si nécessaire
   - Enregistrer

4. **Vérifier**:
   - La recette apparaît dans la liste
   - Les statistiques sont mises à jour
   - La recherche fonctionne

---

## 📊 Structure de la base de données

### Table `recipes`
```sql
id              UUID (PK)
user_id         UUID (FK → auth.users)
name            TEXT
description     TEXT (nullable)
servings        INTEGER
prep_time       INTEGER (minutes)
cook_time       INTEGER (minutes)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Table `recipe_ingredients`
```sql
id              UUID (PK)
recipe_id       UUID (FK → recipes)
ingredient_name TEXT
quantity        DECIMAL
unit            TEXT
created_at      TIMESTAMP
```

### Vue `recipes_with_count`
```sql
(Toutes les colonnes de recipes)
+ ingredient_count INTEGER
```

---

## 🔐 Sécurité (RLS)

✅ Chaque utilisateur voit uniquement **ses propres recettes**
✅ Impossible de modifier/supprimer les recettes d'autres utilisateurs
✅ Les ingrédients de recette héritent des permissions de la recette parente

---

## 🎯 Prochaines étapes suggérées

1. **Page de détail** (`/recipes/[id]`):
   - Afficher la recette complète
   - Liste des ingrédients avec quantités
   - Bouton "Modifier"

2. **Page d'édition** (`/recipes/[id]/edit`):
   - Formulaire pré-rempli
   - Modification des ingrédients existants

3. **Coûts de recette**:
   - Calculer le coût total basé sur les prix des stocks
   - Coût par portion

4. **Prévisions**:
   - Calculer les quantités d'ingrédients nécessaires
   - Vérifier si le stock est suffisant
   - Générer des commandes automatiques

---

## 🐛 Troubleshooting

### Erreur "Could not find the table 'public.recipes'"
➡️ Vous n'avez pas exécuté la migration SQL (voir Étape 1)

### Les suggestions IA ne fonctionnent pas
➡️ C'est normal si vous n'avez pas de clé OpenAI. Le système utilise les suggestions mock.

### Erreur TypeScript
➡️ Redémarrer le serveur: `npm run dev`

### Les recettes n'apparaissent pas
➡️ Vérifier que vous êtes bien connecté (les recettes sont filtrées par user_id)

---

## 📝 Notes techniques

- **Framework**: Next.js 15 (App Router)
- **Base de données**: Supabase (PostgreSQL)
- **UI**: shadcn/ui + Tailwind CSS
- **IA**: OpenAI GPT-4 (optionnel)
- **Type Safety**: TypeScript strict mode

Tout est prêt ! 🎉
