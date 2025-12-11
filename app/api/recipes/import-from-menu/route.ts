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
        console.log(`  → ${dish.ingredients.length} ingrédients à traiter`)
        for (const ingredient of dish.ingredients) {
          // Support des anciens formats (string) et nouveaux formats (objet avec quantité)
          const ingredientName = typeof ingredient === 'string' ? ingredient : ingredient.name
          const quantity = typeof ingredient === 'string' ? 0.1 : ingredient.quantity
          const unit = typeof ingredient === 'string' ? 'kg' : ingredient.unit
          console.log(`     - ${ingredientName} (${quantity} ${unit})`)
          
          // Chercher si le produit existe (les produits sont globaux, pas liés à l'utilisateur)
          let { data: product, error: searchError } = await supabase
            .from('product')
            .select('id')
            .ilike('name', ingredientName)
            .maybeSingle()

          console.log(`       🔍 Recherche: ${product ? 'Trouvé ID=' + product.id : 'Non trouvé'}`)

          // Si le produit n'existe pas, le créer
          if (!product) {
            console.log(`       ➕ Création produit...`)
            const { data: newProduct, error: createError } = await supabase
              .from('product')
              .insert({
                name: ingredientName,
                unit: unit,
                category: 'Ingrédients',
                low_stock_threshold: 5,
              })
              .select()
              .single()

            if (createError) {
              console.error(`       ❌ Erreur création:`, createError)
            } else {
              console.log(`       ✅ Créé ID=${newProduct?.id}`)
            }

            product = newProduct
          }

          // Créer automatiquement une entrée dans les stocks pour cet utilisateur
          if (product) {
            // Vérifier si le stock existe déjà pour cet utilisateur
            const { data: existingStock } = await supabase
              .from('stock')
              .select('id')
              .eq('user_id', user.id)
              .eq('product_id', product.id)
              .maybeSingle()

            if (!existingStock) {
              await supabase
                .from('stock')
                .insert({
                  user_id: user.id,
                  product_id: product.id,
                  quantity: 0
                })
            }
          }

          // Lier l'ingrédient à la recette avec les quantités pour 1 personne
          console.log(`       🔗 Liaison ingredient_name="${ingredientName}" à recipe=${recipe.id}`)
          const { error: linkError } = await supabase
            .from('recipe_ingredients')
            .insert({
              recipe_id: recipe.id,
              ingredient_id: product?.id || null,  // Lier au product si trouvé
              ingredient_name: ingredientName,      // Nom obligatoire
              quantity: quantity,
              unit: unit,
            })
          
          if (linkError) {
            console.error(`       ❌ Erreur lien:`, linkError)
          } else {
            console.log(`       ✓ Lié !`)
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
