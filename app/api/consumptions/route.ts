import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { 
  ConsumptionInput, 
  Consumption, 
  ConsumptionWithDetails,
  CalculatedIngredientImpact,
  ConsumptionPreview 
} from '@/types/consumption'

// GET /api/consumptions - Liste des consommations
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
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Construire la requête
    let query = supabase
      .from('consumptions')
      .select(`
        *,
        recipe:recipes(id, name, description)
      `)
      .eq('user_id', user.id)
      .order('consumption_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (startDate) {
      query = query.gte('consumption_date', startDate)
    }
    if (endDate) {
      query = query.lte('consumption_date', endDate)
    }
    if (type && (type === 'sale' || type === 'loss')) {
      query = query.eq('consumption_type', type)
    }

    const { data: consumptions, error } = await query

    if (error) {
      console.error('Error fetching consumptions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Pour chaque consommation, récupérer les impacts ingrédients
    const consumptionsWithDetails: ConsumptionWithDetails[] = await Promise.all(
      (consumptions || []).map(async (consumption) => {
        const { data: impacts } = await supabase
          .from('consumption_ingredient_impacts')
          .select(`
            *,
            ingredient:ingredients(name, unit)
          `)
          .eq('consumption_id', consumption.id)
          .order('created_at', { ascending: true })

        return {
          ...consumption,
          impacts: (impacts || []).map((impact: any) => ({
            ...impact,
            ingredient_name: impact.ingredient?.name || 'Inconnu',
            unit: impact.ingredient?.unit || ''
          }))
        }
      })
    )

    return NextResponse.json(consumptionsWithDetails)
  } catch (error) {
    console.error('Unexpected error in GET /api/consumptions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/consumptions - Créer une nouvelle consommation
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
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const action = body.action // 'preview' ou 'confirm'

    if (action === 'preview') {
      // Calculer les impacts sans créer la consommation
      return await handlePreview(supabase, user.id, body.consumption)
    } else if (action === 'confirm') {
      // Créer la consommation et mettre à jour le stock
      return await handleConfirm(supabase, user.id, body.consumption)
    } else {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }
  } catch (error) {
    console.error('Unexpected error in POST /api/consumptions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Calculer la prévisualisation des impacts
async function handlePreview(
  supabase: any,
  userId: string,
  consumptionInput: ConsumptionInput
): Promise<NextResponse> {
  const { recipe_id, portions, consumption_type, consumption_date } = consumptionInput

  // Valider les données
  if (!recipe_id || !portions || portions <= 0 || !consumption_type) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  // Récupérer la recette avec ses ingrédients
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select(`
      id,
      name,
      description,
      servings,
      recipe_ingredients (
        id,
        ingredient_id,
        ingredient_name,
        quantity,
        unit
      )
    `)
    .eq('id', recipe_id)
    .eq('user_id', userId)
    .single()

  if (recipeError || !recipe) {
    console.error('Recipe error:', recipeError)
    return NextResponse.json({ error: 'Recette introuvable' }, { status: 404 })
  }

  // Récupérer les ingrédients séparément
  const ingredientIds = recipe.recipe_ingredients
    .map((ri: any) => ri.ingredient_id)
    .filter((id: any) => id !== null)
  
  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, name, unit, current_stock')
    .in('id', ingredientIds)
    .eq('user_id', userId)
  
  const ingredientsMap = new Map(ingredients?.map((ing: any) => [ing.id, ing]) || [])

  // Calculer les impacts pour chaque ingrédient
  const calculated_impacts: CalculatedIngredientImpact[] = recipe.recipe_ingredients
    .filter((ri: any) => ri.ingredient_id !== null)
    .map((ri: any) => {
      const ingredient = ingredientsMap.get(ri.ingredient_id) || {
        id: ri.ingredient_id,
        name: ri.ingredient_name,
        unit: ri.unit,
        current_stock: 0
      }
      const quantity_per_portion = ri.quantity / (recipe.servings || 1)
      const quantity_needed = quantity_per_portion * portions
      const current_stock = ingredient.current_stock || 0
      const stock_after = current_stock - quantity_needed

      return {
        ingredient_id: ingredient.id,
        ingredient_name: ingredient.name,
        quantity_needed: Math.round(quantity_needed * 100) / 100,
        unit: ingredient.unit,
        current_stock: Math.round(current_stock * 100) / 100,
        stock_after: Math.round(stock_after * 100) / 100,
        is_sufficient: stock_after >= 0
      }
    })

  const has_insufficient_stock = calculated_impacts.some(impact => !impact.is_sufficient)

  const preview: ConsumptionPreview = {
    recipe_id: recipe.id,
    recipe_name: recipe.name,
    recipe_description: recipe.description,
    consumption_type,
    portions,
    consumption_date,
    calculated_impacts,
    has_insufficient_stock
  }

  return NextResponse.json(preview)
}

// Confirmer et créer la consommation avec mise à jour du stock
async function handleConfirm(
  supabase: any,
  userId: string,
  consumptionInput: ConsumptionInput
): Promise<NextResponse> {
  const { recipe_id, portions, consumption_type, consumption_date, notes } = consumptionInput

  // Valider les données
  if (!recipe_id || !portions || portions <= 0 || !consumption_type) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  // Récupérer la recette avec ses ingrédients
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select(`
      id,
      name,
      servings,
      recipe_ingredients (
        id,
        ingredient_id,
        ingredient_name,
        quantity,
        unit
      )
    `)
    .eq('id', recipe_id)
    .eq('user_id', userId)
    .single()

  if (recipeError || !recipe) {
    console.error('Recipe error in confirm:', recipeError)
    return NextResponse.json({ error: 'Recette introuvable' }, { status: 404 })
  }

  console.log('Recipe found:', recipe.name, 'with', recipe.recipe_ingredients.length, 'ingredients')
  console.log('Recipe ingredients:', recipe.recipe_ingredients.map((ri: any) => ({
    id: ri.ingredient_id,
    name: ri.ingredient_name,
    quantity: ri.quantity
  })))

  // Récupérer les ingrédients séparément
  const ingredientIds = recipe.recipe_ingredients
    .map((ri: any) => ri.ingredient_id)
    .filter((id: any) => id !== null)
  
  console.log('Looking for ingredient IDs:', ingredientIds)
  
  const { data: ingredients, error: ingredientsError } = await supabase
    .from('ingredients')
    .select('id, name, unit, current_stock')
    .in('id', ingredientIds)
    .eq('user_id', userId)
  
  console.log('Found ingredients:', ingredients?.length || 0)
  
  if (ingredientsError) {
    console.error('Error fetching ingredients:', ingredientsError)
  }
  
  const ingredientsMap = new Map(ingredients?.map((ing: any) => [ing.id, ing]) || [])

  // Démarrer une transaction (en utilisant plusieurs appels séquentiels)
  // 1. Créer la consommation
  const { data: newConsumption, error: consumptionError } = await supabase
    .from('consumptions')
    .insert({
      user_id: userId,
      recipe_id,
      consumption_type,
      portions,
      consumption_date: consumption_date || new Date().toISOString().split('T')[0],
      notes
    })
    .select()
    .single()

  if (consumptionError || !newConsumption) {
    console.error('Error creating consumption:', consumptionError)
    return NextResponse.json({ error: 'Erreur lors de la création de la consommation' }, { status: 500 })
  }

  // 2. Pour chaque ingrédient, mettre à jour le stock et créer l'impact
  const impacts = []
  console.log('Processing', recipe.recipe_ingredients.length, 'recipe ingredients for consumption')
  
  for (const ri of recipe.recipe_ingredients) {
    console.log('Processing ingredient:', ri.ingredient_name, 'ID:', ri.ingredient_id)
    
    if (!ri.ingredient_id) {
      console.warn(`Skipping ${ri.ingredient_name}: no ingredient_id`)
      continue
    }
    
    const ingredient = ingredientsMap.get(ri.ingredient_id)
    if (!ingredient) {
      console.warn(`Ingredient ${ri.ingredient_id} (${ri.ingredient_name}) not found in ingredients table`)
      continue
    }
    
    console.log(`Found ingredient: ${ingredient.name}, current stock: ${ingredient.current_stock}`)
    
    const quantity_per_portion = ri.quantity / (recipe.servings || 1)
    const quantity_needed = quantity_per_portion * portions
    const current_stock = ingredient.current_stock || 0
    const stock_after = current_stock - quantity_needed

    // Mise à jour du stock
    const { error: updateError } = await supabase
      .from('ingredients')
      .update({ current_stock: stock_after })
      .eq('id', ingredient.id)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating ingredient stock:', updateError)
      // Continuer quand même pour les autres ingrédients
    } else {
      console.log(`Stock updated for ${ingredient.name}: ${current_stock} -> ${stock_after}`)
    }

    // Créer l'enregistrement d'impact
    const { data: impact, error: impactError } = await supabase
      .from('consumption_ingredient_impacts')
      .insert({
        consumption_id: newConsumption.id,
        ingredient_id: ingredient.id,
        quantity_consumed: quantity_needed,
        stock_before: current_stock,
        stock_after: stock_after
      })
      .select()
      .single()

    if (!impactError && impact) {
      console.log('Impact created for', ingredient.name)
      impacts.push({
        ...impact,
        ingredient_name: ingredient.name,
        unit: ingredient.unit
      })
    } else {
      console.error('Error creating impact:', impactError)
    }
  }
  
  console.log('Total impacts created:', impacts.length)

  // Retourner la consommation créée avec ses impacts
  const result: ConsumptionWithDetails = {
    ...newConsumption,
    recipe: {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description
    },
    impacts
  }

  return NextResponse.json(result, { status: 201 })
}
