export interface Ingredient {
  id: string
  user_id: string
  name: string
  quantity: number
  unit: string
  created_at: string
  updated_at: string
}

export type CreateIngredientInput = Omit<Ingredient, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type UpdateIngredientInput = Partial<CreateIngredientInput>
