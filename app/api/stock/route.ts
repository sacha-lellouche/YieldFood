import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * GET /api/stock
 * Récupère tous les stocks de l'utilisateur avec les informations des produits
 */
export async function GET(request: NextRequest) {
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

    // Récupérer les paramètres de recherche
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const lowStock = searchParams.get('lowStock') // threshold pour stock bas

    // Construire la requête avec jointure sur product
    let query = supabase
      .from('stock')
      .select(`
        id,
        user_id,
        product_id,
        quantity,
        supplier_id,
        category_override,
        created_at,
        updated_at,
        product:product_id (
          id,
          name,
          description,
          unit,
          category,
          low_stock_threshold,
          created_at
        )
      `)
      .eq('user_id', user.id)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching stocks:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des stocks' },
        { status: 500 }
      )
    }

    // Transformer les données pour avoir product comme objet unique
    const transformedData = (data || []).map(stock => ({
      ...stock,
      product: Array.isArray(stock.product) ? stock.product[0] : stock.product
    }))

    // Filtrage côté serveur (si nécessaire)
    let filteredData = transformedData

    // Filtrer par recherche (nom ou catégorie)
    if (search) {
      const searchLower = search.toLowerCase()
      filteredData = filteredData.filter(stock => 
        stock.product?.name?.toLowerCase().includes(searchLower) ||
        stock.product?.category?.toLowerCase().includes(searchLower)
      )
    }

    // Filtrer par catégorie
    if (category) {
      filteredData = filteredData.filter(stock => 
        stock.product?.category === category
      )
    }

    // Filtrer par stock bas
    if (lowStock) {
      const threshold = parseFloat(lowStock)
      filteredData = filteredData.filter(stock => 
        stock.quantity < threshold
      )
    }

    // Trier par quantité ascendante pour mettre en avant les stocks bas
    filteredData.sort((a, b) => a.quantity - b.quantity)

    return NextResponse.json(filteredData)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/stock
 * Crée un nouveau stock pour un produit
 * Body: { product_id: string, quantity: number }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/stock - Starting')
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
    console.log('Checking authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }
    console.log('User authenticated:', user.id)

    // Récupérer et valider les données
    const body = await request.json()
    console.log('Request body:', body)
    const { product_id, quantity } = body

    if (!product_id) {
      console.error('Missing product_id')
      return NextResponse.json(
        { error: 'Le product_id est requis' },
        { status: 400 }
      )
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      console.error('Invalid quantity:', quantity)
      return NextResponse.json(
        { error: 'La quantité doit être un nombre positif' },
        { status: 400 }
      )
    }

    // Vérifier que le produit existe
    console.log('Checking if product exists:', product_id)
    const { data: product, error: productError } = await supabase
      .from('product')
      .select('id, name, unit')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      console.error('Product not found:', productError)
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }
    console.log('Product found:', product)

    // Vérifier si un stock existe déjà pour ce produit
    console.log('Checking for existing stock...')
    const { data: existingStock } = await supabase
      .from('stock')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .single()

    if (existingStock) {
      console.log('Stock already exists:', existingStock)
      return NextResponse.json(
        { error: 'Un stock existe déjà pour ce produit. Utilisez l\'édition pour le modifier.' },
        { status: 409 }
      )
    }

    // Créer le stock
    console.log('Creating stock...')
    const { data: newStock, error: insertError } = await supabase
      .from('stock')
      .insert([
        {
          user_id: user.id,
          product_id: product_id,
          quantity: quantity,
        },
      ])
      .select(`
        id,
        user_id,
        product_id,
        quantity,
        supplier_id,
        category_override,
        created_at,
        updated_at,
        product:product_id (
          id,
          name,
          description,
          unit,
          category,
          created_at
        )
      `)
      .single()

    if (insertError) {
      console.error('Error creating stock:', insertError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du stock' },
        { status: 500 }
      )
    }

    // Transformer les données
    const transformedStock = {
      ...newStock,
      product: Array.isArray(newStock.product) ? newStock.product[0] : newStock.product
    }

    console.log('Stock created successfully:', transformedStock.id)
    return NextResponse.json(transformedStock, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/stock:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/stock?id=xxx
 * Supprime un stock par son ID (passé en query parameter)
 */
export async function DELETE(request: NextRequest) {
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

    // Récupérer l'ID depuis les query params
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'L\'ID du stock est requis' },
        { status: 400 }
      )
    }

    // Vérifier que le stock existe et appartient à l'utilisateur
    const { data: stock, error: fetchError } = await supabase
      .from('stock')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !stock) {
      return NextResponse.json(
        { error: 'Stock non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le stock
    const { error: deleteError } = await supabase
      .from('stock')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting stock:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du stock' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Stock supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/stock?id=xxx
 * Met à jour un stock existant
 * Body: { product_id: string, quantity: number }
 */
export async function PUT(request: NextRequest) {
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

    // Récupérer l'ID depuis les query params
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'L\'ID du stock est requis' },
        { status: 400 }
      )
    }

    // Récupérer les données du body
    const body = await request.json()
    const { product_id, quantity, supplier_id, category_override } = body

    if (typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json(
        { error: 'La quantité doit être un nombre positif' },
        { status: 400 }
      )
    }

    // Vérifier que le stock existe et appartient à l'utilisateur
    const { data: stock, error: fetchError } = await supabase
      .from('stock')
      .select('id, user_id, product_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !stock) {
      return NextResponse.json(
        { error: 'Stock non trouvé' },
        { status: 404 }
      )
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      quantity: quantity,
      updated_at: new Date().toISOString(),
    }

    // Ajouter supplier_id si fourni
    if (supplier_id !== undefined) {
      updateData.supplier_id = supplier_id
    }

    // Ajouter category_override si fourni
    if (category_override !== undefined) {
      updateData.category_override = category_override
    }

    // Mettre à jour le stock
    const { data: updatedStock, error: updateError } = await supabase
      .from('stock')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        id,
        user_id,
        product_id,
        quantity,
        supplier_id,
        category_override,
        created_at,
        updated_at,
        product:product_id (
          id,
          name,
          description,
          unit,
          category,
          created_at
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating stock:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du stock' },
        { status: 500 }
      )
    }

    // Transformer les données
    const transformedStock = {
      ...updatedStock,
      product: Array.isArray(updatedStock.product) ? updatedStock.product[0] : updatedStock.product
    }

    return NextResponse.json(transformedStock, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in PUT /api/stock:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
