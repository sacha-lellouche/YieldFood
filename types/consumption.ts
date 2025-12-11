// Types pour le module "Mes consommations"

export type ConsumptionType = 'sale' | 'loss'

export interface Consumption {
  id: string
  user_id: string
  recipe_id: string
  consumption_type: ConsumptionType
  portions: number
  consumption_date: string // ISO date string
  name?: string // Nom personnalisé de la consommation
  notes?: string
  created_at: string
  updated_at: string
}

export interface ConsumptionIngredientImpact {
  id: string
  consumption_id: string
  ingredient_id: string
  ingredient_name: string
  quantity_consumed: number
  unit: string
  stock_before: number
  stock_after: number
  created_at: string
}

// Pour l'affichage avec les détails de la recette
export interface ConsumptionWithDetails extends Consumption {
  recipe: {
    id: string
    name: string
    description?: string
  }
  impacts: ConsumptionIngredientImpact[]
}

// Pour le formulaire de création
export interface ConsumptionInput {
  recipe_id: string
  consumption_type: ConsumptionType
  portions: number
  consumption_date: string
  name?: string
  notes?: string
  batch_id?: string
}

// Pour le calcul des impacts avant confirmation
export interface CalculatedIngredientImpact {
  ingredient_id: string
  ingredient_name: string
  quantity_needed: number
  unit: string
  current_stock: number
  stock_after: number
  is_sufficient: boolean
}

export interface ConsumptionPreview {
  recipe_id: string
  recipe_name: string
  recipe_description?: string
  consumption_type: ConsumptionType
  portions: number
  consumption_date: string
  calculated_impacts: CalculatedIngredientImpact[]
  has_insufficient_stock: boolean
}

// Pour l'ajout de plusieurs consommations en une fois
export interface BatchConsumptionInput {
  consumptions: ConsumptionInput[]
}

export interface BatchConsumptionResult {
  success: boolean
  created_consumptions: Consumption[]
  total_ingredients_impacted: number
  errors: string[]
}

// Pour les statistiques (optionnel, pour future feature)
export interface ConsumptionStats {
  period: string // 'day' | 'week' | 'month'
  total_sales: number
  total_losses: number
  most_consumed_recipes: {
    recipe_name: string
    total_portions: number
  }[]
}
