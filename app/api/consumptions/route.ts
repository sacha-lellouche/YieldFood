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
      const ingredient: any = {
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
  const { recipe_id, portions, consumption_type, consumption_date, notes, name, batch_id } = consumptionInput

  // Valider les données
  if (!recipe_id || !portions || portions <= 0 || !consumption_type) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  // Générer un nom par défaut si non fourni
  const consumptionName = name || `Consommation du ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`

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

  // Récupérer les stocks correspondants aux ingrédients de la recette
  // On va chercher par nom de produit au lieu de ingredient_id
  const ingredientNames = recipe.recipe_ingredients.map((ri: any) => ri.ingredient_name)
  
  console.log('Looking for products with names:', ingredientNames)
  
  const { data: stocks, error: stocksError } = await supabase
    .from('stock')
    .select(`
      id,
      product_id,
      quantity,
      product:product_id (
        id,
        name,
        unit
      )
    `)
    .eq('user_id', userId)
  
  console.log('Found stocks:', stocks?.length || 0)
  
  if (stocksError) {
    console.error('Error fetching stocks:', stocksError)
  }
  
  // Créer une map par nom de produit (insensible à la casse)
  const stocksMap = new Map(
    (stocks || []).map((s: any) => [
      s.product.name.toLowerCase().trim(),
      s
    ])
  )

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
      name: consumptionName,
      notes,
      batch_id: batch_id || null
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
    console.log('Processing ingredient:', ri.ingredient_name)
    
    // Chercher le stock par nom de produit
    const stockKey = ri.ingredient_name.toLowerCase().trim()
    const stock: any = stocksMap.get(stockKey)
    
    if (!stock) {
      console.warn(`Stock not found for product: ${ri.ingredient_name}`)
      continue
    }
    
    console.log(`Found stock for ${stock.product.name}: current quantity = ${stock.quantity}`)
    
    const quantity_per_portion = ri.quantity / (recipe.servings || 1)
    const quantity_needed = quantity_per_portion * portions
    const current_stock = stock.quantity || 0
    const stock_after = current_stock - quantity_needed

    // Mise à jour du stock
    const { error: updateError } = await supabase
      .from('stock')
      .update({ quantity: Math.max(0, stock_after) }) // Ne pas avoir de stock négatif
      .eq('id', stock.id)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating stock:', updateError)
      // Continuer quand même pour les autres ingrédients
    } else {
      console.log(`Stock updated for ${stock.product.name}: ${current_stock} -> ${Math.max(0, stock_after)}`)
    }

    // Créer l'enregistrement d'impact (même si pas de table consumption_ingredient_impacts liée aux stocks)
    // On stocke juste pour l'historique
    impacts.push({
      product_id: stock.product_id,
      product_name: stock.product.name,
      quantity_consumed: quantity_needed,
      unit: stock.product.unit,
      stock_before: current_stock,
      stock_after: Math.max(0, stock_after)
    })
  }
  
  console.log('Total stocks updated:', impacts.length)

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

// PUT /api/consumptions?id=xxx - Mettre à jour une consommation (nom)
export async function PUT(request: NextRequest) {
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

    // Récupérer l'ID depuis les query params
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Nom invalide' }, { status: 400 })
    }

    // Mettre à jour le nom de la consommation
    const { data: updatedConsumption, error: updateError } = await supabase
      .from('consumptions')
      .update({ name: name.trim() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError || !updatedConsumption) {
      console.error('Error updating consumption:', updateError)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json(updatedConsumption)
  } catch (error) {
    console.error('Unexpected error in PUT /api/consumptions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
