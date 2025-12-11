import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// GET /api/recipes/[id] - Récupère une recette avec ses ingrédients
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Récupérer la recette
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (recipeError || !recipe) {
      return NextResponse.json(
        { error: 'Recette non trouvée' },
        { status: 404 }
      )
    }

    // Récupérer les ingrédients avec les noms depuis la table product
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .select(`
        *,
        product:product_id (
          name,
          unit
        )
      `)
      .eq('recipe_id', id)
      .order('created_at', { ascending: true })

    if (ingredientsError) {
      console.error('Error fetching ingredients:', ingredientsError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des ingrédients' },
        { status: 500 }
      )
    }

    // Formater les ingrédients pour le frontend
    const formattedIngredients = ingredients?.map(ing => ({
      ingredient_id: ing.product_id,
      ingredient_name: ing.product?.name || 'Ingrédient inconnu',
      quantity: ing.quantity,
      unit: ing.unit || ing.product?.unit || 'kg'
    })) || []

    return NextResponse.json({
      ...recipe,
      ingredients: formattedIngredients,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/recipes/[id] - Supprime une recette
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Supprimer la recette (les ingrédients seront supprimés en cascade)
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting recipe:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Recette supprimée avec succès' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/recipes/[id] - Met à jour une recette
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
        { error: 'Le nom de la recette est requis' },
        { status: 400 }
      )
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un ingrédient est requis' },
        { status: 400 }
      )
    }

    // Vérifier que la recette appartient à l'utilisateur
    const { data: existingRecipe } = await supabase
      .from('recipes')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existingRecipe) {
      return NextResponse.json(
        { error: 'Recette non trouvée' },
        { status: 404 }
      )
    }

    // Mettre à jour la recette
    const { error: updateError } = await supabase
      .from('recipes')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        servings: servings || 4,
        prep_time: prep_time || null,
        cook_time: cook_time || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating recipe:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la recette' },
        { status: 500 }
      )
    }

    // Supprimer les anciens ingrédients
    await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', id)

    // Insérer les nouveaux ingrédients
    const ingredientsToInsert = ingredients.map((ing: any) => ({
      recipe_id: id,
      ingredient_name: ing.ingredient_name.trim(),
      quantity: ing.quantity,
      unit: ing.unit,
    }))

    const { error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .insert(ingredientsToInsert)

    if (ingredientsError) {
      console.error('Error inserting ingredients:', ingredientsError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour des ingrédients' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Recette mise à jour avec succès',
      id,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
