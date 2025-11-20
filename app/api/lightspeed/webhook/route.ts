// API Route pour le webhook Lightspeed
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processSaleFromLightspeed } from '@/lib/lightspeed-service'
import { 
  LightspeedSale, 
  LightspeedWebhookPayload,
  WebhookResponse,
  SyncOptions 
} from '@/types/lightspeed'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const webhookSecret = process.env.LIGHTSPEED_WEBHOOK_SECRET

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Vérifie la signature HMAC du webhook (si configurée)
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!webhookSecret) {
    console.warn('⚠️  LIGHTSPEED_WEBHOOK_SECRET non configuré - validation de signature désactivée')
    return true // Accepter si pas de secret configuré (dev mode)
  }

  if (!signature) {
    return false
  }

  try {
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Erreur lors de la vérification de signature:', error)
    return false
  }
}

/**
 * Récupère l'utilisateur associé au compte Lightspeed
 * NOTE: À adapter selon votre logique de mapping accountID -> user_id
 */
async function getUserIdFromLightspeedAccount(
  accountId: string
): Promise<string | null> {
  // Option 1: Table de mapping dans Supabase
  // const { data } = await supabaseAdmin
  //   .from('lightspeed_accounts')
  //   .select('user_id')
  //   .eq('account_id', accountId)
  //   .single()
  // return data?.user_id || null

  // Option 2: Utiliser le premier utilisateur (pour dev/test)
  const { data } = await supabaseAdmin
    .from('ingredients')
    .select('user_id')
    .limit(1)
    .single()

  return data?.user_id || null
}

/**
 * POST /api/lightspeed/webhook
 * Endpoint pour recevoir les webhooks de Lightspeed
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 1. Lire le payload
    const rawBody = await request.text()
    const signature = request.headers.get('x-lightspeed-signature')

    // 2. Vérifier la signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('❌ Signature de webhook invalide')
      return NextResponse.json(
        { 
          success: false, 
          message: 'Signature invalide',
          error: 'Invalid webhook signature'
        } as WebhookResponse,
        { status: 401 }
      )
    }

    // 3. Parser le JSON
    let payload: LightspeedWebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch (error) {
      console.error('❌ JSON invalide:', error)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Format JSON invalide',
          error: 'Invalid JSON payload',
          processedAt: new Date().toISOString()
        } as WebhookResponse,
        { status: 400 }
      )
    }

    console.log(`📥 Webhook reçu: ${payload.eventType} - Sale ID: ${payload.objectId}`)

    // 4. Vérifier le type d'événement
    if (!['sale.created', 'sale.completed', 'sale.updated'].includes(payload.eventType)) {
      console.log(`ℹ️  Type d'événement ignoré: ${payload.eventType}`)
      return NextResponse.json(
        { 
          success: true, 
          message: `Type d'événement ${payload.eventType} ignoré`,
          processedAt: new Date().toISOString()
        } as WebhookResponse,
        { status: 200 }
      )
    }

    // 5. Récupérer l'utilisateur
    const userId = await getUserIdFromLightspeedAccount(payload.accountID)
    if (!userId) {
      console.error(`❌ Aucun utilisateur trouvé pour accountID: ${payload.accountID}`)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Compte Lightspeed non associé à un utilisateur',
          error: `No user found for accountID: ${payload.accountID}`,
          processedAt: new Date().toISOString()
        } as WebhookResponse,
        { status: 404 }
      )
    }

    // 6. Extraire les données de vente
    const sale: LightspeedSale = payload.data

    // 7. Options de traitement
    const options: SyncOptions = {
      userId,
      syncType: 'webhook',
      allowNegativeStock: true, // À configurer selon vos besoins
      skipDuplicateCheck: false
    }

    // 8. Traiter la vente
    console.log(`⚙️  Traitement de la vente ${sale.saleID} - Commande ${sale.orderNumber}`)
    const result = await processSaleFromLightspeed(sale, options)

    const duration = Date.now() - startTime

    if (result.success) {
      console.log(`✅ Vente traitée avec succès en ${duration}ms:`)
      console.log(`   - ${result.recipesProcessed} recettes traitées`)
      console.log(`   - ${result.ingredientsUpdated} ingrédients mis à jour`)
      console.log(`   - ${result.stockMovementsCreated} mouvements de stock créés`)
      console.log(`   - ${result.alertsGenerated} alertes générées`)

      return NextResponse.json(
        {
          success: true,
          message: 'Vente traitée avec succès',
          saleId: result.saleId,
          orderNumber: result.orderNumber,
          processedAt: new Date().toISOString(),
          result
        } as WebhookResponse,
        { status: 200 }
      )
    } else {
      console.error(`⚠️  Vente partiellement traitée:`, result.errors)
      
      return NextResponse.json(
        {
          success: false,
          message: 'Erreur lors du traitement de la vente',
          saleId: result.saleId,
          orderNumber: result.orderNumber,
          processedAt: new Date().toISOString(),
          error: result.errors.join('; '),
          result
        } as WebhookResponse,
        { status: 422 }
      )
    }

  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`❌ Erreur fatale lors du traitement du webhook (${duration}ms):`, error)

    return NextResponse.json(
      {
        success: false,
        message: 'Erreur interne du serveur',
        error: error.message,
        processedAt: new Date().toISOString()
      } as WebhookResponse,
      { status: 500 }
    )
  }
}

/**
 * GET /api/lightspeed/webhook
 * Endpoint de vérification (health check)
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'Lightspeed Webhook',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}
