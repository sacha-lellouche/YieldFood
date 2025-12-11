# 🚀 Guide de Déploiement - Intégration Lightspeed

Ce guide vous accompagne pas à pas pour déployer le système de synchronisation entre Lightspeed POS et votre gestion de stock Supabase.

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration Supabase](#configuration-supabase)
3. [Configuration des Variables d'Environnement](#configuration-des-variables-denvironnement)
4. [Migration de la Base de Données](#migration-de-la-base-de-données)
5. [Configuration Lightspeed](#configuration-lightspeed)
6. [Tests et Validation](#tests-et-validation)
7. [Mise en Production](#mise-en-production)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Prérequis

### Comptes et Accès

- [ ] Compte Supabase actif avec un projet créé
- [ ] Compte Lightspeed avec accès API
- [ ] Node.js >= 18.x installé
- [ ] Git installé

### Connaissances Techniques

- Bases de SQL
- Compréhension de REST APIs
- Notions de webhooks

---

## 🗄️ Configuration Supabase

### 1. Récupérer les Credentials

1. Connectez-vous à [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Notez ces valeurs :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (cliquez sur "Reveal") → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **IMPORTANT** : La `service_role` key bypasse RLS. Ne JAMAIS l'exposer côté client !

### 2. Activer Row Level Security (RLS)

Les tables sont déjà configurées avec RLS dans les migrations. Vérifiez dans **Database** → **Tables** que RLS est activé sur :
- `ingredients`
- `recipes`
- `recipe_ingredients`
- `stock_movements`
- `sync_logs`
- `stock_alerts`

---

## 🔧 Configuration des Variables d'Environnement

### 1. Créer le fichier `.env.local`

À la racine du projet `YieldFood/`, créez `.env.local` :

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Lightspeed API
LIGHTSPEED_ACCOUNT_ID=123456
LIGHTSPEED_API_KEY=votre_api_key
LIGHTSPEED_API_SECRET=votre_api_secret
LIGHTSPEED_WEBHOOK_SECRET=votre_webhook_secret

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development

# Tests
TEST_USER_ID=uuid-de-votre-utilisateur-test
```

### 2. Sécuriser le fichier

```bash
# Ajouter au .gitignore (normalement déjà fait)
echo ".env.local" >> .gitignore
```

---

## 📊 Migration de la Base de Données

### Option A : Via l'interface Supabase (Recommandé)

1. Allez dans **Database** → **SQL Editor**
2. Copiez le contenu de `supabase/migrations/05_lightspeed_integration.sql`
3. Collez dans l'éditeur et cliquez sur **Run**
4. Vérifiez qu'il n'y a pas d'erreurs

### Option B : Via la CLI Supabase

```bash
# Installer la CLI Supabase
npm install -g supabase

# Se connecter
supabase login

# Lier votre projet
supabase link --project-ref votre-project-ref

# Appliquer la migration
supabase db push
```

### Vérification

Vérifiez que ces tables existent :
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('stock_movements', 'sync_logs', 'stock_alerts');
```

Vérifiez les nouvelles colonnes :
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recipes' AND column_name = 'sku';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ingredients' 
AND column_name IN ('current_stock', 'minimum_stock');
```

---

## 🔌 Configuration Lightspeed

### 1. Créer une Application API

1. Connectez-vous à [Lightspeed Retail](https://retail.lightspeed.com)
2. Allez dans **Settings** → **API & Apps**
3. Créez une nouvelle application
4. Notez :
   - **Account ID**
   - **API Key**
   - **API Secret**

### 2. Obtenir un Token d'Accès

```bash
# Utiliser OAuth 2.0 pour obtenir un access token
curl -X POST https://cloud.lightspeedapp.com/oauth/access_token.php \
  -d "client_id=YOUR_API_KEY" \
  -d "client_secret=YOUR_API_SECRET" \
  -d "code=AUTHORIZATION_CODE" \
  -d "grant_type=authorization_code"
```

Documentation complète : https://developers.lightspeedhq.com/retail/authentication/

### 3. Configurer le Webhook

Une fois votre application déployée :

1. Dans Lightspeed, allez dans **API Settings** → **Webhooks**
2. Créez un nouveau webhook :
   - **Event** : `Sale.completed` ou `Sale.created`
   - **URL** : `https://votre-domaine.com/api/lightspeed/webhook`
   - **Secret** : Générez un secret aléatoire et ajoutez-le à `.env.local`

---

## 🏗️ Préparation des Données

### 1. Ajouter les SKU aux Recettes

Pour chaque recette dans votre base de données, ajoutez le SKU Lightspeed correspondant :

```sql
-- Exemple
UPDATE recipes 
SET sku = 'PAN-001' 
WHERE name = 'Panini Végétarien';

UPDATE recipes 
SET sku = 'BUR-001' 
WHERE name = 'Burger Classic';
```

Ou via l'interface de votre application dans `/recipes`.

### 2. Configurer les Stocks Initiaux

Définissez les stocks actuels et minimums pour vos ingrédients :

```sql
-- Exemple
UPDATE ingredients 
SET 
  current_stock = 100,
  minimum_stock = 20,
  alert_threshold = 30
WHERE name = 'Pain panini';
```

---

## 🧪 Tests et Validation

### 1. Installer les Dépendances

```bash
cd YieldFood
npm install
```

### 2. Démarrer le Serveur de Dev

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`.

### 3. Tester le Webhook (Mode Manuel)

```bash
# Définir votre User ID pour les tests
export TEST_USER_ID="votre-uuid-utilisateur"

# Lancer les tests
npm run test:lightspeed
```

Ou testez via curl :

```bash
curl -X POST http://localhost:3000/api/lightspeed/manual-sync \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "votre-uuid",
    "sale": {
      "saleID": 999999,
      "orderNumber": "TEST-001",
      "createTime": "2024-11-20T12:00:00Z",
      "orderStatus": "completed",
      "total": "12.98",
      "SaleLines": {
        "SaleLine": {
          "lineID": 1,
          "itemID": 5001,
          "description": "Panini Végétarien",
          "sku": "PAN-001",
          "quantity": 2,
          "unitPrice": "6.49",
          "total": "12.98"
        }
      }
    },
    "validateOnly": false,
    "allowNegativeStock": true
  }'
```

### 4. Vérifier les Résultats

1. **Dashboard Monitoring** : `http://localhost:3000/lightspeed-monitoring`
2. **Logs dans Supabase** :
   ```sql
   SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 5;
   ```
3. **Mouvements de stock** :
   ```sql
   SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT 10;
   ```

---

## 🚀 Mise en Production

### 1. Déployer sur Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
cd YieldFood
vercel

# Configurer les variables d'environnement dans Vercel Dashboard
# Settings → Environment Variables
```

Variables à ajouter dans Vercel :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LIGHTSPEED_WEBHOOK_SECRET`
- `NEXT_PUBLIC_BASE_URL` (ex: `https://votre-app.vercel.app`)

### 2. Configurer le Webhook Lightspeed en Production

Une fois déployé, mettez à jour l'URL du webhook dans Lightspeed :
```
https://votre-app.vercel.app/api/lightspeed/webhook
```

### 3. Tester le Webhook en Production

1. Faites une vente test dans Lightspeed
2. Vérifiez les logs dans le dashboard monitoring
3. Confirmez que le stock a été déduit dans Supabase

---

## 🐛 Troubleshooting

### Le webhook ne reçoit rien

**Causes possibles :**
- URL incorrecte dans Lightspeed
- Firewall bloquant les requêtes
- Secret webhook mal configuré

**Solutions :**
```bash
# Tester l'endpoint
curl https://votre-app.vercel.app/api/lightspeed/webhook

# Devrait retourner: {"status":"ok",...}
```

### Erreur "SKU non trouvé"

**Cause :** Le SKU Lightspeed ne correspond à aucune recette.

**Solution :**
```sql
-- Vérifier les SKUs
SELECT id, name, sku FROM recipes WHERE user_id = 'votre-user-id';

-- Ajouter le SKU manquant
UPDATE recipes SET sku = 'VOTRE-SKU' WHERE id = 'recipe-uuid';
```

### Stock négatif non autorisé

**Solution :** Modifier `allowNegativeStock` dans le webhook :

```typescript
// Dans app/api/lightspeed/webhook/route.ts
const options: SyncOptions = {
  userId,
  syncType: 'webhook',
  allowNegativeStock: true, // ← Mettre à true
  skipDuplicateCheck: false
}
```

### Doublon détecté

**Normal !** Le système empêche le traitement multiple d'une même vente.

**Pour retraiter une vente :**
```sql
-- Supprimer le log existant
DELETE FROM sync_logs WHERE lightspeed_sale_id = '123456';

-- Relancer le traitement via /api/lightspeed/manual-sync
```

---

## 📈 Monitoring en Production

### Logs Vercel

```bash
vercel logs --follow
```

### Alertes Email/Slack (Optionnel)

Ajoutez une intégration dans `lib/lightspeed-service.ts` :

```typescript
// Après création d'une alerte
if (alert.alert_type === 'out_of_stock') {
  await sendSlackNotification({
    text: `⚠️ Rupture de stock: ${alert.ingredient.name}`,
    channel: '#stock-alerts'
  })
}
```

---

## 📞 Support

En cas de problème :
1. Consultez les logs dans `/lightspeed-monitoring`
2. Vérifiez la table `sync_logs` pour les erreurs détaillées
3. Contactez l'équipe technique

---

## 🔄 Prochaines Étapes

- [ ] Configurer les alertes email/SMS
- [ ] Implémenter un système de récupération automatique (retry)
- [ ] Ajouter le support multi-restaurant
- [ ] Créer un dashboard analytics avancé

---

**Déploiement réussi !** 🎉

Votre système de synchronisation Lightspeed est maintenant opérationnel.
