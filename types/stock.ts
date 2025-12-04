// Types pour la table Product
export interface Product {
  id: string
  name: string
  description: string | null
  unit: string
  created_at: string
  category: string | null
  low_stock_threshold: number | null
}

export type CreateProductInput = Omit<Product, 'id' | 'created_at'>

// Types pour la table Stock
export interface Stock {
  id: string
  user_id: string
  product_id: string
  quantity: number
  supplier_id: string | null
  created_at: string
  updated_at: string
}

// Stock avec informations du produit (pour les jointures)
export interface StockWithProduct extends Stock {
  product: Product
}

// Input pour ajuster la quantité de stock
export interface AdjustStockInput {
  quantity: number  // Positif = ajout, Négatif = retrait
}

// Input pour mise à jour de stock par nom de produit
export interface UpdateStockByNameInput {
  productName: string
  deltaQuantity: number
  isAddition: boolean
}

// Réponse de l'API après ajustement
export interface StockAdjustmentResponse {
  success: boolean
  message: string
  product: {
    id: string
    name: string
    unit: string
  }
  stock: Stock
  previousQuantity: number
  newQuantity: number
  adjustment: number
}
