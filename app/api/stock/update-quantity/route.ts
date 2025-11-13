import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * PATCH /api/stock/update-quantity
 * Modifie dynamiquement la quantité d'un produit dans le stock
 * 
 * Body: {
 *   productName: string;     // Nom du produit (ex: "Tomate")
 *   deltaQuantity: number;   // Quantité à ajouter/retirer (ex: 5 ou -2)
 *   isAddition: boolean;     // true = ajout, false = retrait
 * }
 */
export async function PATCH(request: NextRequest) {
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

    // Récupérer et valider les données
    const body = await request.json()
    const { productName, deltaQuantity, isAddition } = body

    if (!productName || typeof productName !== 'string') {
      return NextResponse.json(
        { error: 'Le nom du produit est requis' },
        { status: 400 }
      )
    }

    if (typeof deltaQuantity !== 'number' || deltaQuantity <= 0) {
      return NextResponse.json(
        { error: 'La quantité doit être un nombre positif' },
        { status: 400 }
      )
    }

    if (typeof isAddition !== 'boolean') {
      return NextResponse.json(
        { error: 'isAddition doit être un booléen' },
        { status: 400 }
      )
    }

    // 1. Trouver le produit par son nom
    const { data: product, error: productError } = await supabase
      .from('product')
      .select('id, name, unit')
      .ilike('name', productName)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: `Produit "${productName}" introuvable` },
        { status: 404 }
      )
    }

    // 2. Récupérer le stock actuel de l'utilisateur pour ce produit
    const { data: currentStock, error: stockError } = await supabase
      .from('stock')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .single()

    if (stockError && stockError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching stock:', stockError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du stock' },
        { status: 500 }
      )
    }

    // 3. Calculer la nouvelle quantité
    const currentQuantity = currentStock?.quantity || 0
    const adjustment = isAddition ? deltaQuantity : -deltaQuantity
    const newQuantity = currentQuantity + adjustment

    // 4. Vérifier que la quantité ne devient pas négative
    if (newQuantity < 0) {
      return NextResponse.json(
        { 
          error: 'Quantité insuffisante',
          details: `Stock actuel: ${currentQuantity} ${product.unit}. Impossible de retirer ${deltaQuantity} ${product.unit}.`
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
        .eq('user_id', user.id) // Sécurité : vérifier que c'est bien le stock de l'utilisateur
        .select('*, product:product_id(name, unit)')
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
      // Création d'un nouveau stock (si c'est un ajout)
      if (!isAddition) {
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
          product_id: product.id,
          quantity: newQuantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*, product:product_id(name, unit)')
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
      message: `${isAddition ? 'Ajouté' : 'Retiré'} ${deltaQuantity} ${product.unit} de ${product.name}`,
      stock: result,
      previousQuantity: currentQuantity,
      newQuantity: newQuantity,
      adjustment: adjustment
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
