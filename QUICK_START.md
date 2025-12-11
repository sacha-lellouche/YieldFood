# ⚡ Quick Start - Système Lightspeed

Guide de démarrage rapide en 10 minutes.

---

## 🚀 Installation Rapide

### 1. Cloner et Installer (2 min)

```bash
cd YieldFood
npm install
```

### 2. Configuration Supabase (3 min)

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Créez un nouveau projet (ou utilisez existant)
3. Allez dans **Database** → **SQL Editor**
4. Exécutez ce fichier : `supabase/migrations/05_lightspeed_integration.sql`
5. Exécutez ce fichier : `supabase/migrations/06_seed_test_data_lightspeed.sql`
   - ⚠️ **IMPORTANT** : Remplacez `YOUR_USER_ID` par votre UUID utilisateur
   - Pour obtenir votre UUID : `SELECT id FROM auth.users LIMIT 1;`

### 3. Variables d'Environnement (2 min)

```bash
# Copiez le template
cp .env.example .env.local

# Éditez .env.local avec vos vraies valeurs
nano .env.local
```

Récupérez vos credentials Supabase :
- **Settings** → **API** → Copiez URL et keys

### 4. Démarrer l'Application (1 min)

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

### 5. Premier Test (2 min)

```bash
# Définissez votre User ID
export TEST_USER_ID="votre-uuid-ici"

# Lancez les tests
npm run test:lightspeed
```

Ou testez manuellement :

```bash
curl -X POST http://localhost:3000/api/lightspeed/manual-sync \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "VOTRE-UUID",
    "validateOnly": true,
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
    }
  }'
```

---

## 📊 Accéder au Dashboard

Rendez-vous sur : [http://localhost:3000/lightspeed-monitoring](http://localhost:3000/lightspeed-monitoring)

Vous verrez :
- ✅ Statistiques en temps réel
- ⚠️ Alertes de stock
- 📝 Logs de synchronisation
- 📦 Mouvements de stock

---

## 🔧 Configuration Lightspeed

### Étape 1 : Obtenir les Credentials

1. Connectez-vous à [Lightspeed Retail](https://retail.lightspeed.com)
2. **Settings** → **API & Apps**
3. Créez une nouvelle application
4. Notez :
   - Account ID
   - API Key
   - API Secret

### Étape 2 : Configurer le Webhook

**En développement :**
Utilisez [ngrok](https://ngrok.com) pour exposer localhost :

```bash
# Installer ngrok
brew install ngrok

# Démarrer le tunnel
ngrok http 3000

# Copiez l'URL HTTPS fournie (ex: https://abc123.ngrok.io)
```

**En production :**
Utilisez votre URL Vercel : `https://votre-app.vercel.app`

**Dans Lightspeed :**
1. **Settings** → **API** → **Webhooks**
2. Créez un webhook :
   - **Event** : `sale.completed`
   - **URL** : `https://votre-url/api/lightspeed/webhook`
   - **Secret** : Générez avec `openssl rand -hex 32`
3. Ajoutez le secret dans `.env.local` :
   ```
   LIGHTSPEED_WEBHOOK_SECRET=le_secret_généré
   ```

---

## ✅ Vérifications

### Base de Données OK ?

```sql
-- Vérifier les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('stock_movements', 'sync_logs', 'stock_alerts');

-- Vérifier les recettes avec SKU
SELECT name, sku FROM recipes WHERE sku IS NOT NULL;

-- Vérifier les stocks
SELECT name, current_stock, minimum_stock 
FROM ingredients 
WHERE current_stock > 0;
```

### API OK ?

```bash
# Test webhook endpoint
curl http://localhost:3000/api/lightspeed/webhook

# Devrait retourner: {"status":"ok",...}
```

### Dashboard OK ?

Ouvrez [http://localhost:3000/lightspeed-monitoring](http://localhost:3000/lightspeed-monitoring)

Si vous voyez les statistiques → ✅ Tout fonctionne !

---

## 🎯 Scénario de Test Complet

### 1. Vérifier les Données de Base

```sql
-- Voir les recettes disponibles
SELECT id, name, sku FROM recipes;

-- Voir les stocks initiaux
SELECT name, current_stock, unit FROM ingredients;
```

### 2. Simuler une Vente

```bash
# Éditer le fichier
nano scripts/test-sale-example.json

# Remplacer "REMPLACER_PAR_VOTRE_USER_UUID" par votre UUID

# Tester
curl -X POST http://localhost:3000/api/lightspeed/manual-sync \
  -H "Content-Type: application/json" \
  -d @scripts/test-sale-example.json
```

### 3. Vérifier les Résultats

**Dans le Dashboard :**
- Allez sur `/lightspeed-monitoring`
- Onglet "Logs" → Vous devriez voir la vente
- Onglet "Mouvements" → Vous devriez voir les déductions

**Dans Supabase :**
```sql
-- Voir le log de sync
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 1;

-- Voir les mouvements créés
SELECT 
  i.name,
  sm.quantity_change,
  sm.stock_before,
  sm.stock_after,
  sm.reference_order
FROM stock_movements sm
JOIN ingredients i ON i.id = sm.ingredient_id
ORDER BY sm.created_at DESC
LIMIT 10;

-- Voir les stocks mis à jour
SELECT name, current_stock, unit FROM ingredients;
```

### 4. Vérifier les Alertes

Si un stock passe sous le minimum :

```sql
-- Voir les alertes générées
SELECT 
  i.name,
  sa.alert_type,
  sa.current_stock,
  sa.minimum_stock
FROM stock_alerts sa
JOIN ingredients i ON i.id = sa.ingredient_id
WHERE sa.is_resolved = false;
```

---

## 🐛 Problèmes Courants

### "Cannot find module '@/lib/supabase'"

```bash
# Vérifier tsconfig.json
cat tsconfig.json | grep paths

# Devrait contenir:
# "@/*": ["./*"]
```

### "User ID required"

Assurez-vous d'avoir :
1. Créé un utilisateur dans Supabase Auth
2. Récupéré son UUID
3. Remplacé dans les fichiers de test

### "SKU non trouvé"

```sql
-- Ajouter le SKU manquant
UPDATE recipes 
SET sku = 'VOTRE-SKU' 
WHERE name = 'Nom de la recette';
```

### Webhook ne reçoit rien

1. Vérifiez que ngrok/tunnel fonctionne
2. Vérifiez l'URL dans Lightspeed
3. Vérifiez les logs Lightspeed pour erreurs

---

## 📚 Documentation Complète

Pour aller plus loin :

- **[LIGHTSPEED_README.md](./LIGHTSPEED_README.md)** : Vue d'ensemble technique
- **[LIGHTSPEED_DEPLOYMENT.md](./LIGHTSPEED_DEPLOYMENT.md)** : Guide de déploiement complet
- **[LIGHTSPEED_USAGE_GUIDE.md](./LIGHTSPEED_USAGE_GUIDE.md)** : Guide d'utilisation quotidien
- **[LIGHTSPEED_DELIVERY.md](./LIGHTSPEED_DELIVERY.md)** : Résumé de livraison

---

## 🚀 Déploiement en Production

### Option 1 : Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Ajouter les variables d'environnement dans Vercel Dashboard
# Settings → Environment Variables
```

### Option 2 : Docker

```bash
# Créer Dockerfile (à créer si besoin)
docker build -t lightspeed-app .
docker run -p 3000:3000 lightspeed-app
```

### Après Déploiement

1. Mettre à jour l'URL du webhook dans Lightspeed
2. Tester avec une vente réelle
3. Monitorer le dashboard pour confirmer

---

## 🎉 C'est Terminé !

Votre système Lightspeed est maintenant opérationnel.

**Prochaines étapes :**
1. ✅ Configurer vos vraies recettes et SKUs
2. ✅ Ajuster les seuils de stock minimum
3. ✅ Tester avec des ventes réelles
4. ✅ Former vos utilisateurs finaux
5. ✅ Mettre en production

**Support :**
- 📚 Consultez la documentation complète
- 🔍 Vérifiez les logs dans `/lightspeed-monitoring`
- 📧 Contactez le support si besoin

---

**Bon démarrage ! 🚀**
