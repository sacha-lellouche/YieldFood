# Changelog - YieldFood

Toutes les modifications notables du projet sont documentées ici.

## [1.1.0] - 2025-11-13

### ✨ Ajouté

#### Module "Mes Stocks" (Gestion des Ingrédients)
- **Frontend**
  - Nouvelle page `/stocks` avec interface complète
  - Tableau responsive affichant nom, quantité, unité, date de MAJ
  - Dialog pour ajouter/modifier des ingrédients
  - Recherche en temps réel par nom
  - Tri automatique par date de mise à jour
  - Statistiques de stock (total, unités différentes, dernière MAJ)
  - Empty states et loading states
  - Confirmation avant suppression

- **Backend**
  - API `GET /api/ingredients` avec recherche et tri
  - API `POST /api/ingredients` pour créer un ingrédient
  - API `PUT /api/ingredients/[id]` pour modifier
  - API `DELETE /api/ingredients/[id]` pour supprimer
  - Validation complète côté serveur
  - Protection par authentification

- **Base de données**
  - Table `ingredients` avec RLS
  - Policies de sécurité par utilisateur
  - Trigger auto pour `updated_at`
  - Indexes pour performances

- **Composants UI (shadcn/ui)**
  - Button avec variants
  - Card (header, content, footer)
  - Dialog pour modales
  - Input stylisé
  - Label pour formulaires
  - Select avec menu déroulant
  - Table responsive

- **Navigation**
  - Header mis à jour avec lien "Mes Stocks"
  - Navigation responsive mobile/desktop

- **Documentation**
  - `QUICKSTART.md` - Guide de démarrage rapide
  - `STOCKS_MODULE.md` - Documentation complète du module
  - `API_DOCUMENTATION.md` - Documentation API
  - `DELIVERY_SUMMARY.md` - Récapitulatif de livraison
  - `supabase/migrations/seed_test_data.sql` - Données de test
  - README.md mis à jour

### 🔧 Modifié
- Configuration TypeScript pour support des path aliases `@/*`
- Installation de nouvelles dépendances :
  - `clsx` - Utilitaire pour classes CSS
  - `tailwind-merge` - Merge de classes Tailwind
  - `class-variance-authority` - Variants de composants
  - `lucide-react` - Icons
  - `@radix-ui/*` - Primitives UI

### 🔐 Sécurité
- Row Level Security (RLS) sur la table ingredients
- Validation des inputs côté serveur et client
- Protection des routes API par authentification
- Policies Supabase pour isolation des données utilisateur

---

## [1.0.0] - 2025-11-06

### ✨ Ajouté

#### Authentification
- Page de connexion `/login`
- Page d'inscription `/signup`
- Composant `AuthForm` réutilisable
- Context `AuthContext` pour gestion de session
- Middleware pour protection des routes
- Intégration Supabase Auth

#### Navigation
- Page d'accueil `/`
- Dashboard `/dashboard`
- Composant Header basique

#### Configuration
- Setup Next.js 15 avec App Router
- Configuration Tailwind CSS
- Configuration TypeScript
- Variables d'environnement Supabase
- Configuration ESLint

#### Infrastructure
- Client Supabase configuré
- Gestion des cookies pour SSR
- Types TypeScript pour Supabase

---

## Types de changements
- ✨ **Ajouté** : Nouvelles fonctionnalités
- 🔧 **Modifié** : Changements dans des fonctionnalités existantes
- 🐛 **Corrigé** : Corrections de bugs
- 🔐 **Sécurité** : Améliorations de sécurité
- 📚 **Documentation** : Modifications de documentation uniquement
- ⚡ **Performance** : Améliorations de performance
- 🎨 **Style** : Changements qui n'affectent pas le sens du code
- ♻️ **Refactoring** : Changements de code sans modifier le comportement
- 🗑️ **Supprimé** : Fonctionnalités supprimées

---

## Versions à venir

### [1.2.0] - Prévu
- Module "Prévisions" pour prévoir les besoins
- Module "Commandes" pour gérer les commandes fournisseurs
- Export/Import CSV pour les stocks
- Catégories d'ingrédients

### [1.3.0] - Prévu  
- Module "Ventes" pour tracking des revenus
- Analytics et tableaux de bord
- Alertes de stock bas
- Notifications push

### [2.0.0] - Futur
- Application mobile (React Native)
- Scan de codes-barres
- Intégration fournisseurs
- Multi-restaurants
- Gestion d'équipe
