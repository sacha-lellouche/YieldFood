export interface Recipe {
  id: string
  user_id: string
  name: string
  description: string | null
  servings: number
  prep_time: number | null // minutes
  cook_time: number | null // minutes
  created_at: string
  updated_at: string
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  ingredient_id: string | null
  ingredient_name: string
  quantity: number
  unit: string
  created_at: string
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: RecipeIngredient[]
}

export interface RecipeWithCount extends Recipe {
  ingredient_count: number
}

export type CreateRecipeInput = {
  name: string
  description?: string
  servings?: number
  prep_time?: number
  cook_time?: number
  ingredients: {
    ingredient_id?: string
    ingredient_name: string
    quantity: number
    unit: string
  }[]
}

export type UpdateRecipeInput = Partial<Omit<CreateRecipeInput, 'ingredients'>>

export type SuggestedIngredient = {
  name: string
  quantity: number
  unit: string
}
