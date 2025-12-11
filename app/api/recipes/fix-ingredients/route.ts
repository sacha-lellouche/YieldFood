import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * API pour réparer automatiquement les liens entre recipe_ingredients et ingredients
 * POST /api/recipes/fix-ingredients
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
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 1. Récupérer toutes les recettes de l'utilisateur avec leurs ingrédients sans ID
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select(`
        id,
        name,
        recipe_ingredients!inner (
          id,
          ingredient_id,
          ingredient_name,
          unit
        )
      `)
      .eq('user_id', user.id)

    if (recipesError) {
      console.error('Error fetching recipes:', recipesError)
      return NextResponse.json({ error: recipesError.message }, { status: 500 })
    }

    // 2. Récupérer tous les ingrédients de l'utilisateur
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('id, name, unit')
      .eq('user_id', user.id)

    if (ingredientsError) {
      console.error('Error fetching ingredients:', ingredientsError)
      return NextResponse.json({ error: ingredientsError.message }, { status: 500 })
    }

    // Créer une map pour un accès rapide
    const ingredientsMap = new Map<string, { id: string, unit: string }[]>()
    for (const ing of ingredients || []) {
      const key = ing.name.toLowerCase().trim()
      if (!ingredientsMap.has(key)) {
        ingredientsMap.set(key, [])
      }
      ingredientsMap.get(key)!.push({ id: ing.id, unit: ing.unit })
    }

    // 3. Mettre à jour les recipe_ingredients sans ingredient_id
    let fixedCount = 0
    let missingIngredients: Array<{ name: string, unit: string }> = []

    for (const recipe of recipes || []) {
      for (const ri of (recipe as any).recipe_ingredients) {
        if (ri.ingredient_id !== null) continue // Déjà lié

        const key = ri.ingredient_name.toLowerCase().trim()
        const matchingIngredients = ingredientsMap.get(key)

        if (matchingIngredients && matchingIngredients.length > 0) {
          // Chercher d'abord un match exact avec l'unité
          let match = matchingIngredients.find(ing => ing.unit === ri.unit)
          
          // Sinon prendre le premier disponible
          if (!match && matchingIngredients.length === 1) {
            match = matchingIngredients[0]
          }

          if (match) {
            const { error: updateError } = await supabase
              .from('recipe_ingredients')
              .update({ ingredient_id: match.id })
              .eq('id', ri.id)

            if (!updateError) {
              fixedCount++
            } else {
              console.error('Error updating recipe_ingredient:', updateError)
            }
          }
        } else {
          // Ingrédient non trouvé dans le catalogue
          if (!missingIngredients.find(mi => mi.name === ri.ingredient_name && mi.unit === ri.unit)) {
            missingIngredients.push({ name: ri.ingredient_name, unit: ri.unit })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      fixed: fixedCount,
      missing: missingIngredients.length,
      missingIngredients: missingIngredients
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
