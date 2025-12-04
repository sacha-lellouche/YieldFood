export interface Order {
  id: string
  user_id: string
  supplier_id: string
  status: 'pending' | 'ordered' | 'received' | 'cancelled'
  order_date: string
  expected_delivery_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit: string
  created_at: string
}

export interface OrderWithDetails extends Order {
  supplier: {
    id: string
    name: string
    phone: string | null
    email: string | null
  }
  items: Array<OrderItem & {
    product: {
      id: string
      name: string
      unit: string
    }
  }>
}
