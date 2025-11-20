// API Route pour synchronisation manuelle et tests
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processSaleFromLightspeed } from '@/lib/lightspeed-service'
import { LightspeedSale, SyncOptions } from '@/types/lightspeed'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/**
 * POST /api/lightspeed/manual-sync
 * Endpoint pour déclencher manuellement le traitement d'une vente
 * Utile pour les tests et la récupération de ventes manquées
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sale, userId, validateOnly = false, allowNegativeStock = true } = body

    // Validation
    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Sale data is required' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    // Options de traitement
    const options: SyncOptions = {
      userId,
      syncType: 'manual_sync',
      validateOnly,
      allowNegativeStock,
      skipDuplicateCheck: false
    }

    console.log(`🔧 Synchronisation manuelle: Sale ${sale.saleID}`)
    
    // Traiter la vente
    const result = await processSaleFromLightspeed(sale as LightspeedSale, options)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Vente traitée avec succès',
        result
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Erreur lors du traitement',
          errors: result.errors,
          result
        },
        { status: 422 }
      )
    }

  } catch (error: any) {
    console.error('Erreur lors de la synchronisation manuelle:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
