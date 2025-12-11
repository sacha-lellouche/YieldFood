import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// POST /api/stock/fill-all - Remplit tous les stocks pour éviter les ruptures
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    console.log('[Fill-All] Starting stock fill for user:', user.id)

    // Récupérer tous les stocks de l'utilisateur avec les infos du produit
    const { data: stocks, error: stocksError } = await supabase
      .from('stock')
      .select(`
        id,
        quantity,
        product_id,
        product:product_id (
          id,
          name,
          low_stock_threshold
        )
      `)
      .eq('user_id', user.id)

    if (stocksError) {
      console.error('[Fill-All] Error fetching stocks:', stocksError)
      return NextResponse.json({ error: stocksError.message }, { status: 500 })
    }

    console.log(`[Fill-All] Found ${stocks?.length || 0} stock entries`)

    // Mettre à jour chaque stock qui est à 0 ou en dessous du seuil
    let updatedCount = 0
    const updates = []

    for (const stock of stocks || []) {
      const threshold = stock.product.low_stock_threshold || 10
      const currentQty = stock.quantity || 0
      
      // Si stock en rupture (0), mettre à un niveau moyen
      // Si stock bas (< threshold), le remplir un peu au-dessus du seuil
      let newQuantity = currentQty
      
      if (currentQty === 0) {
        // Stock en rupture -> mettre à 50
        newQuantity = 50
        console.log(`[Fill-All] ${stock.product.name}: 0 -> 50 (rupture)`)
      } else if (currentQty < threshold) {
        // Stock bas -> mettre juste au-dessus du seuil
        newQuantity = threshold + 5
        console.log(`[Fill-All] ${stock.product.name}: ${currentQty} -> ${newQuantity} (bas)`)
      } else {
        // Stock ok, on ne touche pas
        continue
      }

      updates.push({
        id: stock.id,
        newQuantity
      })
    }

    console.log(`[Fill-All] Will update ${updates.length} stocks`)

    // Effectuer les mises à jour
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('stock')
        .update({ quantity: update.newQuantity })
        .eq('id', update.id)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('[Fill-All] Error updating stock:', updateError)
      } else {
        updatedCount++
      }
    }

    console.log(`[Fill-All] Successfully updated ${updatedCount} stocks`)

    return NextResponse.json({
      success: true,
      stocksUpdated: updatedCount,
      message: `${updatedCount} stock(s) mis à jour - Aucun ingrédient en rupture`
    })

  } catch (error) {
    console.error('[Fill-All] Unexpected error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
