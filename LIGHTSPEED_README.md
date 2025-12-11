# 🔄 Système de Synchronisation Lightspeed → Supabase

Synchronisation automatique des ventes Lightspeed POS avec la gestion de stock Supabase.

---

## 📖 Vue d'Ensemble

Ce système permet de :
- ✅ Recevoir automatiquement les ventes depuis Lightspeed (webhook)
- ✅ Décomposer chaque recette vendue en ingrédients
- ✅ Mettre à jour automatiquement les stocks
- ✅ Générer des alertes de réapprovisionnement
- ✅ Tracer tous les mouvements de stock
- ✅ Monitorer les synchronisations en temps réel

---

## 🚀 Quick Start

### 1. Installation

```bash
cd YieldFood
npm install
```

### 2. Configuration

Créez `.env.local` à la racine :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

LIGHTSPEED_WEBHOOK_SECRET=votre_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000

TEST_USER_ID=votre_user_uuid
```

### 3. Migration de la Base de Données

Appliquez la migration dans Supabase :
```sql
-- Copiez et exécutez le contenu de:
supabase/migrations/05_lightspeed_integration.sql
```

### 4. Démarrer en Dev

```bash
npm run dev
```

Accédez au dashboard : `http://localhost:3000/lightspeed-monitoring`

---

## 📂 Structure du Projet

```
YieldFood/
├── app/
│   ├── api/
│   │   └── lightspeed/
│   │       ├── webhook/route.ts          # Webhook principal
│   │       ├── manual-sync/route.ts      # Sync manuelle
│   │       ├── sync-logs/route.ts        # API logs
│   │       └── stock-alerts/route.ts     # API alertes
│   └── lightspeed-monitoring/
│       └── page.tsx                      # Dashboard monitoring
├── lib/
│   └── lightspeed-service.ts             # Logique métier
├── types/
│   └── lightspeed.ts                     # Types TypeScript
├── scripts/
│   └── test-lightspeed.ts                # Tests automatisés
├── supabase/
│   └── migrations/
│       └── 05_lightspeed_integration.sql # Migration SQL
├── LIGHTSPEED_DEPLOYMENT.md              # Guide de déploiement
├── LIGHTSPEED_USAGE_GUIDE.md             # Guide d'utilisation
└── LIGHTSPEED_README.md                  # Ce fichier
```

---

## 🔌 API Endpoints

### POST `/api/lightspeed/webhook`
Reçoit les webhooks de Lightspeed (ventes complétées).

**Headers requis :**
- `x-lightspeed-signature` : Signature HMAC pour validation

**Payload :** JSON Lightspeed Sale

**Réponse :**
```json
{
  "success": true,
  "message": "Vente traitée avec succès",
  "saleId": "123456",
  "orderNumber": "ORD-001",
  "result": {
    "recipesProcessed": 2,
    "ingredientsUpdated": 8,
    "stockMovementsCreated": 8,
    "alertsGenerated": 1
  }
}
```

### POST `/api/lightspeed/manual-sync`
Déclenche manuellement le traitement d'une vente (tests, récupération).

**Body :**
```json
{
  "userId": "uuid",
  "sale": { /* Lightspeed Sale JSON */ },
  "validateOnly": false,
  "allowNegativeStock": true
}
```

### GET `/api/lightspeed/sync-logs?userId=xxx`
Récupère l'historique des synchronisations.

**Query params :**
- `userId` (requis)
- `limit` (défaut: 50)
- `status` : `success`, `error`, `partial`
- `saleId` : Filtrer par Sale ID

### GET `/api/lightspeed/stock-alerts?userId=xxx`
Récupère les alertes de stock.

**Query params :**
- `userId` (requis)
- `resolved` : `true` ou `false` (défaut: false)
- `type` : `low_stock`, `out_of_stock`, `negative_stock`

---

## 🗄️ Structure de Base de Données

### Nouvelles Tables

#### `stock_movements`
Trace tous les mouvements de stock.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique |
| ingredient_id | UUID | Ingrédient concerné |
| movement_type | VARCHAR | `sale`, `manual_adjustment`, etc. |
| quantity_change | DECIMAL | Quantité (négatif = sortie) |
| stock_before | DECIMAL | Stock avant |
| stock_after | DECIMAL | Stock après |
| reference_id | VARCHAR | Sale ID Lightspeed |
| reference_order | VARCHAR | Numéro de commande |

#### `sync_logs`
Historique des synchronisations.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique |
| sync_type | VARCHAR | `webhook`, `manual_sync`, `cron` |
| status | VARCHAR | `success`, `error`, `partial` |
| lightspeed_sale_id | VARCHAR | Sale ID (unique) |
| items_count | INT | Nombre d'articles |
| ingredients_updated | INT | Ingrédients mis à jour |
| error_message | TEXT | Message d'erreur éventuel |

#### `stock_alerts`
Alertes de réapprovisionnement.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique |
| ingredient_id | UUID | Ingrédient concerné |
| alert_type | VARCHAR | Type d'alerte |
| current_stock | DECIMAL | Stock actuel |
| minimum_stock | DECIMAL | Seuil minimum |
| is_resolved | BOOLEAN | Alerte résolue ? |

### Colonnes Ajoutées

**Table `recipes` :**
- `sku` (VARCHAR) : SKU Lightspeed
- `is_active` (BOOLEAN) : Recette active

**Table `ingredients` :**
- `current_stock` (DECIMAL) : Stock actuel
- `minimum_stock` (DECIMAL) : Seuil minimum
- `alert_threshold` (DECIMAL) : Seuil d'avertissement

---

## 🧪 Tests

### Tests Automatisés

```bash
# Définir votre user ID
export TEST_USER_ID="votre-uuid"

# Lancer les tests
npm run test:lightspeed
```

### Test Manuel via cURL

```bash
curl -X POST http://localhost:3000/api/lightspeed/manual-sync \
  -H "Content-Type: application/json" \
  -d @test-sale.json
```

---

## 📊 Dashboard Monitoring

Accédez à `/lightspeed-monitoring` pour :

### 📈 Statistiques en Temps Réel
- Nombre d'alertes actives
- Syncs réussies/échouées
- Dernière synchronisation

### ⚠️ Alertes de Stock
- Liste des ingrédients en rupture ou faibles
- Actions de résolution
- Historique

### 📝 Logs de Synchronisation
- Historique complet des ventes traitées
- Messages d'erreur détaillés
- Filtres par statut

### 📦 Mouvements de Stock
- Détail de chaque déduction
- Référence à la commande Lightspeed
- Calculs avant/après

---

## 🔧 Configuration Avancée

### Autoriser les Stocks Négatifs

Par défaut, les stocks négatifs sont autorisés. Pour les bloquer :

```typescript
// Dans app/api/lightspeed/webhook/route.ts
const options: SyncOptions = {
  userId,
  syncType: 'webhook',
  allowNegativeStock: false, // ← Bloquer si stock insuffisant
  skipDuplicateCheck: false
}
```

### Personnaliser les Seuils d'Alerte

```sql
-- Par ingrédient
UPDATE ingredients 
SET 
  minimum_stock = 20,      -- Alerte si stock ≤ 20
  alert_threshold = 30     -- Avertissement si stock ≤ 30
WHERE name = 'Pain panini';
```

### Multi-Restaurant (Future)

Pour gérer plusieurs restaurants avec des stocks séparés :

```sql
-- Ajouter une colonne restaurant_id
ALTER TABLE ingredients ADD COLUMN restaurant_id UUID;
ALTER TABLE recipes ADD COLUMN restaurant_id UUID;
ALTER TABLE stock_movements ADD COLUMN restaurant_id UUID;
```

---

## 📖 Documentation Complète

- 📘 **[Guide de Déploiement](./LIGHTSPEED_DEPLOYMENT.md)** : Setup complet étape par étape
- 📗 **[Guide d'Utilisation](./LIGHTSPEED_USAGE_GUIDE.md)** : Utilisation quotidienne du système

---

## 🐛 Troubleshooting Rapide

| Problème | Solution |
|----------|----------|
| "SKU non trouvé" | Vérifiez que le SKU existe dans la table `recipes` |
| "Stock insuffisant" | Activez `allowNegativeStock` ou réapprovisionnez |
| "Vente déjà traitée" | Normal (déduplication), supprimez le log si besoin |
| Webhook ne fonctionne pas | Vérifiez URL et secret dans Lightspeed |

---

## 🔐 Sécurité

- ✅ Row Level Security (RLS) activé sur toutes les tables
- ✅ Validation HMAC des webhooks
- ✅ Service role key jamais exposée côté client
- ✅ Déduplication automatique des ventes

---

## 📈 Performances

Le système est optimisé pour :
- ⚡ Traitement en < 2 secondes par vente
- 📊 Indexation sur SKU, Sale ID, dates
- 🔄 Transactions atomiques (rollback si erreur)
- 📦 Trigger automatique pour les alertes

---

## 🎯 Roadmap

### Phase 1 ✅ (Complétée)
- [x] Structure de base Supabase
- [x] Logique de décomposition recettes
- [x] Webhook endpoint
- [x] Dashboard monitoring
- [x] Tests automatisés

### Phase 2 🚧 (À venir)
- [ ] Système de retry automatique
- [ ] Notifications email/SMS
- [ ] Export des rapports (PDF/Excel)
- [ ] API Lightspeed complète (polling)

### Phase 3 🔮 (Future)
- [ ] Multi-tenant (plusieurs restaurants)
- [ ] Analytics avancées
- [ ] Prédictions de stock (ML)
- [ ] Intégration fournisseurs

---

## 🤝 Contribution

Pour contribuer :
1. Créez une branche feature
2. Testez vos modifications
3. Soumettez une pull request

---

## 📞 Support

- 📧 Email : support@votre-domaine.com
- 💬 Slack : #stock-support
- 📚 Docs : https://docs.votre-domaine.com

---

**Développé avec ❤️ pour les restaurateurs**
