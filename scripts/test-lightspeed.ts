// Script de test pour le système Lightspeed
// Utilisation: node --loader ts-node/esm test-lightspeed.ts

import { LightspeedSale } from '../types/lightspeed'

// ==================== DONNÉES DE TEST ====================

/**
 * Exemple de vente Lightspeed: 2 Paninis Végétariens
 */
export const mockSale1: LightspeedSale = {
  saleID: 123456,
  orderNumber: 'ORD-20241120-0001',
  createTime: '2024-11-20T12:30:00Z',
  orderStatus: 'completed',
  total: '25.96',
  tax: '5.20',
  Customer: {
    customerID: 789,
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com'
  },
  SaleLines: {
    SaleLine: [
      {
        lineID: 1,
        itemID: 5001,
        description: 'Panini Végétarien',
        sku: 'PAN-001',
        quantity: 2,
        unitPrice: '6.49',
        total: '12.98',
        tax: '2.60'
      }
    ]
  }
}

/**
 * Exemple de vente multiple: 1 Burger, 2 Frites, 1 Salade
 */
export const mockSale2: LightspeedSale = {
  saleID: 123457,
  orderNumber: 'ORD-20241120-0002',
  createTime: '2024-11-20T13:15:00Z',
  orderStatus: 'completed',
  total: '32.45',
  tax: '6.49',
  SaleLines: {
    SaleLine: [
      {
        lineID: 1,
        itemID: 5002,
        description: 'Burger Classic',
        sku: 'BUR-001',
        quantity: 1,
        unitPrice: '8.99',
        total: '8.99',
        tax: '1.80'
      },
      {
        lineID: 2,
        itemID: 5003,
        description: 'Frites Maison',
        sku: 'FRI-001',
        quantity: 2,
        unitPrice: '3.99',
        total: '7.98',
        tax: '1.60'
      },
      {
        lineID: 3,
        itemID: 5004,
        description: 'Salade César',
        sku: 'SAL-001',
        quantity: 1,
        unitPrice: '6.99',
        total: '6.99',
        tax: '1.40'
      }
    ]
  }
}

/**
 * Vente avec statut non-completed (doit être ignorée)
 */
export const mockSalePending: LightspeedSale = {
  saleID: 123458,
  orderNumber: 'ORD-20241120-0003',
  createTime: '2024-11-20T14:00:00Z',
  orderStatus: 'pending',
  total: '12.98',
  SaleLines: {
    SaleLine: {
      lineID: 1,
      itemID: 5001,
      description: 'Panini Végétarien',
      sku: 'PAN-001',
      quantity: 2,
      unitPrice: '6.49',
      total: '12.98'
    }
  }
}

/**
 * Vente avec SKU inexistant (test d'erreur)
 */
export const mockSaleInvalidSku: LightspeedSale = {
  saleID: 123459,
  orderNumber: 'ORD-20241120-0004',
  createTime: '2024-11-20T15:00:00Z',
  orderStatus: 'completed',
  total: '9.99',
  SaleLines: {
    SaleLine: {
      lineID: 1,
      itemID: 9999,
      description: 'Produit Inexistant',
      sku: 'UNKNOWN-SKU',
      quantity: 1,
      unitPrice: '9.99',
      total: '9.99'
    }
  }
}

// ==================== FONCTIONS DE TEST ====================

/**
 * Teste le webhook avec les ventes mockées
 */
export async function testWebhook(baseUrl: string, userId: string) {
  console.log('🧪 Test du Webhook Lightspeed\n')
  console.log('=' .repeat(60))

  const tests = [
    { name: 'Vente valide (2 Paninis)', sale: mockSale1, shouldSucceed: true },
    { name: 'Vente multiple', sale: mockSale2, shouldSucceed: true },
    { name: 'Vente pending (ignorée)', sale: mockSalePending, shouldSucceed: false },
    { name: 'SKU inexistant', sale: mockSaleInvalidSku, shouldSucceed: false }
  ]

  for (const test of tests) {
    console.log(`\n📋 Test: ${test.name}`)
    console.log('-'.repeat(60))

    try {
      const response = await fetch(`${baseUrl}/api/lightspeed/manual-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale: test.sale,
          userId,
          validateOnly: false,
          allowNegativeStock: true
        })
      })

      const result = await response.json()

      if (response.ok && test.shouldSucceed) {
        console.log(`✅ SUCCÈS`)
        console.log(`   Sale ID: ${result.result?.saleId}`)
        console.log(`   Recettes: ${result.result?.recipesProcessed}`)
        console.log(`   Ingrédients mis à jour: ${result.result?.ingredientsUpdated}`)
        console.log(`   Alertes: ${result.result?.alertsGenerated}`)
      } else if (!response.ok && !test.shouldSucceed) {
        console.log(`✅ ERREUR ATTENDUE`)
        console.log(`   Message: ${result.message}`)
      } else if (response.ok && !test.shouldSucceed) {
        console.log(`⚠️  AVERTISSEMENT: Test devrait échouer mais a réussi`)
        console.log(`   Result:`, result)
      } else {
        console.log(`❌ ÉCHEC INATTENDU`)
        console.log(`   Status: ${response.status}`)
        console.log(`   Error: ${result.error}`)
      }

    } catch (error: any) {
      console.log(`❌ ERREUR RÉSEAU: ${error.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
}

/**
 * Teste la récupération des logs
 */
export async function testGetLogs(baseUrl: string, userId: string) {
  console.log('\n\n🧪 Test: Récupération des logs\n')
  console.log('=' .repeat(60))

  try {
    const response = await fetch(
      `${baseUrl}/api/lightspeed/sync-logs?userId=${userId}&limit=10`
    )
    const result = await response.json()

    if (response.ok) {
      console.log(`✅ ${result.count} logs récupérés`)
      
      if (result.logs.length > 0) {
        console.log('\n📊 Derniers logs:')
        result.logs.slice(0, 3).forEach((log: any, i: number) => {
          console.log(`\n${i + 1}. Sale ${log.lightspeed_sale_id}`)
          console.log(`   Status: ${log.status}`)
          console.log(`   Ingrédients: ${log.ingredients_updated}`)
          console.log(`   Date: ${new Date(log.created_at).toLocaleString()}`)
        })
      }
    } else {
      console.log(`❌ Erreur: ${result.error}`)
    }
  } catch (error: any) {
    console.log(`❌ ERREUR: ${error.message}`)
  }

  console.log('\n' + '='.repeat(60))
}

/**
 * Teste la récupération des alertes
 */
export async function testGetAlerts(baseUrl: string, userId: string) {
  console.log('\n\n🧪 Test: Récupération des alertes\n')
  console.log('=' .repeat(60))

  try {
    const response = await fetch(
      `${baseUrl}/api/lightspeed/stock-alerts?userId=${userId}&resolved=false`
    )
    const result = await response.json()

    if (response.ok) {
      console.log(`✅ ${result.count} alertes actives`)
      
      if (result.alerts.length > 0) {
        console.log('\n⚠️  Alertes de stock:')
        result.alerts.forEach((alert: any, i: number) => {
          console.log(`\n${i + 1}. ${alert.ingredient?.name}`)
          console.log(`   Type: ${alert.alert_type}`)
          console.log(`   Stock actuel: ${alert.current_stock}`)
          console.log(`   Seuil minimum: ${alert.minimum_stock}`)
          console.log(`   Date: ${new Date(alert.created_at).toLocaleString()}`)
        })
      } else {
        console.log('\n✅ Aucune alerte active')
      }
    } else {
      console.log(`❌ Erreur: ${result.error}`)
    }
  } catch (error: any) {
    console.log(`❌ ERREUR: ${error.message}`)
  }

  console.log('\n' + '='.repeat(60))
}

// ==================== SCRIPT PRINCIPAL ====================

async function main() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const userId = process.env.TEST_USER_ID

  console.log('\n')
  console.log('╔═══════════════════════════════════════════════════════════╗')
  console.log('║       TEST SYSTÈME LIGHTSPEED - GESTION DE STOCK         ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')
  console.log(`\nBase URL: ${baseUrl}`)
  console.log(`User ID: ${userId || 'NON DÉFINI'}\n`)

  if (!userId) {
    console.error('❌ ERROR: TEST_USER_ID non défini dans les variables d\'environnement')
    console.log('\nPour exécuter les tests, définissez:')
    console.log('  export TEST_USER_ID="your-user-uuid"')
    console.log('  npm run test:lightspeed\n')
    process.exit(1)
  }

  try {
    // Exécuter les tests
    await testWebhook(baseUrl, userId)
    await testGetLogs(baseUrl, userId)
    await testGetAlerts(baseUrl, userId)

    console.log('\n✅ Tous les tests sont terminés!\n')
  } catch (error: any) {
    console.error('\n❌ Erreur lors des tests:', error.message)
    process.exit(1)
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main()
}
