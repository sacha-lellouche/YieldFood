import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Normalise un nom d'ingrédient (singulier/pluriel)
 * Gère les pluriels courants en français
 */
function normalizeIngredientName(name: string): string[] {
  const normalized = name.toLowerCase().trim()
  const variations: string[] = [normalized]

  // Règles de pluriel français
  if (normalized.endsWith('s')) {
    // Enlever le 's' final pour le singulier
    variations.push(normalized.slice(0, -1))
  } else if (normalized.endsWith('x')) {
    // Remplacer 'x' par 'au' ou enlever le 'x'
    variations.push(normalized.slice(0, -1))
    if (normalized.endsWith('aux')) {
      variations.push(normalized.slice(0, -3) + 'al')
    }
  } else if (normalized.endsWith('aux')) {
    // poireaux -> poireau
    variations.push(normalized.slice(0, -1))
    variations.push(normalized.slice(0, -3) + 'al')
  } else if (normalized.endsWith('oux')) {
    // choux -> chou
    variations.push(normalized.slice(0, -1))
  } else {
    // Ajouter les formes plurielles
    variations.push(normalized + 's')
    
    // Si se termine par 'al', ajouter 'aux'
    if (normalized.endsWith('al')) {
      variations.push(normalized.slice(0, -2) + 'aux')
    }
    
    // Si se termine par 'au' ou 'eu', ajouter 'x'
    if (normalized.endsWith('au') || normalized.endsWith('eu')) {
      variations.push(normalized + 'x')
    }
  }

  return [...new Set(variations)] // Enlever les doublons
}

/**
 * GET /api/ingredients/search?q=pomme
 * Recherche des ingrédients avec suggestions et gestion singulier/pluriel
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

    // Récupérer le terme de recherche
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length < 2) {
      return NextResponse.json([])
    }

    // Normaliser la recherche pour gérer singulier/pluriel
    const variations = normalizeIngredientName(query)
    
    // Rechercher dans les produits (catalogue)
    const productSearches = variations.map(variation => 
      supabase
        .from('product')
        .select('id, name, unit, category')
        .ilike('name', `%${variation}%`)
        .limit(limit)
    )

    const productResults = await Promise.all(productSearches)
    
    // Fusionner et dédupliquer les résultats
    const uniqueProducts = new Map()
    productResults.forEach(result => {
      if (result.data) {
        result.data.forEach(product => {
          if (!uniqueProducts.has(product.id)) {
            uniqueProducts.set(product.id, {
              ...product,
              source: 'catalog'
            })
          }
        })
      }
    })

    // Rechercher dans les ingrédients utilisés par l'utilisateur (historique)
    const ingredientSearches = variations.map(variation =>
      supabase
        .from('recipe_ingredients')
        .select('ingredient_name, unit')
        .eq('user_id', user.id)
        .ilike('ingredient_name', `%${variation}%`)
        .limit(limit)
    )

    const ingredientResults = await Promise.all(ingredientSearches)
    
    // Fusionner les ingrédients de l'historique
    const uniqueIngredients = new Map()
    ingredientResults.forEach(result => {
      if (result.data) {
        result.data.forEach(ingredient => {
          const key = ingredient.ingredient_name.toLowerCase()
          if (!uniqueIngredients.has(key)) {
            uniqueIngredients.set(key, {
              name: ingredient.ingredient_name,
              unit: ingredient.unit,
              source: 'history'
            })
          }
        })
      }
    })

    // Combiner les résultats
    const suggestions = [
      ...Array.from(uniqueProducts.values()).map(p => ({
        id: p.id,
        name: p.name,
        unit: p.unit,
        category: p.category,
        source: 'catalog' as const
      })),
      ...Array.from(uniqueIngredients.values()).map(i => ({
        name: i.name,
        unit: i.unit,
        source: 'history' as const
      }))
    ]

    // Trier par pertinence (exact match en premier)
    suggestions.sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()
      const queryLower = query.toLowerCase()

      // Exact match en premier
      if (aName === queryLower && bName !== queryLower) return -1
      if (bName === queryLower && aName !== queryLower) return 1

      // Commence par la requête
      const aStarts = aName.startsWith(queryLower)
      const bStarts = bName.startsWith(queryLower)
      if (aStarts && !bStarts) return -1
      if (bStarts && !aStarts) return 1

      // Catalogue en premier, puis historique
      if (a.source === 'catalog' && b.source === 'history') return -1
      if (a.source === 'history' && b.source === 'catalog') return 1

      // Alphabétique
      return aName.localeCompare(bName)
    })

    // Limiter les résultats
    return NextResponse.json(suggestions.slice(0, limit))
  } catch (error) {
    console.error('Unexpected error in ingredients search:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
