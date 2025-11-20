// Service de traitement des ventes Lightspeed
import { createClient } from '@supabase/supabase-js'
import {
  LightspeedSale,
  LightspeedSaleLine,
  NormalizedSaleLine,
  RecipeDecomposition,
  IngredientDeduction,
  SaleProcessingResult,
  SyncOptions,
  StockMovement,
  SyncLog,
  StockAlert,
  DeduplicationCheck,
  ProcessingError,
  LightspeedSyncError
} from '@/types/lightspeed'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client Supabase avec privilèges admin pour bypasser RLS si nécessaire
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// ==================== NORMALISATION DES DONNÉES ====================

/**
 * Normalise les SaleLines qui peuvent être un objet unique ou un tableau
 */
export function normalizeSaleLines(sale: LightspeedSale): NormalizedSaleLine[] {
  if (!sale.SaleLines?.SaleLine) {
    return []
  }
  
  const saleLines = sale.SaleLines.SaleLine
  return Array.isArray(saleLines) ? saleLines : [saleLines]
}

// ==================== VALIDATION ====================

/**
 * Vérifie si une vente a déjà été traitée (déduplication)
 */
export async function checkDuplication(
  saleId: string,
  userId: string
): Promise<DeduplicationCheck> {
  const { data: existingLog, error } = await supabaseAdmin
    .from('sync_logs')
    .select('*')
    .eq('lightspeed_sale_id', saleId)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    throw new Error(`Erreur lors de la vérification de duplication: ${error.message}`)
  }

  if (existingLog) {
    return {
      isDuplicate: true,
      existingLog: existingLog as SyncLog,
      message: `Vente ${saleId} déjà traitée le ${existingLog.created_at}`
    }
  }

  return {
    isDuplicate: false,
    message: 'Vente non traitée'
  }
}

/**
 * Valide qu'une vente peut être traitée
 */
export function validateSale(sale: LightspeedSale): ProcessingError[] {
  const errors: ProcessingError[] = []

  // Vérifier le statut de la commande
  if (sale.orderStatus !== 'completed') {
    errors.push({
      type: 'validation',
      message: `Statut de commande invalide: ${sale.orderStatus}. Seules les commandes "completed" sont traitées.`,
      saleId: sale.saleID.toString()
    })
  }

  // Vérifier qu'il y a des lignes de vente
  const saleLines = normalizeSaleLines(sale)
  if (saleLines.length === 0) {
    errors.push({
      type: 'validation',
      message: 'Aucune ligne de vente trouvée',
      saleId: sale.saleID.toString()
    })
  }

  // Vérifier que chaque ligne a un SKU
  saleLines.forEach((line, index) => {
    if (!line.sku || line.sku.trim() === '') {
      errors.push({
        type: 'validation',
        message: `Ligne ${index + 1} sans SKU: ${line.description}`,
        saleId: sale.saleID.toString(),
        details: line
      })
    }
  })

  return errors
}

// ==================== DÉCOMPOSITION DES RECETTES ====================

/**
 * Récupère une recette et ses ingrédients par SKU
 */
async function getRecipeBySku(sku: string, userId: string) {
  const { data: recipe, error } = await supabaseAdmin
    .from('recipes')
    .select(`
      id,
      name,
      sku,
      user_id,
      recipe_ingredients (
        id,
        ingredient_id,
        ingredient_name,
        quantity,
        unit
      )
    `)
    .eq('sku', sku)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Recette non trouvée
    }
    throw new Error(`Erreur lors de la récupération de la recette ${sku}: ${error.message}`)
  }

  return recipe
}

/**
 * Récupère le stock actuel d'un ingrédient
 */
async function getIngredientStock(ingredientId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from('ingredients')
    .select('id, name, current_stock, minimum_stock, unit')
    .eq('id', ingredientId)
    .eq('user_id', userId)
    .single()

  if (error) {
    throw new Error(`Erreur lors de la récupération du stock: ${error.message}`)
  }

  return data
}

/**
 * Décompose une ligne de vente en déductions d'ingrédients
 */
async function decomposeSaleLine(
  saleLine: NormalizedSaleLine,
  userId: string
): Promise<RecipeDecomposition | null> {
  const recipe = await getRecipeBySku(saleLine.sku, userId)
  
  if (!recipe) {
    return null // SKU non trouvé dans les recettes
  }

  const ingredients: IngredientDeduction[] = []

  for (const recipeIngredient of recipe.recipe_ingredients) {
    if (!recipeIngredient.ingredient_id) {
      continue // Ignorer les ingrédients sans ID
    }

    const stock = await getIngredientStock(recipeIngredient.ingredient_id, userId)
    const quantityToDeduct = recipeIngredient.quantity * saleLine.quantity

    ingredients.push({
      ingredient_id: recipeIngredient.ingredient_id,
      ingredient_name: recipeIngredient.ingredient_name,
      quantity_per_recipe: recipeIngredient.quantity,
      quantity_to_deduct: quantityToDeduct,
      unit: recipeIngredient.unit,
      current_stock: stock.current_stock,
      new_stock: stock.current_stock - quantityToDeduct
    })
  }

  return {
    recipe_id: recipe.id,
    recipe_name: recipe.name,
    sku: saleLine.sku,
    quantity_sold: saleLine.quantity,
    ingredients
  }
}

/**
 * Décompose toutes les lignes de vente
 */
export async function decomposeSale(
  sale: LightspeedSale,
  userId: string
): Promise<RecipeDecomposition[]> {
  const saleLines = normalizeSaleLines(sale)
  const decompositions: RecipeDecomposition[] = []
  const errors: ProcessingError[] = []

  for (const saleLine of saleLines) {
    try {
      const decomposition = await decomposeSaleLine(saleLine, userId)
      
      if (decomposition) {
        decompositions.push(decomposition)
      } else {
        errors.push({
          type: 'validation',
          message: `SKU non trouvé dans les recettes: ${saleLine.sku}`,
          saleId: sale.saleID.toString(),
          sku: saleLine.sku,
          details: saleLine
        })
      }
    } catch (error: any) {
      errors.push({
        type: 'calculation',
        message: `Erreur lors de la décomposition du SKU ${saleLine.sku}: ${error.message}`,
        saleId: sale.saleID.toString(),
        sku: saleLine.sku,
        details: error
      })
    }
  }

  if (errors.length > 0 && decompositions.length === 0) {
    throw new LightspeedSyncError({
      type: 'calculation',
      message: 'Aucune recette n\'a pu être décomposée',
      details: errors
    })
  }

  return decompositions
}

// ==================== MISE À JOUR DU STOCK ====================

/**
 * Met à jour le stock d'un ingrédient et crée un mouvement de stock
 */
async function updateIngredientStock(
  deduction: IngredientDeduction,
  userId: string,
  saleId: string,
  orderNumber: string,
  allowNegativeStock: boolean
): Promise<StockMovement> {
  // Vérifier si le stock négatif est autorisé
  if (!allowNegativeStock && deduction.new_stock < 0) {
    throw new LightspeedSyncError({
      type: 'validation',
      message: `Stock insuffisant pour ${deduction.ingredient_name}: ${deduction.current_stock} ${deduction.unit} disponibles, ${deduction.quantity_to_deduct} ${deduction.unit} nécessaires`,
      ingredientId: deduction.ingredient_id
    })
  }

  // Mettre à jour le stock dans ingredients
  const { error: updateError } = await supabaseAdmin
    .from('ingredients')
    .update({ 
      current_stock: deduction.new_stock,
      updated_at: new Date().toISOString()
    })
    .eq('id', deduction.ingredient_id)
    .eq('user_id', userId)

  if (updateError) {
    throw new LightspeedSyncError({
      type: 'database',
      message: `Erreur lors de la mise à jour du stock: ${updateError.message}`,
      ingredientId: deduction.ingredient_id,
      details: updateError
    })
  }

  // Créer le mouvement de stock
  const movement: StockMovement = {
    ingredient_id: deduction.ingredient_id,
    user_id: userId,
    movement_type: 'sale',
    quantity_change: -deduction.quantity_to_deduct,
    stock_before: deduction.current_stock,
    stock_after: deduction.new_stock,
    reference_type: 'lightspeed_sale',
    reference_id: saleId,
    reference_order: orderNumber,
    notes: `Vente de ${deduction.ingredient_name} via Lightspeed`
  }

  const { data, error: insertError } = await supabaseAdmin
    .from('stock_movements')
    .insert(movement)
    .select()
    .single()

  if (insertError) {
    throw new LightspeedSyncError({
      type: 'database',
      message: `Erreur lors de la création du mouvement de stock: ${insertError.message}`,
      ingredientId: deduction.ingredient_id,
      details: insertError
    })
  }

  return data as StockMovement
}

/**
 * Traite toutes les déductions d'ingrédients d'une vente
 */
async function processStockDeductions(
  decompositions: RecipeDecomposition[],
  userId: string,
  saleId: string,
  orderNumber: string,
  allowNegativeStock: boolean
): Promise<StockMovement[]> {
  const movements: StockMovement[] = []

  for (const decomposition of decompositions) {
    for (const deduction of decomposition.ingredients) {
      const movement = await updateIngredientStock(
        deduction,
        userId,
        saleId,
        orderNumber,
        allowNegativeStock
      )
      movements.push(movement)
    }
  }

  return movements
}

// ==================== LOGGING ====================

/**
 * Crée un log de synchronisation
 */
async function createSyncLog(
  sale: LightspeedSale,
  userId: string,
  syncType: SyncOptions['syncType'],
  status: 'success' | 'error' | 'partial',
  result: SaleProcessingResult
): Promise<SyncLog> {
  const log: Omit<SyncLog, 'id' | 'created_at'> = {
    user_id: userId,
    sync_type: syncType,
    status,
    lightspeed_sale_id: sale.saleID.toString(),
    lightspeed_order_number: sale.orderNumber,
    sale_date: sale.createTime,
    items_count: normalizeSaleLines(sale).length,
    ingredients_updated: result.ingredientsUpdated,
    error_message: result.errors.length > 0 ? result.errors.join('; ') : undefined,
    request_payload: sale
  }

  const { data, error } = await supabaseAdmin
    .from('sync_logs')
    .insert(log)
    .select()
    .single()

  if (error) {
    console.error('Erreur lors de la création du log:', error)
    throw new Error(`Erreur lors de la création du log: ${error.message}`)
  }

  return data as SyncLog
}

// ==================== FONCTION PRINCIPALE ====================

/**
 * Traite une vente Lightspeed complète
 */
export async function processSaleFromLightspeed(
  sale: LightspeedSale,
  options: SyncOptions
): Promise<SaleProcessingResult> {
  const result: SaleProcessingResult = {
    success: false,
    saleId: sale.saleID.toString(),
    orderNumber: sale.orderNumber,
    recipesProcessed: 0,
    ingredientsUpdated: 0,
    stockMovementsCreated: 0,
    alertsGenerated: 0,
    errors: [],
    details: {
      recipes: [],
      stockMovements: [],
      alerts: []
    }
  }

  try {
    // 1. Validation de la vente
    const validationErrors = validateSale(sale)
    if (validationErrors.length > 0) {
      result.errors = validationErrors.map(e => e.message)
      await createSyncLog(sale, options.userId, options.syncType, 'error', result)
      return result
    }

    // 2. Vérification de duplication (sauf si skipDuplicateCheck)
    if (!options.skipDuplicateCheck) {
      const dupCheck = await checkDuplication(sale.saleID.toString(), options.userId)
      if (dupCheck.isDuplicate) {
        result.errors.push(dupCheck.message)
        return result
      }
    }

    // 3. Décomposition des recettes
    const decompositions = await decomposeSale(sale, options.userId)
    result.details.recipes = decompositions
    result.recipesProcessed = decompositions.length

    // Si mode validation uniquement
    if (options.validateOnly) {
      result.success = true
      return result
    }

    // 4. Mise à jour des stocks (transaction)
    const movements = await processStockDeductions(
      decompositions,
      options.userId,
      sale.saleID.toString(),
      sale.orderNumber,
      options.allowNegativeStock ?? false
    )

    result.details.stockMovements = movements
    result.stockMovementsCreated = movements.length
    result.ingredientsUpdated = movements.length

    // 5. Récupérer les alertes générées (via trigger)
    const { data: alerts } = await supabaseAdmin
      .from('stock_alerts')
      .select('*')
      .eq('user_id', options.userId)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(10)

    if (alerts) {
      result.details.alerts = alerts as StockAlert[]
      result.alertsGenerated = alerts.length
    }

    result.success = true

    // 6. Logger le succès
    await createSyncLog(sale, options.userId, options.syncType, 'success', result)

  } catch (error: any) {
    result.errors.push(error.message)
    
    // Logger l'erreur
    await createSyncLog(sale, options.userId, options.syncType, 'error', result)
    
    throw error
  }

  return result
}
