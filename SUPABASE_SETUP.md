# Instructions pour configurer Supabase

## 🚀 Étape 1 : Créer un projet Supabase

1. Allez sur https://supabase.com
2. Créez un compte / Connectez-vous
3. Cliquez sur "New Project"
4. Remplissez :
   - Name: YieldFood
   - Database Password: [choisissez un mot de passe fort]
   - Region: [choisissez la plus proche]
5. Cliquez sur "Create new project"
6. Attendez ~2 minutes que le projet se crée

## 📝 Étape 2 : Récupérer les credentials

1. Dans votre projet, allez dans **Settings** (icône engrenage en bas à gauche)
2. Cliquez sur **API** dans le menu de gauche
3. Vous verrez :

```
Project URL: https://xxxxxx.supabase.co
anon public: eyJhbGciOiJIUz...
service_role: eyJhbGciOiJIUz... (cliquez sur "Reveal" pour voir)
```

## ⚙️ Étape 3 : Mettre à jour .env.local

Ouvrez le fichier `.env.local` et remplacez UNIQUEMENT ces lignes :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```

Collez vos VRAIES valeurs.

## 🗄️ Étape 4 : Créer les tables

1. Dans Supabase, allez dans **SQL Editor**
2. Copiez et exécutez les fichiers SQL dans cet ordre :
   - `supabase/migrations/04_create_all_recipes_tables.sql`
   - `supabase/migrations/05_lightspeed_integration.sql`

## 🔄 Étape 5 : Redémarrer le serveur

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez :
cd YieldFood
npm run dev
```

## ✅ Étape 6 : Tester

Allez sur http://localhost:3001 (ou 3000) et testez la connexion !
