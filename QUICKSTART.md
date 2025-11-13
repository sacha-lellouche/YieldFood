# 🚀 Guide de Démarrage Rapide - Module "Mes Stocks"

## ⚡ Installation en 3 étapes

### Étape 1 : Créer la table dans Supabase

1. Allez sur https://app.supabase.com
2. Ouvrez votre projet YieldFood  
3. Cliquez sur **SQL Editor** dans la barre latérale
4. Cliquez sur **New Query**
5. Copiez-collez tout le contenu du fichier `supabase/migrations/create_ingredients_table.sql`
6. Cliquez sur **Run** (ou Ctrl+Enter)

✅ Vous devriez voir le message de succès. La table `ingredients` est créée !

### Étape 2 : Créer un compte utilisateur

1. Lancez l'app : `npm run dev`
2. Allez sur http://localhost:3000 (ou 3002)
3. Cliquez sur "S'inscrire"
4. Créez votre compte avec email + mot de passe
5. ⚠️ **Important** : Vérifiez votre email pour confirmer le compte

### Étape 3 : Accéder à la page Stocks

1. Une fois connecté, cliquez sur **"Mes Stocks"** dans la navigation
2. Ou allez directement sur http://localhost:3000/stocks
3. Cliquez sur **"Ajouter un ingrédient"**
4. Testez : Ajoutez "Farine", quantité "2.5", unité "kg"

## 🎉 C'est tout ! 

Votre module de gestion de stocks est opérationnel !

## 📝 Ce que vous pouvez faire maintenant

- ✅ Ajouter des ingrédients
- ✅ Modifier les quantités
- ✅ Supprimer des ingrédients
- ✅ Rechercher par nom
- ✅ Voir les statistiques en temps réel

## 🔍 URLs importantes

- **Page d'accueil** : http://localhost:3000
- **Connexion** : http://localhost:3000/login
- **Inscription** : http://localhost:3000/signup
- **Dashboard** : http://localhost:3000/dashboard
- **Mes Stocks** : http://localhost:3000/stocks

## 🐛 Problèmes ?

### "Invalid login credentials"
➡️ Vérifiez votre email de confirmation Supabase

### "Erreur lors de la récupération des ingrédients"
➡️ Vérifiez que la table `ingredients` existe dans Supabase

### Port déjà utilisé
➡️ Next.js va automatiquement essayer 3001, 3002, etc.

### Page blanche
➡️ Vérifiez la console du navigateur (F12)
➡️ Vérifiez le terminal pour les erreurs

## 📚 Documentation complète

Pour plus de détails, voir `STOCKS_MODULE.md`

---

**Besoin d'aide ?** Ouvre la console du navigateur (F12) et vérifie les erreurs.
