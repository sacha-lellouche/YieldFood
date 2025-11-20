````markdown
# 🍽️ YieldFood - Gestion de Restaurant SaaS

Application SaaS complète pour la gestion de restaurants, construite avec Next.js 15, Supabase et TypeScript.

## ✨ Fonctionnalités

### 🔄 Intégration Lightspeed (Nouveau !)
- ✅ Synchronisation automatique des ventes Lightspeed → Supabase
- ✅ Décomposition automatique recettes → ingrédients
- ✅ Alertes de stock en temps réel
- ✅ Dashboard de monitoring complet
- ✅ Traçabilité complète des mouvements
- 📖 **Guide complet** : Voir `QUICK_START.md` ou `LIGHTSPEED_INDEX.md`

### 📦 Module "Mes Stocks"
- ✅ Gestion complète des ingrédients (CRUD)
- ✅ Suivi en temps réel du stock
- ✅ Recherche et filtres avancés
- ✅ Statistiques de stock
- ✅ Interface responsive et moderne
- ✅ Sécurité RLS (Row Level Security)

### 🍴 Module "Mes Recettes"
- ✅ Création et gestion de recettes
- ✅ Association d'ingrédients avec quantités
- ✅ SKU Lightspeed pour synchronisation
- ✅ Suggestions AI d'ingrédients

### 🔐 Authentification
- Inscription / Connexion avec Supabase Auth
- Protection des routes
- Session persistante

### 📊 Dashboard
- Vue d'ensemble
- Navigation intuitive

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- Un compte Supabase
- Un compte Lightspeed (optionnel, pour la synchronisation)
- npm ou yarn

### Installation

1. **Cloner le projet**
```bash
git clone https://github.com/sacha-lellouche/YieldFood.git
cd YieldFood
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer Supabase**
   - Copiez `.env.example` vers `.env.local`
   - Ajoutez vos credentials Supabase
   - Exécutez les migrations SQL dans l'ordre :
     - `supabase/migrations/04_create_all_recipes_tables.sql`
     - `supabase/migrations/05_lightspeed_integration.sql`
     - `supabase/migrations/06_seed_test_data_lightspeed.sql` (optionnel)
   
   📖 **Guide détaillé** : Voir `QUICK_START.md`

4. **Lancer l'application**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## 📁 Structure du Projet

```
YieldFood-1/
├── app/
│   ├── api/
│   │   └── ingredients/          # API routes pour les stocks
│   ├── stocks/                   # 📦 Module Mes Stocks
│   ├── dashboard/
│   ├── login/
│   └── signup/
├── components/
│   ├── ui/                       # Composants shadcn/ui
│   ├── IngredientDialog.tsx      # Dialog ajout/édition
│   ├── Header.tsx                # Navigation
│   └── AuthForm.tsx
├── contexts/
│   └── AuthContext.tsx           # Gestion authentification
├── lib/
│   ├── supabase.ts              # Client Supabase
│   └── utils.ts                 # Utilitaires
├── types/
│   └── ingredient.ts            # Types TypeScript
└── supabase/
    └── migrations/              # Scripts SQL
```

## 🛠️ Technologies

- **Framework**: Next.js 15 (App Router)
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: Supabase Auth
- **UI**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React
- **TypeScript**: Typage complet

## 📚 Documentation

- 📖 **Guide de démarrage** : `QUICKSTART.md`
- 📦 **Module Stocks** : `STOCKS_MODULE.md`
- 🗄️ **Schéma SQL** : `supabase/migrations/create_ingredients_table.sql`
- 🧪 **Données de test** : `supabase/migrations/seed_test_data.sql`

## 🎯 Roadmap

- [x] Authentification complète
- [x] Module "Mes Stocks"
- [ ] Module "Prévisions"
- [ ] Module "Commandes"
- [ ] Module "Ventes"
- [ ] Tableaux de bord analytics
- [ ] Export PDF/Excel
- [ ] Notifications

## 🤝 Contribution

Ce projet est en développement actif. Les contributions sont les bienvenues !

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
