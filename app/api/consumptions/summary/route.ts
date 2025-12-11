import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * GET /api/consumptions/summary
 * Récupère un récapitulatif des consommations récentes avec leurs impacts sur les stocks
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
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer la dernière consommation pour identifier le batch_id
    const { data: lastConsumptionData, error: lastError } = await supabase
      .from('consumptions')
      .select('batch_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (lastError || !lastConsumptionData) {
      return NextResponse.json({
        period: 'Dernière consommation',
        totalConsumptions: 0,
        recipeInfo: null,
        productImpacts: []
      })
    }

    // Si batch_id existe, récupérer toutes les consommations de ce batch
    // Sinon, récupérer uniquement la dernière consommation
    let query = supabase
      .from('consumptions')
      .select(`
        id,
        consumption_type,
        portions,
        consumption_date,
        name,
        created_at,
        recipe:recipes(id, name, description, servings, recipe_ingredients(ingredient_name, quantity, unit))
      `)
      .eq('user_id', user.id)

    if (lastConsumptionData.batch_id) {
      // Récupérer toutes les consommations du même batch
      query = query.eq('batch_id', lastConsumptionData.batch_id)
    } else {
      // Récupérer uniquement la dernière consommation (ancienne logique)
      query = query.order('created_at', { ascending: false }).limit(1)
    }

    const { data: consumptions, error } = await query

    if (error) {
      console.error('Error fetching consumptions summary:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculer les impacts par produit
    const productImpacts = new Map<string, {
      productName: string
      totalQuantity: number
      unit: string
      consumptions: Array<{
        consumptionId: string
        consumptionName: string
        recipeName: string
        portions: number
        quantity: number
        date: string
      }>
    }>()

    for (const consumption of consumptions || []) {
      const recipeData: any = consumption.recipe
      if (!recipeData || !recipeData.recipe_ingredients) continue

      for (const ingredient of recipeData.recipe_ingredients) {
        const key = ingredient.ingredient_name.toLowerCase().trim()
        
        const quantityPerPortion = ingredient.quantity / (recipeData.servings || 1)
        const totalQuantity = quantityPerPortion * consumption.portions

        if (!productImpacts.has(key)) {
          productImpacts.set(key, {
            productName: ingredient.ingredient_name,
            totalQuantity: 0,
            unit: ingredient.unit,
            consumptions: []
          })
        }

        const impact = productImpacts.get(key)!
        impact.totalQuantity += totalQuantity
        impact.consumptions.push({
          consumptionId: consumption.id,
          consumptionName: consumption.name || `Consommation du ${new Date(consumption.created_at).toLocaleDateString('fr-FR')}`,
          recipeName: recipeData.name,
          portions: consumption.portions,
          quantity: totalQuantity,
          date: consumption.created_at
        })
      }
    }

    // Convertir en array et trier par quantité décroissante
    const summary = Array.from(productImpacts.values())
      .map(impact => ({
        ...impact,
        consumptions: impact.consumptions.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)

    // Extraire les informations de toutes les recettes pour l'affichage
    const recipeSummary: Array<{ recipeName: string; portions: number }> = []
    let totalDishes = 0
    
    for (const consumption of consumptions || []) {
      const recipeData: any = consumption.recipe
      if (recipeData) {
        recipeSummary.push({
          recipeName: recipeData.name,
          portions: consumption.portions
        })
        totalDishes += consumption.portions
      }
    }

    return NextResponse.json({
      period: 'Dernière validation',
      totalConsumptions: consumptions?.length || 0,
      totalDishes,
      recipeSummary,
      productImpacts: summary
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/consumptions/summary:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
