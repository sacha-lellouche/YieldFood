import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * GET /api/products
 * Récupère tous les produits disponibles dans le catalogue
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

    // Construire la requête
    let query = supabase
      .from('product')
      .select('*')
      .order('name', { ascending: true })

    // Appliquer la recherche si présente
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Appliquer le filtre de catégorie si présent
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des produits' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products
 * Crée un nouveau produit dans le catalogue
 * Body: { name: string, unit: string, category?: string }
 */
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
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer et valider les données
    const body = await request.json()
    const { name, unit, category, description, low_stock_threshold, force } = body

    if (!name || !unit) {
      return NextResponse.json(
        { error: 'Le nom et l\'unité sont requis' },
        { status: 400 }
      )
    }

    // Vérifier si le produit existe déjà (exactement le même nom)
    // Sauf si force=true, on permet la création
    if (!force) {
      const { data: existing } = await supabase
        .from('product')
        .select('id, name')
        .ilike('name', name.trim())
        .maybeSingle()

      if (existing) {
        return NextResponse.json(
          { 
            error: 'Un produit similaire existe déjà',
            existingProduct: existing.name,
            suggestion: 'Voulez-vous créer ce produit quand même ?'
          },
          { status: 409 }
        )
      }
    }

    // Créer le produit
    const { data: newProduct, error: insertError } = await supabase
      .from('product')
      .insert([
        {
          name: name.trim(),
          unit: unit.trim(),
          category: category?.trim() || null,
          description: description?.trim() || null,
          low_stock_threshold: low_stock_threshold || 5,
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating product:', insertError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du produit' },
        { status: 500 }
      )
    }

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/products:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
