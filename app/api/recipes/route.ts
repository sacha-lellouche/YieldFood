import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// GET /api/recipes - Liste toutes les recettes
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')

    // Récupérer les recettes avec le nombre d'ingrédients
    let query = supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching recipes:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des recettes' },
        { status: 500 }
      )
    }

    // Formater les données
    const recipes = data.map((recipe: any) => ({
      ...recipe,
      ingredient_count: recipe.recipe_ingredients[0]?.count || 0,
      recipe_ingredients: undefined,
    }))

    return NextResponse.json(recipes)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/recipes - Crée une nouvelle recette avec ses ingrédients
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, servings, prep_time, cook_time, ingredients } = body

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Le nom est requis' },
        { status: 400 }
      )
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un ingrédient est requis' },
        { status: 400 }
      )
    }

    // 1. Créer la recette
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert([
        {
          user_id: user.id,
          name: name.trim(),
          description: description?.trim() || null,
          servings: servings || 1,
          prep_time: prep_time || null,
          cook_time: cook_time || null,
        },
      ])
      .select()
      .single()

    if (recipeError) {
      console.error('Error creating recipe:', recipeError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la recette' },
        { status: 500 }
      )
    }

    // 2. Créer les ingrédients de la recette
    const recipeIngredients = ingredients.map((ing: any) => ({
      recipe_id: recipe.id,
      ingredient_id: ing.ingredient_id || null,
      ingredient_name: ing.ingredient_name || ing.name,
      quantity: parseFloat(ing.quantity),
      unit: ing.unit,
    }))

    const { data: createdIngredients, error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .insert(recipeIngredients)
      .select()

    if (ingredientsError) {
      console.error('Error creating recipe ingredients:', ingredientsError)
      // Rollback: supprimer la recette
      await supabase.from('recipes').delete().eq('id', recipe.id)
      return NextResponse.json(
        { error: 'Erreur lors de l\'ajout des ingrédients' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        ...recipe,
        ingredients: createdIngredients,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
