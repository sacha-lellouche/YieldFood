// Types pour l'intégration avec l'API Lightspeed POS

// ==================== TYPES LIGHTSPEED ====================

export interface LightspeedSaleAttributes {
  count: number
  offset: number
  limit: number
}

export interface LightspeedCustomer {
  customerID?: number
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

export interface LightspeedSaleLine {
  lineID: number
  itemID: number
  description: string
  sku: string
  quantity: number
  unitPrice: string
  total: string
  tax?: string
  discount?: string
  customSku?: string
  Note?: string
}

export interface LightspeedSaleLines {
  SaleLine: LightspeedSaleLine | LightspeedSaleLine[]
}

export interface LightspeedSale {
  saleID: number
  orderNumber: string
  createTime: string // ISO 8601 format
  updateTime?: string
  orderStatus: 'completed' | 'pending' | 'cancelled' | 'returned'
  completed?: boolean
  archived?: boolean
  voided?: boolean
  total: string
  totalDue?: string
  tax?: string
  discount?: string
  tipAmount?: string
  calcDiscount?: string
  calcTotal?: string
  calcSubtotal?: string
  calcTax?: string
  Customer?: LightspeedCustomer
  SaleLines: LightspeedSaleLines
  Register?: {
    registerID: number
    name: string
  }
  Shop?: {
    shopID: number
    name: string
  }
  Employee?: {
    employeeID: number
    firstName: string
    lastName: string
  }
}

export interface LightspeedSalesResponse {
  '@attributes': LightspeedSaleAttributes
  Sale: LightspeedSale | LightspeedSale[]
}

export interface LightspeedWebhookPayload {
  eventType: 'sale.created' | 'sale.updated' | 'sale.completed'
  objectId: number // saleID
  accountID: string
  data: LightspeedSale
}

// ==================== TYPES INTERNES ====================

export interface StockMovement {
  id?: string
  ingredient_id: string
  user_id: string
  movement_type: 'sale' | 'manual_adjustment' | 'inventory' | 'waste' | 'return'
  quantity_change: number // Négatif = sortie, Positif = entrée
  stock_before: number
  stock_after: number
  reference_type?: 'lightspeed_sale' | 'manual' | 'recipe_production'
  reference_id?: string // saleID de Lightspeed
  reference_order?: string // orderNumber de Lightspeed
  notes?: string
  created_at?: string
}

export interface SyncLog {
  id?: string
  user_id: string
  sync_type: 'webhook' | 'manual_sync' | 'cron'
  status: 'success' | 'error' | 'partial'
  lightspeed_sale_id: string
  lightspeed_order_number?: string
  sale_date?: string
  items_count: number
  ingredients_updated: number
  error_message?: string
  request_payload?: Record<string, any>
  created_at?: string
}

export interface StockAlert {
  id?: string
  ingredient_id: string
  user_id: string
  alert_type: 'low_stock' | 'out_of_stock' | 'negative_stock'
  current_stock: number
  minimum_stock: number
  is_resolved: boolean
  resolved_at?: string
  created_at?: string
  updated_at?: string
  ingredient?: {
    name: string
    unit: string
  }
}

// ==================== TYPES DE CALCUL ====================

export interface IngredientDeduction {
  ingredient_id: string
  ingredient_name: string
  quantity_per_recipe: number
  quantity_to_deduct: number // quantity_per_recipe × quantity_sold
  unit: string
  current_stock: number
  new_stock: number
}

export interface RecipeDecomposition {
  recipe_id: string
  recipe_name: string
  sku: string
  quantity_sold: number
  ingredients: IngredientDeduction[]
}

export interface SaleProcessingResult {
  success: boolean
  saleId: string
  orderNumber: string
  recipesProcessed: number
  ingredientsUpdated: number
  stockMovementsCreated: number
  alertsGenerated: number
  errors: string[]
  details: {
    recipes: RecipeDecomposition[]
    stockMovements: StockMovement[]
    alerts: StockAlert[]
  }
}

// ==================== TYPES DE CONFIGURATION ====================

export interface LightspeedConfig {
  accountId: string
  apiKey: string
  apiSecret: string
  refreshToken?: string
  accessToken?: string
  webhookSecret?: string
  baseUrl: string // 'https://api.lightspeedapp.com/API/Account/{accountID}'
}

export interface SyncOptions {
  userId: string
  syncType: 'webhook' | 'manual_sync' | 'cron'
  validateOnly?: boolean // Pour tester sans modifier le stock
  allowNegativeStock?: boolean // Autoriser les stocks négatifs
  skipDuplicateCheck?: boolean // Pour forcer un retraitement
}

// ==================== TYPES D'ERREUR ====================

export interface ProcessingError {
  type: 'validation' | 'database' | 'calculation' | 'external_api'
  message: string
  details?: any
  saleId?: string
  sku?: string
  ingredientId?: string
}

export class LightspeedSyncError extends Error {
  public readonly type: ProcessingError['type']
  public readonly details?: any
  
  constructor(error: ProcessingError) {
    super(error.message)
    this.name = 'LightspeedSyncError'
    this.type = error.type
    this.details = error.details
  }
}

// ==================== TYPES D'HELPER ====================

// Pour normaliser les SaleLines (qui peuvent être un objet ou un tableau)
export type NormalizedSaleLine = LightspeedSaleLine

export interface DeduplicationCheck {
  isDuplicate: boolean
  existingLog?: SyncLog
  message: string
}

// Pour les réponses API
export interface WebhookResponse {
  success: boolean
  message: string
  saleId?: string
  orderNumber?: string
  processedAt: string
  result?: SaleProcessingResult
  error?: string
}
