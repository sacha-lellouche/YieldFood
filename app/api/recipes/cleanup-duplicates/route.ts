import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// POST /api/recipes/cleanup-duplicates - Supprime les recettes en double avec 0 ingrédients
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

    console.log('[Cleanup] Starting duplicate recipe cleanup for user:', user.id)

    // Récupérer toutes les recettes de l'utilisateur avec le nombre d'ingrédients
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select(`
        id,
        name,
        created_at,
        recipe_ingredients (id)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (recipesError) {
      console.error('[Cleanup] Error fetching recipes:', recipesError)
      return NextResponse.json({ error: recipesError.message }, { status: 500 })
    }

    console.log(`[Cleanup] Found ${recipes?.length || 0} recipes`)

    // Grouper les recettes par nom (insensible à la casse)
    const recipesByName = new Map<string, any[]>()
    
    for (const recipe of recipes || []) {
      const normalizedName = recipe.name.toLowerCase().trim()
      if (!recipesByName.has(normalizedName)) {
        recipesByName.set(normalizedName, [])
      }
      recipesByName.get(normalizedName)!.push({
        ...recipe,
        ingredientCount: recipe.recipe_ingredients?.length || 0
      })
    }

    console.log(`[Cleanup] Found ${recipesByName.size} unique recipe names`)

    // Pour chaque groupe de recettes avec le même nom
    const recipesToDelete: string[] = []
    let duplicatesFound = 0

    for (const [name, recipeGroup] of recipesByName) {
      if (recipeGroup.length > 1) {
        duplicatesFound++
        console.log(`[Cleanup] Found ${recipeGroup.length} recipes named "${name}"`)
        
        // Trier par nombre d'ingrédients (desc) puis par date de création (asc)
        recipeGroup.sort((a, b) => {
          if (b.ingredientCount !== a.ingredientCount) {
            return b.ingredientCount - a.ingredientCount
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })

        // Garder la première (celle avec le plus d'ingrédients, ou la plus ancienne si égalité)
        const toKeep = recipeGroup[0]
        const toDelete = recipeGroup.slice(1)

        console.log(`[Cleanup] Keeping recipe ${toKeep.id} (${toKeep.ingredientCount} ingredients)`)
        
        // Supprimer les doublons qui ont 0 ingrédients
        for (const recipe of toDelete) {
          if (recipe.ingredientCount === 0) {
            console.log(`[Cleanup] Marking for deletion: recipe ${recipe.id} (0 ingredients)`)
            recipesToDelete.push(recipe.id)
          } else {
            console.log(`[Cleanup] Skipping recipe ${recipe.id} (${recipe.ingredientCount} ingredients - has data)`)
          }
        }
      }
    }

    console.log(`[Cleanup] Found ${duplicatesFound} duplicate names`)
    console.log(`[Cleanup] Will delete ${recipesToDelete.length} recipes with 0 ingredients`)

    // Supprimer les recettes en double avec 0 ingrédients
    let deletedCount = 0
    if (recipesToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('recipes')
        .delete()
        .in('id', recipesToDelete)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('[Cleanup] Error deleting recipes:', deleteError)
        return NextResponse.json({ 
          error: 'Erreur lors de la suppression',
          details: deleteError.message 
        }, { status: 500 })
      }

      deletedCount = recipesToDelete.length
      console.log(`[Cleanup] Successfully deleted ${deletedCount} duplicate recipes`)
    }

    return NextResponse.json({
      success: true,
      duplicatesFound,
      recipesDeleted: deletedCount,
      message: `${deletedCount} recette(s) en double avec 0 ingrédients supprimée(s)`
    })

  } catch (error) {
    console.error('[Cleanup] Unexpected error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
