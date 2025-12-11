import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { dishes } = await request.json()
    
    console.log('Import-from-menu: Reçu', dishes?.length, 'plats')
    
    if (!dishes || !Array.isArray(dishes)) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Vérifier l'utilisateur authentifié
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Créer les recettes à partir des plats détectés
    const recipes = []
    for (const dish of dishes) {
      console.log('Création recette:', dish.name)
      // Insérer la recette
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          name: dish.name,
          description: dish.description || `${dish.category}: ${dish.name}`,
          servings: 1,
          prep_time: null,
          cook_time: null,
        })
        .select()
        .single()

      if (recipeError) {
        console.error('Erreur création recette:', recipeError)
        continue
      }

      // Pour chaque ingrédient, créer ou récupérer depuis la table product
      if (dish.ingredients && dish.ingredients.length > 0) {
        for (const ingredient of dish.ingredients) {
          // Support des anciens formats (string) et nouveaux formats (objet avec quantité)
          const ingredientName = typeof ingredient === 'string' ? ingredient : ingredient.name
          const quantity = typeof ingredient === 'string' ? 0.1 : ingredient.quantity
          const unit = typeof ingredient === 'string' ? 'kg' : ingredient.unit
          
          // Chercher si le produit existe
          let { data: product } = await supabase
            .from('product')
            .select('id')
            .eq('user_id', user.id)
            .ilike('name', ingredientName)
            .single()

          // Si le produit n'existe pas, le créer
          if (!product) {
            const { data: newProduct } = await supabase
              .from('product')
              .insert({
                user_id: user.id,
                name: ingredientName,
                unit: unit,
                category: 'Ingrédients',
              })
              .select()
              .single()

            product = newProduct
          }

          // Lier l'ingrédient à la recette avec les quantités pour 1 personne
          if (product) {
            await supabase
              .from('recipe_ingredients')
              .insert({
                recipe_id: recipe.id,
                product_id: product.id,
                quantity: quantity,
                unit: unit,
              })
          }
        }
      }

      recipes.push(recipe)
    }

    return NextResponse.json({ 
      success: true, 
      count: recipes.length,
      recipes 
    })
  } catch (error: any) {
    console.error('Erreur création recettes:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création' },
      { status: 500 }
    )
  }
}
