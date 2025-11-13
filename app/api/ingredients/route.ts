import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// GET /api/ingredients - Liste tous les ingrédients de l'utilisateur
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
    const sortBy = searchParams.get('sortBy') || 'updated_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Construire la requête
    let query = supabase
      .from('ingredients')
      .select('*')
      .eq('user_id', user.id)

    // Appliquer la recherche si présente
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Appliquer le tri
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching ingredients:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des ingrédients' },
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

// POST /api/ingredients - Ajoute un nouvel ingrédient
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
    const { product_id, name, quantity, unit } = body

    // Cas 1: Création depuis le catalogue (avec product_id)
    if (product_id) {
      if (!quantity) {
        return NextResponse.json(
          { error: 'La quantité est requise' },
          { status: 400 }
        )
      }

      if (typeof quantity !== 'number' || quantity < 0) {
        return NextResponse.json(
          { error: 'La quantité doit être un nombre positif' },
          { status: 400 }
        )
      }

      // Récupérer les infos du produit
      const { data: product, error: productError } = await supabase
        .from('product')
        .select('name, unit')
        .eq('id', product_id)
        .single()

      if (productError || !product) {
        return NextResponse.json(
          { error: 'Produit non trouvé' },
          { status: 404 }
        )
      }

      // Insérer l'ingrédient avec les infos du produit
      const { data, error } = await supabase
        .from('ingredients')
        .insert([
          {
            user_id: user.id,
            product_id: product_id,
            name: product.name,
            quantity,
            unit: product.unit,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating ingredient:', error)
        return NextResponse.json(
          { error: 'Erreur lors de la création de l\'ingrédient' },
          { status: 500 }
        )
      }

      return NextResponse.json(data, { status: 201 })
    }

    // Cas 2: Création manuelle (avec name et unit)
    if (!name || !quantity || !unit) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis (nom, quantité, unité)' },
        { status: 400 }
      )
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json(
        { error: 'La quantité doit être un nombre positif' },
        { status: 400 }
      )
    }

    // Insérer l'ingrédient
    const { data, error } = await supabase
      .from('ingredients')
      .insert([
        {
          user_id: user.id,
          name: name.trim(),
          quantity,
          unit: unit.trim(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating ingredient:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'ingrédient' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
