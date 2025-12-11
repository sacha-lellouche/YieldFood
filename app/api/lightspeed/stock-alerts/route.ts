// API Route pour récupérer les alertes de stock
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/lightspeed/stock-alerts?userId=xxx&resolved=false
 * Récupère les alertes de stock
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const resolved = searchParams.get('resolved') === 'true'
    const alertType = searchParams.get('type') // 'low_stock', 'out_of_stock', 'negative_stock'

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('stock_alerts')
      .select(`
        *,
        ingredient:ingredients(name, unit, current_stock)
      `)
      .eq('user_id', userId)
      .eq('is_resolved', resolved)
      .order('created_at', { ascending: false })

    if (alertType) {
      query = query.eq('alert_type', alertType)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      alerts: data || []
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération des alertes:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/lightspeed/stock-alerts
 * Marque une alerte comme résolue
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { alertId, userId } = body

    if (!alertId || !userId) {
      return NextResponse.json(
        { success: false, error: 'alertId and userId are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('stock_alerts')
      .update({ 
        is_resolved: true,
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      alert: data
    })

  } catch (error: any) {
    console.error('Erreur lors de la résolution de l\'alerte:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
