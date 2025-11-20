# 📚 Guide d'Utilisation - Système Lightspeed

Guide complet pour utiliser le système de synchronisation Lightspeed au quotidien.

---

## 🎯 Vue d'Ensemble

Le système synchronise automatiquement vos ventes Lightspeed avec votre stock Supabase :
1. Une vente est réalisée dans Lightspeed
2. Le webhook envoie les données à votre application
3. Les recettes sont décomposées en ingrédients
4. Le stock est automatiquement déduit
5. Des alertes sont générées si nécessaire

---

## 🖥️ Dashboard Monitoring

### Accès

Rendez-vous sur `/lightspeed-monitoring` dans votre application.

### Sections Disponibles

#### 📊 Statistiques (en haut)

- **Alertes actives** : Nombre d'alertes de stock non résolues
- **Syncs réussies** : Total des synchronisations sans erreur
- **Syncs échouées** : Synchronisations ayant rencontré des problèmes
- **Dernière sync** : Horodatage de la dernière vente traitée

#### ⚠️ Onglet "Alertes"

Liste toutes les alertes de stock actives :

**Types d'alertes :**
- 🔴 **Rupture** : Stock = 0
- 🟣 **Stock négatif** : Stock < 0 (ventes plus rapides que réapprovisionnement)
- 🟡 **Stock faible** : Stock < seuil minimum

**Actions :**
- Cliquez sur "Résoudre" après réapprovisionnement
- L'alerte reste dans l'historique mais n'apparaît plus dans les actives

#### 📝 Onglet "Logs de sync"

Historique complet des synchronisations :

**Informations affichées :**
- Numéro de commande Lightspeed
- Statut (succès/erreur/partiel)
- Nombre d'articles et d'ingrédients mis à jour
- Messages d'erreur éventuels
- Date et heure

**Statuts :**
- ✅ **success** : Tout s'est bien passé
- ❌ **error** : Échec complet (aucun ingrédient mis à jour)
- ⚠️ **partial** : Certaines lignes ont échoué

#### 📦 Onglet "Mouvements"

Détail de tous les mouvements de stock liés aux ventes :

**Pour chaque mouvement :**
- Ingrédient concerné
- Quantité déduite (en rouge)
- Stock avant → après
- Numéro de commande Lightspeed
- Date et heure

---

## 🔧 Configuration des Recettes

### Ajouter un SKU à une Recette

Pour qu'une vente Lightspeed soit traitée, la recette doit avoir un SKU correspondant.

**Via l'interface :**
1. Allez dans `/recipes`
2. Éditez la recette
3. Ajoutez le champ "SKU" (correspond au SKU Lightspeed)
4. Sauvegardez

**Via SQL (Supabase) :**
```sql
UPDATE recipes 
SET sku = 'PAN-001' 
WHERE name = 'Panini Végétarien';
```

**⚠️ Important :** Le SKU doit être **exactement identique** au SKU configuré dans Lightspeed.

### Vérifier les SKUs Configurés

```sql
SELECT id, name, sku, is_active 
FROM recipes 
WHERE user_id = 'votre-user-id'
ORDER BY name;
```

---

## 📦 Gestion des Stocks

### Configurer les Seuils d'Alerte

Pour chaque ingrédient, vous pouvez définir :

**Via SQL :**
```sql
UPDATE ingredients 
SET 
  current_stock = 100,      -- Stock actuel
  minimum_stock = 20,       -- Seuil d'alerte
  alert_threshold = 30      -- Seuil d'avertissement anticipé
WHERE name = 'Pain panini';
```

**Logique des alertes :**
- `current_stock > minimum_stock` : ✅ Tout va bien
- `current_stock <= minimum_stock` : ⚠️ Alerte "stock faible"
- `current_stock = 0` : 🔴 Alerte "rupture"
- `current_stock < 0` : 🟣 Alerte "stock négatif"

### Ajuster Manuellement le Stock

**Cas d'usage :** Réapprovisionnement, inventaire, correction d'erreur

**Via API :**
```bash
curl -X POST http://localhost:3000/api/stock/update-quantity \
  -H "Content-Type: application/json" \
  -d '{
    "ingredientId": "uuid-ingredient",
    "userId": "uuid-user",
    "delta": 50,
    "notes": "Réapprovisionnement"
  }'
```

Cela créera automatiquement un mouvement de stock avec le type `manual_adjustment`.

---

## 🧪 Tests et Simulation

### Tester avec une Vente Fictive

**Endpoint :** `POST /api/lightspeed/manual-sync`

**Exemple :**
```bash
curl -X POST http://localhost:3000/api/lightspeed/manual-sync \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "votre-uuid",
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
          "description": "Test Panini",
          "sku": "PAN-001",
          "quantity": 1,
          "unitPrice": "6.49",
          "total": "6.49"
        }
      }
    }
  }'
```

**Mode `validateOnly: true`** :
- Valide la recette et calcule les déductions
- **N'applique PAS** les modifications au stock
- Utile pour tester sans impact

**Mode `validateOnly: false`** :
- Applique réellement les modifications
- Crée les mouvements de stock
- Génère les alertes si nécessaire

---

## 🔍 Résolution de Problèmes

### Problème : "SKU non trouvé"

**Symptôme :** Une vente n'est pas traitée, log avec erreur "SKU non trouvé dans les recettes"

**Solution :**
1. Vérifiez que le produit existe dans Lightspeed
2. Notez le SKU exact
3. Créez ou mettez à jour la recette correspondante avec ce SKU
4. Retraitez la vente via `/api/lightspeed/manual-sync`

### Problème : "Stock insuffisant"

**Symptôme :** Erreur "Stock insuffisant pour [ingrédient]"

**Cause :** L'option `allowNegativeStock` est à `false`

**Solutions :**
1. **Autoriser les stocks négatifs** (configuration dans le webhook)
2. **Réapprovisionner** avant de retraiter la vente
3. **Corriger le stock** si c'était une erreur

### Problème : Doublon Détecté

**Symptôme :** "Vente déjà traitée"

**C'est normal !** Le système empêche le traitement multiple.

**Pour retraiter volontairement :**
```sql
-- Supprimer le log
DELETE FROM sync_logs 
WHERE lightspeed_sale_id = '123456';

-- Puis relancer via manual-sync
```

### Problème : Webhook ne Fonctionne Pas

**Checklist :**
1. ✅ Le webhook est configuré dans Lightspeed avec la bonne URL
2. ✅ `LIGHTSPEED_WEBHOOK_SECRET` est défini dans `.env.local`
3. ✅ L'application est accessible publiquement (pas en localhost)
4. ✅ Le statut de la commande est bien "completed"

**Test de base :**
```bash
curl https://votre-app.com/api/lightspeed/webhook

# Devrait retourner: {"status":"ok",...}
```

---

## 📊 Rapports et Analyses

### Ventes par Période

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as nb_syncs,
  SUM(ingredients_updated) as total_ingredients
FROM sync_logs
WHERE status = 'success'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Ingrédients les Plus Utilisés

```sql
SELECT 
  i.name,
  COUNT(*) as nb_mouvements,
  SUM(ABS(sm.quantity_change)) as quantite_totale,
  i.unit
FROM stock_movements sm
JOIN ingredients i ON i.id = sm.ingredient_id
WHERE sm.movement_type = 'sale'
  AND sm.created_at >= NOW() - INTERVAL '30 days'
GROUP BY i.id, i.name, i.unit
ORDER BY quantite_totale DESC
LIMIT 10;
```

### Alertes Récurrentes

```sql
SELECT 
  i.name,
  COUNT(*) as nb_alertes,
  i.current_stock,
  i.minimum_stock
FROM stock_alerts sa
JOIN ingredients i ON i.id = sa.ingredient_id
WHERE sa.created_at >= NOW() - INTERVAL '30 days'
GROUP BY i.id, i.name, i.current_stock, i.minimum_stock
HAVING COUNT(*) > 3
ORDER BY nb_alertes DESC;
```

---

## 🎓 Best Practices

### ✅ À Faire

1. **Vérifiez le dashboard quotidiennement** pour les alertes
2. **Résolvez les alertes** après réapprovisionnement
3. **Testez les nouvelles recettes** avec `validateOnly: true` avant de les activer
4. **Gardez les SKUs synchronisés** entre Lightspeed et votre app
5. **Définissez des seuils réalistes** de minimum_stock

### ❌ À Éviter

1. **Ne supprimez pas les logs** (historique important)
2. **N'éditez pas manuellement** les mouvements de stock
3. **Ne désactivez pas RLS** sur les tables Supabase
4. **N'exposez jamais** la `service_role` key côté client
5. **Ne traitez pas manuellement** une vente déjà synchronisée

---

## 🔐 Sécurité

### Variables Sensibles

**Ne jamais exposer :**
- `SUPABASE_SERVICE_ROLE_KEY`
- `LIGHTSPEED_API_SECRET`
- `LIGHTSPEED_WEBHOOK_SECRET`

Ces variables ne doivent exister que :
- Dans `.env.local` (dev)
- Dans les variables d'environnement Vercel (prod)

### Validation des Webhooks

Le système vérifie automatiquement la signature HMAC des webhooks Lightspeed pour garantir l'authenticité.

---

## 📞 Support

Pour toute question :
1. Consultez d'abord ce guide
2. Vérifiez les logs dans `/lightspeed-monitoring`
3. Examinez la table `sync_logs` pour les erreurs détaillées
4. Contactez l'équipe technique si nécessaire

---

**Bonne utilisation !** 🚀
