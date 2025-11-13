import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * PATCH /api/stock/[productId]/adjust
 * Ajuste la quantité d'un produit spécifique dans le stock
 * 
 * Body: {
 *   quantity: number;  // Quantité à ajouter (positif) ou retirer (négatif)
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
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
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const productId = params.productId

    // Récupérer et valider les données
    const body = await request.json()
    const { quantity } = body

    if (typeof quantity !== 'number') {
      return NextResponse.json(
        { error: 'La quantité doit être un nombre' },
        { status: 400 }
      )
    }

    // 1. Vérifier que le produit existe
    const { data: product, error: productError } = await supabase
      .from('product')
      .select('id, name, unit')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produit introuvable' },
        { status: 404 }
      )
    }

    // 2. Récupérer le stock actuel
    const { data: currentStock, error: stockError } = await supabase
      .from('stock')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle()

    if (stockError) {
      console.error('Error fetching stock:', stockError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du stock' },
        { status: 500 }
      )
    }

    // 3. Calculer la nouvelle quantité
    const currentQuantity = currentStock?.quantity || 0
    const newQuantity = currentQuantity + quantity

    // 4. Vérifier que la quantité ne devient pas négative
    if (newQuantity < 0) {
      return NextResponse.json(
        { 
          error: 'Quantité insuffisante',
          details: `Stock actuel: ${currentQuantity} ${product.unit}. Ajustement demandé: ${quantity} ${product.unit}.`,
          currentQuantity,
          requestedAdjustment: quantity
        },
        { status: 400 }
      )
    }

    // 5. Mettre à jour ou créer le stock
    let result
    if (currentStock) {
      // Mise à jour du stock existant
      const { data, error } = await supabase
        .from('stock')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentStock.id)
        .eq('user_id', user.id)
        .select('id, user_id, product_id, quantity, created_at, updated_at')
        .single()

      if (error) {
        console.error('Error updating stock:', error)
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour du stock' },
          { status: 500 }
        )
      }
      result = data
    } else {
      // Création d'un nouveau stock
      if (quantity < 0) {
        return NextResponse.json(
          { 
            error: 'Stock inexistant',
            details: 'Impossible de retirer du stock pour un produit non présent dans votre inventaire.'
          },
          { status: 400 }
        )
      }

      const { data, error } = await supabase
        .from('stock')
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity: newQuantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, user_id, product_id, quantity, created_at, updated_at')
        .single()

      if (error) {
        console.error('Error creating stock:', error)
        return NextResponse.json(
          { error: 'Erreur lors de la création du stock' },
          { status: 500 }
        )
      }
      result = data
    }

    return NextResponse.json({
      success: true,
      message: quantity > 0 
        ? `Ajouté ${quantity} ${product.unit} de ${product.name}`
        : `Retiré ${Math.abs(quantity)} ${product.unit} de ${product.name}`,
      product: {
        id: product.id,
        name: product.name,
        unit: product.unit
      },
      stock: result,
      previousQuantity: currentQuantity,
      newQuantity: newQuantity,
      adjustment: quantity
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
